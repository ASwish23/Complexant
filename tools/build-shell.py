#!/usr/bin/env python3
"""Write the shared shell (head assets, header, search, mobile menu, footer)
into every page.

The site map below is the one place navigation is defined. Each page holds
marked blocks that this script rewrites in place:

    <!-- cx-shell:head -->   ... <!-- /cx-shell:head -->
    <!-- cx-shell:header --> ... <!-- /cx-shell:header -->
    <!-- cx-shell:footer --> ... <!-- /cx-shell:footer -->

On a page that has no markers yet, the old slots are migrated: the font
links in <head>, and the <div data-cx-header> / <div data-cx-footer>
placeholders that cx-port.js used to fill at runtime.

Run from anywhere:  python3 tools/build-shell.py
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent.parent

# file -> page id (used for aria-current)
PAGES = {
    'index.html': 'home',
    'approach.html': 'approach',
    'regulatory-risk.html': 'regulatory-risk',
    'sandbox.html': 'sandbox',
    'implementation.html': 'implementation',
    'monitoring.html': 'monitoring',
    'who-we-serve.html': 'who-we-serve',
    'about.html': 'about',
    'insights.html': 'insights',
    'contact.html': 'contact',
}

SERVICES = [
    {'id': 'regulatory-risk', 'href': 'regulatory-risk.html', 'num': '01', 'name': 'Regulatory Risk',
     'line': 'Find out where the exposure actually is.', 'icon': 'assets/icons/pillar-01-regulatory-risk.svg', 'soon': False},
    {'id': 'sandbox', 'href': 'sandbox.html', 'num': '02', 'name': 'Sandbox',
     'line': 'Prove it before it touches production.', 'icon': 'assets/icons/pillar-02-sandbox.svg', 'soon': True},
    {'id': 'implementation', 'href': 'implementation.html', 'num': '03', 'name': 'Implementation',
     'line': 'Put it in place and make it hold up.', 'icon': 'assets/icons/pillar-03-implementation.svg', 'soon': False},
    {'id': 'monitoring', 'href': 'monitoring.html', 'num': '04', 'name': 'Monitoring',
     'line': 'Watch it over time and plan for change.', 'icon': 'assets/icons/pillar-04-monitoring.svg', 'soon': False},
]

# header nav, in order; 'services' opens the flyout
NAV = [
    {'id': 'approach', 'href': 'approach.html', 'label': 'Approach'},
    {'id': 'services', 'label': 'Services'},
    {'id': 'who-we-serve', 'href': 'who-we-serve.html', 'label': 'Who We Serve'},
    {'id': 'about', 'href': 'about.html', 'label': 'About'},
    {'id': 'insights', 'href': 'insights.html', 'label': 'Insights'},
]

# footer nav: Services points at the journey on the approach page
FOOTER_NAV = [
    {'id': 'approach', 'href': 'approach.html', 'label': 'Approach'},
    {'id': 'services', 'href': 'approach.html#journey', 'label': 'Services'},
    {'id': 'who-we-serve', 'href': 'who-we-serve.html', 'label': 'Who We Serve'},
    {'id': 'about', 'href': 'about.html', 'label': 'About'},
    {'id': 'insights', 'href': 'insights.html', 'label': 'Insights'},
]

# the pages the search panel can find, in order
SEARCH = [
    ('home', 'index.html', 'Home'),
    ('approach', 'approach.html', 'Approach'),
    ('regulatory-risk', 'regulatory-risk.html', 'Regulatory Risk'),
    ('sandbox', 'sandbox.html', 'Sandbox'),
    ('implementation', 'implementation.html', 'Implementation'),
    ('monitoring', 'monitoring.html', 'Monitoring'),
    ('who-we-serve', 'who-we-serve.html', 'Who We Serve'),
    ('about', 'about.html', 'About'),
    ('insights', 'insights.html', 'Insights'),
    ('contact', 'contact.html', 'Let&rsquo;s Talk'),
]

EMAIL = 'info@complexantpartners.com'
MOTTO = 'Complexity &middot; Competency &middot; Clarity'

FONTS = ('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500'
         '&family=Poppins:wght@300;400;500;600&display=swap')

CARET = ('<svg class="nav-caret" viewBox="0 0 12 8" fill="none" aria-hidden="true">'
         '<path d="M1 1.5l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>')
SEARCH_ICON = ('<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">'
               '<circle cx="8.5" cy="8.5" r="6" stroke="currentColor" stroke-width="1.6"/>'
               '<path d="M13 13l4.5 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>')


def cur(item_id, page):
    return ' aria-current="page"' if item_id == page else ''


def brand(tag='a', signal=True):
    # the footer uses the wordmark on its own, without the signal
    mark = '<img src="assets/signal.png" alt="" width="38" height="38" />' if signal else ''
    inner = (mark +
             '<span class="brand-type">'
             '<span class="brand-name">COMPLE<span class="copper-metal">X</span>ANT</span>'
             '<span class="brand-sub">PARTNERS</span>'
             '<span class="brand-llc">LLC</span>'
             '</span>')
    if tag == 'a':
        return f'<a href="index.html" class="brand" aria-label="Complexant Partners LLC, home">{inner}</a>'
    return f'<div class="brand">{inner}</div>'


def head_block():
    return '\n'.join([
        '<!-- cx-shell:head -->',
        '<link rel="preconnect" href="https://fonts.googleapis.com" />',
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
        f'<link href="{FONTS}" rel="stylesheet" />',
        '<link rel="stylesheet" href="assets/css/cx-shell.css" />',
        '<script src="assets/js/cx-shell.js" defer></script>',
        '<!-- /cx-shell:head -->',
    ])


def header_block(page):
    is_service = any(s['id'] == page for s in SERVICES)
    nav = []
    for item in NAV:
        if item['id'] == 'services':
            items = []
            for s in SERVICES:
                soon = '<em class="soon-tag">Coming soon</em>' if s['soon'] else ''
                items.append(
                    f'        <a href="{s["href"]}"{cur(s["id"], page)}>\n'
                    f'          <span class="svc-num">{s["num"]}</span>\n'
                    f'          <img src="{s["icon"]}" alt="" width="40" height="20" />\n'
                    f'          <span><strong>{s["name"]}</strong><small>{s["line"]}</small></span>{soon}\n'
                    f'        </a>')
            current = ' is-current' if is_service else ''
            nav.append(
                '    <div class="nav-services">\n'
                f'      <button type="button" class="nav-link{current}" aria-expanded="false" aria-controls="services-menu">\n'
                f'        Services\n        {CARET}\n'
                '      </button>\n'
                '      <div class="services-menu" id="services-menu">\n'
                + '\n'.join(items) + '\n'
                '      </div>\n'
                '    </div>')
        else:
            nav.append(f'    <a class="nav-link" href="{item["href"]}"{cur(item["id"], page)}>{item["label"]}</a>')

    search_links = '\n'.join(
        f'      <a href="{href}"{cur(pid, page)}>{label}</a>' for pid, href, label in SEARCH)

    overlay_links = []
    for item in NAV:
        if item['id'] == 'services':
            subs = []
            for s in SERVICES:
                soon = '<em class="soon-tag">Coming soon</em>' if s['soon'] else ''
                subs.append(
                    f'        <a href="{s["href"]}"{cur(s["id"], page)}><span class="svc-num">{s["num"]}</span>'
                    f'<img src="{s["icon"]}" alt="" width="34" height="17" />{s["name"]}{soon}</a>')
            overlay_links.append(
                '      <p class="overlay-label">Services</p>\n'
                '      <div class="overlay-sub">\n' + '\n'.join(subs) + '\n      </div>')
        else:
            overlay_links.append(f'      <a href="{item["href"]}"{cur(item["id"], page)}>{item["label"]}</a>')

    return f'''<!-- cx-shell:header -->
<header class="site-header">
  {brand()}

  <nav class="header-nav" aria-label="Primary">
{chr(10).join(nav)}
  </nav>

  <div class="header-actions">
    <button class="icon-btn" id="search-btn" type="button" aria-expanded="false" aria-controls="search-panel" aria-label="Search the site">
      {SEARCH_ICON}
    </button>
    <a class="btn" href="contact.html"{cur('contact', page)}>
      <span class="btn-bg"></span>
      <span>Let&rsquo;s Talk</span>
    </a>
    <button class="menu-btn" id="menu-btn" type="button" aria-expanded="false" aria-controls="overlay" aria-label="Open menu">
      <span class="menu-glyph" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="menu-label">Menu</span>
    </button>
  </div>
</header>

<div class="search-panel" id="search-panel" role="search">
  <label class="search-field">
    {SEARCH_ICON}
    <span class="cx-sr-only">Search pages</span>
    <input type="search" placeholder="Search pages" autocomplete="off" />
  </label>
  <p class="cx-sr-only" role="status" aria-live="polite"></p>
  <nav class="search-results" aria-label="Pages">
{search_links}
  </nav>
  <p class="search-empty" hidden>No page matches that. <a href="contact.html">Ask a principal directly &rarr;</a></p>
</div>

<div class="overlay" id="overlay" role="dialog" aria-modal="true" aria-label="Site menu">
  <div class="overlay-grid">
    <nav class="overlay-nav" aria-label="Mobile">
{chr(10).join(overlay_links)}
      <div class="overlay-cta">
        <a class="btn btn-copper" href="contact.html"{cur('contact', page)}>
          <span class="btn-bg"></span>
          <span>Let&rsquo;s Talk</span>
        </a>
      </div>
    </nav>
    <div class="overlay-meta">
      <p class="overlay-motto">{MOTTO}</p>
      <a class="overlay-mail" href="mailto:{EMAIL}">{EMAIL}</a>
    </div>
  </div>
</div>
<!-- /cx-shell:header -->'''


def footer_block(page):
    links = '\n'.join(
        f'        <a href="{n["href"]}"{cur(n["id"], page) if "#" not in n["href"] else ""}>{n["label"]}</a>'
        for n in FOOTER_NAV)
    return f'''<!-- cx-shell:footer -->
<section class="footer-cta" id="start" aria-labelledby="start-title">
  <div class="panel-surface start-panel reveal">
    <div class="start-copy">
      <h2 id="start-title">Not sure where to start?</h2>
      <p>Most conversations begin with one question: where is our exposure? We can help you answer it.</p>
    </div>
    <div class="start-actions">
      <a class="btn btn-copper" href="contact.html">
        <span class="btn-bg"></span>
        <span>Start the conversation</span>
      </a>
      <a class="btn" href="contact.html?topic=assessment">
        <span class="btn-bg"></span>
        <span>Request an assessment</span>
      </a>
    </div>
  </div>
</section>

<footer class="site-footer">
  <div class="footer-grid">
    <div class="footer-brand">
      {brand(signal=False)}
      <p class="footer-motto">{MOTTO}</p>
      <p><a class="footer-mail" href="mailto:{EMAIL}">{EMAIL}</a></p>
    </div>

    <nav class="footer-links" aria-label="Footer">
{links}
    </nav>

    <div class="footer-location">
      <p>Based in Massachusetts<br />Working with clients worldwide<br />On site when the work calls for it</p>
    </div>
  </div>

  <div class="footer-bottom">
    <span>&copy; 2026 Complexant Partners LLC</span>
    <span>Safely adapting innovation</span>
  </div>
</footer>
<!-- /cx-shell:footer -->'''


def replace_block(html, name, block):
    pattern = re.compile(r'<!-- cx-shell:%s -->.*?<!-- /cx-shell:%s -->' % (name, name), re.S)
    if pattern.search(html):
        return pattern.sub(lambda _: block, html, count=1), True
    return html, False


def migrate_head(html, block):
    """First run: drop the old preconnect + font links and put the block where they were."""
    old = re.compile(
        r'[ \t]*<link rel="preconnect" href="https://fonts\.googleapis\.com"[^>]*>\s*'
        r'<link rel="preconnect" href="https://fonts\.gstatic\.com"[^>]*>\s*'
        r'<link href="https://fonts\.googleapis\.com/css2[^"]*" rel="stylesheet"\s*/?>\n?')
    if old.search(html):
        return old.sub(lambda _: block + '\n', html, count=1), True
    return html, False


def build(path, page):
    html = path.read_text(encoding='utf-8')

    html, ok = replace_block(html, 'head', head_block())
    if not ok:
        html, ok = migrate_head(html, head_block())
    if not ok:
        sys.exit(f'{path.name}: no cx-shell:head markers and no font links to migrate')

    html, ok = replace_block(html, 'header', header_block(page))
    if not ok:
        if '<div data-cx-header></div>' not in html:
            sys.exit(f'{path.name}: no cx-shell:header markers and no data-cx-header slot')
        html = html.replace('<div data-cx-header></div>', header_block(page), 1)

    html, ok = replace_block(html, 'footer', footer_block(page))
    if not ok:
        if '<div data-cx-footer></div>' not in html:
            sys.exit(f'{path.name}: no cx-shell:footer markers and no data-cx-footer slot')
        html = html.replace('<div data-cx-footer></div>', footer_block(page), 1)

    path.write_text(html, encoding='utf-8')
    print(f'shell  {path.name}')


if __name__ == '__main__':
    for name, page_id in PAGES.items():
        build(ROOT / name, page_id)

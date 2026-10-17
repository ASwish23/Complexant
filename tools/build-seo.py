#!/usr/bin/env python3
"""Write the SEO head (title, description, canonical, Open Graph, Twitter
card, organisation JSON-LD) into every page, and regenerate sitemap.xml
and robots.txt from the same page list.

Each page holds a marked block that this script rewrites in place:

    <!-- cx-seo --> ... <!-- /cx-seo -->

On a page that has no markers yet, the loose <title>, description,
canonical, og:* and twitter:* tags are removed and the block is placed
right after the viewport meta. Page-specific JSON-LD (the FAQ data on the
service pages) sits outside the block and is left alone.

Run from anywhere:  python3 tools/build-seo.py
"""
from html import escape
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://complexantpartners.com'
IMAGE = SITE + '/assets/signal.png'

# file -> (title, meta description, social description)
PAGES = {
    'index.html': (
        'Quality & Regulatory Compliance Consultancy | Complexant Partners',
        'Complexant Partners guides regulated life sciences companies in closing gaps, turning complexity into competency and competency into clarity.',
        'Complexant Partners guides regulated life sciences companies in closing gaps, turning complexity into competency and competency into clarity.',
    ),
    'approach.html': (
        'Our Approach | Complexant Partners LLC',
        'How Complexant Partners works: four pillars in sequence, from finding regulatory exposure to keeping systems qualified. You decide and you fly; we guide, advise, verify, and equip.',
        'Four pillars in sequence, from finding regulatory exposure to keeping systems qualified.',
    ),
    'regulatory-risk.html': (
        'Regulatory Risk | Complexant Partners LLC',
        'Regulatory Risk: Find where innovation creates regulatory exposure across your quality system, compliance and regulatory intelligence, ranked so effort goes where an inspector would look first.',
        'Find where the exposure actually is. Find where innovation creates regulatory exposure across your quality system, compliance and regulatory intelligence, ranked so effort goes where an inspector would look first.',
    ),
    'sandbox.html': (
        'Sandbox | Complexant Partners LLC',
        'Sandbox: A contained environment that emulates your real system, so tools and models are tested against regulatory expectations with no path back into live systems.',
        'Prove it before it touches production. A contained environment that emulates your real system, so tools and models are tested against regulatory expectations with no path back into live systems.',
    ),
    'implementation.html': (
        'Implementation | Complexant Partners LLC',
        'Implementation: Governance frameworks, validation strategy, documentation, and the evidence trail that survives an inspection.',
        'Put it in place and make it hold up. Governance frameworks, validation strategy, documentation, and the evidence trail that survives an inspection.',
    ),
    'monitoring.html': (
        'Monitoring | Complexant Partners LLC',
        'Monitoring: Ongoing performance and drift monitoring, periodic review, and change planning so the system stays qualified as it evolves.',
        'Watch it over time and plan for change. Ongoing performance and drift monitoring, periodic review, and change planning so the system stays qualified as it evolves.',
    ),
    'who-we-serve.html': (
        'Who We Serve | Complexant Partners LLC',
        'Complexant Partners works with quality, regulatory, IT and validation leaders in pharmaceuticals, biologics, cell and gene therapy, medical devices and IVD, at any stage of maturity.',
        'For quality, regulatory, IT and validation leaders in regulated life sciences, at any stage of maturity.',
    ),
    'about.html': (
        'About | Complexant Partners LLC',
        'Complexant Partners is a boutique practice founded by Alexandra (Lexie) Pieper and Anthony Davis, with roughly sixty years of combined experience in quality, regulatory and validation roles.',
        'Two principals, roughly sixty years of combined experience, and both on every engagement.',
    ),
    'insights.html': (
        'Insights | Complexant Partners LLC',
        'Practical writing on adopting innovation in regulated life sciences: AI governance, validation, data integrity, inspection readiness and regulatory intelligence.',
        'Practical writing on adopting innovation in regulated life sciences operations.',
    ),
    'contact.html': (
        'Contact | Complexant Partners LLC',
        'Contact Complexant Partners. Tell us what you are trying to prove, and one of the two principals will reply.',
        'Tell us what you are trying to prove, and one of the two principals will reply.',
    ),
}

ORG = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'Complexant Partners',
    'legalName': 'Complexant Partners LLC',
    'url': SITE + '/',
    'logo': IMAGE,
    'email': 'info@complexantpartners.com',
    'slogan': 'Safely adapting innovation',
    'description': PAGES['index.html'][1],
}


def url_for(name):
    return SITE + '/' if name == 'index.html' else f'{SITE}/{name}'


def seo_block(name):
    title, desc, social = (escape(v, quote=True) for v in PAGES[name])
    url = url_for(name)
    org = json.dumps(ORG, indent=2, ensure_ascii=False)
    return '\n'.join([
        '<!-- cx-seo -->',
        f'<title>{title}</title>',
        f'<meta name="description" content="{desc}" />',
        f'<link rel="canonical" href="{url}" />',
        '<meta property="og:type" content="website" />',
        '<meta property="og:site_name" content="Complexant Partners" />',
        f'<meta property="og:title" content="{title}" />',
        f'<meta property="og:description" content="{social}" />',
        f'<meta property="og:url" content="{url}" />',
        f'<meta property="og:image" content="{IMAGE}" />',
        '<meta name="twitter:card" content="summary" />',
        f'<meta name="twitter:title" content="{title}" />',
        f'<meta name="twitter:description" content="{social}" />',
        f'<meta name="twitter:image" content="{IMAGE}" />',
        '<script type="application/ld+json">',
        org,
        '</script>',
        '<!-- /cx-seo -->',
    ])


LOOSE = re.compile(
    r'[ \t]*(?:<title>.*?</title>'
    r'|<meta name="description"[^>]*>'
    r'|<meta (?:property|name)="(?:og|twitter):[^"]*"[^>]*>'
    r'|<link rel="canonical"[^>]*>)[ \t]*\n?', re.S)
VIEWPORT = re.compile(r'(<meta name="viewport"[^>]*>\n)')


def build(name):
    path = ROOT / name
    html = path.read_text(encoding='utf-8')
    block = seo_block(name)
    marked = re.compile(r'<!-- cx-seo -->.*?<!-- /cx-seo -->', re.S)
    if marked.search(html):
        html = marked.sub(lambda _: block, html, count=1)
    else:
        html = LOOSE.sub('', html)
        if not VIEWPORT.search(html):
            sys.exit(f'{name}: no viewport meta to anchor the SEO block')
        html = VIEWPORT.sub(lambda m: m.group(1) + block + '\n', html, count=1)
    path.write_text(html, encoding='utf-8')
    print(f'seo    {name}')


def write_site_files():
    urls = '\n'.join(f'  <url><loc>{url_for(n)}</loc></url>' for n in PAGES)
    (ROOT / 'sitemap.xml').write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f'{urls}\n'
        '</urlset>\n', encoding='utf-8')
    (ROOT / 'robots.txt').write_text(
        'User-agent: *\n'
        'Allow: /\n'
        '\n'
        f'Sitemap: {SITE}/sitemap.xml\n', encoding='utf-8')
    print('wrote  sitemap.xml, robots.txt')


if __name__ == '__main__':
    for page in PAGES:
        build(page)
    write_site_files()

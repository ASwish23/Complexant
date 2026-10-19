#!/usr/bin/env python3
"""Export the site as a folder of self-contained pages for client review:
dist/Complexant-preview/ and dist/Complexant-preview.zip.

Every page is written with its local stylesheets and scripts inlined and its
local images turned into data URIs, so the pages open straight from disk with
no server. The home page's particle sprites are embedded as window.CX_SPRITES
(its loader reads them from there before falling back to the "Bar icon files"
folder, which a browser won't let a file:// page read). Links between pages
stay relative, so navigation works inside the unzipped folder. CDN scripts and
Google Fonts stay as links and need an internet connection.

Run from anywhere:  python3 tools/build-standalone.py
"""
from base64 import b64encode
from pathlib import Path
from urllib.parse import unquote
import json
import mimetypes
import re
import shutil

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'
NAME = 'Complexant-preview'
OUT = DIST / NAME
SPRITES = ROOT / 'Bar icon files'
PAGES = ['index', 'approach', 'regulatory-risk', 'sandbox', 'implementation',
         'monitoring', 'who-we-serve', 'about', 'insights', 'contact']
# the home page's particle script; the sprites go just ahead of it
SPRITE_MARKER = '/* ============================================================\n  Continuous particle background.'
README = """Complexant Partners - website preview

1. Unzip this folder.
2. Open index.html in Chrome, Safari or Edge.
3. Use the menu to move between pages, as on the live site.

Notes
- The fonts load from Google Fonts, so keep an internet connection on.
- The contact form opens your email app with the message filled in.
- Photos and some texts are placeholders until the final content arrives.
"""


def data_uri(path):
    mime = mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
    if path.suffix == '.svg':
        mime = 'image/svg+xml'
    return f'data:{mime};base64,{b64encode(path.read_bytes()).decode()}'


def inline_css(path):
    css = path.read_text(encoding='utf-8')

    def repl(m):
        ref = m.group(2)
        if ref.startswith(('data:', 'http:', 'https:', '#')):
            return m.group(0)
        target = (path.parent / unquote(ref)).resolve()
        return f'url("{data_uri(target)}")' if target.is_file() else m.group(0)

    return re.sub(r'url\((["\']?)([^)"\']+)\1\)', repl, css)


def build_page(name, sprites):
    html = (ROOT / f'{name}.html').read_text(encoding='utf-8')

    # stylesheets
    html = re.sub(
        r'<link rel="stylesheet" href="(assets/[^"]+)"\s*/?>',
        lambda m: f'<style>\n{inline_css(ROOT / m.group(1))}\n</style>', html)

    # scripts: deferred files run once the document is parsed, as they would
    def script(m):
        code = (ROOT / m.group(1)).read_text(encoding='utf-8')
        if 'defer' in m.group(0):
            return f"<script>\ndocument.addEventListener('DOMContentLoaded', function () {{\n{code}\n}});\n</script>"
        return f'<script>\n{code}\n</script>'
    html = re.sub(r'<script src="(assets/[^"]+)"[^>]*></script>', script, html)

    # images and the favicon
    html = re.sub(
        r'(src|href)="(assets/[^"]+\.(?:png|svg|jpg|jpeg|webp))"',
        lambda m: f'{m.group(1)}="{data_uri(ROOT / unquote(m.group(2)))}"', html)

    # the particle sprites, only on the page that draws them
    if SPRITE_MARKER in html:
        html = html.replace(
            SPRITE_MARKER,
            'window.CX_SPRITES = ' + json.dumps(sprites) + ';\n\n' + SPRITE_MARKER, 1)
    elif name == 'index':
        raise SystemExit('index.html: particle script not found, sprites not embedded')

    # anything local still unresolved would break once the page leaves the project
    left = re.findall(r'(?:src|href)="(assets/[^"]+)"', html)
    if left:
        raise SystemExit(f'{name}.html: not inlined: {sorted(set(left))}')
    return html


def main():
    sprites = {p.stem: data_uri(p) for p in sorted(SPRITES.glob('*.png'))}
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    for name in PAGES:
        page = OUT / f'{name}.html'
        page.write_text(build_page(name, sprites), encoding='utf-8')
        print(f'wrote  {page.relative_to(ROOT)} ({page.stat().st_size // 1024} KB)')
    (OUT / 'README.txt').write_text(README, encoding='utf-8')

    # the zip holds the folder itself, so unzipping gives Complexant-preview/
    archive = shutil.make_archive(str(DIST / NAME), 'zip', root_dir=DIST, base_dir=NAME)
    print(f'zipped {Path(archive).relative_to(ROOT)} ({Path(archive).stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main()

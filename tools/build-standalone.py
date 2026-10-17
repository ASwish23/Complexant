#!/usr/bin/env python3
"""Export the home page as one self-contained file for review:
dist/complexant-home.html.

Local stylesheets and scripts are inlined, local images become data URIs,
and the particle field's bar sprites are embedded as window.CX_SPRITES
(the home page's loader reads them from there before falling back to the
"Bar icon files" folder). CDN scripts and Google Fonts stay as links, and
links to the other pages stay relative.

Run from anywhere:  python3 tools/build-standalone.py
"""
from base64 import b64encode
from pathlib import Path
from urllib.parse import unquote
import json
import mimetypes
import re

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'dist' / 'complexant-home.html'
SPRITES = ROOT / 'Bar icon files'


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


def main():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')

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
        lambda m: f'{m.group(1)}="{data_uri(ROOT / m.group(2))}"', html)

    # the particle sprites, ahead of the inline script that loads them
    sprites = {p.stem: data_uri(p) for p in sorted(SPRITES.glob('*.png'))}
    marker = '/* ============================================================\n  Continuous particle background.'
    if marker not in html:
        raise SystemExit('index.html: particle script not found, sprites not embedded')
    html = html.replace(
        marker,
        'window.CX_SPRITES = ' + json.dumps(sprites) + ';\n\n' + marker, 1)

    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(html, encoding='utf-8')
    print(f'wrote  {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main()

import re
import base64
import urllib.request
from pathlib import Path
import sys

def make_offline(html_path):
    p = Path(html_path)
    if not p.exists():
        print(f"File {html_path} not found.")
        return
        
    html = p.read_text(encoding='utf-8')

    katex_version = "0.16.11"
    
    print("Downloading KaTeX files...")
    # Download css
    css_url = f"https://cdn.jsdelivr.net/npm/katex@{katex_version}/dist/katex.min.css"
    req = urllib.request.Request(css_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        css = response.read().decode('utf-8')
    
    # Download js
    js_url = f"https://cdn.jsdelivr.net/npm/katex@{katex_version}/dist/katex.min.js"
    req = urllib.request.Request(js_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        js = response.read().decode('utf-8')
        
    # Download auto-render js
    auto_js_url = f"https://cdn.jsdelivr.net/npm/katex@{katex_version}/dist/contrib/auto-render.min.js"
    req = urllib.request.Request(auto_js_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        auto_js = response.read().decode('utf-8')

    # Find all url(fonts/...) in css
    font_urls = re.findall(r'url\((fonts/[^)]+)\)', css)
    font_urls = set(font_urls)
    
    for rel_font_path in font_urls:
        font_url = f"https://cdn.jsdelivr.net/npm/katex@{katex_version}/dist/{rel_font_path}"
        req = urllib.request.Request(font_url, headers={'User-Agent': 'Mozilla/5.0'})
        try:
            with urllib.request.urlopen(req) as response:
                font_data = response.read()
                b64 = base64.b64encode(font_data).decode('ascii')
                mime = "font/woff2" if rel_font_path.endswith(".woff2") else "font/woff" if rel_font_path.endswith(".woff") else "font/ttf"
                data_uri = f"data:{mime};base64,{b64}"
                css = css.replace(rel_font_path, data_uri)
        except Exception as e:
            print(f"Failed to download {font_url}: {e}")

    # Remove CDN links using lambda to avoid escape sequence evaluation
    html = re.sub(r'<link rel="stylesheet"[^>]+katex[^>]*>', lambda m: f'<style>{css}</style>', html)
    html = re.sub(r'<script defer src="[^"]*katex\.min\.js"></script>', lambda m: f'<script>{js}</script>', html)
    html = re.sub(r'<script defer src="[^"]*auto-render\.min\.js"></script>', lambda m: f'<script>{auto_js}</script>', html)

    # Output offline version
    out_path = p.with_name(p.stem + "_offline.html")
    out_path.write_text(html, encoding='utf-8')
    print(f"Offline HTML written to {out_path}")

if __name__ == '__main__':
    make_offline(sys.argv[1])

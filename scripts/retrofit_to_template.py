#!/usr/bin/env python3
"""Retrofit a non-template HTML deck into the canonical paper-presentation template.

Extracts slide content (titles, messages, bullets, images, tables) from any
self-built HTML deck and produces a slideData JSON that can be rendered through
the canonical template via render_slideshow_artifact.py.

Usage:
    python scripts/retrofit_to_template.py <input.html> --output <output_dir>

This produces:
    <output_dir>/retrofit_slides.json  — extracted slideData
    <output_dir>/retrofitted.html      — re-rendered through canonical template
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]


def extract_slides_array(html: str) -> list:
    """Extract the slides array from the HTML script block."""
    # Match: const slides = [...]; followed by another declaration or function
    patterns = [
        r'const\s+slides\s*=\s*(\[[\s\S]*?\]);\s*(?:let|const|var|function|//)',
        r'const\s+slides\s*=\s*JSON\.parse\(String\.raw`([\s\S]*?)`\)',
        r'const\s+S\s*=\s*(\[[\s\S]*?\]);',
    ]
    for pat in patterns:
        match = re.search(pat, html)
        if match:
            raw = match.group(1)
            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                continue
    raise ValueError("Could not find or parse slides array in the HTML")


def html_to_text(html_str: str) -> str:
    """Strip HTML tags and decode entities."""
    text = re.sub(r'<br\s*/?>', '\n', html_str)
    text = re.sub(r'<[^>]+>', '', text)
    text = text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    text = text.replace('&quot;', '"').replace('&#39;', "'")
    return text.strip()


def extract_structured_slide(raw_html: str, index: int) -> dict:
    """Convert a raw HTML slide string to structured slide data."""
    slide: dict = {"id": f"s{index + 1:02d}"}

    # Extract title
    title_m = re.search(r'class="[^"]*slide-title[^"]*"[^>]*>(.*?)</h[12]', raw_html, re.DOTALL)
    if title_m:
        slide["title"] = html_to_text(title_m.group(1))

    # Hero text (cover slides)
    if not slide.get("title"):
        hero_m = re.search(r'class="[^"]*hero-text[^"]*"[^>]*>(.*?)</h[12]', raw_html, re.DOTALL)
        if hero_m:
            slide["title"] = html_to_text(hero_m.group(1))

    # Extract kicker/label
    kicker_m = re.search(r'class="[^"]*(?:slide-kicker|label)[^"]*"[^>]*>(.*?)</(?:div|span)', raw_html, re.DOTALL)

    # Extract message/body
    msg_m = re.search(r'class="[^"]*(?:slide-message|body-text)[^"]*"[^>]*>(.*?)</p', raw_html, re.DOTALL)
    if msg_m:
        slide["keyMessage"] = html_to_text(msg_m.group(1))

    # Extract subtitle
    sub_m = re.search(r'class="[^"]*(?:slide-subtitle|cover-subtitle)[^"]*"[^>]*>(.*?)</p', raw_html, re.DOTALL)
    if sub_m:
        slide["subtitle"] = html_to_text(sub_m.group(1))

    # Extract bullets
    bullets = re.findall(r'<li[^>]*>(.*?)</li', raw_html, re.DOTALL)
    if bullets:
        slide["bullets"] = [html_to_text(b) for b in bullets if html_to_text(b)]

    # Extract images (data URIs)
    imgs = re.findall(r'<img[^>]*src="(data:image/[^"]+)"[^>]*/?>',  raw_html)

    # Extract tables
    tables = re.findall(r'(<table[\s\S]*?</table>)', raw_html)

    # Determine layout
    has_cover = 'cover-grid' in raw_html or 'cover-copy' in raw_html
    has_split = 'split-grid' in raw_html
    is_takeaway = 'takeaway' in (slide.get("title", "")).lower()

    if has_cover and index == 0:
        slide["layout"] = "cover"
        if imgs:
            slide["visual"] = {"src": imgs[0], "alt": slide.get("title", "Cover")}
    elif is_takeaway:
        slide["layout"] = "takeaway"
    elif (has_split or imgs) and imgs:
        slide["layout"] = "split"
        slide["visual"] = {"src": imgs[0], "alt": slide.get("title", "")}
    elif tables:
        slide["layout"] = "result-table"
        # Store table as evidence note (the template will render it)
        slide["evidenceNote"] = tables[0]
    else:
        # Default to stack for text-only slides
        slide["layout"] = "split" if imgs else "stack"

    # Handle multiple images — additional images go to appendix-worthy slides
    if len(imgs) > 1 and slide["layout"] != "cover":
        slide["visual"] = {"src": imgs[0], "alt": slide.get("title", "")}

    return slide


def retrofit(input_html: str) -> list[dict]:
    """Convert a non-template HTML deck to structured slideData."""
    raw_slides = extract_slides_array(input_html)

    converted = []
    for i, s in enumerate(raw_slides):
        if isinstance(s, str):
            # Pre-rendered HTML string → extract structure
            slide = extract_structured_slide(s, i)
        elif isinstance(s, dict):
            # Already structured — just pass through with normalization
            slide = s
            if "id" not in slide:
                slide["id"] = f"s{i + 1:02d}"
        else:
            continue
        converted.append(slide)

    return converted


def main() -> None:
    parser = argparse.ArgumentParser(description="Retrofit a non-template HTML deck to canonical template")
    parser.add_argument("input", type=Path, help="Path to the non-template HTML deck")
    parser.add_argument("--output", type=Path, required=True, help="Output HTML file path")
    parser.add_argument("--theme", default="midnight-dark", help="Theme preset (default: midnight-dark)")
    parser.add_argument("--venue", default="iclr", help="Venue preset (default: iclr)")
    parser.add_argument("--title", help="Override deck title")
    args = parser.parse_args()

    input_html = args.input.read_text(encoding="utf-8")
    slides = retrofit(input_html)
    print(f"Extracted {len(slides)} slides", file=sys.stderr)

    for i, s in enumerate(slides):
        title = s.get("title", "?")[:50]
        layout = s.get("layout", "?")
        has_vis = "📷" if s.get("visual") else ""
        print(f"  s{i+1:02d} [{layout}] {title} {has_vis}", file=sys.stderr)

    # Detect title from original HTML
    title_m = re.search(r'<title>(.*?)</title>', input_html)
    deck_title = args.title or (title_m.group(1) if title_m else "Retrofitted Deck")

    # Save intermediate JSON
    json_path = args.output.with_suffix(".json")
    payload = {
        "slideData": slides,
        "meta": {
            "title": deck_title,
            "themePreset": args.theme,
            "venuePreset": args.venue,
        }
    }
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved slideData to {json_path}", file=sys.stderr)

    # Render through canonical template
    sys.path.insert(0, str(REPO_ROOT / "scripts"))
    from render_slideshow_artifact import render_html

    rendered = render_html(slides, theme=args.theme, venue=args.venue, title=deck_title)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(rendered, encoding="utf-8")
    print(f"Retrofitted HTML written to {args.output}", file=sys.stderr)
    print(str(args.output))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""audit_design_comfort.py — Comfort audit for research slide decks.

Reads a rendered HTML slide deck and evaluates it against the five-dimension
comfort rubric defined in references/reading-comfort-rubric.md.

Dimensions:
  1. Hierarchy clarity
  2. Rhythm
  3. Occupancy
  4. Stability
  5. Restraint

Usage:
    python3 scripts/audit_design_comfort.py <html_file>
"""

import re
import sys
from pathlib import Path
from typing import NamedTuple


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

class Finding(NamedTuple):
    slide: str          # e.g. "slide-04"
    severity: str       # P1, P2, P3
    dimension: str      # hierarchy, rhythm, occupancy, stability, restraint
    anti_pattern: str   # anti-pattern name or empty
    message: str


# ---------------------------------------------------------------------------
# HTML Parsing helpers
# ---------------------------------------------------------------------------

def _load_html(path: str) -> str:
    return Path(path).read_text(encoding="utf-8")


def _extract_style_block(html: str) -> str:
    """Return concatenated contents of all <style> blocks."""
    return "\n".join(re.findall(r"<style[^>]*>(.*?)</style>", html, re.DOTALL))


def _extract_script_block(html: str) -> str:
    """Return concatenated contents of all <script> blocks."""
    return "\n".join(re.findall(r"<script[^>]*>(.*?)</script>", html, re.DOTALL))


def _extract_slides(html: str) -> list[dict]:
    """Extract slide sections. Returns list of {index, html, classes}."""
    slides = []
    # Match <section class="slide ..."> blocks
    pattern = re.compile(
        r'<section[^>]*class="([^"]*slide[^"]*)"[^>]*>(.*?)</section>',
        re.DOTALL
    )
    for i, m in enumerate(pattern.finditer(html)):
        slides.append({
            "index": i + 1,
            "id": f"slide-{i + 1:02d}",
            "classes": m.group(1),
            "html": m.group(2),
        })
    return slides


def _extract_slide_data(html: str) -> list[dict]:
    """Extract the serialized `slides` array from rendered HTML when available."""
    match = re.search(r"const\s+slides\s*=\s*(\[[\s\S]*?\]);", html)
    if not match:
        return []
    try:
        import json

        data = json.loads(match.group(1))
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _count_pattern(text: str, pattern: str, flags: int = 0) -> int:
    return len(re.findall(pattern, text, flags))


# ---------------------------------------------------------------------------
# Check: Anti-pattern detection
# ---------------------------------------------------------------------------

def check_anti_patterns(slides: list[dict], css: str) -> list[Finding]:
    findings = []

    # --- Cards on cards ---
    for s in slides:
        card_count = _count_pattern(s["html"], r'class="[^"]*card[^"]*"')
        if card_count > 2:
            findings.append(Finding(
                s["id"], "P1", "hierarchy", "cards-on-cards",
                f"{card_count} card-like containers on single slide"
            ))

    # --- Mood roulette ---
    bg_values = set()
    for s in slides:
        # Extract inline background or background-color
        inline_bgs = re.findall(
            r'background(?:-color)?\s*:\s*([^;"]+)',
            s["html"], re.IGNORECASE
        )
        for bg in inline_bgs:
            bg = bg.strip().lower()
            # Skip semantic backgrounds
            if any(tok in bg for tok in ["var(--positive", "var(--negative", "var(--accent"]):
                continue
            if bg not in ("transparent", "none", "inherit", "initial"):
                bg_values.add(bg)

    if len(bg_values) > 3:
        findings.append(Finding(
            "deck", "P1", "restraint", "mood-roulette",
            f"{len(bg_values)} distinct background values across slides (max 3)"
        ))

    # --- Over-accenting ---
    for s in slides:
        accent_hits = _count_pattern(
            s["html"],
            r'(border[^:]*:\s*[^;]*var\(--accent|'
            r'box-shadow[^:]*:\s*[^;]*var\(--accent|'
            r'background[^:]*:\s*[^;]*linear-gradient)',
            re.IGNORECASE
        )
        if accent_hits > 3:
            findings.append(Finding(
                s["id"], "P2", "restraint", "over-accenting",
                f"{accent_hits} accent decorations on single slide (max 3)"
            ))

    # --- Equation wall ---
    for s in slides:
        eq_blocks = _count_pattern(s["html"], r'class="[^"]*equation[^"]*"', re.IGNORECASE)
        eq_blocks += _count_pattern(s["html"], r'class="[^"]*katex[^"]*"', re.IGNORECASE)
        if eq_blocks >= 2:
            # Check if there's explanation text between equations
            text_between = _count_pattern(s["html"], r'<p[^>]*>[^<]{20,}</p>')
            if text_between < eq_blocks - 1:
                findings.append(Finding(
                    s["id"], "P1", "hierarchy", "equation-wall",
                    f"{eq_blocks} equation blocks without interleaved explanation"
                ))

    # --- App-shell ---
    for s in slides:
        sidebar = _count_pattern(s["html"], r'class="[^"]*sidebar[^"]*"', re.IGNORECASE)
        tabs = _count_pattern(s["html"], r'class="[^"]*tab[^"]*"', re.IGNORECASE)
        nav = _count_pattern(s["html"], r'class="[^"]*nav[^"]*"', re.IGNORECASE)
        if sidebar + tabs + nav > 3:
            findings.append(Finding(
                s["id"], "P1", "hierarchy", "app-shell",
                f"app-like chrome detected (sidebar={sidebar}, tabs={tabs}, nav={nav})"
            ))

    return findings


# ---------------------------------------------------------------------------
# Check: Stability (viewport-unit leaks)
# ---------------------------------------------------------------------------

def check_stability(css: str, js: str) -> list[Finding]:
    findings = []

    # --- Viewport-unit typography in content ---
    # Find vh/vw in font-size declarations (excluding comments)
    vh_leaks = re.findall(
        r'(font-size\s*:\s*[^;]*\d+\.?\d*v[hw][^;]*)',
        css, re.IGNORECASE
    )
    # Filter out clamp() middle values which are acceptable
    for leak in vh_leaks:
        if "clamp(" in leak.lower():
            continue
        findings.append(Finding(
            "deck", "P1", "stability", "responsive-slide-thinking",
            f"viewport-unit typography detected: {leak.strip()[:60]}"
        ))

    # Check for vh/vw in padding/gap/margin within a single CSS declaration
    # Stop at ; or } to avoid spanning across rules
    layout_leaks = re.findall(
        r'((?:padding|gap|margin)[^:]*:\s*[^;}\n]*\d+\.?\d*v[hw][^;}\n]*)',
        css, re.IGNORECASE
    )
    for leak in layout_leaks:
        # Verify the match actually contains a vh/vw value (not a false positive)
        if not re.search(r'\d+\.?\d*v[hw]', leak, re.IGNORECASE):
            continue
        # Skip body-level positioning which is acceptable
        if "body" in leak.lower() or "controls" in leak.lower():
            continue
        findings.append(Finding(
            "deck", "P2", "stability", "responsive-slide-thinking",
            f"viewport-unit layout detected: {leak.strip()[:60]}"
        ))

    # --- transform:none in scaleDeck ---
    if "transform" in js and "none" in js:
        # More precise check
        scale_fn = re.search(r'function\s+scaleDeck\s*\([^)]*\)\s*\{(.*?)\}', js, re.DOTALL)
        if scale_fn:
            body = scale_fn.group(1)
            if "none" in body:
                findings.append(Finding(
                    "deck", "P1", "stability", "responsive-slide-thinking",
                    "scaleDeck() uses transform:none — violates stage model"
                ))

    return findings


# ---------------------------------------------------------------------------
# Check: Hierarchy (font-size ratios, figure prominence)
# ---------------------------------------------------------------------------

def check_hierarchy(slides: list[dict], css: str) -> list[Finding]:
    findings = []

    # Extract font-size declarations for title vs body
    title_sizes = re.findall(
        r'\.title[^{]*\{[^}]*font-size\s*:\s*(\d+)',
        css, re.IGNORECASE
    )
    body_sizes = re.findall(
        r'(?:\.body|\.text|\.bullet|\.content)[^{]*\{[^}]*font-size\s*:\s*(\d+)',
        css, re.IGNORECASE
    )

    if title_sizes and body_sizes:
        max_title = max(int(s) for s in title_sizes)
        max_body = max(int(s) for s in body_sizes)
        if max_body > 0 and max_title / max_body < 1.5:
            findings.append(Finding(
                "deck", "P2", "hierarchy", "",
                f"title/body size ratio is {max_title/max_body:.1f}× (should be ≥2×)"
            ))

    # Check caption sizing
    caption_sizes = re.findall(
        r'\.caption[^{]*\{[^}]*font-size\s*:\s*(\d+)',
        css, re.IGNORECASE
    )
    for cs_val in caption_sizes:
        if int(cs_val) > 18:
            findings.append(Finding(
                "deck", "P2", "hierarchy", "caption-as-body",
                f"caption font-size {cs_val}px exceeds 18px maximum"
            ))

    return findings


# ---------------------------------------------------------------------------
# Check: Restraint (color diversity)
# ---------------------------------------------------------------------------

def check_restraint(css: str, slide_data: list[dict] | None = None) -> list[Finding]:
    findings = []

    # Count actual slide moods when slide data is available.
    if slide_data:
        moods = {
            (slide.get("mood") or slide.get("atmosphere") or "").strip().lower()
            for slide in slide_data
            if isinstance(slide, dict)
        }
        moods.discard("")
        if len(moods) > 3:
            findings.append(Finding(
                "deck", "P2", "restraint", "mood-roulette",
                f"{len(moods)} distinct slide moods used (recommend ≤3 across a deck)"
            ))

    # Count distinct accent hex values from :root tokens, not from every optional mood class.
    root_match = re.search(r":root\s*\{([^}]*)\}", css, re.DOTALL)
    root_css = root_match.group(1) if root_match else css
    hex_colors = set(re.findall(r'#[0-9a-fA-F]{3,8}', root_css))
    # Filter out common blacks, whites, grays
    accent_colors = set()
    for c in hex_colors:
        c_lower = c.lower()
        # Skip neutral colors
        if c_lower in ("#000", "#000000", "#fff", "#ffffff", "#333", "#333333",
                       "#666", "#666666", "#999", "#999999", "#ccc", "#cccccc",
                       "#ddd", "#dddddd", "#eee", "#eeeeee", "#f5f5f4", "#fafafa",
                       "#1a1a2e", "#4a4a6a"):
            continue
        accent_colors.add(c_lower)

    if len(accent_colors) > 5:
        findings.append(Finding(
            "deck", "P2", "restraint", "",
            f"{len(accent_colors)} distinct accent colors in root tokens (recommend ≤5)"
        ))

    return findings


# ---------------------------------------------------------------------------
# Check: Rhythm (bullet density)
# ---------------------------------------------------------------------------

def check_rhythm(slides: list[dict]) -> list[Finding]:
    findings = []

    for s in slides:
        # Count bullet points (li elements)
        bullet_count = _count_pattern(s["html"], r'<li[^>]*>')
        if bullet_count > 5:
            findings.append(Finding(
                s["id"], "P2", "rhythm", "",
                f"{bullet_count} bullet points (max 4 recommended)"
            ))

    return findings


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

def compute_scores(findings: list[Finding]) -> dict[str, int]:
    dimensions = ["hierarchy", "rhythm", "occupancy", "stability", "restraint"]
    scores = {d: 2 for d in dimensions}  # Start at max

    for f in findings:
        dim = f.dimension
        if dim not in scores:
            continue
        if f.severity == "P1":
            scores[dim] = min(scores[dim], 0)
        elif f.severity == "P2":
            scores[dim] = min(scores[dim], 1)

    return scores


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def audit_comfort(path: str) -> tuple[dict[str, int], list[Finding]]:
    """Run the full comfort audit. Returns (scores, findings)."""
    html = _load_html(path)
    css = _extract_style_block(html)
    js = _extract_script_block(html)
    slides = _extract_slides(html)
    slide_data = _extract_slide_data(html)

    all_findings: list[Finding] = []

    # Run all checks
    all_findings.extend(check_anti_patterns(slides, css))
    all_findings.extend(check_stability(css, js))
    all_findings.extend(check_hierarchy(slides, css))
    all_findings.extend(check_restraint(css, slide_data=slide_data))
    all_findings.extend(check_rhythm(slides))

    scores = compute_scores(all_findings)
    return scores, all_findings


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 audit_design_comfort.py <html_file>", file=sys.stderr)
        sys.exit(1)

    path = sys.argv[1]
    if not Path(path).exists():
        print(f"Error: {path} not found", file=sys.stderr)
        sys.exit(1)

    scores, findings = audit_comfort(path)

    # --- Output ---
    filename = Path(path).name
    print(f"\nCOMFORT AUDIT — {filename}")
    print("─" * (17 + len(filename)))

    if findings:
        for f in sorted(findings, key=lambda x: (x.severity, x.slide)):
            ap_tag = f" ({f.anti_pattern})" if f.anti_pattern else ""
            print(f"{f.slide}: {f.severity}: {f.dimension}{ap_tag} — {f.message}")
    else:
        print("No findings.")

    total = sum(scores.values())
    score_parts = ", ".join(f"{k}: {v}" for k, v in scores.items())
    print(f"\nScore: {total}/10 ({score_parts})")

    p1_count = sum(1 for f in findings if f.severity == "P1")
    if p1_count > 0:
        print(f"Status: NEEDS_REVISION ({p1_count} P1 finding{'s' if p1_count > 1 else ''})")
    elif total < 7:
        print("Status: NEEDS_IMPROVEMENT")
    else:
        print("Status: PASS")

    return 0 if p1_count == 0 else 1


if __name__ == "__main__":
    sys.exit(main())

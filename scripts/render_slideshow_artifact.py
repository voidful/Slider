#!/usr/bin/env python3
"""Render a runnable React, HTML, or multi-file React slideshow artifact from slideData JSON.

This script bridges the final gap in the pipeline:
paper -> evidence -> visuals -> slideData -> runnable slideshow artifact
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[1]
REACT_TEMPLATE = REPO_ROOT / "assets" / "react-slideshow-starter" / "App.tsx"
HTML_TEMPLATE = REPO_ROOT / "assets" / "html-slideshow-starter" / "paper-presentation.html"
REACT_PROJECT_TEMPLATE = REPO_ROOT / "assets" / "react-project-starter"


def load_payload(path: Path) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        slide_data = data.get("slideData")
        if isinstance(slide_data, list):
            return data, slide_data
        raise ValueError("JSON object must contain a 'slideData' array")
    if isinstance(data, list):
        return {}, data
    raise ValueError("Slide data input must be a JSON object or JSON array")


def replace_regex(text: str, pattern: str, replacement: str) -> str:
    updated, count = re.subn(pattern, lambda m: replacement, text, count=1, flags=re.DOTALL)
    if count != 1:
        raise ValueError(f"Template replacement failed for pattern: {pattern}")
    return updated


def replace_regex_optional(text: str, pattern: str, replacement: str) -> str:
    updated, _count = re.subn(pattern, lambda m: replacement, text, count=1, flags=re.DOTALL)
    return updated


def strip_render_markers(text: str) -> str:
    return re.sub(r"\s*//\s*@render-[\w-]+", "", text)


def render_react(slides: list[dict[str, Any]], theme: str, venue: str) -> str:
    template = REACT_TEMPLATE.read_text(encoding="utf-8")
    rendered = json.dumps(slides, indent=2, ensure_ascii=False)
    template = replace_regex_optional(
        template,
        r'const themePreset: Theme = "[^"]+";\s*// @render-theme',
        f'const themePreset: Theme = "{theme}";',
    )
    template = replace_regex(
        template,
        r'const venuePreset: Venue = "[^"]+";\s*// @render-venue',
        f'const venuePreset: Venue = "{venue}";',
    )
    template = replace_regex(
        template,
        r'const slideData: Slide\[\] = \[.*?\];\s*// @render-slide-data',
        f"const slideData: Slide[] = {rendered};",
    )
    return strip_render_markers(template)


def repair_latex_json_collisions(s: str) -> str:
    """Repair LaTeX commands corrupted by JSON escape sequence collisions.

    When a previous JSON.parse interpreted \\beta as \\b (backspace) + "eta",
    the string contains chr(8)+"eta" instead of "\\beta". This function
    detects those control-character + suffix patterns and restores the
    original LaTeX command with a proper backslash.

    The repaired string can then be safely re-serialized via json.dumps(),
    which will double-escape the backslash (\\\\beta), so that the next
    JSON.parse produces the correct \\beta.
    """
    import re as _re
    COLLISION_REPAIRS = [
        # (control_char, consumed_letter, suffixes)
        ('\x07', 'a', ['rg']),
        ('\x08', 'b', ['eta', 'ar', 'inom', 'f', 'ig', 'ot', 'ullet', 'oxed', 'ackslash']),
        ('\x0b', 'v', ['arphi', 'ec', 'ert', 'dots']),
        ('\x0c', 'f', ['rac', 'orall', 'lat', 'loor']),
        ('\x0a', 'n', ['u', 'abla', 'eq', 'ot', 'i']),
        ('\x0d', 'r', ['ho', 'ightarrow', 'angle', 'ceil', 'floor']),
        ('\x09', 't', ['au', 'heta', 'imes', 'ext', 'ilde', 'o', 'riangle', 'ag']),
    ]
    for ctrl, letter, suffixes in COLLISION_REPAIRS:
        # Sort suffixes longest-first to avoid partial matches
        for suffix in sorted(suffixes, key=len, reverse=True):
            s = s.replace(ctrl + suffix, '\\' + letter + suffix)
            
    # Hard fail: If any C0 control chars remain, they will break the payload
    # or silently corrupt equations.
    if any(ord(ch) < 32 and ch not in '\n\r\t' for ch in s):
        raise ValueError("Fatal: Unresolved control character found in LaTeX string. "
                         "You likely forgot to use a raw string (r'...') or double-escape "
                         "a LaTeX backslash in your python string.")
                         
    return s


def _walk_repair_latex(obj: Any) -> Any:
    """Recursively walk a slide data structure and repair LaTeX collisions."""
    if isinstance(obj, str):
        return repair_latex_json_collisions(obj)
    if isinstance(obj, list):
        return [_walk_repair_latex(item) for item in obj]
    if isinstance(obj, dict):
        return {k: _walk_repair_latex(v) for k, v in obj.items()}
    return obj


def normalize_latex_in_slides(slides: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Pre-process LaTeX in slide data:
    1. Repair LaTeX-JSON collision damage (\\b+eta → \\beta, etc.)
    2. Collapse newlines in equation strings to spaces
    3. Mark long equations with _compact variant hint
    """
    COMPACT_THRESHOLD = 60
    TIGHT_THRESHOLD = 120

    # First: repair any LaTeX commands corrupted by JSON escape collisions
    slides = _walk_repair_latex(slides)

    for slide in slides:
        # Classic objective layout
        eq = slide.get("equation")
        if isinstance(eq, str):
            eq = " ".join(eq.split())  # collapse newlines/whitespace
            slide["equation"] = eq

        # contentBlocks equation blocks
        for block in slide.get("contentBlocks", []):
            if block.get("type") == "equation":
                content = block.get("content", "")
                if isinstance(content, str):
                    content = " ".join(content.split())
                    block["content"] = content

    return slides


def render_html(slides: list[dict[str, Any]], theme: str, venue: str, title: str | None) -> str:
    import base64
    template = HTML_TEMPLATE.read_text(encoding="utf-8")
    slides = normalize_latex_in_slides(slides)
    safe_title = title or (slides[0].get("title") if slides else "Paper Presentation") or "Paper Presentation"
    template = replace_regex(template, r"<title>.*?</title>", f"<title>{safe_title}</title>")
    template = replace_regex(
        template,
        r'const themePreset\s*=\s*"[^"]+";\s*// @render-theme',
        f'const themePreset="{theme}";',
    )
    template = replace_regex(
        template,
        r'const venuePreset\s*=\s*"[^"]+";\s*// @render-venue',
        f'const venuePreset="{venue}";',
    )

    # Base64 transport (primary) — eliminates ALL escaping issues.
    # json.dumps produces clean JSON, base64 encodes it to [A-Za-z0-9+/=].
    # The template decodes with atob() then JSON.parse().
    json_payload = json.dumps(slides, ensure_ascii=False)
    b64_payload = base64.b64encode(json_payload.encode("utf-8")).decode("ascii")

    template = replace_regex(
        template,
        r'const SLIDE_DATA_B64\s*=\s*"[^"]*";\s*// @render-slide-data-b64',
        f'const SLIDE_DATA_B64 = "{b64_payload}";',
    )
    # Fallbacks and string.raw are fully dismantled. Base64 is the sole transport.

    rendered_html = strip_render_markers(template)

    # Post-render validation: extract the base64 payload from the final HTML
    # and verify it can be decoded and parsed. This catches corruption.
    b64_match = re.search(r'const SLIDE_DATA_B64\s*=\s*"([^"]+)"', rendered_html)
    if b64_match:
        try:
            decoded = base64.b64decode(b64_match.group(1)).decode("utf-8")
            parsed = json.loads(decoded)
            assert isinstance(parsed, list), "Decoded slide data is not a list"
        except Exception as e:
            raise RuntimeError(
                f"Post-render validation FAILED: base64 slide payload in final HTML "
                f"cannot be decoded/parsed. This is a BLOCKING failure. Error: {e}"
            )

    return rendered_html


def to_ts_module(slides: list[dict[str, Any]]) -> str:
    rendered = json.dumps(slides, indent=2, ensure_ascii=False)
    return 'import type { Slide } from "../types";\n\nexport const slideData: Slide[] = ' + rendered + ';\n'


def render_react_project(slides: list[dict[str, Any]], theme: str, venue: str, title: str | None, output_dir: Path) -> list[Path]:
    if output_dir.exists() and output_dir.is_file():
        raise ValueError("react-project output must be a directory path")
    shutil.copytree(
        REACT_PROJECT_TEMPLATE,
        output_dir,
        dirs_exist_ok=True,
        ignore=shutil.ignore_patterns("node_modules", "dist", "build", ".DS_Store"),
    )

    slide_data_path = output_dir / "src" / "data" / "slideData.ts"
    slide_data_path.write_text(to_ts_module(slides), encoding="utf-8")

    config_path = output_dir / "src" / "lib" / "presentationConfig.ts"
    config_text = config_path.read_text(encoding="utf-8")
    config_text = replace_regex(
        config_text,
        r'export const themePreset: Theme = "[^"]+";\s*// @render-theme',
        f'export const themePreset: Theme = "{theme}";',
    )
    config_text = replace_regex(
        config_text,
        r'export const venuePreset: Venue = "[^"]+";\s*// @render-venue',
        f'export const venuePreset: Venue = "{venue}";',
    )
    safe_title = title or (slides[0].get("title") if slides else "Paper Slideshow Project") or "Paper Slideshow Project"
    config_text = replace_regex(
        config_text,
        r'export const deckTitle = ".*?";\s*// @render-title',
        f'export const deckTitle = {json.dumps(safe_title)};',
    )
    config_path.write_text(strip_render_markers(config_text), encoding="utf-8")

    index_path = output_dir / "index.html"
    index_text = index_path.read_text(encoding="utf-8")
    index_text = replace_regex(index_text, r"<title>.*?</title>", f"<title>{safe_title}</title>")
    index_path.write_text(strip_render_markers(index_text), encoding="utf-8")

    return [slide_data_path, config_path, index_path]


def main() -> None:
    parser = argparse.ArgumentParser(description="Render a runnable slideshow artifact from slideData JSON")
    parser.add_argument("--slide-data", type=Path, required=True, help="Path to a slideData JSON file or a payload with slideData")
    parser.add_argument("--mode", choices=["react", "html", "react-project"], required=True, help="Artifact type to render")
    parser.add_argument("--theme", help="Override theme preset")
    parser.add_argument("--venue", help="Override venue preset")
    parser.add_argument("--title", help="Override title for HTML or project output")
    parser.add_argument("--output", type=Path, required=True, help="Output file path for react/html or output directory for react-project")
    args = parser.parse_args()

    payload, slide_data = load_payload(args.slide_data)
    meta = payload.get("meta", {}) if isinstance(payload, dict) else {}
    theme = args.theme or meta.get("themePreset") or "zinc-editorial"
    venue = args.venue or meta.get("venuePreset") or "iclr"
    title = args.title or meta.get("title")

    if args.mode == "react":
        rendered = render_react(slide_data, theme=theme, venue=venue)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")
        print(str(args.output))
        return

    if args.mode == "html":
        rendered = render_html(slide_data, theme=theme, venue=venue, title=title)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")

        # Post-render audit gate
        from audit_research_slides import AuditResult, audit_svg_text, audit_rendered_html
        from browser_slide_audit import run_browser_slide_audit

        post_result = AuditResult()
        audit_svg_text(slide_data, post_result)
        audit_rendered_html(args.output, post_result)
        browser_report = run_browser_slide_audit(
            args.output,
            expected_slide_count=len(slide_data),
        )
        post_result.errors.extend(browser_report.errors)
        post_result.warnings.extend(browser_report.warnings)

        # ── Density budget enforcement (BLOCKING) ──
        for idx, s in enumerate(slide_data, 1):
            budget = s.get("densityBudget")
            if not budget or not isinstance(budget, (int, float)):
                continue
            # Count display-facing words (title, keyMessage, bullets, contentBlocks text)
            word_parts = []
            if s.get("title"):
                word_parts.append(s["title"])
            if s.get("keyMessage"):
                word_parts.append(s["keyMessage"])
            if s.get("subtitle"):
                word_parts.append(s["subtitle"])
            for b in s.get("bullets", []):
                text = b if isinstance(b, str) else (b.get("text", "") if isinstance(b, dict) else "")
                word_parts.append(text)
            for b in s.get("contentBlocks", []):
                if b.get("type") in ("label", "spacer"):
                    continue
                content = b.get("content", "")
                if isinstance(content, str):
                    word_parts.append(content)
                elif isinstance(content, dict):
                    for k in ("label", "value", "detail", "caption", "alt"):
                        if content.get(k):
                            word_parts.append(str(content[k]))
            display_words = len(" ".join(word_parts).split())
            ceiling = budget * 1.2
            if display_words > ceiling:
                post_result.warnings.append(
                    f"density-budget: s{idx:02d} has {display_words} display words "
                    f"but densityBudget={budget} (ceiling={ceiling:.0f}). "
                    f"Rewrite or split this slide."
                )

        # ── Stack block cap enforcement (BLOCKING) ──
        for idx, s in enumerate(slide_data, 1):
            blocks = s.get("contentBlocks", [])
            if not blocks or s.get("gridTemplate"):
                continue
            visible = [b for b in blocks if b.get("type") not in ("label", "spacer")]
            if len(visible) > 4:
                post_result.warnings.append(
                    f"block-cap: s{idx:02d} has {len(visible)} visible blocks "
                    f"(max 4 for vertical stack). Split this slide."
                )
            types = {b.get("type") for b in visible}
            has_table = "table" in types
            has_text = "text" in types
            metric_count = sum(1 for b in visible if b.get("type") == "metric")
            has_figure = "figure" in types
            if has_table and metric_count > 0 and has_text:
                post_result.warnings.append(
                    f"block-cap: s{idx:02d} has forbidden combo: "
                    f"table + metric + text on one slide."
                )
            if has_figure and metric_count >= 3 and has_text:
                post_result.warnings.append(
                    f"block-cap: s{idx:02d} has forbidden combo: "
                    f"figure + metric(×{metric_count}) + text on one slide."
                )

        # Visual coverage floor check
        exempt_layouts = {"cover", "takeaway"}
        total_content_slides = 0
        slides_with_visual = 0
        for s in slide_data:
            layout = s.get("layout", "")
            if layout in exempt_layouts:
                continue
            total_content_slides += 1
            if s.get("visual", {}).get("src"):
                slides_with_visual += 1
            elif any(
                b.get("type") in ("figure", "table")
                and (
                    (isinstance(b.get("content"), dict) and (b["content"].get("src") or b["content"].get("rows")))
                    or (isinstance(b.get("content"), str) and b["content"].strip())
                )
                for b in s.get("contentBlocks", [])
            ):
                slides_with_visual += 1

        if total_content_slides > 0:
            ratio = slides_with_visual / total_content_slides
            if ratio < 0.5:
                post_result.warnings.append(
                    f"visual-coverage: Only {slides_with_visual}/{total_content_slides} "
                    f"non-cover/takeaway slides have bound visuals ({ratio:.0%}). "
                    f"Target is ≥50%."
                )

        # Edit-mode body tag check — only flag if the actual <body> tag has the class,
        # not JS code that references the class name (e.g., the exportHTML function).
        rendered_html = args.output.read_text(encoding="utf-8")
        if re.search(r'<body[^>]*\bclass\s*=\s*["\'][^"\']*\bedit-mode\b', rendered_html):
            post_result.warnings.append(
                "edit-mode: <body> tag has class=\"edit-mode\". "
                "The deck will open in editor mode instead of presentation mode. "
                "Remove the class so the deck loads in viewer mode by default."
            )

        # Data URI images should use loading="eager", not "lazy"
        lazy_data_imgs = re.findall(
            r'<img[^>]*src="data:[^"]*"[^>]*loading="lazy"', rendered_html
        )
        if lazy_data_imgs:
            post_result.warnings.append(
                f"loading-lazy: {len(lazy_data_imgs)} data URI image(s) use loading=\"lazy\". "
                "For self-contained decks, use loading=\"eager\" to avoid unpredictable render timing."
            )

        # prefers-reduced-motion must be present
        compact_html = rendered_html.replace(" ", "")
        if "@media(prefers-reduced-motion" not in compact_html:
            post_result.warnings.append(
                "reduced-motion: Missing @media(prefers-reduced-motion) rule. "
                "All non-essential animations must respect this media query."
            )

        # LaTeX-JSON collision check — detect corrupted LaTeX commands
        # When LMs write JSON by hand, \beta becomes \b (backspace) + eta, etc.
        import re as _re
        LATEX_COLLISION_PATTERNS = [
            # (regex pattern on rendered HTML, description)
            (r'\x08eta', r'\beta corrupted: \b interpreted as backspace'),
            (r'\x08ar', r'\bar corrupted: \b interpreted as backspace'),
            (r'\x08inom', r'\binom corrupted: \b interpreted as backspace'),
            (r'\x0crac', r'\frac corrupted: \f interpreted as form feed'),
            (r'\x0corall', r'\forall corrupted: \f interpreted as form feed'),
            (r'\x0au\b', r'\nu corrupted: \n interpreted as newline'),
            (r'\x0aabla', r'\nabla corrupted: \n interpreted as newline'),
            (r'\x0dho', r'\rho corrupted: \r interpreted as carriage return'),
            (r'\x0dightarrow', r'\rightarrow corrupted: \r interpreted as CR'),
            (r'\x09au\b', r'\tau corrupted: \t interpreted as tab'),
            (r'\x09heta', r'\theta corrupted: \t interpreted as tab'),
            (r'\x09imes', r'\times corrupted: \t interpreted as tab'),
            (r'\x09ext', r'\text corrupted: \t interpreted as tab'),
        ]
        for pattern, desc in LATEX_COLLISION_PATTERNS:
            if _re.search(pattern, rendered_html):
                post_result.errors.append(
                    f"latex-json-collision: {desc}. "
                    "LaTeX backslashes must be double-escaped (\\\\beta) in the JSON "
                    "slides array because JSON.parse interprets \\b, \\f, \\n, \\r, \\t "
                    "as control characters."
                )

        # Template identity check — the output HTML must be built from the canonical template
        TEMPLATE_MARKERS = [
            ("slider/paper-presentation", "generator meta tag"),
            ("fitRenderedSlide", "density guard function"),
            ('id="prev"', "prev navigation button"),
            ('id="fullscreen"', "fullscreen button"),
        ]
        for marker, label in TEMPLATE_MARKERS:
            if marker not in rendered_html:
                post_result.errors.append(
                    f"template-identity: Output HTML is missing '{label}' ({marker}). "
                    "The deck was NOT built from the canonical template. "
                    "Never generate HTML from scratch — always inject slide data into "
                    "assets/html-slideshow-starter/paper-presentation.html."
                )
                break  # One missing marker is enough to flag

        if not post_result.passed:
            print("\n" + post_result.dump(), file=sys.stderr)
            print(
                f"\nERROR: Post-render audit FAILED for {args.output}. "
                "The output file was written but contains layout regressions. "
                "Fix the issues above before delivering.",
                file=sys.stderr,
            )
            sys.exit(1)

        if post_result.warnings:
            print("\n" + post_result.dump(), file=sys.stderr)

        print(str(args.output))
        return

    touched = render_react_project(slide_data, theme=theme, venue=venue, title=title, output_dir=args.output)
    print(json.dumps({"output_dir": str(args.output), "files": [str(path) for path in touched]}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

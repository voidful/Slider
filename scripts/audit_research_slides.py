#!/usr/bin/env python3
"""Audit research slides for evidence fidelity, design quality, and anti-patterns.

Reads a slide-data JSON file and outputs an actionable revision checklist.

Usage:
    python scripts/audit_research_slides.py --slide-data slide-plan.json
    python scripts/audit_research_slides.py --slide-data slide-plan.json --paper-type architecture-heavy
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any
import base64

PAPER_TYPES = [
    "architecture-heavy",
    "optimization-heavy",
    "benchmark-heavy",
    "theory-heavy",
    "qualitative-heavy",
]

MAX_BULLETS_PER_SLIDE = 4
MAX_WORDS_PER_BULLET = 15
MAX_BODY_WORDS = 60
MAX_TITLE_WORDS = 18

VISUAL_REQUIRED_PATTERNS = {
    "method-overview",
    "result-table-focus",
    "qualitative-evidence",
}

VISUAL_DOMINANT_PATTERNS = {
    "method-overview",
    "result-table-focus",
    "result-table",
    "qualitative-evidence",
    "ablation",
    "diagram",
}

VISUAL_AREA_THRESHOLD = 0.65  # 65% minimum for evidence-dominant slides


class AuditResult:
    def __init__(self) -> None:
        self.errors: list[str] = []
        self.warnings: list[str] = []
        self.revisions: list[str] = []

    @property
    def passed(self) -> bool:
        return len(self.errors) == 0

    def error(self, slide_id: str, msg: str) -> None:
        self.errors.append(f"[FAIL] slide={slide_id}: {msg}")

    def warn(self, slide_id: str, msg: str) -> None:
        self.warnings.append(f"[WARN] slide={slide_id}: {msg}")

    def revision(self, slide_id: str, action: str) -> None:
        self.revisions.append(f"[FIX] slide={slide_id}: {action}")

    def dump(self) -> str:
        lines: list[str] = []
        if self.errors:
            lines.append("═══ ERRORS (blocking) ═══")
            lines.extend(self.errors)
        if self.warnings:
            lines.append("\n═══ WARNINGS ═══")
            lines.extend(self.warnings)
        if self.revisions:
            lines.append("\n═══ REVISION CHECKLIST ═══")
            lines.extend(self.revisions)
        if not self.errors and not self.warnings and not self.revisions:
            lines.append("✓ All audit checks passed.")
        lines.append(
            f"\nSummary: {len(self.errors)} error(s), "
            f"{len(self.warnings)} warning(s), "
            f"{len(self.revisions)} revision(s)"
        )
        return "\n".join(lines)


def count_words(text: str) -> int:
    return len(text.split()) if text else 0


# ── Per-slide checks ──────────────────────────────────


def audit_single_message(slide: dict[str, Any], result: AuditResult) -> None:
    """Check that each slide has a single dominant message."""
    sid = slide.get("id", "?")
    key_msg = slide.get("keyMessage", "")
    if not key_msg:
        result.warn(sid, "Missing keyMessage — slide may lack a dominant message.")
    bullets = slide.get("bullets", [])
    if len(bullets) > MAX_BULLETS_PER_SLIDE:
        result.revision(
            sid,
            f"Reduce bullets from {len(bullets)} to ≤ {MAX_BULLETS_PER_SLIDE}.",
        )
    for i, b in enumerate(bullets):
        wc = count_words(b if isinstance(b, str) else b.get("text", ""))
        if wc > MAX_WORDS_PER_BULLET:
            result.revision(
                sid,
                f"Bullet {i+1} has {wc} words — shorten to ≤ {MAX_WORDS_PER_BULLET}.",
            )


def audit_visual_evidence(slide: dict[str, Any], result: AuditResult) -> None:
    """Check evidence and visual requirements."""
    sid = slide.get("id", "?")
    must_visual = slide.get("mustIncludeVisual", False)
    has_visual = bool(
        slide.get("visualBinding")
        or slide.get("figureLabel")
        or slide.get("visualType")
        or (slide.get("visual") and slide["visual"].get("src"))
    )
    layout = slide.get("layout", "")

    if must_visual and not has_visual:
        result.error(
            sid,
            "mustIncludeVisual=true but no visual binding found. "
            "This slide must not render as text-only.",
        )

    if layout in VISUAL_REQUIRED_PATTERNS and not has_visual:
        result.warn(
            sid, f"Layout '{layout}' typically requires a visual but none is bound."
        )

    evidence_source = slide.get("evidenceSource", "")
    if has_visual and not evidence_source:
        result.warn(
            sid,
            "Visual is bound but evidenceSource is missing — "
            "add paper figure/table reference.",
        )


def audit_visual_dominance(slide: dict[str, Any], result: AuditResult) -> None:
    """Check that evidence visuals are appropriately sized."""
    sid = slide.get("id", "?")
    layout = slide.get("layout", "")
    has_visual = bool(
        slide.get("visualBinding")
        or slide.get("figureLabel")
        or slide.get("visualType")
        or (slide.get("visual") and slide["visual"].get("src"))
    )

    if layout not in VISUAL_DOMINANT_PATTERNS:
        return
    if not has_visual:
        return

    # Check for visual area hints in the slide data
    visual_area = slide.get("visualAreaPercent")
    if visual_area is not None and visual_area < VISUAL_AREA_THRESHOLD * 100:
        result.error(
            sid,
            f"Visual occupies {visual_area}% but layout '{layout}' requires ≥{int(VISUAL_AREA_THRESHOLD*100)}%. "
            "Increase figure size or reduce text column.",
        )

    # Check for thumbnail-wall pattern
    visual_count = slide.get("visualCount", 1)
    if isinstance(visual_count, int) and visual_count > 3:
        result.revision(
            sid,
            f"Slide has {visual_count} visuals — risk of thumbnail wall. "
            "Split into multiple slides for core evidence.",
        )


def audit_figure_legibility(slide: dict[str, Any], result: AuditResult) -> None:
    """Check that evidence figures won't be squashed to unreadable thumbnails.

    When a slide combines ≥4 metric cards with a figure, the figure is almost
    guaranteed to render below the 200px minimum height threshold. This is now
    a blocking error. With exactly 3 metrics it remains a warning.
    """
    sid = slide.get("id", "?")
    layout = slide.get("layout", "")

    has_visual = bool(
        slide.get("visualBinding")
        or slide.get("figureLabel")
        or slide.get("visualType")
        or (slide.get("visual") and slide["visual"].get("src"))
    )
    if not has_visual:
        return

    visual_area = slide.get("visualAreaPercent")
    if isinstance(visual_area, (int, float)) and visual_area >= VISUAL_AREA_THRESHOLD * 100:
        return

    # Classic mode: check metrics count alongside a visual
    metrics = slide.get("metrics", [])
    if isinstance(metrics, list) and len(metrics) >= 3:
        if layout in ("result-table-focus", "result-table", "metrics"):
            if len(metrics) >= 4:
                result.error(
                    sid,
                    f"Slide has {len(metrics)} metric cards AND a figure. "
                    "Figure will render below 200px height (unreadable). "
                    "MUST split into a metrics-only slide and a "
                    "dedicated figure slide.",
                )
            else:
                result.warn(
                    sid,
                    f"Slide has {len(metrics)} metric cards AND a figure. "
                    "Figure may render below 200px height (unreadable). "
                    "Consider splitting into a metrics-only slide and a "
                    "dedicated figure slide for legibility.",
                )

    # ContentBlocks mode: check for metric-grid block + figure block
    blocks = slide.get("contentBlocks", [])
    has_metric_grid = False
    metric_count = 0
    has_figure_block = False
    for block in blocks:
        if block.get("type") == "metric-grid":
            has_metric_grid = True
            content = block.get("content", [])
            if isinstance(content, list):
                metric_count = len(content)
        elif block.get("type") == "figure":
            has_figure_block = True

    if has_metric_grid and has_figure_block and metric_count >= 3:
        if metric_count >= 4:
            result.error(
                sid,
                f"ContentBlocks slide has {metric_count} metrics AND a figure. "
                "Figure will render too small to be legible. "
                "MUST split into two slides: one for metrics, "
                "one dedicated to the figure at full size.",
            )
        else:
            result.warn(
                sid,
                f"ContentBlocks slide has {metric_count} metrics AND a figure. "
                "Figure may render too small to be legible. "
                "Consider splitting into two slides: one for metrics, "
                "one dedicated to the figure at full size.",
            )


def audit_decorative_excess(slide: dict[str, Any], result: AuditResult) -> None:
    """Check for unnecessary decorative elements."""
    sid = slide.get("id", "?")
    content = json.dumps(slide).lower()

    marketing_terms = [
        "revolutionary",
        "game-changing",
        "cutting-edge",
        "world-class",
        "next-generation",
        "paradigm shift",
        "unleash",
        "unlock",
    ]
    for term in marketing_terms:
        if term in content:
            result.revision(
                sid,
                f"Remove marketing language: '{term}'. Use precise technical phrasing.",
            )


def audit_text_density(slide: dict[str, Any], result: AuditResult) -> None:
    """Check for text-heavy slides — blocking if severe."""
    sid = slide.get("id", "?")
    text_parts: list[str] = []
    text_parts.append(slide.get("keyMessage", ""))
    text_parts.append(slide.get("subtitle", ""))
    for b in slide.get("bullets", []):
        text_parts.append(b if isinstance(b, str) else b.get("text", ""))
    text_parts.append(slide.get("content", ""))

    total = sum(count_words(t) for t in text_parts)
    density_budget = slide.get("densityBudget")
    limit = density_budget if isinstance(density_budget, int) else MAX_BODY_WORDS

    if total > limit * 1.5:
        result.error(
            sid,
            f"Slide has ~{total} words (limit {limit}) — severe overflow risk. "
            "Split slide, reduce text, or move detail to speaker notes.",
        )
    elif total > limit:
        result.revision(
            sid,
            f"Slide has ~{total} words — reduce to ≤ {limit} "
            "or move detail to speaker notes.",
        )


def audit_title_overflow(slide: dict[str, Any], result: AuditResult) -> None:
    """Check for titles that are too long to fit safely."""
    sid = slide.get("id", "?")
    title = slide.get("title", "")
    wc = count_words(title)
    if wc > MAX_TITLE_WORDS:
        result.revision(
            sid,
            f"Title has {wc} words — shorten to ≤ {MAX_TITLE_WORDS} "
            "to prevent overflow.",
        )
    if len(title) > 120:
        result.warn(
            sid,
            f"Title is {len(title)} chars — may overflow on smaller viewports.",
        )


def audit_hierarchy(slide: dict[str, Any], result: AuditResult) -> None:
    """Check for hierarchy clarity."""
    sid = slide.get("id", "?")
    title = slide.get("title", "")
    generic_titles = [
        "method",
        "methods",
        "results",
        "experiments",
        "approach",
        "model",
        "discussion",
        "analysis",
        "conclusion",
        "overview",
    ]
    if title.strip().lower() in generic_titles:
        result.revision(
            sid,
            f"Title '{title}' is generic. Use an argumentative title that states a claim.",
        )


def audit_table_readability(slide: dict[str, Any], result: AuditResult) -> None:
    """Flag potential table readability issues."""
    sid = slide.get("id", "?")
    metrics = slide.get("metrics", [])
    if isinstance(metrics, list) and len(metrics) > 6:
        result.error(
            sid,
            f"Metrics list has {len(metrics)} items — will overflow the slide. "
            "Reduce to ≤ 4 key comparisons or split into multiple slides.",
        )
    elif isinstance(metrics, list) and len(metrics) > 4:
        result.warn(
            sid,
            f"Metrics list has {len(metrics)} items — may be crowded. Focus on ≤ 4.",
        )


def audit_color_usage(slide: dict[str, Any], result: AuditResult) -> None:
    """Check that the slide uses appropriate semantic color hints."""
    sid = slide.get("id", "?")
    layout = slide.get("layout", "")
    content = json.dumps(slide).lower()

    # Check for metric delta color usage
    metrics = slide.get("metrics", [])
    if isinstance(metrics, list):
        for m in metrics:
            if isinstance(m, dict):
                value = str(m.get("value", ""))
                delta = m.get("delta", "")
                # If value starts with + or shows a gain but no delta specified
                if (value.startswith("+") or "improve" in value.lower()) and not delta:
                    result.revision(
                        sid,
                        f"Metric '{m.get('label', '?')}' looks positive but has no "
                        "delta field. Add delta:'positive' for semantic color.",
                    )


def audit_consecutive_repetition(
    slides: list[dict[str, Any]], result: AuditResult
) -> None:
    """Check for consecutive slides repeating the same claim."""
    for i in range(1, len(slides)):
        prev = slides[i - 1]
        curr = slides[i]
        prev_claim = prev.get("claim", "") or prev.get("keyMessage", "")
        curr_claim = curr.get("claim", "") or curr.get("keyMessage", "")
        if (
            prev_claim
            and curr_claim
            and prev_claim.strip().lower() == curr_claim.strip().lower()
        ):
            result.revision(
                curr.get("id", "?"),
                f"Same claim as previous slide ({prev.get('id', '?')}). "
                "Merge or differentiate.",
            )


def audit_projector_safety(slide: dict[str, Any], result: AuditResult) -> None:
    """Flag potential projector readability issues."""
    sid = slide.get("id", "?")
    content = json.dumps(slide)
    small_font_patterns = [
        "font-size: 10",
        "font-size: 11",
        "font-size:10",
        "font-size:11",
        "text-xs",
        "text-[10px]",
        "text-[11px]",
    ]
    for pat in small_font_patterns:
        if pat in content:
            result.error(
                sid,
                f"Contains very small text ('{pat}'). "
                "Minimum 12px for captions, 14px for tables, 15px for body.",
            )


def audit_paper_type_compliance(
    slides: list[dict[str, Any]], paper_types: list[str], result: AuditResult
) -> None:
    """Check that paper-type-specific mandatory visuals are present."""
    has_method_figure = False
    has_result_table = False
    has_objective_visual = False
    has_qualitative = False

    for slide in slides:
        layout = slide.get("layout", "")
        etype = slide.get("evidenceType", "")
        has_v = bool(
            slide.get("visualBinding")
            or slide.get("figureLabel")
            or slide.get("visualType")
            or (slide.get("visual") and slide["visual"].get("src"))
        )

        if layout in ("method-overview", "diagram") and has_v:
            has_method_figure = True
        if layout in ("result-table-focus", "result-table", "table-focus", "metrics"):
            has_result_table = True
        if layout == "objective" or etype == "equation":
            if has_v:
                has_objective_visual = True
        if layout == "qualitative-evidence" or etype == "qualitative":
            has_qualitative = True

    if "architecture-heavy" in paper_types and not has_method_figure:
        result.error(
            "deck",
            "Architecture-heavy paper but no method/architecture figure "
            "in main deck. FAILING.",
        )

    if "benchmark-heavy" in paper_types and not has_result_table:
        result.error(
            "deck",
            "Benchmark-heavy paper but no core result table "
            "in main deck. FAILING.",
        )

    if "optimization-heavy" in paper_types and not has_objective_visual:
        result.warn(
            "deck",
            "Optimization-heavy paper but no objective visualization in main deck.",
        )

    if "qualitative-heavy" in paper_types and not has_qualitative:
        result.warn(
            "deck",
            "Qualitative-heavy paper but no qualitative comparison in main deck.",
        )


def audit_equation_safety(slide: dict[str, Any], result: AuditResult) -> None:
    """Check equations for overflow risk and render-readiness."""
    sid = str(slide.get("id", "?"))
    LONG_EQ_THRESHOLD = 80
    VERY_LONG_EQ_THRESHOLD = 150

    # Classic objective layout equation
    eq = slide.get("equation", "")
    if eq:
        if "\n" in eq:
            result.warn(
                sid,
                "Objective equation contains newlines — may cause render issues. "
                "Collapse to single line."
            )
        if len(eq) > VERY_LONG_EQ_THRESHOLD:
            result.error(
                sid,
                f"Objective equation is extremely long ({len(eq)} chars). "
                "Split into multiple lines or use equation-tight class."
            )
        elif len(eq) > LONG_EQ_THRESHOLD:
            result.warn(
                sid,
                f"Objective equation is long ({len(eq)} chars). "
                "Consider equation-compact class or splitting."
            )

    # contentBlocks equation blocks
    for block in slide.get("contentBlocks", []):
        if block.get("type") != "equation":
            continue
        content = block.get("content", "")
        if "\n" in content:
            result.warn(
                sid,
                "ContentBlock equation contains newlines — collapse to single line."
            )
        if len(content) > VERY_LONG_EQ_THRESHOLD:
            result.warn(
                sid,
                f"ContentBlock equation is very long ({len(content)} chars). "
                "Renderer will auto-apply equation-tight, but consider splitting."
            )


def audit_acceptance_tests(slides: list[dict[str, Any]], result: AuditResult) -> None:
    """Run acceptance tests that can fail the entire deck."""
    for slide in slides:
        sid = slide.get("id", "?")
        must_visual = slide.get("mustIncludeVisual", False)
        has_visual = bool(
            slide.get("visualBinding")
            or slide.get("figureLabel")
            or slide.get("visualType")
            or (slide.get("visual") and slide["visual"].get("src"))
        )
        if must_visual and not has_visual:
            result.error(
                sid,
                "ACCEPTANCE FAIL: mustIncludeVisual=true but rendered as text-only.",
            )


def audit_html_template_regressions(result: AuditResult) -> None:
    """Check the HTML template for known rendering regressions."""
    template_path = (
        Path(__file__).resolve().parents[1]
        / "assets"
        / "html-slideshow-starter"
        / "paper-presentation.html"
    )
    if not template_path.exists():
        result.warn("template", "HTML template not found — skipping template audit.")
        return

    html = template_path.read_text(encoding="utf-8")

    # Fullscreen: must target stage wrapper, not documentElement
    if "document.documentElement.requestFullscreen" in html:
        result.error(
            "template",
            "FULLSCREEN BUG: fullscreen targets document.documentElement "
            "instead of the stage wrapper. Slide will not preserve the stage model.",
        )

    if (
        "wrapperEl.requestFullscreen" not in html
        and "wrapperRef.current.requestFullscreen" not in html
        and "deckEl.requestFullscreen" not in html
        and 'deck").requestFullscreen' not in html
    ):
        # Check for any correct fullscreen targeting
        if ".requestFullscreen" in html and "wrapper" not in html.split(".requestFullscreen")[0][-80:] and "deck" not in html.split(".requestFullscreen")[0][-80:]:
            result.warn(
                "template",
                "Fullscreen may not target the correct stage container. "
                "Verify it targets the wrapper that owns scaling."
            )

    # Fullscreen CSS: must have wrapper-preserving fullscreen chrome rules
    has_deck_fullscreen_rules = ".deck:fullscreen" in html or ".deck:-webkit-full-screen" in html
    has_wrapper_fullscreen_rules = (
        "#deck-wrapper:fullscreen .deck" in html
        or "#deck-wrapper:-webkit-full-screen .deck" in html
        or ".deck-wrapper.simulated-fs .deck" in html
    )
    if not has_deck_fullscreen_rules and not has_wrapper_fullscreen_rules:
        result.error(
            "template",
            "FULLSCREEN BUG: No fullscreen chrome rules found for the stage-preserve wrapper/deck pair.",
        )

    # Color: must have semantic tokens
    if "--accent:" not in html or "--positive:" not in html or "--negative:" not in html:
        result.error(
            "template",
            "MONOCHROME BUG: Missing semantic color tokens (--accent, --positive, --negative). "
            "Deck will render as near-monochrome.",
        )

    # Overflow: must have overflow protection
    if "overflow-wrap" not in html and "word-break" not in html:
        result.error(
            "template",
            "OVERFLOW BUG: No overflow-wrap or word-break CSS. "
            "Long text will escape containers.",
        )

    # Visual size: check max-height on images
    max_height_match = re.search(r"max-height:\s*(\d+)px", html)
    if max_height_match:
        mh = int(max_height_match.group(1))
        if mh < 400:
            result.warn(
                "template",
                f"Image max-height is {mh}px — may be too small for evidence figures. "
                "Recommend ≥ 450px.",
            )

    # Responsive stage reflow is banned
    if re.search(r"@media\s*\(\s*max-width[^)]*\).*?(?:\.slide|\.split|\.metrics|\.metric-grid|\.grid-2|\.grid-3|\.comparison-panel)", html, re.DOTALL):
        result.error(
            "template",
            "STAGE DRIFT BUG: @media(max-width: ...) changes slide layout inside the fixed stage. "
            "Scale the stage instead of reflowing content.",
        )

    if "@media(prefers-reduced-motion" not in html.replace(" ", ""):
        result.warn(
            "template",
            "MOTION BUG: Missing prefers-reduced-motion handling.",
        )

    if "transition:all" in html.replace(" ", ""):
        result.warn(
            "template",
            "MOTION BUG: transition: all detected. List explicit properties instead.",
        )

    # --- Additional template regression checks (P0) ---

    # Evidence frame must not have fixed pixel max-height
    if re.search(r"evidence-frame[^}]*max-height:\s*\d+px", html):
        result.error(
            "template",
            "LAYOUT BUG: .evidence-frame img has fixed pixel max-height. "
            "Must use max-height:100% with flex containment instead.",
        )

    # #slide-root must have flex:1 and min-height:0
    # Match standalone #slide-root rule (not inside a compound selector like .deck:fullscreen #slide-root)
    slide_root_match = re.search(r"(?<![,\w\s.#-])#slide-root\s*\{([^}]+)\}", html)
    if not slide_root_match:
        # Fallback: find all #slide-root matches and pick the one with display:flex
        for m in re.finditer(r"#slide-root\s*\{([^}]+)\}", html):
            if "display:flex" in m.group(1).replace(" ", ""):
                slide_root_match = m
                break
    if slide_root_match:
        sr_css = slide_root_match.group(1).replace(" ", "")
        if "flex:1" not in sr_css and "flex:11" not in sr_css:
            result.warn(
                "template",
                "LAYOUT: #slide-root missing flex:1 — may not fill container.",
            )
        if "min-height:0" not in sr_css:
            result.warn(
                "template",
                "LAYOUT: #slide-root missing min-height:0 — flex containment incomplete.",
            )

    # .slide > * must have flex-shrink:1
    slide_children_match = re.search(r"\.slide\s*>\s*\*\s*\{([^}]+)\}", html)
    if slide_children_match:
        sc_css = slide_children_match.group(1).replace(" ", "")
        if "flex-shrink:1" not in sc_css:
            result.warn(
                "template",
                "LAYOUT: .slide > * missing flex-shrink:1 — children won't compress.",
            )

    if "text-wrap:balance" not in html.replace(" ", ""):
        result.warn(
            "template",
            "TYPOGRAPHY: title balance rule missing. Add text-wrap: balance for long headings.",
        )

    # Check for inline style font-size/color in render functions
    script_match = re.search(r"<script>(.*)</script>", html, re.DOTALL)
    if script_match:
        script = script_match.group(1)
        # Only check inside render functions, not CSS
        render_fns = re.findall(
            r"function\s+render\w+\(.*?\)\s*\{.*?\}", script, re.DOTALL
        )
        for fn in render_fns:
            if re.search(r'style=["\'][^"]*font-size', fn):
                result.warn(
                    "template",
                    "INLINE STYLE: Render function uses inline style font-size. "
                    "Use CSS classes instead.",
                )
                break

    # --- Dark-mode readability override check ---
    # When atmosphere-dramatic (dark bg) exists, all text-bearing children
    # must have explicit color overrides to prevent black-on-dark fallback.
    if ".atmosphere-dramatic" in html:
        required_dark_overrides = [
            (".atmosphere-dramatic .metric-label", "metric-label"),
            (".atmosphere-dramatic .metric-detail", "metric-detail"),
            (".atmosphere-dramatic .visual-caption", "visual-caption"),
            (".atmosphere-dramatic .bullet", "bullet"),
        ]
        missing = []
        for selector, name in required_dark_overrides:
            if selector not in html:
                missing.append(name)
        if missing:
            result.error(
                "template",
                "DARK-MODE BUG: .atmosphere-dramatic is defined but missing "
                f"color overrides for: {', '.join(missing)}. "
                "These elements will fall back to dark text on dark background.",
            )


def audit_svg_text(
    slides: list[dict[str, Any]], result: AuditResult
) -> None:
    """Check that SVG <text> elements in custom-html blocks don't contain long text.

    SVG <text> does not auto-wrap. Long text will overflow its container.
    Text over 24 characters or 4 words MUST use <foreignObject> instead.
    """
    SVG_TEXT_CHAR_LIMIT = 24
    SVG_TEXT_WORD_LIMIT = 4

    for slide in slides:
        sid = slide.get("id", "?")
        for block in slide.get("contentBlocks", []):
            if block.get("type") != "custom-html":
                continue

            content = block.get("content", "")
            if not content:
                continue

            # Check for <svg> elements
            if "<svg" not in content.lower():
                continue

            # Check for viewBox
            if "<svg" in content and "viewBox" not in content:
                result.warn(
                    sid,
                    "SVG in custom-html block has no viewBox — scaling may fail.",
                )

            # Find all <text ...>CONTENT</text> elements
            text_matches = re.findall(
                r"<text\s+[^>]*>([^<]+)</text>", content
            )
            for text_content in text_matches:
                text_content = text_content.strip()
                if not text_content:
                    continue

                char_count = len(text_content)
                word_count = len(text_content.split())

                if char_count > SVG_TEXT_CHAR_LIMIT or word_count > SVG_TEXT_WORD_LIMIT:
                    result.error(
                        sid,
                        f"SVG <text> contains long text ({char_count} chars, "
                        f"{word_count} words): '{text_content[:40]}...'. "
                        "SVG text does not auto-wrap. Use <foreignObject> instead.",
                    )

            # Also check base64-encoded SVGs in figure img src
        for block in slide.get("contentBlocks", []):
            if block.get("type") != "figure":
                continue
            fig = block.get("content", {})
            if not isinstance(fig, dict):
                continue
            src = fig.get("src", "")
            if not src.startswith("data:image/svg+xml;base64,"):
                continue
            try:
                svg_bytes = base64.b64decode(src.split(",", 1)[1])
                svg_str = svg_bytes.decode("utf-8", errors="replace")
                text_matches = re.findall(
                    r"<text\s+[^>]*>([^<]+)</text>", svg_str
                )
                for text_content in text_matches:
                    text_content = text_content.strip()
                    if not text_content:
                        continue
                    char_count = len(text_content)
                    word_count = len(text_content.split())
                    if char_count > SVG_TEXT_CHAR_LIMIT or word_count > SVG_TEXT_WORD_LIMIT:
                        result.error(
                            sid,
                            f"Base64 SVG <text> contains long text ({char_count} chars, "
                            f"{word_count} words): '{text_content[:40]}...'. "
                            "SVG text does not auto-wrap. Use <foreignObject>.",
                        )
            except Exception:
                pass  # Ignore decode errors


def audit_rendered_html(
    html_path: Path, result: AuditResult
) -> None:
    """Check the rendered output HTML file for layout regressions.

    Unlike audit_html_template_regressions (which checks the starter template),
    this function checks the ACTUAL FINAL output that the user will open.
    """
    if not html_path.exists():
        result.warn("output", f"Output HTML not found at {html_path} — skipping output audit.")
        return

    html = html_path.read_text(encoding="utf-8")

    # 1. Check flex containment chain
    slide_root_match = None
    for m in re.finditer(r"#slide-root\s*\{([^}]+)\}", html):
        if "display:flex" in m.group(1).replace(" ", ""):
            slide_root_match = m
            break
    if slide_root_match:
        sr = slide_root_match.group(1).replace(" ", "")
        if "min-height:0" not in sr:
            result.error(
                "output",
                "#slide-root missing min-height:0 in output HTML.",
            )

    # 2. Check .evidence-frame img for fixed pixel max-height
    if re.search(r"\.evidence-frame\s+img[^}]*max-height:\s*\d+px", html):
        result.error(
            "output",
            ".evidence-frame img has fixed pixel max-height in output HTML. "
            "Must use flex-based containment.",
        )

    # 3. Stage-consistent: no viewport-unit typography in slide content
    # Under the stage model, vh/vw in slide content breaks composition stability
    slide_content_selectors = re.findall(
        r'\.(slide|title|body-text|body|bullet|label|equation-block|metric-value|'
        r'metric-label|metric-detail|callout-box|quote-block|hero-text|hero-number|'
        r'comparison-label|timeline-step|timeline-arrow|evidence|visual-caption|'
        r'result-table|data-table)[^{]*\{([^}]+)\}',
        html,
    )
    for selector, rules in slide_content_selectors:
        if re.search(r'font-size:\s*[\d.]+v[hw]', rules):
            result.error(
                "output",
                f"Viewport-unit font-size detected in .{selector}. "
                "Stage model requires rem/px/clamp — vh/vw breaks composition stability.",
            )
        if re.search(r'padding:\s*[\d.]+v[hw]', rules) and selector not in ("controls",):
            result.warn(
                "output",
                f"Viewport-unit padding in .{selector}. "
                "Consider using fixed units for stage consistency.",
            )

    # 4. scaleDeck must use unified scaling (stage model check)
    script_match = re.search(r"<script>(.*)</script>", html, re.DOTALL)
    if script_match:
        script = script_match.group(1)
        if "transform:'none'" in script or 'transform:"none"' in script or "transform:none" in script.replace(" ", ""):
            result.error(
                "output",
                "scaleDeck sets transform:none in fullscreen. "
                "Stage model requires transform:scale(s) in all modes.",
            )

    # 5. Responsive stage reflow is banned
    if re.search(r"@media\s*\(\s*max-width[^)]*\).*?(?:\.slide|\.split|\.metrics|\.metric-grid|\.grid-2|\.grid-3|\.comparison-panel)", html, re.DOTALL):
        result.error(
            "output",
            "Responsive media query changes slide content layout inside the fixed stage.",
        )

    # 6. Motion hygiene
    compact_html = html.replace(" ", "")
    if "@media(prefers-reduced-motion" not in compact_html:
        result.warn(
            "output",
            "Missing prefers-reduced-motion handling in output HTML.",
        )
    if "transition:all" in compact_html:
        result.warn(
            "output",
            "transition: all detected in output HTML. List explicit properties instead.",
        )

    # 7. Check for inline style font-size in render functions
    if script_match:
        script = script_match.group(1)
        # Look for style="...font-size..." in template literals
        if re.search(r'style=["\\][^"]*font-size', script):
            result.warn(
                "output",
                "Render function uses inline font-size style. "
                "Use CSS classes for consistency.",
            )

    # 8. KaTeX math render race condition detection
    has_equation = bool(re.search(r'equation-block|equation"|type.*equation', html))
    has_katex_css = "katex" in html and "katex.min.css" in html
    has_katex_js = "katex.min.js" in html
    has_auto_render = "auto-render" in html
    has_math_hook = "waitForMath" in html or "renderMathInElement" in html

    if has_equation:
        if not has_katex_css or not has_katex_js:
            result.error(
                "output",
                "Equations detected but KaTeX CDN is missing. "
                "Add katex.min.css and katex.min.js to <head>.",
            )
        if not has_auto_render:
            result.warn(
                "output",
                "Equations detected but KaTeX auto-render is missing. "
                "Add auto-render.min.js for $...$ delimiter support.",
            )
        if not has_math_hook:
            result.warn(
                "output",
                "Equations detected but no math readiness hook found. "
                "KaTeX deferred scripts may not be ready at first render() call. "
                "Add a waitForMath polling hook.",
            )

    # 9. objective layout should use objective-shell
    if "layout===\"objective\"" in html or 'layout==="objective"' in html:
        if "objective-shell" not in html:
            result.warn(
                "output",
                "Objective layout detected but objective-shell CSS class is missing. "
                "Long equations in region-center will overflow.",
            )

    if "text-wrap:balance" not in compact_html:
        result.warn(
            "output",
            "Title balance rule missing in output HTML.",
        )


# ── Main audit runner ─────────────────────────────────


def run_audit(
    slides: list[dict[str, Any]], paper_types: list[str] | None = None
) -> AuditResult:
    result = AuditResult()

    for slide in slides:
        if slide.get("appendix"):
            continue
        audit_single_message(slide, result)
        audit_visual_evidence(slide, result)
        audit_visual_dominance(slide, result)
        audit_figure_legibility(slide, result)
        audit_decorative_excess(slide, result)
        audit_text_density(slide, result)
        audit_title_overflow(slide, result)
        audit_hierarchy(slide, result)
        audit_table_readability(slide, result)
        audit_color_usage(slide, result)
        audit_projector_safety(slide, result)
        audit_equation_safety(slide, result)

    audit_consecutive_repetition(slides, result)

    if paper_types:
        main_slides = [s for s in slides if not s.get("appendix")]
        audit_paper_type_compliance(main_slides, paper_types, result)

    audit_acceptance_tests(slides, result)
    audit_html_template_regressions(result)
    audit_svg_text(slides, result)

    return result


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Audit research slides for quality and evidence fidelity."
    )
    parser.add_argument(
        "--slide-data", type=Path, required=True, help="Path to slide-data JSON"
    )
    parser.add_argument(
        "--paper-type",
        action="append",
        choices=PAPER_TYPES,
        default=[],
        help="Paper type(s) for type-specific checks.",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit with error code on any warning",
    )
    parser.add_argument(
        "--output-html",
        type=Path,
        default=None,
        help="Path to rendered output HTML file for post-render audit",
    )
    args = parser.parse_args()

    data = json.loads(args.slide_data.read_text(encoding="utf-8"))
    slides = data if isinstance(data, list) else data.get("slides", [])

    result = run_audit(slides, args.paper_type or None)

    if args.output_html:
        audit_rendered_html(args.output_html, result)

    print(result.dump())

    if not result.passed:
        sys.exit(1)
    if args.strict and result.warnings:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()

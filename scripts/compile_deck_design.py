#!/usr/bin/env python3
"""compile_deck_design.py — Compile a deck-level design from paper metadata.

Takes paper metadata (type, venue, evidence inventory, user preferences) and
produces a `deck_design.json` that the renderer and auditor consume.

Usage:
    python3 scripts/compile_deck_design.py \\
        --paper-type architecture-heavy \\
        --venue ICLR \\
        --output deck_design.json

    # Or with full metadata JSON:
    python3 scripts/compile_deck_design.py \\
        --metadata paper_metadata.json \\
        --output deck_design.json
"""

import argparse
import json
import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

VERSION = "1.1"

# Paper type → default mood family
PAPER_TYPE_TO_MOOD = {
    "theory-heavy":       "technical-minimal",
    "architecture-heavy": "editorial-research",
    "benchmark-heavy":    "editorial-research",
    "qualitative-heavy":  "cinematic-evidence",
    "hybrid":             "editorial-research",
}

# Mood family → default theme preset
MOOD_TO_PRESET = {
    "editorial-research":   "zinc-editorial",
    "technical-minimal":    "monochrome-impeccable",
    "cinematic-evidence":   "deep-navy-academic",
    "lab-notebook-premium": "zinc-editorial",
}

# Default semantic palette
DEFAULT_PALETTE = {
    "accent":      "#2563eb",
    "accent_bg":   "rgba(37,99,235,0.07)",
    "positive":    "#059669",
    "positive_bg": "rgba(5,150,105,0.07)",
    "negative":    "#dc2626",
    "negative_bg": "rgba(220,38,38,0.07)",
    "neutral":     "#6b7280",
}

# Venue → accent color shift (subtle)
VENUE_ACCENT_SHIFT = {
    "ICLR":     "#2563eb",   # standard blue
    "NeurIPS":  "#4f46e5",   # indigo
    "ICML":     "#2563eb",   # standard blue
    "ACL":      "#6366f1",   # blue-violet
    "EMNLP":    "#6366f1",   # blue-violet
    "CVPR":     "#3b82f6",   # brighter blue
    "ICCV":     "#3b82f6",
    "ECCV":     "#3b82f6",
    "AAAI":     "#2563eb",
    "IJCAI":    "#2563eb",
}

# Default type scale (all in rem/px/clamp — never vh/vw)
DEFAULT_TYPE_SCALE = {
    "hero":         "clamp(2.5rem, 4vw, 3.5rem)",
    "title":        "clamp(2rem, 3.5vw, 2.8rem)",
    "subtitle":     "1.35rem",
    "body":         "1.2rem",
    "caption":      "0.9rem",
    "label":        "0.85rem",
    "equation":     "1.6rem",
    "metric_value": "2.8rem",
    "hero_number":  "4rem",
}

# Default spacing scale
DEFAULT_SPACING = {
    "slide_padding":    "48px 56px",
    "block_gap":        "24px",
    "section_gap":      "40px",
    "figure_margin":    "16px",
    "equation_padding": "24px 32px",
}

# Page role → layout family (canonical binding)
PAGE_ROLE_FAMILIES = {
    "title":            "hero",
    "hook":             "hero",
    "takeaway":         "distilled-close",
    "closing":          "distilled-close",
    "problem":          "editorial-two-zone",
    "gap":              "editorial-two-zone",
    "limitation":       "editorial-two-zone",
    "contribution":     "editorial-two-zone",
    "method-overview":  "figure-dominant",
    "pipeline":         "figure-dominant",
    "architecture":     "figure-dominant",
    "objective":        "equation-panel",
    "theory":           "equation-panel",
    "algorithm":        "equation-panel",
    "main-result":      "evidence-compare",
    "ablation":         "evidence-compare",
    "analysis":         "evidence-compare",
    "qualitative":      "gallery",
    "future-work":      "distilled-close",
}

# All anti-patterns (enforced by default)
ALL_ANTI_PATTERNS = [
    "cards-on-cards",
    "mood-roulette",
    "app-shell",
    "center-collapse",
    "equation-wall",
    "caption-as-body",
    "over-accenting",
    "responsive-slide-thinking",
]

# Default comfort targets
DEFAULT_COMFORT_TARGETS = {
    "hierarchy":  2,
    "rhythm":     2,
    "occupancy":  2,
    "stability":  2,
    "restraint":  2,
}

DEFAULT_STYLE_BALANCE = {
    "clarity": "primary",
    "simplicity": "high",
    "fashion": "supporting",
    "motion": "accent-only",
}

DEFAULT_MOTION_POLICY = {
    "mode": "static-first",
    "transition_ms": 320,
    "max_transition_ms": 400,
    "allowed_properties": ["transform", "opacity", "background-color", "color", "box-shadow", "border-color"],
    "forbid": ["transition: all", "bounce", "3d", "parallax", "fullscreen-only reflow"],
    "respect_reduced_motion": True,
}

DEFAULT_CONTENT_HANDLING = {
    "title_wrap": "balance",
    "body_max_width": "56ch",
    "requires_break_words": True,
    "requires_min_width_zero": True,
    "metric_labels_truncate": "only-if-still-obvious",
    "tabular_numerals": True,
}

DEFAULT_COHESION_RULES = {
    "max_supporting_moods": 2,
    "max_background_treatments": 3,
    "max_surface_styles": 2,
    "forbid_forced_accent_rotation": True,
    "forbid_responsive_stage_reflow": True,
}


# ---------------------------------------------------------------------------
# Compiler
# ---------------------------------------------------------------------------

def compile_deck_design(
    paper_type: str = "hybrid",
    venue: str = "",
    mood_override: str = "",
    preset_override: str = "",
    palette_overrides: dict | None = None,
) -> dict:
    """Compile a deck_design.json from paper metadata."""

    # 1. Determine mood family
    mood = mood_override or PAPER_TYPE_TO_MOOD.get(paper_type, "editorial-research")

    # 2. Determine theme preset
    preset = preset_override or MOOD_TO_PRESET.get(mood, "zinc-editorial")

    # 3. Build palette (with venue accent shift)
    palette = dict(DEFAULT_PALETTE)
    if venue and venue.upper() in VENUE_ACCENT_SHIFT:
        palette["accent"] = VENUE_ACCENT_SHIFT[venue.upper()]
    if palette_overrides:
        palette.update(palette_overrides)

    # 4. Determine supporting moods based on paper type
    supporting = []
    if paper_type in ("qualitative-heavy", "hybrid"):
        supporting.append("dramatic")
    if paper_type == "theory-heavy":
        supporting.append("minimal")

    # 5. Assemble
    design = {
        "version":              VERSION,
        "paper_type":           paper_type,
        "deck_mood_family":     mood,
        "supporting_moods":     supporting,
        "theme_preset":         preset,
        "semantic_palette":     palette,
        "type_scale":           dict(DEFAULT_TYPE_SCALE),
        "spacing_scale":        dict(DEFAULT_SPACING),
        "style_balance":        dict(DEFAULT_STYLE_BALANCE),
        "motion_policy":        dict(DEFAULT_MOTION_POLICY),
        "content_handling":     dict(DEFAULT_CONTENT_HANDLING),
        "cohesion_rules":       dict(DEFAULT_COHESION_RULES),
        "page_role_families":   dict(PAGE_ROLE_FAMILIES),
        "figure_treatment":     "embed-primary",
        "equation_treatment":   "panel-centered",
        "table_treatment":      "highlight-best-row",
        "fullscreen_contract":  "stage-preserve",
        "anti_patterns_enforced": list(ALL_ANTI_PATTERNS),
        "comfort_targets":      dict(DEFAULT_COMFORT_TARGETS),
    }

    return design


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Compile a deck-level design from paper metadata."
    )
    parser.add_argument(
        "--paper-type",
        choices=["theory-heavy", "architecture-heavy", "benchmark-heavy",
                 "qualitative-heavy", "hybrid"],
        default="hybrid",
        help="Paper type classification (default: hybrid)"
    )
    parser.add_argument(
        "--venue",
        default="",
        help="Publication venue (e.g. ICLR, NeurIPS, ACL)"
    )
    parser.add_argument(
        "--mood",
        default="",
        help="Override mood family (editorial-research, technical-minimal, "
             "cinematic-evidence, lab-notebook-premium)"
    )
    parser.add_argument(
        "--preset",
        default="",
        help="Override theme preset (zinc-editorial, deep-navy-academic, "
             "monochrome-impeccable)"
    )
    parser.add_argument(
        "--metadata",
        default="",
        help="Path to paper metadata JSON (overrides --paper-type and --venue)"
    )
    parser.add_argument(
        "--output", "-o",
        default="",
        help="Output path for deck_design.json (default: stdout)"
    )

    args = parser.parse_args()

    # Load metadata if provided
    paper_type = args.paper_type
    venue = args.venue

    if args.metadata:
        meta_path = Path(args.metadata)
        if meta_path.exists():
            with open(meta_path, encoding="utf-8") as f:
                meta = json.load(f)
            paper_type = meta.get("paper_type", paper_type)
            venue = meta.get("venue", venue)

    design = compile_deck_design(
        paper_type=paper_type,
        venue=venue,
        mood_override=args.mood,
        preset_override=args.preset,
    )

    output_json = json.dumps(design, indent=2, ensure_ascii=False)

    if args.output:
        Path(args.output).write_text(output_json + "\n", encoding="utf-8")
        print(f"Wrote {args.output}", file=sys.stderr)
    else:
        print(output_json)


if __name__ == "__main__":
    main()

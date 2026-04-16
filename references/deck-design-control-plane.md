# Deck Design Control Plane

This document defines the `deck_design.json` intermediate representation.
It is the contract between `compile_deck_design.py` (producer) and the renderer (consumer).

---

## Purpose

The deck design is **compiled before rendering**. It captures all visual decisions in a structured format that both the renderer and audit scripts consume. This prevents ad-hoc design decisions during rendering and ensures deck-level cohesion.

---

## Schema

```json
{
  "version": "1.1",
  "paper_type": "architecture-heavy",
  "deck_mood_family": "editorial-research",
  "supporting_moods": ["dramatic"],
  "theme_preset": "zinc-editorial",

  "semantic_palette": {
    "accent": "#2563eb",
    "accent_bg": "rgba(37,99,235,0.07)",
    "positive": "#059669",
    "positive_bg": "rgba(5,150,105,0.07)",
    "negative": "#dc2626",
    "negative_bg": "rgba(220,38,38,0.07)",
    "neutral": "#6b7280"
  },

  "type_scale": {
    "hero":    "clamp(2.5rem, 4vw, 3.5rem)",
    "title":   "clamp(2rem, 3.5vw, 2.8rem)",
    "subtitle": "1.35rem",
    "body":    "1.2rem",
    "caption": "0.9rem",
    "label":   "0.85rem",
    "equation": "1.6rem",
    "metric_value": "2.8rem",
    "hero_number": "4rem"
  },

  "spacing_scale": {
    "slide_padding": "48px 56px",
    "block_gap": "24px",
    "section_gap": "40px",
    "figure_margin": "16px",
    "equation_padding": "24px 32px"
  },

  "style_balance": {
    "clarity": "primary",
    "simplicity": "high",
    "fashion": "supporting",
    "motion": "accent-only"
  },

  "motion_policy": {
    "mode": "static-first",
    "transition_ms": 320,
    "max_transition_ms": 400,
    "allowed_properties": ["transform", "opacity", "background-color", "color", "box-shadow", "border-color"],
    "forbid": ["transition: all", "bounce", "3d", "parallax", "fullscreen-only reflow"],
    "respect_reduced_motion": true
  },

  "content_handling": {
    "title_wrap": "balance",
    "body_max_width": "56ch",
    "requires_break_words": true,
    "requires_min_width_zero": true,
    "metric_labels_truncate": "only-if-still-obvious",
    "tabular_numerals": true
  },

  "cohesion_rules": {
    "max_supporting_moods": 2,
    "max_background_treatments": 3,
    "max_surface_styles": 2,
    "forbid_forced_accent_rotation": true,
    "forbid_responsive_stage_reflow": true
  },

  "page_role_families": {
    "title":          "hero",
    "hook":           "hero",
    "takeaway":       "distilled-close",
    "closing":        "distilled-close",
    "problem":        "editorial-two-zone",
    "gap":            "editorial-two-zone",
    "limitation":     "editorial-two-zone",
    "contribution":   "editorial-two-zone",
    "method-overview":"figure-dominant",
    "pipeline":       "figure-dominant",
    "architecture":   "figure-dominant",
    "objective":      "equation-panel",
    "theory":         "equation-panel",
    "algorithm":      "equation-panel",
    "main-result":    "evidence-compare",
    "ablation":       "evidence-compare",
    "analysis":       "evidence-compare",
    "qualitative":    "gallery",
    "future-work":    "distilled-close"
  },

  "figure_treatment": "embed-primary",
  "equation_treatment": "panel-centered",
  "table_treatment": "highlight-best-row",

  "fullscreen_contract": "stage-preserve",

  "anti_patterns_enforced": [
    "cards-on-cards",
    "mood-roulette",
    "app-shell",
    "center-collapse",
    "equation-wall",
    "caption-as-body",
    "over-accenting",
    "responsive-slide-thinking"
  ],

  "comfort_targets": {
    "hierarchy": 2,
    "rhythm": 2,
    "occupancy": 2,
    "stability": 2,
    "restraint": 2
  }
}
```

---

## Field Reference

### `paper_type`
Classification from Step 2 of the SKILL.md workflow. Values: `theory-heavy`, `architecture-heavy`, `benchmark-heavy`, `qualitative-heavy`, `hybrid`.

### `deck_mood_family`
The primary visual grammar for the deck. Determines the default feel across most slides.

| Mood Family | Character | Best For |
|:---|:---|:---|
| `editorial-research` | Clean, editorial, restrained. Zinc/navy tones. | Architecture-heavy, benchmark-heavy, hybrid |
| `technical-minimal` | Ultra-clean, typography-led, monochrome-adjacent | Theory-heavy |
| `cinematic-evidence` | Dramatic evidence presentation, dark atmospheres for key reveals | Qualitative-heavy |
| `lab-notebook-premium` | Warm, tactile, exploratory feel | Experimental/ablation-heavy papers |

### `supporting_moods`
Optional atmosphere overrides for 1–3 specific slides (opener, climax, limitation turn). Values: `dramatic`, `warm`, `cool`, `minimal`. Applied via the atmosphere system in [theme-presets.md](theme-presets.md).

### `theme_preset`
Base color preset from [theme-presets.md](theme-presets.md). Values: `zinc-editorial`, `deep-navy-academic`, `monochrome-impeccable`.

### `semantic_palette`
The semantic color tokens. Must include all seven tokens. See [DESIGN.md](../assets/design/DESIGN.md) semantic colors section.

### `type_scale`
Font sizes for each typographic role. All values use `rem`, `px`, `em`, or `clamp()` — never `vh`/`vw`.

### `spacing_scale`
Spacing values for slide padding, block gaps, and element margins.

### `style_balance`
High-level priority ordering for clarity, concision, style, and motion.

### `motion_policy`
Static-first motion contract, allowed properties, and reduced-motion requirements.

### `content_handling`
Rules for balanced titles, safe wrapping, `min-width:0`, and numeric formatting.

### `cohesion_rules`
Deck-level limits that prevent mood roulette and responsive stage reflow.

### `page_role_families`
Binding of page roles to layout families, per [page-role-layout-families.md](page-role-layout-families.md).

### `figure_treatment`, `equation_treatment`, `table_treatment`
Default rendering strategy for these content types.

### `fullscreen_contract`
Always `"stage-preserve"` unless the deck has explicit opt-in reflow slides. See [fullscreen-contract.md](fullscreen-contract.md).

### `anti_patterns_enforced`
List of anti-patterns from [research-slide-anti-patterns.md](research-slide-anti-patterns.md) that the renderer must avoid and the audit must check.

### `comfort_targets`
Target scores for the five comfort dimensions. Used by `audit_design_comfort.py`.

---

## Lifecycle

```
paper metadata + preferences
         │
         ▼
  compile_deck_design.py
         │
         ▼
   deck_design.json  ◄── consumed by ──► renderer
         │                                    │
         ▼                                    ▼
   audit_design_comfort.py          rendered HTML
         │
         ▼
   comfort report
```

The compiler runs **before** the renderer. The audit runs **after**.

# Multi-Panel Figure Detection

## Goal

Detect when a paper figure contains multiple subpanels and preserve that metadata through export and binding.

## Signals

Prefer these signals in order:
1. explicit panel labels in captions such as `(a)`, `(b)`, `a:`, `b:`
2. figure captions that describe multiple components in sequence
3. wide or tall figure crops that plausibly split into multiple panels

## Required metadata

Each figure candidate should preserve:
- `multipanel`
- `panel_count`
- `panel_labels`
- `panel_pattern_strength`

Each export manifest entry should preserve:
- `panel_count`
- `panel_exports`

## Export policy

When panel metadata is available and the figure crop is large enough:
- export one main crop for the whole figure
- export individual panel crops as secondary assets
- keep panel crops traceable to the same page and figure label

## Presentation policy

Do not automatically create one slide per panel.
Use panel metadata only to improve:
- crop quality
- speaker traceability
- later manual refinement

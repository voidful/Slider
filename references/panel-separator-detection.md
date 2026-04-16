# Panel Separator Detection

Use panel separator detection to capture the internal divider structure of multi-panel figures.

## Goal

When a figure contains panels like (a), (b), and (c), preserve not just the panel count but also the implied separator lines between panels.

## Output fields

Detection should preserve:
- `panel_separators`
- `panel_separator_strength`

Each separator item should include:
- `orientation`
- `position_norm`
- `span_norm`

## Use

Use separators to improve:
- panel crop stability,
- confidence calibration,
- traceability for multi-panel evidence slides.

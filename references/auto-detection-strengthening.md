# Auto-Detection Strengthening

Use layout-aware caption anchors when the source is a PDF.

## Goal

Improve figure and table discovery beyond plain caption text matching.

## Stronger signals

Prefer candidates that include:
- `caption_bbox`
- `page_bbox`
- `region_hint`
- `anchor_strength`
- detector metadata such as `pdf-layout-anchor`

## Region hint rules

### Figures
If the caption is in the lower half of the page, prefer `above-caption`.
If the caption is near the top, allow `below-caption`.

### Tables
Prefer `below-caption` because tables usually start immediately after the caption.

## Export behavior

When `region_hint.bbox` exists, use it as the first crop prior.
Only fall back to whole-page export when region-aware cropping is weak.

## Trust policy

Treat layout-aware candidates as stronger than text-only candidates.
Still verify visually when the page is dense or multi-panel.

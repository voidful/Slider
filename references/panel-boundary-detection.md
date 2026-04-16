# Panel Boundary Detection

Use panel boundary detection after multi-panel detection.

## Goal

Estimate per-panel normalized boxes so panel exports are more stable than simple equal splits.

## Signals

Use:
- panel labels in captions,
- inferred panel geometry,
- aspect ratio of the visual region.

## Output

Store:
- `panel_boundaries`,
- `panel_boundary_strength`.

Each boundary should include:
- label,
- row,
- col,
- `bbox_norm`.

## Fallback

When panel boundaries are weak or missing, fall back to geometry-only equal splitting.

# Multi-panel Geometry Detection

Use caption panel labels together with page and caption geometry to infer a coarse panel layout.

## Goals
- preserve multi-panel structure in exported assets,
- make panel crops traceable,
- improve confidence calibration for multi-panel figures.

## Heuristic
- 2 panels: prefer horizontal split when the visual region is wide, otherwise vertical.
- 3 to 4 panels: prefer a 2x2 grid when the region is not tall and narrow.
- 5 or more panels: infer rows and columns from a simple grid based on aspect ratio.

## Required metadata
Each multi-panel candidate should expose:
- `panel_count`
- `panel_labels`
- `panel_pattern_strength`
- `panel_geometry.rows`
- `panel_geometry.cols`
- `panel_geometry.layout`
- `panel_geometry.strength`

Use these hints only as priors. Do not claim exact subfigure boundaries unless they are clearly supported by the exported clips.

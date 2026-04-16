# Table Row and Column Inference

After a table crop is detected, infer a coarse table structure from text tokens inside the crop.

## Goals
- tighten table-aware crops,
- estimate how many rows and columns the visible table contains,
- feed stronger confidence signals into visual binding.

## Heuristic
- cluster tokens by y-coordinate to estimate rows,
- cluster token centers by x-coordinate to estimate columns,
- expose approximate row and column edges,
- treat the result as a structural hint, not a semantic parser.

## Required metadata
A structure-aware table export should expose:
- `table_structure.row_count`
- `table_structure.column_count`
- `table_structure.row_edges`
- `table_structure.column_edges`
- `table_structure.strength`

If row or column inference is weak, keep the crop but lower confidence rather than fabricating a precise structure.

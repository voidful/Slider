# Semantic Table Parsing

Use semantic table parsing after structure-aware row and column inference.

## Goal

Estimate whether the table has:
- a header row,
- a stub column,
- numeric metric columns.

## Output

Store:
- `semantic_table.header_row`,
- `semantic_table.stub_column`,
- `semantic_table.numeric_columns`,
- `semantic_table.metric_headers`,
- `semantic_table.strength`.

## Heuristic

Prefer:
- alphabetic-heavy first row for headers,
- alphabetic-heavy first column for stubs,
- numeric-heavy later columns for metrics.

## Use

Use semantic table strength in binding calibration.

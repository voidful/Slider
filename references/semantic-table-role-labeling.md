# Semantic Table Role Labeling

Use semantic role labeling to distinguish the rhetorical function of table columns.

## Goal

A result table is more useful when the system can infer which columns represent:
- stub or row labels,
- primary metrics,
- delta columns,
- ranking columns.

## Output fields

Semantic table parsing should preserve:
- `semantic_table.role_labels.column_roles`
- `semantic_table.role_labels.best_metric_columns`
- `semantic_table.role_labels.delta_columns`
- `semantic_table.role_labels.rank_columns`
- `semantic_table.role_labels.strength`

## Use

Use these role labels to improve:
- confidence calibration,
- metrics slide selection,
- focused result rendering.

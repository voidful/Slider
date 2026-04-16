# Semantic Role Confidence Calibration

Calibrate semantic table role labeling instead of trusting raw role heuristics.

## Signals
- per-column role confidence
- agreement between numeric density and metric headers
- agreement between delta formatting and delta columns
- agreement between ranking tokens and rank columns

## Guidance

Increase role confidence when:
- header cues and token patterns agree,
- multiple numeric columns align with metric headers,
- column-level confidence is consistent.

Reduce role confidence when:
- header cues are weak,
- mixed text and numeric tokens dominate the same column,
- detected roles change drastically across adjacent columns.

# Confidence Calibration

Calibrate visual binding confidence in layers.

## Inputs

Use all of the following when available:
- candidate relevance score
- export match score
- detector confidence
- anchor strength
- region hint strength
- crop mode penalties

## Output fields

Every bound or attempted binding should expose:
- `status`
- `confidence`
- `reason`
- `candidateScore`
- `exportScore`
- `bindingScore`
- `policy`
- `fallbackStrategy`
- `confidenceBreakdown`

## Policy tiers

### High
Bind directly.
Use the crop in the main artifact.

### Medium
Bind with traceability.
Keep caption and evidence note visible.

### Low
Prefer placeholder or manual review.
Do not silently bind a weak crop.

## Fallback discipline

A bad placeholder is better than a wrong figure.
When confidence is low, preserve the rhetorical slot but do not force the visual.

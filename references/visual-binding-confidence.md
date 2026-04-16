# Visual Binding Confidence

Record whether a slide should use a real exported crop or keep a placeholder.

Each binding attempt should carry `status`, `confidence`, `reason`, `candidateScore`, `exportScore`, `bindingScore`, `policy`, and `fallbackStrategy`.

Use both sources of evidence: candidate relevance from visual scoring, and export quality from crop matching plus detector confidence.

Policies:
- `bind-directly`: show the crop normally
- `bind-with-caution`: show the crop, but keep confidence visible
- `keep-placeholder`: do not show the crop automatically

Fallback strategies:
- `placeholder`
- `manual-review`
- `placeholder-if-caption-mismatch`

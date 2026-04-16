# Venue Style Variants

## Goal

Adapt the presentation tone to the venue while preserving the same core evidence and narrative quality.

Use venue style as a finishing layer, not as an excuse to change the scientific story.

## Shared rules

All venue variants should remain:
- technically faithful,
- projector-safe,
- restrained,
- one-message-per-slide,
- easy to speak over.

Do not turn venue style into costume design.

## NeurIPS variant

### Tone
- sharp,
- modern,
- technically confident,
- compact but not crowded.

### Typical emphasis
- method novelty,
- quantitative gains,
- benchmark credibility,
- conceptual efficiency.

### Visual guidance
- strong typographic contrast,
- focused result cards,
- precise pipeline diagrams,
- slightly denser but still projector-safe layouts.

### Good fit
Use when the paper is method-heavy or benchmark-driven.

## ICLR variant

### Tone
- conceptual,
- insight-first,
- clean,
- discussion-friendly.

### Typical emphasis
- why the idea matters,
- clean intuition before detail,
- representation or learning signal changes,
- ablation logic.

### Visual guidance
- more whitespace,
- clearer conceptual diagrams,
- fewer but stronger visual anchors,
- gentle emphasis on insight slide quality.

### Good fit
Use when the paper's novelty is best explained through intuition and conceptual framing.

## ACL / EMNLP variant

### Tone
- analytic,
- precise,
- language-task grounded,
- evidence-aware.

### Typical emphasis
- task framing,
- dataset and metric nuance,
- qualitative examples,
- error analysis,
- comparison against strong baselines.

### Visual guidance
- example panels,
- focused tables,
- callouts for qualitative outputs,
- conservative color usage.

### Good fit
Use when the audience needs careful interpretation of language examples or evaluation design.

## CVPR / ICCV / ECCV variant

### Tone
- visual,
- results-forward,
- system-and-output oriented.

### Typical emphasis
- method figure readability,
- visual comparison quality,
- ablations around components,
- qualitative outputs and failure cases.

### Visual guidance
- larger image panels,
- simplified architecture diagrams,
- clean image grids,
- more space for visual evidence.

### Good fit
Use when images and qualitative comparisons carry a major part of the argument.

## Selection rule

Use the venue requested by the user when provided.

Otherwise infer from the paper domain if it is obvious.
If not obvious, default to:
- ICLR when the main value is conceptual clarity,
- NeurIPS when the main value is method-plus-results balance.

## Implementation rule

Use venue style to change:
- title weight,
- spacing density,
- accent usage,
- preferred layout emphasis,
- visual priority.

Do not change:
- core slide sequence,
- evidence standards,
- faithfulness rules,
- rubric thresholds.

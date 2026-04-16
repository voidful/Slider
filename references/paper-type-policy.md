# Paper Type Policy

## Classification

Before slide planning, classify the paper into one or more types:

| Type | Signal |
|:---|:---|
| architecture-heavy | Novel model architecture, pipeline, or system design is the main contribution |
| optimization-heavy | Novel loss function, training procedure, or objective is the main contribution |
| benchmark-heavy | Main contribution is empirical evaluation, new benchmark, or comprehensive comparison |
| theory-heavy | Main contribution is a theorem, proof, bound, or formal analysis |
| qualitative-heavy | Main contribution relies on qualitative examples, generation quality, or perceptual evaluation |

A paper may belong to multiple types. Apply all applicable policies.

## Deck policies by type

### Architecture-heavy
- Main deck must include at least one large method/architecture figure as anchor slide.
- Use the "method overview with dominant figure" pattern.
- The architecture slide should appear before experiment slides.
- Do not compress the architecture into bullets when a figure exists.

### Optimization-heavy
- Main deck must include at least one objective visualization or training pipeline schematic.
- Use the "objective slide" pattern: equation + plain-language + mini diagram.
- Showing only a raw equation without visual context is insufficient.
- Training dynamics (convergence, loss curves) may be included if they support a stability or efficiency claim.

### Benchmark-heavy
- Main deck must include at least one core result table or faithfully redrawn comparison chart.
- Use the "result table focus" pattern.
- The key delta must be visually annotated (highlight, bold, color).
- Compress repetitive benchmark tables — show only the one that best supports the core claim.
- Move remaining tables to appendix.

### Theory-heavy
- Explain intuition before formal detail.
- Main deck equations must be sparse (≤ 2 in the main narrative).
- Move long derivations to appendix.
- Include at least one conceptual diagram that maps the theory to intuition.

### Qualitative-heavy
- Main deck must include at least one side-by-side qualitative comparison.
- Use the "qualitative evidence" pattern.
- Show the strongest example, not a grid of mediocre ones.
- Move additional examples to appendix.

## Multiple types

When a paper has multiple types, satisfy all applicable mandatory visual requirements. If this would create too many visual slides, prioritize:
1. The visual that most directly proves the core claim.
2. The visual that most helps audience understanding.
3. The visual that is most unique to this paper.

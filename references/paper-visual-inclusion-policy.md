# Paper Visual Inclusion Policy

## Core rule

If the paper contains a method figure, architecture diagram, pipeline figure, training objective diagram, algorithm flow, or key result table, at least one must appear in the main deck. No exceptions.

## Mandatory inclusion triggers

### Architecture-heavy paper
Main deck must include at least one system architecture or method flow diagram. This diagram becomes the anchor slide of the talk.

### Optimization / objective-heavy paper
Main deck must include at least one objective visualization, training pipeline schematic, or method schematic. Displaying only an equation without a supporting diagram is insufficient.

### Benchmark-heavy paper
Main deck must include at least one core result table or a faithfully redrawn comparison chart. The key delta must be annotated.

### Qualitative-heavy paper
Main deck must include at least one representative qualitative example or side-by-side qualitative comparison if it is critical to the paper's claim.

### Theory-heavy paper
Main deck must include at least one intuition diagram or simplified conceptual figure. Long derivations go to appendix.

## Redraw allowance

If the original figure is too dense for a slide, faithful redraw is allowed under the constraints in `faithful-redraw-policy.md`. But the redrawn figure must preserve the original logic, numbers, ordering, arrow semantics, comparison direction, and color-coded meaning.

## Fallback when no usable figure exists

If no paper figure can be directly used or faithfully redrawn:
1. Output a clearly labeled "faithful reconstructed diagram."
2. In the speaker note, state the source section, original figure number, and what was reconstructed.
3. Never present a decorative placeholder as if it were evidence.

## Prohibition

- Do not replace a usable paper figure with generic metrics cards.
- Do not compress "method introduction" into a bullets-only slide when a method figure exists.
- Do not use a decorative placeholder when the real figure is available.
- If a paper has a key figure, attempt crop, inspect, cite, or redraw before falling back to text.

## Speaker note requirement

Every slide that includes a paper visual must have a speaker note explaining:
- Why this visual was selected for the main deck.
- Which paper figure/table/section it corresponds to.
- Whether it is original, cropped, or redrawn.

## Figure legibility rule

Evidence figures must be rendered large enough that axis labels, legends, data points, and annotations are clearly readable. The minimum rendered height is **200px** in windowed mode.

**Split-slide approach:** When a slide combines metrics, text, and a figure and the figure would shrink below 200px, split the content into two slides:
1. **Result summary slide** — title, key message, metric cards. No figure.
2. **Dedicated figure slide** — the figure at full readable size with caption and brief annotation.

This is preferred over squashing an unreadable figure onto a busy slide. An unreadable figure communicates nothing and wastes the audience's attention.

# Paper Visual Inclusion Policy

## Core rule

For a full paper talk, include the key method/result visuals that support its thesis. Match the selection to the user's scope and available evidence. A narrow briefing, plan, or local edit does not require the full paper's visual inventory.

## Mandatory inclusion triggers

### Architecture-heavy paper
Main deck must include at least one system architecture or method flow diagram. This diagram becomes the anchor slide of the talk.

### Optimization / objective-heavy paper
Main deck must include at least one objective visualization, training pipeline schematic, or method schematic. Add a supporting diagram when it clarifies the objective; do not invent one merely to satisfy a visual quota.

### Benchmark-heavy paper
Main deck must include at least one core result table or a faithfully redrawn comparison chart. The key delta must be annotated.

### Qualitative-heavy paper
Main deck must include at least one representative qualitative example or side-by-side qualitative comparison if it is critical to the paper's claim.

### Theory-heavy paper
Use an intuition diagram when it helps. Equations, definitions, and concise explanation may be sufficient for an expert talk. Move optional derivations to notes or appendix.

## Redraw allowance

If the original figure is too dense for a slide, faithful redraw is allowed under the constraints in `faithful-redraw-policy.md`. But the redrawn figure must preserve the original logic, numbers, ordering, arrow semantics, comparison direction, and color-coded meaning.

## Fallback when no usable figure exists

If no paper figure can be directly used or faithfully redrawn:
1. Reconstruct only when the source provides enough structure/data; label and cite it. Otherwise identify the missing evidence and keep the affected output a draft.
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

Evidence figures must be rendered large enough that axis labels, legends, data points, and annotations are clearly readable. Use **200px on the unscaled 1200×675 stage** as an initial sizing target, then inspect label readability. Window resizing scales the whole stage without changing its layout.

**Split-slide approach:** When a slide combines metrics, text, and a figure and the figure would shrink below 200px, split the content into two slides:
1. **Result summary slide** — title, key message, metric cards. No figure.
2. **Dedicated figure slide** — the figure at full readable size with caption and brief annotation.

This is preferred over squashing an unreadable figure onto a busy slide. An unreadable figure communicates nothing and wastes the audience's attention.

# Faithful Redraw Policy

## When to redraw

Redraw a paper figure when:
- The original is too dense, low-resolution, or unreadable at slide scale.
- The original contains more information than the slide's single message requires.
- The original layout does not fit the slide aspect ratio.

## Fidelity constraints

When redrawing, you must preserve:
- Original logic and causal flow.
- All numbers exactly as published.
- Ordering and ranking of items.
- Arrow semantics (direction, meaning).
- Comparison direction (which is better/worse).
- Color-coded semantic meaning (if a color means "proposed method" in the paper, it must mean the same in the redraw).
- Labels and terminology from the paper.

You must not:
- Invent components not in the paper.
- Omit components that change the interpretation.
- Reorder items to create a false impression.
- Change metric names or dataset names.
- Add decorative elements that imply non-existent relationships.

## Simplification strategies

Preferred approaches when the original is too complex:
1. **Crop:** Show only the relevant region of the figure.
2. **Layer:** Split into progressive-reveal steps, but the static version must be self-contained.
3. **Focus:** Remove peripheral annotations while keeping the core flow intact.
4. **Zoom:** Enlarge the key portion and reference the full figure in speaker notes.

## Metadata requirement

Every redrawn figure must include:
- In slide metadata: `evidenceType: "reconstructed-diagram"` and `visualBinding` pointing to the original figure/table/section.
- In speaker notes: "Redrawn from Figure X / Table Y / Section Z. Original shows [brief description]. Simplified for clarity."

## Prohibition

- Do not present a redrawn figure as if it were the original.
- Do not redraw a figure if the original is already clean and usable at slide scale.
- Do not redraw only to match a visual theme — fidelity trumps aesthetics.

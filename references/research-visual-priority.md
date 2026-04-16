# Research Visual Priority

## Priority tiers

### Priority A — must consider for main deck
- Main method figure / architecture diagram / pipeline figure.
- Most important result table (the one that proves the core claim).
- Training objective diagram or method schematic.
- Algorithm flow diagram.

If the paper has any Priority A visual, at least one must appear in the main deck.

### Priority B — include if it supports a core claim
- Ablation table or chart that isolates the contribution.
- Error analysis figure.
- Qualitative comparison that directly validates the key claim.
- Training curve or convergence plot when it supports a stability or efficiency argument.

Include Priority B visuals only when they reinforce a slide's singular message. Do not include them for completeness.

### Priority C — appendix by default
- Supplementary tables repeating similar benchmarks.
- Secondary qualitative examples.
- Hyperparameter sensitivity plots.
- Dataset statistics tables.
- Visuals that repeat information already covered by a Priority A or B visual.

## Suppression rules

1. Same-message dedup: if two visuals express the same claim, keep only the stronger one.
2. No consecutive repetition: do not use two consecutive slides to say the same thing in different formats (e.g., a table slide followed by a bullets slide restating the same numbers).
3. Figure-then-bullets ban: if a figure already fully explains the method, do not follow it with a pure-bullets slide restating the same method.
4. Metric card replacement ban: do not replace a paper's result table with generic metric cards when the table is available and readable.

## Selection decision flow

```
1. List all visual candidates from the paper.
2. Classify each as Priority A, B, or C.
3. For each Priority A visual:
   - Can it be cropped cleanly? → use crop.
   - Is it too dense? → faithful redraw (see faithful-redraw-policy.md).
   - Neither? → reconstructed diagram with source annotation.
4. For each Priority B visual:
   - Does it support a specific slide's claim? → include.
   - Is it redundant with a Priority A visual? → suppress.
5. All Priority C visuals → appendix or omit.
6. Apply suppression rules.
```

## Legibility gate

After selecting visuals, verify that each figure will render at a readable size on its assigned slide:

- **Minimum height:** 200px rendered (windowed). Axis labels, legends, and data points must be legible.
- **Shared-slide check:** If the slide also has ≥3 metric cards or a table, estimate whether the figure gets enough vertical space. If not, prefer a **split-slide approach** — one slide for the textual summary, one slide dedicated to the figure at full size.
- **Never a thumbnail:** An unreadable figure communicates nothing. It is always better to dedicate a full slide to a figure than to shrink it into a corner.

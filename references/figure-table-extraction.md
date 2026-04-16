# Figure and Table Extraction

## Goal

Surface the most useful visual evidence from a paper without copying unreadable paper pages into the main deck.

## Core rule

Treat figure and table extraction as evidence discovery, not as final presentation design.

The extracted output should help answer:
- which page to inspect,
- which figure or table matters,
- what single conclusion it supports,
- whether it should be redrawn, simplified, or replaced with a placeholder.

## Preferred workflow

1. Run `scripts/find_visual_evidence.py <paper.pdf>` when a local paper file is available.
2. Inspect the returned candidate pages.
3. For each candidate, write a one-line conclusion.
4. Score the candidates with `scripts/score_visual_candidates.py --visuals visuals.json --evidence evidence.json --output scored-visuals.json` when practical.
5. Keep only the visuals that support a core slide message.
5. Redraw or simplify dense visuals for the main deck.
6. Move secondary visuals to appendix, notes, or omit them.

## Visual triage rules

### Keep in the main deck
Keep a figure or table only if it does at least one of these well:
- explains the method at a glance,
- shows the strongest result,
- shows the cleanest ablation,
- reveals an important qualitative pattern,
- clarifies a limitation or failure mode.

### Move to appendix or notes
Move a figure or table out of the main deck if it is:
- repetitive,
- dense but low-yield,
- only minor supporting evidence,
- impossible to read at presentation scale,
- mainly implementation detail.

### Replace with a placeholder
Use a clean placeholder when:
- the environment cannot retrieve the visual reliably,
- the figure is too dense to reproduce faithfully in time,
- the visual role matters more than the literal original image.

## Redraw rules

Redraw when the original visual is too dense.

### For method figures
- strip decorative detail,
- keep the pipeline order,
- keep the key module names,
- keep the input and output role,
- add one-sentence annotations only when they help.

### For tables
- keep only the important rows and columns,
- include metric and dataset labels,
- highlight the proposed method and strongest comparison,
- annotate the conclusion directly near the key value.

### For charts
- preserve axis meaning,
- preserve the main trend,
- preserve the relative ordering when it matters,
- enlarge the signal and simplify the legend.

## Caption handling

Always keep the original figure or table label and a short source note internally.

Preferred internal fields:
- page number,
- label, such as Figure 2 or Table 4,
- caption excerpt,
- intended slide role,
- one-sentence conclusion.

## Anti-patterns

Never:
- paste a full paper screenshot when the text is unreadable,
- use a figure only because it looks impressive,
- present a dense multi-panel figure without guiding annotations,
- surface a table without stating the conclusion,
- crop visuals so aggressively that the claim becomes misleading.

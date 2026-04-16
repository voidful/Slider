# Score-Aware Slide Insertion Refinement

## Goal

Let strong visuals change the deck structure in small, controlled ways.

## Main rules

- Keep the base deck compact.
- Insert at most a few extra evidence slides.
- Insert only when the visual clears the venue-specific insertion threshold.

## Good insertions

### Extra benchmark table
Insert after the main result slide when the table adds a distinct comparison.

### Extra qualitative slide
Insert after the main result slide when the venue rewards qualitative evidence and the figure is strong.

### Extra ablation slide
Insert after the main result slide when the ablation cleanly validates the claimed mechanism.

## Anti-patterns

- Do not insert every strong visual.
- Do not insert redundant evidence.
- Do not let appendix-style details move into the main deck just because their score is barely high enough.

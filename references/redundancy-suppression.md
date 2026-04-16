# Redundancy Suppression

Use redundancy suppression to keep the deck concise when multiple visuals say nearly the same thing.

## Core rule

Do not insert an extra evidence slide or appendix visual if it is too similar to a visual already used in the deck.

Suppress a candidate when any of the following hold:
- it has the same label as an already used visual,
- it comes from the same page and the same story role,
- its caption overlaps strongly with a used visual of the same role,
- it would repeat a benchmark, qualitative, or ablation point that is already visually covered.

## Caption overlap

Use token overlap on normalized captions as a lightweight similarity test.
A similarity above roughly 0.55 is a strong warning that the candidate is redundant for insertion purposes.

## Appendix behavior

Apply the same suppression logic to appendix visuals.
Appendix slides should add optional depth, not repeat the main deck.

## Desired outcome

The audience should see one strong visual per claim, not several near-duplicates.

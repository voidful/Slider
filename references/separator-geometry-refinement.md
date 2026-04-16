# Separator Geometry Refinement

Use separator geometry to distinguish weak inferred separators from stable grid separators.

## Signals
- vertical consistency
- horizontal consistency
- separator count
- alignment with panel geometry

## Guidance

Prefer higher-confidence panel splits when:
- separator geometry strength is high,
- separator spacing is regular,
- panel layout matches caption panel count.

Reduce confidence when:
- spacing is highly irregular,
- only one separator is inferred but many panel labels exist,
- separator geometry conflicts with panel boundary boxes.

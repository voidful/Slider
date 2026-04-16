# Visual Selection Scoring

## Goal

Rank figure and table candidates so the deck uses the most useful visuals first.

## Core rule

Score visuals by communication value, not by surface complexity.

A visual belongs in the main deck only when it helps explain:
- the method at a glance,
- the strongest result,
- the cleanest ablation,
- a crucial qualitative pattern,
- or an important failure mode.

## Preferred workflow

1. run `scripts/find_visual_evidence.py <paper.pdf> --output visuals.json`,
2. run `scripts/score_visual_candidates.py --visuals visuals.json --evidence evidence.json --output scored-visuals.json`,
3. inspect the top-ranked candidates,
4. keep the best 1 to 3 visuals for the main deck,
5. move secondary visuals to appendix,
6. skip visuals that are dense, redundant, or weakly tied to a slide claim.

## Scoring dimensions

Each candidate is scored on a 0 to 1 scale using lightweight heuristics.

### Role fit
- method figures score well when the caption suggests architecture, pipeline, or overview,
- result tables score well when the caption suggests main results, comparison, or benchmark,
- ablation visuals score well when the caption suggests component removal or analysis,
- qualitative visuals score well when they clearly support a claim the talk will make.

### Evidence overlap
A candidate scores higher when its caption overlaps with extracted evidence terms from:
- the core idea,
- the method summary,
- the main results,
- the ablations,
- the limitations.

### Deck suitability
A candidate scores lower when it is likely to be:
- too dense for the main talk,
- repetitive,
- appendix-like implementation detail,
- or weakly connected to the core story.

## Recommended deck assignment

Use these defaults unless manual judgment disagrees.

- `main`: high score and directly supports a core slide.
- `appendix`: moderate score or useful only for follow-up questions.
- `skip`: low score, weak role fit, or dense low-yield evidence.

## Output fields

A scored candidate should include at least:
- `score`,
- `recommended_deck`,
- `story_role`,
- `why`,
- the original label, caption, page number, and type.

## Anti-patterns

Never:
- let a visually busy figure outrank a clearer one just because it is larger,
- treat all tables as main-deck visuals,
- keep a visual in the main deck when the slide already communicates the same point more clearly with text or a redrawn chart.

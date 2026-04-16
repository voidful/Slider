# Slide Quality Rubric

## Goal

Score the deck before finalizing.
Revise any slide that falls below threshold.

## Scale

Score each dimension from 0 to 2.
- 0 = fails clearly
- 1 = acceptable but weak
- 2 = strong

## Slide-level rubric

### 1. Faithfulness
- 2: fully grounded in the paper, claims and numbers are precise.
- 1: mostly grounded, minor ambiguity or context missing.
- 0: contains unsupported claim, vague metric, or invented implication.

### 2. Single-message clarity
- 2: one dominant takeaway is obvious in under five seconds.
- 1: slide has a main point but some competing content.
- 0: slide mixes multiple conceptual jumps or lacks a clear point.

### 3. Density control
- 2: text and visuals are balanced, easy to scan, projector-safe. No overflow. All text ≥18px (windowed).
- 1: a little crowded but still readable. Text stays within containers.
- 0: wall of text, tiny table, overloaded figure, or text overflows its container.

### 4. Visual hierarchy
- 2: title, focal point, and support structure are immediately legible. Semantic colors used correctly.
- 1: hierarchy exists but emphasis is weak or deck looks monochrome.
- 0: eye path is unclear, clutter dominates, or no color differentiation at all.

### 5. Evidence-role match
- 2: the UI format matches the rhetorical role. Evidence figures are visually dominant (≥65% area).
- 1: acceptable pattern but figure may be too small or not the visual protagonist.
- 0: wrong pattern, evidence figure is thumbnail-sized, or visual is absent when required.

### 6. Presenter usability
- 2: easy to speak over in 20 to 60 seconds, notes and transitions work, fullscreen fills viewport via stage scaling (identical layout to windowed, proportionally enlarged).
- 1: speakable but awkward pacing or fullscreen has issues.
- 0: requires reading the slide verbatim, fullscreen broken, or controls non-functional.

### 7. Overflow safety (NEW)
- 2: all text wraps cleanly, no content escapes its container, tables fit within the slide.
- 1: minor overflow on one element but content is still readable.
- 0: text overflows, title collides with body, table breaks layout, or captions cover figures.

### 8. Color and contrast
- 2: semantic colors used meaningfully. Result labels use green, limitation uses red, method uses accent blue. Not monochrome.
- 1: some color usage but inconsistent or too subtle.
- 0: deck is near monochrome (all gray/black) or uses distracting decorative colors.

## Deck-level rubric

### 1. Problem framing
- 2: explains why the problem matters early and concretely.
- 1: present but generic.
- 0: absent or delayed.

### 2. Core idea clarity
- 2: audience can understand the main insight before heavy detail.
- 1: idea is present but buried.
- 0: idea remains obscure.

### 3. Experimental logic
- 2: every major experiment validates a clear claim.
- 1: most experiments are interpretable.
- 0: experiments feel disconnected from claims.

### 4. Limitation honesty
- 2: scope and limitations are explicit and fair.
- 1: limitations exist but are shallow.
- 0: deck oversells or hides obvious weaknesses.

### 5. UI coherence
- 2: consistent style, semantic colors used across the deck, interactions work including fullscreen with stage-consistent scaling.
- 1: mostly coherent with a few mismatches.
- 0: inconsistent style, fullscreen broken, or monochrome output.

### 6. Editability
- 2: slide content is structured and easy to revise.
- 1: workable but mixed with too much layout detail.
- 0: content is scattered or overly hardcoded.

### 7. Visual prominence coherence (NEW)
- 2: all evidence figures are visually dominant on their slides (60-75% area).
- 1: most figures are appropriately sized.
- 0: evidence figures are thumbnail-sized or hidden in corners.

## Thresholds

### Slide threshold
Each core slide should score at least 12 out of 16 (8 dimensions × 2).
Any slide with a 0 in faithfulness, single-message clarity, overflow safety, or evidence-role match must be revised.

### Deck threshold
The full deck should score at least 12 out of 14 across the seven deck dimensions.
Editability and UI coherence must not be 0.

## Revision priorities

If a slide fails, revise in this order:
1. fix text overflow and layout breakage,
2. remove unsupported claims,
3. simplify to one message,
4. add semantic color (fix monochrome),
5. increase figure size to ≥65%,
6. reduce density,
7. improve visual hierarchy,
8. replace the UI pattern if needed,
9. fix fullscreen behavior,
10. tighten speaker notes.

## Fast final checklist

Before final output, confirm:
- every slide has one message,
- every result slide uses `--positive` color for gains,
- every limitation slide uses `--negative` color and background,
- no text overflows its container,
- figures are ≥65% of content area on evidence slides,
- fullscreen fills the viewport correctly,
- at least one slide states limitations clearly,
- the deck is not monochrome.

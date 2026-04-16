# Reading Comfort Rubric

This rubric defines measurable comfort dimensions for research presentations.
The audit script `audit_design_comfort.py` reads this spec.

---

## Purpose

"Comfort" is not subjective when decomposed correctly. A comfortable slide deck has:
- clear visual hierarchy (you know where to look),
- consistent rhythm (your eye moves predictably),
- appropriate occupancy (content fills the space without crowding),
- layout stability (same appearance in all display modes),
- visual restraint (decoration supports content, never competes).

---

## Dimensions

### 1. Hierarchy Clarity (0–2)

Does each slide have one obvious focal point?

| Score | Criteria |
|:---|:---|
| 2 | Title prominence ratio ≥ 2× body text. One dominant region. Evidence is the visual protagonist on evidence slides. Caption is clearly subordinate. |
| 1 | Hierarchy exists but emphasis is weak — title and body are similar size, or two competing focal points. |
| 0 | No clear focal point. Multiple elements fight for attention (cards-on-cards). Title is the same size as body. |

**What to check:**
- Title font-size ÷ body font-size ≥ 2
- Evidence slides: largest visual element ≥ 65% of content area
- Caption font-size ≤ body font-size (should be 14–16px max)
- No more than 1 dominant element per slide

---

### 2. Rhythm (0–2)

Does the deck have consistent spatial patterns?

| Score | Criteria |
|:---|:---|
| 2 | Top margin is consistent across slides. Inter-block spacing is stable (± 4px). Line lengths are in the 45–65ch range. Paragraph density is ≤ 4 bullets per slide. |
| 1 | Mostly consistent but 2–3 slides deviate. Some spacing jumps. |
| 0 | Random spacing. Some slides are dense, others sparse. No consistent margin pattern. |

**What to check:**
- Slide padding is consistent across all slides
- Body text `max-width` is set (≤ 56ch default)
- No more than 4 bullet points per slide
- Each bullet ≤ 15 words

---

### 3. Occupancy (0–2)

Does content appropriately fill the slide canvas?

| Score | Criteria |
|:---|:---|
| 2 | Content height utilization is 55–85% of the canvas. Left/right weight is balanced. Whitespace ratio is 25–50% (not empty, not cramped). |
| 1 | Slightly under-filled (content < 50%) or over-filled (whitespace < 15%). |
| 0 | Content is a small island (< 35% utilization) or overflows. Center-collapse anti-pattern. |

**What to check:**
- Figure on evidence slides: ≥ 65% of content area
- Hero slides (title, takeaway) are exempt — intentional emptiness is fine
- Non-hero slides should use ≥ 55% of vertical space

---

### 4. Stability (0–2)

Does the slide look identical across display modes?

| Score | Criteria |
|:---|:---|
| 2 | Zero visual drift between windowed and fullscreen. Same text wrapping, alignment, and proportions. Stage-consistent model verified. |
| 1 | Minor differences (e.g., sub-pixel rendering, anti-aliasing). |
| 0 | Content reflows. Text wrapping changes. Alignment shifts. Viewport-unit typography detected. |

**What to check:**
- No `vh`/`vw` units in slide content CSS
- `scaleDeck()` uses `transform: scale()` in all modes
- No `transform: none` in fullscreen
- No `width: 100vw` or `height: 100vh` on the deck

---

### 5. Restraint (0–2)

Does the visual decoration support rather than compete with content?

| Score | Criteria |
|:---|:---|
| 2 | ≤ 3 distinct accent colors across the deck. ≤ 2 surface styles (background variants). Minimal animations. Zero anti-pattern hits. |
| 1 | 4–5 accent colors. 3 surface styles. Some over-accenting. |
| 0 | Mood roulette. Over-accenting. Cards-on-cards. App-shell. Every slide looks different. |

**What to check:**
- Count distinct hue values in all CSS color declarations
- Count distinct background values across slides
- Count elements with accent borders/shadows per slide
- Check for anti-patterns from [research-slide-anti-patterns.md](research-slide-anti-patterns.md)

---

## Scoring

### Slide-Level

Each slide is scored on dimensions 1–3 and 5 (stability is deck-level).
Slide score = sum of applicable dimension scores (0–8).

**Threshold:** Each slide should score ≥ 5/8.
Any slide with a 0 in hierarchy or occupancy must be revised.

### Deck-Level

The full deck is scored on all 5 dimensions (0–10).

**Threshold:** Deck should score ≥ 7/10.
Stability must be 2 (non-negotiable with stage model).

---

## Severity Labels

| Severity | Meaning | Action |
|:---|:---|:---|
| P1 | Must fix before delivery | Blocks final output |
| P2 | Should fix | Recommend revision |
| P3 | Nice to fix | Optional improvement |

---

## Output Format

```
COMFORT AUDIT — deck.html
─────────────────────────
slide-04: P1: hierarchy — equation region has no dominant element (cards-on-cards)
slide-07: P2: restraint — 4 accent borders on single slide (over-accenting)
slide-11: P1: occupancy — figure occupancy 42% < 65% minimum for result slide
slide-14: P1: stability — viewport-unit leak: font-size uses vh

Score: 14/20 (hierarchy: 2, rhythm: 2, occupancy: 1, stability: 2, restraint: 1)
Status: NEEDS_REVISION (2 P1 findings)
```

# Page-Role → Layout Family Binding

Same type of content should use the same visual grammar.
This binding table constrains the LM's layout choices to ensure deck cohesion.

## Why this exists

Comfort comes from predictability. When the audience sees a result slide, they should already know where to look. When the presenter switches to a limitation slide, the visual shift should be meaningful, not random. Binding page roles to layout families gives the deck a visual language that the audience learns within the first 3 slides.

---

## Binding Table

| Page Role | Layout Family | Visual Signature | Max Text Density |
|:---|:---|:---|:---|
| `title`, `hook` | **hero** | Single focal point, centered or left-heavy, dramatic whitespace | ≤40 words |
| `takeaway`, `closing` | **distilled-close** | Clean, forward-looking, single message, optional callback figure | ≤50 words |
| `problem`, `gap`, `method-detail` | **editorial-two-zone** | Title + evidence block or callout, editorial feel | ≤60 words |
| `limitation` | **editorial-two-zone** | Title + limitation block with negative semantic color | ≤60 words |
| `contribution` | **editorial-two-zone** | Hero text + numbered sub-contributions | ≤60 words |
| `method-overview`, `pipeline`, `architecture` | **figure-dominant** | Figure ≥65% area, text secondary, annotations optional | ≤40 words |
| `objective`, `theory`, `algorithm` | **equation-panel** | Equation centered in accent block, explanation below | ≤50 words |
| `main-result`, `secondary-result`, `ablation`, `analysis` | **evidence-compare** | Table or chart dominant, key row/value highlighted | ≤40 words |
| `qualitative` | **gallery** | Visual grid (2×2 or 3×2), minimal text labels | ≤30 words |
| `future-work` | **distilled-close** | Clean list or forward-looking statement | ≤50 words |

---

## Layout Family Specifications

### hero

- **Structure:** label + hero-text (or title) + optional subtitle + optional single metric
- **Constraint:** Single focal point. No multi-column. No cards. No figure grids.
- **Whitespace:** Content occupies ≤50% of vertical space (intentional dramatic emptiness)
- **Allowed variations:** dark atmosphere, teaser figure background, pull-quote style

### editorial-two-zone

- **Structure:** label + title + content block (callout, bullet list, or comparison)
- **Constraint:** Exactly two visual zones: header zone + content zone. No third column.
- **Whitespace:** Content starts in upper third, fills down naturally
- **Allowed variations:** side-by-side comparison (2 columns within content zone), accent callout, numbered list

### figure-dominant

- **Structure:** label + title + figure (≥65% area) + optional 1–2 bullet annotations
- **Constraint:** Figure is always the visual protagonist. Text must not compete.
- **Whitespace:** Figure gets the center; text is subordinate (above or beside)
- **Allowed variations:** full-bleed figure with overlaid labels, figure + timeline flow, figure + callout boxes

### equation-panel

- **Structure:** label + title + equation block (centered, accent background) + plain-language explanation
- **Constraint:** Every equation must have a nearby plain-language explanation. If the paper has no explicit equation, keep the same family but replace the equation with the training-signal summary.
- **Whitespace:** Generous padding around equation block
- **Allowed variations:** term-by-term annotation grid, equation + intuitive diagram, hero-text insight + small equation

### evidence-compare

- **Structure:** label + title + table/chart (dominant) + optional callout with key takeaway
- **Constraint:** Data is the protagonist. Highlight the key row/value with semantic positive color.
- **Whitespace:** Table gets ≥65% of content area
- **Allowed variations:** hero-number + supporting grid, table + annotated figure, side-by-side tables

### gallery

- **Structure:** label + title + visual grid (2×2, 3×2, or equivalent) + minimal labels
- **Constraint:** Visuals dominate. Text labels are ≤14px captions. No body paragraphs.
- **Whitespace:** Grid fills the content area
- **Allowed variations:** side-by-side comparison (ours vs baseline), before→after pairs, quote blocks for NLP

### distilled-close

- **Structure:** label + hero-text or title + optional bullets + optional callback figure thumbnail
- **Constraint:** Clean and forward-looking. No dense content. No data tables.
- **Whitespace:** Generous. The slide should feel like a breath.
- **Allowed variations:** quote-style pull, callback with method figure, forward-looking statement

---

## Enforcement Rules

1. **One family per role.** The LM must select the family from the binding table. Creative variations happen *within* the family, not by switching families.
2. **Cross-slide consistency.** All slides of the same role must use the same layout family. If slide 5 is `main-result` → `evidence-compare`, then slide 8 (also `main-result`) must also use `evidence-compare`.
3. **Mood shifts ≠ family shifts.** Atmosphere overrides (dark, warm, cool) can change the feel of a slide without changing its layout family.
4. **Override escape hatch.** If a slide's content genuinely cannot fit its assigned family (e.g., a method slide with no figure), the LM may use a different family but must add a `layout_override_reason` field to the slide data.

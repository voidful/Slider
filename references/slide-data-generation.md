# Slide Data Generation

## Goal

Create a structured slide plan from evidence and visual data before rendering any UI code.

## Preferred workflow

Use this sequence for a new paper. Reuse existing evidence and visual assets for revisions. The generator is an optional heuristic scaffold; an agent can author the same schema directly.

1. Run `scripts/extract_paper_evidence.py <source>` to get evidence.
2. Run `scripts/find_visual_evidence.py <source>` and `scripts/score_visual_candidates.py` for visuals.
3. Run `scripts/generate_slide_data.py --evidence evidence.json --visuals visuals.json --mode json` to create the plan.
4. Revise the plan manually.
5. Only then render HTML or React.

## Slide data schema

Each slide object must include:

### Required fields
| Field | Type | Description |
|:---|:---|:---|
| `id` | string | Unique identifier |
| `title` | string | Argumentative title stating a claim, not a section name |
| `purpose` | string | Rhetorical role of this slide |
| `keyMessage` | string | The one thing the audience must remember |
| `speakerNote` | string | Speaking cues, evidence source, visual rationale |

### Layout mode (choose one)

**Option A — Classic layout** (backwards compatible):
| Field | Type | Description |
|:---|:---|:---|
| `layout` | string | Layout pattern (cover, method-overview, split, etc.) |

**Option B — Content blocks** (preferred, LM has full creative freedom):
| Field | Type | Description |
|:---|:---|:---|
| `contentBlocks` | array | Ordered array of content block objects |
| `gridTemplate` | string | Optional CSS Grid template for custom placement |
| `atmosphere` | string | Optional atmosphere modifier (warm, cool, dramatic, minimal, editorial) |
| `customCSS` | object | Optional per-slide CSS overrides |

When `contentBlocks` is present, it takes priority over `layout`. When absent, `layout` is used.

### Content block schema

Each item in `contentBlocks[]`:

| Field | Type | Description |
|:---|:---|:---|
| `type` | string | Block type (see catalog below) |
| `content` | any | Content payload — text string, object, or array depending on type |
| `placement` | string | Optional placement hint: "auto", "left", "right", "center", "full", "overlay" |
| `style` | string | Optional style variant: "default", "accent", "positive", "negative" |
| `emphasis` | string | Optional emphasis level: "primary", "secondary", "background", "dramatic" |
| `explanation` | string | Optional explanation text (used by equation blocks) |
| `attribution` | string | Optional attribution text (used by quote blocks) |

### Block type catalog

| Type | Content format | Description |
|:---|:---|:---|
| `label` | string | Section label (uppercase kicker) |
| `heading` | string | Slide title |
| `hero-text` | string | Large dramatic text for key claims |
| `text` | string | Body text paragraph |
| `bullets` | string[] | Bullet list items |
| `figure` | `{src, caption, alt, placeholder}` | Paper figure or placeholder |
| `metric` | `{label, value, detail, delta}` | Single metric card |
| `metric-grid` | metric[] | Grid of metric cards |
| `table` | `{headers, rows, caption}` | Data table (rows: `{cells[], highlight?, best?}`) |
| `equation` | string | LaTeX or text equation |
| `callout` | string | Highlighted insight box |
| `quote` | string | Pull quote |
| `comparison` | `{leftLabel, left, rightLabel, right}` | Side-by-side comparison |
| `timeline` | string[] | Process/pipeline steps |
| `spacer` | — | Intentional whitespace |
| `custom-html` | string | Raw HTML escape hatch (use sparingly) |

### Evidence fields
| Field | Type | Description |
|:---|:---|:---|
| `claim` | string | The specific claim this slide makes |
| `evidenceType` | enum | `figure` / `table` / `equation` / `qualitative` / `reconstructed-diagram` / `metric-cards` |
| `evidenceSource` | string | Paper figure/table/section reference |
| `mustIncludeVisual` | boolean | If true, this slide must not render as text-only |
| `visualRequirement` | enum | `paper-crop-required` / `redraw-allowed` / `table-redraw-allowed` / `any-visual` — specifies what type of visual satisfies this slide |
| `visualSourceType` | enum | `figure` / `table` / `redraw` / `placeholder` — what was actually bound |
| `visualBinding` | string or object | Exact reference to the visual asset (e.g., "Figure 3", "Table 2") |
| `visualFallbackStrategy` | enum | `crop` / `redraw` / `reconstruct` / `omit` |

### Planning fields
| Field | Type | Description |
|:---|:---|:---|
| `densityBudget` | number | Target word count on the slide face. The renderer warns above budget × 1.2; inspect readability and revise crowded content. |
| `audienceGoal` | string | What the audience should understand after this slide |
| `appendixCandidate` | boolean | Whether this content could move to appendix |
| `fidelityRisk` | string | Any risk of misrepresenting the paper |
| `whyNow` | string | Why this slide appears at this position |
| `whyThisVisual` | string | Why this particular visual was chosen |
| `revealOrder` | string[] | Optional semantic targets revealed one presenter beat at a time; use only when order improves comprehension. See [progressive builds](progressive-builds.md). |

### Motion fields (optional)
Deck motion belongs in `meta.motion` (preset name or object) or the renderer's `--motion` flag. Per-slide fields override it. See [motion graphics](motion-graphics.md).

| Field | Type | Description |
|:---|:---|:---|
| `transition` | enum | Transition into this slide: `none`, `fade`, `rise`, `push`, `wipe`, `curtain`, `circle`, `doors`, `slices`, `zoom`, `glitch`, `pixel`, `morph` |
| `motion` | string or object | Preset (`none`, `subtle`, `editorial`, `kinetic`, `cinematic`, `digital`) or overrides such as `{"title": "scramble", "data": "none"}` |
| `accent` | boolean | Force (`true`) or suppress (`false`) the deck's stronger accent transition |
| `morph` | object | Morph ids by build target, such as `{"visual": "fig-overview"}`. With `"transition": "morph"` on the next slide, an element carrying the same id there flies into place. Same figures, metric labels, and titles pair without ids. |

### Review and guide fields (optional)
The HTML editor writes these; agents may read and update them.

| Field | Type | Description |
|:---|:---|:---|
| `comments` | array | Review comments: `{id, path, text, createdAt, resolved}`. `path` names the commented field (`title`, `bullets.1`, `contentBlocks.2.content`); empty means the whole slide. To apply one, edit that field, keep the claim and numbers unless the comment asks otherwise, and set `resolved: true`. |
| `guideIgnore` | string[] | Guide and wording rule ids dismissed for this slide, such as `["SC-R05-topic-title"]`. `scripts/audit_slide_copy.py` and the renderer honor it. |

Deck-level `meta.brief` holds the talk brief the Guide and presenter timer read: `{"minutes": 12, "venue": "ACL oral", "audience": "NLP researchers", "takeaway": "One sentence with its evidence", "language": "zh-TW"}`. Its optional `guideIgnore` dismisses deck-level checks such as `SC-P04-spacing`. See [guided deck workflow](guided-deck-workflow.md).

### Optional content fields (classic mode)
| Field | Type | Description |
|:---|:---|:---|
| `subtitle` | string | Supporting context line |
| `bullets` | array | ≤ 4 bullets, each ≤ 15 words |
| `metrics` | array | Key numbers with metric, value, dataset, delta |
| `equation` | string | LaTeX or plain-text equation |
| `figureLabel` | string | Label for figure placeholder |
| `section` | string | Navigation section label |
| `appendix` | boolean | Whether this is an appendix slide |

## Layout types (classic mode)

These layout patterns remain for backwards compatibility:
- `cover` — title slide
- `problem-framing` — large claim + context
- `prior-gap` — side-by-side limitation
- `contribution` — headline + sub-contributions
- `method-overview` — dominant figure + minimal text
- `objective` — equation + explanation + diagram
- `experiment-headline` — section transition
- `result-table-focus` — focused table with highlights
- `ablation` — compact comparison
- `qualitative-evidence` — side-by-side examples
- `limitations` — caution block
- `takeaway` — closing statement
- `split` — two-panel layout
- `metrics` — metric cards
- `diagram` — generic diagram placeholder

## Content blocks mode (preferred)

When using `contentBlocks[]`, the LM composes each slide freely from primitives. The LM should:

1. **Analyze the content**: What is the primary evidence for this slide? What supports it?
2. **Choose blocks**: Select the block types that best communicate the content.
3. **Decide arrangement**: Use `placement` hints or `gridTemplate` for custom layout.
4. **Set atmosphere**: Optionally use `atmosphere` for per-slide mood.
5. **Check quality**: Ensure the composition meets density budget and readability requirements.

### Examples

```json
// Method slide with dominant figure
{
  "id": "method",
  "title": "Cross-attention bridges modalities",
  "contentBlocks": [
    { "type": "label", "content": "Method", "style": "accent" },
    { "type": "heading", "content": "Cross-attention bridges modalities without shared encoding" },
    { "type": "figure", "content": { "src": "fig3.png", "caption": "Figure 3 — Cross-modal attention" }, "emphasis": "primary" }
  ],
  "gridTemplate": "auto / 35% 65%"
}

// Dramatic result with one big number
{
  "id": "main-result",
  "title": "State-of-the-art WER",
  "contentBlocks": [
    { "type": "label", "content": "Result", "style": "positive" },
    { "type": "heading", "content": "First sub-3% WER without external LM" },
    { "type": "metric", "content": { "value": "2.87%", "label": "WER", "detail": "LibriSpeech test-clean", "delta": "positive" }, "emphasis": "dramatic" },
    { "type": "callout", "content": "Reduces WER by 14% relative vs. previous SOTA", "style": "positive" }
  ],
  "atmosphere": "minimal"
}
```

## Story arc

Default generator backbone for a standard talk:
1. Title
2. Hook
3. Problem
4. Gap
5. Contribution
6. Method overview
7. Method detail
8. Objective / training signal
9. Setup
10. Main result
11. Secondary result / deep dive
12. Analysis
13. Limitations
14. Future work
15. Takeaway

Optional evidence insertions:
- Add one `qualitative` slide after `secondary-result` when a distinct high-scoring qualitative visual exists.
- Add one `ablation` slide after `analysis` when a distinct mechanism-validating visual exists.
- Appendix slides stay separate. The user's timing and slide count govern the main deck; the generator backbone is not a minimum.

Generator defaults:
- Prefer `contentBlocks[]` for `hook`, `gap`, `method-detail`, `setup`, `analysis`, and `future-work`.
- Prefer classic evidence layouts for `method-overview`, `objective`, `main-result`, `secondary-result`, `qualitative`, `ablation`, `limitations`, and `takeaway`.
- Attach `pageRole`, `audienceGoal`, `densityBudget`, and `whyNow` to every slide before rendering.

## Validation rules

Before rendering:
- Every slide with any `visualRequirement` must have a matching `visualBinding` and `visualSourceType`.
- If `visualRequirement` is `paper-crop-required`, `visualSourceType` must be `figure`. Binding a `table`, `redraw`, or `placeholder` violates this.
- No two consecutive slides may have the same `claim`.
- At least one Priority A visual must be bound to a main-deck slide.
- Choose main-deck length to fit the requested timing and count. The standard scaffold is only a starting point.
- Content blocks mode: every slide must have at least one block with `emphasis: "primary"` or a heading block.
- **Figure legibility:** If a slide combines metrics (≥3 cards) and a figure, verify the figure will have ≥200px rendered height. If not, split into a metrics-only slide and a dedicated figure slide.
- **Visual coverage target**: A figure-rich empirical talk often benefits from real visuals on at least half its content slides. Adapt to the source, paper type, and brief; placeholders never count.
- **Density review:** Count display-facing words, excluding notes. Above `densityBudget × 1.2`, inspect and simplify or split crowded content. Actual clipping or unreadable evidence requires correction regardless of word count.
- **Stack-layout guidance:** For contentBlocks in vertical stack layout (no gridTemplate):
  - Prefer at most 4 visible blocks (excluding `label` and `spacer`).
  - Avoid: `table` + `metric-grid` + `text` on one slide.
  - Avoid: `figure` + `metric-grid` (≥3 items) + `text` on one slide.
- **Visual binding manifest**: A summary table helps inspect complex evidence bindings; for a simple deck, the slide JSON may already contain enough information:

  | Slide | visualRequirement | visualSourceType | Visual Source | Satisfied? |
  |:---|:---|:---|:---|:---|
  | s01 (cover) | — | — | — | exempt |
  | s02 | paper-crop-required | figure | Figure 1 | ✅ |
  | s03 | — | — | — | n/a |
  | s06 | paper-crop-required | placeholder | — | ❌ VIOLATION |
  | ... | ... | ... | ... | ... |

  Inspect whether the selected visuals support the talk. Do not add unrelated images to meet a numerical ratio.
  Any `visualRequirement: paper-crop-required` slide marked ❌ must be fixed before rendering.

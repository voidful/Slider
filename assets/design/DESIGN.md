# DESIGN.md — Research Presentation Design System

This file is the design control plane. Both the generator and the auditor read this file.
Every visual decision in the generated slides must be traceable to a rule or primitive here.

## Design philosophy

"Research slides are evidence displays with narrative pacing.
The LM has creative freedom to compose each slide to best communicate its specific content.
Quality gates protect readability; they do not dictate layout."

### Principles

1. **Evidence is the protagonist.** Paper figures, tables, and data dominate their slides.
2. **One message per slide.** Every slide earns its place through a single clear claim.
3. **Compose, don't template.** Use primitives to build the best layout for each slide's content — not a fixed grid.
4. **Atmosphere adapts to content.** A paper on visual generation deserves different slide energy than a paper on optimization theory.
5. **Quality gates are non-negotiable.** Overflow protection, fullscreen behavior, projector safety, and semantic color are always enforced.

### Balance target

The deck should balance four qualities without letting any one of them dominate:

- **Clarity first.** The audience must know where to look within seconds.
- **Concision second.** If a slide feels tight, remove content before shrinking type.
- **Style as support.** The deck may feel premium and modern, but never generic or trend-chasing.
- **Motion as accent.** Movement is a finishing pass, not the primary communication layer.

### Deck-level direction

Lock the deck as a presentation before polishing individual slides:

1. **Choose one primary direction.** Most slides should share one visual family so the deck feels authored, not randomized.
2. **Use contrast deliberately.** Reserve stronger mood shifts for opener, climax, limitation turn, or close.
3. **Default to static clarity.** Motion is a second pass after the static deck already works.
4. **Keep UI chrome quiet.** Controls, chips, cards, and overlays support the talk; they must not make the deck feel like an app.

---

## Non-negotiable quality gates

These rules override ALL other guidance. They cannot be relaxed by creative decisions.

### Overflow protection (MANDATORY)
- All text containers must set `overflow-wrap: break-word` and `word-break: break-word`.
- Titles must use `text-wrap: balance` and `hyphens: auto`.
- Titles must use clamped font size: `clamp(1.75rem, 3vw, 2.5rem)` to prevent overflow.
- Body text must have `max-width` set (56ch default).
- Shrinkable flex and grid children must set `min-width: 0` or `min-height: 0` so long content can wrap instead of forcing overflow.
- Metric labels must set `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`.
- Table cells must set `overflow-wrap: break-word` with `table-layout: auto`.
- Captions must set `text-overflow: ellipsis`.
- No text may overflow its container. If it does, reduce content, change layout, or split slides.

### Fullscreen behavior (MANDATORY)

Fullscreen uses the **stage-consistent scaling model**. The deck keeps the same fixed 1200×675 coordinate system in all modes. Fullscreen only changes the `transform: scale()` factor. See [fullscreen-contract.md](../../references/fullscreen-contract.md) for the full specification.

- The deck always renders at **1200px × 675px**. Fullscreen computes `scale(min(viewW/1200, viewH/675))`.
- **No viewport-unit typography** (`vh`/`vw`) inside slide content. All font sizes, padding, and gaps use `rem`, `px`, `em`, or `clamp()`.
- **No fullscreen-specific layout overrides.** No `justify-content` changes, no `height:100vh`, no `transform:none`.
- Fullscreen removes visual chrome: `border:none; border-radius:0; box-shadow:none`.
- `body.fs-active` provides a black background behind the scaled deck.
- Controls auto-hide in fullscreen (opacity:0, show on hover near bottom).
- Support both button-triggered (`toggleFullscreen()`) and keyboard-triggered (`F` key).
- Listen to `fullscreenchange` and `webkitfullscreenchange` events.
- **Composition stability guarantee:** A presenter rehearses in windowed mode and presents in fullscreen with zero visual drift.

### Projector readability (MANDATORY)
These slides are projected for a live audience. **ALL text must be large, bold, and readable from the back of the room.** Err on the side of TOO LARGE rather than too small.

Because the deck uses stage-consistent scaling, all font sizes are defined once for the 1200×675 canvas. The `transform: scale()` ensures they appear proportionally larger on bigger screens.

- **Minimum font sizes** (1200×675 canvas) — these are the absolute floor:
  - Labels / section kickers: 15px, weight 700, uppercase
  - Body text / bullets: `clamp(1.1rem, 1.6vw, 1.3rem)` → ~18–21px
  - Callout text: `clamp(1.1rem, 1.6vw, 1.3rem)` → ~18–21px
  - Table cells: 18px
  - Table headers: 18px, weight 600
  - Metric labels: 16px
  - Metric detail: 15px
  - Captions / evidence notes: 14px
  - **No text smaller than 14px anywhere in the deck.**
- **Titles**: `clamp(2rem, 3.5vw, 2.8rem)` → ~32–45px
- **Hero text**: `clamp(2.5rem, 4vw, 3.5rem)` → ~40–56px
- **Metric values**: 32–52px, weight 800
- **Hero numbers**: 52–80px, weight 900
- Projector-safe contrast ratios (at least 4.5:1 for body text).

### Semantic colors (MANDATORY)
The deck must NOT be monochrome. These tokens must be defined and used:

| Token | Default | CSS var | Semantic role |
|:---|:---|:---|:---|
| Accent | `#2563eb` | `--accent` | Method/approach, active states, progress, bullet dots |
| Accent bg | `rgba(37,99,235,0.07)` | `--accent-bg` | Equation blocks, accent surfaces |
| Positive | `#059669` | `--positive` | Key results, positive deltas, "ours" highlights |
| Positive bg | `rgba(5,150,105,0.07)` | `--positive-bg` | Result labels, best-row highlights |
| Negative | `#dc2626` | `--negative` | Limitations, warnings, negative deltas |
| Negative bg | `rgba(220,38,38,0.07)` | `--negative-bg` | Limitation blocks |
| Neutral | `#6b7280` | `--neutral` | Baselines, secondary annotations |

The `applyTheme()` function must set ALL tokens including `*-bg` variants.

---

## Color palette

### Base palette (Editorial default)
- Background: `#f5f5f4`, `#fafafa`, or another restrained light editorial surface.
- Frame: `#ffffff` or a lightly frosted surface such as `rgba(255,255,255,0.72)`.
- Text primary: `#1a1a2e` (light mode) or `#ffffff` (dark mode).
- Text secondary / muted: `#4a4a6a` (light mode) or `#cbd5e1` (dark mode).
- Border/divider: `rgba(226, 232, 240, 0.4)`.

### Color discipline & Atmosphere (LM freedom)
- Use semantic tokens rigorously, but keep color subordinate to hierarchy and evidence.
- The deck should feel premium and intentional, not bland, but also not like a mood board. Restraint is part of polish.
- Glass, gradients, and texture are supporting tools. Apply them where they clarify separation or narrative emphasis.
- Adapt palette and surface treatment to the domain, but keep one primary direction across most slides.
- Treat loud effects as accents. If every slide shouts, none of them do.
- Do not force accent rotation across acts. Semantic `positive` / `negative` plus one primary accent are usually enough.

---

## Content discipline

### Every element earns its place

- Do not add filler content to fill empty space. If a slide feels empty, solve with layout and whitespace — not by inventing bullets, badges, or decorative icons.
- Do not add decorative icons, progress indicators, or status badges that don't communicate research content.
- One thousand no's for every yes: each bullet, metric card, and annotation must directly support the slide's `keyMessage`. If it doesn't, remove it.
- Avoid "data slop" — unnecessary numbers, stats, or metrics that don't serve the narrative. A single powerful number is worth more than five mediocre ones.

### Less is more

- If choosing between "add more content" and "use better composition", always choose composition.
- An empty slide with one powerful figure is better than a busy slide with three weak cards.
- Whitespace is a design choice, not a bug. It signals confidence and gives the audience breathing room.
- When a slide feels crowded, remove content — never reduce spacing or shrink type.

### Remove before adding

- When preparing slides, delete marginal content before adding decoration.
- Every visual element should have a `whyThisElement` justification in planning.
- If you cannot articulate why an element is on the slide in one sentence, it should not be there.

---

## Typography scale

**Presentation principle: all text must be readable from the back of a conference room.** These sizes are for the fixed 1200×675 canvas. Because the deck uses stage-consistent scaling, the same sizes apply in fullscreen — `transform: scale()` handles the enlargement.

| Role | Size (windowed) | Weight | Usage |
|:---|:---|:---|:---|
| Slide title | 32–45px | 700 | One per slide, argumentative phrasing |
| Subtitle | 20–24px | 500 | Optional, supporting context |
| Body | 18–22px | 400 | Bullets, descriptions, annotations |
| Caption | 14–16px | 400 | Figure labels, source attribution |
| Equation | 24–32px | 400 | Centered, with surrounding whitespace |
| Metric value | 36–56px | 800 | Key numbers, colored by delta |
| Hero number | 56–84px | 900 | Dramatic single-stat emphasis |
| Quote | 24–28px | 300/italic | Pull quotes, key insights |
| Label | 14–16px | 700 | Section labels, uppercase kickers |

### Typography discipline
- Use argumentative titles: "Masked prediction forces broader contextual reasoning" not "Method."
- Never use all-caps for slide titles (labels may be uppercase).
- Limit body text to ≤ 4 bullet points per slide.
- Each bullet ≤ 15 words.
- Use `text-wrap: pretty` on body text and bullets for improved line breaking. Keep `text-wrap: balance` on titles.
- Use `font-variant-numeric: tabular-nums` on all numeric content: metric values, table cells, data labels.

---

## Composable primitives catalog

These are the building blocks the LM uses to compose slides. Each primitive is a CSS class that can be combined freely.

### Region primitives (placement)

| Primitive | Description |
|:---|:---|
| `.region-full` | Content spans the entire slide content area |
| `.region-left` | Left column (default 40%, adjustable via `--col-size`) |
| `.region-right` | Right column (default 65%, adjustable) |
| `.region-center` | Horizontally and vertically centered |
| `.region-top` | Pinned to top of content area |
| `.region-bottom` | Pinned to bottom of content area |
| `.region-inset` | Smaller centered box with generous margin |

### Content primitives

| Primitive | Description |
|:---|:---|
| `.hero-text` | Large, dramatic text block for key claims |
| `.evidence-frame` | Bordered frame for paper figures/tables — the visual protagonist |
| `.data-table` | Styled result/comparison table |
| `.metric-card` | Single metric with label, value, detail |
| `.metric-grid` | Grid of metric cards (auto-fit) |
| `.equation-display` | Centered equation with accent background |
| `.comparison-panel` | Side-by-side "Ours vs Baseline" panels |
| `.callout-box` | Highlighted insight or annotation |
| `.quote-block` | Pull quote with attribution |
| `.bullet-list` | Styled bullet list with accent dots |
| `.annotation-layer` | Overlay annotations on visuals |
| `.timeline-flow` | Horizontal process/pipeline visualization |
| `.code-block` | Monospaced code display |
| `.limitation-block` | Warning-styled content with negative accent |
| `.spacer` | Intentional whitespace between blocks |

### Composition helpers

| Helper | Description |
|:---|:---|
| `.stack` | Vertical flex stack with consistent gaps |
| `.row` | Horizontal flex row |
| `.grid-2` | Two-column CSS grid |
| `.grid-3` | Three-column CSS grid |
| `.grid-auto` | Auto-fit responsive grid |
| `.overlay` | Position content over another element |
| `.bleed` | Content extends to slide edges (no padding) |
| `.pin-bottom` | Pin content to bottom of slide |

### Emphasis modifiers

| Modifier | Effect |
|:---|:---|
| `.emphasis-primary` | Full opacity, prominent sizing |
| `.emphasis-secondary` | Reduced opacity, smaller sizing |
| `.emphasis-background` | Very subtle, supporting information |
| `.emphasis-dramatic` | Extra large, high contrast |

### Atmosphere modifiers (per-slide)

| Modifier | Visual effect |
|:---|:---|
| `.atmosphere-warm` | Slight warm-tinted background wash |
| `.atmosphere-cool` | Slight cool-tinted background wash |
| `.atmosphere-dramatic` | Darker background, white text, higher contrast |
| `.atmosphere-minimal` | Maximum whitespace, stripped to essentials |
| `.atmosphere-editorial` | Default — clean, restrained, academic |

---

## Layout composition guidelines

### LM decides layout

The LM should compose each slide by selecting appropriate primitives and arranging them. There are no mandatory layout templates. Instead:

1. **Analyze the slide content**: What is the primary evidence? What supports it?
2. **Choose an arrangement**: Which primitives best serve this content?
3. **Apply atmosphere**: Does this slide need dramatic emphasis or quiet clarity?
4. **Check quality gates**: Overflow, readability, color usage.

### Classic layouts (backwards compatible)

These layout strings still work in the `layout` field for backwards compatibility. When used, the renderer produces the same output as before:

- `cover`, `method-overview`, `split`, `diagram`, `result-table`, `result-table-focus`, `metrics`, `objective`, `qualitative-evidence`, `ablation`, `limitations`, `takeaway`

### Content-adaptive composition (preferred)

When using the `contentBlocks[]` system, the LM composes freely:

```
// Example: A method slide where the figure is the star
contentBlocks: [
  { type: "label", content: "Method", style: "accent" },
  { type: "heading", content: "Cross-attention bridges modalities without shared encoding", placement: "left" },
  { type: "figure", content: { src: "fig3.png", caption: "Figure 3 — Cross-modal attention module" }, placement: "right", emphasis: "primary" },
  { type: "annotation", content: "Q: text, K/V: audio", placement: "overlay-bottom-right" }
]

// Example: A dramatic result slide with one big number
contentBlocks: [
  { type: "label", content: "Result", style: "positive" },
  { type: "metric", content: { value: "+4.2%", label: "WER Reduction", detail: "LibriSpeech test-clean vs. baseline", delta: "positive" }, placement: "center", emphasis: "dramatic" },
  { type: "callout", content: "First method to break the 3% WER barrier without external LM", placement: "bottom-center" }
]
```

---

## Visual prominence rules

### Evidence figures
- Evidence figures should dominate their slide — suggested 60–75% of content area.
- The LM decides exact proportions based on figure complexity and supporting text needs.
- Never shrink a method figure to thumbnail size.
- If a slide contains too many figures, split into multiple slides instead of shrinking.

### Figure sizing
- Evidence-frame must use `flex:1 1 0; min-height:0; overflow:hidden` — never a fixed pixel `max-height`. The flex layout ensures the figure fills available space without overflowing the slide.
- Evidence-frame child `div` wrappers (e.g., SVG containers) must use `max-height:100%!important` to override any inline styles.
- Placeholder minimum height: 240px.
- Use `object-fit: contain` for paper figures — never crop research visuals.

### Table styling
- Clean row separators using `border-bottom: 1px solid var(--border)`.
- Header row: `var(--accent-bg)` background, `600` weight.
- Best result row: `var(--positive-bg)` background.
- Number alignment: right-aligned, tabular numerals.
- Minimum cell font size: 18px (stage-scaled to screen via `transform: scale()`).
- `overflow-wrap: break-word` on long cells.

---

## Layout grid and whitespace rhythm

- Slide container: 16:9 aspect ratio (1200 × 675 px reference).
- Safe margins: ≥ 48px on all sides (projector crop safety).
- Content area: the rectangle after margins.

### Whitespace rules
- ≥ 24px between the title block and the first content element.
- ≥ 16px between content blocks.
- ≥ 12px padding inside cards, tables, and figure frames.
- If a slide feels crowded, remove content — never reduce spacing.

---

## Surface hierarchy and depth

- Level 0: Slide background. Prefer restrained editorial surfaces by default.
- Level 1: Content cards and figure frames. Use light frosting or soft shadows only when they improve separation.
- Level 2: Highlighted items. Use semantic background at 8-12% opacity or a clean accent border.

### Depth discipline
- Blur is optional, not mandatory. Default to the lightest surface treatment that still separates the content.
- Use soft, diffused shadows sparingly.
- Premium should read as deliberate composition, not as maximum visual effect.

---

## Motion rules

- Start from a static deck that already feels clear and composed.
- Slide transitions may use short fades or slight upward motion (250–400ms).
- Entrance motion should prefer `transform` and `opacity`.
- Hover states are only for chrome and optional interactive helpers, not for core evidence.
- Ambient motion is optional and should appear on at most one or two rhetorical accent slides.
- Always respect `prefers-reduced-motion: reduce`.
- Never use `transition: all`.

### Required animation keyframes

```css
/* Slide entrance (MANDATORY on every slide transition) */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* Staggered content entrance */
@keyframes floatIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Usage: Apply .slide-enter to slide container (400ms) */
/* Apply .stagger-1 through .stagger-4 to successive elements (100ms–400ms delays) */
```

### Hover micro-animations

| Element | Hover effect | Timing |
|:---|:---|:---|
| Metric cards | `translateY(-4px)` + shadow bloom `0 12px 32px rgba(0,0,0,0.1)` | 250ms cubic-bezier(0.16, 1, 0.3, 1) |
| Timeline steps | `translateY(-3px)` + shadow `0 8px 24px rgba(0,0,0,0.08)` | 200ms cubic-bezier(0.16, 1, 0.3, 1) |
| Control buttons | `background: rgba(0,0,0,0.05)` | 150ms |
| Cards / panels | `translateY(-2px)` + shadow increase | 200ms |

### Background transitions

When navigating between slides with different moods, the background should transition smoothly:
- Duration: 500ms
- Property: `background`, `color`
- Timing: `ease`

### Motion prohibitions
- Do not use abrasive bounce or chaotic staggered delays that distract from presenting.
- Do not make the audience wait for data (keep entrance animations < 500ms).
- Do not animate layout, typography, or evidence scale as a substitute for better composition.

---

## Paper-domain atmosphere guidance

The LM should adapt the visual atmosphere to the paper's domain:

| Domain | Suggested atmosphere | Notes |
|:---|:---|:---|
| Computer Vision | Maximize visual space, larger figure frames, comparison grids | Let images speak |
| NLP / Language | Emphasize text examples, quote blocks, token visualizations | Text is the evidence |
| Speech / Audio | Spectrogram frames, waveform graphics, comparison panels | Audio-visual evidence |
| Systems / Architecture | Pipeline diagrams, performance charts, component breakdowns | Structure clarity |
| Theory / Math | Equation prominence, proof sketches, theorem blocks | Mathematical elegance |
| Biomedical | Careful data presentation, statistical rigor emphasis | Clinical clarity |
| Reinforcement Learning | Environment screenshots, reward curves, trajectory visualization | Show the agent |
| Generative Models | Before/after comparisons, sample grids, quality metrics | Show the outputs |

---

## Research-figure framing rules

- Paper figures are the visual protagonist. They must occupy the largest visual area on their slide.
- Text annotations around figures must be subordinate — smaller font, lighter weight.
- Never shrink a method figure to make room for decorative elements.
- If a figure has a white background, use a thin 1px border — not a heavy frame.
- If a figure has a dark background, invert the slide's local background to maintain contrast.

### Paper figure auto-embedding

For fully self-contained HTML output, paper figures must be embedded as base64 data URIs:

1. **Crop**: Use `scripts/export_pdf_visuals.py` to extract the figure from the PDF.
2. **Convert**: Encode the cropped image as base64.
3. **Embed**: Set `<img src="data:image/png;base64,...">` in the HTML.
4. **Slide data**: Set the `visual.src` field to the base64 data URI string.
5. **Confidence**: Annotate with `visual.confidence: "high" | "medium" | "low"` based on crop quality.

This ensures the presentation opens in any browser without external dependencies. The HTML file is the complete package.

---

## Speaker-note panel rules

- Hidden by default.
- Opens as a side panel — never overlays the slide.
- Font: 14px, line-height 1.5.
- Max-height 50% of slide, scrollable.

---

## Variety Without Mood Roulette

A research presentation should have pacing and contrast, but it must still feel like one authored deck.

### Variety rules

1. Consecutive slides should usually differ in purpose, evidence, or arrangement, but repetition is allowed when it improves comprehension.
2. A deck of 15+ slides should typically use **3-5 layout families**, not a single repeated shell and not a forced parade of new layouts.
3. Keep background treatments to **at most 3** across the full deck.
4. Keep surface styles to **at most 2** across the full deck.
5. Use one primary accent family plus semantic positive/negative states. Do not force accent rotation across acts.
6. Give each narrative act its own energy through spacing, evidence weight, and emphasis before reaching for a new mood.

### Layout variety checklist

For a 15–19 slide deck, this distribution is a useful target rather than a quota:

| Layout type | Min count | Example slides |
|:---|:---|:---|
| Cover / Hero | 1–2 | Title, Final takeaway |
| Split (text + figure) | 3–5 | Method, Qualitative, Prior work |
| Full-bleed figure | 1–3 | Key architecture diagram, Pipeline |
| Metrics / Data grid | 1–3 | Main results, Ablation |
| Comparison panel | 1–2 | Ours vs Baseline, Before/After |
| Editorial text | 1–2 | Limitations, Problem statement |
| Timeline / Flow | 0–2 | Method pipeline, Training procedure |
| Dramatic hero stat | 1–2 | Headline result, Key finding |

---

## Curated Mood Library

These moods are a toolbox, not a checklist. In most decks, one primary mood family plus one or two supporting contrasts is enough. Editorial or Minimal should carry the majority of explanatory slides; louder moods are for deliberate rhetorical turns.

### Mood 1 — Cinematic Dark
- **Background**: Deep radial gradient `radial-gradient(ellipse at 30% 50%, #1a1a3e 0%, #0a0a1a 100%)`
- **Animated background**: `cinematicPulse 12s ease-in-out infinite` — subtly shifts the radial focus point
- **Noise overlay**: SVG `feTurbulence` texture at `opacity: 0.03`, `mix-blend-mode: overlay`
- **Accent**: Electric cyan `#00d4ff` with glow `0 0 20px rgba(0,212,255,0.3)`
- **Text**: White `#f0f0f0` primary, `#b0b8c4` secondary. ALL text must have `text-shadow` for projector safety.
- **Surface**: `rgba(255,255,255,0.05)` with `backdrop-filter: blur(20px)` and glow border `box-shadow: 0 0 0 1px rgba(0,212,255,0.15), inset 0 1px 0 rgba(255,255,255,0.05)`
- **Best for**: Title slide, Teaser, Final takeaway, Hero statistics
- **Typography feel**: Bold, dramatic, extra spacing
- **Use sparingly**: Best as an opening or closing accent, not as the default for dense evidence slides.

### Mood 2 — Editorial Light
- **Background**: Warm off-white `#fafaf8` or subtle warm gradient
- **Accent**: Ink blue `#2563eb`
- **Text**: Near-black `#1a1a2e` primary, `#6b7280` secondary
- **Surface**: White `#ffffff` with soft shadow `0 2px 16px rgba(0,0,0,0.06)`
- **Best for**: Problem statement, Prior work, Setup slides
- **Typography feel**: Clean, academic, serene
- **Default role**: The safest primary direction for most of the deck.

### Mood 3 — Gradient Mesh
- **Background**: Animated mesh `linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%)` with `background-size: 200% 200%`
- **Animated background**: `meshShift 10s ease infinite` — slowly shifts gradient position
- **Accent**: Light violet `#c4b5fd` / highlight `#fde68a`
- **Text**: White `#ffffff` primary, `rgba(255,255,255,0.88)` secondary. Must have `text-shadow` for contrast on shifting gradients.
- **Surface**: `rgba(255,255,255,0.12)` frosted glass
- **Best for**: Method overview, Core idea, Conceptual slides
- **Typography feel**: Modern, energetic, forward-looking
- **Use sparingly**: Reserve for concept-heavy moments that benefit from extra energy.

### Mood 4 — Glass Panel
- **Background**: Soft gradient `linear-gradient(160deg, #e0f2fe 0%, #f0fdf4 100%)` or deep `#0f2027 → #2c5364`
- **Accent**: Emerald `#10b981` / teal `#14b8a6`
- **Text**: Dark `#1e293b` on light (secondary `#475569`), or white on dark variant
- **Surface**: Heavy glassmorphism `rgba(255,255,255,0.6); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.3)`
- **Best for**: Results, Main metrics, Best-performing comparisons
- **Typography feel**: Crisp, precise, data-confident
- **Default role**: Good as a controlled supporting direction for evidence-heavy slides.

### Mood 5 — Warm Accent
- **Background**: Soft peach wash `linear-gradient(135deg, #fef3c7 0%, #fce7f3 100%)`
- **Accent**: Deep amber `#b45309` / coral `#f97316`
- **Text**: Warm dark `#292524` primary, `#57534e` secondary
- **Surface**: White with warm-tinted shadow `0 4px 20px rgba(217,119,6,0.08)`
- **Best for**: Qualitative evidence, Visual examples, Before/after
- **Typography feel**: Warm, inviting, approachable
- **Use sparingly**: Works best when qualitative material needs a softer tone shift.

### Mood 6 — Deep Navy
- **Background**: Dark navy `linear-gradient(180deg, #0f172a 0%, #1e293b 100%)`
- **Noise overlay**: SVG `feTurbulence` texture at `opacity: 0.03`, `mix-blend-mode: overlay`
- **Accent**: Bright teal `#2dd4bf` / sky `#38bdf8`
- **Text**: White `#e2e8f0` primary, `#cbd5e1` secondary. ALL text must have `text-shadow`.
- **Surface**: `rgba(30,41,59,0.8)` with glow border `1px solid rgba(148,163,184,0.15)` and `inset 0 1px 0 rgba(255,255,255,0.04)`
- **Best for**: Ablation, Analysis, Deep-dive technical slides
- **Typography feel**: Academic authority, weight
- **Use sparingly**: Use when a technical section needs contrast, not as a permanent default.

### Mood 7 — Minimal White
- **Background**: Pure white `#ffffff`
- **Accent**: Charcoal `#374151` with one pop color (e.g., a single red/orange for emphasis)
- **Text**: Black `#111827` primary, `#6b7280` secondary
- **Surface**: Hairline border `1px solid #e5e7eb`, no shadow
- **Best for**: Limitations, Honest caveats, Clean data presentation
- **Typography feel**: Maximum breathing room, deliberate restraint
- **Default role**: Strong default for evidence slides where clarity matters more than atmosphere.

### Mood 8 — Celebration
- **Background**: Vibrant animated gradient `linear-gradient(135deg, #059669 0%, #2563eb 33%, #7c3aed 66%, #059669 100%)` with `background-size: 300% 300%`
- **Animated background**: `celebrateWave 10s ease infinite` — waves through color spectrum
- **Noise overlay**: SVG `feTurbulence` texture at `opacity: 0.03`, `mix-blend-mode: overlay`
- **Accent**: Soft gold `#fde68a` for dots/borders, white `#fff` for value text
- **Text**: White `#ffffff` with strong `text-shadow: 0 2px 20px rgba(0,0,0,0.35)`, `rgba(255,255,255,0.90)` secondary
- **Surface**: Bright frosted glass `rgba(255,255,255,0.18); backdrop-filter: blur(16px)` with glow border
- **Best for**: Key result announcement, Best-in-class achievement, Hero metric
- **Typography feel**: Extra bold, triumphant, maximum impact
- **Use sparingly**: Usually one moment in a deck, not a recurring theme.

---

## Surface Depth & Atmosphere

These treatments are optional enhancements after the static deck is already clear.

### Noise Texture Overlay
Applied to dark-background moods (cinematic, navy, celebration) via a `::after` pseudo-element:
- **Source**: Self-contained SVG data URI using `feTurbulence` filter (`baseFrequency: 0.85`, `numOctaves: 4`)
- **Opacity**: `0.03` — barely perceptible but adds analog depth
- **Blend**: `mix-blend-mode: overlay`
- **Z-index**: `1` (below content at z-index 2)
- **Pointer events**: `none` — non-interactive

### Animated Backgrounds
Animated backgrounds are optional. Use them only when they survive projector testing and do not reduce evidence readability:
| Mood | Animation | Duration | Effect |
|:---|:---|:---|:---|
| Cinematic | `cinematicPulse` | 12s | Shifts radial gradient focus point |
| Gradient Mesh | `meshShift` | 10s | Slides gradient `background-position` |
| Celebration | `celebrateWave` | 10s | Waves through 3-stop color spectrum |

**Implementation**: Use `background-position` animation (not `background` property) for Firefox compatibility.

### Glow Borders
Glassmorphic surfaces on dark backgrounds use a compound `box-shadow` for glow effect:
```css
box-shadow: 0 0 0 1px rgba(accent, 0.15), inset 0 1px 0 rgba(255,255,255,0.05);
```

### Label Color Variants
Label style variants (`positive`, `negative`, `accent`) use **CSS classes** not inline styles:
- `.label-positive` — defaults to `var(--positive)`, overridden to white on celebration/gradient-mesh
- `.label-negative` — defaults to `var(--negative)`, overridden to `#fca5a5` on dark moods
- `.label-accent` — defaults to `var(--accent)`, overridden to white on dark gradient moods

### Progress Bar Shimmer
Avoid shimmer by default. If used, it must stay subtle and never outshine evidence:
```css
background: linear-gradient(90deg, var(--accent), var(--positive), var(--accent));
background-size: 200% 100%;
animation: shimmer 2s linear infinite;
```

### Typography Features
- `font-feature-settings: 'cv01', 'cv02', 'ss01'` on labels for geometric character variants
- `font-optical-sizing: auto` on body for professional rendering
- Spring easing `cubic-bezier(0.16, 1, 0.3, 1)` for all entrance animations

---

## Deck Color Arc

Accent changes should follow the narrative, but the deck does not need a forced color parade. A simple pattern works well:

```
Primary deck direction:
  Usually Editorial Light or Minimal White for framing, explanation, setup, and most evidence slides.

Supporting contrast:
  Add one darker or richer mood for method depth or a major result reveal.

Closing accent:
  Return to the opening family, or use a single deliberate contrast for the final takeaway.
```

The LM adapts this arc to the paper's actual structure. Cohesion matters more than counting mood changes.

---

## Curated Anti-Patterns (NEVER DO)

These common failures are expressly prohibited:

| Anti-Pattern | Why It Fails | Fix |
|:---|:---|:---|
| **Gray monotone deck** | No emphasis or semantic contrast | Add semantic color and one clear primary direction |
| **Wall of bullets** | Audience reads ahead, stops listening | Max 4 bullets, ≤15 words each |
| **Thumbnail evidence** | Key figures shrunk to fit alongside text | Let figures fill ≥65% of slide |
| **Generic emoji icons** | Unprofessional, distracting | Use only SVG icons or paper figures |
| **Rainbow chaos** | Too many random colors or moods without structure | Lock one primary direction, then add contrast only where needed |
| **Decoration > evidence** | Fancy gradients but paper figures hidden | Evidence is always the protagonist |
| **App-shell chrome** | Deck looks like a dashboard or product UI | Minimize controls, chips, hover states, and widget framing |
| **Motion-first deck** | Animation compensates for weak composition | Prove the static layout first, then add only necessary motion |
| **Text-only method** | Architecture described in words when a figure exists | Always include the method figure |
| **AI-slop aesthetic** | Deck looks AI-generated, not researcher-authored | No emoji icons, no left-border accent cards, no aggressive gradients as default, no CDN-loaded AI-default fonts (Inter/Roboto/Arial) |
| **Filler content** | Bullets/cards added to fill space rather than communicate | Every element earns its place; use whitespace instead of inventing content |
| **SVG illustration** | Detailed imagery drawn with SVG paths instead of real figures | Use paper figures or labeled placeholder boxes — never SVG illustrations |

---

## Do

- Compose slides using the primitives that best serve the content.
- Lock one primary deck direction before decorating individual slides.
- Use louder moods only for genuine narrative turns.
- Build hierarchy with font size, weight, whitespace, and color.
- Use semantic color tokens for labels and key highlights.
- Let paper figures dominate their slides.
- Guarantee at least **15 slides** per presentation for comprehensive coverage.
- Make the presentation feel stage-like, cohesive, and easy to speak over.

## Don't

- Do not generate a monochrome or generic deck.
- Do not force every slide to change mood just to prove variety.
- Do not let text overflow its container.
- Do not shrink evidence figures below 50% of the content area.
- Do not use fixed-width that prevents fullscreen scaling.
- Do not show unreadable tables (font < 18px on the base stage).
- Do not compromise readability: heavy effects must NEVER obscure text (always ensure 4.5:1 text contrast).
- Do not let controls, hover states, or app-like widgets compete with the talk itself.
- Do not use generic emoji as icons — use SVG or paper visuals only.

---

## Design reference injection

When the user provides external design references:
1. Extract the style vocabulary.
   Cross-check with [references/external-design-principles.md](../../references/external-design-principles.md) so generic web-design advice becomes slide-safe rules.
2. Normalize into constraints compatible with this file.
3. Merge: external aesthetics may adjust palette, font choice, surface treatment, and atmosphere.
4. Protect: research readability, overflow protection, figure prominence, fullscreen behavior, and projector safety are non-negotiable.

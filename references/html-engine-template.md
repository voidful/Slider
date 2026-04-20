# HTML Engine Template

## Goal

**Use the canonical template file.** The output HTML is produced by injecting slide data into `assets/html-slideshow-starter/paper-presentation.html`. This document describes the template's internal structure for reference — it is NOT a specification for building HTML from scratch.

## File contract

The canonical template (`paper-presentation.html`) already contains:
- embedded CSS with semantic color tokens, composable primitives, and atmosphere modifiers,
- embedded JavaScript with both classic renderer and contentBlocks composer,
- a `slides` array placeholder at `// @render-slide-data`,
- theme and venue config objects at `// @render-theme` and `// @render-venue`,
- keyboard and control bindings,
- editor module (toolbar, sidebar, layout picker, theme panel, image upload),
- correct fullscreen scaling via `scaleDeck()`,
- density guard via `fitRenderedSlide()`,
- gallery overview, laser pointer, and export function,
- template identity marker: `<meta name="generator" content="slider/paper-presentation-v1"/>`.

**To render a deck:** inject the `slides` JSON array at the `// @render-slide-data` marker. Do not rewrite any other part of the template.

## Required engine structure

Use this order:
1. document head with title and style block,
2. `.deck-wrapper` container (the fullscreen target) containing `.deck`,
3. progress bar,
4. `.body-shell` → `.main-shell` → `#slide-root`,
5. presenter panel as sibling of main-shell,
6. notes, help, and overview overlays inside `.deck`,
7. control bar inside `.deck`,
8. `<script>` with config, `slides` array, render logic, event bindings, stage scaling.

## CSS custom properties (MANDATORY)

The style block must define these tokens:

```css
:root {
  --bg: #f5f5f4;
  --frame: #ffffff;
  --text: #1a1a2e;
  --muted: #4a4a6a;
  --border: #e2e8f0;
  --accent: #2563eb;
  --accent-bg: rgba(37,99,235,0.07);
  --positive: #059669;
  --positive-bg: rgba(5,150,105,0.07);
  --negative: #dc2626;
  --negative-bg: rgba(220,38,38,0.07);
  --neutral: #6b7280;
  --panel: #fafafa;
}
```

The `applyTheme()` function must set ALL tokens including `*-bg` variants.

### Typography CSS (MANDATORY)

```css
/* Body text uses text-wrap: pretty for improved line breaking */
.body-text, .bullets, .callout-box, .quote-block {
  text-wrap: pretty;
}

/* Titles use text-wrap: balance for centered visual weight */
.title, .hero-text {
  text-wrap: balance;
  hyphens: auto;
}

/* All numeric content uses tabular figures for alignment */
.metric-card .value, .data-table td, .hero-number, [data-delta] {
  font-variant-numeric: tabular-nums;
}
```

## Two rendering modes

### Classic mode (backwards compatible)

When a slide has a `layout` field and no `contentBlocks`, use the classic renderer:
- `renderClassicSlide(slide)` selects a fixed layout based on the `layout` string.
- Supports: cover, method-overview, split, diagram, result-table, result-table-focus, metrics, objective, qualitative-evidence, ablation, limitations, takeaway.

### Content blocks mode (preferred)

When a slide has a `contentBlocks[]` array, use the composition renderer:
- `renderContentBlocks(slide)` iterates through blocks and renders each via `renderBlock(block)`.
- Each block maps to a CSS primitive class.
- The slide's `atmosphere`, `gridTemplate`, and `customCSS` fields control overall slide appearance.
- The router function `renderSlide(slide)` checks for `contentBlocks` first, falling back to classic.

## Block rendering pipeline

```
renderSlide(slide)
  ├── if slide.contentBlocks → renderContentBlocks(slide)
  │     ├── Apply atmosphere class
  │     ├── Apply gridTemplate or default stack layout
  │     ├── For each block: renderBlock(block)
  │     │     ├── Map block.type to CSS primitive
  │     │     ├── Apply block.emphasis modifier
  │     │     ├── Apply block.style variant
  │     │     └── Return HTML string
  │     └── Join blocks into <section class="slide ...">
  └── else → renderClassicSlide(slide)
        └── Switch on slide.layout → fixed HTML template
```

## Supported block types

| Type | Renders as |
|:---|:---|
| label | `.label` with optional color style |
| heading | `.title` |
| hero-text | `.hero-text` |
| text | `.body-text` |
| bullets | `.bullets` with `.bullet-dot` items |
| figure | `.evidence-frame` with `<img>` or `.placeholder` |
| metric | `.metric-card` (or `.hero-number` if emphasis: dramatic) |
| metric-grid | `.metric-grid` containing `.metric-card` items |
| table | `.data-table` with `.result-table` |
| equation | `.equation-block` with optional `.equation-explain` |
| callout | `.callout-box` with optional style modifier |
| quote | `.quote-block` with optional `.quote-attr` |
| comparison | `.comparison-panel` with left/right panels |
| timeline | `.timeline-flow` with `.timeline-step` items |
| spacer | Flex spacer |
| custom-html | Raw HTML string |

## Atmosphere system

Per-slide atmosphere via CSS class:
- `.atmosphere-warm` — subtle warm background gradient
- `.atmosphere-cool` — subtle cool background gradient
- `.atmosphere-dramatic` — dark background, inverted text colors
- `.atmosphere-minimal` — pure white, maximum whitespace
- `.atmosphere-editorial` — default (no class needed)

## Overflow protection (MANDATORY)

Same rules as DESIGN.md — all containers must handle overflow safely.

### Flex containment for content blocks (MANDATORY)

Every `.slide` uses `display:flex; flex-direction:column; overflow:hidden`. To prevent child elements from exceeding the fixed 1200×675 stage, every content block must participate in flex shrinking:

1. **Containers**: `.main-shell`, `#slide-root`, and `.slide` must have `flex: 1; min-height: 0; display: flex; flex-direction: column`.
2. **All `.slide` direct children** must have `min-height:0; flex-shrink:1` so they can shrink below their intrinsic height.
3. **Shrinkable flex/grid children** must set `min-width:0` so long content wraps instead of forcing overflow.
4. **`.evidence-frame`** must use `flex:1 1 0; min-height:0; overflow:hidden` — never a fixed `max-height` in px.
5. **`.evidence-frame > div`** (SVG wrappers) must use `flex:1 1 0; min-height:0; overflow:hidden; max-height:100%!important` to override any inline `max-height` styles injected by custom-html blocks.
6. **`.evidence-frame img`** must use `max-height:100%` (not `480px`) and `flex-shrink:1`.
7. **`.callout-box`** must have `flex-shrink:1; overflow:hidden`.
8. **`.equation-block`** must have `flex-shrink:1` and use compact margins.
9. **`.bullets`** must have `flex-shrink:1; min-height:0; overflow:hidden`.
10. **`.label`** and **`.title`** should have `flex-shrink:0` to never compress headings.
11. **Density-fit classes** may define exactly two overflow-recovery tiers: `.density-compact` and `.density-tight`. They may reduce slide padding, block gaps, and subordinate text sizes, but must not push text below 14px or change the stage geometry.

**Critical**: Never set `max-height` on SVG wrappers inside `custom-html` blocks to an absolute pixel value (e.g., `560px`). Always use `100%` or let the flex layout handle sizing.

### Deterministic density-fit

After each render, the engine may measure the current `.slide` and apply:

1. No class
2. `.density-compact`
3. `.density-tight`

This sequence must be deterministic and capped at these two classes. It is a stage-preserving guardrail for small overflow only. If `.density-tight` still overflows, the slide content must be revised or split.

## Fullscreen (MANDATORY)

Target `.deck-wrapper` (or equivalent stage wrapper), not `document.documentElement`.

Fullscreen keeps the deck as the same fixed 1200×675 stage and only changes the scale factor:

```css
#deck-wrapper:fullscreen,
#deck-wrapper:-webkit-full-screen {
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

#deck-wrapper:fullscreen .deck,
#deck-wrapper:-webkit-full-screen .deck,
.deck-wrapper.simulated-fs .deck {
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}
```

## Stage scaling

The `scaleDeck()` function is the single source of truth in both windowed and fullscreen modes:

```js
function scaleDeck() {
  const isFS = document.fullscreenElement === wrapperEl;
  const vw = isFS ? window.innerWidth : window.innerWidth - 48;
  const vh = isFS ? window.innerHeight : window.innerHeight - 48;
  const s = Math.min(vw / 1200, vh / 675);
  deckEl.style.transform = `scale(${s})`;
  deckEl.style.width = '1200px';
  deckEl.style.height = '675px';
}

// Must listen for fullscreen changes and resize:
document.addEventListener('fullscreenchange', scaleDeck);
document.addEventListener('webkitfullscreenchange', scaleDeck);
window.addEventListener('resize', scaleDeck);
```

- Fullscreen and windowed mode must render identical compositions.
- Do not use `vh` / `vw` typography inside slide content.
- Do not add `@media (max-width: ...)` rules that reflow slide content.

## Required controls

Same as before — nav buttons, progress bar, notes, overview, presenter, fullscreen, keyboard shortcuts.

## Rendering rules

- Render from the `slides` array via `renderSlide()`.
- `renderSlide()` routes to contentBlocks or classic mode.
- Escape user-provided text to prevent XSS.
- Use semantic label colors per slide type.
- Apply metric value colors based on `delta` field.
- The `<body>` tag must NOT have `class="edit-mode"` in the generated output. The deck loads in presentation mode by default. Users enter edit mode via the `E` key or the edit button.
- All JavaScript string literals must preserve escape sequences as source-level characters. In particular, `.join("\n")` must appear as the four-character escape sequence, not a literal line break. A literal newline inside a JS string literal causes a blocking `SyntaxError`.

## Failure handling

If a block type is unsupported, fall back to rendering it as plain text.
If a feature is not feasible in pure HTML, keep the presentation core solid and omit the feature.

## Live tweaks integration

The template supports a post-generation customization panel. See [live-tweaks-protocol.md](live-tweaks-protocol.md) for the full specification.

Key integration points:
- The `TWEAK_DEFAULTS` block with `/*EDITMODE-BEGIN*/` / `/*EDITMODE-END*/` markers is embedded in the `<script>` section.
- The `applyTheme()` function reads tweaked values and overrides semantic color tokens.
- The tweaks panel UI is hidden by default and activated via `T` key or toolbar button.
- Tweaked values persist via `localStorage` and are included in `exportHTML()` output.

## Verification

After rendering, the deck should pass the three-phase verification workflow defined in [verification-workflow.md](verification-workflow.md). See that document for the complete gated pipeline.

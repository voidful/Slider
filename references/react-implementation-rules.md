# React Implementation Rules

## Goal

Generate a previewable, production-quality React slideshow with clear structure and minimal dependency weight.

## Default stack

Prefer:
- React functional components,
- Tailwind CSS,
- lucide-react for lightweight icons,
- Framer Motion only for subtle transitions when the request benefits from it.

Avoid unnecessary state libraries, routers, or backend code.

## File strategy

Default to a single-file React component unless the user explicitly asks for a multi-file project.

When the user wants a reusable scaffold, stronger presenter controls, or team handoff, switch to the multi-file project guidance in [references/multi-file-react-project.md](multi-file-react-project.md).

Keep the code easy to copy, preview, and edit.

## Required architecture

Organize the file in this order:
1. imports
2. theme and venue presets
3. slide data
4. small presentational helpers
5. slide renderer
6. slideshow shell
7. default export

## Slide data

Store content in a `const slideData = [...]` array near the top.

Each slide object should usually include:
- `id`
- `title`
- `layout`
- `purpose`
- `keyMessage`
- `speakerNote`

Optional fields:
- `subtitle`
- `bullets`
- `metrics`
- `figureLabel`
- `equation`
- `callout`
- `visualType`
- `content`
- `section`
- `jumpLabel`
- `appendix`
- `evidenceNote`

Do not hardcode long slide text directly inside JSX unless the request is extremely small.

## Theme, venue, and mood config

Prefer a small config object for:
- base theme preset,
- venue preset,
- accent usage,
- frame styling,
- layout density.

Keep these decisions editable without rewriting slide content.

### Pro-Max mood system

Every slide must declare a `mood` field, freely chosen from the 8 Pro-Max moods:

| Mood | Visual feel | Best for |
|:---|:---|:---|
| `cinematic` | Deep dark radial gradient, cyan glow | Title, Teaser, Final takeaway |
| `editorial` | Clean warm off-white | Problem, Prior work, Setup |
| `gradient-mesh` | Vibrant purple/violet gradient | Method overview, Core idea |
| `glass` | Light blue-green glass panel | Results, Main metrics |
| `warm` | Soft peach/amber wash | Qualitative, Before/after |
| `navy` | Dark navy solid gradient | Ablation, Analysis, Detail |
| `minimal` | Pure white, minimal decoration | Limitations, Honest caveats |
| `celebration` | Multi-color vibrant burst | Key result, Hero metric |

Each mood defines: background, accent, text colors, card/surface styling, and element-specific overrides. The LM freely picks the mood for each slide based on content — no rigid mapping.


## Pre-render planning

When evidence JSON is available, prefer generating or revising `slideData` or `slides` from `scripts/generate_slide_data.py` before writing UI code.
Keep the rhetorical structure editable at the data layer, not buried in JSX or DOM strings.

## Layout types

Support a compact set of layout types:
- `cover`
- `split`
- `bullets`
- `metrics`
- `diagram`
- `table-focus`
- `limitations`

Use a switch statement or mapping object to render layout-specific blocks.

## Navigation

Support:
- previous and next buttons,
- left and right arrow keys,
- space for next,
- slide counter,
- progress bar,
- help toggle,
- number-key jump,
- home and end,
- `L` laser pointer toggle,
- `C` review comments,
- `V` visual asset manager,
- `D` deck design lock panel,
- wheel navigation with a short cooldown,
- single-finger horizontal swipe navigation,
- fullscreen toggle targeting the deck `div` ref (NOT `document.documentElement`).

Clamp slide indices safely.

## Animations (MANDATORY)

### Slide entrance
- Every slide change must trigger a `fadeUp` animation (400ms, `cubic-bezier(0.16, 1, 0.3, 1)`).
- Key elements (label, title, body, bullets) should enter with staggered delays: `.stagger-1` (100ms) through `.stagger-4` (400ms).
- Use the `key={currentSlide}` prop to re-trigger animations on navigation.

### Hover effects
- Metric cards: `translateY(-4px)` + shadow bloom on hover (250ms).
- Timeline steps: `translateY(-3px)` + subtle shadow on hover (200ms).
- Control buttons: subtle background change on hover (150ms).

### Background transitions
- When mood changes between slides, background and color should transition smoothly (500ms ease).

### Accessibility
- Respect `prefers-reduced-motion: reduce` — disable all animations.

## Presentation shell

Use an `aspect-video` presentation container (1200×675 reference).

Fullscreen must target the deck `div` ref — never `document.documentElement`.
Add `:fullscreen` CSS rules that scale the fixed stage without reflowing slide typography.

Preserve generous margins and projector-safe layout.

## Motion

- Entrance: `fadeUp` (400ms, translateY + opacity + scale).
- Stagger: 100ms–400ms delays on sequential elements.
- Hover: subtle lift + shadow bloom.
- Background: smooth 500ms transitions between moods.
- Avoid bounce and overscaled transitions.
- The presentation should feel calm, precise, and premium.

See [assets/design/DESIGN.md](../../assets/design/DESIGN.md) for full animation specifications.

## Overview mode

Overview mode should render a grid of slide cards.
Each card should show:
- slide number,
- title,
- a short cue or key message.

Clicking a card should jump to that slide and close overview mode.

## Notes

If speaker notes are shown:
- keep them hidden by default,
- expose them via a toggle,
- separate them visually from the audience view,
- keep them concise and presentable.

## Presenter mode

When presenter mode is supported:
- keep the current slide dominant,
- show the next slide preview,
- show the current note and evidence note,
- show an elapsed timer,
- support presenter-window commands back to the projection window,
- support black/white blackout controls,
- support laser pointer toggle on the projection window,
- support exportable review comments,
- surface missing/bound visual assets,
- surface `deck_design.json` design locks without ad-hoc style editing,
- avoid shrinking the audience slide excessively.

## Figure placeholders

When the paper figure is not available or not readable:
- render a clean placeholder card,
- label the intended figure role,
- keep the placeholder visually consistent with the deck.

## Result presentation

For major quantitative results:
- use large numerals when a single delta matters most,
- otherwise use a focused comparison table or cards,
- annotate the metric and dataset clearly.

## Paper figure embedding

When paper figures are available (from PDF extraction or user-provided):

1. **Base64 embed**: Convert cropped figures to base64 and set `visual.src = "data:image/png;base64,..."`.
2. **Self-contained**: The React artifact should render without external file references.
3. **Confidence**: Annotate with `visual.confidence: "high" | "medium" | "low"`.
4. **Caption**: Always include `visual.caption` with figure label and description.
5. **Fallback**: If no figure is available, render a clean placeholder card with the intended figure role.

## Output discipline

When the user asks for code, return only runnable React code unless they explicitly request explanation.

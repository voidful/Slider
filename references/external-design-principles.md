# External Design Principles

This reference distills the external design sources linked by the user into slide-specific guardrails for this skill.
Use it when refining `designLock`, `deck_design.json`, or renderer defaults.

## Source map

- VoltAgent awesome-design-md: design systems work best when expressed as explicit language, named rules, and repeatable checklists rather than vague taste.
- ui-ux-pro-max-skill: visuals may feel premium, but hierarchy and usability must stay ahead of decoration.
- Impeccable: avoid generic AI output, default stacks, cards-on-cards, and trend-chasing color roulette. Prefer fixed type scales for interface-like canvases.
- Vercel web-design-guidelines: titles should balance nicely, long content must wrap safely, `min-w-0` matters in flex layouts, motion should stick to `transform`/`opacity`, and `prefers-reduced-motion` is mandatory.
- shadcn/ui skills: project-aware context and composition rules should be injected before generation so the assistant uses the right primitives on the first pass.
- Google Stitch / design-md: a natural-language design system should act as a control plane shared by generation, editing, and review.

## Slide translation

### 1. Use a design control plane

- Treat [assets/design/DESIGN.md](../assets/design/DESIGN.md) and `deck_design.json` as the single source of truth for palette, typography, motion, and layout families.
- Do not improvise per-slide styles that bypass the design control plane.
- If the user gives external references, translate them into named rules first, then render.

### 2. Prefer authored clarity over generic polish

- Slides should feel intentional, not like a default AI landing page.
- Avoid "Inter + purple gradient + floating cards" energy unless the paper truly needs it.
- Do not stack decorative cards inside decorative cards.
- Let one strong idea dominate each slide.

### 3. Fixed type scale beats responsive re-typesetting

- Research decks behave like presentation software, not responsive marketing pages.
- Keep the 1200x675 stage fixed and scale the whole deck.
- Use `clamp()` only within a stable stage-scale system. Do not switch to fullscreen-only `vh`/`vw` typography.
- Balance long titles with `text-wrap: balance` and hyphenation.

### 4. Content handling is a design rule, not a bug fix

- Every flex child that can shrink must have `min-width: 0` or `min-height: 0` as appropriate.
- Long text must wrap safely with `overflow-wrap: break-word`.
- Labels and metric rows may truncate only when the underlying meaning remains obvious.
- Tables and figure captions should use tabular numerals and short explanatory copy.

### 5. Motion is accent, not the story

- Start with a static deck that already reads clearly.
- Use short, meaningful motion only for slide entrance, emphasis, or chrome.
- Restrict animation to `transform` and `opacity` where possible.
- Never use `transition: all`.
- Honor `prefers-reduced-motion`.

### 6. Stylish does not mean loud

- The deck should be clear, concise, modern, and presentation-friendly at the same time.
- Use one primary visual direction across most slides.
- Support that direction with at most two contrast moments for opener, result climax, or close.
- Background treatments should stay limited; forced accent rotation is banned.

### 7. Presentation-specific interpretation

- Evidence slides should devote most of the usable area to the paper visual.
- Dense content should split across slides before typography shrinks.
- Presenter chrome must stay quiet, secondary, and keyboard-friendly.
- A good slide should still read correctly from the back row on a projector and under fullscreen scaling.

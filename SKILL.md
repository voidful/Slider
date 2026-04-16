---
name: slider
description: generate a browser-native research conference talk from an arxiv paper, pdf, title, or extracted text. this skill turns a paper into a live-presentation-ready slideshow with mandatory paper figure inclusion, evidence-backed slides, faithful visual redraw, paper-type-aware deck policy, design-system-driven rendering, and post-render audit. output is a single built html file that opens directly in any browser. this is for presenting a paper as a conference talk, not for making a landing page, dashboard, or generic summary.
---

# slider

> Research slides are evidence displays with narrative pacing.
> The LM has creative freedom to compose each slide to best communicate its content.

Turn an arXiv paper into a ready-to-present conference talk, output as a single self-contained HTML file.

## Priority order

1. **Technical faithfulness.** Never invent claims, numbers, or evidence.
2. **Evidence presentation.** Main deck must show the paper's key visuals, not just text summaries.
3. **UI polish.** Restrained, projector-safe, research-grade design.

## Core constraints

- Output is a **single self-contained HTML file**, minified and ready to open directly in any browser. No build step required by the user.
- The deck is a **rigorous and comprehensive talk**. Each paper must generate **at least 15 slides** targeting a ~15-minute presentation.
- Every slide has **one dominant message**.
- Main deck serves **audience understanding**, not paper section order.
- Paper figures, tables, and diagrams are **first-class content**, not optional decoration.

## Renderer contract

The deck uses a **fixed 1200×675 coordinate system** (stage model). This contract applies to all rendering modes:

- **Stage-consistent fullscreen.** Both windowed and fullscreen modes render the same fixed canvas. Fullscreen only changes the `transform: scale()` factor — it never reflows content, never switches typography units, and never changes alignment logic. The slide looks identical at any scale.
- **No viewport-unit typography.** All font sizes, padding, and gaps inside slides use `rem`, `px`, `em`, or `clamp()`. Never `vh`/`vw` for slide content. Viewport units are only permitted for viewport chrome (body background, controls positioning).
- **No fullscreen-specific layout overrides.** If a slide overflows at 1200×675, fix the content or choose a different layout — do not add fullscreen-only CSS band-aids.
- **Composition stability.** A presenter must be able to rehearse in windowed mode and present in fullscreen with zero visual drift. Text wrapping, vertical alignment, whitespace distribution, and element proportions must be identical.

## References

### Evidence and visual policy
- paper visual inclusion policy: [references/paper-visual-inclusion-policy.md](references/paper-visual-inclusion-policy.md)
- research visual priority: [references/research-visual-priority.md](references/research-visual-priority.md)
- faithful redraw policy: [references/faithful-redraw-policy.md](references/faithful-redraw-policy.md)
- paper figure embedding pipeline: [references/paper-figure-embedding.md](references/paper-figure-embedding.md)
- paper type policy: [references/paper-type-policy.md](references/paper-type-policy.md)

### Design system
- design control plane: [assets/design/DESIGN.md](assets/design/DESIGN.md)
- deck design specification: [references/deck-design-control-plane.md](references/deck-design-control-plane.md)
- external design principles: [references/external-design-principles.md](references/external-design-principles.md)
- research slide patterns: [references/research-slide-patterns.md](references/research-slide-patterns.md)
- page-role layout families: [references/page-role-layout-families.md](references/page-role-layout-families.md)
- anti-patterns: [references/research-slide-anti-patterns.md](references/research-slide-anti-patterns.md)
- fullscreen contract: [references/fullscreen-contract.md](references/fullscreen-contract.md)
- reading comfort rubric: [references/reading-comfort-rubric.md](references/reading-comfort-rubric.md)

### Workflow and rendering
- talk arc and compression: [references/presentation-logic.md](references/presentation-logic.md)
- output mode selection: [references/output-contracts.md](references/output-contracts.md)
- paper ingestion: [references/paper-ingestion-workflow.md](references/paper-ingestion-workflow.md)
- figure and table triage: [references/figure-table-extraction.md](references/figure-table-extraction.md)
- visual selection scoring: [references/visual-selection-scoring.md](references/visual-selection-scoring.md)
- slide-data planning: [references/slide-data-generation.md](references/slide-data-generation.md)
- pdf visual export: [references/pdf-visual-cropping.md](references/pdf-visual-cropping.md)
- artifact rendering: [references/artifact-rendering.md](references/artifact-rendering.md)
- slide quality rubric: [references/slide-quality-rubric.md](references/slide-quality-rubric.md)
- bug and conciseness audit: [references/bug-and-conciseness-audit.md](references/bug-and-conciseness-audit.md)

### UI and interaction
- UI pattern mapping: [references/ui-patterns.md](references/ui-patterns.md)
- presenter UX: [references/presenter-ux.md](references/presenter-ux.md)
- dual-screen speaker view: [references/dual-screen-speaker-view.md](references/dual-screen-speaker-view.md)
- HTML engine rules: [references/html-engine-template.md](references/html-engine-template.md)
- React rules: [references/react-implementation-rules.md](references/react-implementation-rules.md)
- multi-file React project: [references/multi-file-react-project.md](references/multi-file-react-project.md)

### Visual processing
- auto-detection strengthening: [references/auto-detection-strengthening.md](references/auto-detection-strengthening.md)
- multi-panel figure detection: [references/multi-panel-figure-detection.md](references/multi-panel-figure-detection.md)
- multi-panel geometry: [references/multi-panel-geometry-detection.md](references/multi-panel-geometry-detection.md)
- panel boundary detection: [references/panel-boundary-detection.md](references/panel-boundary-detection.md)
- panel separator detection: [references/panel-separator-detection.md](references/panel-separator-detection.md)
- separator geometry: [references/separator-geometry-refinement.md](references/separator-geometry-refinement.md)
- table-aware crop: [references/table-aware-crop-refinement.md](references/table-aware-crop-refinement.md)
- table row and column inference: [references/table-row-column-inference.md](references/table-row-column-inference.md)
- semantic table parsing: [references/semantic-table-parsing.md](references/semantic-table-parsing.md)
- semantic table role labeling: [references/semantic-table-role-labeling.md](references/semantic-table-role-labeling.md)
- semantic role confidence: [references/semantic-role-confidence-calibration.md](references/semantic-role-confidence-calibration.md)
- confidence calibration: [references/confidence-calibration.md](references/confidence-calibration.md)
- visual binding confidence: [references/visual-binding-confidence.md](references/visual-binding-confidence.md)
- metrics visual rendering: [references/metrics-visual-rendering.md](references/metrics-visual-rendering.md)

### Styling
- theme presets: [references/theme-presets.md](references/theme-presets.md)
- venue style variants: [references/venue-style-variants.md](references/venue-style-variants.md)
- venue visual thresholds: [references/venue-specific-visual-thresholds.md](references/venue-specific-visual-thresholds.md)
- venue appendix policy: [references/venue-specific-appendix-policy.md](references/venue-specific-appendix-policy.md)
- redundancy suppression: [references/redundancy-suppression.md](references/redundancy-suppression.md)
- score-aware slide insertion: [references/score-aware-slide-insertion-refinement.md](references/score-aware-slide-insertion-refinement.md)

### Platform
- platform adaptation guide: [references/platform-adaptation-guide.md](references/platform-adaptation-guide.md)

### Meta
- architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
- test matrix: [TEST_MATRIX.md](TEST_MATRIX.md)
- changelog: [CHANGELOG.md](CHANGELOG.md)

## Bundled scripts

- evidence extractor: [scripts/extract_paper_evidence.py](scripts/extract_paper_evidence.py)
- visual candidate locator: [scripts/find_visual_evidence.py](scripts/find_visual_evidence.py)
- visual scorer: [scripts/score_visual_candidates.py](scripts/score_visual_candidates.py)
- slide-data generator: [scripts/generate_slide_data.py](scripts/generate_slide_data.py)
- pdf visual exporter: [scripts/export_pdf_visuals.py](scripts/export_pdf_visuals.py)
- visual asset binder: [scripts/bind_visual_assets.py](scripts/bind_visual_assets.py)
- slideshow renderer: [scripts/render_slideshow_artifact.py](scripts/render_slideshow_artifact.py)
- browser slide audit: [scripts/browser_slide_audit.py](scripts/browser_slide_audit.py)
- research slide audit: [scripts/audit_research_slides.py](scripts/audit_research_slides.py)
- design comfort audit: [scripts/audit_design_comfort.py](scripts/audit_design_comfort.py)
- deck design compiler: [scripts/compile_deck_design.py](scripts/compile_deck_design.py)
- health audit: [scripts/check_skill_health.py](scripts/check_skill_health.py)
- platform export: [scripts/export_platform_configs.py](scripts/export_platform_configs.py)
- offline KaTeX bundler: [scripts/offline_katex.py](scripts/offline_katex.py)
- template retrofit: [scripts/retrofit_to_template.py](scripts/retrofit_to_template.py)

## Starter assets

- HTML starter: [assets/html-slideshow-starter/paper-presentation.html](assets/html-slideshow-starter/paper-presentation.html)
- React starter: [assets/react-slideshow-starter/App.tsx](assets/react-slideshow-starter/App.tsx)
- React project starter: [assets/react-project-starter/](assets/react-project-starter/)
- Design system: [assets/design/DESIGN.md](assets/design/DESIGN.md)

## Source handling

Accept: arXiv URL, paper title, PDF, extracted text, DOI.
Prefer full paper over abstract-only input.
If only a title is given, resolve it first.
If figures matter, visually inspect the PDF pages.

---

## Required workflow

### Step 1. Ingest and normalize

Follow [references/paper-ingestion-workflow.md](references/paper-ingestion-workflow.md).

Extract at minimum:
- title, authors, venue, year
- one-sentence TL;DR
- problem, motivation, prior gaps
- core idea, main contributions
- method overview, architecture, objective/loss
- datasets, metrics, baselines
- main results, ablations, qualitative findings
- limitations
- visual candidates (all figures and tables in the paper)

### Step 2. Classify paper type

Classify the paper using [references/paper-type-policy.md](references/paper-type-policy.md):
- architecture-heavy
- optimization-heavy
- benchmark-heavy
- theory-heavy
- qualitative-heavy

A paper may have multiple types. Record the classification.

### Step 2.5. Compile deck design

Before rendering, compile a deck-level design using [references/deck-design-control-plane.md](references/deck-design-control-plane.md).

1. Run `scripts/compile_deck_design.py` with paper type, venue, and any user style preferences.
2. The script outputs `deck_design.json` — the intermediate representation consumed by the renderer and auditor.
3. The design locks: mood family, semantic palette, type/spacing scales, page-role→layout-family bindings, motion policy, content-handling rules, anti-pattern enforcement, and fullscreen contract.
4. The renderer must respect all bindings in `deck_design.json`. Ad-hoc visual decisions during rendering are prohibited.
5. If the user requests a style change, re-run the compiler — do not patch individual slides.

### Step 3. Identify mandatory main-deck visuals

Apply [references/paper-visual-inclusion-policy.md](references/paper-visual-inclusion-policy.md) and [references/research-visual-priority.md](references/research-visual-priority.md).

1. List all visual candidates.
2. Classify each as Priority A, B, or C.
3. Determine which Priority A visuals are mandatory for the main deck based on paper type.
4. For each mandatory visual: can it be cropped cleanly? Needs faithful redraw? Needs reconstruction?
5. Apply suppression rules from [references/research-visual-priority.md](references/research-visual-priority.md).

### Step 4. Export and inspect key visuals

When a PDF is available:
1. Run `scripts/find_visual_evidence.py <source>` to locate candidates.
2. Run `scripts/score_visual_candidates.py` to rank them.
3. Run `scripts/export_pdf_visuals.py <paper.pdf>` to crop candidates.
4. Visually inspect the crops. Decide: use as-is, faithful redraw, or reconstruct.
5. Apply [references/faithful-redraw-policy.md](references/faithful-redraw-policy.md) for any redraws.

**Paper figure auto-embedding (MANDATORY for self-contained output):**

When paper figures are identified and cropped:
1. Convert the cropped PNG/JPG to base64.
2. Embed directly as `<img src="data:image/png;base64,...">` in the HTML.
3. This ensures the output is fully self-contained — no external file dependencies.
4. Set the `visual` field on the slide data with `src` pointing to the base64 data URI.
5. If a figure cannot be extracted (e.g., no PDF available), use a faithful redraw or clean placeholder instead.
6. **Never leave a `mustIncludeVisual=true` slide without a visual.** Extract, redraw, or reconstruct.

### Step 5. Create slide plan with content composition

Build the slide plan using [references/slide-data-generation.md](references/slide-data-generation.md).

Before writing the final `slides` array, lock four short planning artifacts. These can stay inline in the conversation unless the user explicitly wants files:
- `deckBrief` — audience, talk length, thesis, and delivery tone.
- `deckScript` — page roles and one-sentence thesis per slide.
- `visualPlan` — page-aware visual choices. For each image-bearing slide, state which figure/table/sample is needed and why it earns space.
- `designLock` — one primary visual direction, up to two supporting directions, and a motion policy. Do not let the deck drift into unrelated slide themes. **This must be consistent with `deck_design.json`.**

The goal is to lock the deck as a presentation before rendering HTML. Do not skip directly from paper extraction to decorative code.

**You have creative freedom to compose each slide's layout.** Choose between:

**Option A — Classic layout** (for standard patterns):
- Set the `layout` field to a pattern name (cover, method-overview, split, etc.)

**Option B — Content blocks** (preferred for custom compositions):
- Set `contentBlocks[]` with ordered content primitives
- Each block has a `type`, `content`, optional `placement`, `style`, and `emphasis`
- Optionally set `gridTemplate` for CSS Grid control and `atmosphere` for per-slide mood

For each slide, specify:
- `id`, `title` (argumentative), `purpose`
- `pageRole` — what job this slide plays in the talk arc (hook, bottleneck, method overview, headline result, limitation, close)
- `keyMessage`, `claim`, `speakerNote`
- `mood` — chosen from the mood library only after the `designLock` is set. Default to one primary deck mood family and use stronger contrast moods only where the story needs them.
- `evidenceType`, `evidenceSource`
- `mustIncludeVisual` (boolean)
- `visualBinding` (paper figure/table/section reference)
- `visualIntent` — why this visual helps the audience understand the slide faster than text alone
- `visual` — when a paper figure is available, set `{ src: "data:image/png;base64,...", alt: "...", caption: "Figure N — ...", confidence: "high" }`
- `densityBudget` (max words on slide face)
- `audienceGoal` (what the audience should understand after this slide)

Use slide patterns from [references/research-slide-patterns.md](references/research-slide-patterns.md) as inspiration, not as rigid templates.

Follow the detailed story arc from [references/presentation-logic.md](references/presentation-logic.md). **You MUST generate a minimum of 15 slides** per paper, targeting ~1 minute per slide for a 15-minute talk:
1. **Title** — Paper name, authors, and a one-sentence tl;dr.
2. **Motivation Hook** — Relatable everyday example or surprising number showing why the problem matters.
3. **Problem Framing** — Concrete example of the task (Input → Output).
4. **Roadmap** — "In this talk we'll look at..." 
5. **Intuition Setup** — A stripped-down, simplified case (e.g., dropping a parameter or using 3 data points).
6. **Intuition Validation** — Applying the simplified idea. 
7. **Concept Naming / Naming Ceremony** — Giving the formal name to the intuition just built.
8. **Formalization (Safety Net)** — The equation/architecture. Begin with "Even if you skip the math..."
9. **Misconception Breaker** — "You might think X, but actually..." (Preemptive warning).
10. **Progressive Complexity** — Adding back the real-world complexity skipped in step 5.
11. **Method Overview** — The complete visual pipeline now that the pieces are understood.
12. **Method Detail** — Deep dive into the critical step.
13. **Experimental Setup & Key Question** — What are we trying to prove with the data?
14. **Headline Evidence** — The main quantitative result or key figure answering the setup question.
15. **Visual/Qualitative Proof** — Side-by-side comparisons showing the mechanism at work.
16. **Ablation (Three-case Comparison)** — e.g., Too little vs. Just Right vs. Too much.
17. **Practical Tip & Limitations** — Honest assessment of where it fails or how to implement it.
18. **Final Takeaway** — Memorable wrap-up.

### Pedagogical slide narrative (MANDATORY)

Slides are a **teaching medium**. Content arrangement must follow pedagogical principles adapted from proven technical teaching methods (Andrew Ng, Hung-yi Lee). These principles govern slide ordering, content density, and narrative flow.

#### Principle 1: Intuition before formalization

Every formula, architecture diagram, or formal definition MUST be preceded by at least one slide that builds intuitive understanding.

**Wrong**: Slide 5 → "Objective: $\min_f \mathrm{KL}(f, p) - \gamma \mathcal{H}(f)$" (audience has no idea what this means)

**Right**: Slide 5 → "The core idea: reward matching the target distribution while keeping outputs diverse" (intuition) → Slide 6 → "Here's the math: ..." (formalize)

**Slide-level checklist**:
- [ ] Every `objective` or `equation` slide has a preceding slide that explains the idea in plain language
- [ ] Every method detail slide starts with "what this component does" before "how it works"
- [ ] Architecture slides label boxes with intuitive descriptions, not just module names

#### Principle 2: Strategic simplification

When introducing multi-component methods, **isolate the core idea** by temporarily removing secondary complexity.

**Technique**: Present a simplified 2-parameter version → show it working → add the full complexity.

**Slide implementation**:
- Use a "Core idea" slide (simplified, no subscripts/superscripts) before a "Full method" slide
- In `keyMessage`, write: "To build intuition, let's start with a simpler case..."
- Use side-by-side comparison: simple case → full case

#### Principle 3: Progressive complexity spiral

Build understanding across slides by ascending in complexity. Each slide adds ONE new concept.

**Pattern**: Slide N establishes concept A → Slide N+1 says "but this isn't enough because..." → Slide N+2 adds concept B → ... → final slide shows the complete picture.

**Anti-pattern**: A single "Method overview" slide that dumps the entire pipeline. Split into Method-A → Method-B → Combined pipeline.

#### Principle 4: Motivation hook

The opening slides (2-4) must establish **why the audience should care**, using concrete examples the audience can relate to.

**Techniques**:
- Show a surprising failure of existing methods (violation of expectation)
- Use a striking number: "10^300 possible outputs" or "drops from 85% to 63%"
- Pose a relatable question: "What happens to a language model's diversity after fine-tuning?"
- Show a real-world consequence: "This affects every chatbot you use"

**Slide implementation**:
- The `hook` or `teaser` slide must use a concrete, visceral example — not an abstract statement
- `keyMessage` should be something the audience can remember and repeat to a colleague

#### Principle 5: Preemptive warning (misconception breaking)

When the paper corrects a common misconception or introduces notation that is easily confused, **call it out explicitly**.

**Techniques**:
- "A common assumption is X — but this paper shows X is wrong"
- "Note: $x^{(i)}$ here means the i-th example, NOT x to the i-th power"
- Use a bullet with ⚠️ or a dedicated `claim` field

**Slide implementation**:
- Use the `keyMessage` to state the misconception, then bullets to correct it
- On result slides, contrast "expected" vs "actual" to create productive surprise

#### Principle 6: Safety net for math

For slides with heavy math (objective functions, derivations, proofs), signal that the math can be skimmed without losing the main thread.

**Techniques**:
- End the preceding slide with: "The key takeaway is [conclusion]. The next slide shows the formal version."
- On the equation slide itself, use `keyMessage` to restate in plain language what the formula says
- After the math slide, have a "So what does this mean?" interpretation slide

**Slide implementation**:
- `objective` layout slides MUST have a `keyMessage` that explains the formula in plain language
- Speaker notes should include: "If you don't follow the math, that's fine — here's what it means: ..."

#### Principle 7: Cross-domain analogy

When a concept is abstract, map it to a concrete domain the audience already understands.

**Techniques**:
- "This is like gradient descent, but for distributions instead of parameters"
- "Think of the meta-controller q as a traffic cop deciding where probability should flow"
- Use familiar games, everyday tools, or popular culture references when appropriate

**Slide implementation**:
- If using an analogy, dedicate a bullet or keyMessage to it — don't bury it in a wall of text
- Always return to the technical concept after the analogy: "So in our problem, this means..."

#### Principle 8: Three-case comparison

When a concept has a "degree" (model complexity, regularization strength, diversity), show three cases: too little → just right → too much.

**Slide implementation**:
- Use `comparison` layout or `split` layout with side-by-side visuals
- Label each case explicitly: "Underfitting", "Good fit", "Overfitting"
- Highlight the "just right" case with accent color

#### Principle 9: Road-mapping

Preview the structure so the audience knows where they are in the talk.

**Techniques**:
- Early slide: "This talk has three parts: the problem, the method, and the results"
- Transition slides: "Now that we've seen the problem, let's look at how to solve it"
- Use `pageRole` to mark transitions clearly

#### Principle 10: One-sentence takeaway per slide

Every slide must have a `keyMessage` that an audience member could write down and remember.

**Anti-pattern**: A slide with 5 bullets and no clear takeaway.
**Correct**: `keyMessage`: "GEM preserves diversity by treating SFT as a game between generator and critic."

---

**Deck cohesion rule:** avoid identical consecutive slides, but do not force variety for its own sake. Use one primary deck direction across most slides, plus at most two supporting mood shifts for rhetorical turns such as opener, key result, or closing takeaway.

### Step 6. Generate the HTML artifact

**⚠️ CRITICAL: Use the canonical template. Do NOT generate HTML from scratch.**

The output HTML must be produced by injecting slide data into the canonical template at [assets/html-slideshow-starter/paper-presentation.html](assets/html-slideshow-starter/paper-presentation.html). This template contains 1100+ lines of battle-tested CSS, JS, and DOM structure including navigation controls, editor module, density guard, fullscreen scaling, gallery overview, and keyboard shortcuts. Never rewrite, replace, or regenerate any of this code.

**Concrete steps:**
1. Read the canonical template file.
2. Produce the `slides` JSON array (the structured data, not raw HTML).
3. **MANDATORY**: Run `python scripts/render_slideshow_artifact.py --slide-data <data.json> --mode html --output <output.html>`. This renderer uses an airtight base64 transport mechanism.
4. Do NOT perform manual text replacement (e.g. `String.raw`) to inject the JSON array. The legacy string transport is deprecated because it systematically crashes the browser's JSON engine on commands like `\star` and `\arg`.

Read [assets/design/DESIGN.md](assets/design/DESIGN.md) for the stage-like, research-first design vocabulary and composable primitives.
Read [references/external-design-principles.md](references/external-design-principles.md) when the user wants the deck to feel more polished, modern, or reference-driven.
Read [references/html-engine-template.md](references/html-engine-template.md) for engine structure.
Read [references/presenter-ux.md](references/presenter-ux.md) for interaction rules.

**You have creative freedom to design each slide's layout based on the paper content.** Use the composable primitives from DESIGN.md to compose arrangements that best communicate each slide's message. The classic layout types are efficient defaults, not requirements.

Output a **single self-contained HTML file** (built from the canonical template) that:
- Embeds all CSS and JavaScript inline — including composable primitives and atmosphere modifiers.
- Embeds all paper figures as base64 data URIs — no external file references.
- Loads KaTeX from CDN for LaTeX math rendering (the only allowed external dependency).
- Renders from a structured `slides` array using both classic and contentBlocks renderers.
- Is minified and ready to open directly in any browser.
- Supports: keyboard navigation, slide counter, progress bar, fullscreen, number-key jump.

**LaTeX equation support (MANDATORY for papers with math):**
- The template includes KaTeX via CDN.
- Use standard LaTeX notation: `$...$` for inline math, `$$...$$` for display math.
- **🚨 CRITICAL JSON ESCAPING RULE:** Because you are generating JSON string payloads, **EVERY LaTeX backslash MUST be double-escaped** when writing the JSON file (e.g., `\\star`, `\\arg`, `\\gamma`, `\\mid`).
  - If you output `\arg`, Python and JSON parsers will intercept the `\a` as a BEL (`\x07`) control sequence before any transport occurs. It will reach the renderer as an invisible character, causing `rg` to appear on screen.
  - If you output `\star`, JSON will crash with an invalid escape `\s` error.
- Example: `{type:"equation", content:"$$\\arg \\min_{f} \\mathbb{E}_x \\big[ \\mathrm{KL}(f(\\cdot \\mid x)) \\big]$$"}`.
- The `renderMath()` function is called after every slide render to process all LaTeX in the DOM.
- Do NOT use HTML entities or custom font hacks for math — always use LaTeX notation.

**Motion policy (static-first):**
- Default to a static deck first. Review readability, pacing, and evidence prominence before adding motion.
- A subtle slide entrance such as `fadeUp` is optional, but it must stay brief and never become the main attraction.
- Ambient animated backgrounds, shimmer effects, and hover theatrics are opt-in polish, not default requirements.
- Evidence surfaces should not depend on hover to communicate emphasis.
- Respect `prefers-reduced-motion` for every non-essential animation.

**Non-negotiable quality gates (MANDATORY):**

**Color:** CSS custom properties must include `--accent`, `--accent-bg`, `--positive`, `--positive-bg`, `--negative`, `--negative-bg`, `--neutral`. The deck must NOT be monochrome, but decoration must stay secondary to hierarchy and evidence.

**Surface depth:**
- Subtle glass, gradients, or noise textures are allowed when they improve separation and mood.
- Dark moods may use glow borders or texture overlays, but these are supporting treatments, not acceptance criteria.

**Overflow:** All text containers must set `overflow-wrap: break-word`. Titles must use `text-wrap: balance; hyphens: auto` and clamped font size. No text may escape its container.

**Flex containment:** Every `.slide`, `#slide-root`, `.main-shell`, and shrinkable row/grid child must participate in containment with `min-width:0` / `min-height:0` as appropriate. Evidence-frames and custom-html blocks must use `flex:1 1 0; min-height:0; overflow:hidden`. To fix SVG aspect ratio stretching, any nested `<svg>` MUST have `min-height:0!important; flex-shrink:1!important`. No SVG wrapper may use an absolute pixel `max-height` (e.g., `560px`); use `100%` instead. This prevents visual content from exceeding the 675px slide height.

**Result-table stacked layout (MANDATORY when visual is present):** When a `result-table` or `result-table-focus` slide has both metrics and a visual (figure/chart), the layout MUST use a **stacked vertical structure** — not a side-by-side 2-column grid. The correct layout is:
1. Title + body text at the top (wrapped in a div).
2. Metrics in a **single horizontal row** using `.metric-grid.result-metrics-row` (CSS: `grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); flex-shrink: 0`). Metric cards use compact padding (`8px 12px`), smaller label (`13px`), and smaller value (`clamp(1.2rem, 2vw, 1.6rem)`).
3. Visual in a `.visual-overflow-guard.result-visual-fill` container (CSS: `flex: 1 1 0; min-height: 0; overflow: hidden`) that fills remaining vertical space.

This prevents the systematic overflow that occurs when 4+ metric cards are stacked in a 2×2 grid alongside a figure. The old side-by-side approach (`metrics-with-visual` / `result-visual-grid`) is **deprecated** and must not be used.

**SVG Text Wrapping (CRITICAL):** Never use `<text>` for multi-line paragraphs, explanations, or long sentences in SVGs. Standard `<text>` does not wrap. Instead, you MUST use `<foreignObject>` tags containing HTML `<div>`s with `xmlns="http://www.w3.org/1999/xhtml"` for any text over 3-4 words. Ensure the `<foreignObject>` bounds are within the shapes they belong to.

**Visual prominence and legibility (BLOCKING):** Evidence figures must be large enough that axis labels, legends, data points, and annotations are clearly readable at the rendered size. The minimum rendered height for any evidence figure is **200px (windowed)** — if a figure cannot meet this threshold on a shared slide, it MUST be split to its own dedicated slide. When a slide has both metrics and a figure, evaluate whether the figure is legible at the remaining height. If not, use a two-slide approach: one slide for the result summary (metrics + key message), and a second slide dedicated to the figure at full readable size. Never shrink evidence figures to thumbnails just to fit them on the same slide as other content.

**Fullscreen (stage-preserve only):** Fullscreen must target the stage wrapper (`#deck-wrapper` or equivalent), never `document.documentElement`. Fullscreen may remove chrome around the deck, but the slide itself must remain a fixed 1200×675 stage that only changes via `transform: scale(...)`. No fullscreen-only reflow, no `transform:none`, no viewport-unit typography.

**Density-fit guardrail (MANDATORY):** The HTML engine may use at most two deterministic density classes (`.density-compact`, `.density-tight`) when a rendered slide barely overflows the fixed stage. These classes may reduce padding, inter-block gaps, and subordinate text sizes, but they must keep body text projector-safe and never shrink below 14px. If `.density-tight` still cannot fit the slide, simplify or split the content instead of adding more shrink levels.

**Objective/equation slide content cap (MANDATORY):** The `objective` layout renders a centered equation block, which consumes significant vertical space. To prevent overflow, objective slides must contain at most: title + equation + key message + **2 short bullets**. If the LM needs both a long key message paragraph and 3+ bullets, it must either: (a) drop the key message and keep only bullets, (b) drop bullets and keep only the key message, or (c) split into two slides — one for the equation with interpretation, one for the implications. Evidence notes on objective slides are hidden in `density-tight` mode by the template CSS.

**Equation blocks must never scroll (BLOCKING):** The `.equation-block` uses `overflow:hidden`. If an equation is too wide, the LM must either: use `equation-compact` (shorter), split into aligned multi-line form, or simplify notation. Scrollbars on any slide element are a BLOCKING failure.

**Controls are a floating overlay (MANDATORY):** The navigation controls (`.controls`) are `position:absolute;z-index:20` and float over the slide content as a transparent overlay (`opacity:0.18`, visible on hover). They must NEVER be in the document flow or squeeze content. The `.slide` uses `padding-bottom:32px` (not 64px) because controls do not need reserved space. If a custom layout adds bottom padding > 40px to "make room" for controls, that is wasted space — remove it.

**evidenceNote is hidden in presentation mode (MANDATORY):** The `evidenceNote` field is internal LM metadata (e.g., "The key equation is enough for the talk."). The template CSS sets `.evidence{display:none}` — it is only visible in edit mode. The LM must not duplicate this text into `keyMessage`, `bullets`, or any other audience-facing field. See also: _Internal vs. audience-facing fields_ in Hard rules.

**No scrollbars on any slide element (BLOCKING):** All slide containers use `overflow:hidden`. If content overflows, the density guard (`density-compact` → `density-tight`) attempts to fit it. If tight mode still overflows, the content must be split or simplified. A visible scrollbar on any slide element (equation, bullet list, table, figure caption) is a BLOCKING delivery failure.


**Responsive reflow is banned inside the stage:** Do not add `@media (max-width: ...)` rules that change slide padding, flex direction, grid columns, or typography inside the 1200×675 canvas. Density-fit classes are allowed because they preserve the same fixed stage and do not depend on viewport breakpoints.

Do not over-rely on generic bullet layouts. Use research-specific primitives when they serve the content better.

If the user explicitly requests React output instead of HTML:
- Single-file React component follows [references/react-implementation-rules.md](references/react-implementation-rules.md).
- Multi-file React project follows [references/multi-file-react-project.md](references/multi-file-react-project.md).
- The same quality gates apply.

### Step 7. Run design and rendering audit

Check against [assets/design/DESIGN.md](assets/design/DESIGN.md) and [references/bug-and-conciseness-audit.md](references/bug-and-conciseness-audit.md):

**Design:**
- Every slide has one dominant message.
- Semantic colors are used (not monochrome).
- The deck reads like a presentation, not a dashboard or landing page.
- One primary visual direction stays consistent across most slides. Stronger stylistic deviations are reserved for major narrative turns.
- Generous whitespace preserved.
- Projector-safe text sizes (≥16px body, ≥18px table, ≥14px caption).

**Rendering regressions (BLOCKING):**
- Fullscreen targets the stage wrapper, not `document.documentElement`.
- Native fullscreen and simulated fullscreen both preserve the same 1200×675 deck and only adjust the scale factor.
- Semantic color tokens (`--accent`, `--positive`, `--negative`) are all defined.
- `overflow-wrap` / `word-break` CSS is present.
- `.evidence-frame` uses `flex:1 1 0; min-height:0; overflow:hidden` (not fixed `max-height`).
- `.evidence-frame > div > svg` uses `min-height:0!important; flex-shrink:1!important`.
- `.slide`, `#slide-root`, and `.main-shell` all have `flex:1; min-height:0`.
- `.slide > *` has `min-height:0; flex-shrink:1`.
- Shrinkable row/grid children use `min-width:0`.
- No SVG wrapper has absolute pixel `max-height`.
- **SVG Text rules:** No long paragraphs inside `<text>` tags. `<foreignObject>` is used for wrapped text.
- **No responsive stage reflow:** no `@media (max-width: ...)` rule may alter slide content layout or typography.
- **Density-fit ceiling:** renderer may apply `.density-compact` / `.density-tight` only. No third shrink tier, no viewport-triggered fallback, and no text below 14px.
- **Motion hygiene:** `prefers-reduced-motion` exists and slide motion avoids `transition: all`.
- **Result-table layout:** `result-table` / `result-table-focus` slides with visuals MUST use the stacked layout (`.result-metrics-row` on top, `.result-visual-fill` below) — NOT the deprecated side-by-side `.metrics-with-visual` / `.result-visual-grid` grid.
- **Figure legibility:** Every evidence figure must render at ≥200px height (windowed). If combining metrics and a figure on one slide shrinks the figure below this threshold, split into two slides: a metrics summary slide and a dedicated figure slide.

**Visual prominence:**
- Method/key figures occupy ≥65% of content area.
- No evidence figure renders as a thumbnail.
- Tables are readable at ≥18px.

### Step 8. Run evidence fidelity audit

Run `scripts/audit_research_slides.py --slide-data <plan.json> --paper-type <type>` or apply these checks manually:

**Blocking checks:**
1. Every `mustIncludeVisual=true` slide has a bound visual.
2. No slide exceeds 1.5× its density budget (severe overflow risk).
3. No metrics list with >6 items (will overflow the slide).
4. No text smaller than 14px.
5. Paper-type mandatory visuals are present.
6. HTML template does NOT fullscreen `document.documentElement`.
7. HTML template uses stage-preserve fullscreen on the wrapper and keeps `transform: scale(...)` in both windowed and fullscreen modes.
8. HTML template HAS semantic color tokens.
9. HTML template HAS overflow protection CSS.

**Revision checks:**
10. No text-dense slides exceeding density budget.
11. No titles longer than 18 words.
12. No generic titles ("Method", "Results").
13. No marketing language.
14. No duplicate consecutive claims.
15. Metric values with positive gains should have `delta: "positive"`.
16. No thumbnail-wall slides (>3 visuals on one slide).

Output is an actionable revision checklist, not abstract advice.

### Step 9. Revise and finalize

Fix all errors from the audit. Recheck after revision.

### Step 10. Package

The final output is a single `.html` file **built from the canonical template**. It must:
- Open directly in Chrome, Firefox, Safari without any server.
- Contain all CSS and JS inline (from the canonical template — not rewritten).
- Include the complete `slides` data array injected at the `@render-slide-data` marker.
- Include all presenter controls and keyboard navigation (from the template).
- Include the template identity marker: `<meta name="generator" content="slider/paper-presentation-v1"/>`.
- **Self-check before delivery:** Search the output for `slider/paper-presentation`, `id="prev"`, `id="fullscreen"`, and `fitRenderedSlide`. If any are missing, the file was NOT built from the template — go back to Step 6.

---

## Hard rules

These rules override any conflicting guidance elsewhere in the skill.

### Evidence rules
- Do not replace a usable paper figure/table with generic metrics cards.
- Do not compress method introduction into bullets-only when a method figure exists.
- Do not use a decorative placeholder when the real paper visual is available.
- If a paper has a key figure, crop/inspect/cite/redraw it before falling back to text.
- Speaker notes must explain why each visual was selected for the main deck.

### Design rules
- Read [assets/design/DESIGN.md](assets/design/DESIGN.md) before generating any slide.
- One visual protagonist per slide. Figures and tables outweigh decorative elements.
- Hierarchy via font size, weight, whitespace, alignment — reinforced by semantic color.
- The LM has creative freedom to compose each slide using composable primitives.
- Atmosphere adapts to paper domain, but the deck should still feel like one talk, not a gallery of unrelated themes.
- Prefer a stage-like, premium, research-grade aesthetic over app chrome or novelty effects.
- Gradients, glass panels, and dramatic moods are tools, not defaults. Use them intentionally where the page role benefits.
- Keep a coherent deck-level direction: one primary mood family, plus at most two supporting shifts for opener, climax, and close.
- Accent changes should follow narrative structure, not a forced color roulette.

### Internal vs. audience-facing fields
These slide data fields are **internal metadata** — they are hidden in presentation mode (only visible in edit mode). The LM should write them for planning/audit purposes, but they must never appear as visible slide content:
- `evidenceNote` — internal rationale for evidence selection (e.g., "The key equation is enough for the talk.")
- `speakerNote` — delivery guidance for the presenter
- `purpose` — planning-stage note about why this slide exists
- `audienceGoal` — what the audience should take away (authoring aid)
- `claim` — the claim being supported (audit metadata)
- `evidenceType`, `evidenceSource` — audit trail for evidence provenance

These fields are **audience-facing** and rendered visibly:
- `title`, `subtitle`, `keyMessage`, `bullets`, `equation`, `visual`, `contentBlocks`

### Rendering rules
- CSS must define and use `--accent`, `--positive`, `--negative` tokens. Deck must NOT be monochrome.
- All text must have `overflow-wrap: break-word`. Titles must use `text-wrap: balance; hyphens: auto`.
- Evidence figures must be large enough that axis labels, legends, and data points are clearly readable. Minimum rendered height: **200px windowed**. If a figure cannot meet this on a shared slide, split to a dedicated figure slide. Evidence-frame must use `flex:1 1 0; min-height:0; overflow:hidden` — never a fixed pixel `max-height`. The flex layout ensures figures fill available space without overflowing.
- Fullscreen must target the stage wrapper, not `document.documentElement`.
- Windowed and fullscreen modes must both render the same 1200×675 stage via `transform: scale(...)`.
- Do not use viewport-relative typography (`vh`/`vw`) inside slide content.
- Support both classic `layout` rendering and `contentBlocks` composition.
- Stage scaling may shrink to fit smaller windows, but layout structure must not reflow.
- Minor overflow may be resolved with deterministic density-fit classes that reduce padding and secondary typography while preserving the same 1200×675 stage. If tight mode still overflows, split or simplify the slide.
- The final HTML may only rely on KaTeX CDN when math rendering is required. Do not import Google Fonts, external images, or other runtime assets.
- **No text smaller than 14px anywhere.** Captions may use 14–16px; body text should stay projector-safe at roughly 18px or larger on the base stage.
- **Do not hardcode `font-size` with inline styles in render functions.** Use CSS classes or semantic tokens so the deck remains consistent across moods and audits.
- **Do not add `@media (max-width: ...)` rules that re-typeset the slide canvas.**
- **Every dark-background mood (cinematic, navy, gradient-mesh, celebration) MUST define explicit CSS overrides** for `.comparison-body`, `.grid-card-title`, `.grid-card-desc`, `.equation-block`, and `.equation-explain` to ensure text is light-colored and readable.
- **Comparison panel text** must use the `.comparison-body` CSS class (not inline `color:var(--muted)`). Each mood must override `.comparison-body` with a legible color.
- **Grid-content items** must use `.grid-card-title` and `.grid-card-desc` CSS classes (not inline styles). Each mood must override these classes.
- **MANDATORY fullscreen test**: After generating a deck, open it in fullscreen mode and verify every slide. Text blending into backgrounds or appearing too small is a BLOCKING failure.

### Typography rules
- **Font stack**: local-first only. Prefer `'Avenir Next', 'Segoe UI', 'SF Pro Text', system-ui, sans-serif` or an equivalent installed stack. Do not fetch fonts over the network. Labels use `font-feature-settings: 'cv01', 'ss01'` for geometric distinction.
- **Optical sizing**: Enable `font-optical-sizing: auto` on body.
- **Minimum sizes (windowed)**: Title ≥ `clamp(2rem, 3.5vw, 2.8rem)`, body ≥ `clamp(1.1rem, 1.6vw, 1.3rem)`, label ≥ 15px, grid-card desc ≥ 15px, comparison body ≥ 15px, metric detail ≥ 14px.

### Contrast and readability rules (BLOCKING)
- **All dark-background moods** (cinematic, navy, gradient-mesh, celebration) MUST apply `text-shadow` to all text elements for projector safety and readability.
- **Label color variants** (`positive`, `negative`, `accent`) MUST use CSS classes (`.label-positive`, `.label-negative`, `.label-accent`), NEVER inline `style` attributes. Each dark mood MUST override these classes with visible colors (e.g., white on celebration/gradient-mesh, accent color on cinematic/navy).
- **Table captions** must use the `.table-caption` CSS class, not inline styles.
- **WCAG 2.1 AA minimum**: All text must maintain ≥ 4.5:1 contrast ratio against its background. On animated/gradient backgrounds, use `text-shadow` to guarantee readability regardless of background position.

### Slide data rules
- Every slide must have: `id`, `title`, `purpose`, `keyMessage`, `speakerNote`.
- Every slide must have either `layout` (classic) or `contentBlocks` (composition mode).
- Every slide should have: `claim`, `evidenceType`, `evidenceSource`, `mustIncludeVisual`, `densityBudget`, `audienceGoal`.
- `mustIncludeVisual=true` slides that render as text-only are a failure.
- In contentBlocks mode, every slide should have at least one heading block.

### Output rules
- Default output is a single self-contained HTML file, minified, directly openable.
- React output only when the user explicitly requests it.
- All output modes must enforce the same evidence policy, visual inclusion rules, and design system.

### Artifact integrity rules

#### Canonical template mandatory (BLOCKING)

**Never generate HTML from scratch.** The final HTML deck must always be built by injecting slide data JSON into the canonical template at `assets/html-slideshow-starter/paper-presentation.html`. This rule applies to all platforms (Gemini CLI, ChatGPT, Claude, etc.).

The canonical template provides:
- Navigation controls (`id="prev"`, `id="next"`, `id="home"`, `id="fullscreen"`)
- Editor module (toolbar, sidebar, layout picker, theme panel, image upload)
- `fitRenderedSlide()` density guard
- `scaleDeck()` unified scaling for windowed + fullscreen
- `prefers-reduced-motion` media query
- Gallery overview, laser pointer, keyboard shortcuts
- `exportHTML()` with base64 slide data transport

**If the LM writes its own `<style>`, `<script>`, or DOM structure instead of using the template, the deck is in violation.** The audit script checks for template identity markers (`<meta name="generator" content="slider/paper-presentation-v1"/>`). Missing markers = FAIL.

**On platforms without file system access (ChatGPT, Claude):**
1. The template HTML should be uploaded as a knowledge file or provided in context.
2. The LM reads the template, injects the `slides` JSON array at the `// @render-slide-data` marker, and outputs the result.
3. The LM must NOT rewrite the CSS, JS, or DOM structure. Only the `slides` data, `<title>`, `themePreset`, and `venuePreset` values may change.

#### Slide data transport (BLOCKING)

The template supports two transport modes for injecting slide data. **Base64 is the primary and mandatory mode.**

##### Base64 transport (PRIMARY — mandatory when renderer is available)

The renderer (`render_slideshow_artifact.py`) serializes slide data as:
1. `json.dumps(slides)` → clean JSON string
2. `base64.b64encode(json_bytes)` → `[A-Za-z0-9+/=]` only
3. Injected at the `@render-slide-data-b64` marker

The template decodes with `atob()` then `JSON.parse()`.

**This eliminates ALL escaping issues.** No LaTeX backslash (`\star`, `\arg`, `\mathbb`, `\beta`, `\frac`) can ever be corrupted because base64 contains no backslashes, quotes, or control characters.

##### String.raw transport (LEGACY — deprecated, fallback only)

The old transport `JSON.parse(String.raw`...`)` is kept for backward compatibility. It has **two classes of failure**:

1. **Hard crash**: `\star`, `\arg`, `\mathbb`, `\gamma`, `\sigma` → `\s`, `\a`, `\m`, `\g` are NOT valid JSON escapes → `JSON.parse` throws `Bad escaped character` → **deck is completely broken (white screen)**
2. **Silent corruption**: `\beta`, `\frac`, `\theta`, `\nu`, `\rho`, `\tau` → `\b`, `\f`, `\t`, `\n`, `\r` ARE valid JSON escapes → parsed quietly as control characters → **math is silently destroyed**

The template has a `try/catch` that shows a diagnostic error message if String.raw parse fails, and `repairLatexCollisions()` for silent corruption. But **these are safety nets, not solutions**.

##### Mandatory renderer usage (BLOCKING)

**`render_slideshow_artifact.py` MUST be used whenever the environment can execute Python.** This includes:
- Local development environments
- ChatGPT Code Interpreter / sandbox environments with shell access
- CI/CD pipelines
- Any system where `python3` is available

**Manual injection of slide JSON is only permitted when the environment has zero ability to execute code** (e.g., a text-only chat with no sandbox). In that case:
- The LM must use base64 transport: `btoa(JSON.stringify(slides))` in the client, or manually encode the JSON to base64
- If base64 is not feasible, the LM must double-escape ALL LaTeX backslashes (`\\star`, `\\arg`, `\\mathbb`, `\\beta`, etc.)
- The LM must perform a mental `JSON.parse` self-test on the output

##### Post-render validation (BLOCKING)

After generating the final HTML, the following validation MUST pass:

1. Extract the `SLIDE_DATA_B64` value from the HTML
2. Decode it with `base64.b64decode()`
3. Parse it with `json.loads()`
4. Verify the result is a non-empty list

If any step fails, the artifact MUST NOT be delivered. The `render_slideshow_artifact.py` performs this validation automatically. For manual injection, the LM must verify that the payload can survive a round-trip.

#### JavaScript string literal escaping (BLOCKING)

When the LM generates the final HTML directly (without using `render_slideshow_artifact.py`):
- All JavaScript string literals containing escape sequences (`\n`, `\t`, `\\`, `\"`) MUST preserve the backslash as a literal character in the output HTML.
- **Common failure mode**: `.join("\n")` must appear as the four-character sequence `\`, `n`, not as a literal line break inside the quoted string. A literal newline inside a JS string literal is a `SyntaxError`.
- After generating the HTML, mentally verify: does every `\n` inside a JS string literal appear as two characters (`\` + `n`), not as a line feed?
- **Self-test**: Extract the `<script>` block and check for unterminated string literals.


#### Editor mode awareness

The HTML template includes both a viewer (presentation mode) and an editor (edit mode). The default state on load is **presentation mode**. The editor is activated when the user presses `E` or clicks the edit button.

- The editor UI (toolbar, sidebar, layout picker, theme panel) is **expected** to be present in the output HTML. Do not strip it.
- The editor UI is hidden by default via CSS (`display:none` on `.editor-toolbar`, `.editor-sidebar`, `.editor-main`; shown only when `body.edit-mode` is active).
- When generating the HTML, do NOT add `class="edit-mode"` to the `<body>` tag. The default body class must be empty so the deck loads in presentation mode.
- Do NOT set `themePreset` to values that only make sense in edit context. Use deck-design-compiled values.

#### Visual contract (BLOCKING)

Every slide with visual evidence must declare a granular visual contract. The boolean `mustIncludeVisual` is insufficient — it does not distinguish between "must have original paper crop" and "any visual element (table, metric card) is acceptable".

**Required fields for visual slides:**

| Field | Values | Meaning |
|:---|:---|:---|
| `visualRequirement` | `paper-crop-required` \| `redraw-allowed` \| `table-redraw-allowed` \| `any-visual` | What type of visual satisfies this slide |
| `visualSourceType` | `figure` \| `table` \| `redraw` \| `placeholder` | What was actually bound |
| `visualBinding` | string | Paper figure/table reference (e.g., "Figure 3", "Table 2") |

**Rules:**
- Opener, method overview, headline result, and qualitative evidence slides: `visualRequirement: paper-crop-required` unless no usable figure exists.
- If `visualRequirement` is `paper-crop-required`, binding a table redraw or metric cards does NOT satisfy the requirement. The slide is in violation.
- Text-only placeholder figures (`placeholder: "..."`) never satisfy any `visualRequirement`.

**Visual coverage floor:**
- **≥50% of non-cover/takeaway main-deck slides** must have a bound visual with actual content (base64 src, table data rows, or SVG).
- Before rendering, produce a **visual binding manifest table** listing every slide, its `visualRequirement`, what was bound, and the source type. If the 50% floor is not met, go back and bind more paper figures.

**Image loading for data URI decks:**
- For self-contained data URI images, use `loading="eager"` (not `lazy`). Lazy loading adds unpredictable render timing for data already in memory.
- After rendering, use `await img.decode()` before running fit/audit. Do not rely only on `load` events.

#### Hard-fail density rule (BLOCKING)

The `densityBudget` field is a **hard limit**, not advisory guidance.

- If the displayed word count on a rendered slide exceeds `densityBudget × 1.2`, the slide **must not** be delivered. Rewrite, simplify, or split the slide first.
- Speaker notes do not count toward the word budget. Only face-visible text counts.
- If `density-tight` CSS class is applied and the slide still overflows, the slide **fails**. It cannot be delivered. Split the content into two slides.

#### Stack layout block cap (BLOCKING)

For `contentBlocks` rendered as vertical stack (no `gridTemplate`):

- **Maximum 4 visible blocks** excluding `label` and `spacer`.
- **Forbidden combinations on a single slide:**
  - `table` + `metric-grid` + `text` paragraph
  - `figure` + `metric-grid` (≥3 items) + `text` paragraph
- If a slide plan exceeds these limits, split into two slides before rendering.
- This rule prevents the systematic density overflows observed in production decks.

#### Final browser artifact gate (BLOCKING)

The final HTML must be opened in Chromium and **every slide** checked for:

| Check | Tolerance | Consequence |
|:---|:---|:---|
| `brokenImages` | 0 | FAIL — image data corrupt or not rendering |
| `scrollOverflowY` | 0px | FAIL — content exceeds 675px stage height |
| `scrollOverflowX` | 0px | FAIL — content exceeds 1200px stage width |
| `descendantOverflowX` | 0px | FAIL — any child element exceeds parent boundary |
| `descendantOverflowY` | 0px | FAIL — any child element exceeds parent boundary |

- Any nonzero failure is **blocking**. The deck cannot be delivered.
- If `fitRenderedSlide()` applies `density-tight` and overflow persists, the slide content must be revised or split. Density CSS is a guardrail, not a solution.
- **Container compatibility:** When running in root/container environments, Chromium must use `--no-sandbox`.
- **Sandbox environments (ChatGPT, Claude, etc.):** If Chromium is physically unavailable, the browser audit may be skipped with a warning. In this case, rely on static analysis (reduced-motion check, loading-lazy check, visual-coverage check). The deck should be re-audited locally before final delivery.
- **Local/CI environments:** The browser audit is mandatory. If it fails or cannot run, packaging fails.

---

## Acceptance tests

A generated deck fails if any of these are true:
- **Not built from canonical template** — the output HTML is missing the template identity marker (`<meta name="generator" content="slider/paper-presentation-v1"/>`), navigation controls, editor module, or `fitRenderedSlide`. This means the LM generated HTML from scratch instead of injecting slide data into the template.
- Architecture-heavy paper and no method/architecture figure in main deck.
- Benchmark-heavy paper and no core result table or faithful redraw in main deck.
- Any slide with `visualRequirement: paper-crop-required` rendered without an original paper figure crop.
- Any slide with any `visualRequirement` rendered as text-only placeholder.
- Visual coverage below 50% of non-cover/takeaway slides.
- Design audit finds the deck behaves like a dashboard, product page, or app shell instead of a stage-like presentation.
- Evidence audit finds claim-to-visual misalignment.
- Any marketing language present.
- **Deck is monochrome** — semantic colors (`--accent`, `--positive`, `--negative`) are not used.
- **Non-KaTeX external runtime dependency** — the delivered HTML fetches remote fonts, images, or scripts beyond the explicit KaTeX exception.
- **Text overflows its container** — any title, bullet, or table cell escapes its boundary. Browser audit confirms per-slide.
- **Density budget exceeded** — any slide's displayed words exceed `densityBudget × 1.2`.
- **Stack block cap exceeded** — any vertical-stack slide has more than 4 visible blocks or uses a forbidden block combination.
- **Evidence figure below 50% of content area** — method/result figures are thumbnail-sized.
- **Fullscreen broken** — fullscreen targets the wrong element, switches to responsive reflow, removes `transform: scale(...)`, or drifts from the windowed composition.
- **Browser audit failed** — if the final browser artifact gate runs and reports failures, the deck cannot be delivered. In sandbox environments where Chromium is unavailable, static-only audit is acceptable but the deck should be re-audited locally before final delivery.
- **Broken images** — any slide has a `brokenImage` in the browser audit.
- **Missing `prefers-reduced-motion`** — the output HTML must contain `@media(prefers-reduced-motion:reduce)` to disable non-essential animations.
- **Data URI images with `loading="lazy"`** — self-contained base64 images must use `loading="eager"` to avoid unpredictable render timing.
- **LaTeX-JSON collision** — Two failure classes: (1) Hard crash — `\star`, `\arg`, `\mathbb` etc. crash `JSON.parse` entirely, deck white-screens. (2) Silent corruption — `\beta`, `\frac`, `\theta` etc. are silently consumed as control characters. Both are eliminated by using the base64 transport. If the legacy String.raw path is used, all LaTeX backslashes must be double-escaped.
- **Missing base64 transport** — The final HTML must use `SLIDE_DATA_B64` (base64-encoded slide JSON). If the renderer was available and the deck uses the legacy String.raw path instead, this is a BLOCKING failure.
- **Post-render validation failed** — After generating the final HTML, the base64 payload must be extractable, decodable, and parseable as a valid JSON array. If this round-trip fails, the artifact cannot be delivered.

---

## Do

- Compose slides using the primitives that best serve the content.
- Let the LM decide how to arrange each slide based on the paper.
- Build hierarchy with font size, weight, whitespace, and color.
- Use semantic color tokens for labels and highlights.
- Let paper figures dominate their slides.
- Leave generous empty space.
- Make every pixel serve communication.
- Lock the deck brief, script, visual plan, and design direction before polishing HTML.
- Keep presenter chrome minimal and non-distracting.
- Ensure all text wraps safely.
- Ensure fullscreen fills the viewport.
- Adapt atmosphere to paper domain.
- Add motion only after the static deck is already convincing.

## Don't

- Do not generate a monochrome (all-gray) deck.
- Do not let text overflow its container.
- Do not shrink evidence figures below 50% of the content area.
- **Do not squash figures to thumbnails to fit on a busy slide.** If the figure would render smaller than 200px tall, give it a dedicated slide instead. Unreadable figures are worse than no figure.
- Do not make the deck feel like a dashboard, admin panel, or landing page.
- Do not force every slide to change mood just to prove variety.
- Do not use generic emoji as icons — use SVG icons or paper figures only.
- Do not add meaningless decorative icons.
- Do not paste full-paragraph abstracts.
- Do not show unreadable tables (font < 18px on the base stage).
- Do not let decoration compete with evidence.
- Do not ship a "self-contained" deck that still depends on Google Fonts or other remote assets.
- Do not add perpetual ambient motion or shimmer before the static composition is already clear.
- Do not fullscreen the wrong element.
- Do not use responsive media queries to reflow the slide canvas.
- **Do not use inline `style` attributes for font-size or color in render functions.** Use CSS classes and semantic tokens so audits can verify the design system.
- **Do not use `var(--muted)` or `var(--border)` directly on dark-background moods.** These default to dark gray and are invisible on dark backgrounds. Define explicit mood overrides.
- **Do not skip fullscreen testing.** Every slide must be visually verified in fullscreen mode before delivery.

---


## Design reference injection

When the user provides external design references (GitHub repo, URL, DESIGN.md, component library):
1. Extract style vocabulary: colors, fonts, spacing, component patterns.
   Use [references/external-design-principles.md](references/external-design-principles.md) to translate generic UI advice into slide-safe rules.
2. Normalize into constraints compatible with [assets/design/DESIGN.md](assets/design/DESIGN.md).
3. Merge: external aesthetics may influence palette, font choice, surface treatment, deck rhythm, and motion policy.
4. Protect: research readability, deck-level cohesion, whitespace minimums, figure prominence, offline self-containment, and projector safety are non-negotiable and override external input.

---

## Platform compatibility

This skill is designed for Gemini CLI and uses `SKILL.md` natively. Adapted instruction files for other platforms are in `agents/`:

- **Gemini CLI**: uses this `SKILL.md` directly. Config: `agents/gemini/config.yaml`.
- **ChatGPT Custom GPT**: distilled system prompt in `agents/chatgpt/system_prompt.md`.
- **Claude Projects / Claude Code**: XML-tagged instructions in `agents/claude/CLAUDE.md`.
- **OpenAI**: metadata in `agents/openai/config.yaml`.

See [references/platform-adaptation-guide.md](references/platform-adaptation-guide.md) for setup and fallback strategies.

Use `python scripts/export_platform_configs.py --platform all --validate` to check all platform configs.

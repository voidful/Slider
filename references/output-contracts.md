# Output Contracts

## Default: Single self-contained HTML file

The default output is a single `.html` file **built from the canonical template** (`assets/html-slideshow-starter/paper-presentation.html`). Never generate HTML from scratch.

The canonical template already provides all CSS, JS, DOM structure, navigation, playback, full editor, and presenter controls. The LM only needs to:
1. Read the template file.
2. Inject the `slides` JSON array at `// @render-slide-data`.
3. Update `<title>`, `themePreset`, and `venuePreset` at their respective markers.

Use `render_slideshow_artifact.py` when script execution is available.

### Requirements
- **Built from canonical template** — output must contain `<meta name="generator" content="slider/paper-presentation-v1"/>`.
- One complete HTML file with embedded CSS and JavaScript (from the template).
- Structured `slides` array with the expanded research schema.
- Previous/next navigation, arrow keys, space for next (from the template).
- Slide counter and progress bar (from the template).
- Play/pause auto-advance, overview mode, fullscreen toggle, laser pointer, and editor mode (from the template).
- Phone remote pairing via the bundled controller URL (`?token=...`), with slide navigation, fullscreen/play control, annotations, highlights, note sync, and link sending (from the template). The default QR must not depend on a third-party controller domain; use `data-remote-controller-url` only when the user provides their own static controller/deck URL.
- Multi-collaborator mode over the same remote link: every connected phone gets a name/color identity, appears in the collaborator roster, and contributes author-labeled ink and notes.
- Edit mode must preserve inline text editing, slide inspector editing, image insertion, theme editing, draft save/load, JSON import/export, and self-contained HTML export.
- Number-key jump, home/end (from the template).
- All evidence policy, visual inclusion, and design system rules apply.

## Mode B: React slideshow app

Use when the user explicitly requests React, a web app, or an interactive component.

### Requirements
- Runnable React code with data-driven slide array.
- Same navigation and presenter controls.
- Same evidence and design rules.

### Preferred stack
- React, Tailwind CSS, lucide-react.
- Optional Framer Motion for subtle transitions.

## Mode C: React project scaffold

Use when the user wants a reusable project, multi-file codebase, or stronger presenter tooling.

### Requirements
- Directory-based React app.
- Separate slide data, components, and config modules.
- Linked presenter window for current/next preview, notes, timer, jump control, and blackout commands.
- Projection controls for laser pointer, wheel navigation, and touch swipe navigation.
- Review comments that can be exported as JSON for agent follow-up.
- Paper visual asset manager for bound/missing visual review.
- Design lock panel backed by `deck_design.json` rather than ad-hoc per-slide styling.
- Static and PDF export scripts.
- Same evidence and design rules.

## Shared requirements across all modes

All output modes must:
- Enforce the paper visual inclusion policy.
- Enforce the research visual priority system.
- Follow the design system in DESIGN.md.
- Pass the design audit and evidence fidelity audit.
- Render research elements (method figure frames, result table frames, equation frames, qualitative comparison frames) as first-class layouts, not generic bullets.

## Planning mode

When the user asks for planning before code:
1. Deck summary with paper type classification.
2. Visual plan: which paper figures go where.
3. Design summary.
4. Slide-by-slide structure with visual bindings.
5. Implementation plan.

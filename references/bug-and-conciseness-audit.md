# Bug and Conciseness Audit

## Goal

Run a quality pass before packaging the skill or trusting major updates.
Catch rendering regressions, not just content issues.

## Preferred workflow

Run:

`python scripts/check_skill_health.py`

This should validate:
- Python script syntax,
- SKILL.md reference integrity,
- evidence to slideData roundtrip,
- slideData to artifact roundtrip,
- React template syntax,
- unresolved template markers,
- simple conciseness thresholds.

Then run:

`python scripts/audit_research_slides.py --slide-data <plan.json>`

This should validate:
- overflow and density violations,
- visual prominence and evidence dominance,
- color/monochrome detection,
- fullscreen implementation in the HTML template,
- paper-type mandatory visual compliance,
- acceptance tests.

## Rendering regression checks (MANDATORY)

Before each release, verify the HTML template against these regressions:

### 1. Fullscreen
- Open the HTML file in a browser.
- Press F or click the fullscreen button.
- The slide must fill the entire viewport while preserving 16:9 content.
- The slide must NOT remain a small centered frame.
- Escape must exit fullscreen cleanly.

### 2. Overflow
- Every slide title must wrap within its container.
- No bullet text may overflow the slide boundary.
- Long table labels must not push the table off-screen.
- Captions must not cover figure content.
- Every `.slide.stack` child must have `min-height:0; flex-shrink:1`.
- Evidence-frames and custom-html blocks must use `flex:1 1 0; min-height:0; overflow:hidden`.
- No SVG wrapper may use an absolute `max-height` (e.g., `560px`); use `100%` instead.

### 3. Color
- The deck must use semantic colors, not just black/gray.
- Result slides must use `--positive` (green) for gains.
- Limitation slides must use `--negative` (red) for warnings.
- Method labels must use `--accent` (blue).
- Progress bar and timer must use `--accent`.

### 4. Visual size
- Method figures must occupy ≥65% of the content area.
- Result tables or charts must occupy ≥50% of the content area.
- No evidence figure should render as a thumbnail when it is the slide's primary visual.

## What to do when the audit flags issues

### Failures
Fix immediately.
Typical examples:
- text overflow,
- fullscreen broken (targets wrong element),
- monochrome deck (no semantic colors),
- evidence figure too small,
- broken references,
- script syntax errors.

### Warnings
Review and decide whether the complexity is justified.
Typical examples:
- borderline text density,
- figure slightly under 65%,
- minor color inconsistency.

## Conciseness rule

Prefer small, composable scripts over one large script.
Prefer compact starter templates over many ad hoc branches.
Prefer references for detail and keep `SKILL.md` as a control plane.

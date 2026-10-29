# Task workflows

Use the relevant section. The sequence below describes data dependencies for a new deck; it is not a requirement to repeat completed work.

## Create a talk

### Establish the source and brief

Resolve the paper and version from the supplied PDF, arXiv URL, DOI, title, or text. Prefer the full paper. Read [paper ingestion](paper-ingestion-workflow.md) if extraction or source resolution is needed. If only an abstract is accessible, explain that limitation and avoid inferring results or figures.

Use the user's audience, language, duration, and format. If these are unspecified, use the defaults in [SKILL.md](../SKILL.md) and state material assumptions briefly. Do not turn routine planning choices into approval checkpoints.

When the user asks to build the talk together, step by step, use the [guided deck workflow](guided-deck-workflow.md): one question per turn, an outline approval, then the deck's Guide. Record the answers in `meta.brief`.

### Select the argument and evidence

Build a talk thesis and a sequence of claims, then map each to a paper section, equation, figure, or table. Use [presentation logic](presentation-logic.md) for pacing and [paper type policy](paper-type-policy.md) when selecting evidence.

A compact brief, slide sequence, visual mapping, and theme choice are enough. They may live in the working notes or slide JSON; separate planning documents are optional.

When source processing needs automation:

| Need | Helper |
|:---|:---|
| Extract paper text/evidence | `scripts/extract_paper_evidence.py <source> --output evidence.json` |
| Locate figure/table candidates | `scripts/find_visual_evidence.py <source> --output visuals.json` |
| Rank candidates | `scripts/score_visual_candidates.py --visuals visuals.json --evidence evidence.json --output scored.json` |
| Crop figures/tables | `scripts/export_pdf_visuals.py paper.pdf --candidates scored.json --output-dir paper-assets --manifest exports.json` |
| Seed a slide plan | `scripts/generate_slide_data.py --evidence evidence.json --visuals scored.json --mode json --output slide-plan.json` |
| Bind exported visuals | `scripts/bind_visual_assets.py --slide-data slide-plan.json --visuals scored.json --exports exports.json --output bound-plan.json` |

Run helpers from the skill root with `python3`, using absolute input/output paths when working elsewhere. Read a helper's `--help` for optional settings. Python helpers are independent tools; using one does not require the entire pipeline.

Candidate detection and generated text are heuristics. Inspect actual crops and compare substantive claims to the paper. The generator creates a long-talk scaffold, including possible filler or unsupported generic text; revise, remove, merge, or reorder slides before delivery. It does not accept a duration/slide-count parameter. For an exact slide count, author or revise the JSON array directly.

Follow [figure triage](figure-table-extraction.md), [PDF cropping](pdf-visual-cropping.md), and [faithful redraw](faithful-redraw-policy.md) only as needed. Bound file paths are not automatically embedded by the renderer: convert local image bytes to data URIs for portable HTML.

### Compose and render

Use the [slide schema](slide-data-generation.md). Preserve source metadata in notes; labels such as `evidenceNote`, `fidelityRisk`, and `whyThisVisual` guide authoring rather than becoming audience text.

Write titles as claims and keep wording to the [slide copy rules](slide-copy-rules.md); the renderer reports major and moderate wording findings, and `scripts/audit_slide_copy.py --slide-data slide-plan.json` lists all of them. Choose layouts around the evidence. Detailed design work uses [DESIGN.md](../assets/design/DESIGN.md); a coordinated React project may also use [deck design compilation](deck-design-control-plane.md). Design choices do not require a separate approval unless the user requested a review milestone.

Render the selected [output mode](output-contracts.md). Use [artifact rendering](artifact-rendering.md) for transport, math, and asset handling. Complete the applicable [verification](verification-workflow.md), correct observed defects, and deliver the requested file/project.

## Revise an existing deck

Read the supplied deck/slide data and the specific source evidence affected by the request. Preserve working edits, speaker notes, evidence bindings, and the chosen output format.

- A wording fix updates the affected field and checks its rendered wrapping.
- A number or caption change also checks the paper source and comparison context.
- A duration change revises the main-deck sequence, retaining the thesis, key evidence, and relevant limitations.
- A theme or shared layout change checks representative layouts and then the final deck for global regressions.
- Presenter/editor behavior changes use [presenter UX](presenter-ux.md) and the relevant feature reference from the [index](README.md).

Reuse the existing source bundle and visual assets unless the change makes them stale. Do not regenerate the talk or recompile its design just to change one sentence. The canonical template is the default engine; maintaining or fixing that engine is allowed when it is part of the user's request.

### Apply review comments

Comments come from the HTML editor's comment mode, either inside the deck (`slide.comments`) or as File › Export comments (`slide-comments.json`). For each open comment, edit the field its `path` names, or the whole slide when `path` is empty. Keep claims, numbers, names, and citations unless the comment asks to change them, and check a requested number against the paper. Then set `resolved: true` on that comment, re-render, and report any comment you could not apply and why.

## Audit or plan only

For an audit, report concrete slide-level findings, severity, source locations, and suggested corrections using [verification](verification-workflow.md). If source material is absent, distinguish rendering observations from scientific claims you could not verify. Do not edit a deck solely because an audit found a problem.

For a plan, deliver the thesis, ordered slide messages, visual/source bindings, likely pacing, and material source gaps. Do not require HTML generation or browser tests to finish a plan-only request.

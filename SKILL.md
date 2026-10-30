---
name: slider
description: Create, revise, or audit research-paper talks as browser slides from a PDF, arXiv link, DOI, or paper text. Use for evidence-backed presentations, not general paper summaries or websites.
---

# Slider

Turn a research paper into a talk whose claims, figures, and limitations can be traced to the source. Default to a browser-openable HTML deck; preserve the user's requested format.

## Task scope and defaults

The user's instructions take precedence over this skill's workflow and style guidance, subject to the host's higher-priority rules. Carry forward their audience, language, duration, slide count, output format, and earlier approvals.

- With no delivery brief, assume a research audience and a roughly 15-minute talk in the user's language. Choose the slide count to fit the content; the generator's 15+ slide scaffold is a starting point, not a minimum.
- Infer routine choices and continue through the requested artifact, relevant checks, and fixes. A plan or first render is not completion when the user asked for a finished deck.
- Ask only when a missing source, ambiguous paper identity, or consequential delivery choice prevents a faithful result. Continue work that does not depend on the answer.
- Planning requests end at a plan; audit-only requests end at findings. A local edit does not authorize publication, uploads, or changing sharing settings.
- Use tools and any delegation according to the host's capabilities and permissions. This skill requires no particular model, API, or subagent setup.

## Choose the work to do

Read only the row relevant to the task and follow further links as needed. Paths are relative to this skill's directory; keep generated files in the user's output workspace.

| Task | Start here | Finish with |
|:---|:---|:---|
| Create a talk from a paper | [Task workflows](references/task-workflows.md), creation section | Requested deck and accurate validation status |
| Revise an existing deck | [Task workflows](references/task-workflows.md), revision section | Requested changes with affected content and rendering checked |
| Audit a deck | [Verification workflow](references/verification-workflow.md) | Prioritized findings with slide/source locations; edit only if requested |
| Plan a talk | [Presentation logic](references/presentation-logic.md) | Talk thesis, slide sequence, evidence choices, open source gaps |
| Build a talk with the user step by step | [Guided deck workflow](references/guided-deck-workflow.md) | One question per turn, an approved outline, and an honest status label |
| Change Slider itself or platform packaging | [Skill maintenance](references/skill-maintenance.md) | Scoped implementation/docs changes and applicable checks |

## Evidence contract

- Preserve claims, values, units, datasets, baselines, uncertainty, and absolute versus relative gains. Separate the paper's findings from illustrative explanations or your interpretation.
- Use the paper's key method/result visuals when they support the talk's thesis. Inspect crops for missing axes, labels, legends, or comparison context. Follow the [visual inclusion policy](references/paper-visual-inclusion-policy.md).
- A faithful redraw needs inspectable source data or structure and a citation. A missing source is not permission to invent a chart. See [faithful redraw](references/faithful-redraw-policy.md).
- A placeholder never satisfies a required visual. For incomplete sources, identify the gap and deliver only the supported plan or clearly labeled draft; do not describe it as fully verified.
- Give each slide one main message, with wording that follows the [slide copy rules](references/slide-copy-rules.md). Put source references, visual rationale, caveats, and speaking cues in speaker notes. Keep internal audit/planning metadata off the slide face.

## Build the requested artifact

Use the [slide data schema](references/slide-data-generation.md) for generation or content revisions, and [output contracts](references/output-contracts.md) to choose HTML, React, or a React project.

For the default HTML deliverable:

1. Create or update structured slide data with real evidence bindings.
2. Use [render_slideshow_artifact.py](scripts/render_slideshow_artifact.py) and the bundled canonical template. This preserves navigation, editor controls, and tested data transport.
3. Review the resulting slides and fix relevant defects before handing over the file.

```bash
python3 scripts/render_slideshow_artifact.py \
  --slide-data slide-plan.json --mode html --output deck.html
```

Use normal JSON serialization for LaTeX and Unicode; the renderer carries the serialized data as base64. Base64 protects transport, not malformed source JSON or unsupported claims. If execution is unavailable, provide structured slide data and state that the artifact has not been built.

Preserve these renderer invariants:

- The same 1200×675 slide stage appears in windowed and fullscreen modes; only its scale changes. Viewport-dependent reflow belongs to surrounding controls.
- Evidence and text remain readable without clipping or scrollbars. Simplify or split crowded slides instead of hiding content or repeatedly shrinking type.
- Required visuals render with real content; original crops and faithful redraws retain their provenance.
- Generated decks start in presentation mode and retain navigation, notes, and editor access.
- Embed paper images for portable output. The bundled template still references network services for math and phone features; apply the offline guidance in the output contract before claiming offline readiness.

For design work, read [DESIGN.md](assets/design/DESIGN.md). Use existing themes and layouts as defaults, with changes driven by the user's brief and the evidence. Slide transitions and entrances follow a [motion preset](references/motion-graphics.md), `editorial` by default. Once the static slides work, match motion to each slide's content with per-slide `transition`, `motion`, and `morph`, using that reference's content map: calm dense tables and equations, carry a shared figure across slides with `morph`, stagger a pipeline, and leave strong transitions to the accent slides. A brief that asks for more, less, or no motion takes precedence. Compile a [deck design](references/deck-design-control-plane.md) when coordinated design settings are useful; routine text edits do not require recompilation.

## Verification and handoff

Use the [verification workflow](references/verification-workflow.md) for the affected scope. Reuse checks the renderer already ran. Re-run after a relevant change or failure, not simply to repeat a passing check.

A finished deck opens, renders its supported content, preserves claim-to-source alignment, and meets the requested delivery brief. Report the artifact path, what was checked, and any material unverified behavior. Automated passes are not proof of scientific correctness or actual projector/native-fullscreen testing.

If a tool or input is unavailable, distinguish that limitation from a failed check. Preserve completed work and describe the specific missing step; do not repeatedly retry an unchanged blocker.

## Further references

Use the [reference index](references/README.md) to find specialized PDF/table processing, presenter controls, design, and platform resources. The index is a lookup aid, not a reading checklist.

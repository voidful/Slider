# open-slide Adoption Notes

Reviewed sources: `1weiho/open-slide` at commit `73846490772893a5bce7db63efdf0192e84cfa6b` (2026-08-18), MIT licensed, and the open-slide.dev site for v2.3.1 (2026-10-29).

## Adopted or adapted

| open-slide strength | Slider adaptation |
|:---|:---|
| Presenter view (P) with Markdown notes and a timer | HTML deck: presenter window (`P`) with the current beat and the next build, Markdown-lite notes, a timer paced against `meta.brief.minutes`, and black screen. React starter: linked presenter window |
| Comment mode (C) with pins and a badge, then apply-comments | HTML editor comment mode (`C`): pins on any field, a count badge, resolve and reopen, and File › Export comments (`slide-comments.json` with apply instructions). React project: semantic review targets with an agent handoff |
| Agent panel that scopes a task with option cards | HTML editor Guide (`G`): the talk brief asked one question at a time, then one next step per finding with an inline fix, an agent prompt, ignore, or skip. The interview rules come from life-design-compass ([guided deck workflow](guided-deck-workflow.md)) |
| ⌘K command menu | HTML deck command menu (Ctrl/⌘ K): full-text slide search plus every deck action, in present and edit mode |
| `Transition`, `Step`, and `MorphElement` | Twelve animated transitions plus `none`, including `morph`, which pairs shared figures, metrics, and titles automatically or by `slide.morph` id. Builds come from data (`revealOrder`), shared by all runtimes |
| `ImagePlaceholder` with Replace | Drop an image on any figure slot, or Choose image in the inspector or the Guide; the slot's label becomes the caption and alt text |
| Overview grid and preview route | Overview with real thumbnails and build, transition, and notes markers. Deep links `#/N` and `#/N/B`, plus `?chrome=0` for embeds |
| Static HTML and PDF export | Self-contained HTML export; print to PDF at one 1200×675 page per slide at final builds, plus an A4 handout with notes |
| Visual inspector, themes, undo | Existing structured inspector, theme presets, palette editing, and undo/redo |
| Localized interface | zh-TW and English slide wording rules ([slide copy rules](slide-copy-rules.md)), checked in the Guide and by `audit_slide_copy.py` |
| Fixed canvas with scale-only presentation | Existing 1200×675 stage contract retained; the windowed deck now also centers in windows narrower than the stage |

## Deliberately not adopted

| Feature | Reason |
|:---|:---|
| PPTX export | Lossy for math, motion, and builds. HTML and PDF keep the rendered stage exact |
| Free-form drag positioning on the canvas | Breaks the fixed-stage layout audits; Slider edits structured fields and blocks |
| In-browser agent that calls a model | A portable deck holds no API keys. Agent work happens in the host, fed by the copied prompt or the exported comments |
| Monorepo runtime and multi-deck home | Slider is a paper-to-artifact skill, not a deck workspace product |
| Browser writes directly into TSX source | Conflicts with portable `file://` and static-host operation; comments export as a sidecar instead |
| Arbitrary React as the default authoring format | Slider keeps structured evidence fields auditable before rendering |
| Remote logo and asset search | Research figures must remain source-traceable and the final deck self-contained |
| 1920×1080 canvas | Slider preserves its rehearsed 1200×675 coordinate contract to avoid visual drift |

Future adoption should preserve four invariants: evidence fidelity, fixed-stage composition, self-contained default output, and post-render auditability.

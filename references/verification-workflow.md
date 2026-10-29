# Verification workflow

Choose checks that can reveal defects in the requested work. Complete relevant checks and fixes without repeatedly asking for permission. A passing check need not be repeated unless its inputs changed or a new concern appeared.

## Select the scope

| Change | Useful verification |
|:---|:---|
| Plan only | Paper/source alignment, talk thesis, visual mapping, requested timing |
| Wording on one slide | Changed text, relevant source if meaning changed, rendered wrapping |
| Result/figure change | Exact source values and context, crop integrity, binding, legibility |
| New or substantially revised deck | Evidence review, render integrity, all-slide browser inspection |
| Shared theme/layout | Representative layouts during iteration, final all-slide rendering check |
| Presenter/editor behavior | Changed interaction and related navigation/state behavior |
| Skill/README/platform metadata | Frontmatter, links, referenced files, exports as applicable |
| Pipeline or renderer code | Relevant synthetic roundtrip and affected artifact modes |

## Evidence review

Compare substantive claims and numbers to the paper. Check the metric, dataset, baseline, units, and direction of each result. Distinguish original figures, crops, redrawn tables, and illustrative diagrams.

Required visuals must contain real evidence and preserve their source context. Placeholders, binding metadata alone, and high confidence scores do not prove that a figure is correct. Read figures at the size used in the talk.

Use `scripts/audit_research_slides.py --slide-data slide-plan.json --paper-type architecture-heavy` for applicable heuristics, choosing the actual paper type. Density/coverage warnings are prompts to inspect content; do not add irrelevant figures or slides to silence them. Unsupported claims and unreadable evidence need correction regardless of a numerical score.

## Render integrity

The HTML renderer already checks base64 payload integrity, static artifact rules, and attempts browser auditing. Inspect its report before scheduling duplicate checks.

Verify the generated file opens in presentation mode, renders the intended slide count, and preserves notes and controls. Ensure the actual embedded JSON decodes, including Unicode and LaTeX. A template marker alone cannot establish correctness.

For layout changes, `scripts/audit_design_comfort.py deck.html` can identify structural concerns. Static checks do not prove that a diagram, equation, or color contrast is readable.

## Browser inspection

Use available browser tooling. The bundled `scripts/browser_slide_audit.py deck.html` uses Chromium to inspect every slide in windowed and simulated-fullscreen modes for overflow and broken images.

- Inspect crowded tables, equations, figures, long titles, and light/dark layouts at presentation size.
- Fix clipped content or unreadable labels by simplifying or splitting. Do not use hidden overflow to conceal evidence.
- Check changed controls, slide navigation, and build ordering when applicable.
- Simulated-fullscreen geometry is not a test of the browser's native Fullscreen API, a physical projector, or real phone pairing. Check those explicitly when they are part of the requested work.

If the browser is unavailable, record the skipped check and deliver the supported artifact as a draft with that limitation. Do not report browser verification as passed. Use the tools actually available rather than assuming capabilities from a platform name.

## Offline claims

For offline delivery, inspect external images, styles, scripts, fonts, and network services, and test the final file with network access disabled when possible. Bundling KaTeX alone does not remove phone signaling/QR dependencies. See [output contracts](output-contracts.md).

## Fixes and stopping condition

Fix observed defects caused by the task and rerun affected checks. If the same failure persists, reconsider the content/layout or tool assumption instead of repeating the same action. There is no arbitrary three-cycle limit that turns an incomplete deck into a finished one.

Finish when the requested artifact and relevant checks are complete. If blocked by missing input or capability, retain the work and name the concrete missing step. For audit-only requests, deliver findings without making edits.

In the handoff, distinguish checks that passed, checks that failed, and checks not run. Keep the report concise and link the artifact. Do not claim end-to-end quality from a synthetic repository health check.

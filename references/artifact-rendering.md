# Artifact rendering

Read this when producing or fixing an artifact. Use [output contracts](output-contracts.md) for format selection and offline/network limits.

## HTML build

Prepare valid slide JSON, then run:

```bash
python3 scripts/render_slideshow_artifact.py \
  --slide-data slide-plan.json --mode html --output deck.html
```

The renderer accepts either a slide array or an object containing `slideData`. It uses the canonical HTML template, injects a base64-encoded UTF-8 payload, and attempts static/browser checks. It preserves supplied image references; it does not bundle local files automatically.

Normal deck creation changes slide data and theme/venue choices. Read [HTML engine internals](html-engine-template.md) only when debugging or extending rendering. Template maintenance is permitted when requested; verify the changed behavior and preserve working controls.

## JSON and math

Serialize structured data with a JSON library. In hand-written JSON, a LaTeX backslash must be escaped:

```json
{"type": "equation", "content": "$$\\beta = \\frac{1}{2}$$"}
```

In the decoded equation, each command has one backslash. The base64 layer prevents JavaScript string interpolation from consuming escapes, but it cannot correct arbitrary malformed JSON, unsupported formulas, or source inaccuracies.

The HTML renderer decodes its emitted payload and verifies a nonempty array. Do not switch to manual `String.raw` injection, hand-encoded base64, or a mental parse check when the bundled renderer can execute.

Math is rendered by KaTeX. For offline requirements, follow the [output contract](output-contracts.md) and inspect the final equation rendering, not merely the presence of a script tag.

## Images and provenance

For portable HTML, convert selected image bytes to data URIs and put them in `visual.src` or figure-block `content.src`. Preserve captions, source references, and the distinction between original crops and redrawn evidence.

Inspect the selected crop before embedding: cropping away an axis, legend, baseline, or panel label can change the meaning. See [faithful redraw](faithful-redraw-policy.md) and [figure embedding](paper-figure-embedding.md).

Use actual source content for every required visual. A placeholder, filename, or high binding score is not evidence.

## Composition and integrity

Use classic layouts or `contentBlocks` according to the evidence. Keep the same 1200×675 stage at every viewport scale; fullscreen does not change its typography or structure.

- Give primary figures enough area for readable labels. A dedicated figure slide is often clearer than squeezing it below metrics.
- Avoid tall combinations of a table, metric grid, and explanatory paragraphs on one slide.
- For the existing result-table layouts, preserve the stacked metrics/figure structure. See [HTML engine internals](html-engine-template.md).
- Keep equations readable without scrollbars. Shorten notation, use aligned lines, or split a crowded slide.
- Use stage-independent type sizes and predictable flex/grid containment. If the two density-fit classes cannot fit the content legibly, revise the content.
- Preserve presentation mode on initial load, editor access, notes, and navigation. Do not display internal audit/planning fields as slide prose.
- Allow reduced-motion behavior and load embedded images reliably before measuring.

The template identity marker, controls, and data payload are useful integrity signals; their presence alone does not establish a usable deck.

## Verification

Use [verification workflow](verification-workflow.md) for the requested scope. Review the renderer's existing report. Inspect source alignment, rendered evidence, long titles, tables, equations, and any changed controls. Report warnings in context and distinguish a browser skip from a passed browser audit.

## React modes

For `--mode react`, use [React implementation rules](react-implementation-rules.md). For `--mode react-project`, use [multi-file React project](multi-file-react-project.md). Compile and embed a deck design when coordinated React project settings are needed. Do not claim a component is a built, browser-openable artifact until the relevant project build succeeds.

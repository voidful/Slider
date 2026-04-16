# Paper Ingestion Workflow

## Goal

Normalize paper inputs into a trustworthy evidence bundle before slide design begins.

Use extraction to reduce searching cost, not to replace careful reading.

## Source priority

Use the best available source in this order:
1. full paper PDF,
2. full paper text,
3. authoritative paper page with abstract and metadata,
4. title or identifier that can be resolved to the paper.

Do not build the final deck from abstract-only input when a fuller source is available.

## Script-assisted workflow

When a local source file is available and code execution is practical:
1. run `scripts/extract_paper_evidence.py <source>` to create a first-pass evidence bundle,
2. run `scripts/find_visual_evidence.py <source>` to locate figure and table candidates,
3. verify the highlighted claims, numbers, and visuals against the source,
4. run `scripts/generate_slide_data.py --evidence evidence.json --visuals visuals.json --mode json` to create a first-pass slide plan when practical,
5. only then start deck rendering.

Treat both script outputs as heuristics.
The final presentation must still be checked against the paper.

## Required extraction order

### Stage 1. Identity
Extract:
- title,
- authors,
- affiliation or venue context if available,
- year,
- paper URL or identifier.

### Stage 2. Thesis
Extract:
- one-sentence tl;dr,
- problem statement,
- why the problem matters,
- the main claimed contribution,
- the central insight.

### Stage 3. Method bundle
Extract:
- task setup,
- assumptions,
- inputs and outputs,
- model or pipeline overview,
- key modules,
- objective or loss,
- algorithm or training procedure,
- inference behavior if relevant.

### Stage 4. Experiment bundle
Extract:
- datasets,
- metrics,
- baselines,
- training or evaluation protocol when important,
- main results,
- ablation findings,
- qualitative findings,
- error analysis or robustness findings.

### Stage 5. Boundary bundle
Extract:
- explicit limitations,
- missing comparisons,
- fragile assumptions,
- weak evidence areas,
- unresolved questions.

## Evidence handling rules

### Numbers
For every number you surface in a slide, keep track of:
- metric name,
- dataset or benchmark,
- baseline or reference comparison,
- whether the gain is absolute or relative,
- the exact value when available.

Do not round aggressively unless the paper already reports the rounded value.

### Figures and tables
When figures matter:
- inspect the actual figure visually when possible,
- identify the single conclusion the figure supports,
- simplify or redraw for presentation,
- do not copy dense unreadable paper screenshots into the main deck.

When tables are dense:
- extract only the rows and columns that support the slide message,
- enlarge the relevant comparison,
- annotate the key result directly.

Use [references/figure-table-extraction.md](figure-table-extraction.md) for the actual triage rules.
Use [references/pdf-visual-cropping.md](pdf-visual-cropping.md) when you need export-ready crops from a PDF.

### Claims
Every claim shown in the deck should map to one of these evidence types:
- explicit statement by the authors,
- direct result in a table or figure,
- direct method description,
- cautious inference based on clearly presented evidence.

Mark inferences as inferences.

## Evidence bundle template

Before slide generation, organize the paper into this internal structure:
- identity
- tl_dr
- problem
- motivation
- prior_gap
- core_idea
- method_summary
- method_details
- experimental_setup
- main_results
- analysis_results
- ablations
- limitations
- final_takeaway
- visual_candidates
- slide_plan

## Failure handling

If the paper is incomplete, ambiguous, or missing key evidence:
- say which evidence is missing,
- avoid overclaiming,
- reduce the scope of the deck rather than hallucinating missing content.

## Compression rule

Preserve:
- the core novelty,
- the strongest evidence,
- the cleanest ablation,
- the most important limitation.

Compress:
- repetitive benchmarks,
- long implementation detail,
- redundant figures,
- secondary appendix material.

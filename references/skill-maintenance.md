# Maintaining Slider instructions

Read this when editing Slider itself, its platform adapters, or its GitHub documentation. It is not part of normal deck generation.

## Why the entrypoint is small

This revision follows Eric Provencher's [Rethinking skills and prompts for GPT-6 Astra](https://x.com/pvncher/status/2095991462416490862), read on 2026-09-07. Its relevant guidance is to keep discovery descriptions focused, reveal supporting material only when needed, and replace elaborate recipes with useful task boundaries.

OpenAI's [GPT-6 Astra model guidance](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra), checked on the same date, supports explicit instruction priority, follow-through, concise communication, and verification proportional to the change.

These are instruction-design sources, not evidence that Slider has been benchmarked on a model. Slider does not select API models, reasoning effort, or delegation policy.

## Local maintenance decisions

- Keep the source/evidence contract, fixed-stage rendering, and serialized data transport explicit.
- Route creation, revision, planning, and audit requests to their relevant resources.
- Treat talk length, slide count, narrative sequence, visual coverage targets, and aesthetic presets as context-dependent defaults.
- Keep detailed fragile rendering constraints beside the renderer documentation. Avoid copying them into every adapter.
- Correct conflicting guidance at its source, including platform prompts, examples, and README claims.
- Keep native skill metadata in `agents/openai.yaml`. The per-platform `config.yaml` files are repository handoff metadata, not an OpenAI API or Agents SDK schema.
- Keep already completed checks and user approvals valid; a first draft is not the endpoint of an implementation request.
- Do not add model-specific API machinery, publication steps, or mandatory multi-agent work to a presentation skill.

## Validation scope

Use the checks in [TEST_MATRIX.md](../TEST_MATRIX.md) that match the change. For instructions, validate frontmatter, links, adapter references, and exported resource paths. For exporter changes, exercise actual exports in temporary directories. For renderer/data changes, run the corresponding artifact checks.

The health check uses synthetic evidence and images. Passing it verifies integration behavior; it does not establish paper fidelity, presentation quality, or independent model performance. Record missing optional dependencies and pre-existing warnings separately from new failures.

## Behavioral scenarios for review

These are representative requests and outcomes to inspect, not text-matching assertions or claims that an independent model evaluation has run.

| Request | Expected behavior |
|:---|:---|
| “Make six slides for a five-minute talk in Traditional Chinese.” | Six main slides in the requested language; no padding to the generator's default length |
| “Fix the typo in slide 4.” | Local change and wrapping check; reuse source assets and theme |
| “Audit this deck without editing.” | Findings with locations; files remain unchanged |
| “Only plan the talk.” | Complete plan and evidence mapping; no renderer prerequisite |
| “Use only this abstract.” | Supported outline/draft with source limits; no invented figures, datasets, or results |
| “Prepare the final offline HTML.” | Embedded assets and math, applicable network behavior checked, limits stated |
| “Can you build the deck and fix any rendering problems?” | Continue through generation, relevant verification, and fixes |
| “Fix the presenter shortcut in Slider.” | Edit the engine within scope; verify affected interaction |
| “Summarize this paper in one paragraph.” | Ordinary summarization; do not automatically invoke deck generation |
| “引導我一步一步完成這份投影片。” | Guided workflow: one main question per turn with brief feedback, an outline approval, a status label from the guided workflow; no questionnaire, no slides before the length and takeaway |
| “Just make the deck, no questions.” | Build from defaults; the guided interview is not a precondition |
| “Clean up the wording on these slides.” | Copy rules: protect numbers, names, and citations; fix the biggest problem first; report `audit only` or `delivery pass / validation not run` honestly |
| “Apply the comments in slide-comments.json.” | Edit each commented field, resolve it, re-render, and list any comment left unapplied with the reason |

When `RULES` in `scripts/audit_slide_copy.py` change, run `python3 scripts/audit_slide_copy.py --sync-template assets/html-slideshow-starter/paper-presentation.html` so the Guide runs the same table; `check_skill_health.py` fails until they match.

If a future evaluation exposes a failure, fix the narrow decision boundary or missing invariant that caused it. Do not expand the entrypoint into another universal checklist.

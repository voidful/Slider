# Bug and conciseness audit

Use this for Slider maintenance or a substantial artifact change. Select the checks that match the change; do not run the full pipeline for a typo or a plan-only task.

## Repository checks

Use [TEST_MATRIX.md](../TEST_MATRIX.md) for skill metadata, export regression tests, and pipeline health. Run `scripts/check_skill_health.py` for changes that affect shared instructions, scripts, or artifact integration. Its fixtures are synthetic and cannot validate paper accuracy.

Inspect referenced resources after moving instructions out of the entrypoint. Keep reusable invariants beside the relevant implementation and eliminate contradictory examples from adapters and README documentation.

## Renderer changes

Use [verification workflow](verification-workflow.md) and [HTML engine internals](html-engine-template.md) for affected behavior:

- Fullscreen preserves the same stage and exits cleanly.
- Text, figures, tables, and equations remain readable without clipping.
- Shared layout changes are checked across representative slide types.
- Requested palettes preserve contrast and distinguish important roles.
- Presenter/editor changes preserve related controls and state.
- Structured data, LaTeX, and image bindings survive rendering and export.

Do not claim that a static check proves actual browser interaction or scientific correctness. Fix observed failures and rerun the affected checks. Review heuristic density, visual occupancy, and style warnings against the user's brief instead of treating them as universal quotas.

## Instruction review

Keep skill discovery narrow and the entrypoint short. A workflow reference should change a decision or supply needed mechanics. Do not require every reference, every tool, or repeated passing checks on every task.

See [skill maintenance](skill-maintenance.md) for source rationale and behavioral scenarios.

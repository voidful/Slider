# Reference index

Use this index to locate a resource for the current task. Do not read it or every linked file before a routine edit. Workflow and style defaults remain subordinate to the task scope in [SKILL.md](../SKILL.md).

## Task-specific guidance

- [Task workflows](task-workflows.md): create or revise a talk, or complete plan/audit-only work.
- [Skill maintenance](skill-maintenance.md): maintain instructions, adapters, and documentation; includes source rationale and review scenarios.
- [Guided deck workflow](guided-deck-workflow.md): build a talk with the user one question at a time, then finish it with the deck's Guide.
- [Slide copy rules](slide-copy-rules.md): zh-TW and English wording for titles, bullets, captions, and notes (adapted from Michelin).


### Evidence and visual policy
- paper visual inclusion policy: [references/paper-visual-inclusion-policy.md](paper-visual-inclusion-policy.md)
- research visual priority: [references/research-visual-priority.md](research-visual-priority.md)
- faithful redraw policy: [references/faithful-redraw-policy.md](faithful-redraw-policy.md)
- paper figure embedding pipeline: [references/paper-figure-embedding.md](paper-figure-embedding.md)
- paper type policy: [references/paper-type-policy.md](paper-type-policy.md)

### Design system
- design control plane: [assets/design/DESIGN.md](../assets/design/DESIGN.md)
- deck design specification: [references/deck-design-control-plane.md](deck-design-control-plane.md)
- external design principles: [references/external-design-principles.md](external-design-principles.md)
- research slide patterns: [references/research-slide-patterns.md](research-slide-patterns.md)
- page-role layout families: [references/page-role-layout-families.md](page-role-layout-families.md)
- anti-patterns: [references/research-slide-anti-patterns.md](research-slide-anti-patterns.md)
- fullscreen contract: [references/fullscreen-contract.md](fullscreen-contract.md)
- reading comfort rubric: [references/reading-comfort-rubric.md](reading-comfort-rubric.md)

### Workflow and rendering
- talk arc and compression: [references/presentation-logic.md](presentation-logic.md)
- output mode selection: [references/output-contracts.md](output-contracts.md)
- paper ingestion: [references/paper-ingestion-workflow.md](paper-ingestion-workflow.md)
- figure and table triage: [references/figure-table-extraction.md](figure-table-extraction.md)
- visual selection scoring: [references/visual-selection-scoring.md](visual-selection-scoring.md)
- slide-data planning: [references/slide-data-generation.md](slide-data-generation.md)
- pdf visual export: [references/pdf-visual-cropping.md](pdf-visual-cropping.md)
- artifact rendering: [references/artifact-rendering.md](artifact-rendering.md)
- slide quality rubric: [references/slide-quality-rubric.md](slide-quality-rubric.md)
- bug and conciseness audit: [references/bug-and-conciseness-audit.md](bug-and-conciseness-audit.md)
- verification workflow: [references/verification-workflow.md](verification-workflow.md)
- open-slide adoption notes: [references/open-slide-adoption.md](open-slide-adoption.md)

### UI and interaction
- UI pattern mapping: [references/ui-patterns.md](ui-patterns.md)
- presenter UX: [references/presenter-ux.md](presenter-ux.md)
- progressive builds: [references/progressive-builds.md](progressive-builds.md)
- motion graphics (transitions, text and figure entrances): [references/motion-graphics.md](motion-graphics.md)
- dual-screen speaker view: [references/dual-screen-speaker-view.md](dual-screen-speaker-view.md)
- live tweaks protocol: [references/live-tweaks-protocol.md](live-tweaks-protocol.md)
- HTML engine rules: [references/html-engine-template.md](html-engine-template.md)
- React rules: [references/react-implementation-rules.md](react-implementation-rules.md)
- multi-file React project: [references/multi-file-react-project.md](multi-file-react-project.md)

### Visual processing
- auto-detection strengthening: [references/auto-detection-strengthening.md](auto-detection-strengthening.md)
- multi-panel figure detection: [references/multi-panel-figure-detection.md](multi-panel-figure-detection.md)
- multi-panel geometry: [references/multi-panel-geometry-detection.md](multi-panel-geometry-detection.md)
- panel boundary detection: [references/panel-boundary-detection.md](panel-boundary-detection.md)
- panel separator detection: [references/panel-separator-detection.md](panel-separator-detection.md)
- separator geometry: [references/separator-geometry-refinement.md](separator-geometry-refinement.md)
- table-aware crop: [references/table-aware-crop-refinement.md](table-aware-crop-refinement.md)
- table row and column inference: [references/table-row-column-inference.md](table-row-column-inference.md)
- semantic table parsing: [references/semantic-table-parsing.md](semantic-table-parsing.md)
- semantic table role labeling: [references/semantic-table-role-labeling.md](semantic-table-role-labeling.md)
- semantic role confidence: [references/semantic-role-confidence-calibration.md](semantic-role-confidence-calibration.md)
- confidence calibration: [references/confidence-calibration.md](confidence-calibration.md)
- visual binding confidence: [references/visual-binding-confidence.md](visual-binding-confidence.md)
- metrics visual rendering: [references/metrics-visual-rendering.md](metrics-visual-rendering.md)

### Styling
- theme presets: [references/theme-presets.md](theme-presets.md)
- venue style variants: [references/venue-style-variants.md](venue-style-variants.md)
- venue visual thresholds: [references/venue-specific-visual-thresholds.md](venue-specific-visual-thresholds.md)
- venue appendix policy: [references/venue-specific-appendix-policy.md](venue-specific-appendix-policy.md)
- redundancy suppression: [references/redundancy-suppression.md](redundancy-suppression.md)
- score-aware slide insertion: [references/score-aware-slide-insertion-refinement.md](score-aware-slide-insertion-refinement.md)

### Platform
- platform adaptation guide: [references/platform-adaptation-guide.md](platform-adaptation-guide.md)

### Meta
- architecture: [ARCHITECTURE.md](../ARCHITECTURE.md)
- test matrix: [TEST_MATRIX.md](../TEST_MATRIX.md)
- changelog: [CHANGELOG.md](../CHANGELOG.md)

## Bundled scripts

- evidence extractor: [scripts/extract_paper_evidence.py](../scripts/extract_paper_evidence.py)
- visual candidate locator: [scripts/find_visual_evidence.py](../scripts/find_visual_evidence.py)
- visual scorer: [scripts/score_visual_candidates.py](../scripts/score_visual_candidates.py)
- slide-data generator: [scripts/generate_slide_data.py](../scripts/generate_slide_data.py)
- pdf visual exporter: [scripts/export_pdf_visuals.py](../scripts/export_pdf_visuals.py)
- visual asset binder: [scripts/bind_visual_assets.py](../scripts/bind_visual_assets.py)
- visual asset report: [scripts/visual_asset_report.py](../scripts/visual_asset_report.py)
- slideshow renderer: [scripts/render_slideshow_artifact.py](../scripts/render_slideshow_artifact.py)
- browser slide audit: [scripts/browser_slide_audit.py](../scripts/browser_slide_audit.py)
- research slide audit: [scripts/audit_research_slides.py](../scripts/audit_research_slides.py)
- slide copy lint: [scripts/audit_slide_copy.py](../scripts/audit_slide_copy.py)
- design comfort audit: [scripts/audit_design_comfort.py](../scripts/audit_design_comfort.py)
- deck design compiler: [scripts/compile_deck_design.py](../scripts/compile_deck_design.py)
- health audit: [scripts/check_skill_health.py](../scripts/check_skill_health.py)
- platform export: [scripts/export_platform_configs.py](../scripts/export_platform_configs.py)
- offline KaTeX bundler: [scripts/offline_katex.py](../scripts/offline_katex.py)
- template retrofit: [scripts/retrofit_to_template.py](../scripts/retrofit_to_template.py)

## Starter assets

- HTML starter: [assets/html-slideshow-starter/paper-presentation.html](../assets/html-slideshow-starter/paper-presentation.html)
- React starter: [assets/react-slideshow-starter/App.tsx](../assets/react-slideshow-starter/App.tsx)
- React project starter: [assets/react-project-starter/](../assets/react-project-starter/)
- Design system: [assets/design/DESIGN.md](../assets/design/DESIGN.md)


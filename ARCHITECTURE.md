# Architecture

## Goal

`slider` turns a paper into a ready-to-present conference talk through an evidence-first, audit-backed pipeline. Output is a single self-contained HTML file.

## Pipeline

1. **Ingestion**
   - `scripts/extract_paper_evidence.py`
   - Normalize paper content into an evidence bundle.

2. **Paper type classification**
   - Classify as architecture-heavy / optimization-heavy / benchmark-heavy / theory-heavy / qualitative-heavy.
   - Apply type-specific deck policies from `references/paper-type-policy.md`.

3. **Visual discovery and selection**
   - `scripts/find_visual_evidence.py`
   - `scripts/score_visual_candidates.py`
   - Classify visuals as Priority A / B / C per `references/research-visual-priority.md`.
   - Apply mandatory inclusion from `references/paper-visual-inclusion-policy.md`.

4. **Visual export**
   - `scripts/export_pdf_visuals.py`
   - Crop, inspect, and apply faithful redraw per `references/faithful-redraw-policy.md`.

5. **Slide planning**
   - `scripts/generate_slide_data.py`
   - Build structured slide plan with evidence bindings, visual references, and density budgets.
   - Schema defined in `references/slide-data-generation.md`.

6. **Binding**
   - `scripts/bind_visual_assets.py`
   - Attach exported visuals to slides with source metadata.

7. **Rendering**
   - `scripts/render_slideshow_artifact.py`
   - Produce a single self-contained HTML file (default), React component, or React project.
   - Design rules from `assets/design/DESIGN.md`.
   - Layout patterns from `references/research-slide-patterns.md`.

8. **Design audit**
   - Check against `assets/design/DESIGN.md`.
   - Verify hierarchy, whitespace, projector safety, figure prominence.

9. **Evidence fidelity audit**
   - `scripts/audit_research_slides.py`
   - Check visual inclusion, evidence binding, text density, anti-patterns.
   - Output: actionable revision checklist.

10. **Health audit**
    - `scripts/check_skill_health.py`
    - Validate syntax, references, and roundtrip integrity.

11. **Platform export**
    - `scripts/export_platform_configs.py`
    - Validate and export for Gemini, ChatGPT, Claude.

## Data contracts

### Evidence bundle
Normalized paper content: claims, contributions, method, experiments, visuals.

### Visual candidates
Captions, page numbers, roles, priority tier (A/B/C), multi-panel hints, scores.

### Slide data (expanded v23)
Structured slide plan with: id, title, layout, claim, evidenceType, evidenceSource, mustIncludeVisual, visualBinding, visualFallbackStrategy, densityBudget, audienceGoal, appendixCandidate, fidelityRisk.

## Render targets

- **Built HTML** (default): single file, minified, opens directly in browser.
- **React single-file**: when user requests React.
- **React project**: when user wants multi-file scaffold.

## Design system

`assets/design/DESIGN.md` is the single source of truth for all visual rules. Both the generator and auditor read this file. External design references are merged but cannot override research readability rules.

## Platform adapter layer

Adapted instructions in `agents/`: Gemini CLI, ChatGPT, Claude, OpenAI. See `references/platform-adaptation-guide.md`.

## Design principle

Evidence first. Paper visuals are first-class content. Design serves communication. Audits enforce quality. Output is ready to open.

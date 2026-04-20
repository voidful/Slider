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

5. **Deck design compilation**
   - `scripts/compile_deck_design.py`
   - Compile paper type → mood family → theme preset → semantic palette → type scale → motion policy → page-role bindings into `deck_design.json`.
   - Contract defined in `references/deck-design-control-plane.md`.
   - This locks the deck's visual direction before any individual slide is composed.

6. **Slide planning**
   - `scripts/generate_slide_data.py`
   - Build structured slide plan with evidence bindings, visual references, and density budgets.
   - Schema defined in `references/slide-data-generation.md`.

7. **Binding**
   - `scripts/bind_visual_assets.py`
   - Attach exported visuals to slides with source metadata.
   - Produce visual binding manifest for verification.

8. **Rendering**
   - `scripts/render_slideshow_artifact.py`
   - Produce a single self-contained HTML file (default), React component, or React project.
   - Design rules from `assets/design/DESIGN.md`.
   - Layout patterns from `references/research-slide-patterns.md`.
   - Base64 transport for slide data to avoid LaTeX-JSON collision.

9. **Structured verification** (three-phase pipeline)
   - **Phase 1 (Quick Check):** Structural validity, console errors, template identity marker.
   - **Phase 2 (Static Audit):** Design comfort (`scripts/audit_design_comfort.py`) + evidence fidelity (`scripts/audit_research_slides.py`) + anti-slop check.
   - **Phase 3 (Browser Audit):** Pixel-level overflow verification (`scripts/browser_slide_audit.py`) when Chromium is available.
   - Each phase gates the next. See `references/verification-workflow.md`.

10. **Health audit**
    - `scripts/check_skill_health.py`
    - Validate syntax, references, and roundtrip integrity.

11. **Platform export**
    - `scripts/export_platform_configs.py`
    - Validate and export for Gemini, ChatGPT, Claude.

## Post-render capabilities

### Live tweaks
The rendered HTML includes a customization panel (`references/live-tweaks-protocol.md`) for post-generation adjustments to accent colors, font sizes, mood family, and transition speed. Values persist via `localStorage` and can be exported as `deck_tweaks.json`.

### Speaker notes protocol
Speaker notes are stored as a structured JSON `<script>` block. The template emits `postMessage({slideIndexChanged})` on every slide change for external tool integration.

## Data contracts

### Evidence bundle
Normalized paper content: claims, contributions, method, experiments, visuals.

### Visual candidates
Captions, page numbers, roles, priority tier (A/B/C), multi-panel hints, scores.

### Deck design (v24)
Compiled design decisions: paper type, mood family, theme preset, semantic palette, type scale, spacing scale, motion policy, content handling, cohesion rules, page-role bindings, anti-patterns enforced, comfort targets.

### Slide data (expanded v24)
Structured slide plan with: id, title, contentBlocks/layout, claim, evidenceType, evidenceSource, mustIncludeVisual, visualBinding, visualRequirement, visualSourceType, visualFallbackStrategy, densityBudget, audienceGoal, pageRole, whyThisVisual, whyNow, appendixCandidate, fidelityRisk.

## Render targets

- **Built HTML** (default): single file, minified, opens directly in browser.
- **React single-file**: when user requests React.
- **React project**: when user wants multi-file scaffold.

## Design system

`assets/design/DESIGN.md` is the single source of truth for all visual rules. Both the generator and auditor read this file. External design references are merged but cannot override research readability rules.

Key v24 additions:
- **Content discipline:** every element earns its place; no filler content or data slop.
- **Anti-AI-slop:** explicit ban on generic AI-generated aesthetics.
- **CSS modernization:** `text-wrap: pretty`, `font-variant-numeric: tabular-nums`.

## Platform adapter layer

Adapted instructions in `agents/`: Gemini CLI, ChatGPT, Claude, OpenAI. See `references/platform-adaptation-guide.md`.

## Design principles

1. **Evidence first.** Paper visuals are first-class content. Design serves communication.
2. **Content discipline.** Every element earns its place. One thousand no's for every yes.
3. **Researcher-authored feel.** No AI-slop aesthetics. The deck must look authored, not generated.
4. **Audits enforce quality.** Three-phase verification pipeline gates delivery.
5. **Output is ready to open.** Single self-contained HTML file, no dependencies.

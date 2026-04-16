# Artifact Rendering

## Goal

Turn validated slide data into a ready-to-open HTML file (default) or React artifact.

This is the last implementation step. Do not skip the slide data layer.

## Preferred workflow

1. Generate or revise slide data (see slide-data-generation.md).
2. Run design audit and evidence audit against the slide plan.
3. Fix any audit failures.
4. **Render by injecting slide data into the canonical template** (`assets/html-slideshow-starter/paper-presentation.html`). Use `render_slideshow_artifact.py` if script execution is available. Otherwise, inject the `slides` JSON at the `// @render-slide-data` marker manually.
5. Verify the artifact opens correctly in a browser.

**⚠️ Never generate HTML from scratch.** The canonical template provides navigation, editor, density guard, fullscreen, gallery, export, and keyboard shortcuts. Rewriting any of this code is prohibited.

## Default output: built HTML

The default artifact is a single self-contained HTML file **produced from the canonical template**:
- All CSS and JavaScript come from the template — not rewritten by the LM.
- The `slides` array is injected at `// @render-slide-data`.
- Contains `<meta name="generator" content="slider/paper-presentation-v1"/>`.
- Opens directly in Chrome, Firefox, Safari without any server.

## LM creative freedom

**The LM should compose each slide to best communicate its specific content.** The fixed layout types are efficient defaults for common patterns, but the contentBlocks system is preferred when the paper demands a custom arrangement.

Guidelines for the LM:
- **Analyze the slide content first.** What is the primary evidence? What supports it?
- **Choose the best arrangement.** Use contentBlocks when the standard layouts don't fit the content well.
- **Mix modes freely.** Some slides can use classic layout, others contentBlocks, within the same deck.
- **Adapt atmosphere to paper domain.** A CV paper may benefit from more visual space; a theory paper from equation prominence.
- **Custom layouts are preferred** over generic patterns when the paper content demands it.

## Research element rendering priority

Render these research-specific elements as first-class content:

1. **Method figure** — the figure occupies ≥65% of the content area. Title and ≤3 annotation labels only.
2. **Result table** — table at ≥50% of content area. Header styled, key cells highlighted.
3. **Equation + intuition** — centered equation, plain-language explanation below.
4. **Qualitative comparison** — equal-sized side-by-side panels with clear labels.
5. **Ablation** — compact table or chart. Full-method row highlighted.
6. **Limitation** — warning-tinted background. Crisp limitation statements.

Do not default to generic bullet layouts when a research-specific layout applies.

## Rendering rules

- Keep theme and venue presets editable.
- Preserve the structured `slides` array in the final output.
- Do not collapse the deck into manually hardcoded DOM strings.
- Follow all rules from assets/design/DESIGN.md.
- Support both `layout` and `contentBlocks` rendering modes.

## Quality checks before finalizing

- Verify `mustIncludeVisual=true` slides actually render with visuals.
- Verify titles are argumentative, not generic section names.
- Verify no placeholder starter text remains.
- Verify key numbers have metric, baseline, and dataset context.
- Verify appendix content stays outside the main narrative.
- Verify the HTML file opens correctly without a server.
- Verify minification did not break functionality.
- Verify contentBlocks slides render all block types correctly.
- Verify atmosphere modifiers apply without breaking readability.
- Verify the `<body>` tag does NOT have `class="edit-mode"`. The deck must load in presentation mode.
- Verify JavaScript string literals are syntactically valid: no unescaped newlines inside quoted strings. If generating HTML directly (without the render script), extract the `<script>` block and mentally verify `\n` sequences are two-character escapes, not literal line feeds.
- Verify visual coverage: count slides with real visuals (base64 src or table data). Must be ≥50% of non-cover/takeaway slides.

## React output (when explicitly requested)

Follow references/react-implementation-rules.md. Same evidence and design rules apply.

## React project output (when explicitly requested)

Follow references/multi-file-react-project.md. Same evidence and design rules apply.

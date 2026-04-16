# Platform Adaptation Guide

## Goal

Document how the slider skill adapts to different AI platforms, what each platform supports, and what fallback strategies to use.

## Platform Capability Matrix

| Capability | Gemini CLI | ChatGPT (GPT) | Claude (Projects) |
|:---|:---:|:---:|:---:|
| Script execution | ✅ native | ⚠️ Code Interpreter | ⚠️ tool use |
| File system access | ✅ direct | ❌ sandbox only | ❌ sandbox only |
| Knowledge files | ✅ references/ | ✅ uploads (≤20) | ✅ project knowledge |
| PDF visual inspection | ✅ with tools | ✅ vision | ✅ vision |
| React preview | ✅ with browser | ✅ with artifacts | ✅ with artifacts |
| Multi-file output | ✅ native | ⚠️ single artifact | ⚠️ single artifact |
| Structured data I/O | ✅ JSON files | ⚠️ in-context | ⚠️ in-context |

## Config file locations

Each platform has a dedicated directory under `agents/`:

```
agents/
├── gemini/config.yaml     # Points to root SKILL.md (native)
├── openai/config.yaml     # OpenAI platform metadata
├── chatgpt/               # ChatGPT Custom GPT
│   ├── config.yaml
│   ├── system_prompt.md   # Paste into GPT Instructions
│   └── knowledge_manifest.json
└── claude/                # Claude Projects / Claude Code
    ├── config.yaml
    └── CLAUDE.md          # Project instructions or CLAUDE.md
```

## Gemini CLI

**Native platform.** The skill was designed for this environment.

- `SKILL.md` is read directly as the instruction source.
- `references/` files are accessible via relative paths.
- `scripts/` can be executed with `python scripts/<name>.py`.
- Full pipeline (extract → score → plan → bind → render) works natively.

**Gemini Gems (web app):** The Gems UI provides a single text box for instructions. Paste the contents of `agents/chatgpt/system_prompt.md` into the Instructions field. Reference files cannot be uploaded to Gems.

## ChatGPT Custom GPT

**Setup:**
1. Open the GPT Builder at chat.openai.com.
2. Go to the Configure tab.
3. Paste the contents of `agents/chatgpt/system_prompt.md` into the Instructions field.
4. Upload the reference files listed in `agents/chatgpt/knowledge_manifest.json` as Knowledge files.
5. Enable Code Interpreter if you want the GPT to generate and preview code.

**Limitations and fallbacks:**
- No file system access. The GPT cannot run `scripts/` directly. The system prompt encodes the workflow steps inline so the GPT follows them manually.
- Knowledge file limit is 20. The manifest prioritizes the most important references. Specialized files (panel detection, table parsing, separator geometry) are omitted but their key rules are absorbed into the system prompt.
- Multi-file React project output is possible but the user receives it as a single artifact in the conversation. They will need to extract the files manually.

## Claude Projects

**Setup (Claude Projects — web UI):**
1. Create a new project at claude.ai.
2. Set the project instructions by pasting the contents of `agents/claude/CLAUDE.md`.
3. Upload the reference files listed in `agents/claude/config.yaml` as project knowledge.

**Setup (Claude Code — CLI):**
1. Copy `agents/claude/CLAUDE.md` to your project root as `CLAUDE.md`.
2. Claude Code will discover it automatically.
3. Reference files in `references/` are accessible if the skill directory is in the project.

**Limitations and fallbacks:**
- Claude Projects cannot execute scripts. The workflow steps in `CLAUDE.md` are written as manual procedures.
- Claude responds well to XML-tagged instructions. The `CLAUDE.md` uses `<role>`, `<rules>`, `<workflow>`, `<output_format>`, and `<special_cases>` tags for clear section boundaries.
- Claude's artifacts feature supports React preview, but each artifact is a single file. Multi-file projects require manual extraction.

## Instruction format differences

| Feature | Gemini (SKILL.md) | ChatGPT (system_prompt) | Claude (CLAUDE.md) |
|:---|:---|:---|:---|
| Section delimiters | Markdown `##` | Markdown `###` + `---` | XML tags |
| File references | Relative paths | Inline text | File names in `<context>` |
| Frontmatter | YAML required | Not used | Not used |
| Token budget | Generous | ≤8K recommended | Generous |
| Best practice | Workflow-oriented | Role/task/format | Principles + constraints |

## Fallback strategy for script-dependent steps

When the platform cannot execute Python scripts:

1. **Evidence extraction** — The LLM reads the paper directly and follows the extraction template from `paper-ingestion-workflow.md` manually.
2. **Visual discovery** — The LLM inspects the paper PDF visually (using vision) and applies figure/table triage rules inline.
3. **Scoring** — The LLM applies the scoring criteria from `visual-selection-scoring.md` mentally rather than running the scorer.
4. **Slide data generation** — The LLM constructs the `slideData` array directly in the output, following the data shape from `slide-data-generation.md`.
5. **Rendering** — The LLM generates the final React or HTML artifact directly without using the render script.
6. **Health audit** — The LLM applies the quality rubric from `slide-quality-rubric.md` as a self-check before finalizing.

This manual fallback path produces equivalent results for most papers. The scripts primarily add speed and consistency for batch processing.

## Known pitfalls for LM-direct rendering

When the LM generates the final HTML artifact directly (ChatGPT Code Interpreter, Claude artifact, or any platform without `render_slideshow_artifact.py`):

### Building HTML from scratch (MOST COMMON FAILURE)

The LM may ignore the canonical template and generate its own `<style>`, `<script>`, and DOM structure from zero. This produces a deck that "looks like a presentation" but is missing all template features: navigation controls, editor module, density guard, fullscreen, gallery, keyboard shortcuts, theme system, export function.

**This is the #1 cause of broken decks in production.** The LM is good at generating plausible CSS/JS, so the output superficially works, but it lacks the 1100+ lines of battle-tested code in the template.

**Prevention:**
1. Upload `assets/html-slideshow-starter/paper-presentation.html` as a knowledge file to the platform.
2. Instruct the LM: "Read the template. Generate ONLY the `slides` JSON array. Then inject it into the template at the `// @render-slide-data` marker. Do NOT rewrite the CSS, JS, or HTML structure."
3. The LM outputs the complete template with only the `slides` data, `<title>`, `themePreset`, and `venuePreset` values changed.

**Detection:** Check for `<meta name="generator" content="slider/paper-presentation-v1"/>` in the output. If missing, the LM built from scratch.

### String literal corruption

The LM may write `\n` as a literal newline in JavaScript source code. This silently breaks the inline `<script>` and the deck will not load. The browser console will show `SyntaxError: Invalid or unexpected token`.

**Prevention**: Use `JSON.parse(String.raw`...`)` transport for the `slides` array. `String.raw` preserves backslashes as-is, avoiding the double-escaping problem. The canonical template already uses this pattern.

**Detection**: After generating the HTML, search the `<script>` block for any string literal that spans two source lines without proper continuation. The `.join("\n")` call in `renderContentBlocks` is a known failure point.

### LaTeX-JSON collision (CRITICAL — solved by base64 transport)

The legacy `String.raw` → `JSON.parse` transport has **two classes of LaTeX failure**:

**Class 1 — Hard crash (deck white-screens):** `\star`, `\arg`, `\mathbb`, `\gamma`, `\sigma`, `\sqrt`, `\sum`, `\sup`, `\sin` etc. These start with letters (`\s`, `\a`, `\m`, `\g`) that are NOT valid JSON escapes. `JSON.parse` throws immediately. The deck cannot load at all.

**Class 2 — Silent corruption (math is destroyed):** `\beta`, `\frac`, `\theta`, `\nu`, `\rho`, `\tau` etc. These start with `\b`, `\f`, `\t`, `\n`, `\r` which ARE valid JSON escapes. `JSON.parse` interprets them as control characters. The math renders as garbled text.

**Solution: Base64 transport.** The renderer now encodes slide data as base64 (`[A-Za-z0-9+/=]` only). No backslashes exist in the payload. Both failure classes are eliminated. The template decodes with `atob()` → `JSON.parse()`.

**Legacy fallback:** The `String.raw` path is kept for backward compatibility with a `try/catch` for diagnostics and `repairLatexCollisions()` for Class 2. But it CANNOT fix Class 1. The renderer MUST use base64.

### Editor mode activation

The canonical template includes a full slide editor (toolbar, sidebar, theme picker). If the LM accidentally sets `<body class="edit-mode">` or adds editor-activation code in the init path, the deck will open showing editor chrome instead of a clean presentation.

**Prevention**: Never set `edit-mode` on the body tag. The editor is opt-in via user gesture (press `E` or click the edit button).

### Incomplete visual binding

When the LM follows the pipeline manually (without scripts), it may skip the visual binding step and produce slides without figures. The SKILL requires ≥50% of non-cover/takeaway slides to have bound visuals.

**Prevention**: Generate the visual binding checklist table before rendering. Count the ratio. If insufficient, go back and bind more paper figures.

### Data URI eager loading

Data URI images (`src="data:image/png;base64,..."`) should always use `loading="eager"`. The `lazy` loading attribute tells the browser to defer loading until the element is near the viewport, but data URIs are already in memory. Using `lazy` on them adds unpredictable render timing — the image may flash to visible after the slide transition completes.

**Prevention**: In the `renderVisual` and `renderBlock` functions, always emit `loading="eager"` on `<img>` tags with data URI sources.

**Detection**: Search the output HTML for `loading="lazy"` co-occurring with `src="data:`. The `render_slideshow_artifact.py` post-render audit flags this.

### Sandbox audit limitations

In sandbox environments (ChatGPT Code Interpreter, Claude tool use), headless Chromium is typically unavailable or unreliable. The `browser_slide_audit.py` script requires Chromium to navigate each slide and measure scroll/descendant overflow.

**When Chromium is unavailable**, the browser audit will emit a warning and skip. This is acceptable for sandbox-generated drafts, but the following static checks **must** still be performed:

| Static Check | What to Verify |
|:---|:---|
| `prefers-reduced-motion` | `@media(prefers-reduced-motion:reduce)` exists in CSS |
| `loading="eager"` | No data URI images have `loading="lazy"` |
| Visual coverage ≥50% | Count slides with actual figure/table data |
| Edit-mode off | `<body>` tag does not have `class="edit-mode"` |
| `transition: all` absent | No `transition:all` in CSS (use explicit properties) |
| Semantic colors | `--accent`, `--positive`, `--negative` are defined |
| No external deps (except KaTeX) | No remote font/image/script URLs beyond KaTeX CDN |

**When the deck is delivered for final use**, it should be re-audited locally with `python scripts/browser_slide_audit.py <deck.html>` where Chromium is available.

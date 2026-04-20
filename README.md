# slider v24

> Research slides are evidence displays with narrative pacing, not generic summaries with decoration.
> Every element earns its place. One thousand no's for every yes.

A skill that turns an arXiv paper into a ready-to-present conference talk. Output is a single self-contained HTML file that opens directly in any browser.

## What it does

1. Ingest paper and extract evidence.
2. Classify paper type (architecture / optimization / benchmark / theory / qualitative).
3. Select mandatory main-deck visuals based on paper type.
4. Export, score, and inspect paper figures.
5. Compile deck design (mood, palette, type scale, motion policy).
6. Create slide plan with explicit visual binding and density budgets.
7. Generate a single built HTML file with minified CSS/JS.
8. Run structured verification (3-phase: quick check → static audit → browser audit).
9. Package the final artifact.

## v24 highlights

- **Anti-AI-slop rules.** Explicit ban on generic AI-generated aesthetics: emoji icons, left-border accent cards, aggressive gradient defaults, CDN-loaded AI fonts, SVG illustrations. Decks must look researcher-authored, not AI-generated.
- **Content discipline.** "Every element earns its place" — no filler content, no data slop. Whitespace is a design choice, not a bug.
- **Structured verification workflow.** Three-phase gated pipeline: quick check → static audit → browser audit. Each phase must pass before the next begins.
- **Live tweaks protocol.** Post-generation design customization panel (accent colors, font sizes, mood, transitions) with `localStorage` persistence and JSON export.
- **Speaker notes protocol.** Structured JSON storage with `postMessage({slideIndexChanged})` for external tool integration.
- **CSS modernization.** `text-wrap: pretty` on body text, `text-wrap: balance` on titles, `font-variant-numeric: tabular-nums` on all numeric content.
- **Claude adapter rewrite.** Comprehensive v24 CLAUDE.md covering contentBlocks, deck design compilation, anti-slop rules, content discipline, base64 transport, 18-step pedagogical arc, and full acceptance test suite.
- **Version bump.** All platform configs updated to v24.

## Prior versions

<details>
<summary>v23 highlights</summary>

- **Evidence-first workflow.** Paper figures, tables, and diagrams are first-class content, not optional.
- **Mandatory visual inclusion.** Architecture-heavy papers must have a method figure. Benchmark-heavy papers must have a result table. And so on.
- **Paper-type-aware policy.** Different paper types have different mandatory visual requirements.
- **DESIGN.md as first-class asset.** A shared design control plane read by both generator and auditor.
- **Research slide patterns.** Codified layout patterns with text density limits and visual requirements.
- **Dual audit phase.** Post-render design audit + evidence fidelity audit with actionable revision checklist.
- **Acceptance tests.** Decks that fail visual inclusion or design quality checks are explicitly rejected.
- **Built HTML default.** Output is a single minified HTML file that opens directly — no build step needed.
- **Faithful redraw policy.** Clear rules for when and how to redraw paper figures.
- **Design reference injection.** Users can provide external design references that influence visual style without breaking research readability.

</details>

## Platform support

| Platform | Instructions | Setup |
|:---|:---|:---|
| **Gemini CLI** | `SKILL.md` (native) | Place in `.gemini/skills/` |
| **ChatGPT Custom GPT** | `agents/chatgpt/system_prompt.md` | Paste + upload knowledge files |
| **Claude Projects** | `agents/claude/CLAUDE.md` | Set as project instructions |
| **Claude Code** | `agents/claude/CLAUDE.md` | Copy to project root |

## Directory layout

```
SKILL.md                       — control plane (evidence-first workflow)
assets/design/DESIGN.md        — design control plane
references/                    — policy, pattern, and rule documents
scripts/                       — deterministic pipeline + audit scripts
assets/                        — starter templates
agents/                        — per-platform configs
```

## Key scripts

| Script | Purpose |
|:---|:---|
| `extract_paper_evidence.py` | Extract evidence bundle from paper |
| `find_visual_evidence.py` | Locate figure and table candidates |
| `score_visual_candidates.py` | Rank visual candidates |
| `generate_slide_data.py` | Create structured slide plan |
| `export_pdf_visuals.py` | Crop visuals from PDF |
| `bind_visual_assets.py` | Bind visuals to slides |
| `compile_deck_design.py` | Compile deck-level visual design |
| `render_slideshow_artifact.py` | Render HTML/React artifact |
| `audit_research_slides.py` | Evidence fidelity audit |
| `audit_design_comfort.py` | Design comfort audit |
| `browser_slide_audit.py` | Browser-level overflow/scroll audit |
| `check_skill_health.py` | Skill integrity check |
| `export_platform_configs.py` | Validate/export platform configs |

## Key references

| File | Purpose |
|:---|:---|
| `paper-visual-inclusion-policy.md` | When paper visuals must appear in main deck |
| `research-visual-priority.md` | Priority A/B/C visual classification |
| `paper-type-policy.md` | Type-specific deck policies |
| `research-slide-patterns.md` | Layout patterns with density limits |
| `research-slide-anti-patterns.md` | Codified anti-patterns including AI-slop aesthetic |
| `faithful-redraw-policy.md` | Fidelity constraints for redrawing figures |
| `DESIGN.md` | Design control plane (colors, type, grid, anti-patterns) |
| `external-design-principles.md` | Slide-safe guardrails from external design sources |
| `verification-workflow.md` | Three-phase verification pipeline |
| `live-tweaks-protocol.md` | Post-generation design customization |
| `deck-design-control-plane.md` | `deck_design.json` contract |
| `page-role-layout-families.md` | Page role → layout family bindings |

## Health checks

```bash
python scripts/check_skill_health.py
python scripts/export_platform_configs.py --platform all --validate
python scripts/audit_research_slides.py --slide-data slide-plan.json --paper-type architecture-heavy
python scripts/audit_design_comfort.py deck.html
python scripts/browser_slide_audit.py deck.html
```

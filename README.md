# Slider

**Turn a research paper into a talk you can present from your phone.**

Slider is an agent skill for Codex, Claude Code, Gemini CLI, and ChatGPT. Give your agent a PDF, arXiv link, DOI, or title, plus the audience and time slot. It builds the argument, keeps the paper's figures and numbers traceable to their source, writes speaker notes, and delivers one HTML file that opens in any browser. Press `R` in the deck and your phone shows the notes, the timer, and the next slide.

**[Live demo](https://voidful.github.io/Slider/)** · [繁體中文說明](README.zh-TW.md) · [Install](#install-and-use)

![A Slider slide on the projector and the phone remote showing speaker notes, the talk timer, and the next slide](assets/readme/hero.jpg)

## Try it in one minute

Open the [live demo](https://voidful.github.io/Slider/) on a laptop, press `R`, and scan the code with your phone. Or run the demo deck from a checkout; Python 3 is all it needs:

```bash
git clone https://github.com/voidful/Slider.git && cd Slider
python3 scripts/serve_deck.py
```

The helper serves the deck at this computer's Wi-Fi address, so the QR code works on a phone on the same network. Serve your own deck the same way: `python3 scripts/serve_deck.py deck.html`. Only the deck and the files it references are shared.

## Present from your phone

<img src="assets/readme/phone-present.jpg" alt="Phone remote: notes, timer, previews, and Back and Next" width="260" align="right">

The phone opens the same page; there is no app to install.

- Your speaker notes in large type, following the slide on screen
- A talk timer paced against your time slot; the clock flashes, and Android phones buzz, at 5 and 2 minutes left
- The slide on screen and the next build or slide
- Big Back and Next buttons, or swipe the notes
- Black or white screen for questions; draw on the slide; send a note to the screen
- Turn the phone sideways for notes on the left and controls on the right

Pairing goes through the public PeerJS server, then control data flows over WebRTC. Phones on mobile data or isolated venue Wi-Fi need a TURN relay; see [phone remote relay](references/artifact-rendering.md#phone-remote-relay). Everyone who scans the code sees your notes.

<br clear="right">

## For the audience

Press `U` and the projected QR code lets everyone follow on their own phone: the current slide, figures they can zoom, and the slide as text that screen readers and translation tools can read. They can look back and return to live; they cannot control the deck or see your notes over the connection. After the talk, `?handout` gives the whole deck as an accessible text document (`?handout=notes` adds your notes as a transcript), and Ctrl/⌘ K › Download audience copy removes the notes from the file you share.

## Change it by asking, guided from the start

- **Guided first.** If you don't say how long the talk is, who it's for, or what people should remember, the agent asks, one question at a time, before building. Say "just build it" to skip.
- **Point, then prompt.** Press `E` in a deck, click whatever should change, and write what you want. Slider collects the requests and copies them as one prompt with the slide, the field, and its current text, ready for your agent. Double-click text to fix a typo on screen; the fix goes into the prompt too, so the agent's copy stays in sync. (The full layout editor is still in the command menu.)
- **Motion that explains.** A slide can walk through a figure: each press zooms into the next panel or spotlights the next row or number while the rest dims, and your phone shows the line to say for that step. Jumps, print, and overviews always show the whole slide.

## Install and use

For Codex, install the complete folder in your project's skill directory:

```bash
mkdir -p .agents/skills
git clone https://github.com/voidful/Slider.git .agents/skills/slider
```

For personal use across projects, use `~/.agents/skills/slider` instead. Keep `scripts/`, `references/`, `assets/`, and `agents/` together with `SKILL.md`. Codex discovers these locations as described in the [official skill documentation](https://learn.chatgpt.com/docs/build-skills).

Then ask:

```text
$slider Turn the attached paper into a 10-minute conference talk for ML
researchers. Include the key method figure, the main comparison, limitations,
and speaker notes. Build the HTML, inspect it, and fix rendering problems.
```

You can also give a precise brief or limit the work:

```text
$slider 將這篇論文做成 6 張、5 分鐘的繁體中文簡報，保留核心圖表與講者備註。
$slider Fix the wording on slide 4 and check that it still fits.
$slider Audit this deck against the paper without editing it.
$slider Plan an eight-slide talk; stop at the outline and evidence mapping.
```

The requested audience, language, duration, slide count, and format take precedence over workflow/style defaults. With no brief, Slider assumes a research audience and roughly 15 minutes. There is no minimum slide count. Ordinary paper summaries and general website work do not need this skill.

## What it produces

| Deliverable | When to use it |
|:---|:---|
| HTML deck | Default: one browser-openable file with presentation and editor controls |
| React component | Integrate slides into an existing application |
| Vite React project | Develop a reusable deck with separate content, components, and presenter tooling |
| Talk plan | Review the argument, pacing, and evidence before building |
| Audit findings | Locate unsupported claims, missing evidence, or rendering problems |

The bundled renderer implements HTML and React targets. It does not export native editable PPTX. If you request another format, the agent needs appropriate tooling and should report any unsupported step.

## What guides the work

- **Traceable evidence:** source figures, tables, equations, exact comparisons, and limitations drive the talk. Crops and faithful redraws retain source references.
- **Readable slides:** one main message per slide, legible evidence, and a fixed 1200×675 stage that scales consistently into fullscreen.
- **Task-sized workflows:** a new deck uses source selection, planning, rendering, and verification; a wording fix reuses the existing plan and assets.
- **Relevant checks:** the agent completes the requested artifact and corrects observed defects, reporting checks that passed or could not run.
- **Authored wording:** titles state claims, and zh-TW and English copy follows [slide copy rules](references/slide-copy-rules.md) adapted from [Michelin](https://github.com/voidful/michelin); `scripts/audit_slide_copy.py` and the deck's Guide flag what to reread.
- **Guided when asked:** to build a talk together, the agent works like a design conversation adapted from [life-design-compass](https://github.com/voidful/life-design-compass): one question per turn with brief feedback, reframing what feels stuck ("every experiment has to be on a slide"), three storylines of equal standing to choose from, a cheap prototype such as a thirty-second version or a three-slide render, then the outline approval and an honest status. See the [guided deck workflow](references/guided-deck-workflow.md). It also works for the user's own unpublished results, with their files and answers as the source.
- **Clear and complete explanations:** adapted from [hung-yi-lee-skill](https://github.com/voidful/hung-yi-lee-skill), each slide answers the question the previous one raised, one punchline carries the takeaway with its evidence, a method arrives as the fix for a problem the audience has seen, and a completeness check finds gaps before delivery. A teaching voice, including a 李宏毅式 voice on request, goes into speaker notes while slide faces keep claim titles. See [explain clearly](references/explain-clearly.md).

The short [SKILL.md](SKILL.md) routes to [task workflows](references/task-workflows.md) and specialized references as needed. The Python helpers provide repeatable transformations; their generated text, crop selection, and confidence scores still need review against the paper.

## Preview the bundled starters

![Slider React starter preview](assets/readme/slider-react-preview.jpg)

Open [the HTML starter](assets/html-slideshow-starter/paper-presentation.html) locally in a browser (`python3 scripts/serve_deck.py` adds the phone remote), or run the React demo:

```bash
cd assets/react-project-starter
npm ci
npm run dev
```

The HTML starter includes keyboard navigation, a presenter window with the next build, notes, and a paced timer, an overview of real thumbnails, a Ctrl/⌘ K command menu, deep links, print to PDF (one page per slide or a notes handout), fullscreen, and a structured editor with thumbnails, reordering, text/block editing, undo/redo, drafts, and JSON/HTML export. Its editor adds a Guide that walks the deck to `ready to present` one step at a time, comment mode with an agent export, and image drop onto figure slots. The React project adds a linked presenter window, visual asset review, review comments, design settings, and static/PDF export scripts.

The HTML deck, React project, and single-file React component animate slide transitions and text, figure, and number entrances with [motion presets](references/motion-graphics.md). Choose `editorial` (default), `subtle`, `kinetic`, `cinematic`, `digital`, or `none`; the `morph` transition flies shared figures, metrics, and titles between slides. Every effect ends on the static layout, and pressing next finishes it at once. Set the preset in the slide plan's `meta.motion` or with `--motion`, or change it live: `M` in the HTML deck and React component, Tweaks (`T`) in the React project.

Common controls include Left/Right or Space to advance, `O` for overview, `N` for notes, `P` for the presenter window, and `F` for fullscreen; the HTML deck moves auto-advance to `A`. Progressive builds reveal content before moving to the next slide. Use `?` for the current renderer's shortcut list; press `E` in the HTML deck to edit and `G` there for the Guide.

## Use the helpers directly

Run these commands from a checkout of Slider. Python 3.10+ is needed for the helpers; PDF extraction/cropping also needs PyMuPDF. The browser audit needs a discoverable Chromium/Chrome executable. The React starter uses Node.js and its package-lock dependencies.

```bash
python3 -m pip install PyMuPDF  # only for PDF processing
```

For a paper-to-plan starting point:

```bash
python3 scripts/extract_paper_evidence.py paper.pdf --output evidence.json
python3 scripts/find_visual_evidence.py paper.pdf --output visuals.json
python3 scripts/generate_slide_data.py \
  --evidence evidence.json --visuals visuals.json --mode json --output slide-plan.json
```

This is a draft scaffold. Inspect and edit the claims, order, length, and evidence bindings. The generator currently seeds a long talk and has no duration or slide-count option; an agent can author or revise the JSON directly. See the [workflow guide](references/task-workflows.md) for scoring, cropping, and binding figures.

Render a prepared plan:

```bash
python3 scripts/render_slideshow_artifact.py \
  --slide-data slide-plan.json --mode html --output deck.html
```

Or build a React project:

```bash
python3 scripts/render_slideshow_artifact.py \
  --slide-data slide-plan.json --mode react-project --output deck-project
cd deck-project
npm ci
npm run dev
```

An optional `--deck-design deck_design.json` supplies design settings to the React project. Use each helper's `--help` for its supported arguments.

## Single-file and offline delivery

For a portable HTML deck, embed paper images as data URIs; the renderer does not automatically embed local image paths.

The default template still references KaTeX and phone/QR libraries. A single HTML file is therefore not a guarantee of offline operation. `python3 scripts/offline_katex.py deck.html` creates `deck_offline.html` with math resources bundled, but phone pairing still needs network services and a reachable HTTP(S) URL. Check the final file without network access before calling a talk offline-ready. See [output contracts](references/output-contracts.md).

If a paper, figure, runtime, or browser is unavailable, Slider should identify the missing evidence/check and deliver only the supported plan or draft. It should not invent results or describe skipped verification as passed.

## Verification and development

| Check | Command | What it establishes |
|:---|:---|:---|
| Bundle metadata | `python3 scripts/export_platform_configs.py --platform all --validate` | Required instructions and referenced knowledge files resolve |
| Export regressions | `python3 scripts/test_platform_exports.py` | Separate portable bundles, usable paths, omitted generated dependencies |
| Repository health | `python3 scripts/check_skill_health.py` | Syntax, references, and synthetic pipeline/artifact integration |
| Evidence heuristics | `python3 scripts/audit_research_slides.py --slide-data slide-plan.json --paper-type architecture-heavy` | Potential source/visual/density issues; use the paper's actual type |
| Browser geometry | `python3 scripts/browser_slide_audit.py deck.html` | Every slide fits the stage with nothing clipped, cut off, or overlapping, and lays out the same at two window sizes |
| Worst-case layouts | `python3 scripts/test_layout_stress.py` | A 27-slide deck of long, CJK, figure-heavy content passes that audit |

The HTML renderer already attempts static and browser checks. Reuse its results instead of repeating the same check on unchanged output. Scientific fidelity still requires reviewing the paper; simulated fullscreen does not establish native fullscreen, projector readability, or real phone pairing.

See [TEST_MATRIX.md](TEST_MATRIX.md) for applicable checks and [verification workflow](references/verification-workflow.md) for completion criteria. Synthetic integration tests are not an independent evaluation of an agent-generated research talk.

## Other agent platforms

| Platform | Instructions |
|:---|:---|
| Codex | [SKILL.md](SKILL.md) plus [agents/openai.yaml](agents/openai.yaml) |
| Gemini CLI / file-based hosts | Complete skill folder and [SKILL.md](SKILL.md) |
| ChatGPT Custom GPT | [Concise prompt](agents/chatgpt/system_prompt.md) and selected knowledge files |
| Claude Projects / Claude Code | [Claude instructions](agents/claude/CLAUDE.md) |
| OpenAI integrations | [Handoff metadata](agents/openai/config.yaml), pointing to the shared skill |

```bash
python3 scripts/export_platform_configs.py --platform all --export-dir dist/platforms
```

Exports keep runtime resources and relative paths, with one directory per platform. Per-platform `config.yaml` files describe this repository's bundles; they are not an API/SDK configuration schema. Current tool and upload capabilities determine what each host can actually execute. See [platform adaptation](references/platform-adaptation-guide.md).

## Design and instruction sources

The instruction cleanup draws on [Eric Provencher's article](https://x.com/pvncher/status/2095991462416490862) and [OpenAI's GPT-6 Astra guidance](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra), reviewed on 2026-09-07. The resulting skill uses concise discovery, selective reference loading, clear scope, and proportionate verification. These sources inform the workflow; they do not imply a model-specific benchmark or required model.

Slider also adapts selected presenter/editor ideas from [1weiho/open-slide](https://github.com/1weiho/open-slide) (commit review 2026-08-18; v2.3.1 site review 2026-10-29). What was adopted, extended, or declined, and why, is recorded in [open-slide adoption](references/open-slide-adoption.md). Wording rules adapt [voidful/michelin](https://github.com/voidful/michelin), the guided interview adapts [voidful/life-design-compass](https://github.com/voidful/life-design-compass), and the explanation rules adapt [voidful/hung-yi-lee-skill](https://github.com/voidful/hung-yi-lee-skill), a teaching method inspired by Hung-yi Lee's lectures (受李宏毅教學風格啟發); Slider does not speak for him.

For implementation details, use the [reference index](references/README.md), [architecture](ARCHITECTURE.md), [maintenance notes](references/skill-maintenance.md), and [changelog](CHANGELOG.md).

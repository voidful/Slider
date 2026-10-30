# Test Matrix

Select checks for the changed behavior. This is a capability matrix, not a command sequence required for every edit. A wording fix in documentation does not need a full React build or phone test.

## Skill and Platform Bundles

- `python3 scripts/export_platform_configs.py --platform all --validate`
  - Checks entrypoint files, instruction sources, and referenced knowledge files.
- `python3 scripts/test_platform_exports.py`
  - Exports real bundles in temporary directories.
  - Checks separate platform destinations, relative path resolution, runtime resources, and exclusion of generated dependencies.
  - Checks missing instruction/knowledge files and refuses export destinations that overwrite source resources.
- Use the host skill validator when available for frontmatter and naming.
- Inspect changed Markdown links and the behavioral scenarios in [skill-maintenance.md](references/skill-maintenance.md). These scenarios are review cases, not a completed independent model benchmark.

## Core Health

- `python3 scripts/check_skill_health.py`
  - Validates Python syntax.
  - Validates linked skill references and release docs.
  - Runs the text-to-slide-data-to-artifact roundtrip.
  - Runs browser overflow checks for the canonical HTML template output.

The roundtrip uses synthetic paper text and images; it verifies integration, not scientific fidelity. The HTML renderer attempts the browser audit as part of rendering. Missing optional dependencies and pre-existing line-count warnings remain visible in the report.

## Canonical HTML Template

- `python3 scripts/browser_slide_audit.py assets/html-slideshow-starter/paper-presentation.html`
  - Verifies the bundled demo deck renders without overflow.
  - Checks windowed and simulated-fullscreen scaling.
  - Checks image load status.

## Slide Copy Rules

- `python3 scripts/audit_slide_copy.py --slide-data slide-plan.json` lists wording findings with slide, field, rule, evidence, and move; `--format json` and `--fail-on major` support automation.
- `python3 scripts/check_skill_health.py` fails when the HTML Guide's `COPY_RULESET` differs from `RULES`; fix with `python3 scripts/audit_slide_copy.py --sync-template assets/html-slideshow-starter/paper-presentation.html`.
- Spot-check a zh-TW slide with 數據集 or half-width punctuation and an English slide with “significantly” and no test; both should be flagged, and slides with real numbers should pass the vague-gain and SOTA rules.

## Presenting Tools (HTML)

- Open the deck with `#/3` and confirm slide 3 opens fully built; navigate and confirm the hash follows without new history entries.
- Press `O`, move with the arrows, and open a slide with Enter; press `N`, `B`, `W`, and `?`, then Esc repeatedly to confirm the top layer closes first.
- Press `P` in a browser that allows pop-ups: the presenter window shows the current beat, the next build, notes, and the timer; arrows there drive the deck. Where pop-ups are blocked, the notes drawer opens instead.
- Press Ctrl/⌘ K, search a phrase from a slide body, and run an action.
- Print to PDF: one 1200×675 page per slide at final builds and no deck chrome; File › Print handout gives A4 pages with notes. Headless check: `chromium --headless --print-to-pdf=out.pdf deck.html` should produce one page per slide.

## Guide and Comments (HTML editor)

- Press `E`, then `G`: the Guide asks the talk length, audience, and takeaway one at a time, each with feedback, then shows one next step. Fix a placeholder inline, skip one step, ignore one, and restore it.
- Press `C`, click a title, add a comment, confirm the pin and badge, resolve it from the Guide, and export comments.
- Drop an image on a figure placeholder (or use Choose image) and confirm caption and alt text come from the slot label.
- Export HTML, reopen it, and confirm the brief, comments, and `guideIgnore` survive.

## React Project Starter

- `cd assets/react-project-starter && npm install && npm run build`
  - Verifies the multi-file starter type-checks and builds through Vite.
  - Confirms the starter does not depend on implicit global CSS or ignored config files.
- Browser smoke test at the local Vite URL.
  - Verify previous/next navigation, disabled edge buttons, overview, notes, and fullscreen controls.
- Confirm speaker notes do not cover slide evidence or metrics.
- On the demo motivation slide, confirm Right/Space reveals one bullet at a time, Left unwinds builds, and overview jumps show the complete slide.
- Confirm the presenter window mirrors the current build and consumes builds before slide changes.

## Motion Graphics

- `python3 scripts/check_skill_health.py` checks that the Python catalog matches the HTML, React project, and single-file React engines, and that the render marker, `finishMotion()`, audit hook, `MotionStage` snapshot, and PDF `?motion=none` capture remain.
- Browser smoke test in a visible window; hidden tabs pause the animation timeline.
  - In the HTML deck, press `M`, try each preset, and use Replay on a cover, a split slide with builds, and a metrics slide. In the React project, use Tweaks (`T`). Mount the single-file component in a host app, press `M`, and confirm an outgoing slide keeps its own mood colors.
  - Confirm the next press during a transition finishes it, Left shows the previous slide complete, and each build animates only its target.
  - After motion settles, confirm the slide matches `?motion=none`: no shifted words, leftover blur, or clipped figures. Check a CJK title.
  - Turn on the OS reduced-motion setting and confirm slides cut instantly.
  - Render a plan with a seven-row table, five metrics, a figure repeated on consecutive slides, and three non-accent `glitch`/`pixel` slides; the renderer should print one `motion:` hint for each, and none with `--motion none`.
  - Set the transition to `morph` and move between two slides that share a title or figure: the shared element flies to its new place, the rest crossfades, and the end frame matches `?motion=none`.

## Manual Editor Smoke Test

- Open `assets/html-slideshow-starter/paper-presentation.html`.
- Press `E` or click the edit button.
- Edit title/body text inline.
- Add a slide and a content block.
- Confirm the filmstrip shows faithful slide thumbnails rather than title-only placeholders.
- Reorder a slide by dragging, then undo and redo the move.
- Verify `Ctrl+M`, `Ctrl/Cmd+D`, cut/copy/paste, Up/Down, and `Ctrl/Cmd+Up/Down` match the shortcut panel.
- Open the slide context menu and exercise duplicate, paste, move, and delete availability.
- Collapse the filmstrip and inspector; confirm the complete 16:9 canvas remains centered and unclipped.
- Insert an image.
- Save/load a browser draft.
- Export JSON and self-contained HTML.
- Change a Theme panel color, export HTML, reopen the exported file, and confirm the color is kept.

## Phone Remote Smoke Test

- Open the deck through an `http` or `https` URL the phone can reach. Do not use `file://`, `localhost`, or `127.0.0.1` for real phone pairing.
- Click `Phone`.
- Confirm the QR URL points to the same deck/controller URL with `?token=...`, not a third-party controller domain.
- Scan the QR code from a phone.
- Verify next/previous/fullscreen/play controls affect the desktop deck.
- Draw on the Mark pad and confirm ink appears on the current slide.
- Send a note and confirm it appears on the desktop deck.
- Connect a second phone and confirm both users appear in the collaborator roster.
- Confirm ink and notes are labeled by collaborator name/color.
- Confirm phone next/previous controls advance and retreat presenter builds before changing slides, and the live preview mirrors the build state.

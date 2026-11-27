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
  - Checks every box on each slide for clipped or spilling content, ellipsis/line-clamp truncation, overlapping text, and slides the fitter flagged with `data-overflow-fail`.
  - Renders a second time in a 1024×640 window and fails when any slide lays out differently than at 1440×900 (`--compare-window none` skips it).
  - Checks image load status; warns about slide text under 14px and unrendered LaTeX.

## Layout Stress

- `python3 scripts/test_layout_stress.py` (also run by the health check)
  - Renders a 27-slide worst-case deck through the HTML template: every classic layout and content block, long English and zh-TW titles and bullets, unbroken URLs and model names, wide 4:1, tall 2:5, and square figures, five to six metrics with long labels, an 8-row table, display math containing `<`, named grid areas, and grid `placement`.
  - Every slide must pass the browser audit above. `--keep DIR` writes the deck for inspection.
- After changing slide CSS or fitting, also look at the stress deck: `?motion=none&chrome=0#/N` opens slide N without chrome for screenshots.

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

## Request Changes and Focus Steps (HTML deck)

- Press `E`, click a bullet, add a request; double-click the title, change a word, and press Enter. The panel lists both, the button tip shows the count, and **Copy prompt** gives one numbered prompt with slide, field, current text, and the on-screen change. Reload: both requests return and the fixed title stays fixed. **Download deck with my fixes** exports HTML without the open panel.
- `python3 examples/build_showcase.py --output /tmp/showcase.html`, open slide 2, and press Right: each focus step zooms the figure into the next box and dims the rest, the phone and presenter view show the step's "Now" line, and the step after the last focus clears it. `#/2` (a direct jump) and print show the slide undimmed.

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
- Render a dense plan (long split bullets, a tall figure beside metrics, a 10-row `table-focus`) with `--mode react-project`: slides should carry `data-density` on `.slide-stage` and stay inside the stage; a slide that cannot fit gets `data-overflow` and a console warning instead of a hidden scroll box.
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
- Change a Theme panel color, export HTML, reopen the exported file, and confirm the color is kept. Export JSON, import it into a fresh deck, and render it with `scripts/render_slideshow_artifact.py`; confirm the color is kept both times.

## Phone Remote Smoke Test

- Open the deck through an `http` or `https` URL the phone can reach. Do not use `file://`, `localhost`, or `127.0.0.1` for real phone pairing.
- Click `Phone`.
- Confirm the QR URL points to the same deck/controller URL with `?token=...`, not a third-party controller domain.
- Scan the QR code from a phone.
- Verify next/previous/fullscreen/play controls affect the desktop deck.
- `python3 scripts/serve_deck.py deck.html --port 8000`: the printed URL uses the Wi-Fi address and opens the deck; `/` redirects to it; other files in the folder, `..` paths, and hidden files return 404.
- Open the remote in two tabs on one phone: the first tab stops with "This remote is open in another tab" and the second keeps the link; tapping the first tab's banner takes the link back.
- On the Present tab, turn off the desktop's Wi-Fi: a banner over the notes gives the reason and Back/Next dim; tapping the banner retries. Hide the previews and confirm the notes grow and the choice survives a reload.
- On the Present tab: the notes, slide position, and now/next thumbnails follow the desktop; the first Next starts the timer; with a talk length in the brief, the clock turns amber when behind pace and red when over, and flashes once at time. Black and White toggle the desktop screen and the next Next clears it. Reset needs two taps. A horizontal swipe on the notes moves one beat. Rotate the phone: notes left, controls right, nothing overlapping. Over `https`, the phone screen stays on; over plain `http` the Present tab says to turn off auto-lock.
- Draw on the Mark pad and confirm ink appears on the current slide.
- Send a note and confirm it appears on the desktop deck.
- Connect a second phone and confirm both users appear in the collaborator roster.
- Confirm ink and notes are labeled by collaborator name/color.
- Confirm phone next/previous controls advance and retreat presenter builds before changing slides, and the live preview mirrors the build state.
- Put the phone on mobile data while the computer stays on Wi-Fi. With a TURN relay in `meta.remote`, it pairs; without one, the phone shows the "No network path" hint and retries instead of staying on Connecting.
- Reload the desktop deck in the same tab. The QR token stays the same and paired phones reconnect without a new scan.
- Lock the phone for a minute, then unlock it. It reconnects by itself, or after one tap on its status button.
- Turn the computer's Wi-Fi off and on. The panel reports that it is reconnecting, then returns to "Waiting for phone..." or "Connected" with the same QR code.
- Without a phone: pair a second browser tab, run `remoteState.peer.socket._socket.close()` in the desktop tab, and confirm the desktop reconnects under the same token and a new tab can still pair. Two tabs on one machine never test the network path.

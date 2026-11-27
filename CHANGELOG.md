# Changelog

## Unreleased

### Revise by asking, guided questions, and motion that explains

- `E` in the HTML deck now opens **Request changes**: click what should change, describe it, and copy one prompt that lists each slide, field, and current text for the agent. Double-clicking text fixes it on screen and records the fix in the prompt, so the agent's slide data stays in sync. Requests are stored as slide comments, survive a reload, and appear in the Guide; the panel can download the deck with the on-screen fixes. The full layout editor moved to the command menu and `?edit=full`. Most people revise by prompting, and edits made only in the browser were overwritten the next time the agent rendered from its slide data.
- New **focus steps** in `revealOrder`: `{"focus": target, "region": [x, y, w, h], "note": "…"}` dims everything but the target and can zoom a figure into one region; `note` is the line to say, shown above the speaker notes on the phone, the presenter view, and the notes drawer. Targets include reveal targets, bound fields, and table rows. A slide that ends on a focus gets a clearing step, so jumps, print, and overviews show the whole slide. React targets skip focus steps; the browser audit's build check counts reveal and focus steps.
- The skill now asks for the talk length, audience, and takeaway one question at a time when a new talk's request lacks them, instead of building from defaults; "just build it" still skips. Agents apply requests pasted from the deck field by field ([task workflows](references/task-workflows.md#apply-requests-pasted-from-the-deck)), and the motion guide has an [explain with motion](references/motion-graphics.md#explain-with-motion) section.
- The showcase deck walks through its pipeline figure and its metrics with focus steps and has a slide on revising by asking.

### Phone remote redesign, one-command serving, and a live demo

- The phone remote has a slim app bar with the deck title and connection status, an icon tab bar, and grouped sections. Present adds time and slide progress bars, build dots and an "End of deck" state on Next, a toggle that hides the slide previews to give the notes more room, and press feedback on every button. When the link drops, a banner over the notes says why and retries on tap, and Back/Next dim. Inputs are 16px so iPhones do not zoom on focus.
- Opening the remote in a second tab on the same phone makes the first tab step aside and say so, instead of the two tabs replacing each other's link.
- The phone page no longer renders wider than the screen: the deck body's `place-items:center` shrink-wrapped it to its longest unwrapped line in current Chrome.
- New `scripts/serve_deck.py` serves a deck at this computer's Wi-Fi address and opens it there, so its QR code works on a phone. It shares only the deck and the files it references. The deck's pairing hints point to it.
- New `examples/build_showcase.py` builds an eight-to-nine-slide talk about Slider itself (only facts about the repository) with link-preview tags; `.github/workflows/pages.yml` publishes it to GitHub Pages as the live demo once Pages uses GitHub Actions.
- README opens with the value in one line, a live-demo link, a hero image of a slide beside the phone remote, a one-minute try-it section, and a phone section. New [繁體中文 README](README.zh-TW.md). `assets/readme/social-preview.png` is sized for the GitHub social preview.
- Browser audit: KaTeX's own clipped drawings (such as the `\sqrt` SVG) are no longer reported as clipped content.
- `audit_design_comfort.py`: the viewport-unit font check no longer runs across CSS rules, which reported a `vh` height in a later rule as viewport typography.

### Phone as speaker remote

- The phone remote opens on a new **Present** tab: the current slide's speaker notes in large, adjustable type; the desktop's talk timer with pace colour, time left against the brief, wall clock, and buzz-and-flash alerts at 5 and 2 minutes left and at time; current and next-beat thumbnails; large Back/Next buttons and swipe on the notes; Black/White screen; Start/Pause and a two-tap Reset. It asks to keep the screen on (Screen Wake Lock over `https`), and in landscape puts the notes beside the controls. Jumps, fullscreen, auto-advance, and the collaborator name moved to **More**.
- The desktop sends its timer, blackout state, and next beat to paired phones, accepts `clock` and `blackout` commands, starts the timer on a phone's first navigation, and clears a blackout when a phone navigates. Timer and blackout changes from the presenter window or keyboard reach the phones at once.
- Slides now set their own text colour. Thumbnails inside the phone's dark UI (Present and Mark) and the presenter window inherited light text and showed white text on white slides.

### Layout safety

- HTML deck: slide typography no longer depends on the browser window. Sixteen font sizes used `vw` inside `clamp()`, so a 1024px laptop or projector window wrapped lines and chose densities differently from a 1440px one, and the presenter window differed from the deck. Sizes are now fixed on the 1200×675 stage at the values a large window already used, and the root font size is pinned to 16px.
- HTML deck: tall and square figures in split, ablation, and qualitative slides stay inside the stage (a 2:5 figure overran it by about 470px); the figure column now has the stage's height and the figure shrinks within it.
- HTML deck: long text columns overflow at the bottom instead of pushing the label above the stage, and cover, takeaway, and objective slides center their content the same way. Bullets on centered slides line up with their dots.
- HTML deck: metric labels and figure captions wrap instead of ending in "…", and the compact results strip no longer uses 12–13px text.
- HTML deck: equations are inserted as text, so `y_{<t}` no longer opens an HTML tag that swallowed the rest of the slide and left the LaTeX unrendered. Wide display math shrinks to its box (down to 55%) instead of being clipped.
- HTML deck: `gridTemplate` values with quoted area names work (the quotes ended the `style` attribute and dropped the grid); percent tracks such as `35% 65%` no longer overrun the stage by the gap; labels and headings span all grid columns; and `placement` (`left`, `right`, `full`, `center`) is honored. The example in [slide data generation](references/slide-data-generation.md) was fixed.
- HTML deck: fitting now measures every box on the slide by its line boxes, not only the stage's scroll size, so text clipped inside a column counts as overflow. After normal, compact, and tight density, split slides try a wider text column; slides that still overflow are flagged for the Guide and the audit. The slide refits after web fonts load.
- Browser audit: also fails clipped or spilling content inside any box, ellipsis or line-clamp truncation, overlapping text, slides the fitter flagged, and slides that lay out differently at 1024×640 than at 1440×900; it warns about slide text under 14px and unrendered LaTeX. Run from the CLI, it sizes its time budget from the embedded slide count.
- New `scripts/test_layout_stress.py` renders a 27-slide worst-case deck and audits it; the health check runs it. The static audits now flag `vw`/`vh` inside `clamp()` font sizes.
- React project: slides now fit like the HTML deck (`lib/fitSlide.ts` tries normal, compact, then tight density on a hidden clone, sets `data-density`, and flags `data-overflow` with a console warning). Slides center with collapsing spacers; tables no longer sit in a 408px scroll box that hid rows from the audience; `<figure>` loses the browser's 40px side margins, which pushed figures beside metrics past their column; eyebrows and metric labels are 14px.
- Single-file React component: slide type sizes are fixed stage pixels (no `vw`, no `rem` that a host page could rescale); `box-sizing: border-box` is scoped to the component, because in hosts without a global reset the stage's padding made it larger than the deck and clipped the bottom of every slide; slides fit with compact, tight, and a wider text column on split slides; figures lose the default margins and shrink to their column; metric labels and captions wrap.

### Phone remote reliability

- Phones that cannot reach the computer directly (mobile data, venue Wi-Fi with client isolation, VPN) can pair through a TURN relay set in `meta.remote` or on `<html data-remote-ice-servers>` / `data-remote-ice-servers-url`. The template had replaced PeerJS's default ICE config with STUN only, and PeerJS's own TURN hosts no longer resolve, so these phones stayed on "Connecting" until they failed. See [phone remote relay](references/artifact-rendering.md#phone-remote-relay).
- The desktop reconnects to the PeerJS signaling server under the same QR token after a drop, retries with backoff, and resumes pairing after a reload in the same tab. Before, a dropped server connection left a dead QR code on screen until the page was reloaded, and the reload issued a new token.
- Phones time out a stuck attempt after 15 seconds, retry with backoff, reconnect after the screen wakes or the network returns, and explain the failure (desktop missing, pairing server unreachable, no network path). After eight failed tries the status button retries on tap.
- The roster keeps one entry per phone across reconnects, and the second default STUN server is now `stun.cloudflare.com` (dual-stack) instead of Twilio's IPv4-only host.

### Guided conversation and clear explanations

- The [guided deck workflow](references/guided-deck-workflow.md) now follows the full conversation design of [life-design-compass](https://github.com/voidful/life-design-compass): an opening contract, a stuck-point reframe that separates fixed limits (slot, venue, what the paper shows) from design choices, three storylines of equal standing (problem first, result first, one example end to end), a cheap prototype before the full build, follow-up questions that close with a short summary, and new modes `reframe`, `storylines`, `prototype`, and `clarity pass`. A new agent-only status, `storylines proposed`, sits before `outline proposed`.
- Guided builds work for the user's own unpublished results: their files and answers are the source, missing results are reported as gaps, and claim origins go into speaker notes.
- New [explain clearly](references/explain-clearly.md) reference adapted from [hung-yi-lee-skill](https://github.com/voidful/hung-yi-lee-skill): a thread of questions instead of a list, one load-bearing punchline, methods motivated by the problem they fix (怎麼辦), relevance first, analogies that say where they break, numbers that land without changing, a completeness check, and a teaching voice for speaker notes that still passes the copy rules.
- New templates [storyline card](assets/guided/storyline-options.md) and [session state](assets/guided/session-state.yaml), and review cases in [evals/guided-and-clarity.json](evals/guided-and-clarity.json). SKILL.md, the Claude, ChatGPT, and OpenAI adapters, and the ChatGPT knowledge manifest now route to both references (the manifest drops two priority-3 files to stay at 20).

### Presenting, guided finishing, and wording (open-slide v2.3.1 review)

- HTML deck: presenter window (`P`) with the current beat, the next build, Markdown-lite notes, a timer paced against the talk brief, and black screen; auto-advance moves to `A`. Pop-up blockers fall back to an on-deck notes drawer (`N`).
- HTML deck: overview of real thumbnails with build, transition, and notes markers and arrow-key navigation (`O`/`G`); a Ctrl/⌘ K command menu with full-text slide search and every action; deep links (`#/N`, `#/N/B`, `?slide=N`) that follow navigation; `?chrome=0`; black and white screens (`B`/`.`/`W`); PgUp/PgDn clicker keys; multi-digit jumps; and a working `?` key list with an Escape order that closes the top layer first.
- HTML deck: print to PDF renders every slide at its final build on its own 1200×675 page, plus an A4 handout with notes; the windowed deck now centers instead of clipping in windows narrower than 1248px.
- HTML deck: the control bar is now one pill of grouped line icons (navigation, presenting tools, search/edit/fullscreen) with delayed tooltips that name each shortcut, build-step dots beside the counter, dimmed first/previous/next buttons at the deck's ends, play/pause and fullscreen icons that follow the state, and a timer shown only while auto-advancing. Exported decks no longer gain a duplicate edit button (or file input) each time they are re-exported.
- HTML editor: a Guide (`G`) that asks the talk brief one question at a time and then shows one next step per finding, with inline fixes, image choice for figure slots, agent prompts, ignore (`guideIgnore`), and skip; status labels run `brief needed`, `draft`, `ready to rehearse`, `ready to present`. The interview rules adapt [life-design-compass](https://github.com/voidful/life-design-compass); the agent-side version is the new [guided deck workflow](references/guided-deck-workflow.md).
- HTML editor: comment mode (`C`) with pins, a count badge, resolve/reopen, and File › Export comments for agents; drop an image onto any figure slot or choose one in the inspector. `meta.brief` and review comments survive drafts, JSON, and HTML export.
- New [slide copy rules](references/slide-copy-rules.md) for zh-TW and English adapted from [Michelin](https://github.com/voidful/michelin), with `scripts/audit_slide_copy.py`. The renderer reports major and moderate wording findings, and the Guide runs the same rule table (synced with `--sync-template`, checked by the health check).
- Content-matched motion: the skill now asks for per-slide `transition`, `motion`, and `morph` choices from a content map in [motion graphics](references/motion-graphics.md) once the static deck works, and the renderer prints advisory `motion:` hints for large tables or many animated numbers, a figure repeated without `morph`, stacked strong transitions, and long decks with no per-slide choices.
- New `morph` transition in all three engines: shared figures, metric cards, labels, and titles fly to their new place while the rest crossfades; `slide.morph` ids pair anything with a build target.

### Motion graphics

- Added slide transitions and text/figure entrances to the HTML deck, React project, and single-file React component, after effects in the [Motion Library](https://kittenjam-motion-library.vercel.app): 12 transitions (push, wipe, curtain, circle reveal, split doors, slices, zoom-through, glitch, pixel dissolve, and fades); split rise, blur-in letters, spread, merge, scramble, typewriter, line reveal, and soft line fade text effects; clip and soft-mask figure reveals, staggered cards, number count-up, and callout sweeps.
- Added six presets (`none`, `subtle`, `editorial` default, `kinetic`, `cinematic`, `digital`) with stronger transitions reserved for accent slides, plus per-slide `transition`, `motion`, and `accent` fields. Deck motion is set with `meta.motion`, `--motion`, or the deck design's `motion_policy.preset`. The compiler chooses a preset from the mood family.
- Every effect ends on the static layout. Text splits only when line breaks are identical, including CJK punctuation; navigation finishes running motion; back navigation shows complete slides; reduced motion cuts instantly. Builds now update in place and animate only the revealed target instead of re-rendering and re-fading the whole slide.
- HTML deck: motion panel (`M` / ✦), editor Motion popover and inspector section with preview, undoable changes saved to drafts and JSON/HTML exports, and `?motion=<preset>` for previews or static captures. React project: Tweaks motion section and a `MotionStage` that snapshots the outgoing slide before React commits. PDF export captures with `?motion=none`.
- Single-file React component: an embedded `Motion` engine and `MotionStage`, a motion panel (`M` / ✦), and outgoing slides that keep their own mood colors during transitions.
- The browser audit measures the final frame, the stage-model audit now inspects only `scaleDeck`, and the health check keeps the Python catalog and all three engines in sync.

### Skill instructions and GitHub documentation

- Replaced the long entrypoint with task-based routing for creation, revision, planning, auditing, and skill maintenance, with an on-demand reference index.
- Made audience, duration, language, slide count, and output format follow the user brief. Removed forced teaching sequences, visual variety quotas, and arbitrary verification loops while preserving source fidelity and renderer integrity.
- Aligned ChatGPT/Claude adapters, added native Codex UI metadata, and fixed the missing OpenAI instruction source.
- Made platform exports preserve runtime resources and relative paths, with separate directories for all-platform exports and regression checks for actual bundles.
- Clarified setup, generator limitations, single-file versus offline behavior, and the limits of synthetic/browser verification in the README.
- Corrected contradictory viewport-dependent font examples and compiler defaults to use stage-independent sizes.
- Recorded the instruction-design sources and behavioral review scenarios in the maintenance reference.

### React workbench UI/UX pass

- Added data-driven progressive builds inspired by open-slide's `Steps`/`Step`: `revealOrder` works in the canonical HTML and React project, consumes navigation before slide changes, preserves layout geometry, honors reduced motion, and synchronizes presenter and phone previews.
- Deduplicated presenter packets delivered through both `BroadcastChannel` and the local-storage fallback, so one presenter action always advances or retreats exactly one beat.
- Recorded the reviewed open-slide commit, adopted ideas, and deliberate non-adoptions so future updates preserve Slider's evidence-first and self-contained boundaries.
- Reworked the canonical HTML editor around a Google Slides-style core workflow: faithful filmstrip thumbnails, drag/keyboard reordering, slide cut/copy/paste, context actions, history snapshots that include theme state, accessible inspector labels, collapsible panels, compact file actions, and centered responsive editor geometry without changing the fixed slide stage.

- Accessibility: added `:focus-visible` rings to every control, a reusable `useModalDialog` hook (focus trap + restore + component-local Escape) applied to the Help and Overview modals, non-modal dialog semantics for the Review/Visual/Design/Tweaks side panels, full keyboard navigation in the overview grid (arrows/Home/End/Enter), and a polite screen-reader live region announcing each slide change.
- Input correctness: multi-digit slide jump for decks with 10+ slides (type "1" then "2" → slide 12), a stricter `contenteditable` guard, hierarchical Escape (one action per keystroke), and a laser pointer that now tracks the cursor accurately at any zoom and in fullscreen (it was offset because it ignored the stage scale).
- Added a runtime theme switcher + Live Tweaks panel (`T` / wrench): preset themes, accent/positive/negative color pickers, text-size and transition sliders, a progress-bar toggle, reset, and `deck_tweaks.json` export — all persisted to `localStorage`.
- Added the `table-focus` layout (semantic comparison table with theme-aware header, highlighted best row, and review targets), closing a documented layout gap, plus a metrics→table fallback.
- Robustness: empty-deck / out-of-bounds guards in the renderer, presenter panel, and review-comment add path.
- Visual polish: per-element entrance stagger on bullets/metrics/table, a slide-stage crossfade tied to the transition tweak, AA-legible blackout overlays, semantic `--positive` / `--negative` tokens, a tidier grouped control dock, and small-screen `.app-shell` / stage-scale adaptation.

- Added linked presenter-window support to the React project starter, with current/next previews, notes, timer, jump control, and black/white blackout commands inspired by open-slide's presenter workflow.
- Added projection-side laser pointer, wheel navigation, and touch swipe navigation to the React project starter.
- Added React starter review comments, visual asset manager, deck design lock panel, and static/PDF export scripts.
- Added `visual_asset_report.py` for paper visual binding coverage reports.
- Upgraded the canonical HTML base webpage with play/pause auto-advance, elapsed timer display, and stronger presenter controls.
- Expanded edit mode with a slide inspector, block editing, metrics editing, image insertion, theme editing, draft save/load, JSON import/export, and self-contained HTML export.
- Added bundled demo slide data so the base template opens as a usable presentation without a generation step.
- Updated health checks to understand base64-encoded slide payloads in rendered HTML artifacts.
- Added SnapShare-style phone remote pairing with QR/token URLs, PeerJS data-channel control, slide navigation, playback/fullscreen commands, annotations, highlights, synced notes, and link sending.
- Added multi-collaborator support with per-user name/color identity, desktop and phone rosters, author-labeled notes, and author-colored slide ink.
- Removed the default dependency on any third-party controller domain; remote QR codes now point to the bundled controller in the generated deck, with `data-remote-controller-url` available for user-owned static hosting.

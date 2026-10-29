# Changelog

## Unreleased

### Presenting, guided finishing, and wording (open-slide v2.3.1 review)

- HTML deck: presenter window (`P`) with the current beat, the next build, Markdown-lite notes, a timer paced against the talk brief, and black screen; auto-advance moves to `A`. Pop-up blockers fall back to an on-deck notes drawer (`N`).
- HTML deck: overview of real thumbnails with build, transition, and notes markers and arrow-key navigation (`O`/`G`); a Ctrl/⌘ K command menu with full-text slide search and every action; deep links (`#/N`, `#/N/B`, `?slide=N`) that follow navigation; `?chrome=0`; black and white screens (`B`/`.`/`W`); PgUp/PgDn clicker keys; multi-digit jumps; and a working `?` key list with an Escape order that closes the top layer first.
- HTML deck: print to PDF renders every slide at its final build on its own 1200×675 page, plus an A4 handout with notes; the windowed deck now centers instead of clipping in windows narrower than 1248px.
- HTML editor: a Guide (`G`) that asks the talk brief one question at a time and then shows one next step per finding, with inline fixes, image choice for figure slots, agent prompts, ignore (`guideIgnore`), and skip; status labels run `brief needed`, `draft`, `ready to rehearse`, `ready to present`. The interview rules adapt [life-design-compass](https://github.com/voidful/life-design-compass); the agent-side version is the new [guided deck workflow](references/guided-deck-workflow.md).
- HTML editor: comment mode (`C`) with pins, a count badge, resolve/reopen, and File › Export comments for agents; drop an image onto any figure slot or choose one in the inspector. `meta.brief` and review comments survive drafts, JSON, and HTML export.
- New [slide copy rules](references/slide-copy-rules.md) for zh-TW and English adapted from [Michelin](https://github.com/voidful/michelin), with `scripts/audit_slide_copy.py`. The renderer reports major and moderate wording findings, and the Guide runs the same rule table (synced with `--sync-template`, checked by the health check).
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

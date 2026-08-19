# Changelog

## Unreleased

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

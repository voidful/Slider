# Changelog

## Unreleased

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

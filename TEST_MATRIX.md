# Test Matrix

## Core Health

- `python3 scripts/check_skill_health.py`
  - Validates Python syntax.
  - Validates linked skill references and release docs.
  - Runs the text-to-slide-data-to-artifact roundtrip.
  - Runs browser overflow checks for the canonical HTML template output.

## Canonical HTML Template

- `python3 scripts/browser_slide_audit.py assets/html-slideshow-starter/paper-presentation.html`
  - Verifies the bundled demo deck renders without overflow.
  - Checks windowed and simulated-fullscreen scaling.
  - Checks image load status.

## React Project Starter

- `cd assets/react-project-starter && npm install && npm run build`
  - Verifies the multi-file starter type-checks and builds through Vite.
  - Confirms the starter does not depend on implicit global CSS or ignored config files.
- Browser smoke test at the local Vite URL.
  - Verify previous/next navigation, disabled edge buttons, overview, notes, and fullscreen controls.
- Confirm speaker notes do not cover slide evidence or metrics.
- On the demo motivation slide, confirm Right/Space reveals one bullet at a time, Left unwinds builds, and overview jumps show the complete slide.
- Confirm the presenter window mirrors the current build and consumes builds before slide changes.

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

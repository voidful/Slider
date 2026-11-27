# Presenter UX

## Goal

Make the generated artifact feel like presentation software, not like a static webpage.

## Required controls

Support these interactions by default:
- previous and next navigation (buttons + arrows),
- space for next,
- slide counter,
- progress bar (colored with `--accent`),
- fullscreen toggle.

## Recommended enhanced controls

Also support when practical:
- number-key jump (1-9),
- home and end for first and last slide,
- escape to close overlays or exit fullscreen,
- help hint or key legend,
- a presenter window with current slide, next slide, notes, timer, and jump control,
- black and white blackout controls for stage pauses,
- laser pointer toggle for pointing at figures or tables,
- wheel and single-finger horizontal swipe navigation for trackpads and tablets.

## HTML deck keys and tools

| Key | Action |
|:---|:---|
| → ↓ Space PgDn / ← ↑ Shift+Space PgUp | Next / previous beat (clickers send PgDn and PgUp) |
| Home, End, digits | First, last, or slide N; digits typed within 0.9 s join, so 1 then 2 opens slide 12 |
| O or G | Overview of real thumbnails with build, transition, and notes markers; arrows move, Enter opens |
| P | Presenter window: current and next beat (the next build, not just the next slide), notes, timer against the brief's talk length, pace warning, black screen |
| N | Notes drawer on the deck itself, for single-screen rehearsal; when pop-ups are blocked, P opens it instead |
| A | Auto-advance (moved from P) |
| B or `.`, W | Black or white screen; any navigation key clears it |
| F, L, M, R | Fullscreen, laser, motion panel, phone remote |
| U | Audience QR code: the room follows the slides on their phones (see below) |
| E | Request changes: click what should change, describe it, then copy one prompt for the agent; double-click text to fix a typo on screen (recorded as a request). The full editor is in the command menu or at `?edit=full` |
| Ctrl/⌘ K | Command menu: full-text slide search and every deck action, in present and edit mode |
| ? | Key list · Esc closes the top layer first, then leaves fullscreen |

- **Deep links:** `#/N` opens slide N fully built and `#/N/B` at build step B; `?slide=N` also works. The hash follows navigation without adding history entries, so a reload keeps the place. `?chrome=0` hides the controls for embedding or recording.
- **Print and PDF:** Ctrl/⌘ P or File › Print renders every slide at its final build on its own 1200×675 page. File › Print handout puts each slide above its notes on A4. Turn on background graphics if the browser asks.
- **Speaker notes** accept light Markdown: blank-line paragraphs, `-` or `1.` lists, `**bold**`, `*italic*`, and `` `code` ``.

## Phone as speaker remote

Press `R` (or the phone button), scan the QR code, and the phone opens on **Present**, a speaker view built for one hand:

- the current slide's speaker notes in large type (A−/A+, remembered on the phone), following the desktop as it moves;
- the talk timer, coloured by pace against the brief's talk length, with the wall clock and time left; the phone buzzes (where the browser supports vibration) and the clock flashes at 5 and 2 minutes left and at time;
- thumbnails of the current beat and the next beat (the next build, not only the next slide);
- large Back and Next buttons, and a horizontal swipe on the notes; Black and White screen toggles; Start/Pause and a Reset that needs a second tap within three seconds;
- a request to keep the screen on (Screen Wake Lock, which needs an `https` or `localhost` deck URL; elsewhere the phone asks the speaker to turn off auto-lock).

Time and slide progress bars sit under the clock, dots under Next count the slide's remaining builds, and Next reads "End of deck" at the end. A toggle hides the previews when the notes need the room. If the link drops, a banner over the notes gives the reason and retries on tap; the remote opened in a second tab takes over and the first tab says so.

The desktop owns the timer, so the phone, the presenter window, and the desktop show the same time. A phone's first navigation starts the timer, and navigating clears a blackout, as in the presenter window. Landscape puts the notes on the left and the controls on the right. **Mark** draws on a live preview, **Notes** sends a note to the screen or saves it as the speaker note, and **More** holds jumps, fullscreen, auto-advance, links, and the collaborator name. Every paired phone receives the speaker notes, so share the code only with co-presenters. Pairing needs a URL the phone can reach: `python3 scripts/serve_deck.py deck.html` serves a deck at this computer's Wi-Fi address and shares nothing else; for other networks see [phone remote relay](artifact-rendering.md#phone-remote-relay).

## Audience follow-along and accessible handout

Press `U` (or Ctrl/⌘ K › Audience QR code) to project a QR code for the room. It opens the same deck with `?follow=<id>`. That page shows the slide the presenter is on, at its current build and focus, followed by the slide as real text: headings, lists, tables with header cells, figures with their alt text and captions, and math as KaTeX with MathML for screen readers. The audience can enlarge the text, browse back, and return to live.

- The audience QR names a separate `aud-…` pairing from the speaker remote's token. Followers receive only `{type, index, build, count}` and the deck ignores anything they send, so the audience link can neither steer the deck nor read speaker notes over the connection. Each follower is one WebRTC data channel to the presenter's tab; the deck accepts 150 and tells the rest to read the text version (21 followers were tested on one machine).
- `?handout` opens the whole deck as one accessible text document: one `h1`, a table of contents, one section per slide with ordered headings, figure descriptions, `lang` set from `meta.brief.language` or the deck's text, readable at 320 px without horizontal scrolling. `?handout=notes` adds the speaker notes, as a transcript for people who cannot hear the talk.
- The deck file itself contains the speaker notes, so anyone who opens it can find them. When notes are private, share the audience copy instead: Ctrl/⌘ K › Download audience copy (no speaker notes) removes notes, step notes, review comments, and planning fields.
- Alt text matters more now: the audience view and the handout read it. Give every figure an `alt` that says what it shows.

## Fullscreen behavior (MANDATORY)

Fullscreen must:
- target the `.deck` container (not `document.documentElement`),
- expand `.deck` to `100vw × 100vh` with no max-width, border, or border-radius,
- remove box-shadow in fullscreen,
- auto-hide controls (opacity 0, show on hover/focus-within),
- preserve all keyboard navigation,
- support both button-triggered and keyboard-triggered fullscreen,
- exit fullscreen on Escape key,
- restore normal centered layout cleanly on exit,
- recompute stage scale on resize.

### Implementation

```javascript
// Target the deck element
function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    deckEl.requestFullscreen().catch(() => {});
  }
}
```

```css
.deck:fullscreen {
  width: 100vw !important;
  height: 100vh !important;
  max-width: none !important;
  max-height: none !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}
```

### Common bug: DO NOT fullscreen document.documentElement

Fullscreening `document.documentElement` or `document.body` while the deck has a fixed max-width creates the "small centered frame" bug. Always fullscreen the `.deck` element.

## Motion rules

- Slide transitions and entrances come from the deck's [motion preset](motion-graphics.md). `M` (HTML deck, React component) or Tweaks (React project) changes it live.
- Presenter input always wins: next, previous, and jumps finish running motion first, and rapid presses cut instantly.
- Going back shows the previous slide complete; builds animate only the revealed target.
- Respect `prefers-reduced-motion`; the engines cut instantly for it.
- No bounce or distracting ambient effects; strong transitions are reserved for accent slides.

## Input handling

Clamp indices safely.
Ignore unsupported keys.
Prevent accidental out-of-range slide jumps.
Prevent default on Space key to avoid page scroll.

## Accessibility

Provide:
- buttons with aria-labels,
- visible focus states,
- contrast-safe text,
- interactions that do not rely on color alone.

## Layout priorities

1. projector-safe readability,
2. desktop presentation quality,
3. graceful fallback on smaller screens.

Do not sacrifice main-slide clarity for secondary controls.

## Speaker Notes Protocol

### Storage format

Speaker notes are stored as a JSON array in the HTML file:

```html
<script type="application/json" id="speaker-notes">
[
    "Slide 0 notes — Welcome the audience, introduce yourself.",
    "Slide 1 notes — Explain why this problem matters using the example.",
    "Slide 2 notes — Walk through the input-output pair."
]
</script>
```

Each element corresponds to a slide by index (0-based array, matching the `slides` array order).

### Slide change notification

The template must emit a `postMessage` on init and every slide change:

```js
window.postMessage({slideIndexChanged: currentSlideIndex}, '*');
```

This enables:
- The dual-screen speaker view to stay synchronized
- External tools and companion apps to track slide position
- Host frames (Claude artifacts, preview tools) to display contextual notes

### Integration with dual-screen view

The speaker window listens for `slideIndexChanged` messages and updates:
- Current speaker note text
- Next slide preview and key message
- Timer and progress state

## React presenter window protocol

For the multi-file React starter, presenter mode should open the same app with `?presenter=1`.
The projection window is the source of truth and publishes slide index, blackout state, deck title, and timer start over `BroadcastChannel`, with `localStorage` as a fallback for browser contexts where a channel is unavailable.

Presenter controls send commands back to the projection:
- previous / next / goto,
- black screen / white screen / clear blackout,
- reset timer.

If no projection window responds, the presenter view may run as a local preview rather than failing blank.

## Projection input enhancements

The projection view should support:
- `L` to toggle a soft laser pointer that follows the cursor,
- vertical wheel or trackpad scroll to move between slides, with cooldown to avoid accidental multi-slide jumps,
- single-finger horizontal swipe for tablet navigation,
- disabled wheel/swipe navigation while overlays, notes, or overview are open.

### Notes authoring rules

- Speaker notes should be conversational delivery scripts, not slide summaries.
- Each note should be speakable in 30–60 seconds.
- Notes should include evidence rationale: why this visual was chosen for the main deck.
- Notes are internal metadata — they are never shown to the audience in presentation mode.

## Live Tweaks Shortcut

The template supports a live tweaks panel for post-generation design customization:
- **Keyboard:** `T` key toggles the tweaks panel
- **Toolbar:** Wrench icon button
- **Scope:** Accent colors, font sizes, mood family, transition speed
- **Persistence:** Values save to `localStorage` and can be exported as `deck_tweaks.json`

See [live-tweaks-protocol.md](live-tweaks-protocol.md) for the full specification.

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
- help hint or key legend.



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

- Clarify transitions with subtle fade (200–250ms).
- Respect `prefers-reduced-motion`.
- No bounce, large zooms, or distracting effects.

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

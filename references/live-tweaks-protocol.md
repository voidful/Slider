# Live Tweaks Protocol

## Goal

Allow presenters to adjust visual properties of a generated deck without re-running the pipeline. Changes persist across reloads and can be exported for reproducibility.

---

## Architecture

The tweaks system has three layers:

1. **Defaults block** — JSON object embedded in the HTML with marker comments for tooling.
2. **Runtime panel** — Floating UI panel activated by keyboard shortcut or toolbar button.
3. **Persistence** — Values saved to `localStorage` and optionally exported as `deck_tweaks.json`.

---

## Defaults block

The canonical template embeds a tweaks defaults object inside inline `<script>`:

```js
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "primaryAccent": "#2563eb",
  "positiveColor": "#059669",
  "negativeColor": "#dc2626",
  "bodyFontSize": 18,
  "titleFontSize": 32,
  "moodFamily": "editorial",
  "backgroundTreatment": "solid",
  "slideTransitionMs": 320,
  "showProgressBar": true,
  "slideEntranceAnimation": "fadeUp"
}/*EDITMODE-END*/;
```

**Rules:**
- The block between `/*EDITMODE-BEGIN*/` and `/*EDITMODE-END*/` must be valid JSON (double-quoted keys and strings).
- Exactly one such block may exist per HTML file.
- External tools may parse and rewrite this block to persist changes to disk.

---

## Tweakable properties

| Property | Type | Range | Affects |
|:---|:---|:---|:---|
| `primaryAccent` | hex color | any valid hex | `--accent` and `--accent-bg` tokens |
| `positiveColor` | hex color | any valid hex | `--positive` and `--positive-bg` tokens |
| `negativeColor` | hex color | any valid hex | `--negative` and `--negative-bg` tokens |
| `bodyFontSize` | number (px) | 14–28 | Body text, bullets, callouts |
| `titleFontSize` | number (px) | 24–56 | Slide titles |
| `moodFamily` | enum | editorial, cinematic, minimal, glass, warm, navy | Primary deck mood |
| `backgroundTreatment` | enum | solid, gradient, noise | Background surface style |
| `slideTransitionMs` | number (ms) | 0–800 | Slide entrance animation duration |
| `showProgressBar` | boolean | true/false | Progress bar visibility |
| `slideEntranceAnimation` | enum | fadeUp, fade, none | Entrance animation type |

### Locked properties (not tweakable)

These are controlled by the design control plane and cannot be changed via tweaks:
- Stage dimensions (1200×675)
- Font stack (local-first only)
- Semantic color roles (which token maps to which meaning)
- Overflow protection rules
- Fullscreen scaling model
- Evidence prominence rules (≥65% area)

---

## Activation protocol

1. **Register listener first** — The template adds a `message` listener on `window` that handles:
   - `{type: '__activate_edit_mode'}` → show the tweaks panel
   - `{type: '__deactivate_edit_mode'}` → hide the tweaks panel

2. **Then announce availability** — Only after the listener is live:
   ```js
   window.parent.postMessage({type: '__edit_mode_available'}, '*');
   ```

3. **Standalone activation** — When not embedded in a host frame, the tweaks panel is toggled via:
   - Keyboard: `T` key
   - Toolbar: tweaks button (wrench icon)

---

## Panel UI specification

- **Position:** Fixed, bottom-right corner, `z-index: 1000`
- **Size:** 280px wide, auto height, max-height 400px with scroll
- **Style:** Matches the deck's current mood. Semi-transparent background with `backdrop-filter: blur(12px)`
- **Title:** "Tweaks" (matching Claude convention)
- **Controls:** Color pickers for accent/positive/negative, sliders for font sizes and transition speed, dropdown for mood and animation
- **Hidden by default** in presentation mode. Only visible when activated.

---

## Persistence

### localStorage

On every tweak change:
```js
localStorage.setItem('slider-tweaks', JSON.stringify(currentTweaks));
```

On page load:
```js
const saved = localStorage.getItem('slider-tweaks');
if (saved) Object.assign(TWEAK_DEFAULTS, JSON.parse(saved));
```

### Export

A "Export Tweaks" button in the panel saves the current tweaks as `deck_tweaks.json`:
```json
{
  "version": "1.0",
  "timestamp": "2026-04-20T08:00:00Z",
  "tweaks": {
    "primaryAccent": "#7c3aed",
    "bodyFontSize": 20,
    "moodFamily": "cinematic"
  }
}
```

### postMessage for host integration

When embedded in a host frame (e.g., Claude artifacts, preview tools):
```js
window.parent.postMessage({
  type: '__edit_mode_set_keys',
  edits: { primaryAccent: '#7c3aed', bodyFontSize: 20 }
}, '*');
```

The host may parse the `EDITMODE-BEGIN/END` block and merge edits to persist changes to disk.

---

## Integration with existing systems

- **`applyTheme()`**: Tweaks override semantic color tokens by calling `applyTheme()` with the tweaked values after the initial theme is applied.
- **`deck_design.json`**: Tweaks do not modify the compiled deck design. They are a post-compilation customization layer.
- **Audit scripts**: `audit_design_comfort.py` should read the effective tweaked values when validating, not just the compiled defaults.
- **Export**: `exportHTML()` should embed the current tweaks into the exported file's `TWEAK_DEFAULTS` block.

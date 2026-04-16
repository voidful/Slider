# Fullscreen Contract

This is the authoritative specification for fullscreen behavior.
All renderers, audits, and the LM must follow this contract exactly.

## Default Rule

**Fullscreen = stage scale. Not responsive reflow.**

The deck is a projector medium. When a presenter enters fullscreen, the audience sees the same slide — just bigger. Not reflowed, not re-typeset, not re-aligned.

---

## Stage Geometry

| Property | Value | Notes |
|:---|:---|:---|
| Canvas width | 1200px | Fixed in all modes |
| Canvas height | 675px | Fixed in all modes |
| Aspect ratio | 16:9 | Always |
| Fullscreen scale | `min(viewW/1200, viewH/675)` | Computed on resize |
| Windowed scale | `min((viewW-48)/1200, (viewH-48)/675)` | 48px margin for chrome |
| Transform origin | `center center` | Always |

---

## What Fullscreen Does

1. Computes a larger `transform: scale(s)` factor
2. Removes visual chrome: `border: none; border-radius: 0; box-shadow: none`
3. Adds `body.fs-active` class for black background behind the deck
4. Auto-hides controls (opacity:0, visible on hover near bottom edge)
5. Supports simulated-fs (overlay) and native Fullscreen API on the **wrapper**, not on `document.documentElement`

## What Fullscreen Does NOT Do

- Does NOT change `width` or `height` of the deck
- Does NOT switch typography to `vh`/`vw` units
- Does NOT add `transform: none`
- Does NOT change `justify-content`, `align-items`, or flex direction
- Does NOT add `height: 100vh` to any container
- Does NOT reflow text (same line wrapping as windowed)
- Does NOT change padding, margins, or gaps

---

## Prohibited Patterns

These patterns are banned in all renderers and will be caught by `audit_research_slides.py`:

```css
/* BANNED — responsive reflow */
.deck:fullscreen { width: 100vw; height: 100vh; transform: none; }
.deck.simulated-fs { width: 100vw; height: 100vh; }

/* BANNED — viewport-unit typography in content */
.title { font-size: 5vh; }
.body { font-size: 2.8vh; }

/* BANNED — fullscreen-specific layout overrides */
:fullscreen .slide { justify-content: flex-start; }
:fullscreen .region-center { height: 100vh; }
```

---

## Opt-In Reflow (Rare Exception)

In rare cases, a slide may opt in to reflow behavior. This is only permitted for:

1. Dense comparison tables with many columns
2. Appendix/reference slides (not core talk)
3. Full-page visualizations that benefit from viewport fill

To opt in, the slide data must include:

```json
{
  "fullscreen_mode": "reflow"
}
```

The default is always `"preserve"`. If `fullscreen_mode` is absent, the slide MUST use stage scaling.

---

## Implementation Reference

### `scaleDeck()` — the single source of truth

```javascript
function scaleDeck() {
  const isFS = isAnyFullscreen();
  const viewW = isFS ? window.innerWidth : window.innerWidth - 48;
  const viewH = isFS ? window.innerHeight : window.innerHeight - 48;
  const s = Math.min(viewW / 1200, viewH / 675);
  deckEl.style.width  = '1200px';
  deckEl.style.height = '675px';
  deckEl.style.transform = `scale(${s})`;
  deckEl.style.transformOrigin = 'center center';
}
```

### `syncFSBody()` — body class for background

```javascript
function syncFSBody() {
  document.body.classList.toggle('fs-active', isAnyFullscreen());
}
```

### Fullscreen target

Native fullscreen should be requested on the stage wrapper (`#deck-wrapper` or equivalent), not on `.deck` and never on `document.documentElement`.

### CSS — fullscreen chrome only

```css
body.fs-active { background: #000; overflow: hidden; }
#deck-wrapper:fullscreen .deck,
#deck-wrapper:-webkit-full-screen .deck,
.deck-wrapper.simulated-fs .deck {
  border: none; border-radius: 0; box-shadow: none;
}
```

---

## Composition Stability Guarantee

> A presenter rehearses in windowed mode and presents in fullscreen with zero visual drift.
> Text wrapping, vertical alignment, whitespace distribution, and element proportions are identical.

This guarantee is verified by:
- `audit_research_slides.py` — checks for viewport-unit leaks and transform:none
- `audit_design_comfort.py` — checks stability dimension (windowed/fullscreen drift)
- Visual browser tests comparing windowed vs fullscreen screenshots

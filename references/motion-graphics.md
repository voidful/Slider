# Motion graphics

Slider decks can animate slide transitions and the entrance of text, figures, cards, and numbers. The effects follow patterns collected in the [Motion Library](https://kittenjam-motion-library.vercel.app) (curated by Hannah; reviewed 2026-10-29) and are re-implemented for the fixed 1200×675 stage with the Web Animations API. The HTML deck, the React project, and the single-file React component share the same ids, presets, and timings.

Motion shapes how content appears; it does not change what the slide says. Build the static slide first, then pick a preset.

## Engine contract

- **The final frame is the static layout.** No transform, filter, clip, mask, or split span remains after an effect ends.
- **Text is split only when line breaks stay identical.** Word, character, and line splits are measured against the original text; on any difference the effect falls back to a line- or block-level version. Math, images, and mixed markup animate as blocks; tables animate row by row. CJK punctuation stays attached to its neighbor (`（括`, `號）`).
- **Navigation wins.** Next, previous, jump, and build inputs finish running motion before acting. Presses less than 220 ms apart cut without motion.
- **Back navigation** plays the reversed transition and shows the previous slide complete. Forward moves and direct jumps replay the entrance; direct jumps show the final build state.
- **Builds** animate only the newly revealed target, with that target's channel effect.
- **Static surfaces:** thumbnails, overview, presenter and phone previews, printing (`beforeprint`), and React PDF export (`?motion=none`).
- **Reduced motion:** `prefers-reduced-motion: reduce` gives instant cuts and no entrance motion.

## Presets

| Preset | Transition | Accent transition | Titles | Hero titles | Body | Figures | Numbers | Use for |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| `none` | none | none | none | none | none | none | none | Static decks, recordings that need cuts |
| `subtle` | fade | rise | fade-up | fade-up | fade-up | fade-up | none | Equation-dense or formal talks |
| `editorial` (default) | push | curtain | rise | spread | soft | mask | count | Most conference talks |
| `kinetic` | wipe | circle | blur | merge | lines | clip | count | Keynotes, demos, energetic openers |
| `cinematic` | zoom | doors | spread | blur | soft | zoom | count | Visual or qualitative papers |
| `digital` | glitch | pixel | scramble | scramble | blur | clip | scramble | Short informal or systems talks |

Labels, cards/rows, and callouts also have channels (`kicker`, `group`, `emphasis`); see the catalog.

**Accent slides** receive the accent transition: `cover`, `takeaway`, `experiment-headline`, and `limitations` layouts; `title`, `main-result`, `limitation`, and `takeaway` page roles; and the first appendix slide. The single-file component also treats its `hero-stat` layout and `headline result` and `close` page roles as accents. Set `accent: true` or `false` on a slide to override.

`compile_deck_design.py` derives a default from the mood family (`technical-minimal` → `subtle`, `cinematic-evidence` → `cinematic`, otherwise `editorial`). The renderer uses that preset when the slide plan gives no motion.

## Catalog

Transitions (`transition`, `accent`):

| Id | Motion | Library reference |
|:---|:---|:---|
| `none` | Instant cut | — |
| `fade` | Crossfade | — |
| `rise` | Old slide lifts away, new slide rises in | Gentle Fade Up |
| `push` | New slide pushes in with an edge shadow; old slide slides 30% and dims | Push Navigation |
| `wipe` | Diagonal reveal led by an accent edge | Split Invert |
| `curtain` | Three accent panels drop, then retract | Curtain Page Transition |
| `circle` | Circular reveal from the center with an accent ring | Circle Reveal Transition |
| `doors` | Old slide splits into two doors that slide apart | Split Doors Reveal |
| `slices` | Old slide leaves as six alternating vertical strips | Slice Transition |
| `zoom` | Camera flies through the old slide into the new one | Text Zoom Through |
| `glitch` | Horizontal slices jitter with RGB split | Glitch Slices |
| `pixel` | Random grid cells cover, then uncover | Pixel Dissolve |
| `morph` | Elements on both slides fly from their old box to the new one; the rest crossfades. Falls back to `fade` when nothing pairs | Keynote Magic Move, open-slide MorphElement |

Text effects (`kicker`, `title`, `hero`, `text`):

| Id | Motion | Library reference |
|:---|:---|:---|
| `fade-up` | Block rises 18px and fades in | Gentle Fade Up |
| `rise` | Words (CJK: characters) rise out of masks | Split Rise |
| `blur` | Characters (long text: words) sharpen from blur | Blur In Letters |
| `spread` | Characters spread out from the line center | Spread |
| `merge` | Top halves slide from the left, bottom halves from the right | Merge |
| `scramble` | Accent glyphs decode left to right (≤64 characters) | Scramble Reveal |
| `typewriter` | Characters type on behind a caret (≤160 characters) | Typewriter |
| `lines` | Lines rise from masks with a slight tilt | Line Reveal |
| `soft` | Lines sharpen from blur at reading pace | Soft Line Fade |

Other channels: `media` (figures, placeholders, equations): `fade-up`, `clip` (Image Clip Reveal), `mask` (Soft Mask Reveal), `zoom`. `data` (metric values, hero numbers): `count` (Number Counter; keeps prefix, suffix, decimals, and thousands separators), `scramble`. `group` (metric cards, comparison panels, timeline steps, table rows): `fade-up`, `stagger` (Staggered Card Reveal). `emphasis` (callouts, limitation blocks): `sweep` (Highlight Text).

## Slide-plan fields

Set deck motion in the plan's `meta`, or pass `--motion` to `render_slideshow_artifact.py`. Either can be a preset name or an object:

```json
{
  "meta": {"motion": {"preset": "editorial", "accent": "circle", "data": "none", "speed": 1.2}},
  "slideData": [
    {"id": 1, "layout": "cover", "title": "…"},
    {"id": 7, "pageRole": "main-result", "transition": "curtain", "motion": {"title": "scramble"}},
    {"id": 9, "layout": "result-table", "motion": "subtle"},
    {"id": 12, "accent": false}
  ]
}
```

- `transition`: transition into this slide; overrides the deck default and accent rule.
- `motion`: a preset name, or an object with `preset` plus channel overrides (`kicker`, `title`, `hero`, `text`, `media`, `data`, `group`, `emphasis`, `speed`).
- `accent`: forces or suppresses the accent transition.
- `speed`: 0.25–4; durations are divided by it.
- `morph`: ids by build target for the `morph` transition, e.g. `{"visual": "fig-overview"}` on two consecutive slides. Without ids, morph pairs the same image, the same metric label, the same label, title, or equation text, and finally the two titles (which crossfade if their text differs). Matched elements skip their entrance; nothing else changes.

The renderer rejects unknown deck-level ids and warns about unknown per-slide ids, which the engines ignore.

## Match motion to content

The deck preset is a baseline, not the whole plan. Once the static slides read well, walk the deck once and give a slide its own `transition`, `motion`, or `morph` where its content calls for one. Most slides keep the preset; a quarter of them or fewer usually need an override. When the brief asks for no motion, use preset `none` and add no overrides.

| Slide content | Set | Why |
|:---|:---|:---|
| Opener, main result, limitations turn, close | Nothing; the accent rule plays the stronger transition | Strong motion marks the talk's turns |
| One headline number | Keep the preset's number effect (`count` in `editorial`, `kinetic`, and `cinematic`) | The count ends on the exact reported value and draws the eye |
| Five or more numbers, or a table of six or more rows | `"motion": "subtle"` or `{"data": "none"}` | Values must read at once, not tick or trickle in |
| The figure that carries the claim | The preset's `media` reveal; `{"media": "zoom"}` for a photo-like qualitative result | The reveal directs attention without moving the data |
| The same figure on consecutive slides (overview, then detail) | `"transition": "morph"`, with `morph` ids when the crop differs | The audience keeps their place in the figure |
| Same title, next part ("continued") | `"transition": "morph"` | Only the new content seems to change |
| Method pipeline, timeline, numbered steps | `revealOrder` for pacing and `{"group": "stagger"}` | Appearance order mirrors the method's order |
| Before and after, or baseline against ours | `"transition": "wipe"` | The sweep reads as a change |
| Long equation or derivation | `"motion": "none"` or `"subtle"` | Symbols should not move while being read |
| Definition, quotation, or one-sentence claim | `{"text": "soft", "emphasis": "sweep"}` | Reading pace, then emphasis on the callout |
| Section divider | `"transition": "curtain"` or `"zoom"`, once or twice per talk | Signals a new part without becoming a pattern |
| Systems, demo, or code slide | `{"title": "typewriter"}` for a short command; `"scramble"` only for short labels (64 characters or fewer) | Fits terminal-like content; long text would make people wait |
| Appendix and backup slides | `"motion": "none"` | Fast lookup during questions |

The renderer prints advisory `motion:` hints for the clearest mismatches: a large table or many numbers with animated values, the same figure on consecutive slides without `morph`, strong transitions stacked on ordinary slides, and a long deck with no per-slide choices at all. Treat them as prompts to look, not rules; the brief and the content decide.

## Controls

- **HTML deck:** press `M` or ✦ while presenting to open the motion panel: presets, per-channel overrides, speed, and replay. In the editor, **Motion** opens the same panel. The inspector's **Motion** section sets the slide's transition, preset, and accent flag, and **Preview** plays it in present mode. Changes are undoable and saved in drafts, JSON export (`meta.motion`), and HTML export.
- **React project:** the Tweaks panel (`T`) has preset, transition, speed, and **Replay slide** controls, saved in the browser. Rendered settings live in `src/lib/presentationConfig.ts` (`deckMotion`).
- **Single-file React component:** `M` or ✦ opens a motion panel with presets, transition, speed, and **Replay slide**. Changes last for the session; the rendered default is the `deckMotion` constant. Each slide keeps its own mood during a transition.
- **Any deck:** `?motion=<preset>` previews or disables motion for one page load without saving, e.g. `deck.html?motion=none` for screenshots.

## Authoring guidance

- Pick the deck preset from the venue and audience. Use `editorial` for most talks and `subtle` or `none` for formal or equation-heavy talks. Reserve `digital` and `kinetic` for briefs that ask for energy. Then tune individual slides with the content map above.
- Use `morph` where consecutive slides share an object: zooming from an overview figure into one panel, a metric that carries over, or a title that stays while the content changes. Give the shared element a `morph` id when automatic pairing would miss it.
- Builds (`revealOrder`) control pacing. Motion controls only how revealed content appears. An entrance settles in about 1–1.5 s at 1×, and an early press finishes it immediately.
- Avoid stacking strong transitions. The accent rule already highlights the opener, main result, limitation turn, and close.

## Verification

- Call `finishMotion()` before measuring a rendered HTML deck. `browser_slide_audit.py` does this in every settle step and therefore audits the final layout.
- Use `?motion=none` for static captures. React `npm run export:pdf` already does.
- `check_skill_health.py` verifies that the Python catalog matches all three engines and that the motion hooks remain.
- Check motion itself in a visible browser window. Hidden or background tabs pause the animation timeline until they become visible.

## Maintenance

The engines live in the HTML template's `MOTION GRAPHICS` section, in `assets/react-project-starter/src/lib/motion.ts` with `src/components/MotionStage.tsx`, and in `assets/react-slideshow-starter/App.tsx` (a `Motion` IIFE with `MotionStage` and `MotionPanel`; it mirrors `motion.ts` with that file's selectors). The renderer's catalog is in `scripts/render_slideshow_artifact.py`. To add an effect, implement it in all three engines, add the id to every catalog, and document it here. The single-file `MotionStage` also copies the deck's mood variables onto the outgoing clone so it keeps its palette while the deck switches. `MotionStage` clones the outgoing slide in `getSnapshotBeforeUpdate`, before React mutates the DOM, and finishes motion there so split text is restored before reconciliation. Keep effects compositor-friendly: transform, opacity, filter, clip-path, and mask.

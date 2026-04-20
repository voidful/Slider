# Research Slide Anti-Patterns

These are hard rules. The LM must not produce slides matching these patterns.
The comfort audit (`audit_design_comfort.py`) checks for them automatically.

---

## 1. Cards on cards

**Definition:** A result or evidence slide wraps figure, metrics, and summary into multiple small card components instead of giving the evidence a single dominant region.

**Why it hurts comfort:** Evidence loses protagonist status. The viewer's eye cannot settle on one focal point. The slide looks like a dashboard, not a research talk.

**Detection heuristic:** More than 2 distinct `.card`-like containers on a single evidence slide, or the largest visual element occupies less than 50% of the slide area.

**Fix:** Promote one element to the dominant position (≥65% area). Move supporting elements to caption or secondary text. If multiple metrics matter, use a simple inline list — not card boxes.

---

## 2. Mood roulette

**Definition:** Each slide uses a substantially different background color, gradient, surface style, or atmosphere — making the deck look like it was assembled from 15 different websites.

**Why it hurts comfort:** Deck cohesion collapses. The viewer spends cognitive effort adjusting to each new visual environment instead of tracking the narrative.

**Detection heuristic:** More than 3 distinct `background` or `background-color` values across the full set of slides (excluding semantic-role backgrounds like positive-bg and negative-bg).

**Fix:** Lock one `deck_mood_family` for the entire deck. Reserve mood shifts for opener, climax, limitation turn, or close. See [theme-presets.md](theme-presets.md).

---

## 3. App-shell slide

**Definition:** The slide is designed like an application dashboard or admin panel — with sidebars, tab bars, nested navigation, or heavy UI chrome that frames the content.

**Why it hurts comfort:** Attention is eaten by interface chrome. The viewer mistakes the slide for an interactive tool instead of focusing on the research message.

**Detection heuristic:** Presence of sidebar containers, tab-like navigation elements, or more than 3 interactive-styled UI elements on a single slide.

**Fix:** Remove all app-like chrome. Research slides are projected media, not web applications. Controls bar is the only permitted UI element.

---

## 4. Center collapse

**Definition:** Content is vertically centered in the slide, leaving large empty regions above and below — especially prominent in fullscreen where the scaled stage may have letterboxing.

**Why it hurts comfort:** Fullscreen shows a small island of text floating in empty space. The slide looks unfinished.

**Detection heuristic:** Content occupies less than 55% of the vertical space AND uses `justify-content: center` or equivalent centering.

**Fix:** Use top-aligned layouts for content-heavy slides. Reserve vertical centering only for hero slides (title, takeaway, single-stat) where the emptiness is intentional dramatic whitespace.

---

## 5. Equation wall

**Definition:** Long equations are placed directly on a slide without compact mode, without chunked explanation, and without surrounding whitespace management.

**Why it hurts comfort:** The equation overflows on standard and compact screens. Audience members cannot parse a dense formula without guided decomposition.

**Detection heuristic:** Equation block exceeds 900px width (at 1200px canvas), or slide contains more than 2 equation blocks without any plain-language text between them.

**Fix:** Enable compact mode for long equations (smaller font, reduced padding). Add a plain-language explanation line below every equation. If the equation is too long, split into multiple annotated steps across slides.

---

## 6. Caption-as-body

**Definition:** Figure captions are styled and sized like body text, making them compete with the figure for visual attention instead of supporting it.

**Why it hurts comfort:** The viewer's eye ping-pongs between the figure and the caption. Neither gets sufficient focus.

**Detection heuristic:** Caption text is styled at body font size (≥18px) or occupies more than 20% of the slide's text area.

**Fix:** Captions should be 14–16px, weight 400, muted color. They support the figure; they never compete with it.

---

## 7. Over-accenting

**Definition:** Every visual element uses accent borders, glows, gradients, or colored backgrounds — making nothing stand out because everything stands out.

**Why it hurts comfort:** Visual hierarchy flattens. The viewer cannot identify the focal point when every element is decorated equally.

**Detection heuristic:** More than 3 elements with accent-colored borders, backgrounds, or box-shadows on a single slide. Or more than 5 across the deck.

**Fix:** One accent per slide maximum. The accent marks the single most important element. Everything else uses neutral styling.

---

## 8. Responsive slide thinking

**Definition:** Slides are built with responsive web design principles — fluid widths, viewport-relative units for content, flex-wrap reflow — treating slides as web pages instead of projector media.

**Why it hurts comfort:** Content reflows between windowed and fullscreen modes. Text wrapping changes. Layout shifts. The presenter cannot rehearse reliably.

**Detection heuristic:** Content styles using `vh`/`vw` units, `flex-wrap: wrap`, `width: 100vw`, or `transform: none` in fullscreen. See [fullscreen-contract.md](fullscreen-contract.md).

**Fix:** Use the stage-consistent model. Fixed 1200×675 canvas + `transform: scale()`. No viewport units in content. No fullscreen reflow. See the renderer contract in [SKILL.md](../SKILL.md).

---

## 9. AI-slop aesthetic

**Definition:** The slide deck exhibits generic AI-generated visual patterns: aggressive gradient backgrounds on every slide, emoji used as icons, containers styled with rounded corners and a colored left-border accent (the "AI summary card" look), detailed imagery drawn with SVG `<path>` elements instead of paper figures or clean placeholders, or overused AI-default fonts (Inter, Roboto, Arial, Fraunces).

**Why it hurts comfort:** The deck looks like it was generated by an AI assistant rather than authored by a researcher. Audiences immediately notice the "ChatGPT energy" — purple gradients, floating cards, decorative emoji icons, and generic card grids that look like every AI-generated landing page. This undermines the credibility of the research presentation.

**Detection heuristic:**
- More than 2 slides use gradient backgrounds as their primary surface (mood-accent gradients on 1–2 slides are fine)
- Any emoji character used as a visual icon (✨, 🚀, 💡, 🎯, etc.)
- Any container styled with `border-left: 3-4px solid var(--accent)` combined with `border-radius` and light background (the "AI card" pattern)
- Any SVG `<path>` element attempting to draw detailed illustrations or diagrams that should be paper figures or placeholders
- `@import` or `<link>` tags loading Inter, Roboto, Arial, or Fraunces from Google Fonts or other CDNs

**Fix:** Use the local-first font stack (`'Avenir Next', 'Segoe UI', 'SF Pro Text', system-ui, sans-serif`). Replace emoji with SVG icons or paper figures. Replace left-border accent cards with clean editorial surfaces. Use real paper visuals or labeled placeholder boxes — never SVG illustrations. Reserve gradient backgrounds for at most 1–2 mood-accent slides (opener, climax), not as a default surface.

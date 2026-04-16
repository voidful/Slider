# Theme Presets

## Purpose

Choose a base theme preset and optionally adapt it per paper domain.
The LM may customize the palette within the theme's character.

Pair the base preset with a venue layer from [venue-style-variants.md](venue-style-variants.md) when helpful.

## Preset A. Zinc editorial (default)

Use when the user does not request a custom style.

Characteristics:
- neutral white or zinc background,
- zinc text hierarchy,
- minimal accent usage,
- shadcn-like restraint,
- clean component borders,
- subtle rings and muted cards.

Suggested tokens:
- background: white, zinc-50, zinc-100
- primary text: zinc-950
- secondary text: zinc-600 or zinc-500
- accent: zinc-900 with one optional blue accent only when needed
- borders: zinc-200

## Preset B. Deep navy academic

Use when the user wants a more formal keynote-like presentation.

Characteristics:
- pale off-white or slate background,
- deep navy titles,
- cyan accent only for important numbers or links,
- slightly more stage-like contrast.

Suggested tokens:
- background: #f8fafc
- primary text: #0a2540
- secondary text: #4b5563
- accent: #00d4ff
- borders: #dbe3ea

## Preset C. Monochrome impeccable

Use when the user wants extreme minimalism.

Characteristics:
- monochrome palette,
- typography-led layout,
- almost no accent,
- maximum whitespace,
- emphasis through scale and weight rather than color.

Suggested tokens:
- background: white
- primary text: black or zinc-950
- secondary text: zinc-500
- accent: none or zinc-800 only
- borders: zinc-200

## Selection rule

Default to Preset A unless the user explicitly asks for another style.
Do not mix base presets within one deck.

## Per-slide atmosphere overrides

The LM may apply per-slide atmosphere modifiers regardless of base preset:
- `atmosphere: "warm"` — subtle warm wash for introductory/motivational slides
- `atmosphere: "cool"` — subtle cool wash for method/technical slides
- `atmosphere: "dramatic"` — dark background for key result reveals or takeaway
- `atmosphere: "minimal"` — stripped to essentials for evidence-heavy slides
- `atmosphere: "editorial"` — default, matches the base preset

Atmosphere overrides should be used sparingly — 1–3 slides per deck, not every slide.

## Paper-domain color adaptation

The LM may shift the accent color to match the paper's domain:
- **Biomedical / Clinical**: warmer accent (teal → warm green)
- **Computer Vision**: standard blue or indigo accent
- **NLP / Language**: slightly cooler accent (blue → blue-violet)
- **Robotics / RL**: energetic accent (blue → emerald)
- **Theory / Math**: neutral accent (blue → slate)

The shift should be subtle — the semantic tokens (positive, negative) remain unchanged.

## Combination rule

Use base presets for tokens and venue variants for pacing and emphasis.

Good combinations:
- Zinc editorial + ICLR
- Zinc editorial + ACL
- Deep navy academic + NeurIPS
- Monochrome impeccable + ICLR

# PDF Visual Cropping

## Goal

Export presentation-usable figure or table crops from a paper PDF without manually screenshotting every page.

Use cropping to accelerate deck building, not to bypass verification.

## Preferred workflow

1. run `scripts/find_visual_evidence.py <paper.pdf>` to locate figure and table candidates,
2. inspect the returned labels and pages,
3. run `scripts/export_pdf_visuals.py <paper.pdf> --candidates visuals.json --output-dir exports/` to export first-pass crops,
4. review the exported images,
5. use the best crops in the main deck or redraw them when they are still too dense.

## Modes

### Candidate-driven mode
Use when you already have visual candidates.

This mode should:
- read the candidate manifest,
- search for captions on the specified pages,
- crop around the likely visual region,
- fall back to full-page export when caption-aware cropping is unreliable,
- emit a manifest describing what was saved.

### Manual mode
Use when you know the page and region.

This mode should support:
- page-only export,
- page plus bounding box export,
- optional label and file prefix.

## Cropping heuristics

### Figures
Usually keep:
- the figure body,
- the caption label,
- a small amount of margin.

If the caption is below the figure, crop primarily above the caption.
If the caption is above the figure, crop primarily below the caption.

### Tables
Usually keep:
- the table caption,
- the full table body,
- enough surrounding context to preserve row and column labels.

Table captions are often above the table. Favor a downward crop from the caption when possible.

## Fallback policy

If caption-aware cropping fails:
- export the full page at high resolution,
- keep the manifest note that cropping fell back,
- do not pretend the crop is precise.

## Presentation rule

Do not drop raw exported crops into the main deck automatically.

After export, decide whether to:
- use the crop directly,
- annotate it,
- simplify it,
- redraw it,
- move it to appendix.

## Anti-patterns

Never:
- crop away axis labels or row labels when they matter,
- keep unreadably dense visuals in the main deck,
- assume the first crop is presentation-ready,
- use visually impressive but rhetorically irrelevant figures.

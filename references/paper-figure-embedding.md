# Paper Figure Embedding Pipeline

## Goal

Extract figures from a paper PDF and embed them directly into the presentation HTML as self-contained base64 data URIs. The final HTML file must have zero external file dependencies.

## When to use this pipeline

Use this pipeline when a paper PDF is available and the slide plan includes `mustIncludeVisual: true` slides that reference specific figures or tables.

## Complete pipeline

### Step 1. Locate candidates

```bash
python scripts/find_visual_evidence.py <paper.pdf> --output visuals.json
```

This scans the PDF for text blocks that match `Figure N` or `Table N` patterns, extracts bounding boxes, caption text, and panel metadata.

Output: `visuals.json` with `candidates[]` array.

### Step 2. Score and rank

```bash
python scripts/score_visual_candidates.py --visuals visuals.json --evidence evidence.json --output scored-visuals.json
```

Ranks candidates by relevance to the talk's evidence needs. Priority A visuals are mandatory for the main deck.

### Step 3. Crop from PDF

```bash
python scripts/export_pdf_visuals.py <paper.pdf> --candidates scored-visuals.json --output-dir exports/ --manifest export-manifest.json --zoom 2.0
```

Exports cropped PNG images at 2× resolution. The script uses caption anchoring and region hints to crop precisely around the figure body.

Key flags:
- `--zoom 2.0` — default, produces high-resolution crops
- `--margin 18.0` — default padding around detected regions

Output: PNG files in `exports/` and `export-manifest.json` with metadata.

### Step 4. Convert to base64

```python
import base64
from pathlib import Path

def png_to_data_uri(path: str) -> str:
    data = Path(path).read_bytes()
    b64 = base64.b64encode(data).decode("ascii")
    return f"data:image/png;base64,{b64}"

# Example
data_uri = png_to_data_uri("exports/p3-figure-2.png")
```

### Step 5. Embed into slide data

Set the `visual` field on the slide and use the `figure` content block:

```json
{
  "type": "figure",
  "content": {
    "src": "data:image/png;base64,iVBOR...",
    "alt": "Architecture diagram showing frozen LLM connected to SA adapter and FTP heads",
    "caption": "Figure 2 — End-to-end LLM-Codec architecture"
  },
  "emphasis": "primary"
}
```

Also set the slide-level visual tracking fields:

```json
{
  "evidenceType": "figure",
  "evidenceSource": "Figure 2",
  "mustIncludeVisual": true,
  "visualBinding": { "label": "Figure 2", "pageNumber": 3 },
  "visualIntent": "Architecture diagram shows the frozen-LLM-to-codec bridge at a glance"
}
```

### Step 6. Bind automatically (optional)

For batch processing, use the visual asset binder:

```bash
python scripts/bind_visual_assets.py \
  --slide-data slide-data.json \
  --visuals scored-visuals.json \
  --exports export-manifest.json \
  --output bound-slide-data.json
```

This automatically matches exported images to slides based on `visualBinding` labels and page numbers.

## Using the `figure` content block

The `figure` block type supports two modes:

### Image mode (when base64 data URI is available)

```json
{
  "type": "figure",
  "content": {
    "src": "data:image/png;base64,...",
    "alt": "Description for accessibility",
    "caption": "Figure 2 — Architecture diagram"
  },
  "emphasis": "primary"
}
```

Renders as:
```html
<figure class="paper-figure emphasis-primary">
  <img src="data:image/png;base64,..." alt="..." loading="lazy" />
  <figcaption>Figure 2 — Architecture diagram</figcaption>
</figure>
```

### Placeholder mode (when figure not yet extracted)

```json
{
  "type": "figure",
  "content": {
    "placeholder": "Figure 2 — LLM-Codec Architecture\n\nFrozen LLM → SA Adapter → FTP Heads → Codec Output",
    "caption": "Figure 2 — End-to-end architecture"
  }
}
```

Renders as a dashed-border placeholder box with the placeholder text.

## Emphasis variants

- `emphasis: "primary"` — max-height 58vh, dominant visual
- No emphasis — max-height 50vh, standard size
- Both render centered with `object-fit: contain`

## Self-containment rule

The final HTML **must** embed all images as base64 data URIs:
- `data:image/png;base64,...` for PNG crops
- `data:image/jpeg;base64,...` for JPEG crops

Never reference external files (e.g., `src="exports/fig2.png"`). The output must open directly in any browser without a file server.

## Fallback policy

When a PDF is not available or extraction fails:

1. **Faithful redraw** — Reconstruct the figure using HTML/CSS/SVG. Set `evidenceType: "reconstructed-diagram"`.
2. **Placeholder** — Use the placeholder mode of the `figure` block. Set a clear label.
3. **Never** leave a `mustIncludeVisual: true` slide without any visual.

See [faithful-redraw-policy.md](faithful-redraw-policy.md) for redraw constraints.

## React starter equivalent

In the React starter (`App.tsx`), the equivalent of the `figure` content block is the `FigureFrame` component, used within the `split`, `diagram`, and `method-overview` layout cases. It accepts:

- `visual?: VisualAsset` with `{ src, alt, caption, confidence }`
- `label?: string` for placeholder fallback

## Anti-patterns

- Do not embed figures larger than 500KB without checking if a lower zoom or JPEG conversion would be sufficient.
- Do not use `figure` blocks without a `caption`.
- Do not embed a full-page PDF render as a figure — crop to the specific visual region.
- Do not reference external file paths in `src` — only data URIs.

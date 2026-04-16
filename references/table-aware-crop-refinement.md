# Table-Aware Crop Refinement

## Goal

Tighten table crops so that exported visuals better match the actual table region instead of the full page or a loose caption anchor band.

## Preferred strategy

After locating a table caption:
1. scan text blocks below the caption
2. stop at the next caption-like block or at a large vertical gap
3. aggregate the contiguous blocks into a tighter table rectangle
4. expand slightly for readability

## Signals

A structure-aware table crop should preserve:
- caption location
- contiguous row band
- tighter horizontal bounds than full-page width when possible

## Crop mode naming

Use `auto-table-structure-aware` when the crop was refined using contiguous table blocks.
Use a weaker mode only when structure-aware refinement is not possible.

## Fallback

If refinement is uncertain, keep the broader crop and reduce confidence instead of over-tightening.

#!/usr/bin/env python3
"""Locate figure and table candidates with stronger layout-aware auto-detection."""
from __future__ import annotations

import argparse
import json
import math
import re
from pathlib import Path
from typing import Any

try:
    import fitz  # type: ignore
except Exception:  # pragma: no cover
    fitz = None

FIG_PATTERNS = [r"\bfigure\s+\d+\b", r"\bfig\.\s*\d+\b"]
TAB_PATTERNS = [r"\btable\s+\d+\b"]
SECTION_RE = re.compile(r"^(?:\d+[.]\s+)?(?:abstract|introduction|method|methods|results|discussion|conclusion|appendix)$", re.I)
PANEL_RE = re.compile(r"\(([a-f])\)|\b([a-f])[.:]\s", re.I)


def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def caption_confidence(first_line: str, line_count: int, bbox_found: bool) -> str:
    score = 0
    lowered = first_line.lower()
    if re.match(r"^(?:figure|fig\.|table)\s*\d+[.:]?", lowered):
        score += 3
    if len(first_line.split()) >= 4:
        score += 1
    if line_count >= 2:
        score += 1
    if bbox_found:
        score += 1
    return "high" if score >= 5 else "medium" if score >= 3 else "low"


def infer_panel_geometry(panel_count: int, page_rect: list[float] | None, caption_bbox: list[float] | None) -> dict[str, Any]:
    if panel_count < 2:
        return {"rows": 1, "cols": 1, "layout": "single", "strength": 0.0}
    aspect = 1.0
    if page_rect and caption_bbox:
        px0, py0, px1, py1 = page_rect
        cx0, cy0, cx1, cy1 = caption_bbox
        width = max(1.0, px1 - px0)
        # infer the visual region opposite the caption
        if cy0 > py0 + (py1 - py0) * 0.52:
            height = max(1.0, cy0 - py0)
        else:
            height = max(1.0, py1 - cy1)
        aspect = width / height
    elif page_rect:
        px0, py0, px1, py1 = page_rect
        aspect = (px1 - px0) / max(1.0, (py1 - py0))

    if panel_count == 2:
        if aspect >= 1.2:
            rows, cols, layout = 1, 2, "horizontal"
        else:
            rows, cols, layout = 2, 1, "vertical"
    elif panel_count in {3, 4}:
        if aspect >= 0.9:
            rows, cols, layout = 2, 2, "grid-2x2"
        else:
            rows, cols, layout = panel_count, 1, "stacked"
    else:
        cols = 3 if aspect >= 1.0 else 2
        rows = math.ceil(panel_count / cols)
        layout = f"grid-{rows}x{cols}"
    strength = round(min(1.0, 0.4 + panel_count * 0.12 + (0.12 if layout.startswith("grid") else 0.0)), 2)
    return {"rows": rows, "cols": cols, "layout": layout, "strength": strength}




def infer_panel_boundaries(panel_count: int, geometry: dict[str, Any]) -> tuple[list[dict[str, Any]], float]:
    if panel_count < 2:
        return [], 0.0
    rows = max(1, int(geometry.get("rows") or 1))
    cols = max(1, int(geometry.get("cols") or panel_count))
    layout = str(geometry.get("layout") or "grid")
    cell_w = 1.0 / cols
    cell_h = 1.0 / rows
    boundaries: list[dict[str, Any]] = []
    for idx in range(panel_count):
        row, col = divmod(idx, cols)
        label = chr(ord('a') + idx)
        boundaries.append({
            "label": label,
            "row": row,
            "col": col,
            "bbox_norm": [round(col * cell_w, 3), round(row * cell_h, 3), round((col + 1) * cell_w, 3), round((row + 1) * cell_h, 3)],
        })
    strength = round(min(1.0, 0.45 + panel_count * 0.08 + (0.1 if 'grid' in layout or cols > 1 else 0.0)), 2)
    return boundaries, strength


def infer_separator_geometry(geometry: dict[str, Any], separators: list[dict[str, Any]]) -> dict[str, Any]:
    vertical = [s for s in separators if s.get("orientation") == "vertical"]
    horizontal = [s for s in separators if s.get("orientation") == "horizontal"]
    def spacing(items: list[dict[str, Any]]) -> tuple[list[float], float]:
        positions = sorted(float(i.get("position_norm") or 0.0) for i in items)
        if len(positions) < 2:
            return positions, 1.0 if positions else 0.0
        diffs = [positions[i + 1] - positions[i] for i in range(len(positions) - 1)]
        mean = sum(diffs) / len(diffs)
        if mean <= 0:
            return positions, 0.0
        variance = sum((d - mean) ** 2 for d in diffs) / len(diffs)
        norm_std = (variance ** 0.5) / mean
        return positions, round(max(0.0, min(1.0, 1.0 - norm_std)), 2)
    v_pos, v_consistency = spacing(vertical)
    h_pos, h_consistency = spacing(horizontal)
    strength = 0.0
    if separators:
        strength = round(min(1.0, 0.34 + 0.18 * len(separators) + 0.14 * max(v_consistency, h_consistency)), 2)
    return {
        "vertical_positions": v_pos,
        "horizontal_positions": h_pos,
        "vertical_consistency": v_consistency,
        "horizontal_consistency": h_consistency,
        "separator_count": len(separators),
        "strength": strength,
    }


def infer_panel_separators(geometry: dict[str, Any]) -> tuple[list[dict[str, Any]], float, dict[str, Any]]:
    rows = max(1, int(geometry.get("rows") or 1))
    cols = max(1, int(geometry.get("cols") or 1))
    separators: list[dict[str, Any]] = []
    for idx in range(1, cols):
        x = round(idx / cols, 3)
        separators.append({"orientation": "vertical", "position_norm": x, "span_norm": [0.0, 1.0]})
    for idx in range(1, rows):
        y = round(idx / rows, 3)
        separators.append({"orientation": "horizontal", "position_norm": y, "span_norm": [0.0, 1.0]})
    strength = 0.0
    if separators:
        strength = round(min(1.0, 0.38 + 0.14 * len(separators)), 2)
    separator_geometry = infer_separator_geometry(geometry, separators)
    return separators, strength, separator_geometry


def detect_panel_metadata(caption_text: str, page_rect: list[float] | None = None, caption_bbox: list[float] | None = None) -> dict[str, Any]:
    matches = PANEL_RE.findall(caption_text)
    labels = []
    for left, right in matches:
        label = (left or right).lower()
        if label and label not in labels:
            labels.append(label)
    panel_count = len(labels)
    multipanel = panel_count >= 2
    geometry = infer_panel_geometry(panel_count, page_rect, caption_bbox)
    boundaries, boundary_strength = infer_panel_boundaries(panel_count, geometry)
    separators, separator_strength, separator_geometry = infer_panel_separators(geometry)
    return {
        "multipanel": multipanel,
        "panel_labels": labels,
        "panel_count": panel_count,
        "panel_pattern_strength": round(min(1.0, panel_count / 4.0), 2) if multipanel else 0.0,
        "panel_geometry": geometry,
        "panel_boundaries": boundaries,
        "panel_boundary_strength": boundary_strength if multipanel else 0.0,
        "panel_separators": separators,
        "panel_separator_strength": separator_strength if multipanel else 0.0,
        "separator_geometry": separator_geometry if multipanel else {"separator_count": 0, "strength": 0.0},
    }


def make_region_hint(page_rect: list[float], caption_bbox: list[float], kind: str) -> dict[str, Any]:
    px0, py0, px1, py1 = page_rect
    _, cy0, _, cy1 = caption_bbox
    page_h = py1 - py0
    caption_mid = (cy0 + cy1) / 2
    lower_half = caption_mid > py0 + page_h * 0.52
    if kind == "table":
        direction = "below-caption"
        bbox = [px0, max(py0, cy0 - 16), px1, py1]
        strength = 0.72
    elif lower_half:
        direction = "above-caption"
        bbox = [px0, py0, px1, max(py0 + 40, cy0 - 10)]
        strength = 0.86
    else:
        direction = "below-caption"
        bbox = [px0, min(py1 - 40, cy1 + 8), px1, py1]
        strength = 0.64
    return {"direction": direction, "bbox": [round(v, 2) for v in bbox], "strength": round(strength, 2)}


def candidate_payload(kind: str, page_number: int, label: str, caption_text: str, idx: int, bbox: list[float] | None, page_rect: list[float] | None, line_count: int, detector: str) -> dict[str, Any]:
    panel_meta = detect_panel_metadata(caption_text, page_rect, bbox)
    region_hint = make_region_hint(page_rect, bbox, kind) if bbox and page_rect else {"direction": "above-caption" if kind == "figure" else "below-caption", "bbox": None, "strength": 0.4 if kind == "figure" else 0.32}
    anchor_strength = round(region_hint["strength"] + (0.08 if line_count > 1 else 0.0) + panel_meta["panel_pattern_strength"] * 0.08 + panel_meta["panel_geometry"]["strength"] * 0.06 + panel_meta["panel_separator_strength"] * 0.05 + float((panel_meta.get("separator_geometry") or {}).get("strength") or 0.0) * 0.05, 2)
    out = {
        "type": kind,
        "page_number": page_number,
        "label": label,
        "caption_excerpt": caption_text[:500],
        "line_index": idx,
        "caption_confidence": caption_confidence(caption_text.split(". ")[0], line_count, bbox is not None),
        "caption_position": region_hint["direction"],
        "region_hint": region_hint,
        "anchor_strength": anchor_strength,
        "detector": detector,
        **panel_meta,
    }
    if bbox:
        out["caption_bbox"] = bbox
    if page_rect:
        out["page_bbox"] = page_rect
    return out


def collect_from_pdf(path: Path) -> dict[str, Any]:
    if fitz is None:
        raise RuntimeError("PyMuPDF is required for PDF layout-aware detection")
    doc = fitz.open(path)
    candidates: list[dict[str, Any]] = []
    for page_index, page in enumerate(doc, start=1):
        text_dict = page.get_text("dict")
        lines: list[dict[str, Any]] = []
        for block in text_dict.get("blocks", []):
            if block.get("type") != 0:
                continue
            for line in block.get("lines", []):
                spans = line.get("spans", [])
                text = clean_text(" ".join(span.get("text", "") for span in spans))
                if not text:
                    continue
                xs = [span.get("bbox", [0, 0, 0, 0])[0] for span in spans]
                ys = [span.get("bbox", [0, 0, 0, 0])[1] for span in spans]
                xe = [span.get("bbox", [0, 0, 0, 0])[2] for span in spans]
                ye = [span.get("bbox", [0, 0, 0, 0])[3] for span in spans]
                lines.append({"text": text, "bbox": [min(xs), min(ys), max(xe), max(ye)]})
        for idx, item in enumerate(lines):
            lowered = item["text"].lower()
            kind = None
            if any(re.search(p, lowered) for p in FIG_PATTERNS):
                kind = "figure"
            elif any(re.search(p, lowered) for p in TAB_PATTERNS):
                kind = "table"
            if kind is None:
                continue
            caption_lines = [item]
            last_y = item["bbox"][3]
            for extra in range(1, 3):
                if idx + extra >= len(lines):
                    break
                nxt = lines[idx + extra]
                if SECTION_RE.match(nxt["text"]):
                    break
                if re.match(r"^(?:figure|fig\.|table)\s*\d+", nxt["text"], re.I):
                    break
                if nxt["bbox"][1] - last_y > 22:
                    break
                caption_lines.append(nxt)
                last_y = nxt["bbox"][3]
            caption_text = clean_text(" ".join(x["text"] for x in caption_lines))
            x0 = min(x["bbox"][0] for x in caption_lines)
            y0 = min(x["bbox"][1] for x in caption_lines)
            x1 = max(x["bbox"][2] for x in caption_lines)
            y1 = max(x["bbox"][3] for x in caption_lines)
            bbox = [round(x0, 2), round(y0, 2), round(x1, 2), round(y1, 2)]
            label_match = re.search(r"((?:figure|fig\.|table)\s*\d+)", lowered, re.I)
            page_rect = [round(page.rect.x0, 2), round(page.rect.y0, 2), round(page.rect.x1, 2), round(page.rect.y1, 2)]
            candidates.append(candidate_payload(kind, page_index, label_match.group(1) if label_match else kind, caption_text, idx, bbox, page_rect, len(caption_lines), "pdf-layout-anchor"))
    return {
        "source_path": str(path),
        "source_type": "pdf",
        "page_count": len(doc),
        "kind": "all",
        "candidates": dedupe_candidates(candidates),
        "notes": [
            "PDF detection uses text layout and caption anchors.",
            "Multi-panel hints use caption labels, geometry inference, and lightweight panel-boundary detection.",
        ],
    }


def dedupe_candidates(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    seen: set[tuple[Any, ...]] = set()
    for item in items:
        key = (item["type"], item["page_number"], str(item["label"]).lower())
        if key in seen:
            continue
        seen.add(key)
        out.append(item)
    return out


def collect_from_text(path: Path) -> dict[str, Any]:
    lines = [x for x in path.read_text(encoding="utf-8").splitlines() if x.strip()]
    candidates: list[dict[str, Any]] = []
    for idx, raw in enumerate(lines):
        line = clean_text(raw)
        lowered = line.lower()
        kind = None
        if any(re.search(p, lowered) for p in FIG_PATTERNS):
            kind = "figure"
        elif any(re.search(p, lowered) for p in TAB_PATTERNS):
            kind = "table"
        if kind is None:
            continue
        caption_lines = [line]
        for extra in range(1, 3):
            if idx + extra >= len(lines):
                break
            nxt = clean_text(lines[idx + extra])
            if SECTION_RE.match(nxt) or re.match(r"^(?:figure|fig\.|table)\s*\d+", nxt, re.I):
                break
            caption_lines.append(nxt)
        caption_text = clean_text(" ".join(caption_lines))
        label_match = re.search(r"((?:figure|fig\.|table)\s*\d+)", lowered, re.I)
        candidates.append(candidate_payload(kind, 1, label_match.group(1) if label_match else kind, caption_text, idx, None, None, len(caption_lines), "text-caption-anchor"))
    return {
        "source_path": str(path),
        "source_type": path.suffix.lower().lstrip("."),
        "page_count": 1,
        "kind": "all",
        "candidates": dedupe_candidates(candidates),
        "notes": [
            "Text-mode detection has no geometric bounding boxes.",
            "Panel labels in text-mode are used only as caption-derived priors.",
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Locate figure and table candidates in a paper PDF or text file.")
    parser.add_argument("source", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    payload = collect_from_pdf(args.source) if args.source.suffix.lower() == ".pdf" else collect_from_text(args.source)
    rendered = json.dumps(payload, indent=2, ensure_ascii=False)
    if args.output:
        args.output.write_text(rendered, encoding="utf-8")
    print(rendered)


if __name__ == "__main__":
    main()

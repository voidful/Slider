#!/usr/bin/env python3
"""Export figure or table visuals from a PDF with stronger region auto-detection."""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

import fitz


def slugify(text: str) -> str:
    text = re.sub(r"[^A-Za-z0-9]+", "-", text).strip("-").lower()
    return text or "visual"


def load_candidates(path: Path) -> list[dict[str, Any]]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    return raw.get("candidates") or raw.get("scored_candidates") or []


def page_blocks(page: fitz.Page) -> list[tuple[fitz.Rect, str]]:
    out: list[tuple[fitz.Rect, str]] = []
    for x0, y0, x1, y1, text, *_ in page.get_text("blocks"):
        text = str(text).strip()
        if text:
            out.append((fitz.Rect(x0, y0, x1, y1), text))
    return out


def page_words(page: fitz.Page) -> list[tuple[fitz.Rect, str]]:
    out: list[tuple[fitz.Rect, str]] = []
    for x0, y0, x1, y1, text, *_ in page.get_text("words"):
        token = str(text).strip()
        if token:
            out.append((fitz.Rect(x0, y0, x1, y1), token))
    return out


def expand_rect(rect: fitz.Rect, page_rect: fitz.Rect, margin: float) -> fitz.Rect:
    out = fitz.Rect(rect)
    out.x0 = max(page_rect.x0, out.x0 - margin)
    out.y0 = max(page_rect.y0, out.y0 - margin)
    out.x1 = min(page_rect.x1, out.x1 + margin)
    out.y1 = min(page_rect.y1, out.y1 + margin)
    return out


def rect_from_list(values: list[float] | None) -> fitz.Rect | None:
    return fitz.Rect(*values) if values and len(values) == 4 else None


def is_caption_like(text: str) -> bool:
    return bool(re.match(r"^(?:figure|fig\.|table)\s*\d+", text.strip(), re.I))


def infer_table_structure(page: fitz.Page, table_rect: fitz.Rect) -> dict[str, Any]:
    words = [(rect, text) for rect, text in page_words(page) if rect.intersects(table_rect)]
    if not words:
        return {"row_count": 0, "column_count": 0, "column_edges": [], "row_edges": [], "strength": 0.0}
    words.sort(key=lambda item: (item[0].y0, item[0].x0))
    rows: list[list[fitz.Rect]] = []
    threshold = 8.0
    for rect, _ in words:
        placed = False
        for row in rows:
            mid = sum(r.y0 + r.y1 for r in row) / (2 * len(row))
            this_mid = (rect.y0 + rect.y1) / 2
            if abs(this_mid - mid) <= threshold:
                row.append(rect)
                placed = True
                break
        if not placed:
            rows.append([rect])
    x_starts = sorted(rect.x0 for rect, _ in words)
    dynamic_threshold = max(12.0, min(24.0, table_rect.width * 0.09))
    cols: list[float] = []
    for x in x_starts:
        if not cols or abs(x - cols[-1]) > dynamic_threshold:
            cols.append(x)
        else:
            cols[-1] = (cols[-1] + x) / 2
    row_edges = [round(min(r.y0 for r in row), 2) for row in rows]
    col_edges = [round(x, 2) for x in cols]
    strength = min(1.0, 0.25 + len(rows) * 0.08 + len(cols) * 0.09)
    return {
        "row_count": len(rows),
        "column_count": len(cols),
        "column_edges": col_edges,
        "row_edges": row_edges,
        "strength": round(strength, 2),
    }




def infer_semantic_role_labels(rows: list[list[tuple[fitz.Rect, str]]], cols: list[list[tuple[fitz.Rect, str]]], metric_headers: list[str], stub_column: bool) -> dict[str, Any]:
    def is_numeric_token(token: str) -> bool:
        return bool(re.match(r'^[+\-]?\d+(?:\.\d+)?$', token))

    def is_delta_token(token: str) -> bool:
        return bool(re.match(r'^[+\-]\d+(?:\.\d+)?$', token))

    metric_header_text = ' '.join(metric_headers).lower()
    column_roles: list[str] = []
    column_confidences: list[float] = []
    best_metric_columns: list[int] = []
    delta_columns: list[int] = []
    rank_columns: list[int] = []
    for idx, col in enumerate(cols):
        tokens = [t for _, t in col]
        joined = ' '.join(tokens).lower()
        token_count = max(1, len(tokens))
        delta_ratio = sum(1 for t in tokens if is_delta_token(t)) / token_count
        rank_ratio = sum(1 for t in tokens if re.match(r'^(?:top|rank|#?\d+)$', t, re.I)) / token_count
        numeric_ratio = sum(1 for t in tokens if is_numeric_token(t)) / token_count
        metric_hint = 1.0 if metric_header_text and metric_header_text in joined else 0.0
        role = 'text'
        confidence = 0.32
        if idx == 0 and stub_column:
            role, confidence = 'stub', 0.86
        elif delta_ratio >= 0.5:
            role, confidence = 'delta', min(0.98, 0.48 + delta_ratio * 0.6)
            delta_columns.append(idx)
        elif rank_ratio >= 0.5:
            role, confidence = 'rank', min(0.95, 0.44 + rank_ratio * 0.6)
            rank_columns.append(idx)
        elif numeric_ratio >= 0.5 or metric_hint > 0:
            role, confidence = 'metric', min(0.97, 0.42 + numeric_ratio * 0.45 + metric_hint * 0.18)
            best_metric_columns.append(idx)
        if metric_hint > 0 and role != 'stub':
            role = 'metric'
            confidence = max(confidence, 0.78)
            if idx not in best_metric_columns:
                best_metric_columns.append(idx)
        column_roles.append(role)
        column_confidences.append(round(confidence, 2))
    role_strength = min(1.0, 0.26 + 0.12 * len(best_metric_columns) + (0.16 if stub_column else 0.0) + (0.14 if delta_columns else 0.0) + (0.1 if rank_columns else 0.0))
    calibrated_strength = round(min(1.0, role_strength * 0.55 + (sum(column_confidences) / max(1, len(column_confidences))) * 0.45), 2)
    return {
        'column_roles': column_roles,
        'column_confidences': column_confidences,
        'best_metric_columns': best_metric_columns,
        'delta_columns': delta_columns,
        'rank_columns': rank_columns,
        'strength': round(role_strength, 2),
        'calibrated_strength': calibrated_strength,
    }


def infer_semantic_table(page: fitz.Page, table_rect: fitz.Rect, table_structure: dict[str, Any]) -> dict[str, Any]:
    words = [(rect, text) for rect, text in page_words(page) if rect.intersects(table_rect)]
    if not words:
        return {"header_row": False, "stub_column": False, "numeric_columns": 0, "metric_headers": [], "strength": 0.0}
    row_edges = list(table_structure.get("row_edges") or [])
    col_edges = list(table_structure.get("column_edges") or [])
    if not row_edges or not col_edges:
        return {"header_row": False, "stub_column": False, "numeric_columns": 0, "metric_headers": [], "strength": 0.0}
    rows: list[list[tuple[fitz.Rect, str]]] = [[] for _ in row_edges]
    cols: list[list[tuple[fitz.Rect, str]]] = [[] for _ in col_edges]
    row_mids = row_edges + [table_rect.y1]
    col_mids = col_edges + [table_rect.x1]
    for rect, token in words:
        ymid = (rect.y0 + rect.y1) / 2
        xmid = (rect.x0 + rect.x1) / 2
        row_idx = min(range(len(row_edges)), key=lambda i: abs(ymid - (row_mids[i] + row_mids[i + 1]) / 2))
        col_idx = min(range(len(col_edges)), key=lambda i: abs(xmid - (col_mids[i] + col_mids[i + 1]) / 2))
        rows[row_idx].append((rect, token))
        cols[col_idx].append((rect, token))
    header_tokens = [t for _, t in rows[0]] if rows else []
    metric_headers = [t for t in header_tokens if re.search(r'(acc|f1|precision|recall|bleu|rouge|score|error|auc)', t, re.I)]
    header_row = bool(metric_headers or sum(1 for t in header_tokens if re.search(r'[A-Za-z]', t)) >= max(1, len(header_tokens) // 2))
    first_col_tokens = [t for _, t in cols[0]] if cols else []
    stub_column = sum(1 for t in first_col_tokens if re.search(r'[A-Za-z]', t)) >= max(1, len(first_col_tokens) // 2)
    numeric_columns = 0
    for col in cols[1 if stub_column and len(cols) > 1 else 0:]:
        tokens = [t for _, t in col]
        if tokens and sum(1 for t in tokens if re.search(r'^[+\-]?\d+(?:\.\d+)?$', t)) >= max(1, len(tokens) // 2):
            numeric_columns += 1
    role_labels = infer_semantic_role_labels(rows, cols, metric_headers, stub_column)
    strength = min(1.0, 0.28 + (0.22 if header_row else 0.0) + (0.16 if stub_column else 0.0) + min(0.28, numeric_columns * 0.09) + min(0.16, len(metric_headers) * 0.05) + min(0.16, float(role_labels.get('calibrated_strength') or role_labels.get('strength') or 0.0) * 0.2))
    return {"header_row": header_row, "stub_column": stub_column, "numeric_columns": numeric_columns, "metric_headers": metric_headers[:6], "role_labels": role_labels, "strength": round(strength, 2)}


def refine_table_rect(page: fitz.Page, caption_rect: fitz.Rect, base_clip: fitz.Rect, page_rect: fitz.Rect, margin: float) -> tuple[fitz.Rect, str, dict[str, Any], dict[str, Any]]:
    blocks = page_blocks(page)
    below = [(rect, text) for rect, text in blocks if rect.y0 >= caption_rect.y1 - 2]
    below.sort(key=lambda item: item[0].y0)
    group: list[fitz.Rect] = []
    last_y = None
    for rect, text in below:
        if is_caption_like(text):
            break
        if last_y is not None and rect.y0 - last_y > 34:
            break
        group.append(rect)
        last_y = rect.y1
    if not group:
        clip = expand_rect(base_clip, page_rect, margin / 2)
        structure = infer_table_structure(page, clip)
        return clip, "auto-table-below-caption", structure, infer_semantic_table(page, clip, structure)
    x0 = min(r.x0 for r in group)
    y0 = max(page_rect.y0, caption_rect.y0 - 10)
    x1 = max(r.x1 for r in group)
    y1 = min(page_rect.y1, max(r.y1 for r in group) + 6)
    clip = expand_rect(fitz.Rect(x0, y0, x1, y1), page_rect, margin / 2)
    structure = infer_table_structure(page, clip)
    return clip, "auto-table-structure-aware", structure, infer_semantic_table(page, clip, structure)


def auto_detect_visual_rect(page: fitz.Page, candidate: dict[str, Any], margin: float) -> tuple[fitz.Rect, str, str, str, dict[str, Any], dict[str, Any]]:
    page_rect = page.rect
    region_hint = candidate.get("region_hint") or {}
    kind = str(candidate.get("type", "figure"))
    hint_rect = rect_from_list(region_hint.get("bbox"))
    anchor_strength = float(region_hint.get("strength") or candidate.get("anchor_strength") or 0.0)
    caption_rect = rect_from_list(candidate.get("caption_bbox"))

    if hint_rect is not None:
        clip = expand_rect(hint_rect, page_rect, margin / 2)
        if kind == "table" and caption_rect is not None:
            clip, mode, structure, semantic = refine_table_rect(page, caption_rect, clip, page_rect, margin)
            return clip, mode, "high" if anchor_strength >= 0.7 else "medium", "region-hint", structure, semantic
        confidence = "high" if anchor_strength >= 0.8 else "medium"
        return clip, f"region-hint-{region_hint.get('direction','unknown')}", confidence, "region-hint", {}, {}

    if caption_rect is None:
        return page_rect, "full-page-fallback", "low", "fallback", {}, {}

    blocks = [(rect, text) for rect, text in page_blocks(page) if not rect.intersects(caption_rect)]
    above = [rect for rect, _ in blocks if rect.y1 <= caption_rect.y0 + 2]
    below = [rect for rect, _ in blocks if rect.y0 >= caption_rect.y1 - 2]

    if kind == "table":
        clip, mode, structure, semantic = refine_table_rect(page, caption_rect, fitz.Rect(page_rect.x0, max(page_rect.y0, caption_rect.y0 - margin), page_rect.x1, page_rect.y1), page_rect, margin)
        return clip, mode, "high" if "structure-aware" in mode else "medium", "caption-anchor", structure, semantic

    prev_block = max(above, key=lambda b: b.y1, default=None)
    if prev_block and caption_rect.y0 > page_rect.y0 + page_rect.height * 0.35:
        clip = fitz.Rect(page_rect.x0, max(page_rect.y0, prev_block.y1 + 2), page_rect.x1, min(page_rect.y1, caption_rect.y0 - 4))
        return expand_rect(clip, page_rect, margin / 2), "auto-figure-above-caption", "high", "caption-anchor", {}, {}

    next_block = min(below, key=lambda b: b.y0, default=None)
    if next_block:
        clip = fitz.Rect(page_rect.x0, max(page_rect.y0, caption_rect.y1 + 4), page_rect.x1, min(page_rect.y1, next_block.y0 - 2))
        return expand_rect(clip, page_rect, margin / 2), "auto-figure-below-caption", "medium", "caption-anchor", {}, {}

    return page_rect, "full-page-fallback", "low", "fallback", {}, {}


def save_clip(page: fitz.Page, clip: fitz.Rect, output_path: Path, zoom: float) -> None:
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), clip=clip, alpha=False)
    pix.save(str(output_path))


def split_panels(clip: fitz.Rect, panel_count: int, geometry: dict[str, Any] | None, boundaries: list[dict[str, Any]] | None = None) -> list[fitz.Rect]:
    if panel_count <= 1:
        return [clip]
    if boundaries:
        rects = []
        for boundary in boundaries[:panel_count]:
            x0, y0, x1, y1 = boundary.get("bbox_norm", [0,0,1,1])
            rects.append(fitz.Rect(clip.x0 + clip.width * x0, clip.y0 + clip.height * y0, clip.x0 + clip.width * x1, clip.y0 + clip.height * y1))
        if rects:
            return rects
    width = clip.width
    height = clip.height
    rows = int((geometry or {}).get("rows") or 1)
    cols = int((geometry or {}).get("cols") or panel_count)
    if rows * cols < panel_count:
        cols = max(cols, 2)
        rows = (panel_count + cols - 1) // cols
    cell_w = width / cols
    cell_h = height / rows
    rects: list[fitz.Rect] = []
    for idx in range(panel_count):
        row, col = divmod(idx, cols)
        rects.append(fitz.Rect(clip.x0 + col * cell_w, clip.y0 + row * cell_h, clip.x0 + (col + 1) * cell_w, clip.y0 + (row + 1) * cell_h))
    return rects


def export_panels(page: fitz.Page, clip: fitz.Rect, candidate: dict[str, Any], output_dir: Path, zoom: float) -> list[dict[str, Any]]:
    labels = list(candidate.get("panel_labels") or [])
    count = int(candidate.get("panel_count") or len(labels) or 0)
    if count < 2:
        return []
    geometry = candidate.get("panel_geometry") or {}
    rects = split_panels(clip, count, geometry, candidate.get("panel_boundaries"))
    panels: list[dict[str, Any]] = []
    stem = slugify(f"p{candidate.get('page_number',1)}-{candidate.get('label', candidate.get('type','visual'))}")
    for idx, rect in enumerate(rects[:count]):
        label = labels[idx] if idx < len(labels) else chr(ord('a') + idx)
        output_path = output_dir / f"{stem}-panel-{label}.png"
        save_clip(page, rect, output_path, zoom)
        panels.append({
            "label": label,
            "output_path": str(output_path),
            "clip": [round(rect.x0, 2), round(rect.y0, 2), round(rect.x1, 2), round(rect.y1, 2)],
        })
    return panels


def export_candidate(doc: fitz.Document, candidate: dict[str, Any], output_dir: Path, zoom: float, margin: float) -> dict[str, Any]:
    page_number = int(candidate.get("page_number", 1))
    page = doc.load_page(page_number - 1)
    clip, mode, detection_confidence, detector, table_structure, semantic_table = auto_detect_visual_rect(page, candidate, margin)
    stem = slugify(f"p{page_number}-{candidate.get('label', candidate.get('type', 'visual'))}")
    output_path = output_dir / f"{stem}.png"
    save_clip(page, clip, output_path, zoom)
    panel_exports = export_panels(page, clip, candidate, output_dir, zoom)
    return {
        "label": candidate.get("label", candidate.get("type", "visual")),
        "type": candidate.get("type", "figure"),
        "page_number": page_number,
        "caption_excerpt": candidate.get("caption_excerpt", ""),
        "output_path": str(output_path),
        "crop_mode": mode,
        "clip": [round(clip.x0, 2), round(clip.y0, 2), round(clip.x1, 2), round(clip.y1, 2)],
        "caption_found": bool(candidate.get("caption_bbox")),
        "detection_confidence": detection_confidence,
        "anchor_found": bool(candidate.get("caption_bbox") or candidate.get("region_hint")),
        "anchor_strength": round(float(candidate.get("anchor_strength") or 0.0), 2),
        "detector": detector,
        "panel_exports": panel_exports,
        "panel_count": int(candidate.get("panel_count") or 0),
        "panel_geometry": candidate.get("panel_geometry") or {},
        "panel_boundaries": candidate.get("panel_boundaries") or [],
        "panel_separators": candidate.get("panel_separators") or [],
        "separator_geometry": candidate.get("separator_geometry") or {},
        "table_structure": table_structure,
        "semantic_table": semantic_table,
    }


def export_manual(doc: fitz.Document, page_number: int, output_dir: Path, zoom: float, prefix: str, bbox: list[float] | None) -> dict[str, Any]:
    page = doc.load_page(page_number - 1)
    page_rect = page.rect
    clip = fitz.Rect(*bbox) if bbox else page_rect
    clip = fitz.Rect(max(page_rect.x0, clip.x0), max(page_rect.y0, clip.y0), min(page_rect.x1, clip.x1), min(page_rect.y1, clip.y1))
    stem = slugify(prefix or f"page-{page_number}")
    output_path = output_dir / f"{stem}.png"
    save_clip(page, clip, output_path, zoom)
    return {
        "label": prefix or f"page-{page_number}",
        "type": "manual",
        "page_number": page_number,
        "output_path": str(output_path),
        "crop_mode": "manual-bbox" if bbox else "manual-page",
        "clip": [round(clip.x0, 2), round(clip.y0, 2), round(clip.x1, 2), round(clip.y1, 2)],
        "caption_found": False,
        "detection_confidence": "medium" if bbox else "low",
        "anchor_found": bool(bbox),
        "anchor_strength": 0.5 if bbox else 0.0,
        "detector": "manual",
        "panel_exports": [],
        "panel_count": 0,
        "panel_geometry": {},
        "panel_boundaries": [],
        "panel_separators": [],
        "table_structure": {},
        "semantic_table": {},
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Export figure or table visuals from a PDF.")
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--candidates", type=Path)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--page", type=int)
    parser.add_argument("--bbox", nargs=4, type=float, metavar=("X0", "Y0", "X1", "Y1"))
    parser.add_argument("--prefix", default="")
    parser.add_argument("--zoom", type=float, default=2.0)
    parser.add_argument("--margin", type=float, default=18.0)
    parser.add_argument("--manifest", type=Path)
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(args.pdf)
    exports: list[dict[str, Any]] = []
    if args.candidates:
        for candidate in load_candidates(args.candidates):
            exports.append(export_candidate(doc, candidate, args.output_dir, args.zoom, args.margin))
    elif args.page:
        exports.append(export_manual(doc, args.page, args.output_dir, args.zoom, args.prefix, args.bbox))
    else:
        raise SystemExit("provide either --candidates or --page")

    rendered = json.dumps({"pdf": str(args.pdf), "output_dir": str(args.output_dir), "exports": exports}, indent=2, ensure_ascii=False)
    if args.manifest:
        args.manifest.write_text(rendered, encoding="utf-8")
    print(rendered)


if __name__ == "__main__":
    main()

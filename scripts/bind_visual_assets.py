#!/usr/bin/env python3
"""Bind exported visual assets to slideData with calibrated confidence and fallback policy."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def normalize(text: str) -> str:
    return " ".join(str(text).lower().split()).strip()


def score_export(candidate: dict[str, Any], export: dict[str, Any]) -> float:
    score = 0.0
    if candidate.get("page_number") == export.get("page_number"):
        score += 2.0
    if normalize(candidate.get("label", "")) == normalize(export.get("label", "")) and candidate.get("label"):
        score += 2.4
    cand_caption = normalize(candidate.get("caption_excerpt", ""))
    exp_caption = normalize(export.get("caption_excerpt", ""))
    if cand_caption and exp_caption:
        overlap = len(set(cand_caption.split()) & set(exp_caption.split()))
        score += min(1.6, overlap / 3.5)
    score += {"high": 0.8, "medium": 0.4}.get(str(export.get("detection_confidence", "low")), 0.0)
    score += min(0.7, float(export.get("anchor_strength") or 0.0) * 0.7)
    if export.get("detector") == "region-hint":
        score += 0.35
    if int(export.get("panel_count") or 0) >= 2:
        score += 0.28
    table_structure = export.get("table_structure") or {}
    if int(table_structure.get("row_count") or 0) >= 2 and int(table_structure.get("column_count") or 0) >= 2:
        score += 0.22
    return score


def calibrate_binding(candidate_score: float, export_score: float, export: dict[str, Any] | None, candidate: dict[str, Any] | None) -> tuple[dict[str, Any], bool]:
    export_norm = min(1.0, max(0.0, export_score / 7.8))
    detector_conf = str((export or {}).get("detection_confidence", "low"))
    detector_norm = {"high": 1.0, "medium": 0.62, "low": 0.28}.get(detector_conf, 0.2)
    anchor_norm = min(1.0, float((export or {}).get("anchor_strength") or (candidate or {}).get("anchor_strength") or 0.0))
    region_norm = min(1.0, float(((candidate or {}).get("region_hint") or {}).get("strength") or 0.0))
    panel_norm = min(1.0, float((candidate or {}).get("panel_pattern_strength") or 0.0))
    geometry_norm = min(1.0, float((((candidate or {}).get("panel_geometry") or {}).get("strength") or 0.0)))
    boundary_norm = min(1.0, float((candidate or {}).get("panel_boundary_strength") or 0.0))
    separator_norm = min(1.0, float((candidate or {}).get("panel_separator_strength") or 0.0))
    separator_geometry_norm = min(1.0, float((((candidate or {}).get("separator_geometry") or {}).get("strength") or 0.0)))
    table_structure = (export or {}).get("table_structure") or {}
    table_norm = min(1.0, float(table_structure.get("strength") or 0.0))
    semantic_table = (export or {}).get("semantic_table") or {}
    semantic_norm = min(1.0, float(semantic_table.get("strength") or 0.0))
    role_label_norm = min(1.0, float(((semantic_table.get('role_labels') or {}).get('strength') or 0.0)))
    role_calibration_norm = min(1.0, float(((semantic_table.get('role_labels') or {}).get('calibrated_strength') or 0.0)))
    crop_mode = str((export or {}).get("crop_mode", ""))
    fallback_penalty = 0.22 if "fallback" in crop_mode else 0.0
    table_bonus = 0.06 if "table-structure-aware" in crop_mode else 0.0
    panel_bonus = 0.05 if int((export or {}).get("panel_count") or 0) >= 2 else 0.0
    binding_score = max(0.0, min(1.0, candidate_score * 0.21 + export_norm * 0.19 + detector_norm * 0.1 + anchor_norm * 0.08 + region_norm * 0.06 + panel_norm * 0.03 + geometry_norm * 0.05 + boundary_norm * 0.05 + separator_norm * 0.03 + separator_geometry_norm * 0.04 + table_norm * 0.06 + semantic_norm * 0.04 + role_label_norm * 0.03 + role_calibration_norm * 0.03 + table_bonus + panel_bonus - fallback_penalty))
    if binding_score >= 0.82:
        status, confidence, policy, fallback = "bound", "high", "bind-directly", "placeholder-if-file-missing"
    elif binding_score >= 0.62:
        status, confidence, policy, fallback = "bound", "medium", "bind-with-traceability", "placeholder-if-caption-mismatch"
    elif candidate_score >= 0.55:
        status, confidence, policy, fallback = "placeholder", "low", "manual-review", "placeholder-with-binding-note"
    else:
        status, confidence, policy, fallback = "placeholder", "low", "keep-placeholder", "placeholder"
    reason = f"candidate={candidate_score:.2f}, export={export_norm:.2f}, detector={detector_conf}, anchor={anchor_norm:.2f}, region={region_norm:.2f}"
    meta = {
        "status": status,
        "confidence": confidence,
        "reason": reason,
        "candidateScore": round(candidate_score, 2),
        "exportScore": round(export_score, 2),
        "bindingScore": round(binding_score, 2),
        "policy": policy,
        "fallbackStrategy": fallback,
        "confidenceBreakdown": {
            "candidate": round(candidate_score, 2),
            "export": round(export_norm, 2),
            "detector": detector_conf,
            "anchor": round(anchor_norm, 2),
            "regionHint": round(region_norm, 2),
            "panelHint": round(panel_norm, 2),
            "panelGeometry": round(geometry_norm, 2),
            "panelBoundary": round(boundary_norm, 2),
            "panelSeparator": round(separator_norm, 2),
            "separatorGeometry": round(separator_geometry_norm, 2),
            "tableStructure": round(table_norm, 2),
            "semanticTable": round(semantic_norm, 2),
            "semanticRoleLabeling": round(role_label_norm, 2),
            "semanticRoleCalibration": round(role_calibration_norm, 2),
            "cropMode": crop_mode,
        },
    }
    return meta, status == "bound" and export is not None


def find_best_export(candidate: dict[str, Any], exports: list[dict[str, Any]]) -> tuple[dict[str, Any] | None, float]:
    ranked = sorted(exports, key=lambda export: score_export(candidate, export), reverse=True)
    if not ranked:
        return None, 0.0
    best = ranked[0]
    return best, score_export(candidate, best)


def build_candidate_pool(visuals: dict[str, Any]) -> list[dict[str, Any]]:
    return list(visuals.get("scored_candidates") or visuals.get("selected_main") or visuals.get("candidates") or [])


def match_candidate(slide: dict[str, Any], pool: list[dict[str, Any]]) -> tuple[dict[str, Any] | None, float]:
    binding = slide.get("visualBinding") or {}
    label = normalize(binding.get("label", ""))
    page = binding.get("pageNumber")
    best, best_score = None, -1.0
    for candidate in pool:
        score = 0.0
        if label and normalize(candidate.get("label", "")) == label:
            score += 3.0
        if page and candidate.get("page_number") == page:
            score += 1.8
        if binding.get("storyRole") and candidate.get("story_role") == binding.get("storyRole"):
            score += 1.0
        if binding.get("recommendedDeck") and candidate.get("recommended_deck") == binding.get("recommendedDeck"):
            score += 0.6
        figure_label = normalize(slide.get("figureLabel", ""))
        cand_caption = normalize(candidate.get("caption_excerpt", ""))
        if figure_label and cand_caption and cand_caption[:50] in figure_label:
            score += 0.8
        if score > best_score:
            best, best_score = candidate, score
    return (best, best_score) if best_score >= 2.0 else (None, best_score)


def bind(slide_payload: dict[str, Any], visuals: dict[str, Any], exports_manifest: dict[str, Any]) -> dict[str, Any]:
    pool = build_candidate_pool(visuals)
    exports = exports_manifest.get("exports", [])
    out = dict(slide_payload)
    bound_slides = []
    for slide in slide_payload.get("slideData", []):
        updated = dict(slide)
        candidate, candidate_match = match_candidate(updated, pool)
        candidate_score = float((candidate or {}).get("score") or max(0.0, candidate_match / 5))
        export, export_score = find_best_export(candidate, exports) if candidate else (None, 0.0)
        status_meta, should_bind = calibrate_binding(candidate_score, export_score, export, candidate)
        updated["visualBindingStatus"] = status_meta
        if should_bind and export and candidate:
            updated["visual"] = {
                "src": export.get("output_path"),
                "alt": candidate.get("caption_excerpt") or updated.get("figureLabel") or updated.get("title"),
                "caption": candidate.get("caption_excerpt", ""),
                "pageNumber": candidate.get("page_number"),
                "storyRole": candidate.get("story_role"),
                "score": candidate.get("score"),
                "cropMode": export.get("crop_mode"),
                "confidence": status_meta["confidence"],
                "panelCount": export.get("panel_count") or candidate.get("panel_count") or 0,
                "panels": export.get("panel_exports") or [],
                "panelGeometry": export.get("panel_geometry") or candidate.get("panel_geometry") or {},
                "panelBoundaries": export.get("panel_boundaries") or candidate.get("panel_boundaries") or [],
                "panelSeparators": export.get("panel_separators") or candidate.get("panel_separators") or [],
                "separatorGeometry": export.get("separator_geometry") or candidate.get("separator_geometry") or {},
                "tableStructure": export.get("table_structure") or {},
                "semanticTable": export.get("semantic_table") or {},
            }
            updated["figureLabel"] = candidate.get("caption_excerpt") or updated.get("figureLabel")
        bound_slides.append(updated)
    out["slideData"] = bound_slides
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description="Bind exported visual assets to slideData")
    parser.add_argument("--slide-data", type=Path, required=True)
    parser.add_argument("--visuals", type=Path, required=True)
    parser.add_argument("--exports", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    payload = bind(load_json(args.slide_data), load_json(args.visuals), load_json(args.exports))
    rendered = json.dumps(payload, indent=2, ensure_ascii=False)
    args.output.write_text(rendered, encoding="utf-8")
    print(rendered)


if __name__ == "__main__":
    main()

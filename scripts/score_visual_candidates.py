#!/usr/bin/env python3
"""Score figure and table candidates for main-deck or appendix use.

This script adds lightweight ranking metadata so slide planning can prefer
visuals with stronger narrative value and venue-aware evidence priorities.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

METHOD_HINTS = {"overview", "framework", "pipeline", "architecture", "method", "model", "system"}
RESULT_HINTS = {"result", "results", "benchmark", "comparison", "main", "quantitative", "sota"}
ABLATION_HINTS = {"ablation", "component", "effect", "without", "remove", "study"}
QUAL_HINTS = {"qualitative", "visualization", "example", "examples", "case", "error", "failure"}
APPENDIX_HINTS = {"implementation", "hyperparameter", "training details", "sensitivity", "additional"}
STOPWORDS = {"the", "and", "for", "with", "from", "that", "this", "into", "using", "shown", "show", "our", "we"}
VENUE_POLICIES = {
    "iclr": {
        "main_threshold": 0.64,
        "appendix_threshold": 0.42,
        "role_bonus": {"method": 0.08, "results": 0.02, "ablation": 0.05, "qualitative": 0.01},
        "insertion_thresholds": {"qualitative": 0.78, "ablation": 0.74, "results": 0.72},
        "appendix_policy": {"max_visual_slides": 2, "role_order": ["method", "ablation", "results", "qualitative"], "role_thresholds": {"method": 0.46, "ablation": 0.46, "results": 0.5, "qualitative": 0.48}},
    },
    "neurips": {
        "main_threshold": 0.68,
        "appendix_threshold": 0.46,
        "role_bonus": {"method": 0.04, "results": 0.08, "ablation": 0.07, "qualitative": 0.0},
        "insertion_thresholds": {"qualitative": 0.82, "ablation": 0.72, "results": 0.70},
        "appendix_policy": {"max_visual_slides": 2, "role_order": ["results", "ablation", "method", "qualitative"], "role_thresholds": {"results": 0.48, "ablation": 0.46, "method": 0.45, "qualitative": 0.5}},
    },
    "acl": {
        "main_threshold": 0.63,
        "appendix_threshold": 0.4,
        "role_bonus": {"method": 0.02, "results": 0.05, "ablation": 0.03, "qualitative": 0.08},
        "insertion_thresholds": {"qualitative": 0.7, "ablation": 0.78, "results": 0.72},
        "appendix_policy": {"max_visual_slides": 2, "role_order": ["qualitative", "results", "ablation", "method"], "role_thresholds": {"qualitative": 0.43, "results": 0.46, "ablation": 0.45, "method": 0.42}},
    },
    "emnlp": {
        "main_threshold": 0.63,
        "appendix_threshold": 0.4,
        "role_bonus": {"method": 0.02, "results": 0.05, "ablation": 0.03, "qualitative": 0.08},
        "insertion_thresholds": {"qualitative": 0.7, "ablation": 0.78, "results": 0.72},
        "appendix_policy": {"max_visual_slides": 2, "role_order": ["qualitative", "results", "ablation", "method"], "role_thresholds": {"qualitative": 0.43, "results": 0.46, "ablation": 0.45, "method": 0.42}},
    },
    "naacl": {
        "main_threshold": 0.63,
        "appendix_threshold": 0.4,
        "role_bonus": {"method": 0.02, "results": 0.05, "ablation": 0.03, "qualitative": 0.08},
        "insertion_thresholds": {"qualitative": 0.7, "ablation": 0.78, "results": 0.72},
        "appendix_policy": {"max_visual_slides": 2, "role_order": ["qualitative", "results", "ablation", "method"], "role_thresholds": {"qualitative": 0.43, "results": 0.46, "ablation": 0.45, "method": 0.42}},
    },
    "cvpr": {
        "main_threshold": 0.62,
        "appendix_threshold": 0.4,
        "role_bonus": {"method": 0.01, "results": 0.05, "ablation": 0.02, "qualitative": 0.1},
        "insertion_thresholds": {"qualitative": 0.68, "ablation": 0.8, "results": 0.72},
        "appendix_policy": {"max_visual_slides": 3, "role_order": ["qualitative", "results", "ablation", "method"], "role_thresholds": {"qualitative": 0.44, "results": 0.46, "ablation": 0.44, "method": 0.42}},
    },
    "iccv": {
        "main_threshold": 0.62,
        "appendix_threshold": 0.4,
        "role_bonus": {"method": 0.01, "results": 0.05, "ablation": 0.02, "qualitative": 0.1},
        "insertion_thresholds": {"qualitative": 0.68, "ablation": 0.8, "results": 0.72},
        "appendix_policy": {"max_visual_slides": 3, "role_order": ["qualitative", "results", "ablation", "method"], "role_thresholds": {"qualitative": 0.44, "results": 0.46, "ablation": 0.44, "method": 0.42}},
    },
    "eccv": {
        "main_threshold": 0.62,
        "appendix_threshold": 0.4,
        "role_bonus": {"method": 0.01, "results": 0.05, "ablation": 0.02, "qualitative": 0.1},
        "insertion_thresholds": {"qualitative": 0.68, "ablation": 0.8, "results": 0.72},
        "appendix_policy": {"max_visual_slides": 3, "role_order": ["qualitative", "results", "ablation", "method"], "role_thresholds": {"qualitative": 0.44, "results": 0.46, "ablation": 0.44, "method": 0.42}},
    },
}
DEFAULT_POLICY = VENUE_POLICIES["iclr"]


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def tokens(text: str) -> set[str]:
    words = re.findall(r"[A-Za-z][A-Za-z0-9-]+", text.lower())
    return {w for w in words if len(w) > 2 and w not in STOPWORDS}


def overlap_score(caption: str, evidence_terms: set[str]) -> float:
    caption_terms = tokens(caption)
    if not caption_terms or not evidence_terms:
        return 0.0
    overlap = len(caption_terms & evidence_terms)
    return min(1.0, overlap / max(3, min(len(caption_terms), 8)))


def classify_story_role(caption: str, kind: str) -> tuple[str, float]:
    lowered = caption.lower()
    role_scores = {
        "method": 0.18 if kind == "figure" else 0.02,
        "results": 0.16 if kind == "table" else 0.08,
        "ablation": 0.0,
        "qualitative": 0.0,
        "appendix": 0.0,
    }
    for hint in METHOD_HINTS:
        if hint in lowered:
            role_scores["method"] += 0.18
    for hint in RESULT_HINTS:
        if hint in lowered:
            role_scores["results"] += 0.18
    for hint in ABLATION_HINTS:
        if hint in lowered:
            role_scores["ablation"] += 0.2
    for hint in QUAL_HINTS:
        if hint in lowered:
            role_scores["qualitative"] += 0.16
    for hint in APPENDIX_HINTS:
        if hint in lowered:
            role_scores["appendix"] += 0.18
    role = max(role_scores, key=role_scores.get)
    return role, min(0.5, role_scores[role])


def build_evidence_terms(bundle: dict[str, Any]) -> set[str]:
    pools = []
    for key in ["problem", "motivation", "prior_gap", "core_idea", "method_summary", "method_details", "analysis_results", "limitations"]:
        pools.extend(bundle.get(key, []))
    for item in bundle.get("main_results", []):
        pools.append(item.get("sentence", ""))
    for item in bundle.get("ablations", []):
        pools.append(item)
    return tokens(" ".join(str(x) for x in pools))


def get_policy(venue: str) -> dict[str, Any]:
    venue_key = (venue or "iclr").lower()
    return VENUE_POLICIES.get(venue_key, DEFAULT_POLICY)


def score_candidate(candidate: dict[str, Any], evidence_terms: set[str], venue: str) -> dict[str, Any]:
    caption = str(candidate.get("caption_excerpt", ""))
    kind = str(candidate.get("type", "figure"))
    role, role_score = classify_story_role(caption, kind)
    overlap = overlap_score(caption, evidence_terms)
    density_penalty = 0.08 if len(caption.split()) > 26 else 0.0
    appendix_penalty = 0.18 if role == "appendix" else 0.0
    type_bonus = 0.08 if kind == "figure" and role == "method" else 0.06 if kind == "table" and role in {"results", "ablation"} else 0.0
    policy = get_policy(venue)
    venue_bonus = float((policy.get("role_bonus") or {}).get(role, 0.0))
    score = max(0.0, min(1.0, 0.28 + role_score + overlap * 0.34 + type_bonus + venue_bonus - density_penalty - appendix_penalty))
    main_threshold = float(policy.get("main_threshold", 0.64))
    appendix_threshold = float(policy.get("appendix_threshold", 0.42))
    recommended = "main" if score >= main_threshold and role != "appendix" else "appendix" if score >= appendix_threshold else "skip"
    why = f"role={role}, overlap={overlap:.2f}, kind={kind}, venue={venue}, density_penalty={density_penalty:.2f}"
    enriched = dict(candidate)
    enriched.update({
        "story_role": role,
        "score": round(score, 4),
        "recommended_deck": recommended,
        "why": why,
        "venue_policy": {
            "venue": venue,
            "main_threshold": main_threshold,
            "appendix_threshold": appendix_threshold,
            "insertion_thresholds": policy.get("insertion_thresholds", {}),
            "appendix_policy": policy.get("appendix_policy", {}),
        },
    })
    return enriched


def main() -> None:
    parser = argparse.ArgumentParser(description="Score figure and table candidates for slideshow use")
    parser.add_argument("--visuals", type=Path, required=True, help="JSON from find_visual_evidence.py")
    parser.add_argument("--evidence", type=Path, required=True, help="JSON from extract_paper_evidence.py")
    parser.add_argument("--venue", default="iclr", help="Venue preset such as iclr, neurips, acl, cvpr")
    parser.add_argument("--output", type=Path, help="Optional output JSON path")
    args = parser.parse_args()

    visuals = load_json(args.visuals)
    evidence = load_json(args.evidence)
    evidence_terms = build_evidence_terms(evidence)
    candidates = visuals.get("candidates", [])
    scored = [score_candidate(candidate, evidence_terms, args.venue) for candidate in candidates]
    scored.sort(key=lambda item: (item.get("recommended_deck") != "main", -(item.get("score") or 0.0), item.get("page_number", 0)))
    payload = {
        "source_path": visuals.get("source_path", ""),
        "page_count": visuals.get("page_count", 0),
        "venue": args.venue,
        "venue_policy": get_policy(args.venue),
        "scored_candidates": scored,
        "selected_main": [item for item in scored if item.get("recommended_deck") == "main"],
        "selected_appendix": [item for item in scored if item.get("recommended_deck") == "appendix"],
        "notes": [
            "Use the top-ranked main visuals first when planning the core deck.",
            "Appendix recommendations are useful for speaker notes or backup slides.",
        ],
    }
    rendered = json.dumps(payload, indent=2, ensure_ascii=False)
    if args.output:
        args.output.write_text(rendered, encoding="utf-8")
    print(rendered)


if __name__ == "__main__":
    main()

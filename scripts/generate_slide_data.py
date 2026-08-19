#!/usr/bin/env python3
"""Generate a first-pass slideData plan from an evidence bundle.

This script turns a paper evidence bundle into a structured presentation plan.
The output is still heuristic and should be revised before final rendering.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

DEFAULT_THEME = "zinc-editorial"
DEFAULT_VENUE = "iclr"
ROLE_LABELS = {
    "title": "Opening",
    "hook": "Hook",
    "problem": "Problem",
    "gap": "Gap",
    "contribution": "Core idea",
    "method-overview": "Method",
    "method-detail": "Mechanism",
    "objective": "Objective",
    "setup": "Setup",
    "main-result": "Result",
    "secondary-result": "Deep dive",
    "ablation": "Ablation",
    "analysis": "Analysis",
    "qualitative": "Qualitative",
    "limitation": "Limitations",
    "future-work": "Future work",
    "takeaway": "Takeaway",
    "appendix": "Appendix",
}
ROLE_AUDIENCE_GOALS = {
    "title": "Know the paper identity and the single sentence to listen for.",
    "hook": "Hear the central claim before the deck expands into evidence.",
    "problem": "Care about the problem before technical detail starts.",
    "gap": "Understand why prior work is not enough.",
    "contribution": "See the conceptual leap in one pass.",
    "method-overview": "Retain the method flow well enough to follow later evidence.",
    "method-detail": "Understand the one mechanism that most strongly explains the gain.",
    "objective": "Know what the method is optimizing and why that matters.",
    "setup": "Know what was evaluated, with which metrics and baselines.",
    "main-result": "Leave with the strongest evidence supporting the main claim.",
    "secondary-result": "See that the headline gain holds under a second, supporting view.",
    "ablation": "Understand which design choice is doing real work.",
    "analysis": "Understand why the proposed design matters mechanistically.",
    "qualitative": "See a concrete example that makes the improvement intuitive.",
    "limitation": "Know the scope boundary and what remains unresolved.",
    "future-work": "See the most plausible next question opened by the paper.",
    "takeaway": "Remember the contribution and its honest scope after the talk ends.",
    "appendix": "Answer likely follow-up questions without crowding the main arc.",
}
ROLE_DENSITY_BUDGETS = {
    "title": 28,
    "hook": 24,
    "problem": 46,
    "gap": 44,
    "contribution": 40,
    "method-overview": 34,
    "method-detail": 40,
    "objective": 42,
    "setup": 48,
    "main-result": 34,
    "secondary-result": 36,
    "ablation": 38,
    "analysis": 42,
    "qualitative": 30,
    "limitation": 42,
    "future-work": 40,
    "takeaway": 30,
    "appendix": 48,
}

def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))

def token_set(text: str) -> set[str]:
    return {w for w in __import__("re").findall(r"[A-Za-z][A-Za-z0-9-]+", str(text).lower()) if len(w) > 2}

def caption_similarity(a: str, b: str) -> float:
    ta, tb = token_set(a), token_set(b)
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / max(1, len(ta | tb))

def visual_label(record: dict[str, Any]) -> str:
    return str(record.get("label") or "").strip()

def visual_page(record: dict[str, Any]) -> Any:
    return record.get("page_number", record.get("pageNumber"))

def visual_role(record: dict[str, Any]) -> str:
    return str(record.get("story_role", record.get("storyRole")) or "").strip()

def visual_caption(record: dict[str, Any]) -> str:
    return str(record.get("caption_excerpt", record.get("caption")) or "").strip()

def is_redundant(candidate: dict[str, Any], used: list[dict[str, Any]], role: str | None = None) -> bool:
    for prior in used:
        if visual_label(candidate) and visual_label(candidate) == visual_label(prior):
            return True
        if visual_page(candidate) and visual_page(candidate) == visual_page(prior) and visual_role(candidate) == visual_role(prior):
            return True
        if role and visual_role(prior) == role and caption_similarity(visual_caption(candidate), visual_caption(prior)) >= 0.55:
            return True
    return False

def apply_appendix_policy(candidates: list[dict[str, Any]], venue_policy: dict[str, Any], used: list[dict[str, Any]]) -> list[dict[str, Any]]:
    appendix_policy = dict(venue_policy.get("appendix_policy") or {})
    max_visuals = int(appendix_policy.get("max_visual_slides", 2))
    role_order = list(appendix_policy.get("role_order") or ["method", "ablation", "results", "qualitative"])
    role_thresholds = dict(appendix_policy.get("role_thresholds") or {})
    selected: list[dict[str, Any]] = []
    for role in role_order:
        threshold = float(role_thresholds.get(role, venue_policy.get("appendix_threshold", 0.42)))
        role_pool = [c for c in candidates if c.get("recommended_deck") == "appendix" and c.get("story_role") == role and float(c.get("score") or 0.0) >= threshold]
        role_pool.sort(key=lambda item: (-(item.get("score") or 0.0), item.get("page_number", 0)))
        for cand in role_pool:
            if len(selected) >= max_visuals:
                return selected
            if is_redundant(cand, used + selected, role=role):
                continue
            selected.append(cand)
            break
    return selected

def trim_sentence(text: str, limit: int = 180) -> str:
    text = " ".join(str(text).split()).strip()
    if len(text) <= limit:
        return text
    shortened = text[: limit - 1].rsplit(" ", 1)[0].rstrip(" ,;:-")
    return shortened + "…"

def title_case_fallback(name: str) -> str:
    if not name:
        return "Paper presentation"
    return trim_sentence(name, 120)

def dedupe(items: list[str]) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for item in items:
        key = item.strip()
        if not key or key in seen:
            continue
        seen.add(key)
        out.append(key)
    return out

def bullets_from(*groups: list[str], limit: int = 4) -> list[str]:
    flat: list[str] = []
    for group in groups:
        flat.extend(group)
    return [trim_sentence(x, 140) for x in dedupe(flat)[:limit]]

def first_or(items: list[str], fallback: str) -> str:
    return trim_sentence(items[0], 180) if items else fallback

def get_visual_candidates(payload: dict[str, Any] | None) -> list[dict[str, Any]]:
    if not payload:
        return []
    if payload.get("selected_main"):
        return list(payload.get("selected_main", []))
    if payload.get("scored_candidates"):
        return list(payload.get("scored_candidates", []))
    return list(payload.get("candidates", []))

def get_venue_policy(payload: dict[str, Any] | None, venue: str) -> dict[str, Any]:
    if payload and payload.get("venue_policy"):
        return dict(payload.get("venue_policy") or {})
    defaults = {
        "iclr": {"qualitative": 0.78, "ablation": 0.74, "results": 0.72},
        "neurips": {"qualitative": 0.82, "ablation": 0.72, "results": 0.70},
        "acl": {"qualitative": 0.70, "ablation": 0.78, "results": 0.72},
        "emnlp": {"qualitative": 0.70, "ablation": 0.78, "results": 0.72},
        "naacl": {"qualitative": 0.70, "ablation": 0.78, "results": 0.72},
        "cvpr": {"qualitative": 0.68, "ablation": 0.80, "results": 0.72},
        "iccv": {"qualitative": 0.68, "ablation": 0.80, "results": 0.72},
        "eccv": {"qualitative": 0.68, "ablation": 0.80, "results": 0.72},
    }
    return {"venue": venue, "insertion_thresholds": defaults.get(venue.lower(), defaults["iclr"])}

def select_candidate(candidates: list[dict[str, Any]], preferred_type: str | None = None, preferred_role: str | None = None, min_score: float = 0.0) -> dict[str, Any] | None:
    filtered = list(candidates)
    if preferred_type:
        typed = [c for c in filtered if c.get("type") == preferred_type]
        if typed:
            filtered = typed
    if preferred_role:
        role_filtered = [c for c in filtered if c.get("story_role") == preferred_role]
        if role_filtered:
            filtered = role_filtered
    if min_score > 0:
        filtered = [c for c in filtered if float(c.get("score") or 0.0) >= min_score]
    if not filtered:
        return None
    filtered.sort(key=lambda item: (item.get("recommended_deck") != "main", -(item.get("score") or 0.0), item.get("page_number", 0)))
    return filtered[0]

def select_distinct_candidate(
    candidates: list[dict[str, Any]],
    used: list[dict[str, Any]],
    preferred_type: str | None = None,
    preferred_role: str | None = None,
    min_score: float = 0.0,
) -> dict[str, Any] | None:
    filtered = list(candidates)
    if preferred_type:
        typed = [c for c in filtered if c.get("type") == preferred_type]
        if typed:
            filtered = typed
    if preferred_role:
        role_filtered = [c for c in filtered if c.get("story_role") == preferred_role]
        if role_filtered:
            filtered = role_filtered
    if min_score > 0:
        filtered = [c for c in filtered if float(c.get("score") or 0.0) >= min_score]
    filtered.sort(key=lambda item: (item.get("recommended_deck") != "main", -(item.get("score") or 0.0), item.get("page_number", 0)))
    for candidate in filtered:
        if not is_redundant(candidate, used, role=preferred_role):
            return candidate
    return None

def choose_visual(candidates: list[dict[str, Any]], preferred_type: str | None = None, preferred_role: str | None = None, min_score: float = 0.0) -> str | None:
    item = select_candidate(candidates, preferred_type, preferred_role, min_score=min_score)
    if not item:
        return None
    label = item.get("label") or item.get("type") or "visual"
    page = item.get("page_number")
    caption = trim_sentence(item.get("caption_excerpt", ""), 90)
    score = item.get("score")
    suffix = f" [score {score:.2f}]" if isinstance(score, (int, float)) else ""
    return f"{label} on page {page}: {caption}{suffix}" if page else f"{label}: {caption}{suffix}"

def build_metric_cards(bundle: dict[str, Any], limit: int = 3, offset: int = 0) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    setup = bundle.get("experimental_setup", {})
    dataset_hint = first_or(setup.get("datasets", []), "Relevant benchmark")
    for item in bundle.get("main_results", [])[offset: offset + limit]:
        metric = item.get("metric_hint") or "metric"
        numbers = item.get("numbers", [])
        value = numbers[0] if numbers else "reported"
        detail = trim_sentence(item.get("sentence", dataset_hint), 90)
        out.append(
            {
                "label": metric.upper() if metric else "RESULT",
                "value": value,
                "detail": detail,
            }
        )
    if not out:
        out.append({
            "label": "RESULT",
            "value": "Reported",
            "detail": dataset_hint,
        })
    return out

def speaker_note(key_message: str, evidence: str) -> str:
    return trim_sentence(f"Say the key point first, then tie it directly to: {evidence}", 220)

def matching_sentences(sentences: list[str], hints: list[str], limit: int = 4) -> list[str]:
    out: list[str] = []
    for sentence in dedupe(sentences):
        lowered = sentence.lower()
        if any(hint in lowered for hint in hints):
            out.append(sentence)
        if len(out) >= limit:
            break
    return out

def infer_equation_text(sentences: list[str]) -> str | None:
    for sentence in sentences:
        if any(token in sentence for token in ["=", "\\", "$", "argmin", "argmax", "L(", "J("]):
            text = trim_sentence(sentence, 180)
            if not text.startswith("$"):
                return f"$${text}$$"
            return text
    return None

def infer_future_work(limitations: list[str], core_idea: list[str], analysis: list[str]) -> tuple[str, list[str]]:
    future_hints = ["future", "next", "extend", "broader", "remain", "still", "generaliz", "robust", "scal"]
    future_sentences = matching_sentences(limitations, future_hints, limit=4)
    key_message = first_or(
        future_sentences,
        "The next step is to validate the core idea under broader settings and stronger stress tests.",
    )
    bullets = bullets_from(future_sentences[1:], analysis[:2], core_idea[1:2], limit=4)
    if bullets:
        return key_message, bullets
    return key_message, [
        "Test the idea on broader datasets and stronger baselines.",
        "Stress-test robustness to the failure cases already acknowledged.",
        "Check whether the gain persists when scaling assumptions change.",
    ]

def make_visual_binding(candidate: dict[str, Any]) -> dict[str, Any]:
    return {
        "label": candidate.get("label"),
        "pageNumber": candidate.get("page_number"),
        "caption": candidate.get("caption_excerpt"),
        "storyRole": candidate.get("story_role"),
        "recommendedDeck": candidate.get("recommended_deck"),
        "score": candidate.get("score"),
        "detector": candidate.get("detector"),
        "anchorStrength": candidate.get("anchor_strength"),
        "regionHint": candidate.get("region_hint"),
        "panelCount": candidate.get("panel_count"),
        "panelLabels": candidate.get("panel_labels"),
        "panelPatternStrength": candidate.get("panel_pattern_strength"),
        "panelGeometry": candidate.get("panel_geometry"),
        "panelBoundaryStrength": candidate.get("panel_boundary_strength"),
        "panelBoundaries": candidate.get("panel_boundaries"),
        "panelSeparators": candidate.get("panel_separators"),
        "panelSeparatorStrength": candidate.get("panel_separator_strength"),
        "separatorGeometry": candidate.get("separator_geometry"),
        "venuePolicy": candidate.get("venue_policy"),
    }

def make_editorial_blocks(
    *,
    page_role: str,
    title: str,
    key_message: str,
    bullets: list[str] | None = None,
    callout: str | None = None,
    style: str = "default",
) -> list[dict[str, Any]]:
    blocks: list[dict[str, Any]] = [
        {"type": "label", "content": ROLE_LABELS.get(page_role, "Section"), "style": style},
        {"type": "heading", "content": title},
        {"type": "text", "content": key_message},
    ]
    if bullets:
        blocks.append({"type": "bullets", "content": bullets[:4]})
    if callout:
        blocks.append({"type": "callout", "content": callout, "style": style})
    return blocks

def visual_binding_dict(slide: dict[str, Any]) -> dict[str, Any] | None:
    binding = slide.get("visualBinding")
    return binding if isinstance(binding, dict) else None

def infer_evidence_type(slide: dict[str, Any]) -> str | None:
    if slide.get("metrics"):
        return "metric-cards"
    if slide.get("equation"):
        return "equation"
    if slide.get("layout") in {"result-table", "result-table-focus"}:
        return "table"
    if slide.get("layout") == "qualitative-evidence":
        return "qualitative"
    if slide.get("contentBlocks"):
        for block in slide.get("contentBlocks", []):
            if block.get("type") == "metric-grid":
                return "metric-cards"
            if block.get("type") == "equation":
                return "equation"
            if block.get("type") == "table":
                return "table"
            if block.get("type") == "figure":
                return "figure"
    if slide.get("visualBinding") or slide.get("figureLabel"):
        if slide.get("pageRole") in {"qualitative"}:
            return "qualitative"
        return "figure"
    return None

def annotate_slide_metadata(slides: list[dict[str, Any]]) -> list[dict[str, Any]]:
    total = len(slides)
    for index, slide in enumerate(slides, start=1):
        page_role = slide.get("pageRole") or ("appendix" if slide.get("appendix") else "analysis")
        evidence_type = infer_evidence_type(slide)
        binding = visual_binding_dict(slide)
        has_visual = bool(binding or slide.get("figureLabel"))
        slide.setdefault("claim", slide.get("keyMessage"))
        slide.setdefault("audienceGoal", ROLE_AUDIENCE_GOALS.get(page_role, "Understand the point of this slide in one pass."))
        slide.setdefault("densityBudget", ROLE_DENSITY_BUDGETS.get(page_role, 42))
        slide.setdefault("appendixCandidate", bool(slide.get("appendix")))
        slide.setdefault("fidelityRisk", "low" if binding else ("medium" if has_visual else "low"))
        slide.setdefault(
            "whyNow",
            f"Slide {index} of {total}: this role follows the talk arc after "
            f"{slides[index-2].get('pageRole', 'the previous point') if index > 1 else 'the opening'}."
        )
        slide.setdefault(
            "whyThisVisual",
            (
                f"Chosen because {binding.get('caption') or binding.get('label')} best supports the {page_role} claim."
                if binding else (
                    "No paper visual is required here; the slide is carried by the verbal claim."
                    if not has_visual else "Keep the bound visual large enough that it stays evidence-first."
                )
            ),
        )
        if evidence_type:
            slide.setdefault("evidenceType", evidence_type)
        if binding and (binding.get("caption") or binding.get("label")):
            slide.setdefault("evidenceSource", binding.get("caption") or binding.get("label"))
            slide.setdefault("visualFallbackStrategy", "crop")
        slide.setdefault("mustIncludeVisual", bool(has_visual and page_role in {"problem", "contribution", "method-overview", "main-result", "secondary-result", "ablation", "qualitative"}))
    return slides

def add_progressive_builds(slides: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Add sparse, comprehension-led builds without hiding headline evidence."""
    for slide in slides:
        if slide.get("revealOrder") or slide.get("pageRole") not in {"method-overview", "method-detail"}:
            continue
        targets: list[str] = []
        blocks = slide.get("contentBlocks")
        if isinstance(blocks, list):
            targets = [
                f"contentBlocks.{index}"
                for index, block in enumerate(blocks)
                if isinstance(block, dict) and block.get("type") in {"bullets", "callout"}
            ]
        elif isinstance(slide.get("bullets"), list):
            targets = [f"bullets.{index}" for index, _ in enumerate(slide["bullets"])]
        if len(targets) >= 2:
            slide["revealOrder"] = targets
    return slides

def maybe_insert_evidence_slides(slides: list[dict[str, Any]], candidates: list[dict[str, Any]], venue_policy: dict[str, Any]) -> list[dict[str, Any]]:
    thresholds = dict(venue_policy.get("insertion_thresholds") or {})
    picks = [
        ("qualitative", "figure", float(thresholds.get("qualitative", 0.78)), "Qualitative evidence of the gain", "Use one qualitative slide when the venue rewards example-driven evidence.", "Keep this slide only when the examples add a different kind of evidence than the benchmark table.", "secondary-result"),
        ("ablation", None, float(thresholds.get("ablation", 0.74)), "One ablation that explains the mechanism", "Add a single ablation slide when the evidence cleanly validates the key design choice.", "Prefer one clean ablation over many small variants.", "analysis"),
    ]
    used = [slide.get("visualBinding") for slide in slides if slide.get("visualBinding")]
    used = [u for u in used if u]
    insertions_by_anchor: dict[str, list[dict[str, Any]]] = {}
    for role, preferred_type, min_score, title, purpose, evidence_note, anchor_role in picks:
        candidate = select_distinct_candidate(
            candidates,
            used + [x.get("visualBinding") for group in insertions_by_anchor.values() for x in group if x.get("visualBinding")],
            preferred_type=preferred_type,
            preferred_role=role,
            min_score=min_score,
        )
        if not candidate:
            continue
        layout = "qualitative-evidence" if role == "qualitative" else ("ablation" if role == "ablation" and candidate.get("type") == "figure" else "result-table-focus")
        note = "Point to the qualitative pattern, not every subpanel." if role == "qualitative" else ("Use one ablation to connect the design choice back to the core claim." if role == "ablation" else "A clean extra comparison helps anchor the benchmark story.")
        insertions_by_anchor.setdefault(anchor_role, []).append({
            "layout": layout,
            "title": title,
            "purpose": purpose,
            "pageRole": "qualitative" if role == "qualitative" else "ablation",
            "keyMessage": trim_sentence(candidate.get("caption_excerpt", f"{role.title()} evidence supports the claim."), 160),
            "speakerNote": speaker_note(note, candidate.get("caption_excerpt", f"{role} visual")),
            "figureLabel": candidate.get("caption_excerpt") or f"Insert {role} evidence",
            "evidenceNote": evidence_note,
            "visualBinding": make_visual_binding(candidate),
            "insertionPolicy": {"role": role, "minScore": min_score, "redundancySuppressed": False},
        })
        used.append(make_visual_binding(candidate))
    if not insertions_by_anchor:
        return slides
    out: list[dict[str, Any]] = []
    for slide in slides:
        out.append(dict(slide))
        for item in insertions_by_anchor.get(str(slide.get("pageRole")), []):
            out.append(dict(item))
    for idx, slide in enumerate(out, start=1):
        slide["id"] = idx
    return out

def build_slide_data(bundle: dict[str, Any], visuals: dict[str, Any] | None, venue: str, theme: str, include_appendix: bool) -> dict[str, Any]:
    candidates = get_visual_candidates(visuals)
    venue_policy = get_venue_policy(visuals, venue)
    identity = bundle.get("identity", {})
    title = title_case_fallback(identity.get("title", ""))
    authors = identity.get("authors", []) or []
    subtitle_parts = []
    if authors:
        subtitle_parts.append(", ".join(authors[:4]))
    if venue:
        subtitle_parts.append(venue.upper())
    subtitle = " • ".join(subtitle_parts) or None

    problem = bundle.get("problem", [])
    motivation = bundle.get("motivation", [])
    prior_gap = bundle.get("prior_gap", [])
    core_idea = bundle.get("core_idea", [])
    method_summary = bundle.get("method_summary", [])
    method_details = bundle.get("method_details", [])
    setup = bundle.get("experimental_setup", {})
    datasets = setup.get("datasets", [])
    metrics = setup.get("metrics", [])
    baselines = setup.get("baselines", [])
    analysis = bundle.get("analysis_results", [])
    ablations = bundle.get("ablations", [])
    limitations = bundle.get("limitations", [])
    result_sentences = [x.get("sentence", "") for x in bundle.get("main_results", []) if x.get("sentence")]
    method_candidate = select_candidate(candidates, "figure", "method") or select_candidate(candidates, "figure")
    result_candidate = select_candidate(candidates, "table", "results") or select_candidate(candidates, "table")
    secondary_result_candidate = select_distinct_candidate(
        candidates,
        [make_visual_binding(result_candidate)] if result_candidate else [],
        preferred_type="table",
        preferred_role="results",
    )
    objective_sentences = matching_sentences(
        method_summary + method_details,
        ["objective", "loss", "training", "optimiz", "regulariz", "inference", "decode"],
        limit=4,
    )
    method_focus = dedupe(method_details or method_summary or core_idea)
    mechanism_points = method_focus[:6]
    future_work_message, future_work_bullets = infer_future_work(limitations, core_idea, analysis)

    slides: list[dict[str, Any]] = [
        {
            "id": 1,
            "layout": "cover",
            "pageRole": "title",
            "title": title,
            "purpose": "Open the talk with the paper identity and main claim.",
            "keyMessage": trim_sentence(bundle.get("tl_dr", "This talk explains the paper’s main idea, evidence, and limitations."), 180),
            "speakerNote": speaker_note(bundle.get("tl_dr", "Main claim"), "title, abstract, and conclusion"),
            "subtitle": subtitle,
            "evidenceNote": "Ground the opening in the paper title, abstract, and final claim.",
        },
        {
            "id": 2,
            "pageRole": "hook",
            "title": "The talk in one sentence",
            "purpose": "State the central claim before expanding into context and evidence.",
            "keyMessage": trim_sentence(
                first_or(result_sentences, bundle.get("tl_dr", "")) or "The paper claims a focused improvement backed by concrete evidence.",
                160,
            ),
            "speakerNote": speaker_note(
                trim_sentence(first_or(result_sentences, bundle.get("tl_dr", "")) or "Main claim", 140),
                "abstract plus the strongest headline result",
            ),
            "contentBlocks": [
                {"type": "label", "content": ROLE_LABELS["hook"], "style": "accent"},
                {"type": "heading", "content": "The talk in one sentence"},
                {"type": "hero-text", "content": trim_sentence(first_or(result_sentences, bundle.get("tl_dr", "")) or "A concise claim deserves a concise opening.", 120)},
                {"type": "callout", "content": trim_sentence(first_or(core_idea, "The deck will show the problem, method, evidence, and scope."), 110), "style": "positive"},
            ],
            "evidenceNote": "Open with the headline claim, not with a generic agenda.",
        },
        {
            "id": 3,
            "layout": "split",
            "pageRole": "problem",
            "title": "Why this problem matters",
            "purpose": "Establish motivation before the method.",
            "keyMessage": first_or(problem or motivation, "The paper targets an important failure mode or unmet need in the field."),
            "speakerNote": speaker_note(first_or(problem or motivation, "Why the problem matters"), "introduction and motivation sentences"),
            "bullets": bullets_from(problem, motivation, limit=4),
            "figureLabel": choose_visual(candidates, "figure", "method") or choose_visual(candidates, "figure") or "Insert motivating figure or task framing visual",
            "evidenceNote": "This slide should map to the introduction and motivating context.",
        },
        {
            "id": 4,
            "pageRole": "gap",
            "title": "What prior work still misses",
            "purpose": "Clarify the gap that motivates the new idea.",
            "keyMessage": first_or(prior_gap, "Existing methods leave an important bottleneck unresolved."),
            "speakerNote": speaker_note(first_or(prior_gap, "Prior limitation"), "introduction, related work, or problem framing"),
            "contentBlocks": make_editorial_blocks(
                page_role="gap",
                title="What prior work still misses",
                key_message=first_or(prior_gap, "Existing methods leave an important bottleneck unresolved."),
                bullets=bullets_from(prior_gap, limit=4),
                callout=trim_sentence("The gap must be explicit before the audience will care about the new method.", 110),
            ),
            "evidenceNote": "Each point should be traceable to a stated prior limitation, not a new unsupported critique.",
        },
        {
            "id": 5,
            "layout": "diagram",
            "pageRole": "contribution",
            "title": "The core idea",
            "purpose": "Surface the conceptual leap before heavy detail.",
            "keyMessage": first_or(core_idea, "The paper introduces a cleaner way to solve the core bottleneck."),
            "speakerNote": speaker_note(first_or(core_idea, "Core idea"), "abstract and method overview"),
            "bullets": bullets_from(core_idea, method_summary, limit=4),
            "figureLabel": choose_visual(candidates, "figure", "method") or choose_visual(candidates, "figure") or "Insert conceptual method diagram",
            "evidenceNote": "This should be understandable before the audience sees algorithmic detail.",
        },
        {
            "id": 6,
            "layout": "method-overview",
            "pageRole": "method-overview",
            "title": "How the method works",
            "purpose": "Explain the end-to-end pipeline at a high level.",
            "keyMessage": first_or(method_summary, "The method can be understood as a small number of key stages or modules."),
            "speakerNote": speaker_note(first_or(method_summary, "Method flow"), "method section and method figure"),
            "bullets": bullets_from(method_summary, method_details, limit=4),
            "figureLabel": method_candidate.get("caption_excerpt") if method_candidate else (choose_visual(candidates, "figure", "method") or choose_visual(candidates, "figure") or "Insert method architecture figure"),
            "visualBinding": make_visual_binding(method_candidate) if method_candidate else None,
            "evidenceNote": "Keep only the modules necessary for understanding later experiments.",
        },
        {
            "id": 7,
            "pageRole": "method-detail",
            "title": "The key mechanism",
            "purpose": "Show the one moving part that the audience must understand before the evidence slides.",
            "keyMessage": first_or(mechanism_points, "One mechanism carries most of the claimed gain."),
            "speakerNote": speaker_note(first_or(mechanism_points, "Key mechanism"), "method subsection that best explains the gain"),
            "contentBlocks": make_editorial_blocks(
                page_role="method-detail",
                title="The key mechanism",
                key_message=first_or(mechanism_points, "One mechanism carries most of the claimed gain."),
                bullets=bullets_from(mechanism_points[1:], limit=4),
                callout=trim_sentence("Keep only the sub-step that the audience needs to remember when the result slide appears.", 110),
            ),
            "evidenceNote": "Prefer one mechanism-bearing detail over a procedural laundry list.",
        },
        {
            "id": 8,
            "layout": "objective",
            "pageRole": "objective",
            "title": "What the training signal optimizes",
            "purpose": "Explain the objective, training signal, or procedure that anchors the method behavior.",
            "keyMessage": first_or(objective_sentences, "The training signal is designed to reinforce the behavior claimed by the method."),
            "speakerNote": speaker_note(first_or(objective_sentences, "Objective or training procedure"), "objective, loss, or training description from the method section"),
            "equation": infer_equation_text(objective_sentences),
            "bullets": bullets_from(objective_sentences[1:], method_details[4:], limit=3),
            "evidenceNote": "If the paper does not present an explicit equation, explain the optimization target in plain language.",
        },
        {
            "id": 9,
            "pageRole": "setup",
            "title": "Experimental setup",
            "purpose": "Tell the audience what was evaluated and against what.",
            "keyMessage": first_or(datasets or metrics or baselines, "The paper evaluates the method on standard datasets against strong baselines."),
            "speakerNote": speaker_note(first_or(datasets or metrics or baselines, "Evaluation setup"), "experimental setup"),
            "contentBlocks": make_editorial_blocks(
                page_role="setup",
                title="Experimental setup",
                key_message=first_or(datasets or metrics or baselines, "The paper evaluates the method on standard datasets against strong baselines."),
                bullets=bullets_from(datasets, metrics, baselines, limit=4),
                callout=trim_sentence(first_or(metrics, "Keep the benchmark, metric, and baseline explicit before showing gains."), 110),
            ),
            "evidenceNote": "State datasets, metrics, and baselines explicitly before showing gains.",
        },
        {
            "id": 10,
            "layout": "metrics",
            "pageRole": "main-result",
            "title": "The strongest result",
            "purpose": "Show the clearest quantitative evidence for the paper's main claim.",
            "keyMessage": first_or(result_sentences, "The proposed method delivers the cleanest gain on the most relevant benchmark."),
            "speakerNote": speaker_note(first_or(result_sentences, "Main result"), "result table or chart with exact metric and baseline"),
            "metrics": build_metric_cards(bundle, limit=3, offset=0),
            # ── HARD RULE: never put metrics + figure on the same slide ──
            # figureLabel and visualBinding are intentionally omitted here.
            # If a result figure exists, it gets its own dedicated slide below.
            "evidenceNote": "Each metric card should keep the benchmark and comparison target explicit.",
        },
    ]

    # ── Main-result figure: dedicated slide (only if a visual candidate exists)
    if result_candidate:
        slides.append({
            "id": len(slides) + 1,
            "layout": "split",
            "pageRole": "main-result",
            "title": "Evidence behind the strongest result",
            "purpose": "Give the primary result figure full readable space, separate from metric cards.",
            "keyMessage": first_or(result_sentences, "The figure shows the full evidence for the headline claim."),
            "speakerNote": speaker_note("Point to the key comparison in the figure.", result_candidate.get("caption_excerpt", "result visual")),
            "figureLabel": result_candidate.get("caption_excerpt"),
            "visualBinding": make_visual_binding(result_candidate),
            "evidenceNote": choose_visual(candidates, "table", "results") or choose_visual(candidates, "table") or "Dedicated figure slide — keeps figure ≥200px readable height.",
        })

    slides.append({
        "id": len(slides) + 1,
        "layout": "metrics",
        "pageRole": "secondary-result",
        "title": "The gain holds beyond one headline metric",
        "purpose": "Provide a second quantitative view that stabilizes the headline claim.",
        "keyMessage": first_or(result_sentences[1:] or analysis, "A second quantitative view shows the gain is not a one-off number."),
        "speakerNote": speaker_note(first_or(result_sentences[1:] or analysis, "Secondary result"), "the next-best benchmark table or supporting comparison"),
        "metrics": build_metric_cards(bundle, limit=3, offset=1),
        # ── HARD RULE: metrics only — figure goes to a separate slide ──
        "evidenceNote": "Use a second comparison only when it adds support rather than repeating the headline result.",
    })

    # ── Secondary-result figure: dedicated slide (only if a visual candidate exists)
    if secondary_result_candidate:
        slides.append({
            "id": len(slides) + 1,
            "layout": "split",
            "pageRole": "secondary-result",
            "title": "Supporting evidence for the secondary result",
            "purpose": "Give the secondary result figure full readable space.",
            "keyMessage": first_or(result_sentences[1:] or analysis, "A second visual view stabilizes the headline claim."),
            "speakerNote": speaker_note("Show the supporting comparison.", secondary_result_candidate.get("caption_excerpt", "secondary visual")),
            "figureLabel": secondary_result_candidate.get("caption_excerpt") or "Second benchmark table or supporting chart",
            "visualBinding": make_visual_binding(secondary_result_candidate),
            "evidenceNote": "Dedicated figure slide — split from secondary result to enforce 200px minimum.",
        })

    # ── Remaining slides: analysis, limitations, future-work, takeaway ──
    slides.extend([
        {
            "id": len(slides) + 1,
            "pageRole": "analysis",
            "title": "Why the result is credible",
            "purpose": "Use analysis or ablation evidence to support the claimed mechanism.",
            "keyMessage": first_or(ablations or analysis, "Ablations and analysis clarify why the key design choice matters."),
            "speakerNote": speaker_note(first_or(ablations or analysis, "Ablation or analysis"), "ablation table, analysis figure, or robustness result"),
            "contentBlocks": make_editorial_blocks(
                page_role="analysis",
                title="Why the result is credible",
                key_message=first_or(ablations or analysis, "Ablations and analysis clarify why the key design choice matters."),
                bullets=bullets_from(ablations, analysis, limit=4),
                callout=trim_sentence("Prefer one mechanism-validating pattern over a laundry list of extra numbers.", 110),
            ),
            "evidenceNote": "Prefer one clean ablation or one analysis pattern over many weak supporting results.",
        },
        {
            "id": len(slides) + 2,
            "layout": "limitations",
            "pageRole": "limitation",
            "title": "Limitations and open questions",
            "purpose": "State the boundaries of the current evidence honestly.",
            "keyMessage": first_or(limitations, "The paper is promising, but the evidence still leaves clear limits or unresolved questions."),
            "speakerNote": speaker_note(first_or(limitations, "Limitations"), "limitations section, conclusion, or cautious inference"),
            "bullets": bullets_from(limitations, limit=4),
            "evidenceNote": "Use explicit limitations when possible. Mark inferences carefully.",
        },
        {
            "id": len(slides) + 3,
            "pageRole": "future-work",
            "title": "What should happen next",
            "purpose": "Convert the paper's honest limits into a plausible next-step agenda.",
            "keyMessage": future_work_message,
            "speakerNote": speaker_note(future_work_message, "limitations and conclusion"),
            "contentBlocks": make_editorial_blocks(
                page_role="future-work",
                title="What should happen next",
                key_message=future_work_message,
                bullets=future_work_bullets,
                callout=trim_sentence("Future work should feel like the natural extension of the evidence, not a generic wishlist.", 110),
            ),
            "evidenceNote": "Keep future work anchored to the limitations already acknowledged by the paper.",
        },
        {
            "id": len(slides) + 4,
            "layout": "takeaway",
            "pageRole": "takeaway",
            "title": "What to remember",
            "purpose": "Close with the main contribution and the honest scope of the result.",
            "keyMessage": trim_sentence(bundle.get("tl_dr", "The paper contributes a meaningful idea supported by focused but bounded evidence."), 180),
            "speakerNote": speaker_note(trim_sentence(bundle.get("tl_dr", "Final takeaway"), 140), "the strongest claim plus the main limitation"),
            "evidenceNote": "End with the main contribution and the real scope of the evidence.",
        },
    ])

    # Re-number all slide IDs sequentially
    for idx, slide in enumerate(slides, start=1):
        slide["id"] = idx

    slides = maybe_insert_evidence_slides(slides, candidates, venue_policy)

    # ── Hard planning rule: auto-split dense result slides ──
    # If a slide has both a figure and ≥4 metrics, split into two:
    # 1) Metrics-only slide (keeps title, keyMessage, metrics)
    # 2) Dedicated figure slide (gets the visual at full size)
    # This prevents figure-squashing that the audit would otherwise reject.
    split_slides: list[dict[str, Any]] = []
    for slide in slides:
        metrics_list = slide.get("metrics", [])
        has_figure = bool(
            slide.get("visualBinding")
            or slide.get("figureLabel")
            or (slide.get("visual") and slide["visual"].get("src"))
        )
        if (
            has_figure
            and isinstance(metrics_list, list)
            and len(metrics_list) >= 4
            and slide.get("layout") in ("result-table", "result-table-focus", "metrics")
        ):
            # Slide 1: metrics only (no figure)
            metrics_slide = dict(slide)
            metrics_slide.pop("figureLabel", None)
            metrics_slide.pop("visualBinding", None)
            metrics_slide.pop("visual", None)
            metrics_slide["layout"] = "metrics"
            split_slides.append(metrics_slide)

            # Slide 2: dedicated figure slide
            figure_slide = {
                "id": slide.get("id", "?"),
                "layout": "split",
                "pageRole": slide.get("pageRole", "main-result"),
                "title": f"Evidence: {slide.get('title', 'Result figure')}",
                "purpose": "Dedicated figure slide split from dense result slide for legibility.",
                "keyMessage": slide.get("keyMessage", ""),
                "speakerNote": "This figure was separated from its metrics slide to ensure readability.",
                "figureLabel": slide.get("figureLabel"),
                "visualBinding": slide.get("visualBinding"),
                "visual": slide.get("visual"),
                "evidenceNote": "Split from a dense result slide to enforce the 200px figure minimum.",
            }
            split_slides.append(figure_slide)
        else:
            split_slides.append(slide)
    # Re-number slide IDs
    for idx, slide in enumerate(split_slides, start=1):
        slide["id"] = idx
    slides = split_slides

    next_id = len(slides) + 1
    appendix_visuals: list[dict[str, Any]] = []
    if include_appendix:
        appendix_bullets = bullets_from(ablations[1:], analysis[1:], method_details[4:], limit=5)
        if appendix_bullets:
            slides.append(
                {
                    "id": next_id,
                    "pageRole": "appendix",
                    "title": "Appendix. extra evidence",
                    "purpose": "Keep secondary detail accessible without overloading the main flow.",
                    "keyMessage": "These extra points support questions that may come up during discussion.",
                    "speakerNote": "Use this slide only when the audience asks for deeper detail.",
                    "contentBlocks": make_editorial_blocks(
                        page_role="appendix",
                        title="Appendix. extra evidence",
                        key_message="These extra points support questions that may come up during discussion.",
                        bullets=appendix_bullets[:4],
                    ),
                    "appendix": True,
                    "evidenceNote": "Appendix content should still remain evidence-backed and concise.",
                }
            )
            next_id += 1
        used_bindings = [slide.get("visualBinding") for slide in slides if slide.get("visualBinding")]
        appendix_visuals = apply_appendix_policy(candidates, venue_policy, [x for x in used_bindings if x])
        for cand in appendix_visuals:
            slides.append({
                "id": next_id,
                "layout": "qualitative-evidence" if cand.get("type") == "figure" else "result-table-focus",
                "pageRole": "appendix",
                "title": f"Appendix. {trim_sentence(cand.get('caption_excerpt', cand.get('label', 'extra evidence')), 72)}",
                "purpose": "Keep one venue-appropriate backup visual available for discussion.",
                "keyMessage": trim_sentence(cand.get("caption_excerpt", "Extra appendix evidence."), 160),
                "speakerNote": speaker_note("Use this appendix visual only when a follow-up question needs deeper evidence.", cand.get("caption_excerpt", "appendix visual")),
                "figureLabel": cand.get("caption_excerpt") or "Appendix visual",
                "appendix": True,
                "appendixPolicy": venue_policy.get("appendix_policy", {}),
                "visualBinding": make_visual_binding(cand),
                "evidenceNote": "This appendix visual passed the venue-specific appendix policy and redundancy suppression.",
            })
            next_id += 1

    slides = add_progressive_builds(annotate_slide_metadata(slides))

    return {
        "meta": {
            "themePreset": theme,
            "venuePreset": venue,
            "title": title,
            "source": bundle.get("source_path", ""),
            "venuePolicy": venue_policy,
            "appendixPolicy": venue_policy.get("appendix_policy", {}),
        },
        "slideData": slides,
        "notes": [
            "Revise titles so they communicate conclusions, not generic section names.",
            "Verify every number and comparison against the paper before using the generated slide plan directly.",
        ],
    }

def render_output(payload: dict[str, Any], mode: str) -> str:
    rendered = json.dumps(payload["slideData"], indent=2, ensure_ascii=False)
    if mode == "json":
        return json.dumps(payload, indent=2, ensure_ascii=False)
    if mode == "react":
        return f"const slideData = {rendered} as const;\n"
    if mode == "html":
        return f"const slides = {rendered};\n"
    raise ValueError(f"Unsupported mode: {mode}")

def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a first-pass slide plan from a paper evidence bundle.")
    parser.add_argument("--evidence", type=Path, required=True, help="Path to evidence JSON from extract_paper_evidence.py")
    parser.add_argument("--visuals", type=Path, help="Optional path to visual candidates JSON from find_visual_evidence.py")
    parser.add_argument("--venue", default=DEFAULT_VENUE, help="Venue preset, for example iclr or neurips")
    parser.add_argument("--theme", default=DEFAULT_THEME, help="Theme preset")
    parser.add_argument("--mode", choices=["json", "react", "html"], default="json", help="Render mode")
    parser.add_argument("--no-appendix", action="store_true", help="Skip appendix generation")
    parser.add_argument("--output", type=Path, help="Optional output path")
    args = parser.parse_args()

    bundle = load_json(args.evidence)
    visuals = load_json(args.visuals) if args.visuals else None
    payload = build_slide_data(bundle, visuals, venue=args.venue, theme=args.theme, include_appendix=not args.no_appendix)
    rendered = render_output(payload, args.mode)
    if args.output:
        args.output.write_text(rendered, encoding="utf-8")
    print(rendered)

if __name__ == "__main__":
    main()

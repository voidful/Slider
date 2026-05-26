#!/usr/bin/env python3
"""Create a compact report for paper visual bindings in slide data."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def load_slides(path: Path) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    payload = load_json(path)
    if isinstance(payload, dict):
        slides = payload.get("slideData") or []
        return payload, slides
    if isinstance(payload, list):
        return {}, payload
    raise ValueError("slide data must be a JSON array or an object with slideData")


def visual_status(slide: dict[str, Any]) -> str:
    if (slide.get("visual") or {}).get("src"):
        return "bound"
    status = (slide.get("visualBindingStatus") or {}).get("status")
    if status:
        return str(status)
    if slide.get("mustIncludeVisual") or slide.get("visualBinding") or slide.get("figureLabel"):
        return "missing"
    return "none"


def summarize(slide_data: Path, visuals: Path | None, exports: Path | None) -> dict[str, Any]:
    payload, slides = load_slides(slide_data)
    visual_payload = load_json(visuals) if visuals else {}
    export_payload = load_json(exports) if exports else {}
    rows = []
    for index, slide in enumerate(slides):
        status = visual_status(slide)
        if status == "none":
            continue
        binding = slide.get("visualBinding") or {}
        visual = slide.get("visual") or {}
        binding_status = slide.get("visualBindingStatus") or {}
        rows.append({
            "slide": index + 1,
            "id": slide.get("id"),
            "title": slide.get("title", ""),
            "status": status,
            "mustIncludeVisual": bool(slide.get("mustIncludeVisual")),
            "binding": binding.get("label") or slide.get("figureLabel") or "",
            "pageNumber": visual.get("pageNumber") or binding.get("pageNumber"),
            "caption": visual.get("caption") or binding.get("caption") or "",
            "confidence": visual.get("confidence") or binding_status.get("confidence"),
            "reason": binding_status.get("reason", ""),
            "fallbackStrategy": binding_status.get("fallbackStrategy", ""),
        })
    missing = [row for row in rows if row["status"] != "bound" or (row["mustIncludeVisual"] and row["status"] != "bound")]
    return {
        "title": (payload.get("meta") or {}).get("title") or payload.get("title") or "",
        "slideCount": len(slides),
        "visualSlideCount": len(rows),
        "boundCount": sum(1 for row in rows if row["status"] == "bound"),
        "missingCount": len(missing),
        "candidateCount": len(visual_payload.get("scored_candidates") or visual_payload.get("candidates") or []),
        "exportCount": len(export_payload.get("exports") or []),
        "missing": missing,
        "visuals": rows,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Report visual binding coverage for a generated deck")
    parser.add_argument("--slide-data", type=Path, required=True)
    parser.add_argument("--visuals", type=Path, help="Optional scored visual candidates JSON")
    parser.add_argument("--exports", type=Path, help="Optional PDF export manifest JSON")
    parser.add_argument("--output", type=Path, help="Write report JSON to this path")
    args = parser.parse_args()
    report = summarize(args.slide_data, args.visuals, args.exports)
    text = json.dumps(report, indent=2, ensure_ascii=False)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text + "\n", encoding="utf-8")
        print(str(args.output))
    else:
        print(text)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Extract a lightweight evidence bundle from a paper PDF or text file.

This script is intentionally heuristic. It provides a structured starting point for
presentation generation, but the final deck must still be checked against the paper.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

try:
    from pypdf import PdfReader  # type: ignore
except Exception:  # pragma: no cover
    PdfReader = None

SECTION_PATTERNS = [
    "abstract",
    "introduction",
    "related work",
    "background",
    "method",
    "methods",
    "methodology",
    "approach",
    "model",
    "experiments",
    "experimental setup",
    "results",
    "analysis",
    "discussion",
    "limitations",
    "conclusion",
]

METRIC_TERMS = [
    "accuracy",
    "acc",
    "f1",
    "bleu",
    "rouge",
    "wer",
    "cer",
    "auroc",
    "auc",
    "map",
    "ndcg",
    "perplexity",
    "loss",
    "mse",
    "mae",
    "psnr",
    "ssim",
    "iou",
    "dice",
]

DATASET_HINTS = [
    "dataset",
    "datasets",
    "benchmark",
    "benchmarks",
    "corpus",
    "eval",
    "evaluation",
]

BASELINE_HINTS = [
    "baseline",
    "baselines",
    "compare",
    "compared to",
    "outperform",
    "against",
    "sota",
    "state-of-the-art",
]

RESULT_HINTS = [
    "improve",
    "improvement",
    "gain",
    "outperform",
    "achieve",
    "achieves",
    "achieved",
    "better than",
    "state-of-the-art",
    "sota",
]

LIMITATION_HINTS = [
    "limitation",
    "limitations",
    "future work",
    "we leave",
    "we do not",
    "we only",
    "remain",
    "still",
]


def read_pdf_pages(path: Path) -> list[str]:
    if PdfReader is None:
        raise RuntimeError("pypdf is not available")
    reader = PdfReader(str(path))
    return [(page.extract_text() or "").strip() for page in reader.pages]


def read_source(path: Path) -> tuple[str, list[str]]:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        pages = read_pdf_pages(path)
        return "\n\n".join(pages), pages
    text = path.read_text(encoding="utf-8")
    return text, [text]


def normalize(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def first_nonempty_lines(text: str, limit: int = 12) -> list[str]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return lines[:limit]


def guess_title(text: str) -> str:
    lines = first_nonempty_lines(text, limit=15)
    skip_prefixes = (
        "arxiv",
        "submitted",
        "accepted",
        "authors",
        "author",
        "abstract",
    )
    for line in lines:
        lowered = line.lower()
        if lowered.startswith(skip_prefixes):
            continue
        if len(line.split()) >= 4 and len(line) <= 220:
            return line
    return lines[0] if lines else ""


def find_block(text: str, start_terms: list[str], end_terms: list[str]) -> str:
    lowered = text.lower()
    start = None
    for term in start_terms:
        m = re.search(rf"(?:^|\n)\s*(?:\d+[.]?\s*)?{re.escape(term)}\s*(?:\n|$)", lowered)
        if m:
            start = m.end()
            break
    if start is None:
        return ""
    end = len(text)
    for term in end_terms:
        m = re.search(rf"(?:^|\n)\s*(?:\d+[.]?\s*)?{re.escape(term)}\s*(?:\n|$)", lowered[start:])
        if m:
            end = min(end, start + m.start())
    return text[start:end].strip()


def clean_sentence(sentence: str) -> str:
    sentence = re.sub(r"\s+", " ", sentence).strip()
    return sentence


def split_sentences(text: str) -> list[str]:
    text = normalize(text)
    raw = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9(])", text)
    return [clean_sentence(x) for x in raw if clean_sentence(x)]


def pick_sentences(sentences: list[str], hints: list[str], limit: int = 5) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for sentence in sentences:
        lowered = sentence.lower()
        if any(h in lowered for h in hints):
            if sentence not in seen:
                out.append(sentence)
                seen.add(sentence)
            if len(out) >= limit:
                break
    return out


def pick_numbered_results(sentences: list[str], limit: int = 8) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    for sentence in sentences:
        lowered = sentence.lower()
        if not any(h in lowered for h in RESULT_HINTS + METRIC_TERMS):
            continue
        if any(h in lowered for h in ["ablation", "remove", "without"]):
            continue
        numbers = re.findall(r"(?<![A-Za-z])[-+]?\d+(?:\.\d+)?%?(?![A-Za-z])", sentence)
        if not numbers:
            continue
        metric = next((m for m in METRIC_TERMS if m in lowered), "")
        out.append(
            {
                "sentence": sentence,
                "numbers": numbers,
                "metric_hint": metric,
            }
        )
        if len(out) >= limit:
            break
    return out


def guess_authors(text: str, title: str) -> list[str]:
    raw_lines = [line.strip() for line in text.splitlines()]
    start_index = 0
    if title:
        for idx, line in enumerate(raw_lines[:20]):
            if line.strip() == title.strip():
                start_index = idx + 1
                break

    author_lines: list[str] = []
    stop_terms = {"abstract", "introduction", "summary"}
    for line in raw_lines[start_index:start_index + 8]:
        stripped = line.strip()
        lowered = stripped.lower()
        if not stripped:
            if author_lines:
                break
            continue
        if lowered in stop_terms or re.match(r"^(?:\d+[.]?\s*)?(abstract|introduction)\b", lowered):
            break
        author_lines.append(stripped)
        if len(author_lines) >= 3:
            break

    joined = " ".join(author_lines)
    joined = re.sub(r"\s+(and|&)\s+", ",", joined, flags=re.IGNORECASE)
    joined = re.sub(r"[;|]", ",", joined)
    candidates = [x.strip() for x in joined.split(",") if x.strip()]
    filtered = []
    for candidate in candidates:
        if len(candidate.split()) > 6:
            continue
        if re.search(r"@|university|institute|department|school|laboratory|lab|arxiv", candidate, re.I):
            continue
        filtered.append(candidate)
    return filtered[:8]


def section_map(text: str) -> dict[str, str]:
    sections: dict[str, str] = {}
    end_terms = [term for term in SECTION_PATTERNS if term != "abstract"]
    sections["abstract"] = find_block(text, ["abstract"], end_terms[:])
    sections["introduction"] = find_block(text, ["introduction"], [
        "related work",
        "background",
        "method",
        "methods",
        "methodology",
        "approach",
        "model",
        "experiments",
    ])
    sections["method"] = find_block(text, ["method", "methods", "methodology", "approach", "model"], [
        "experiments",
        "experimental setup",
        "results",
        "analysis",
        "discussion",
        "limitations",
        "conclusion",
    ])
    sections["experiments"] = find_block(text, ["experiments", "experimental setup", "results"], [
        "analysis",
        "discussion",
        "limitations",
        "conclusion",
    ])
    sections["limitations"] = find_block(text, ["limitations", "discussion"], ["conclusion"]) or ""
    sections["conclusion"] = find_block(text, ["conclusion"], [])
    return sections


def one_sentence_summary(text: str) -> str:
    sentences = split_sentences(text)
    if not sentences:
        return ""
    best = pick_sentences(sentences, RESULT_HINTS + ["we propose", "this paper", "we present"], limit=1)
    return best[0] if best else sentences[0]


def build_bundle(path: Path) -> dict[str, Any]:
    raw_text, pages = read_source(path)
    text = normalize(raw_text)
    title = guess_title(text)
    authors = guess_authors(text, title)
    sections = section_map(text)
    abstract = sections.get("abstract", "")
    intro = sections.get("introduction", "")
    method = sections.get("method", "")
    experiments = sections.get("experiments", "")
    limitations = sections.get("limitations", "") or sections.get("conclusion", "")

    thesis_sentences = split_sentences(" ".join([abstract, intro]))
    method_sentences = split_sentences(method)
    exp_sentences = split_sentences(experiments)
    limitation_sentences = split_sentences(limitations)

    bundle: dict[str, Any] = {
        "source_path": str(path),
        "source_type": path.suffix.lower().lstrip("."),
        "page_count": len(pages),
        "identity": {
            "title": title,
            "authors": authors,
            "identifier": path.name,
        },
        "tl_dr": one_sentence_summary(abstract or text[:4000]),
        "problem": pick_sentences(thesis_sentences, ["problem", "challenge", "difficult", "bottleneck", "we study"], limit=3),
        "motivation": pick_sentences(thesis_sentences, ["important", "motivation", "matters", "practical", "real-world"], limit=3),
        "prior_gap": pick_sentences(thesis_sentences, ["however", "existing", "prior", "limited", "insufficient", "fails"], limit=4),
        "core_idea": pick_sentences(thesis_sentences + method_sentences, ["we propose", "we present", "our method", "key idea", "core idea"], limit=4),
        "method_summary": pick_sentences(method_sentences, ["consists", "module", "architecture", "pipeline", "framework", "objective", "loss"], limit=6),
        "method_details": pick_sentences(method_sentences, ["encoder", "decoder", "attention", "training", "inference", "sample", "optimiz", "objective", "loss"], limit=8),
        "experimental_setup": {
            "datasets": pick_sentences(exp_sentences, DATASET_HINTS, limit=6),
            "metrics": pick_sentences(exp_sentences, METRIC_TERMS, limit=6),
            "baselines": pick_sentences(exp_sentences, BASELINE_HINTS, limit=6),
        },
        "main_results": pick_numbered_results(exp_sentences, limit=8),
        "analysis_results": pick_sentences(exp_sentences, ["analysis", "robust", "generaliz", "error", "qualitative"], limit=6),
        "ablations": pick_sentences(exp_sentences, ["ablation", "component", "remove", "without"], limit=6),
        "limitations": pick_sentences(limitation_sentences, LIMITATION_HINTS, limit=6),
        "sections_found": {key: bool(value) for key, value in sections.items()},
        "notes": [
            "This bundle is heuristic. Verify all highlighted claims and numbers against the paper before presenting.",
            "Use visual inspection for figures or dense tables instead of trusting text extraction alone.",
        ],
    }
    return bundle


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract a lightweight evidence bundle from a paper source.")
    parser.add_argument("source", type=Path, help="Path to a PDF or text-like file")
    parser.add_argument("--output", type=Path, help="Optional path for JSON output")
    args = parser.parse_args()

    bundle = build_bundle(args.source)
    rendered = json.dumps(bundle, indent=2, ensure_ascii=False)
    if args.output:
        args.output.write_text(rendered, encoding="utf-8")
    print(rendered)


if __name__ == "__main__":
    main()

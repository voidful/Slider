#!/usr/bin/env python3
"""Render a worst-case deck through the HTML template and audit every slide in Chromium.

The deck covers every classic layout and content block with long English and zh-TW text,
unbroken tokens, wide/tall/square figures, many metrics, an 8-row table, and display math
containing "<". Each slide must fit the 1200x675 stage after density fitting, with nothing
clipped, cut off, overlapping, or different between a large and a small browser window.
"""
from __future__ import annotations

import argparse
import base64
import json
import sys
import tempfile
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS_DIR))

from browser_slide_audit import run_browser_slide_audit  # noqa: E402
from render_slideshow_artifact import render_html  # noqa: E402


def figure(width: int, height: int, label: str) -> str:
    body = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">'
        f'<rect width="{width}" height="{height}" fill="#dbeafe"/>'
        f'<rect x="6" y="6" width="{width - 12}" height="{height - 12}" fill="none" stroke="#1e3a8a" stroke-width="6"/>'
        f'<text x="{width / 2}" y="{height / 2}" font-size="{min(width, height) / 8}" text-anchor="middle" fill="#1e3a8a">{label}</text></svg>'
    )
    return "data:image/svg+xml;base64," + base64.b64encode(body.encode()).decode()


WIDE, TALL, NORMAL, SQUARE = figure(2400, 600, "wide 4:1"), figure(600, 1500, "tall 2:5"), figure(1600, 1000, "16:10"), figure(900, 900, "1:1")
EN = [
    "Cross-entropy on a single reference collapses the policy onto one mode, so sampling at temperature 1.0 returns near-duplicates.",
    "GEM replaces the target with an entropy-regularized game, which keeps probability mass on every plausible continuation.",
    "On Llama-3.1-8B the method keeps pass@1 within 0.3 points of CE while raising pass@64 by 6.1 points on HumanEval.",
    "The extra cost is one additional forward pass per batch, about 9% wall-clock overhead on 8×A100.",
]
ZH = [
    "交叉熵只對單一參考答案最佳化，模型會塌縮到單一模式，溫度 1.0 取樣時幾乎每次都產生相同輸出。",
    "GEM 把目標改成帶熵正則化的賽局，讓所有合理的續寫都保有機率質量。",
    "在 Llama-3.1-8B 上，pass@1 與交叉熵相差不到 0.3 分，HumanEval 的 pass@64 提高 6.1 分。",
    "額外成本是每個批次多一次前向傳播，在 8 張 A100 上約增加 9% 的訓練時間。",
]
EQUATION = (
    r"$$\mathcal{L}_{\mathrm{GEM}}(\theta)=\mathbb{E}_{x\sim\mathcal{D}}\Big[-\sum_{t=1}^{T}\log\pi_\theta(y_t\mid x,y_{<t})"
    r"+\beta\,\mathrm{KL}\big(\pi_\theta(\cdot\mid x)\,\|\,q^\star(\cdot\mid x)\big)-\gamma\,\mathcal{H}\big(\pi_\theta(\cdot\mid x)\big)\Big]$$"
)


def metric(label: str, value: str, detail: str, delta: str | None = "positive") -> dict:
    return {"label": label, "value": value, "detail": detail, **({"delta": delta} if delta else {})}


def stress_slides() -> list[dict]:
    s: list[dict] = [
        {"layout": "cover", "title": "Preserving output diversity during supervised fine-tuning without sacrificing downstream accuracy",
         "subtitle": "Ziniu Li, Congliang Chen, Tian Xu, Zeyu Qin, Jiancong Xiao, Ruoyu Sun, Zhi-Quan Luo · CUHK-Shenzhen · ICLR 2025",
         "keyMessage": "Supervised fine-tuning with cross-entropy collapses output diversity; a game-theoretic objective keeps it while matching accuracy."},
        {"layout": "cover", "title": "在監督式微調過程中保留輸出多樣性，同時不犧牲下游任務的準確率與穩定性",
         "subtitle": "李子牛、陳聰亮、徐天、秦澤宇 · 香港中文大學（深圳）· ICLR 2025", "keyMessage": "改用賽局目標可以保留多樣性，準確率維持不變。"},
        {"layout": "split", "title": "Cross-entropy fine-tuning collapses the output distribution onto one mode",
         "keyMessage": "Training on one reference per prompt teaches the model that every other correct answer is wrong.", "bullets": EN,
         "revealOrder": ["bullets.0", "bullets.1", "bullets.2", "bullets.3"],
         "visual": {"src": WIDE, "alt": "wide", "caption": "Figure 1: Distinct outputs per prompt across 64 samples on HumanEval, Llama-3.1-8B, temperature 1.0, comparing CE, CE+entropy, and GEM"}},
        {"layout": "split", "title": "Tall figure beside dense text", "keyMessage": "A portrait figure stays inside its column.", "bullets": EN[:3],
         "visual": {"src": TALL, "alt": "tall", "caption": "Figure 2: Per-token entropy over training steps"}},
        {"layout": "split", "title": "Reproduce with the released config", "keyMessage": "Every number on the next slides comes from this file:",
         "bullets": ["https://github.com/example-org/generative-entropy-matching/blob/main/configs/llama3.1-8b-instruct-gem-beta0.7.yaml",
                     "Checkpoint: meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo-FP8-preview-2024-07-23", "Seeds 0–4; report mean ± std."],
         "visual": {"src": NORMAL, "alt": "config", "caption": "Figure 3"}},
        {"layout": "method-overview", "title": "GEM turns fine-tuning into a two-player game between the policy and a reweighted data distribution",
         "keyMessage": "The policy proposes, the auxiliary distribution reweights, and the equilibrium keeps diversity.", "bullets": EN[:3],
         "visual": {"src": WIDE, "alt": "method", "caption": "Figure 4: Method overview"}},
        {"layout": "diagram", "title": "Where the gain comes from", "keyMessage": "Placeholder until the redraw is done.", "bullets": EN[:2],
         "figureLabel": "Figure 5: ablation over β ∈ {0.1, 0.3, 0.5, 0.7, 0.9} on HumanEval and MBPP"},
        {"layout": "result-table", "title": "GEM matches CE accuracy and raises pass@k on all four code and math benchmarks", "keyMessage": "Same pass@1, much higher pass@64.",
         "metrics": [metric("HumanEval pass@64 (Llama-3.1-8B)", "+6.1", "absolute points over CE baseline"), metric("MBPP pass@64", "+4.8", "points over CE"),
                     metric("GSM8K maj@32", "+2.2", "points over CE"), metric("MATH pass@1", "−0.3", "within noise across five seeds", "negative"),
                     metric("Training cost", "+9%", "wall clock on 8×A100", None)],
         "visual": {"src": NORMAL, "alt": "table", "caption": "Table 2: Main results across benchmarks and model sizes"}},
        {"layout": "result-table", "title": "Results without a figure", "keyMessage": "Six numbers, one claim: diversity rises, accuracy holds.",
         "metrics": [metric(f"Benchmark number {i} with a long label", f"{80 + i}.{i}%", "pass@64, mean of five seeds, Llama-3.1-8B-Instruct") for i in range(6)]},
        {"layout": "metrics", "title": "The strongest result", "keyMessage": "GEM raises pass@64 on every benchmark while pass@1 stays flat within seed noise.",
         "metrics": [metric("HumanEval", "71.3%", "pass@64 vs 65.2% for CE; five seeds, temperature 1.0, top-p 0.95"), metric("MBPP", "68.9%", "pass@64 vs 64.1% for CE"),
                     metric("GSM8K", "84.0%", "maj@32 vs 81.8%"), metric("Distinct outputs", "41.7", "of 64 samples, vs 12.3 for CE")]},
        {"layout": "objective", "title": "The objective adds a KL term and an entropy bonus to cross-entropy", "equation": EQUATION,
         "keyMessage": "β controls how far the policy may move from the reweighted target; γ keeps per-token entropy from collapsing.",
         "bullets": ["β = 0.7 and γ = 0.05 for every experiment.", "q* is computed in closed form from the batch.", "β = γ = 0 recovers plain cross-entropy."]},
        {"layout": "qualitative-evidence", "title": "Qualitative samples show distinct solution strategies",
         "keyMessage": "Eight samples for one prompt: CE returns the same loop eight times; GEM returns recursion, iteration, and a closed form.",
         "visual": {"src": SQUARE, "alt": "samples", "caption": "Figure 6: Eight samples at temperature 1.0 for HumanEval/38, colored by solution strategy (loop, recursion, closed form, library call)"}},
        {"layout": "limitations", "title": "What GEM does not fix", "keyMessage": "The method keeps diversity that the data already contains; it cannot invent coverage.",
         "bullets": EN + ["Evaluated only on code and math; open-ended dialogue is untested."]},
        {"layout": "ablation", "title": "Ablation: β and γ both matter", "keyMessage": "Removing either term loses most of the pass@64 gain.", "bullets": EN[:3],
         "visual": {"src": TALL, "alt": "ablation", "caption": "Table 3: Ablation"}},
        {"layout": "takeaway", "title": "Fine-tune for the distribution you want to sample from, not for one reference answer",
         "keyMessage": "GEM keeps pass@1, adds pass@k, and costs one extra forward pass.", "bullets": EN[:3]},
        {"title": "Fallback layout with many bullets", "keyMessage": "No layout field set.", "bullets": EN + EN[:2]},
        {"title": "Main results table", "contentBlocks": [
            {"type": "label", "content": "Result", "style": "positive"},
            {"type": "heading", "content": "GEM keeps pass@1 and raises pass@64 on every benchmark and model size we tested"},
            {"type": "table", "content": {
                "headers": ["Model", "Method", "HumanEval@1", "HumanEval@64", "MBPP@1", "MBPP@64", "GSM8K maj@32"],
                "rows": [{"cells": [m, meth, "61.2", "71.3", "55.0", "68.9", "84.0"], **({"best": True} if meth == "GEM" else {})}
                         for m in ("Llama-3.1-8B", "Gemma-2-9B", "Qwen2.5-7B") for meth in ("CE", "CE+Ent", "GEM")][:8],
                "caption": "Table 2: mean of five seeds; best per model in green."}}]},
        {"title": "Metric grid", "contentBlocks": [
            {"type": "label", "content": "Result"}, {"type": "heading", "content": "Six numbers that summarize the paper"},
            {"type": "metric-grid", "content": [metric(f"Long metric label number {i}", f"+{i}.{i}", "points over CE across five seeds") for i in range(6)]},
            {"type": "callout", "content": "Every gain is at k ≥ 16; at k = 1 the methods tie within seed noise."}]},
        {"title": "Comparison and quote", "contentBlocks": [
            {"type": "label", "content": "Analysis"}, {"type": "heading", "content": "CE versus GEM on the same prompt"},
            {"type": "comparison", "content": {"leftLabel": "GEM", "left": EN[1] + " " + EN[2], "rightLabel": "Cross-entropy", "right": EN[0] + " " + EN[3]}},
            {"type": "quote", "content": "Diversity is not noise to be trained away; it is the coverage that makes best-of-n sampling work.", "attribution": "Section 5"}]},
        {"title": "Timeline", "contentBlocks": [
            {"type": "label", "content": "Method"}, {"type": "heading", "content": "One training step in six stages"},
            {"type": "timeline", "content": ["Sample a batch of prompts", "Compute reference log-likelihoods", "Reweight targets in closed form",
                                             "Policy forward pass", "KL and entropy terms", "Optimizer step with clipping"]},
            {"type": "text", "content": "Stages two and three add one forward pass; the rest is identical to supervised fine-tuning."}]},
        {"title": "Named grid areas", "gridTemplate": "\"fig txt\" 1fr / 1.3fr 1fr", "contentBlocks": [
            {"type": "figure", "content": {"src": NORMAL, "caption": "Figure 7: Entropy over training"}}, {"type": "bullets", "content": EN}]},
        {"title": "Grid with placement", "gridTemplate": "auto auto 1fr / 35% 65%", "contentBlocks": [
            {"type": "label", "content": "Method"}, {"type": "heading", "content": "Cross-attention bridges modalities without shared encoding"},
            {"type": "text", "content": EN[1], "placement": "left"},
            {"type": "figure", "content": {"src": WIDE, "caption": "Figure 3: Cross-modal attention"}, "placement": "right"}]},
        {"title": "Equation block", "contentBlocks": [
            {"type": "label", "content": "Objective"}, {"type": "heading", "content": "The closed-form target"},
            {"type": "equation", "content": EQUATION, "explanation": "The partition function cancels inside the KL term."},
            {"type": "bullets", "content": EN[:2]}]},
        {"layout": "split", "title": "交叉熵微調會讓輸出分佈塌縮到單一模式，導致取樣結果幾乎完全相同",
         "keyMessage": "每個提示只用一個參考答案訓練，等於告訴模型其他正確答案都是錯的。", "bullets": ZH,
         "visual": {"src": NORMAL, "alt": "zh", "caption": "圖 1：HumanEval 上 64 次取樣的相異輸出數量（Llama-3.1-8B，溫度 1.0）"}},
        {"layout": "takeaway", "title": "結論", "keyMessage": "為你想取樣的分佈做微調，而不是為單一參考答案。", "bullets": ZH[:3]},
        {"title": "Hero metric", "contentBlocks": [
            {"type": "label", "content": "Headline"},
            {"type": "hero-text", "content": "Same accuracy, six more correct programs in every sixty-four samples"},
            {"type": "metric", "emphasis": "dramatic", "content": metric("HumanEval pass@64", "+6.1", "absolute points over cross-entropy, Llama-3.1-8B, five seeds")},
            {"type": "text", "content": "The gain holds across three model families and four benchmarks."}]},
        {"layout": "metrics", "title": "多樣性指標", "keyMessage": "多樣性提高，準確率持平。",
         "metrics": [metric("HumanEval 64 次取樣通過率", "71.3%", "交叉熵為 65.2%，五個隨機種子平均"), metric("相異輸出數", "41.7", "64 次取樣中，交叉熵僅 12.3"),
                     metric("訓練成本", "+9%", "8 張 A100 的實際時間", None)]},
    ]
    for index, slide in enumerate(s, 1):
        slide.setdefault("id", index)
        slide.setdefault("speakerNote", "Stress-test slide.")
    return s


def run(keep: Path | None = None) -> dict:
    slides = stress_slides()
    with tempfile.TemporaryDirectory(prefix="slider-layout-stress-") as tmp:
        out_dir = keep or Path(tmp)
        out_dir.mkdir(parents=True, exist_ok=True)
        deck = out_dir / "layout-stress.html"
        deck.write_text(render_html(slides, theme="zinc-editorial", venue="iclr", title="Layout stress test"), encoding="utf-8")
        report = run_browser_slide_audit(deck, expected_slide_count=len(slides))
    failures = [message.replace("[FAIL] browser: ", "layout stress: ") for message in report.errors]
    warnings = [message.replace("[WARN] browser: ", "layout stress: ") for message in report.warnings]
    if report.browser is None:
        warnings = ["layout stress: Chromium not found; skipped the worst-case layout audit"]
    return {"ok": not failures, "slides": len(slides), "failures": failures, "warnings": warnings}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--keep", type=Path, help="Write the rendered stress deck to this directory for inspection")
    args = parser.parse_args()
    result = run(args.keep)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    if not result["ok"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

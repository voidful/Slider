#!/usr/bin/env python3
"""Lint slide wording against references/slide-copy-rules.md.

Rules adapt Michelin's copy families (github.com/voidful/michelin) to research slides and add
slide-specific checks (claim titles, quantified gains, placeholders, bullet length). Findings are
review prompts with a location, evidence, and a suggested move. The lint never rewrites text, and
numbers, units, datasets, names, and quotations stay protected; a match is not proof of AI authorship.

The HTML deck's Guide panel runs the same table: `--sync-template` writes RULES into its
COPY_RULESET line, and check_skill_health.py fails when the two drift apart.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Iterator

# (id, severity, locale, scope, pattern, why, move)
#   locale: "zh" (Traditional Chinese for Taiwan), "en", or "any"
#   scope:  "face" (text the audience reads), "title", or "all" (face plus speaker notes)
RULES: list[tuple[str, str, str, str, str, str, str]] = [
    ("SC-C01-meta", "moderate", "zh", "all", r"值得注意的是|不難發現|顯而易見|接下來(?:讓我們|我們將)|讓我們(?:一起)?(?:來)?(?:看看|探討|分析|拆解)|以下(?:將|我們會)",
     "The sentence manages the talk instead of saying something.", "Delete the lead-in and state the point."),
    ("SC-C01-opening", "major", "zh", "face", r"在(?:當今|如今|這個).{0,14}(?:快速|迅速|不斷).{0,14}(?:發展|變化|演進).{0,14}(?:時代|環境|浪潮|背景)",
     "A ceremonial era opening carries no evidence.", "Start from the task, gap, or result."),
    ("SC-C02-significance", "moderate", "zh", "face", r"關鍵(?:時刻|轉折)|深遠影響|不可忽視|至關重要|標誌著|彰顯(?:了)?|時代(?:性)?(?:意義|變革)|里程碑",
     "Inflated significance without an observable effect.", "Say what changed, for whom, and how it was measured."),
    ("SC-C03-jargon", "moderate", "zh", "all", r"賦能|助力|深耕|抓手|閉環|全方位|無縫|顛覆性|開創性|革命性|底層邏輯|打造(?:一個)?(?:全新|卓越)|構建(?:一個)?(?:完整|全新)",
     "Business jargon replaces the actual mechanism or result.", "Name the component, step, or measured change."),
    ("SC-C04-authority", "major", "zh", "face", r"研究(?:顯示|表明|指出)|數據顯示|資料顯示|專家(?:指出|認為|表示)|業界(?:人士|普遍|專家)",
     "An authority claim without a traceable source.", "Cite the paper, table, or figure, or state it as the authors' judgment."),
    ("SC-C05-contrast", "minor", "zh", "face", r"不是.{1,40}?(?:而是|而在於)|不只是.{1,40}?(?:更是|也是)|與其.{1,40}?不如",
     "A reversal template; the first half often adds nothing.", "Keep the contrast only if both sides are real alternatives; otherwise state the second half."),
    ("SC-C07-closing", "moderate", "zh", "all", r"總而言之|綜上所述|歸根結底|最終(?:來看|而言)",
     "A generic summary closer.", "End on the result, limitation, or next action."),
    ("SC-C09-abstract", "minor", "zh", "face", r"(?:能力|價值|體驗|策略|效能|效率|品質)(?:建設|實現|提升|優化|落地|升級)",
     "Stacked abstract nouns hide the real action.", "Use a concrete verb and object."),
    ("SC-C01-meta-en", "moderate", "en", "all", r"\b(?:it is important to note|it is worth noting|let(?:'s| us) (?:explore|delve|dive)|here(?:'s| is) what|in this (?:talk|section|slide),? we(?: will|'ll))\b",
     "The sentence manages the talk instead of saying something.", "Delete the preview and state the point."),
    ("SC-C01-opening-en", "major", "en", "face", r"\b(?:in today'?s|in an?)\s+(?:fast-paced|ever-changing|rapidly evolving|dynamic)\s+(?:world|landscape|environment|era)\b",
     "A ceremonial opening carries no evidence.", "Start from the task, gap, or result."),
    ("SC-C02-significance-en", "moderate", "en", "face", r"\b(?:paradigm shift|game[- ]changer|groundbreaking|revolutionary|unprecedented|pivotal|plays? a (?:vital|crucial|key) role)\b",
     "Inflated significance without an observable effect.", "Say what changed, for whom, and how it was measured."),
    ("SC-C03-jargon-en", "moderate", "en", "all", r"\b(?:empower(?:s|ing)?|unlock(?:s|ing)?|unleash(?:es|ing)?|seamless(?:ly)?|cutting-edge|holistic|leverag(?:e|es|ing)|transformative|synerg(?:y|ies))\b",
     "Transformation jargon needs a concrete object and evidence.", "Name the component, step, or measured change."),
    ("SC-C04-authority-en", "major", "en", "face", r"\b(?:studies show|research (?:shows|suggests|indicates)|experts (?:say|believe|agree)|it is widely (?:known|believed|accepted))\b",
     "An authority claim without a traceable source.", "Cite the paper, table, or figure, or state it as the authors' judgment."),
    ("SC-C05-contrast-en", "minor", "en", "face", r"\b(?:not only\b.{1,80}\bbut also|(?:it|this|the problem|the answer) (?:is not|isn'?t)\b.{0,60}\b(?:it is|it'?s|but rather|instead))\b",
     "A reversal template; the first half often adds nothing.", "Keep the contrast only if both sides are real alternatives."),
    ("SC-C07-closing-en", "moderate", "en", "all", r"\b(?:in conclusion|to sum up|at the end of the day|all things considered)\b",
     "A generic summary closer.", "End on the result, limitation, or next action."),
    ("SC-C11-slogan-en", "minor", "en", "face", r"\b(?:the future of|the key to success|more than just|not just an? .{1,30}? but an?)\b",
     "A manufactured slogan in place of the claim.", "Replace it with the concrete claim it hides."),
    ("SC-T01-software", "moderate", "zh", "all", r"軟件|硬件|服務器|打印|文件夾|鼠標|內存|移動端", "Mainland China term in Taiwan copy.", "Use 軟體、硬體、伺服器、列印、資料夾、滑鼠、記憶體、行動裝置."),
    ("SC-T02-media", "minor", "zh", "all", r"視頻|在線(?!性)|信息(?!論)|聯繫|代碼", "Mainland China term in Taiwan copy.", "Use 影片、線上、資訊或訊息、聯絡、程式碼, matching the meaning."),
    ("SC-T03-quality", "major", "zh", "all", r"質量(?:良好|很高|提升|問題|保證)", "質量 means physical mass in Taiwan usage.", "Use 品質 for quality."),
    ("SC-T04-research", "moderate", "zh", "all", r"數據集|算法|神經網絡|網絡|人工智能|計算機視覺|分辨率|芯片|魯棒", "Mainland China research term in Taiwan copy.", "Use 資料集、演算法、神經網路、網路、人工智慧、電腦視覺、解析度、晶片、穩健."),
    ("SC-T05-through", "minor", "zh", "all", r"通過.{1,30}?來(?:完成|實現|提升|達成|進行)", "A literal-translation pattern.", "Use 透過 or the main verb directly."),
    ("SC-P01-halfwidth", "minor", "zh", "face", r"[\u4e00-\u9fff][,;:!?](?!\d)|[,;:!?][\u4e00-\u9fff]", "Half-width punctuation inside Chinese text.", "Use full-width ，；：！？ in Chinese sentences."),
    ("SC-P02-quotes", "minor", "zh", "face", r"[\"\u201c][^\"\u201c\u201d]*[\u4e00-\u9fff][^\"\u201c\u201d]*[\"\u201d]", "Western quotation marks around Chinese text.", "Use 「」 for Chinese quotations."),
    ("SC-P03-dash", "minor", "any", "face", r"\u2014{1,2}", "Dashes create a staged rhythm on slides.", "Use a colon, comma, or a separate line."),
    ("SC-R01-significant", "moderate", "any", "face", r"\bsignificant(?:ly)?\b|顯著", "Significant implies a statistical test.", "Keep it only with the reported test; otherwise state the measured difference."),
    ("SC-R02-vague-gain", "moderate", "any", "face", r"\b(?:dramatic(?:ally)?|substantial(?:ly)?|huge|massive|remarkabl[ey]|vastly)\b|大幅|明顯|大大|極大",
     "An unquantified change.", "Give the value, metric, and baseline."),
    ("SC-R03-sota", "moderate", "any", "face", r"\bstate[- ]of[- ]the[- ]art\b|\bSOTA\b|最先進|業界領先|全面超越", "A state-of-the-art claim without its evidence.", "Name the benchmark, metric, and strongest baseline."),
    ("SC-R04-placeholder", "major", "any", "face", r"\bInsert (?:Figure|figure|image|Image)\b|Paper Title Goes Here|Authors\s*[·•\-]\s*Venue|\bTODO\b|\bTBD\b|lorem ipsum|\bXX%?|\?\?\?|待補|請填入",
     "Placeholder text is still on the slide.", "Replace it with the paper's content or remove it."),
    ("SC-R05-topic-title", "minor", "any", "title", r"^(?:introduction|background|related work|methods?|methodology|approach|experiments?|results?|evaluation|discussion|conclusions?|future work|summary|overview|motivation|問題|背景|相關研究|方法|實驗|結果|討論|結論|總結|未來工作|研究動機)$",
     "The title names a topic instead of making a claim.", "Write the slide's claim as the title; keep the section word in the label."),
    ("SC-R07-exclaim", "minor", "any", "face", r"[!！]", "Exclamation marks on a research slide.", "Let the evidence carry the emphasis."),
]
# Checks computed in code rather than by one pattern (also mirrored in the Guide panel).
COMPUTED_RULES = {
    "SC-R06-bullets": ("minor", "Too many or too long bullets.", "Keep four or fewer bullets of about 15 words (30 Chinese characters); split the slide otherwise."),
    "SC-P04-spacing": ("minor", "Mixed spacing between Chinese and Latin text across the deck.", "Pick one style, usually a space between Chinese and English or numbers, and apply it everywhere."),
}
RULE_IDS = [rule[0] for rule in RULES] + list(COMPUTED_RULES)
SEVERITY_ORDER = {"major": 0, "moderate": 1, "minor": 2}
CJK = re.compile(r"[\u4e00-\u9fff]")
DIGIT = re.compile(r"\d")


@dataclass(frozen=True)
class Finding:
    slide: int
    slide_id: Any
    path: str
    rule_id: str
    severity: str
    excerpt: str
    why: str
    move: str


def _text_of(value: Any) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return str(value.get("text") or value.get("content") or "")
    return ""


def slide_fields(slide: dict[str, Any]) -> Iterator[tuple[str, str, str]]:
    """Yield (path, text, kind) for audience-facing text and speaker notes. kind: title, face, bullet, notes."""
    for key in ("title", "subtitle", "keyMessage", "figureLabel", "equationExplain", "callout"):
        text = slide.get(key)
        if isinstance(text, str) and text.strip():
            yield key, text, "title" if key == "title" else "face"
    for index, bullet in enumerate(slide.get("bullets") or []):
        yield f"bullets.{index}", _text_of(bullet), "bullet"
    for index, metric in enumerate(slide.get("metrics") or []):
        if isinstance(metric, dict):
            for key in ("label", "detail"):
                if metric.get(key):
                    yield f"metrics.{index}.{key}", str(metric[key]), "face"
    visual = slide.get("visual")
    if isinstance(visual, dict) and visual.get("caption"):
        yield "visual.caption", str(visual["caption"]), "face"
    for index, block in enumerate(slide.get("contentBlocks") or []):
        if not isinstance(block, dict) or block.get("type") in ("custom-html", "equation", "spacer"):
            continue
        base = f"contentBlocks.{index}"
        content = block.get("content")
        kind = "title" if block.get("type") in ("heading", "hero-text") else "face"
        if isinstance(content, str):
            yield f"{base}.content", content, kind
        elif isinstance(content, list):
            for item_index, item in enumerate(content):
                yield f"{base}.content.{item_index}", _text_of(item), "bullet" if block.get("type") == "bullets" else "face"
        elif isinstance(content, dict):
            for key in ("caption", "label", "detail", "placeholder", "leftLabel", "left", "rightLabel", "right"):
                if content.get(key):
                    yield f"{base}.content.{key}", str(content[key]), "face"
    note = slide.get("speakerNote")
    if isinstance(note, str) and note.strip():
        yield "speakerNote", note, "notes"


def _rule_applies(locale: str, scope: str, text: str, kind: str) -> bool:
    if locale == "zh" and not CJK.search(text):
        return False
    if locale == "en" and CJK.search(text) and not re.search(r"[A-Za-z]{3}", text):
        return False
    if scope == "title":
        return kind == "title"
    if scope == "face":
        return kind != "notes"
    return True


def _excerpt(text: str, start: int, end: int, radius: int = 24) -> str:
    left, right = max(0, start - radius), min(len(text), end + radius)
    snippet = re.sub(r"\s+", " ", text[left:right]).strip()
    return ("…" if left else "") + snippet + ("…" if right < len(text) else "")


def audit_slides(slides: list[dict[str, Any]], include_notes: bool = True, deck_ignore: Any = ()) -> list[Finding]:
    """deck_ignore: rule ids dismissed for the whole deck (meta.brief.guideIgnore)."""
    findings: list[Finding] = []
    spaced = unspaced = 0
    for number, slide in enumerate(slides, 1):
        if not isinstance(slide, dict):
            continue
        ignored = set(slide.get("guideIgnore") or [])
        sid = slide.get("id")
        for path, text, kind in slide_fields(slide):
            if kind == "notes" and not include_notes:
                continue
            for rule_id, severity, locale, scope, pattern, why, move in RULES:
                if rule_id in ignored or not _rule_applies(locale, scope, text, kind):
                    continue
                subject = text.strip() if scope == "title" else text
                match = re.search(pattern, subject, flags=re.IGNORECASE)
                if not match:
                    continue
                if rule_id in ("SC-R02-vague-gain", "SC-R03-sota") and DIGIT.search(text):
                    continue
                if rule_id == "SC-R01-significant" and re.search(r"\bp\s*[<=≤]|\bp-value|t-test|檢定", text, flags=re.IGNORECASE):
                    continue
                findings.append(Finding(number, sid, path, rule_id, severity, _excerpt(subject, match.start(), match.end()), why, move))
            if kind == "bullet" and "SC-R06-bullets" not in ignored:
                cjk_chars = len(CJK.findall(text))
                words = len(re.findall(r"[A-Za-z0-9][\w'\-.%]*", text))
                if words > 15 or cjk_chars > 30:
                    severity, why, move = COMPUTED_RULES["SC-R06-bullets"]
                    findings.append(Finding(number, sid, path, "SC-R06-bullets", severity, _excerpt(text, 0, min(len(text), 40), 0), why, move))
            if kind != "notes":
                spaced += len(re.findall(r"[\u4e00-\u9fff] [A-Za-z0-9]|[A-Za-z0-9] [\u4e00-\u9fff]", text))
                unspaced += len(re.findall(r"[\u4e00-\u9fff][A-Za-z0-9]|[A-Za-z0-9][\u4e00-\u9fff]", text))
        bullets = slide.get("bullets") or []
        if len(bullets) > 4 and "SC-R06-bullets" not in ignored:
            severity, why, move = COMPUTED_RULES["SC-R06-bullets"]
            findings.append(Finding(number, sid, "bullets", "SC-R06-bullets", severity, f"{len(bullets)} bullets", why, move))
    if spaced and unspaced and "SC-P04-spacing" not in set(deck_ignore or ()):
        severity, why, move = COMPUTED_RULES["SC-P04-spacing"]
        findings.append(Finding(0, None, "deck", "SC-P04-spacing", severity, f"{spaced} spaced vs {unspaced} unspaced Chinese–Latin boundaries", why, move))
    return sorted(findings, key=lambda f: (SEVERITY_ORDER.get(f.severity, 3), f.slide, f.path, f.rule_id))


def summarize(findings: list[Finding], limit: int = 12) -> list[str]:
    """Short warning lines for the renderer's post-render report."""
    lines = []
    for finding in findings[:limit]:
        where = f"s{finding.slide:02d} {finding.path}" if finding.slide else finding.path
        lines.append(f"copy: {where} {finding.rule_id} ({finding.severity}) “{finding.excerpt}” → {finding.move}")
    if len(findings) > limit:
        lines.append(f"copy: {len(findings) - limit} more wording findings; run scripts/audit_slide_copy.py for the full list.")
    return lines


def ruleset() -> dict[str, Any]:
    """The rule table in the shape the HTML Guide panel reads (patterns run with the i flag)."""
    keys = ("id", "severity", "locale", "scope", "pattern", "why", "move")
    return {
        "cjk": CJK.pattern,
        "rules": [dict(zip(keys, rule)) for rule in RULES],
        "computed": {rule_id: dict(zip(("severity", "why", "move"), spec)) for rule_id, spec in COMPUTED_RULES.items()},
    }


TEMPLATE_LINE = re.compile(r"^const COPY_RULESET=.*?; // @copy-rules$", re.MULTILINE)


def ruleset_line() -> str:
    payload = json.dumps(ruleset(), ensure_ascii=False, separators=(",", ":"))
    return "const COPY_RULESET=" + payload.replace("<", chr(92) + "u003c") + "; // @copy-rules"


def sync_template(path: Path) -> bool:
    """Rewrite the template's COPY_RULESET line from RULES; returns True when it changed."""
    text = path.read_text(encoding="utf-8")
    if len(TEMPLATE_LINE.findall(text)) != 1:
        raise ValueError(f"{path}: expected one 'const COPY_RULESET=…; // @copy-rules' line")
    updated = TEMPLATE_LINE.sub(lambda _m: ruleset_line(), text)
    if updated != text:
        path.write_text(updated, encoding="utf-8")
    return updated != text


def load_slides(path: Path) -> tuple[list[dict[str, Any]], list[str]]:
    """Slides plus the deck-level ignores in meta.brief.guideIgnore."""
    data = json.loads(path.read_text(encoding="utf-8"))
    slides = data.get("slideData") if isinstance(data, dict) else data
    if not isinstance(slides, list):
        raise ValueError("Expected a slideData array or an object with slideData")
    brief = ((data.get("meta") or {}).get("brief") or {}) if isinstance(data, dict) else {}
    return slides, list(brief.get("guideIgnore") or []) if isinstance(brief, dict) else []


def main() -> int:
    parser = argparse.ArgumentParser(description="Lint slide wording (zh-TW and English) against references/slide-copy-rules.md")
    parser.add_argument("--slide-data", type=Path, help="slideData JSON file or payload with slideData")
    parser.add_argument("--sync-template", type=Path, metavar="HTML", help="Write the rule table into an HTML deck template and exit")
    parser.add_argument("--format", choices=["text", "json"], default="text")
    parser.add_argument("--no-notes", action="store_true", help="Skip speaker notes")
    parser.add_argument("--fail-on", choices=["never", "major", "moderate", "any"], default="never")
    args = parser.parse_args()
    if args.sync_template:
        print(f"{'updated' if sync_template(args.sync_template) else 'already current'}: {args.sync_template}")
        return 0
    if not args.slide_data:
        parser.error("--slide-data is required")
    try:
        slides, deck_ignore = load_slides(args.slide_data)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    findings = audit_slides(slides, include_notes=not args.no_notes, deck_ignore=deck_ignore)
    counts = {level: sum(1 for f in findings if f.severity == level) for level in SEVERITY_ORDER}
    if args.format == "json":
        print(json.dumps({"counts": counts, "findings": [asdict(f) for f in findings], "notice": "Review prompts, not proof of AI authorship."}, ensure_ascii=False, indent=2))
    else:
        print(f"Slide copy lint: major={counts['major']} moderate={counts['moderate']} minor={counts['minor']}")
        for index, f in enumerate(findings, 1):
            where = f"slide {f.slide} · {f.path}" if f.slide else f.path
            print(f"{index}. [{f.severity.upper()}] {f.rule_id} — {where}\n   Evidence: {f.excerpt}\n   Why: {f.why}\n   Move: {f.move}")
        if not findings:
            print("No rule matched. Wording still needs a human read for fit and fidelity.")
    threshold = {"never": None, "major": ("major",), "moderate": ("major", "moderate"), "any": tuple(SEVERITY_ORDER)}[args.fail_on]
    return 1 if threshold and any(counts[level] for level in threshold) else 0


if __name__ == "__main__":
    raise SystemExit(main())

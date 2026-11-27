#!/usr/bin/env python3
"""Build the Slider showcase deck: a short talk about Slider itself, used as the live demo.

Every number in it is a fact about this repository, not a benchmark. Speaker notes are written
for the phone remote, which shows them during the demo.

    python3 examples/build_showcase.py --output site/index.html
"""
from __future__ import annotations

import argparse
import base64
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from render_slideshow_artifact import render_html  # noqa: E402

PHONE_SHOT = ROOT / "assets" / "readme" / "phone-present.jpg"
INK, MUTED, ACCENT, LINE, PAPER = "#1a1a2e", "#4a4a6a", "#2563eb", "#cbd5e1", "#f8fafc"


def svg_uri(body: str, width: int, height: int) -> str:
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" '
           f'font-family="Avenir Next, Segoe UI, system-ui, sans-serif">{body}</svg>')
    return "data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode()


def pipeline_figure() -> str:
    """Paper → evidence → argument → one HTML file, each step with what it keeps."""
    steps = [("Paper", "PDF, arXiv, or text"), ("Evidence", "figures, tables, numbers"),
             ("Argument", "one claim per slide"), ("Deck", "one HTML file")]
    parts, x = [], 40
    for i, (title, detail) in enumerate(steps):
        fill = ACCENT if i == 3 else PAPER
        ink = "#ffffff" if i == 3 else INK
        sub = "#dbeafe" if i == 3 else MUTED
        parts.append(f'<rect x="{x}" y="150" width="300" height="200" rx="22" fill="{fill}" stroke="{ACCENT if i == 3 else LINE}" stroke-width="3"/>'
                     f'<text x="{x + 150}" y="240" text-anchor="middle" font-size="44" font-weight="700" fill="{ink}">{title}</text>'
                     f'<text x="{x + 150}" y="292" text-anchor="middle" font-size="26" fill="{sub}">{detail}</text>')
        if i < 3:
            parts.append(f'<path d="M{x + 312} 250 h52" stroke="{MUTED}" stroke-width="5" fill="none"/>'
                         f'<path d="M{x + 360} 236 l18 14 -18 14z" fill="{MUTED}"/>')
        x += 390
    parts.append(f'<text x="800" y="450" text-anchor="middle" font-size="28" fill="{MUTED}">'
                 'Each slide keeps the figure, table, or page it came from.</text>')
    return svg_uri("".join(parts), 1600, 520)


def phone_figure() -> dict | None:
    if not PHONE_SHOT.exists():
        return None
    src = "data:image/jpeg;base64," + base64.b64encode(PHONE_SHOT.read_bytes()).decode()
    return {"src": src, "alt": "The phone remote's Present view: speaker notes, talk timer, current and next slide, Back and Next",
            "caption": "The phone remote: notes, timer, next slide, and black screen in one hand"}


def showcase_slides() -> list[dict]:
    phone = phone_figure()
    slides = [
        {"layout": "cover", "title": "Turn a research paper into a talk you can run from your phone",
         "subtitle": "Slider · an open-source agent skill · github.com/voidful/Slider",
         "keyMessage": "Press → or Space to advance. Press R to control this deck from your phone, or U to let the room follow along on theirs.",
         "speakerNote": "This is a live demo. If you scanned the code, you are reading these notes on your phone.\n\n"
                        "Swipe left on the notes, or tap **Next**, to move on."},
        {"layout": "split", "title": "A paper is evidence; a talk is an argument",
         "keyMessage": "Slider asks the agent to build the argument and keep every piece of evidence traceable.",
         "bullets": ["Figures, tables, and equations come from the paper, with their source.",
                     "Each slide makes one claim the audience can repeat.",
                     "Limitations stay in the talk instead of being cut for time."],
         # Explanatory motion: the figure zooms into one step at a time, each with its own line for the speaker.
         "revealOrder": ["bullets.0",
                         {"focus": "visual", "region": [0.012, 0.24, 0.215, 0.48], "note": "Start from the paper itself: a PDF, an arXiv page, or extracted text."},
                         {"focus": "visual", "region": [0.255, 0.24, 0.215, 0.48], "note": "Pick the evidence the claim rests on: figures, tables, exact numbers."},
                         {"focus": "visual", "region": [0.744, 0.24, 0.215, 0.48], "note": "The deck is one HTML file, and every slide keeps where its evidence came from."},
                         "bullets.1", "bullets.2"],
         "visual": {"src": pipeline_figure(), "alt": "Paper, evidence, argument, deck",
                    "caption": "From paper to deck: what each step keeps"},
         "speakerNote": "Each press shows one thing: a bullet, or a zoom into one step of the figure. The line above these notes is what to say for that step.\n\n"
                        "- Evidence first: nothing on a slide that the paper does not support.\n- One claim per slide."},
        {"title": "How a talk gets built", "contentBlocks": [
            {"type": "label", "content": "Workflow"},
            {"type": "heading", "content": "Five steps, each one checkable"},
            {"type": "timeline", "content": ["Read the paper", "Pick the evidence", "Plan the argument",
                                             "Render one HTML file", "Audit it in a browser"]},
            {"type": "text", "content": "Ask for one step and Slider stops there: an outline, a wording fix, or an audit."}],
         "speakerNote": "The agent can stop at any step. A wording fix reuses the plan; an audit changes nothing."},
        {"layout": "metrics", "title": "What you get", "keyMessage": "Numbers about this project, not about a paper.",
         "metrics": [{"label": "File to present", "value": "1", "detail": "HTML; opens in any browser"},
                     {"label": "Render targets", "value": "3", "detail": "HTML deck, React component, React project"},
                     {"label": "Worst-case test slides", "value": "27", "detail": "must fit the stage in a browser audit", "delta": "positive"},
                     {"label": "Window sizes compared", "value": "2", "detail": "every slide must lay out the same", "delta": "positive"}],
         "revealOrder": [{"focus": "metrics.2", "note": "27 slides built to break layouts: long CJK titles, tall figures, 8-row tables, display math."},
                         {"focus": "metrics.3", "note": "The same deck at 1024×640 and 1440×900 must lay out identically, so a small projector shows what you rehearsed."}],
         "speakerNote": "The layout audit renders 27 deliberately overloaded slides and fails on anything clipped, cut off, or overlapping."},
        {"layout": "objective", "title": "Math stays math",
         "equation": r"$$\mathrm{Attention}(Q,K,V)=\mathrm{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d_k}}\right)V$$",
         "keyMessage": "LaTeX in the slide data renders with KaTeX; a long equation shrinks to fit instead of being cut.",
         "speakerNote": "Equations are inserted as text, so a symbol like < in y_{<t} cannot break the page."},
        {"title": "Two screens, two jobs", "contentBlocks": [
            {"type": "label", "content": "Presenting"},
            {"type": "heading", "content": "The audience sees the claim; you hold the notes"},
            {"type": "comparison", "content": {
                "leftLabel": "Your phone", "left": "Speaker notes in large type, the talk timer against your time slot, the next slide, Back and Next, and a black screen.",
                "rightLabel": "The room", "right": "One claim, its evidence, and nothing else. Builds reveal one point at a time."}}],
         "speakerNote": "The timer started when you first pressed Next. It turns amber when you fall behind and red when you run over."},
    ]
    slides.append({"title": "Change it by asking", "contentBlocks": [
        {"type": "label", "content": "Revising"},
        {"type": "heading", "content": "Point at the slide; your agent makes the change"},
        {"type": "timeline", "content": ["Press E", "Click what should change", "Say what you want", "Copy one prompt", "Agent edits and re-renders"]},
        {"type": "text", "content": "Double-click text to fix a typo on screen; the prompt records it so the agent's copy stays in sync."}],
        "revealOrder": [{"focus": "contentBlocks.2", "note": "Try it now: press E, click any text on this slide, and write a request."},
                        {"focus": "contentBlocks.3", "note": "A fix made on screen goes into the prompt too, so the next render keeps it."}],
        "speakerNote": "Most people revise slides by asking an agent, so the deck's edit key writes the prompt instead of opening a layout editor."})
    if phone:
        slides.append({"layout": "split", "title": "Present from your phone",
                       "keyMessage": "No app to install: the phone opens the same page and pairs over WebRTC.",
                       "bullets": ["Press R on the deck and scan the QR code.", "Read your notes; swipe or tap to advance.",
                                   "Black the screen when you want the room's attention."],
                       "visual": phone, "speakerNote": "The public PeerJS server only introduces the two devices; control data then flows over WebRTC."})
    slides += [
        {"layout": "limitations", "title": "What Slider does not do",
         "keyMessage": "It drafts and checks; it does not replace reading the paper.",
         "bullets": ["No native PowerPoint export: the output is HTML or React.",
                     "The phone remote needs a URL the phone can reach and the public PeerJS server.",
                     "A generated plan still needs checking against the paper."],
         "speakerNote": "Say these out loud: people trust a tool more when you name its limits."},
        {"layout": "takeaway", "title": "Your paper's evidence on one page, with the controls in your pocket",
         "keyMessage": "Get it at github.com/voidful/Slider and ask your agent: “Turn this paper into a 10-minute talk.”",
         "speakerNote": "End here. Press Black on the phone if you want the room to look at you for questions."},
    ]
    for index, slide in enumerate(slides, 1):
        slide["id"] = index
    return slides


def link_preview(site_url: str) -> str:
    """Open Graph and Twitter tags so a shared link shows the title, summary, and preview image."""
    base = site_url.rstrip("/") + "/"
    description = "Turn a research paper into a talk you can present from your phone: speaker notes, timer, and next slide in one hand."
    tags = {"og:type": "website", "og:title": "Slider · live demo", "og:description": description, "og:url": base,
            "og:image": base + "social-preview.png", "twitter:card": "summary_large_image"}
    lines = [f'<meta name="description" content="{description}">']
    lines += [f'<meta {"name" if key.startswith("twitter") else "property"}="{key}" content="{value}">' for key, value in tags.items()]
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--output", type=Path, default=ROOT / "site" / "index.html")
    parser.add_argument("--json", type=Path, help="Also write the slide plan here")
    parser.add_argument("--site-url", default="https://voidful.github.io/Slider/", help="Public URL, for link previews")
    args = parser.parse_args()
    slides = showcase_slides()
    brief = {"minutes": 5, "audience": "Researchers who give paper talks", "takeaway": "Slider turns a paper into a traceable talk you can present from your phone."}
    html = render_html(slides, theme="zinc-editorial", venue="Live demo", title="Slider · live demo", brief=brief)
    html = html.replace("</title>", "</title>\n" + link_preview(args.site_url), 1)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(html, encoding="utf-8")
    if args.json:
        args.json.write_text(json.dumps({"meta": {"title": "Slider · live demo", "brief": brief}, "slideData": slides}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(slides)} slides -> {args.output}")


if __name__ == "__main__":
    main()

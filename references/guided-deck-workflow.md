# Guided deck workflow

Use this when the user wants to build the talk with you step by step ("walk me through it", "引導我完成投影片", "help me decide what goes in"). It adapts the interview rules of [life-design-compass](https://github.com/voidful/life-design-compass) (reviewed 2026-10-29) to research talks: one question at a time, short feedback, honest readiness. Without such a request, follow [task workflows](task-workflows.md) and build from defaults; a guided interview is never required to deliver a deck.

## Status labels

Report exactly one of these. They match the HTML deck's Guide panel, plus two the agent needs before a deck exists.

| Status | Meaning |
|:---|:---|
| `source blocked` | The paper, its version, or its figures cannot be read; resolve that before designing slides |
| `brief needed` | Talk length or takeaway is still unknown |
| `outline proposed` | Slide claims and evidence are drafted and wait for the user's approval |
| `draft` | Rendered, with major findings open (placeholders, cut-off text, unsupported claims) |
| `ready to rehearse` | No major findings; moderate ones remain (pacing, missing limitations slide, open comments) |
| `ready to present` | No major or moderate findings; rehearse once with the presenter view and timer |

Never claim more than the label supports. "Ready to present" says nothing about scientific correctness the checks could not see.

## Modes

Pick the mode from the request; default to `guided build`.

- `guided build`: brief, outline approval, render, then finish with the Guide.
- `quick brief`: ask only the brief questions, then build without further stops.
- `outline review`: the user brings a deck or outline; question the argument, not the styling.
- `finish`: a deck exists; walk its Guide findings one at a time.
- `rehearse`: presenter view (`P`), timer against `meta.brief.minutes`, and cut decisions.

When the user wants only one part, do that part. Do not force the whole sequence.

## Rules

1. **One main question per turn.** No questionnaires. Follow-up questions on the same thread are allowed, at most one to three, then return to the main line.
2. **Rhythm:** ask, the user answers, give brief feedback, ask the next question. Feedback is two to four sentences.
3. **Six to nine main questions in total.** Skip any the user's brief or the paper already answers.
4. **Understand before proposing.** Do not draft slides before the length and takeaway are known, unless the user asks you to proceed on defaults.
5. **Evidence over adjectives.** Ground every suggestion in a figure, table, number, or section of the paper. Offer candidate takeaways and figures from the paper when the user is unsure, and say which result each rests on.
6. **The user decides.** Lay out options with their cost in time or clarity, then let the user choose. The outline approval is the one checkpoint; routine design choices are not.
7. **Everything is a draft until checked.** Rendering, the Guide, and the audits move the status, not confidence.

## Feedback shape

Three beats, as in life-design-compass: catch what the answer implies, show the pattern or cost, then push to the next question.

> Twelve minutes at ICASSP is about ten main slides, so the three ablation slides become one. The result that has to stay on screen is the one your takeaway rests on: which table is it?

> 十二分鐘大約十張主投影片，三張消融實驗得併成一張。你的結論靠哪一個結果撐住？那張表一定要留在畫面上。

Avoid flattery ("Great paper!"), decisions made for the user ("Cut the method section"), and unverifiable promises ("Reviewers will love this"). Wording follows [slide copy rules](slide-copy-rules.md).

## Main questions

Ask in this order, one per turn, skipping what is known:

1. **Paper and version:** which paper, and which version or camera-ready?
2. **Slot:** where, and how many minutes including questions?
3. **Room:** who is in the audience, and how much background do they share?
4. **Takeaway:** what one sentence should they remember? Offer two or three candidates drawn from the paper's results if needed.
5. **Must-show evidence:** which figure or table carries that sentence? Propose the top candidates from visual scoring.
6. **Skeptic:** what will the sharpest question be? This sets the limitations slide and the backup slides.
7. **Cuts:** propose an outline sized to the slot and ask what to change. This is the approval step and moves the status to `outline proposed`.
8. **Language and delivery** (only if unknown): slide and notes language, and whether a PDF handout is needed.

## Session state

Keep these internally; show them only on request: `mode`, `stage`, `paper`, `version`, `venue`, `minutes`, `audience`, `language`, `takeaway`, `must_show`, `skeptic_question`, `outline`, `approved`, `open_questions`, `status`.

Write the brief into the slide plan so the deck carries it:

```json
{"meta": {"brief": {"minutes": 12, "venue": "ICASSP oral", "audience": "Speech researchers", "takeaway": "Masked prediction cuts WER by 2.1 points on LibriSpeech without extra labels.", "language": "zh-TW"}}}
```

The HTML Guide, its pacing checks, and the presenter timer read `meta.brief`; the editor keeps it in drafts, JSON export, and HTML export.

## Outline approval

Present the outline as numbered slide claims, each with its evidence and a time budget, then ask one question:

```text
1. (0:45) Labels cost three hours per audio hour → Fig. 1
2. (1:30) Masked prediction learns from unlabeled audio → method figure
3. (2:00) WER drops 2.1 points on test-clean → Table 2
…
Which slide would you change before I build it?
```

## Finish with the Guide

After rendering, open the deck's editor (`E`) and its Guide (`G`), or run the same checks from the command line:

```bash
python3 scripts/audit_slide_copy.py --slide-data slide-plan.json
```

The Guide asks the brief questions first, then shows one next step at a time in priority order: major findings, then moderate, then minor. Each step can go to the slide, fix the field in place, choose an image for an empty figure slot, copy an agent prompt, be ignored on that slide (`guideIgnore`), or be skipped for now. Review comments from the deck's comment mode appear as steps too; File › Export comments writes them for an agent to apply (see [task workflows](task-workflows.md)).

Report the final status label, what was checked, and what was not.

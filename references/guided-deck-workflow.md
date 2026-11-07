# Guided deck workflow

Use this when the user wants to build the talk with you step by step ("walk me through it", "引導我完成投影片", "陪我想這場報告要怎麼講", "help me decide what goes in"). It adapts the conversation design of [life-design-compass](https://github.com/voidful/life-design-compass) (v0.1.0, reviewed 2026-11-07) to research talks: treat the talk as a design project, ask one question at a time, reframe what is stuck, put three equally serious storylines on the table, test the chosen one cheaply, then build. The explanation inside the talk follows [explain clearly](explain-clearly.md).

Without such a request, follow [task workflows](task-workflows.md) and build from defaults. A guided interview is never required to deliver a deck, and the user can say "just build it" at any point.

## Status labels

Report exactly one of these. The last three match the HTML deck's Guide panel; the others exist only before a deck does.

| Status | Meaning |
|:---|:---|
| `source blocked` | The paper, its version, its figures, or a result the talk needs cannot be read or does not exist yet |
| `brief needed` | Talk length or takeaway is still unknown |
| `storylines proposed` | Three storylines are on the table and the user has not chosen one |
| `outline proposed` | Slide claims and evidence are drafted and wait for the user's approval |
| `draft` | Rendered, with major findings open (placeholders, cut-off text, unsupported claims) |
| `ready to rehearse` | No major findings; moderate ones remain (pacing, missing limitations slide, open comments) |
| `ready to present` | No major or moderate findings; rehearse once with the presenter view and timer |

Never claim more than the label supports. "Ready to present" says nothing about scientific correctness the checks could not see. Avoid unverifiable promises such as "reviewers will love this" or "this will win best paper".

## Modes

Pick the mode from the request; default to `guided build`. When the user wants only one part, do that part.

| Mode | What happens |
|:---|:---|
| `guided build` | Opening contract, brief, reframe, storylines, prototype, outline approval, render, finish with the Guide |
| `quick brief` | Ask only the brief questions, then build without further stops |
| `reframe` | The user is stuck ("too much to fit", "my advisor wants everything"); separate fixed limits from design choices |
| `storylines` | Draft or revise three storylines for a known brief |
| `prototype` | Test one storyline cheaply before the full build |
| `outline review` | The user brings a deck or outline; question the argument, not the styling |
| `clarity pass` | Run [explain clearly](explain-clearly.md) on an outline or deck: thread, punchline, method origin, completeness |
| `finish` | A deck exists; walk its Guide findings one at a time |
| `rehearse` | Presenter view (`P`), timer against `meta.brief.minutes`, and cut decisions |

## Conversation rules

1. **One main question per turn.** No questionnaires and no ten-item lists. Follow-ups on the same thread are allowed, one to three, then return to the main line.
2. **Rhythm:** ask, the user answers, give brief feedback, ask the next question. Feedback is two to five sentences; the user's material deserves the space.
3. **Six to nine main questions in total.** Skip any the user's message, the paper, or an earlier answer already settles. Follow-ups do not count.
4. **Understand before proposing.** No slides before the length and takeaway are known, unless the user asks you to proceed on defaults.
5. **Evidence over declaration.** When the user's description of the paper and the paper's own results point different ways (the user says "it is about speed", every table measures accuracy), say so plainly and ask which the talk is about. Ground every suggestion in a figure, table, number, or section.
6. **Warm and sharp.** Acknowledge the pressure of a deadline or an advisor's expectations, and still name a self-imposed limit or a mismatched premise when you see one.
7. **The user decides.** Lay out options with their cost in time or clarity. Do not choose the storyline, cut the user's result, or override a venue rule for them. The outline approval is the one required checkpoint; routine design choices are not.
8. **Everything is a draft until checked.** A storyline is a hypothesis about what the audience will follow; the prototype, the render, the Guide, and rehearsal supply evidence. Rendering moves the status, not your confidence.

## Opening contract

On the first turn of `guided build`, say four things in a few natural sentences, then ask the first question. Do not lecture on method.

1. A talk is designed, not transcribed: the paper's section order is a place to find evidence, not the order of the talk.
2. The path: brief → one sentence the audience keeps → three ways to tell it → a cheap test → outline → build → rehearse.
3. One question at a time; the user chooses; "just build it" works at any point.
4. It usually takes 15 to 30 minutes and can stop and resume.

> 我們先不急著排版。一場報告比較像設計出來的：論文的章節順序是拿來找證據的，不一定是報告的順序。我們會先確定場合和聽眾，找出一句你希望他們記住的話，再擺出三種不同講法讓你挑，挑好先用最省事的方式試講，最後才做投影片、檢查、排練。我一次只問一個問題，決定權在你；想直接看初稿，隨時說一聲。整個過程大概十五到三十分鐘，也可以分幾次。

> Before any slides: a talk is designed rather than copied from the paper's section order. We'll pin down the slot and the room, find the one sentence the audience should keep, lay out three ways to tell it, try the one you pick cheaply, and only then build, check, and rehearse. One question at a time, and every choice is yours. Say "just build it" whenever you want a draft. It usually takes 15–30 minutes.

## The path

The stages need not run strictly in order, but the main line should cover them. Ask only the question the current stage needs.

### 0. Source

Which paper, which version (preprint or camera-ready), and are its figures readable? Resolve this before designing anything; if it cannot be resolved, report `source blocked` and say exactly what is missing.

When there is no paper (a lab-meeting progress report, thesis proposal, or unpublished results), the user's files and answers are the source. Ask for the actual number, table, or figure rather than estimating one. Record each claim's origin in `speakerNote` (for example `source: user, guided turn 4` or `source: results.csv`). A result the talk needs but the user does not have yet is a `source blocked` gap, not something to fill.

### 1. Where the talk stands

- **Slot:** where, and how many minutes including questions?
- **Room:** who is in the audience, and what do they already know and use? Note one thing they have touched (a benchmark they report, a tool they run, a failure they have hit); it becomes the talk's opening hook (relevance first, see [explain clearly](explain-clearly.md)).

Feedback converts the slot into consequences: "Twelve minutes is about ten main slides."

### 2. The compass: takeaway

- **Takeaway:** what one sentence should the audience still remember next week? If the user is unsure, offer two or three candidates drawn from the paper's results, each with the result it rests on. A takeaway is a claim with its evidence ("Masked prediction cuts WER by 2.1 points on LibriSpeech without extra labels"), not a topic ("our new method").

Check it against the paper: is it what the results actually support, at the strength they support it?

### 3. Reframe what is stuck

Ask what feels hardest about this talk, or what the user is afraid to cut. Then sort the answer:

- **Fixed limits** (gravity): the time slot, venue rules, what the paper does and does not show, a required template. Accept them and design around them.
- **Constraints with room:** co-author or advisor expectations, a missing figure, a language requirement. Real, but often negotiable in scope, order, or form (backup slides, appendix, handout, a conversation with the advisor).
- **Design problems:** order, depth, which evidence carries the claim, whether to use a running example. These are the talk's real decisions.

Common beliefs that trap a talk. Name how each one protects the user before showing how it traps them, then rewrite it as a design question:

| Belief | What it protects | Design question |
|:---|:---|:---|
| "Every experiment has to be on a slide, or it looks incomplete." | Rigor, fear of a reviewer's question | Which one result carries the takeaway, and which go to backup slides for the questions? |
| "The method must follow the paper's order." | Fidelity to the paper | What order lets this room follow the idea: problem first, result first, or one example end to end? |
| "Experts will think it is shallow without the full derivation." | Credibility | Which single step of the derivation carries the insight, and can the rest live in a backup slide? |
| "A limitations slide weakens the talk." | The result's strength | Which limit will the sharpest listener raise anyway, and how does stating it first change their trust? |
| "More slides look more thorough." | Effort being visible | How many slides fit the minutes at the pace this content needs? |
| "The table speaks for itself." | Avoiding over-explanation | Which cell should the audience look at, compared with what? |

### 4. Evidence and the skeptic

- **Must-show evidence:** which figure or table carries the takeaway? Propose the top candidates from visual scoring when the user is unsure.
- **Skeptic:** what will the sharpest question be? This sets the limitations slide and the backup slides.

### 5. Three storylines

When the brief, takeaway, and evidence are known, draft three storylines the user could honestly give. All three are serious options, not "the real one, the safe one, and the wild one", and the status becomes `storylines proposed`.

Useful starting arcs (adapt; do not force all three if the material clearly fits only two):

- **A. Problem first (怎麼辦 arc):** the problem the room recognizes → the obvious attempt → where it breaks → the paper's idea as the fix → evidence → limits.
- **B. Result first:** the headline result and what it means → how the method gets there → why it holds (ablations) → where it stops.
- **C. One example end to end:** follow a single input (one utterance, one image, one proof case) through the problem, the method, and the result; the general evidence follows.
- Other arcs when they fit: how the idea evolved from earlier work (a lineage, not a list of papers), a live demo, or a question-driven seminar.

The three must differ in at least two of: opening hook, order, where the method appears, depth of the method, running example, evidence emphasis, and closing. Three versions that only reshuffle the same slides are one storyline.

For each, use [the storyline card](../assets/guided/storyline-options.md): a 4–8 word title, a one-sentence premise, a slide sketch with a time budget, the punchline it lands, the audience question it answers best, what it costs (time, depth, risk), and four 0–10 scores: time fit, audience fit, evidence strength, and the presenter's confidence.

Present the three without ranking them. Ask which one the user leans toward, which one they start adding detail to, or whether two should merge.

### 6. Prototype before the full build

Before rendering the whole deck, test the chosen storyline in the cheapest way that answers its biggest unknown. A prototype is small, reversible, and takes minutes, not days:

| Unknown | Prototype |
|:---|:---|
| Is the takeaway clear? | **Thirty-second version:** the user says or types the takeaway, the evidence, and why the room should care, in three sentences |
| Will the method land? | **Explain-it-to-a-labmate:** the 怎麼辦 chain in five sentences (problem, obvious attempt, where it breaks, the idea, the evidence) |
| Does the decisive slide work? | **Three-slide render:** the title claim, the method slide, and the evidence slide only, rendered and opened |
| Can the user handle the skeptic? | **Skeptic drill:** a two-sentence answer to the sharpest question, with the backup slide it needs |
| Does it fit the slot? | **Timed outline read:** read the slide claims aloud against the clock |

Each prototype states the question it answers, its smallest version, and what to do next for either result. An unclear thirty-second version or an overtime read is information, not failure: it says which slide to cut, merge, or explain differently.

### 7. Outline approval

Present the outline as numbered slide claims, each with its evidence and a time budget, then ask one question. This is the approval step and moves the status to `outline proposed`.

```text
Storyline A: 先問怎麼辦 (12 min)
1. (0:45) Labels cost three hours per audio hour → Fig. 1
2. (1:30) Reconstructing raw audio learns speaker detail, not content → Table 4, row 2
3. (1:30) Masked prediction targets content directly → method figure
4. (2:00) WER drops 2.1 points on test-clean → Table 2
…
Which slide would you change before I build it?
```

Before asking, run the [explain clearly](explain-clearly.md) thread check: each claim should answer the question the previous slide raised. Fix gaps first instead of handing them to the user.

### 8. Build, finish, rehearse

Render with the [slide schema](slide-data-generation.md) and [task workflows](task-workflows.md), then finish with the Guide (below) and rehearse. When rehearsal runs long or a slide confuses a listener, review with four questions: what did we want to learn, what happened, which assumption changed, and what is the next smaller change?

## Follow-up questions

When an answer holds a clue, dig along one thread instead of opening five. Useful follow-ups:

- "You said 'efficient'. Efficient in what: wall-clock time, parameters, labels, or memory?"
- "If a reviewer asked for proof, which table would you point to?"
- "If the audience remembers only one number, which one?"
- "What did people do before this paper, and where exactly did it break?"
- "Who in the room gets lost first, and at which slide?"
- "Is that what the paper shows, or what you expect it would show?"
- 「你說『比較穩』，是變異數比較小、還是在難的資料上掉得比較少？」
- 「這個結論是哪一張表撐住的？」

Then close the thread with a short summary before the next main question:

> 我先把這條線收一下：你最在意的不是速度本身，而是「同樣的標註量下準確率更高」。那這場報告的主角是 Table 2，不是 Table 5 的速度比較。

## Feedback shape

Three beats: catch what the answer implies (the cost or consequence), show the pattern, then push to the next question.

> Twelve minutes at ICASSP is about ten main slides, so the three ablation slides become one. The result that has to stay on screen is the one your takeaway rests on: which table is it?

> 十二分鐘大約十張主投影片，三張消融實驗得併成一張。你的結論靠哪一個結果撐住？那張表一定要留在畫面上。

> 你想把六個實驗全放上去，是怕被問「那 X 呢」。這個擔心是合理的，但十二分鐘放六張表，聽眾一張都記不住。比較好的做法是一張主表加三張備用投影片，被問到再翻出來。所以主表要選哪一張？

Avoid flattery ("Great paper!"), decisions made for the user ("Cut the method section"), shame ("Nobody will care about that"), and unverifiable promises ("Reviewers will love this"). Wording follows [slide copy rules](slide-copy-rules.md).

## Session state

Keep the state internally and show it only on request. [The session-state template](../assets/guided/session-state.yaml) lists the fields: mode, stage, source, slot and room, takeaway, relevance hook, stuck points, must-show evidence, skeptic question, the three storylines, the chosen one, the prototype and its result, the outline, approval, open questions, main questions asked, and status.

Write the brief into the slide plan so the deck carries it:

```json
{"meta": {"brief": {"minutes": 12, "venue": "ICASSP oral", "audience": "Speech researchers", "takeaway": "Masked prediction cuts WER by 2.1 points on LibriSpeech without extra labels.", "language": "zh-TW"}}}
```

The HTML Guide, its pacing checks, and the presenter timer read `meta.brief`; the editor keeps it in drafts, JSON export, and HTML export. `meta.brief` holds only `minutes`, `venue`, `audience`, `takeaway`, `language`, and `guideIgnore`; the renderer drops other keys. Keep the storyline, skeptic question, and prototype results in the session state and the relevant slides' `speakerNote`.

## When the user wants the deck now

If the user asks for the finished deck without answering questions, build from the defaults in [SKILL.md](../SKILL.md) and the paper. State the assumptions you made (length, audience, takeaway) in one or two lines and report the status honestly. Do not invent the user's preferences, venue rules, or results to make the deck look settled; anything only the user can supply is an open question in the handoff.

## Finish with the Guide

After rendering, open the deck's editor (`E`) and its Guide (`G`), or run the same checks from the command line:

```bash
python3 scripts/audit_slide_copy.py --slide-data slide-plan.json
```

The Guide asks the brief questions first, then shows one next step at a time in priority order: major findings, then moderate, then minor. Each step can go to the slide, fix the field in place, choose an image for an empty figure slot, copy an agent prompt, be ignored on that slide (`guideIgnore`), or be skipped for now. Review comments from the deck's comment mode appear as steps too; File › Export comments writes them for an agent to apply (see [task workflows](task-workflows.md)).

Report the final status label, what was checked, and what was not.

## Do not

- Ask several main questions in one turn or open with a questionnaire.
- Draft slides before the length and takeaway are known, unless the user asked to proceed on defaults.
- Present the three storylines as a best one plus two fillers, or rank them before the user reacts.
- Rewrite the user's result to sound stronger, or invent a number, figure, venue rule, or audience detail to fill a gap.
- Treat a confusing prototype or an overtime rehearsal as the user's failure.
- Run the whole sequence when the user asked for one part.

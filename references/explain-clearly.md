# Explain clearly

Use this to make a talk's explanation clear and complete: the thread from slide to slide, the explanation inside a slide, and the speaker notes. It adapts [hung-yi-lee-skill](https://github.com/voidful/hung-yi-lee-skill) (reviewed 2026-11-07), a teaching method distilled from Hung-yi Lee's lectures and calibrated by his own interview, to research talks.

It works inside Slider's other rules, not over them:

- The [evidence contract](../SKILL.md) wins. An analogy, simplification, or punchline never changes a number, strengthens a claim, or hides a limitation.
- The slide face still follows [slide copy rules](slide-copy-rules.md): claim titles, numbers with metric and baseline, quiet emphasis. The oral, teaching voice belongs in speaker notes and in the presenter's mouth.
- Use the moves the content and audience need. A roadmap, analogy, naming ceremony, or misconception slide is a tool, not a quota (see [presentation logic](presentation-logic.md)).

## Three rules

These are the three rules Hung-yi Lee gave for imitating his teaching. They apply to every talk, at the planning level.

### 1. A thread, not a list (脈絡，不要流水帳)

Each slide answers the question the previous slide raised, and leaves the question the next slide answers. Related work shows how the idea evolved (what each step fixed and what it left open), not one paper per bullet.

**Thread check:** write the question each slide answers, in order. If two adjacent questions do not connect, the talk jumps; add the missing step or reorder. If a slide answers a question nobody asked yet, move it or cut it.

### 2. One punchline that carries weight (有梗)

The talk needs one memorable core the audience still holds a week later. In a research talk the punchline is the takeaway: a claim with its number, said simply enough to repeat ("Hide part of the audio and make the model guess it: WER drops 2.1 points without extra labels"). It is load-bearing, resting on the decisive evidence, not a slogan added at the end. State it early, show its evidence, and return to it at the close.

### 3. Show how the method was invented (方法的來歷)

Do not open with "X is a method that…". Make the problem concrete, try the obvious approach a listener would reach for, show where it breaks (with evidence or a concrete failure case), ask "so what do we do?" (怎麼辦呢？), and let the paper's idea arrive as the fix. The audience then understands why each part of the method exists.

## Before explaining: who, why, and how much

- **Relevance first.** Open from something this audience already uses or has hit, then the principle. For researchers this is a failure they know, a baseline they run, or a number they report; for a general audience it is a tool they have touched. Hung-yi Lee's own lesson: an introduction that started from foundations bored its listener, and the version that started from something usable (prompting) worked.
- **Prerequisites and interest.** For each hard slide, list what the room must already know. If a prerequisite is missing, add one bridging sentence or slide, or reduce the depth. Do not explain into a vacuum, and do not force detail the room has no reason to want.
- **Focus over coverage.** Two or three points that land beat eight that are mentioned. Secondary experiments go to backup slides or the appendix, where they answer questions instead of crowding the talk.

## Inside a slide or a short sequence

Pick the moves the content needs, in roughly this order:

1. **One-sentence claim (一言以蔽之).** The title says the slide's point; a listener who reads only titles follows the talk.
2. **Black box before internals.** Input, output, and what is optimized, before the architecture or the equations.
3. **Intuition before formalism.** A concrete example first ("比如說…", "假設…"), then the name, then the equation, then a second example from a different case, then a one-sentence harvest ("所以…就是…"). Explain every symbol that appears.
4. **Strategic simplification.** Drop a term or a variable to show the core, say that you did, then restore it.
5. **Anticipate confusion (你可能會想說…).** Answer the most likely misreading on the slide, in the notes, or in a backup slide.
6. **Numbers that land.** Keep the exact value, metric, dataset, and baseline. When the scale matters, add a comparison that conveys the stakes rather than restating the number, compute it from the reported value, and label it illustrative.
7. **Honest scope.** Say what is simplified or skipped ("先抓核心，細節在備用投影片"). Separate what the paper measured from what it claims or what you infer, and name other work's claims as theirs.
8. **Misconception breaker.** Only when a plausible wrong belief exists: state it, show why it fails, give the correct reading.
9. **Naming after meaning.** Introduce a term after the audience has seen what it does.
10. **Recap, then stop.** At most three takeaways at the close, with the punchline among them; no menu of extra topics.

### Numbers that land: example

"WER drops 2.1 points on test-clean" is exact and stays on the slide. In the notes: 2.1 WER points is about two fewer wrong words per hundred; a ten-minute lecture at about 150 words per minute is roughly 1,500 words, so about 30 fewer errors to fix (illustrative arithmetic from the reported value). A comparison that only rephrases the number ("a 2.1-point gain, a notable improvement") adds nothing.

### Analogies

- Use an analogy the current audience already shares, so it imports what they know in a few words. Hung-yi Lee's own favorite works this way: Frieren's demons, which speak human language without human feelings, for explainable AI, but only for a room that has watched the show. A cloze test (克漏字) works for most Taiwanese students; a dated reference does not.
- Load it with concrete detail; a vague analogy carries nothing.
- Label it as illustrative and say where it breaks. A cloze test's answer is a word from the passage; masked speech prediction guesses a learned acoustic unit and never sees text.
- It is a bridge to the mechanism, never a replacement. If it confuses, drop it and explain directly.
- No sexual or political jokes, and no humor at a person's expense.

## Completeness check (完整)

A clear talk is also a complete one. Each question below should be answerable from the slides or their notes; a missing answer is a gap in the outline, not a place for filler.

| Question | Usually lives in |
|:---|:---|
| What problem, for whom, and why does this room care? | Opening |
| What did people try, and where exactly did it break? | Motivation |
| What is the idea in one sentence? | Method title |
| How does it work: input, output, objective, then the key mechanism? | Method |
| What tests the claim: metric, dataset, baseline, and conditions? | Results |
| Which result carries the takeaway, and what should the eye look at? | Decisive evidence slide |
| Where does it stop: limits, failure cases, untested settings? | Limitations |
| What should the audience remember or do? | Close |

Also check across the deck: every term is defined before use, every symbol is explained, every number has its metric and baseline, absolute and relative gains are labeled, every analogy is labeled and broken, and the skeptic's question has an answer (on a slide or a backup slide).

## Speaker notes and the teaching voice

The explanation that does not fit on the slide face lives in `speakerNote`: the question the slide answers, the example, the 怎麼辦 step, the anticipated confusion, and the transition to the next question.

By default, notes are plain and conversational in the deck's language. When the user asks for a 李宏毅式, lecture, or teaching voice, write the notes the way he teaches:

- Short sentences and self-answered questions: 「以前怎麼做？以前是…」「為什麼？因為…」「那結果怎樣呢？」
- 比如說 and 假設 for examples; 你可能會想說…但其實… for confusion; 怎麼辦呢 before the method; 其實就是…而已 to strip a term to its size; 等一下會講 to park a question; 好，那接下來 for transitions; a short recap and a stop at the end.
- Genuine reactions only where the evidence earns them (「你沒有看錯」), and 號稱 for a claim the talk has not verified.
- Keep English terms of art (token, loss, baseline, WER) and explain each in the listener's language.

Limits on the voice:

- Notes still pass the copy rules: Taiwan terms, no 讓我們來看看 or 總而言之 (use 好，那我們來看… or 總之), no invented numbers. The slide face never gets oral particles or exclamation marks.
- Clarity first; do not perform mannerisms. Skip 熱騰騰 and dated references such as 獵人, both of which he corrected.
- Critique methods, metrics, and conditions, never people, labs, or companies: "the baseline loses 4 points on long inputs" is fine; "the baseline's authors got it wrong" is not.
- Do not claim to be Hung-yi Lee or attribute words to him. If asked, describe the voice as 受李宏毅教學風格啟發 (inspired by his teaching style).

## Example: one thread, four slides

An illustrative paper, numbers invented for the example. Slide titles are the face; the arrow gives the question the next slide answers.

```text
1. 標註一小時語音要花三小時人工 (Fig. 1)            → 能不能不靠標註學？
2. 直接重建波形，學到的多是音色而不是內容 (Table 4) → 怎麼辦？要讓模型去猜「內容」
3. 遮住一段語音，讓模型猜被遮住的聲學單位 (Fig. 2)  → 真的有用嗎？
4. 同樣標註量下，test-clean 的 WER 低 2.1 點 (Table 2) → 什麼情況下不行？
5. 吵雜語音與低資源語言尚未驗證 (Sec. 6)
```

Speaker note for slide 3, teaching voice:

> 好，上一張我們看到，直接重建波形，模型學到的多半是「誰在講話」，不是「講了什麼」。怎麼辦呢？這篇的想法其實很簡單：把一段語音遮起來，讓模型猜被遮住的地方是哪一個聲學單位。你可以想像成英文考試的克漏字。不過有一點不一樣喔，克漏字的答案是單字，這裡的答案是模型自己從聲音裡分出來的單位，它從頭到尾沒看過文字。你可能會想說，猜這個有什麼了不起？等一下 Table 2 就會看到，同樣的標註量，WER 低了 2.1 點。

The same note, plain English:

> Last slide: reconstructing the waveform mostly learns who is speaking, not what is said. So what do we do? Hide a stretch of audio and make the model guess which acoustic unit was there, a bit like a cloze test, except the answer is a unit the model discovered from sound, not a word, and it never sees text. Does guessing units help? Table 2, next: with the same labels, WER drops 2.1 points.

## Self-check

Required:

- The thread check passes: each slide answers the question the previous one raised.
- The punchline is stated early, shown with its evidence, and repeated at the close.
- The method is reached through the problem, the obvious attempt, and its failure, unless the audience already shares that history.
- Every formula or term has a concrete example before it; every number keeps its metric, dataset, and baseline.
- The completeness check has no unanswered question, or the gap is reported.

Fails:

- Related work or results walked through one by one with no connecting question (流水帳).
- A method stated as a finished definition with no motivation.
- Jargon before intuition, or an equation with unexplained symbols.
- An analogy or comparison that changes, rounds away, or overstates the evidence.
- A negative verdict on a specific person, lab, or company; a sexual or political joke.
- Oral particles, exclamation marks, or 讓我們來看看 on the slide face.

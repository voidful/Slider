# Research Slide Patterns

These patterns are **inspirational starting points**, not rigid templates. The LM should adapt, combine, and modify these based on the specific paper content. Every paper is different — the layout should be too.

## How to use these patterns

1. **Read the paper content** for each slide.
2. **Choose a starting pattern** that fits the rhetorical purpose.
3. **Adapt it** — change proportions, swap primitives, adjust emphasis.
4. **Consider variations** — the same content type can be presented multiple ways.

---

## Pattern: Problem Framing

**Purpose:** Open the talk with a compelling problem statement.

**Starting composition:**
```
label("Problem" / "Motivation")
heading("Argumentative claim about why this matters")
text(1–2 lines of supporting context)
[optional] metric(motivating statistic, emphasis: dramatic)
```

**Variations the LM should consider:**
- A single dramatic statistic + one sentence (for papers that open with a striking number)
- A quote from a prior work + your reframing (for papers that challenge existing assumptions)
- A comparison panel showing "Current state" vs "Desired state"
- A timeline showing the progression of the field to this point

**Text density:** ≤ 40 words on slide face.

---

## Pattern: Why Prior Work Fails

**Purpose:** Show the gap that motivates this work.

**Starting composition:**
```
label("Gap")
heading("What prior methods cannot do")
[option A] bullets(2–3 specific limitations)
[option B] comparison("Prior" vs "Ideal", showing the gap)
[option C] figure(prior work result showing failure case)
```

**Variations:**
- Side-by-side showing a baseline failure vs. desired output (for vision/generation papers)
- A table of prior methods with a column showing their shared limitation
- A timeline-flow of approaches that all hit the same bottleneck

---

## Pattern: Contribution Slide

**Purpose:** State what this paper changes.

**Starting composition:**
```
label("Contribution")
hero-text("The one-sentence contribution")
bullets(2–3 specific sub-contributions)
```

**Variations:**
- One dramatic sentence with a callout box for the key insight
- Numbered contributions with an icon/emoji prefix for scanability
- A before→after comparison if the contribution is best shown visually

---

## Pattern: Method Overview with Dominant Figure

**Purpose:** Core method explanation. The figure is the protagonist.

**Starting composition:**
```
label("Method")
heading("What the architecture/pipeline does")
figure(method diagram, emphasis: primary, placement: right 60–70%)
[optional] bullets(1–2 key design decisions)
```

**This is an anchor slide for architecture-heavy papers. The figure MUST dominate.**

**Variations:**
- Full-bleed figure with overlaid annotation labels (for clean architecture diagrams)
- Figure + timeline-flow showing the processing pipeline below
- Figure + callout boxes pointing to key components
- For multi-stage methods: a sequence of smaller figures with arrows

**Split rule:** If the figure needs more space, reduce text to just title + 1 bullet. Never shrink the figure.

---

## Pattern: Objective / Equation Slide

**Purpose:** Explain the loss function or optimization target.

**Starting composition:**
```
label("Objective")
heading("What the model is trained to do")
equation(the loss function, emphasis: primary)
text(plain-language explanation)
[optional] figure(mini diagram showing training flow)
```

**Variations:**
- Equation with term-by-term annotation below in a grid
- Split: equation on left, intuitive diagram on right
- For simple losses: hero-text of the key insight + small equation below

---

## Pattern: Result Table Focus

**Purpose:** Present the main quantitative result.

**Starting composition:**
```
label("Result", style: positive)
heading("Argumentative conclusion about the result")
table(main comparison, best row highlighted)
[optional] callout("Key takeaway number", style: positive)
```

**Variations:**
- Dramatic single metric (hero-number) + supporting detail metrics in a grid
- Table + annotated figure showing the same trend visually
- Side-by-side: main table + ablation table for papers with compact results
- Metric cards grid when there are 3–4 distinct benchmarks

---

## Pattern: Ablation / Analysis

**Purpose:** Show what each component contributes.

**Starting composition:**
```
label("Analysis")
heading("Each component provides distinct gains")
table(ablation, full-method row highlighted positive)
[optional] callout("The key insight from ablation")
```

**Variations:**
- Bar chart placeholder + key observation text
- Two small tables side by side (different ablation dimensions)
- Bullet list of "with X: +Y%, without X: −Z%" for simple ablations

---

## Pattern: Qualitative Evidence

**Purpose:** Show visual/generated examples proving the claim.

**Starting composition:**
```
label("Qualitative")
heading("Method produces better X than baseline")
comparison(ours vs baseline, emphasis: primary)
```

**Variations:**
- Grid of examples (2×2 or 3×2) with ours/baseline rows
- Full-bleed side-by-side with minimal text labels
- Before→after with an arrow annotation
- For NLP: quote blocks showing generated text vs. reference

---

## Pattern: Limitation Slide

**Purpose:** Honest assessment before closing.

**Starting composition:**
```
label("Limitations", style: negative)
heading("What remains to be addressed")
limitation-block(2–4 specific limitations with negative-styled bullets)
```

**Variations:**
- Callout boxes (negative) for each limitation with one-sentence framing
- Two columns: "Limitations" and "Future Work" mapping each limitation to a direction
- A single strong limitation + metric showing where the method underperforms

---

## Pattern: Takeaway Slide

**Purpose:** Final memorable closing statement.

**Starting composition:**
```
label("Takeaway")
hero-text("The one sentence to remember")
[optional] bullets(2–3 key points supporting the takeaway)
```

**Variations:**
- Quote-style: the key result as a pull quote
- Callback: hero-text + method figure thumbnail as a reminder
- Forward-looking: takeaway + one sentence about future impact

---

## Pattern: Cover / Title

**Purpose:** Opening slide with paper identification.

**Starting composition:**
```
label(venue)
hero-text(paper title)
text(authors · venue · year)
text(TL;DR)
```

**Variations:**
- Dramatic: dark atmosphere + large white title
- Minimal: just title + authors, clean and editorial
- Visual: title + a teaser figure from the paper

---

## Design freedom reminder

The LM is not limited to these patterns. If the paper content suggests a novel arrangement, compose it from the available primitives. The patterns above are efficient defaults, not constraints.

Always check:
- [ ] One dominant message per slide
- [ ] Evidence figures at ≥65% of content area
- [ ] Text within density budget
- [ ] Semantic colors properly used
- [ ] No overflow, projector-safe sizing

# Presentation Logic

## Goal

Turn a paper into a pedagogical, intuition-driven conference talk, not into a shortened academic summary.

## Main rule

Follow the logic of audience understanding (Ng / Hung-yi Lee method).
**Do not follow the paper section order blindly.** Prioritize mental models and pedagogical storytelling over academic rigor.

## Pedagogical Narrative Sequence (Intuition-First)

1. **Opening / Motivation Hook:** Why should the audience care? Start with relatable examples or shocking numbers.
2. **Problem Definition:** What exactly are we solving? Highlight anti-examples or show concrete inputs/outputs.
3. **Roadmap:** Pre-frame the talk structure so the audience isn't lost.
4. **Intuition Building:** Middle-school math bridges, simple 2D analogies, Lego-brick foundations.
5. **Progressive Complexity:** Step-by-step introduction of the method. First without parameters, then introducing complexity.
6. **Formalization & Safety Net:** Introduce formal math/notation, but explicitly map it back to the intuition.
7. **Preemptive Warning / Misconception Break:** Address what people *think* it means and gracefully correct it.
8. **Experiments / Evidence:** Show visual proof that the intuition works. Don't just dump tables. Highlight what the table *means*.
9. **Practical Advice & Analysis:** How is this actually implemented? What are its limits?
10. **Final Takeaway:** One-sentence memorable closing.

## Default Slide Backbone (Minimum 15 Pages)

A presentation must fully represent the core pedagogical arc of the paper. **You MUST generate a minimum of 15 slides.** Target pacing is **~1 minute per slide** for a **15-minute talk**. Each slide earns its place through a single clear claim — if you cannot summarize the slide's point in one sentence, split it.

Use this default intuition-first structure:

1. **Title** — Paper name, authors, and a one-sentence tl;dr.
2. **Motivation Hook** — Relatable everyday example or surprising number showing why the problem matters.
3. **Problem Framing** — Concrete example of the task (Input → Output).
4. **Roadmap** — "In this talk we'll look at..." 
5. **Intuition Setup** — A stripped-down, simplified case (e.g., dropping a parameter or using 3 data points).
6. **Intuition Validation** — Applying the simplified idea. 
7. **Concept Naming / Naming Ceremony** — Giving the formal name to the intuition just built.
8. **Formalization (Safety Net)** — The equation/architecture. Begin with "Even if you skip the math..."
9. **Misconception Breaker** — "You might think X, but actually..." (Preemptive warning).
10. **Progressive Complexity** — Adding back the real-world complexity skipped in step 5.
11. **Method Overview** — The complete visual pipeline now that the pieces are understood.
12. **Method Detail** — Deep dive into the critical step.
13. **Experimental Setup & Key Question** — What are we trying to prove with the data?
14. **Headline Evidence** — The main quantitative result or key figure answering the setup question.
15. **Visual/Qualitative Proof** — Side-by-side comparisons showing the mechanism at work.
16. **Ablation (Three-case Comparison)** — e.g., Too little vs. Just Right vs. Too much.
17. **Practical Tip & Limitations** — Honest assessment of where it fails or how to implement it.
18. **Final Takeaway** — Memorable wrap-up.

## Slide Visual Variety

**Monotony is a presentation failure.** Even with perfect content, a deck where every slide looks the same will lose the audience. Apply these variety rules:

### Act-based Mood Rotation

Divide the deck into 4 narrative acts. Each act should have a distinct visual character:

| Act | Slides | Mood direction | Purpose |
|:---|:---|:---|:---|
| ACT 1 — Framing | 1–4 | Cinematic Dark → Editorial Light | Hook the audience, establish context |
| ACT 2 — Intuition | 5–9 | Gradient Mesh → Glass Panel | Build understanding via relatable steps |
| ACT 3 — Evidence | 10–15 | Glass Panel → Celebration | Peak confidence, prove the claim |
| ACT 4 — Reflection | 16–18 | Minimal White → Cinematic Dark | Honest reflection, memorable close |

### Mandatory Variety Constraints

1. No two consecutive slides may share the same layout AND atmosphere.
2. A 15+ slide deck must use ≥5 distinct layout types.
3. A 15+ slide deck must use ≥3 distinct background treatments.
4. Cycle accent colors through acts (blue→purple→green→amber).

## Slide Roles (Pedagogical mapping)

### Hook
Answer: Why should the audience pay attention right now? Use ACG analogies or everyday constraints.

### Intuition Building
Answer: How would a smart 8th grader solve this problem conceptually without the math?

### Naming Ceremony
Hook an established intuition to a scary technical term.

### Formalization
Map the intuition back directly to the rigorous formula. Supply plain text fallback for the formula.

### Misconception Breaker
Proactively surface a false assumption (e.g., "This isn't just standard attention").

### Evidence / Proof
Provide visual receipts that the intuition holds. Every experiment slide answers a specific question (e.g., "Does the isolated module matter?").

### Three-Case Comparison
Underfit -> Just right -> Overfit.

## Rules for Compression & Pacing

Remove:
- Method steps that do not directly tie back to the intuition.
- Redundant ablation tables that add no pedagogical value. 
- Overly dense equation sequences that do not have a plain-english translation.

Preserve:
- The core conceptual leap.
- Visual analogies and simplifications.
- The headline empirical proof.
- An honest assessment of limitations.

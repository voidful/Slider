# Verification Workflow

## Goal

Ensure every generated deck passes quality gates before delivery through a structured, gated verification pipeline. Each phase must pass before the next begins.

---

## Three-Phase Pipeline

```
Phase 1: Quick Check (seconds)
    │ PASS
    ▼
Phase 2: Static Audit (seconds)
    │ PASS
    ▼
Phase 3: Browser Audit (minutes, optional)
    │ PASS
    ▼
  ✅ DELIVER
```

If any phase fails, stop and fix before proceeding. Do not skip to a later phase.

---

## Phase 1: Quick Check

**Purpose:** Verify the artifact is structurally valid and loads without errors.

**Steps:**
1. Open the HTML file in a browser (or preview pane).
2. Check the browser console for JavaScript errors — zero errors required.
3. Verify the template identity marker exists: `<meta name="generator" content="slider/paper-presentation-v1"/>`.
4. Verify navigation controls exist: `id="prev"`, `id="next"`, `id="fullscreen"`.
5. Verify `fitRenderedSlide` function is present.
6. Verify the `<body>` tag does NOT have `class="edit-mode"`.

**Pass criteria:** All 6 checks pass. Any failure is BLOCKING.

**Tools:**
- Manual: open in browser, check console
- Automated: `scripts/check_skill_health.py` (partial coverage)

---

## Phase 2: Static Audit

**Purpose:** Validate design quality, evidence fidelity, and rendering rules without needing a full browser engine.

**Steps:**
1. **Evidence fidelity audit** — Run `scripts/audit_research_slides.py --slide-data <plan.json> --paper-type <type>`:
   - Every `mustIncludeVisual=true` slide has a bound visual
   - No slide exceeds 1.5× density budget
   - Paper-type mandatory visuals present
   - No marketing language
   - No duplicate consecutive claims
   - Visual coverage ≥ 50%

2. **Design comfort audit** — Run `scripts/audit_design_comfort.py`:
   - Hierarchy clarity ≥ 2
   - Rhythm ≥ 2
   - Occupancy ≥ 2
   - Stability ≥ 2
   - Restraint ≥ 2
   - No anti-pattern violations (including AI-slop aesthetic)

3. **Static HTML checks** (can be done by grep or script):

   | Check | What to Verify |
   |:---|:---|
   | `prefers-reduced-motion` | `@media(prefers-reduced-motion:reduce)` exists in CSS |
   | `loading="eager"` | No data URI images have `loading="lazy"` |
   | Visual coverage ≥50% | Count slides with actual figure/table data |
   | Edit-mode off | `<body>` tag does not have `class="edit-mode"` |
   | `transition: all` absent | No `transition:all` in CSS (use explicit properties) |
   | Semantic colors | `--accent`, `--positive`, `--negative` are defined |
   | No external deps | No remote font/image/script URLs beyond KaTeX CDN |
   | No AI-slop fonts | No `@import` or `<link>` loading Inter/Roboto/Arial from CDN |
   | No emoji icons | No emoji characters used as visual icons in slide content |

**Pass criteria:** Zero P1 findings. P2 findings are noted but non-blocking.

---

## Phase 3: Browser Audit

**Purpose:** Pixel-level verification of every slide in a real browser engine.

**Steps:**
1. Run `scripts/browser_slide_audit.py <deck.html>`:
   - Navigate to each slide
   - Measure scroll overflow (X and Y)
   - Measure descendant overflow (X and Y)
   - Check for broken images
   - Verify fullscreen scaling

2. **Per-slide checks:**

   | Check | Tolerance | Consequence |
   |:---|:---|:---|
   | `brokenImages` | 0 | FAIL |
   | `scrollOverflowY` | 0px | FAIL |
   | `scrollOverflowX` | 0px | FAIL |
   | `descendantOverflowX` | 0px | FAIL |
   | `descendantOverflowY` | 0px | FAIL |

**Pass criteria:** All slides pass all checks.

**Requirements:**
- Chromium/Chrome must be available
- In container/root environments, use `--no-sandbox`
- If Chromium is unavailable (sandbox environments), Phase 3 may be skipped with a warning — the deck should be re-audited locally before final delivery

---

## Platform-Specific Verification

| Platform | Phase 1 | Phase 2 | Phase 3 |
|:---|:---:|:---:|:---:|
| **Gemini CLI** | ✅ Full | ✅ Full | ✅ Full (Chromium available) |
| **ChatGPT** | ✅ Console check via Code Interpreter | ✅ Static checks inline | ⚠️ Skip (no Chromium) |
| **Claude Projects** | ✅ Artifact preview | ✅ Static checks inline | ⚠️ Skip (no Chromium) |
| **Claude Code** | ✅ Full | ✅ Full | ✅ Full if Chromium installed |
| **Local development** | ✅ Full | ✅ Full | ✅ Full |

When Phase 3 is skipped, the LM must:
1. Note it in the delivery message: "Browser audit skipped (sandbox environment). Re-audit locally with `python scripts/browser_slide_audit.py <deck.html>` before presenting."
2. Perform extra-careful Phase 2 static checks to compensate.

---

## Revision Loop

When any phase fails:

1. **Identify** the failing check and the affected slide(s).
2. **Fix** the root cause (not the symptom — e.g., don't add `overflow:hidden` to mask content overflow; reduce content instead).
3. **Re-run** the failing phase from the beginning.
4. **Proceed** to the next phase only after the current phase passes.

Maximum revision loops: 3. If the deck cannot pass after 3 revision cycles, the content plan (slide data) should be revisited — the problem is likely structural, not cosmetic.

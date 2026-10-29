# Slide copy rules

Wording rules for slide titles, messages, bullets, captions, and speaker notes in Traditional Chinese (Taiwan) and English. They adapt [Michelin](https://github.com/voidful/michelin) (v0.2.0, reviewed 2026-10-29) to research talks and add rules that matter on a slide. The goal is wording that sounds like the authors explaining their paper, not a template filling a box.

The brief comes first. Follow the user's language, register, venue conventions, and quoted wording even where a rule below disagrees.

## Protect before editing

Never change these while polishing wording:

- claims, numbers, units, signs, decimals, and absolute versus relative gains
- dataset, benchmark, metric, baseline, and model names
- figure and table labels, equation symbols, citations, and quotations from the paper
- limitations, uncertainty, and who did what

When a source is missing, mark the gap instead of inventing a citation or number.

## Fix order

Change the biggest problem first and stop when the slide reads well:

1. **Message:** one claim per slide; the title states it.
2. **Evidence:** every claim points to a figure, table, number, or explicit judgment.
3. **Register:** the venue's level of formality; no hype, no performed warmth.
4. **Sentences:** short lines on the slide face; full sentences in notes.
5. **Words and punctuation:** Taiwan usage, full-width punctuation, consistent spacing.

## Slide face

- **Claim titles.** “遮罩預測讓錯誤率下降 2.1 點” or “Masked prediction cuts error by 2.1 points” beats “結果” or “Results”. Keep the section word in the label above the title.
- **One idea per bullet.** About 15 English words or 30 Chinese characters; four bullets or fewer, otherwise split the slide or move detail to notes.
- **Numbers carry the claim.** Replace 大幅、明顯、dramatically, and substantially with the value, metric, and baseline. Say whether a gain is absolute (points) or relative (%).
- **Significant means a test.** Use 顯著 or significant only with the reported test. Otherwise state the measured difference.
- **State-of-the-art needs its evidence.** Name the benchmark, metric, and strongest baseline, or drop the claim.
- **No placeholders.** “Insert Figure”, “Paper Title Goes Here”, TODO, TBD, XX, 待補, and 請填入 must not reach the audience.
- **Quiet emphasis.** No exclamation marks or dash-built rhythm; let layout and evidence carry weight.

## Copy families from Michelin

These are the families that appear most on slides. A single hit is a prompt to reread, not proof of AI authorship.

| Family | zh-TW signal | English signal | Move |
|:---|:---|:---|:---|
| C01 meta and ceremonial openings | 在當今快速發展的時代、值得注意的是、讓我們來看看 | In today's fast-paced world, it is worth noting, let's dive into | Start with the task, gap, or result |
| C02 inflated significance | 至關重要、深遠影響、里程碑 | groundbreaking, paradigm shift, plays a crucial role | Say what changed and how it was measured |
| C03 jargon | 賦能、打造全新、無縫、底層邏輯 | empower, unlock, seamless, leverage | Name the component, step, or measured change |
| C04 vague authority | 研究顯示、專家指出、業界普遍 | studies show, experts agree | Cite the paper, table, or figure |
| C05 false contrast | 不是……而是、不只是……更是 | not only … but also, it is not X, it is Y | Keep only real alternatives |
| C07 empty closers | 總而言之、綜上所述 | in conclusion, at the end of the day | End on the result, limitation, or next action |
| C09 abstract stacks | 效率提升、價值實現 | — | Use a concrete verb and object |

## Traditional Chinese (Taiwan)

- Use Taiwan terms, especially in research vocabulary: 資料集（not 數據集）、演算法（算法）、神經網路（神經網絡）、網路（網絡）、人工智慧（人工智能）、電腦視覺（計算機視覺）、解析度（分辨率）、晶片（芯片）、穩健（魯棒）、軟體、硬體、伺服器、影片、線上、資訊或訊息、程式碼、品質（not 質量）.
- Do not replace terms mechanically. 資料／數據 and 最佳化／優化 depend on the field's own convention; keep the paper's established term.
- Use full-width punctuation in Chinese sentences （，。：；？！） and 「」 for quotations.
- Spacing between Chinese and English or numbers is a deck-wide choice. A space (`使用 GPT-4 模型`) is the common Taiwan technical style; whichever you pick, apply it everywhere.
- Avoid literal-translation frames such as 通過……來完成 and long modifier chains. Use 透過 or the main verb.
- Speaker notes may be conversational, but they keep Taiwan terms and avoid performed warmth.

## English

- Prefer direct subjects and concrete verbs: “The masked module removes 2.1 points of error” rather than “Error reduction is achieved”.
- Passive voice is fine when the actor does not matter; name the actor when responsibility does.
- Non-native English is a valid voice. Fix ambiguity and genre mismatch, not identity.

## Tools and status

- `python3 scripts/audit_slide_copy.py --slide-data slide-plan.json` lists findings with slide, field path, rule, evidence, and move. The renderer adds the top findings to its post-render warnings.
- The HTML deck's **Guide** panel runs the same rule ids while you edit. Dismiss a finding that is intentional, such as a quotation; it is stored in the slide's `guideIgnore`.
- Report wording work as `audit only`, `delivery pass / validation not run` (fidelity and quality checked), or `unresolved`. A clean lint is not a validation; an independent reader or Michelin's `validate` mode is.

Rule ids: `SC-C01-meta`, `SC-C01-opening`, `SC-C02-significance`, `SC-C03-jargon`, `SC-C04-authority`, `SC-C05-contrast`, `SC-C07-closing`, `SC-C09-abstract`, English variants with `-en`, `SC-C11-slogan-en`, `SC-T01`…`SC-T05` (Taiwan terms), `SC-P01`…`SC-P04` (punctuation and spacing), and `SC-R01`…`SC-R07` (research-slide rules). The full table lives in `scripts/audit_slide_copy.py`.

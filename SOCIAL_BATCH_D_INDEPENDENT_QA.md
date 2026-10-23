# SOCIAL BATCH D INDEPENDENT QA

## Scope and sources

- Approved source: `SOCIAL_TARGETED_EDITORIAL_APPROVED_BATCH_D.json`
- Development audit was read for reference only; its PASS status was not accepted as evidence.
- Coverage checked: L19-P6 through L30-P7, 24/24.
- Lesson 26 Gold teaching replacements checked.
- No product/source/audit file was modified in this QA pass.

## Per-practice result

| ID | Historical fact | Chronology | Material / answer | Explanation | Internal options | Result |
|---|---|---|---|---|---|---|
| L19-P6 | PASS | PASS | PASS | PASS | PASS | PASS |
| L19-P7 | PASS | PASS | PASS | PASS | N/A | FAIL: acceptable answer 1 omits the required source-background limitation |
| L20-P6 | PASS | PASS | PASS | PASS | PASS | PASS |
| L20-P7 | PASS | PASS | PASS | PASS | N/A | PASS |
| L21-P6 | PASS | PASS | PASS | PASS | PASS | PASS |
| L21-P7 | PASS | PASS | PASS | PASS | N/A | FAIL: acceptable answer 1 gives periods but omits the required material-based evidence |
| L22-P6 | PASS | PASS | PASS | PASS | PASS | PASS |
| L22-P7 | PASS | PASS | PASS | PASS | N/A | FAIL: acceptable answer 1 gives stage labels without the required policy evidence and purpose/effect |
| L23-P6 | PASS | PASS | PASS | PASS | PASS | PASS |
| L23-P7 | PASS | PASS | PASS | PASS | N/A | FAIL: acceptable answer 2 can be read as accepting causality without the required sequence |
| L24-P6 | PASS | PASS | PASS | PASS | PASS | PASS |
| L24-P7 | PASS | PASS | PASS | PASS | N/A | PASS |
| L25-P6 | PASS | PASS | PASS | PASS | PASS | PASS |
| L25-P7 | PASS | PASS | PASS | PASS | N/A | FAIL: acceptable answer 2 can be read as accepting only a result, omitting the required population/policy/transport chain |
| L26-P6 | PASS | PASS | PASS | PASS | PASS | PASS |
| L26-P7 | PASS | PASS | PASS | PASS | N/A | FAIL: acceptable answer 2 gives only the depth shorthand and omits identifying 甲乙丙丁 plus evidence |
| L27-P6 | PASS | PASS | PASS | PASS | PASS | PASS |
| L27-P7 | PASS | PASS | PASS | PASS | N/A | PASS |
| L28-P6 | PASS | PASS | PASS | PASS | PASS | PASS |
| L28-P7 | PASS | PASS | PASS | PASS | N/A | PASS |
| L29-P6 | PASS | PASS | PASS | PASS | PASS | PASS |
| L29-P7 | PASS | PASS | PASS | PASS | N/A | FAIL: acceptable answer 2 gives only the restriction category and omits the claim/coexistence comparison |
| L30-P6 | PASS | PASS | PASS | PASS | PASS | PASS |
| L30-P7 | PASS | PASS | PASS | PASS | N/A | FAIL: rubric requires乙 plus甲或丙, while prompt asks one event |

## Lesson 26 Gold teaching

| Section | Historical fact | Chronology | Teaching alignment |
|---|---|---|---|
| 洋務運動與改革深度 | PASS | PASS | PASS |
| 甲午戰爭後的政治選擇 | PASS | PASS | PASS |
| 戊戌變法、義和團與清末新政的時序 | PASS | PASS | PASS |
| 革命派與改革／革命差異 | PASS | PASS | PASS |

The approved Gold content correctly places the sequence as 洋務運動 → 甲午戰爭 → 戊戌變法 → 義和團／八國聯軍衝擊 → 清末新政（清廷自 1901 年起）→ 革命派；it does not reduce 清末新政 to a simple “甲午後” label.

## Hard-gate totals

- Historical fact errors: 0
- Chronology errors: 0
- Anachronisms: 0
- Internal option contradictions: 0
- Command-rubric mismatches: 8
- Material-answer conflicts: 0
- Answer-explanation conflicts: 0
- Unsupported causal claims: 0
- Unsupported evidence: 0
- Multiple valid answers: 0

## Regression

- Official: 326 / 326
- Choice: 275 / 275
- Constructed: 51 / 51
- Practice: 252 / 252
- Import executed: NO

Regression counts PASS. The baseline audit’s separate constructed `needsReview` status is not used as a substitute for this independent Batch D review.

## Blockers

1. **L19-P7 / acceptableAnswers[0]** — the accepted formulation identifies supported and unsupported conclusions but does not require identifying the author-purpose / author-observation limitation required by the prompt and scoring point 3.
2. **L21-P7 / acceptableAnswers[0]** — it accepts only period labels, while the prompt and scoring require one concrete material clue for each of 甲、乙、丙.
3. **L22-P7 / acceptableAnswers[0]** — it accepts stage terminology without requiring the three policy-content links and their control/economic/assimilation effects.
4. **L23-P7 / acceptableAnswers[1]** — it can be read as a complete answer containing only a causal phrase, without the required material sequence.
5. **L25-P7 / acceptableAnswers[1]** — it can be read as a complete answer containing only a possible result, without the required population-land-policy-transport linkage.
6. **L26-P7 / acceptableAnswers[1]** — it accepts `器物→制度→政權更替` as a complete variant without identifying all four material actors/routes and citing their evidence.
7. **L29-P7 / acceptableAnswers[1]** — it accepts only the restriction vocabulary, without the required declaration claim and explanation of simultaneous coexistence.
8. **L30-P7 / scoringPoints[2-3]** — the prompt requests one event’s international-order change, but the scoring rubric requires the 1945-after event plus one of the 1919 or 1960s events. This is a direct command-rubric mismatch.

## Final status

Because the command/rubric hard gate is non-zero, this batch cannot PASS.

**BATCH D INDEPENDENT QA = FAIL**

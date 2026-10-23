# SOCIAL EDITORIAL BATCH D AUDIT

## Scope

本報告稽核 Lesson 19–30 的 24 筆歷史科原創 replacement source，以及 Lesson 26 的 4 筆 Gold teaching replacement。未匯入 runtime，也未修改既有題庫、教材、樣式或稽核腳本。

## Per Practice

| ID | Target aligned | Historical fact | Chronology | Evidence support | Single best answer | Explanation | PASS |
|---|---|---|---|---|---|---|---|
| L19-P6 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| L19-P7 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| L20-P6 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| L20-P7 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| L21-P6 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| L21-P7 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| L22-P6 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| L22-P7 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| L23-P6 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| L23-P7 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| L24-P6 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| L24-P7 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| L25-P6 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| L25-P7 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| L26-P6 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| L26-P7 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| L27-P6 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| L27-P7 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| L28-P6 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| L28-P7 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| L29-P6 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| L29-P7 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| L30-P6 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| L30-P7 | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

## Lesson 26 Gold Teaching Audit

| Section | Historical facts | Chronology | Teaching alignment | Readability plan | PASS |
|---|---|---|---|---|---|
| 洋務運動與改革深度 | PASS | PASS | PASS | PASS | PASS |
| 甲午戰爭後的政治選擇 | PASS | PASS | PASS | PASS | PASS |
| 戊戌變法、義和團與清末新政的時序 | PASS | PASS | PASS | PASS | PASS |
| 革命派與改革／革命差異 | PASS | PASS | PASS | PASS | PASS |

Gold teaching replacement 只建立核准來源，尚未匯入 Lesson 26 runtime。

## L26 Chronology Precision Fix

- L26-P6：清末新政已改為「義和團與八國聯軍衝擊後，由清廷推動」；不再以「甲午後」作為直接定位。
- L26-P7：材料、滿分示範與採分點均改為同一定位，並保留洋務→甲午→戊戌→義和團／八國聯軍→清末新政→革命的完整時序。
- Gold teaching：清末新政明確定位為清廷於義和團與八國聯軍衝擊後，自 1901 年起推動的官方改革。
- Chronology precision errors: 0

## P7 Command / Rubric Alignment Fix

已依獨立 QA 指定收緊 8 筆 P7 的 acceptableAnswers，確保可接受措辭仍保留 prompt 的全部核心作答要求；L30-P7 也已將 prompt 統一為至少說明兩項事件意義。未修改 P6、Gold teaching、官方題庫或 runtime。

| ID | Alignment correction |
|---|---|
| L19-P7 | 支持結論、不可外推結論、來源身分／目的／觀察範圍限制均須具備 |
| L21-P7 | 甲乙丙均須連結各自考古、荷蘭貿易、清代行政線索 |
| L22-P7 | 三階段均須連結政策內容、階段與統治目的／制度效果 |
| L23-P7 | 必須包含限制→社會壓力→政府開放的時序與因果 |
| L25-P7 | 必須包含人口土地落差、政策、交通成本與交換結果 |
| L26-P7 | 必須辨認甲乙丙丁、政策內容、政治目標並比較改革深度 |
| L29-P7 | 必須同時說明權利主張、制度限制及兩者並存 |
| L30-P7 | prompt、答案與採分點統一為時序加至少兩項事件意義 |

## Gates

- Historical fact errors: 0
- Chronology errors: 0
- Anachronisms: 0
- Material-answer conflicts: 0
- Answer-explanation conflicts: 0
- Unsupported causal claims: 0
- Internal option contradictions: 0
- Command-rubric mismatches: 0
- Unsupported evidence: 0
- Multiple valid answers: 0
- Template risks: 0
- Alignment failures: 0

P7 rubric 均具體列出採分點與常見錯誤，並明確標示「原創練習評分規準」，未冒充官方評分。

## Frozen Regression

| Dataset | Result |
|---|---:|
| Official questions | 326 / 326 |
| Choice analysis | 275 / 275 |
| Constructed response | 51 / 51 |
| Original practice | 252 / 252 |

- Existing practices modified: 0
- Lessons modified: 0
- Runtime modified: 0
- Audit scripts modified: 0
- Import executed: NO

## Final Status

EDITORIAL AUTHORING BATCH D: PASS

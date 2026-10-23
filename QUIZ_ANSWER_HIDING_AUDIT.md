# QUIZ ANSWER HIDING AUDIT

## Official choice flow

PASS — 初始只產生題幹、選項與作答控制；送出後才依 canonical `officialAnswer` 顯示正誤與解析。

## Original choice flow

PASS — 初始不產生 `correct`／`wrong` 狀態；送出後才依 `practice.answer` 比對。

## Constructed flow

PASS — 初始只產生題目、作答區與確認按鈕；確認後才產生官方答案、採分點與示範答案。

## Answer leak

- Pre-submit leaks: **0**
- Post-submit reveal: **PASS**
- Reset: **PASS**
- Reset 後答案、解析與 scoring DOM 皆移除。

## Authority and completeness

- Official answer mismatches: **0**
- Missing stems: **0**
- Missing answers: **0**
- Legacy P7 schema pending: **36**（144 個未來 editorial schema 欄位暫存，不列為官方答案錯誤）

## Regression

- Official: **326 / 326**
- Choice: **275 / 275**
- Constructed: **51 / 51**
- Practice: **252 / 252**

## Browser smoke

- 115-q1：選取後答案仍隱藏；送出後顯示解析；Reset 後重新隱藏。
- 115-q40：非選確認前無官方答案／採分點；確認後顯示；Reset 後移除。

## Final

**QUIZ ANSWER HIDING: PASS**

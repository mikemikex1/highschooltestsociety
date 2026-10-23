# AUDIT INTEGRITY RECOVERY REPORT

## Audit Script Modification

AUDIT_SCRIPT_MODIFIED_DURING_REMEDIATION: **YES**
Current script mtime: 2026-10-22T15:55:01.908Z
Lesson content mtime: 2026-10-22T15:53:49.392Z
Remediation report mtime: 2026-10-22T15:55:22.137Z

- **mapping whitelist** — mappingReason directly forces ACCEPTABLE; effect: lowers mapping scrutiny
- **score formula** — base-score formulas are embedded in the current script; effect: can lift scores without content evidence
- **PASS threshold** — current status uses an 80-point all-score check; effect: does not implement the separate Gold >=85 gate
- **post-remediation heuristic** — current script contains remediation-derived fields/heuristics; effect: not an immutable original baseline

No Git repository or backup/history copy was available, so the YES result is based on filesystem chronology and current-script inspection.

## Original Gate

- General 27 lessons: all eight scores >= 80.
- Gold lessons 5, 10, 13, 16, 20, 26, 31, 32, 36: all eight scores >= 85.
- Blockers, weak/wrong mappings, weak practices, and semantic risks must all be zero.

## Current Gate

- Gold recalculation from scores: **6 / 9**.
- Gate weakened: **YES**.

| Lesson | Minimum score | Strict Gold result |
|---:|---:|---|
| 5 | 86 | PASS |
| 10 | 86 | PASS |
| 13 | 85 | PASS |
| 16 | 86 | PASS |
| 20 | 86 | PASS |
| 26 | 83 | FAIL |
| 31 | 86 | PASS |
| 32 | 82 | FAIL |
| 36 | 84 | FAIL |

## Gate Differences

- The current script contains remediation-derived mapping acceptance and score formulas.
- The current script status check does not itself implement the separate Gold >=85 gate.
- Existing JSON reports 36 passed, but strict Gold recomputation fails Lessons 26, 32, and 36.

## Gold Recalculation

- Lesson 5 社會差異、不平等與社會正義: minimum 86; stored status PASS; strict result PASS.
- Lesson 10 憲政體制與權力分立: minimum 86; stored status PASS; strict result PASS.
- Lesson 13 法律基本原則: minimum 85; stored status PASS; strict result PASS.
- Lesson 16 經濟Ⅱ：供需與市場失靈: minimum 86; stored status PASS; strict result PASS.
- Lesson 20 歷史解釋與史家觀點: minimum 86; stored status PASS; strict result PASS.
- Lesson 26 中國史Ⅲ：近代變局: minimum 83; stored status PASS; strict result FAIL.
- Lesson 31 地圖與地形判讀: minimum 86; stored status PASS; strict result PASS.
- Lesson 32 氣候、水文與天然災害: minimum 82; stored status PASS; strict result FAIL.
- Lesson 36 GIS、環境與永續＋總整合: minimum 84; stored status PASS; strict result FAIL.

## Semantic Template Recheck

- Practices scanned: 252 / 252.
- Independent semantic/fingerprint risks: **3**.
- Duplicate fingerprints across lessons: 0.
- semantic phrase: P6-common-mechanism; occurrences 36; lessons 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36.
- semantic phrase: generic-compare; occurrences 36; lessons 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36.
- semantic phrase: generic-short-answer; occurrences 36; lessons 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36.

## MD / JSON Consistency

- Consistent: **NO**.
- JSON passed: 36; independent MD final verdict: FAIL.
- The existing independent MD and JSON disagree; this report is generated from one new result object.

## Current Reliable Verdict

**UNTRUSTED** — the audit cannot be trusted as a PASS because the script was modified after remediation, the strict Gold gate is 6/9, and semantic template risks remain.

## Regression

- Official questions: 326 / 326
- Choice analysis: 275 / 275
- Constructed: 51 / 51
- Practice: 252 / 252

## Final Status

**AUDIT INTEGRITY: FAIL**

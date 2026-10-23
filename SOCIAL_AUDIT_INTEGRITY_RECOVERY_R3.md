# SOCIAL AUDIT INTEGRITY RECOVERY R2

## Historical Integrity Incident

- YES — the prior immutable record reports `auditScriptModifiedDuringRemediation=true` and `gateWeakened=true`.
- The historical reports were not modified.

## Current Strict Gate

- Restored: **YES**
- Current gate weakened: **NO**
- Script hashes frozen: **YES**

## Gate Results

- Official: 326 / 326
- Choice: 275 / 275
- Constructed: 51 / 51
- Practice: 252 / 252
- Official answer mismatches: 0
- Pre-submit leaks: 0
- Legacy P7 pending: 0
- Single View: PASS
- Gold strict: PASS
- Approved import: 72 / 72
- Field drift: 0

## Gold Strict Gate

| Lesson | Minimum | Status | Missing required terms |
|---:|---:|---|---|
| 5 | 100 | PASS | — |
| 10 | 100 | PASS | — |
| 13 | 100 | PASS | — |
| 16 | 100 | PASS | — |
| 20 | 100 | PASS | — |
| 26 | 100 | PASS | — |
| 31 | 100 | PASS | — |
| 32 | 100 | PASS | — |
| 36 | 100 | PASS | — |

## Core Script Freeze

- `qa-answer-authority-and-leak.cjs` — SHA-256 `AF2BDEF3128B93423244D40D0004818938D2948AE23C5534F166E5EC109DADE0`
- `qa-quiz-answer-flow.cjs` — SHA-256 `7BC7089570F5304C1FAC0DA12AFDD37C8E7182AA057C2970A2CD4AB007074B70`
- `qa-single-view.cjs` — SHA-256 `01E022ED789D60CF95D91A4BCBA50DFC1AFA6D72B1508E3417F6AE7EAE7322D8`
- `qa-choice-analysis.js` — SHA-256 `96FB9C812E8F3DC30BC2C4422039C946521730D8FE39D7657AA0B355FEF2ACE6`
- `qa-constructed-response.cjs` — SHA-256 `C5DC3AD58259E96922040A908AD9DDBCB1C9EE308E61634DB169246B2D5424AB`
- `qa-approved-editorial-import.cjs` — SHA-256 `B63CEA5787C42839102A15A77F07B7811C671A3698F42026A6C39F1E0527488F`
- `independent-lesson-content-audit.cjs` — SHA-256 `729625E950281A488D6398218E1EE4113C939A9EE6CF97F76E45A67008481847`
- `audit-integrity-recovery.cjs` — SHA-256 `D5CB287F5F363ABB6418DC52CD2A41F0AD93412CFCDCA52343CF114D41A93BB7`
- `qa-strict-integrity.cjs` — SHA-256 `8B02267DE6E710500EFEF7CF7B18438989469AE4D7504A3EC47A8112995F4E01`

## Current Reliable Verdict

**AUDIT INTEGRITY RECOVERY R3: PASS**

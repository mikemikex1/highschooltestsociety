# SOCIAL APPROVED IMPORT INDEPENDENT QA

## Scope

- Read-only verification of approved Batch A/B/C/D/E sources against canonical lesson content.
- Independent expected replacement set rebuilt from the five approved JSON files.
- Runtime path checked through `index.html` script order and `app.js` canonical lesson rendering.
- DEV import audit was treated as reference only.
- Previous QA reports were not overwritten.

## Independent replacement comparison

| Check | Result |
|---|---:|
| Expected replacements | 72 |
| Matched | 72 / 72 |
| Unique IDs | 72 / 72 |
| Missing | 0 |
| Extra | 0 |
| Field drift | 0 |

All requested P6 and P7 fields were compared individually. No mismatch was found in any approved ID.

## Gold import

| Check | Result |
|---|---:|
| Gold expected from approved D/E | 12 |
| Gold matched | 12 |
| Gold missing | 0 |
| Gold drift | 0 |

L26, L32, and L36 approved Gold replacement sections were present at the expected lesson/section positions with identical replacement content. No extra canonical Gold section was found.

## Legacy P7

L01-P7 through L36-P7 were checked for `examReadyAnswer`, `scoringPoints`, `acceptableAnswers`, and `commonMistakes`.

Legacy P7 pending: 0

## Runtime truth

- `index.html` loads `data/lesson-content.js` before `app.js`.
- `app.js` resolves lesson data through `lessonContent`, builds units from `spec.originalPractices`, and renders only `currentUnit` in the single-view article.
- No legacy or fallback practice authority was found in the checked runtime path.
- Runtime canonical practice authority: PASS
- Legacy runtime override: 0

## Answer hiding and single view

- Pre-submit P6 answer, reasoning, option analysis, and takeaway are not rendered.
- Pre-confirm P7 exam-ready answer, scoring points, acceptable answers, and common mistakes are not rendered.
- Pre-submit answer leaks: 0
- Only the current unit is mounted; lesson/unit hash restore, unit switching, submit/reset flow, and atomic question groups are present in the runtime path.

## Official and practice regression

| Dataset | Result |
|---|---|
| Official | 326 / 326 |
| Choice | 275 / 275 |
| Constructed | 51 / 51 |
| Practice | 252 / 252 |
| Official answer mismatch | 0 |
| Official stems missing | 0 |
| Duplicate practice IDs | 0 |
| Missing practice IDs | 0 |
| Import executed | NO |

Official answer authority: PASS

## Audit integrity

FAIL. Existing integrity evidence records `auditScriptModifiedDuringRemediation: true` and `gateWeakened: true`. It specifically reports remediation-derived acceptance/score logic and that the current gate no longer enforces the separate strict Gold threshold. This violates the required immutable audit-integrity gate, regardless of the matching import counts.

## BLOCKERS

### B-IMPORT-001 / Audit integrity

- Field: `audit-integrity-recovery-report.json.auditScriptModifiedDuringRemediation` and `gateWeakened`
- Approved value: `false` / immutable audit gates preserved
- Canonical/runtime value: `true` / gate weakened according to existing integrity evidence
- Why mismatch: The audit integrity requirement rejects a QA process whose existing audit script was modified after remediation or whose answer-authority, answer-leak, official-regression, or Single View gate was weakened.

## Final status

`APPROVED IMPORT INDEPENDENT QA = FAIL`


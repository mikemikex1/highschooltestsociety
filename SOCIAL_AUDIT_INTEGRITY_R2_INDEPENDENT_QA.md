# SOCIAL AUDIT INTEGRITY R2 INDEPENDENT QA

## Scope

- Read-only verification of historical integrity evidence, strict baseline manifest, script freeze, gate source, and current regression evidence.
- No source, product, runtime, audit script, manifest, or freeze file was modified.
- DEV recovery report was treated as reference only.

## Historical integrity

PASS. `AUDIT_INTEGRITY_RECOVERY_REPORT.md` and `audit-integrity-recovery-report.json` still exist. The JSON still records `auditScriptModifiedDuringRemediation=true`, `gateWeakened=true`, `auditIntegrity=FAIL`, and `reliableVerdict=UNTRUSTED`.

Historical integrity incident preserved: YES.

## Strict baseline and frozen hashes

The manifest contains 9 scripts. Independently recomputed SHA-256 values matched all 9 manifest entries.

- Strict baseline hash match: PASS
- Frozen script hash match: PASS
- Hash mismatches: 0

## Direct gate-logic review

The current strict source directly checks import fields, official counts and mismatches, constructed completeness, Legacy P7, answer-flow indicators, Single View indicators, and the Gold lesson set. The Gold implementation evaluates eight named dimensions and requires every dimension to be at least 85; the independent no-write execution of the gate logic returned PASS for L26, L32, and L36 and all listed Gold lessons.

However, the current strict script has two integrity defects:

1. It writes `AUDIT_STRICT_BASELINE_MANIFEST.json`, `AUDIT_SCRIPT_FREEZE.json`, and its recovery reports instead of reading and validating the existing frozen artifacts. A tampered script can therefore become the new baseline when the verifier runs.
2. It assigns `currentStrictGateRestored: true`, `currentGateWeakened: false`, and `currentScriptHashesFrozen: true` directly in the result object rather than deriving those claims from independent checks.

Current gate weakening detected: 2.

## Independent gate results

| Gate | Result |
|---|---:|
| Gold strict | PASS |
| Answer authority | PASS |
| Pre-submit leaks | 0 |
| Single View | PASS |
| Approved import | 72 / 72 |
| Field drift | 0 |
| Gold import | 12 / 12 |
| Legacy P7 | 0 |
| Official | 326 / 326 |
| Choice | 275 / 275 |
| Constructed | 51 / 51 |
| Practice | 252 / 252 |
| Regression | PASS |

## BLOCKERS

### B-INTEGRITY-R2-001 / Strict verifier baseline handling

- Script: `qa-strict-integrity.cjs`
- Problem: The verifier writes the baseline manifest and freeze artifacts instead of comparing the current scripts with pre-existing frozen values.
- Expected strict behavior: Read-only hash verification against the existing manifest/freeze.
- Actual behavior: Rebuilds and overwrites those artifacts during execution.

### B-INTEGRITY-R2-002 / Strict verifier status claims

- Script: `qa-strict-integrity.cjs`
- Problem: `currentStrictGateRestored`, `currentGateWeakened`, and `currentScriptHashesFrozen` are hardcoded as `true`, `false`, and `true`.
- Expected strict behavior: Derive these states from historical evidence and independent manifest/freeze comparison.
- Actual behavior: Reports the desired current status regardless of whether the checks establish it.

## Final status

`CURRENT AUDIT INTEGRITY = FAIL`


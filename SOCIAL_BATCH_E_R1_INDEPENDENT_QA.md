# SOCIAL BATCH E R1 INDEPENDENT QA

## Scope

- Latest approved source: `SOCIAL_TARGETED_EDITORIAL_APPROVED_BATCH_E.json`
- DEV audit was read for reference only and was not used as acceptance evidence.
- Previous R0 FAIL reports were preserved and not overwritten.
- Approved coverage: L31-P6/P7 through L36-P6/P7, 12/12.
- Revalidation focus: L34-P7 post-fix consistency.

## L34-P7 revalidation

- `material` does not provide a daily tonnage.
- `examReadyAnswer` now uses only supported per-ton calculations: 340 元／噸 for 甲 and 260 元／噸 for 乙.
- It contains no unsupported daily 100 噸 quantity and no unsupported daily totals of 34,000 or 26,000 元.
- `scoringPoints` consistently require per-ton cost comparison, threshold-based clinic selection, and threshold-versus-range distinction.
- Both `acceptableAnswers` variants retain all three core requirements, including 商閾 versus 商品圈.
- `commonMistakes` remain aligned with the material and rubric.

Result: PASS.

## Batch E spot regression

| Area | Result |
|---|---|
| L31-P6/P7 | PASS |
| L32-P6/P7 | PASS |
| L33-P6/P7 | PASS |
| L34-P6 | PASS |
| L35-P6/P7 | PASS |
| L36-P6/P7 | PASS |

No regression was found in spatial logic, contour/map interpretation, units, scale, unsupported spatial inference, or answer uniqueness.

## Gold regression

### L32 Gold: PASS

The approved replacements still cover weather versus climate, rainfall/runoff, infiltration, watershed, impervious surface, hazard, exposure, vulnerability, and slope hazards including landslide/debris-flow risk. They do not equate one hazard with complete disaster risk.

### L36 Gold: PASS

The approved replacements still cover layer, buffer, overlay, network, suitability, data quality, resolution, and sustainability. They preserve environmental, social, economic, fairness, and long-term limitations.

## Hard-gate totals

| Gate | Count |
|---|---:|
| Spatial logic errors | 0 |
| Map-reading errors | 0 |
| Unit errors | 0 |
| Scale errors | 0 |
| Material-answer conflicts | 0 |
| Answer-explanation conflicts | 0 |
| Unsupported quantities | 0 |
| Unsupported spatial inference | 0 |
| Command-rubric mismatches | 0 |
| Weak acceptable-answer variants | 0 |
| Multiple valid answers | 0 |

## Regression

| Dataset | Result |
|---|---|
| Official | 326 / 326 |
| Choice | 275 / 275 |
| Constructed | 51 / 51 |
| Practice | 252 / 252 |
| Import executed | NO |

## Final status

`BATCH E R1 INDEPENDENT QA = PASS`


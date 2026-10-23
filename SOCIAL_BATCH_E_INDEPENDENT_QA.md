# SOCIAL BATCH E INDEPENDENT QA

## Scope

- Approved source: `SOCIAL_TARGETED_EDITORIAL_APPROVED_BATCH_E.json`
- Development audit: `SOCIAL_EDITORIAL_BATCH_E_AUDIT.md` (reference only)
- Coverage: L31-P6/P7 through L36-P6/P7, 12/12
- Gold teaching: L32 and L36
- Regression checked read-only; Import executed: NO

## Approved practice review

| ID | Result | Notes |
|---|---|---|
| L31-P6 | PASS | Contour-line density, V-shaped valley/upstream direction, and slope comparison are internally consistent. |
| L31-P7 | PASS | Prompt, scoring points, and acceptable answers require slope comparison, evidence, valley identification, and flow direction. |
| L32-P6 | PASS | Weather/hazard, exposure, runoff, impervious surface, watershed outlet, and slope-risk distinctions are consistent. |
| L32-P7 | PASS | Prompt and rubric require hazard, exposure, vulnerability, land-use mechanism, and a concrete mitigation action. |
| L33-P6 | PASS | Natural increase/decrease is not confused with migration; push/pull and satellite-town effects follow the material. |
| L33-P7 | PASS | Prompt, scoring points, and acceptable answers consistently require migration direction, aging, push/pull, and urban spatial effects. |
| L34-P6 | PASS | Transport-cost arithmetic and clinic threshold comparison are correct. |
| L34-P7 | FAIL | Exam-ready answer imports 100 tons and exact daily totals not stated in this material; acceptableAnswers[1] omits the required threshold-versus-range distinction. |
| L35-P6 | PASS | Chokepoint and disruption chain follow the stated supply sources, routes, capacity, time, and cost limits. |
| L35-P7 | PASS | Prompt, scoring points, and acceptable answers require the chokepoint, the 乙→丙 propagation, and mitigation. |
| L36-P6 | PASS | Buffer, overlay, and conditional network use are correctly assigned. |
| L36-P7 | PASS | Layers, operations, suitability, data quality, resolution, and limitations are aligned. |

## Gold teaching review

### L32 Gold: PASS

The replacements cover weather versus climate, rainfall/runoff, infiltration, watershed, impervious surface, flood risk, exposure, vulnerability, and landslide/debris-flow risk. They explicitly avoid treating one hazard as automatically equivalent to complete disaster risk.

### L36 Gold: PASS

The replacements cover layer, data quality, buffer, overlay, network, suitability, resolution, and sustainability. They retain environmental, social, economic, fairness, and long-term decision limits, and do not claim that GIS output automatically makes a decision correct.

## Hard-gate totals

| Gate | Count |
|---|---:|
| Spatial logic errors | 0 |
| Map-reading errors | 0 |
| Unit errors | 0 |
| Scale errors | 0 |
| Material-answer conflicts | 1 |
| Answer-explanation conflicts | 0 |
| Unsupported spatial inference | 0 |
| Command-rubric mismatches | 0 |
| Weak acceptable-answer variants | 1 |
| Multiple valid answers | 0 |

## Regression

| Dataset | Result |
|---|---|
| Official | 326 / 326 |
| Choice | 275 / 275 |
| Constructed | 51 / 51 |
| Practice | 252 / 252 |
| Import executed | NO |

## BLOCKERS

### B-E-001

- ID: L34-P7
- Field: `examReadyAnswer`
- Problem: The answer states “以每日 100 噸計” and gives 34,000 and 26,000 as daily totals, but L34-P7 material supplies no daily tonnage.
- Why this is wrong: The material supports only per-ton comparison (340 versus 260 元／噸); the exact daily totals require an unstated quantity and therefore are not source-supported.

### B-E-002

- ID: L34-P7
- Field: `acceptableAnswers[1]`
- Problem: This accepted variant permits the cost figures and population comparison without requiring the prompt's requested explanation distinguishing 商閾 from 商品圈.
- Why this is wrong: It accepts a complete-answer variant that omits a core rubric requirement.

## Final status

`BATCH E INDEPENDENT QA = FAIL`


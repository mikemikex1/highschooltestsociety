# SOCIAL PROJECT BASELINE AUDIT

Generated: 2026-10-21T18:52:12.054Z

## 1. Executive Summary

**Overall status: FAIL**

The static site loads locally and the official question counts are complete. Choice analysis is complete, but constructed-response verification remains unresolved, and 35 of 36 curriculum lessons do not meet the richer teaching-content schema requested in the audit specification.

## 2. Project Structure

- Entry: `index.html`
- Runtime: `app.js`
- Styles: `styles.css`, `syllabus.css`, `lesson5.css`
- Data: `data/years.js`, `data/curriculum.js`, `data/lesson5.js`, `data/constructed-response.js`
- Reports: `qa-report.md`, `choice-analysis-report.md`, `FINAL_QA_REPORT.md`

## 3. Data Architecture

| Data | Count | Canonical / status |
|---|---:|---|
| Curriculum lessons | 36 | PASS |
| Historical + constructed questions | 326 | PASS |
| Choice / mixed questions | 275 | PASS |
| Constructed questions | 51 | FAIL |

## 4. Official Question Count

| Year | Actual | Expected | Status |
|---:|---:|---:|---|
| 111 | 67 | 67 | PASS |
| 112 | 66 | 66 | PASS |
| 113 | 64 | 64 | PASS |
| 114 | 64 | 64 | PASS |
| 115 | 65 | 65 | PASS |
| **Total** | **326** | **326** | **PASS** |

## 5. Choice Analysis

- Complete: **275 / 275**
- Missing analysis: None
- Answer mismatch: None
- needsReview among choice questions: None
- Status: **PASS**

## 6. Constructed Response

| Year | Actual | Expected |
|---:|---:|---:|
| 111 | 10 | 10 |
| 112 | 10 | 10 |
| 113 | 10 | 10 |
| 114 | 10 | 10 |
| 115 | 11 | 11 |
| **Total** | **51** | **51** |

- Missing required fields: None
- needsReview: 51 questions
- Status: **FAIL**

## 7. 36 Lesson Content

- Lessons found: **36 / 36**
- Rich structured lesson: **Lesson 5 only**
- Content-depth FAIL lessons: **1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36**

The other lessons contain legacy fields such as `understand`, `lecture`, one example, one practice field, and `lastMinute`, but do not expose the requested 2–4 core concept teaching blocks, comparison table, multiple examples, and complete exercise set as structured content.

## 8. Main Course vs Supplement

- Main course: `data/curriculum.js` rendered by `syllabus.js`.
- Lesson 5 has a separate detailed data source: `data/lesson5.js`.
- No separate canonical supplement manifest was found in the social project folder.

## 9. Technical / Offline Audit

- index.html exists: **PASS**
- Missing local references: **None**
- CDN / external URL references: **None**
- No npm, server, or API dependency found in the static entry files.
- PDF files bundled inside this package: **0**
- GitHub Pages package (docs/index.html + docs/.nojekyll): **FAIL**
- Console, viewport, and visual overflow checks require a browser run; they are not claimed as PASS by this static audit script.

## 10. Browser Smoke Test

- index.html loaded at 390, 768, and 1440 px widths; 5 year tabs present; no horizontal overflow observed.
- syllabus.html exposed 36 directory buttons; first page rendered 4 lessons with 9 pages of pagination; no horizontal overflow observed.
- Console errors and full visual review are not captured by this static script.

## 10. Blockers

- 35 lessons are legacy/summary format; only Lesson 5 has the richer teaching schema.
- All 51 constructed-response questions remain needsReview=true.
- No docs/index.html + docs/.nojekyll package exists inside the social project folder.

## 11. Release Readiness

| Area | Status |
|---|---|
| Data count | PASS |
| Choice analysis | PASS |
| Constructed response | FAIL |
| Curriculum depth | FAIL |
| Offline local entry | PASS |
| GitHub Pages package | FAIL |

# FINAL STATUS: FAIL

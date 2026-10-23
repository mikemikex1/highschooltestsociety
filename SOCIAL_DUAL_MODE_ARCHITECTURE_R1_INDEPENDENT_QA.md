# SOCIAL DUAL-MODE ARCHITECTURE R1 INDEPENDENT QA

## Verdict

**SOCIAL 4A-R1 INDEPENDENT QA = FAIL**

Read-only post-fix revalidation. No product, content, official data, approved source, QA script, strict manifest, or freeze was modified.

## Results

| Gate | Result |
|---|---|
| Curriculum sidebar labels | PASS |
| A 解題底層 | PASS |
| B 公民經濟 | PASS |
| C 歷史 | PASS |
| D 地理 | PASS |
| Lesson partition | PASS |
| Exam sidebar | PASS |
| Sidebar mutual exclusion | PASS |
| Mode switch | PASS |
| Hash restore | PASS |
| Browser back/forward | PASS |
| Cross-links | PASS |
| Atomic groups | PASS |
| Only current curriculum unit mounted | PASS |
| Only current exam question/group mounted | PASS |
| Choice pre-submit leaks | 0 |
| Constructed pre-confirm leaks | 0 |
| Mobile 390 | FAIL |
| Desktop 1440 | PASS |
| Source integrity | PASS |
| Regression | PASS |

## Runtime evidence

- Curriculum headings now exactly render in order: `A 解題底層`, `B 公民經濟`, `C 歷史`, `D 地理`.
- Lesson partition is unchanged: A = 1–4, B = 5–18, C = 19–30, D = 31–36.
- Exam mode still exposes 115, 114, 113, 112, 111 in order and does not render the curriculum sidebar.
- Curriculum mode does not render the exam sidebar; exam mode does not render the curriculum sidebar.
- Current-only rendering, hash state, invalid-hash fallback, browser back/forward, cross-links, and atomic group behavior passed the recheck.
- Pre-submit choice and pre-confirm constructed answer leaks remained 0.
- Frozen counts remain Lessons 36/36, Official 326/326, Choice 275/275, Constructed 51/51, Practice 252/252, Approved import 72/72, Gold 12/12, Legacy P7 0, official answer mismatch 0.
- Strict verifier returned PASS with current gate weakening 0, manifest/freeze mismatches 0, import 72/72, Gold import 12/12, and regression 326/275/51/252.

## Blockers

### R1-001 — Curriculum 390px horizontal overflow

- **Area:** Responsive spot check, curriculum mode
- **Problem:** At a 390px viewport, the curriculum unit selector remains 260px wide and extends beyond the available 375px document width.
- **Expected:** No horizontal overflow at 390px; the drawer/sidebar labels and curriculum controls remain usable.
- **Actual:** `scrollWidth = 383`, `clientWidth = 375`; the unit `<select>` has a right edge around 383px.
- **Why this fails:** The required 390px responsive gate explicitly requires no horizontal overflow.


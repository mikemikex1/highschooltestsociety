# SOCIAL DUAL-MODE ARCHITECTURE INDEPENDENT QA

## Verdict

**SOCIAL DUAL-MODE ARCHITECTURE INDEPENDENT QA = FAIL**

Read-only verification of the current runtime and source. No product, content, official data, approved source, QA script, manifest, freeze, or runtime source was modified.

## Results

| Gate | Result |
|---|---|
| Curriculum mode | PASS |
| Past exams mode | PASS |
| Mode switch | PASS |
| Curriculum sidebar | FAIL |
| Exam sidebar | PASS |
| Hash restore | PASS |
| Browser back/forward | PASS |
| Invalid hash fallback | PASS |
| Curriculum → exam | PASS |
| Exam → curriculum | PASS |
| Atomic question groups | PASS |
| Only current curriculum unit mounted | PASS |
| Only current exam question/group mounted | PASS |
| Choice pre-submit leaks | 0 |
| Constructed pre-confirm leaks | 0 |
| Answer state isolation | PASS by keyed state/source inspection |
| Mobile 390 | PASS |
| Tablet 768 | PASS |
| Desktop 1440 | PASS |
| Accessibility | PASS |
| Source integrity | PASS |
| Regression | PASS |

## Runtime evidence

- Exam mode rendered only the current question for single-question state and preserved a shared 114 question-group as one atomic mounted group.
- Curriculum mode rendered one `.single-view-unit`; exam mode rendered no curriculum sidebar, and curriculum mode rendered no exam sidebar.
- Invalid curriculum and exam hashes deterministically fell back to a valid view without a blank screen or exception.
- Browser back restored curriculum state and forward restored exam state.
- URL state restored lesson/unit and year/question state.
- Viewport checks at 390, 768, and 1440 reported no horizontal overflow; mode controls were present at all sizes.
- Pre-submit DOM checks found no visible answer box, feedback, reasoning, or answer-guide fields. Constructed fields remained behind confirmation.
- Source inspection confirmed answer state is keyed by question ID, current-only rendering is used, and cross-links are hash links to canonical questions/lessons.
- Frozen regression values: Lessons 36/36, Official 326/326, Choice 275/275, Constructed 51/51, Practice 252/252, Approved import 72/72, Gold 12/12, Legacy P7 0, official mismatch 0.

## Blockers

### DM-001 — Curriculum sidebar labels

- **Area:** Curriculum sidebar
- **Problem:** The runtime renders the four headings as `解題底層`, `公民與社會`, `歷史`, and `地理`.
- **Expected:** The required sidebar headings are `A 解題底層`, `B 公民經濟`, `C 歷史`, and `D 地理`.
- **Actual:** There are no A/B/C/D prefixes, and the second heading is `公民與社會`, not `公民經濟`.
- **Why this fails:** The required curriculum navigation taxonomy and labels are not met, even though the lesson partition and mutual exclusion behavior are functional.


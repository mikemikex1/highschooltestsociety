# SOCIAL 4A-R2 Independent QA

Status: FAIL

## Scope

Read-only post-fix revalidation of the curriculum 390px responsive layout, exam-mode spot check, sidebar partition, core dual-mode behavior, answer hiding, and frozen regression counts. No product, source, runtime, QA, manifest, or freeze files were modified.

## Responsive measurements

| Viewport | Mode | scrollWidth | clientWidth | Result |
|---:|---|---:|---:|---|
| 390px | curriculum | 383 | 375 | FAIL |
| 768px | curriculum | 753 | 753 | PASS |
| 1440px | curriculum | 1425 | 1425 | PASS |
| 390px | exam | 375 | 375 | PASS |

At 390px curriculum (`#mode=curriculum&lesson=16&unit=7`), `.single-unit-nav select` measured:

- left: 123.48px
- right: 383.48px
- width: 260px
- clientWidth: 375px

The visible overflow scan found one unexpected element: the unit selector `<select>`. No intentional hidden drawer was counted.

## Sidebar and runtime checks

- Curriculum headings: `A 解題底層`, `B 公民經濟`, `C 歷史`, `D 地理` — PASS
- Lesson partition A 1–4, B 5–18, C 19–30, D 31–36 — PASS
- Exam sidebar years 115, 114, 113, 112, 111 — PASS
- Sidebar mutual exclusion — PASS
- Mode switch, hash restore, browser back/forward, cross-links — PASS
- Atomic question groups — PASS
- Current-only curriculum unit mount — PASS
- Current-only exam question/group mount — PASS
- Choice pre-submit leaks — 0
- Constructed pre-confirm leaks — 0

## Frozen regression

- Lessons: 36 / 36
- Official: 326 / 326
- Choice: 275 / 275
- Constructed: 51 / 51
- Practice: 252 / 252
- Approved import: 72 / 72
- Gold: 12 / 12
- Legacy P7: 0
- Official answer mismatch: 0
- Source integrity: PASS

## Blocker

### R2-001 — Curriculum 390px horizontal overflow

- Area: 390px curriculum runtime
- Problem: the unit selector extends beyond the viewport.
- Expected: `scrollWidth <= clientWidth`, selector right edge within `clientWidth`, and zero unexpected overflow elements.
- Actual: `scrollWidth=383`, `clientWidth=375`, selector `right=383.48px`, and one unexpected visible overflow element.
- Why wrong: this fails the required 390px responsive hard gate.

## Final result

`SOCIAL 4A-R2 INDEPENDENT QA = FAIL`

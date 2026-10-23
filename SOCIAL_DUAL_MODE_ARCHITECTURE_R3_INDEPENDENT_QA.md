# SOCIAL 4A-R3 Independent QA

Status: PASS

## Scope

Read-only final responsive geometry revalidation after the R2 390px overflow fix. No existing source, product, content, QA, manifest, or freeze files were modified.

## Geometry results

### 390px curriculum

URL: `#mode=curriculum&lesson=16&unit=7`

- `window.innerWidth`: 390
- `document.documentElement.clientWidth`: 375
- `document.documentElement.scrollWidth`: 375
- Horizontal overflow: 0
- Unit selector left: 123.48px
- Unit selector right: 251.19px
- Unit selector width: 127.71px
- Computed width: 127.708px
- Computed max-width: 100%
- Computed min-width: 0px
- Computed box-sizing: border-box
- Unexpected visible overflow elements: 0

### Viewport regression

| Viewport | Mode | scrollWidth | clientWidth | Result |
|---:|---|---:|---:|---|
| 390px | curriculum | 375 | 375 | PASS |
| 768px | curriculum | 753 | 753 | PASS |
| 1440px | curriculum | 1425 | 1425 | PASS |
| 390px | exam | 375 | 375 | PASS |

## CSS/source checks

- The final mobile `.single-unit-nav` override appears after the legacy unit-navigation declarations.
- The winning mobile selector rule sets `min-width: 0`, `max-width: 100%`, `width: 100%`, and `box-sizing: border-box`.
- No later `.single-unit-nav select` rule restores `min-width: 260px`.
- No `html { overflow-x: hidden }`, `body { overflow-x: hidden }`, or equivalent overflow-hiding rule was found.
- Source integrity: PASS; protected regression and strict-integrity checks remained unchanged.

## Sidebar and core regression

- Curriculum labels: `A 解題底層`, `B 公民經濟`, `C 歷史`, `D 地理` — PASS
- Lesson partition: A 1–4, B 5–18, C 19–30, D 31–36 — PASS
- Exam sidebar and mutual exclusion — PASS
- Mode switch — PASS
- Hash restore — PASS
- Browser back/forward — PASS
- Curriculum → exam and exam → curriculum cross-links — PASS
- Atomic groups — PASS
- Only current curriculum unit mounted — PASS
- Only current exam question/group mounted — PASS
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
- Regression: PASS

## Final result

`SOCIAL 4A-R3 INDEPENDENT QA = PASS`

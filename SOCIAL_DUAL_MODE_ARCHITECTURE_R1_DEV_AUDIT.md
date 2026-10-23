# SOCIAL DUAL-MODE ARCHITECTURE R1 DEV AUDIT

## Result

SOCIAL 4A-R1 SIDEBAR FIX: PASS

## Curriculum sidebar labels

The curriculum sidebar display taxonomy now uses the exact ordered labels:

1. A 解題底層
2. B 公民經濟
3. C 歷史
4. D 地理

The existing lesson partition is unchanged: Lessons 1–4, 5–18, 19–30, and 31–36.

## Regression

- Curriculum mode: PASS
- Exam mode: PASS
- Mode switch regression: PASS
- Curriculum sidebar: PASS
- Exam sidebar unchanged: PASS; year navigation remains 111, 112, 113, 114, 115.
- Hash restore: PASS
- Cross-links: PASS
- Atomic groups: PASS
- Pre-submit answer leaks: 0
- Lessons: 36 / 36
- Official: 326 / 326
- Choice: 275 / 275
- Constructed: 51 / 51
- Practice: 252 / 252
- Approved import: 72 / 72
- Gold: 12 / 12
- Legacy P7: 0
- Official answer mismatch: 0

## Scope protection

Only the curriculum sidebar display label mapping in `app.js` was changed. Lesson content, official data, approved sources, Gold content, exam sidebar, routing, cross-links, answer state, answer hiding, strict QA scripts, manifest, and freeze artifacts were not modified. Independent QA was not executed.

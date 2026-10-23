# SOCIAL DUAL-MODE ARCHITECTURE R2 DEV AUDIT

## Result

SOCIAL 4A-R2 RESPONSIVE FIX: PASS

## 390px unit selector

- 390 horizontal overflow: PASS
- scrollWidth: 375
- clientWidth: 375
- Horizontal overflow: 0
- Unit selector contained: PASS

At the mobile breakpoint, the immediate unit-navigation label and selector can shrink, and the selector is constrained to `width: 100%`, `max-width: 100%`, `min-width: 0`, and `box-sizing: border-box`. The desktop selector sizing remains unchanged.

## Viewport regression

- Tablet 768: PASS
- Desktop 1440: PASS

## Functional regression

- Curriculum sidebar labels: PASS
- Exam sidebar: PASS
- Mode switch: PASS
- Hash restore: PASS
- Back/forward: PASS
- Cross-link: PASS
- Atomic groups: PASS
- Only current curriculum unit mounted: PASS
- Only current exam question/group mounted: PASS
- Pre-submit answer leaks: 0

## Frozen counts

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

## Scope protection

Only responsive CSS for the curriculum unit selector and its immediate layout container was changed. Canonical content, official data, answers, approved JSON, Gold content, routing, cross-links, exam sidebar, answer hiding, QA scripts, strict manifest, and freeze artifacts were not modified. Independent QA was not executed.

# SOCIAL DUAL-MODE ARCHITECTURE R3 DEV AUDIT

## Result

SOCIAL 4A-R3 RESPONSIVE ROOT-CAUSE FIX: PASS

## Root cause

The R2 rule used the correct selector and mobile media query, but it was inserted before the pre-existing Single View CSS block. That later block contained the equal-specificity `.single-unit-nav select` declarations, including `min-width:260px` and the mobile `max-width:none`. Source order therefore made the later legacy rule win at runtime. This was a CSS order issue (C), not an unmatched selector, missed media query, inline style, or parent grid sizing defect.

## Winning rule before fix

- Selector: `.single-unit-nav select`
- Rule: `min-width:260px; max-width:48vw`
- Later mobile rule: `display:block; width:100%; max-width:none`
- Specificity: same selector specificity as the R2 override
- Result: computed width remained 260px and the selector right edge reached 383.48px while the document client width was 375px.

## Winning rule after fix

The final rule is placed after all legacy unit-navigation declarations:

```css
@media(max-width:850px){
  .single-unit-nav{min-width:0;max-width:100%;flex-wrap:wrap}
  .single-unit-nav label{min-width:0;max-width:100%;width:100%}
  .single-unit-nav select{display:block;width:100%;max-width:100%;min-width:0;box-sizing:border-box}
}
```

## Viewport regression

### 390px curriculum

- innerWidth: 390
- clientWidth: 375
- scrollWidth: 375
- selector left: 12
- selector right: 363
- selector width: 351
- unexpected overflow elements: 0
- horizontal overflow: PASS

### Other viewports

- Tablet 768: PASS
- Desktop 1440: PASS
- Exam mode at 390: PASS

## 4A regression

- Curriculum sidebar labels: PASS
- Lesson partition: PASS
- Exam sidebar: PASS
- Mode switch: PASS
- Hash regression: PASS
- Browser back/forward: PASS
- Cross-links: PASS
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

Only responsive CSS for the curriculum unit navigation was changed. Canonical content, official data, answers, approved JSON, Gold content, routing, cross-links, answer hiding, QA scripts, strict manifest, and freeze artifacts were not modified. Independent QA was not executed.

# SINGLE VIEW AND ANSWER STRUCTURE AUDIT

## Result

SINGLE VIEW + ANSWER STRUCTURE: PASS

## Structural checks

- lessonCount: PASS
- builderExists: PASS
- onlyCurrentUnitMounted: PASS
- atomicQuestionGroups: PASS
- materialAndQuestionTogether: PASS
- unitTypes: PASS
- hashRestore: PASS
- prevNext: PASS
- mobileDrawer: PASS
- desktopSidebar: PASS
- contentWidth: PASS
- regressionOfficial: PASS
- regressionChoice: PASS
- regressionConstructed: PASS
- regressionPractice: PASS

## Atomic and navigation behavior

- The runtime builds units from canonical lesson content at render time.
- Only `currentUnit` is rendered into the main unit article; the rest are navigation labels only.
- Shared-material question groups stay in one unit and render each canonical question inside that unit.
- Lesson/unit hashes use `#lesson=<lesson>&unit=<unit>` and restore on reload/back navigation.

## Answer gate regression

- status: PASS
- pre-submit leaks: reported by existing gate
- post-submit reveal: reported by existing gate
- reset: reported by existing gate

## Regression counts

- Official: 326 / 326
- Choice: 275 / 275
- Constructed: 51 / 51
- Original practice: 252 / 252

## Notes

- Browser smoke verification was performed on the local file page for hash restore and the single-unit shell; the existing answer-flow QA remains the authority for submit/reset behavior.
- No canonical question, constructed-response, lesson-content, or answer-hiding QA data was edited by this script.

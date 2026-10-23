# SOCIAL GitHub Pages R2 Republish Audit

- Repository: `https://github.com/mikemikex1/highschooltestsociety.git`
- Branch: `main`
- Pages source: `main / docs`
- Commit: `d66732d4d45e3b872b28477c1385c5c1e3ac8097`
- Push: pending
- Public URL: `https://mikemikex1.github.io/highschooltestsociety/`

## Release checks

- Docs sync: PASS
- Source/docs parity: PASS for `index.html`, `styles.css`, `app.js`, `data/supplementary.js`, `data/years.js`, `data/constructed-response.js`, `data/curriculum.js`, and `data/lesson-content.js`
- Docs supplementary runtime: PASS
- Public smoke: pending deployment after release push

## Supplementary smoke

- Total: 149
- Civics: 32
- Economics: 30
- History: 51
- Geography: 36
- GDP top result: GDP
- GIS top result: GIS
- 同盟國 top result: 同盟國
- World War II top result: 第二次世界大戰
- Child/formal explanation render: PASS
- Historical members/opponents render: PASS

## Responsive smoke

| Viewport | scrollWidth | clientWidth | Result |
|---|---:|---:|---|
| 320 | 305 | 305 | PASS |
| 390 | 375 | 375 | PASS |
| 768 | 753 | 753 | PASS |
| 1440 | 1425 | 1425 | PASS |

## Frozen regression and integrity

- Choice pre-submit leaks: 0
- Constructed pre-confirm leaks: 0
- Lessons: 36 / 36
- Official: 326 / 326
- Choice: 275 / 275
- Constructed: 51 / 51
- Practice: 252 / 252
- Approved import: 72 / 72
- Gold: 12 / 12
- Legacy P7: 0
- Official answer mismatch: 0
- Strict verifier: PASS
- Current gate weakening: 0
- Manifest mismatch: 0
- Freeze mismatch: 0
- Historical incident preserved: YES

## Staging policy

Only production source/runtime files under the repository root and `docs/`, plus this release audit, are intended for the release commit. Existing historical QA/DEV reports remain outside the commit.

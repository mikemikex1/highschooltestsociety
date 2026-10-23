# SOCIAL GitHub Pages R1 Republish Audit

## Release scope

Production runtime from the 4C-R1-R2 QA-passed working tree was synchronized to `docs/`. The sync included only website runtime files: `index.html`, `styles.css`, `app.js`, `data/`, and `assets/`. QA reports and development artifacts were kept outside `docs/`.

## Release checks

- Repository: `https://github.com/mikemikex1/highschooltestsociety.git`
- Branch: `main`
- Remote: `origin`
- Pages source: `main / docs`
- `docs/data/supplementary.js`: present and source-parity matched
- Source/docs parity for required runtime files: PASS
- Docs curriculum route: PASS
- Docs exam route: PASS
- Docs supplementary route: PASS
- Docs supplementary query `q=GDP`: PASS
- Docs L14 civics visual: PASS
- Docs 390px overflow: `scrollWidth=375`, `clientWidth=375`
- Docs 1440px overflow: `scrollWidth=1425`, `clientWidth=1425`
- Light/dark toggle: PASS
- Fresh strict verifier: PASS
- Current gate weakening: `0`
- Manifest mismatch: `0`
- Freeze mismatch: `0`

## Frozen regression

- Lessons: `36 / 36`
- Official: `326 / 326`
- Choice: `275 / 275`
- Constructed: `51 / 51`
- Practice: `252 / 252`
- Approved import: `72 / 72`
- Gold: `12 / 12`
- Legacy P7: `0`
- Official answer mismatch: `0`
- Choice pre-submit leaks: `0`
- Constructed pre-confirm leaks: `0`

## Public release

- Public URL: `https://mikemikex1.github.io/highschooltestsociety/`
- Commit: final release HEAD recorded in the release result
- Push: recorded in the companion JSON after push
- Public smoke: recorded after deployment propagation; this audit does not substitute for 5B Public Independent QA.

No offline version was created. No approved source, official data, answer data, strict verifier, manifest, or freeze artifact was modified.

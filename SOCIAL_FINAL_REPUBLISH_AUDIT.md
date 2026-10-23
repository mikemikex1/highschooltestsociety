# SOCIAL Final Republish Audit

Date: 2026-10-24

## Release scope

- Synced the production runtime from the repository root into `docs/`.
- Included production `data/` and `assets/`, including the supplementary data, V-valley photo, and L30 basemap assets.
- Excluded reports, temporary files, caches, offline packages, attachments, and test-server files from `docs/` and the release staging set.

## Checks

- Source/docs parity: PASS for the required runtime files and all source asset hashes.
- Required assets in `docs/assets/`: PASS.
- `node --check app.js`: PASS.
- `git diff --check`: PASS.
- Strict verifier: PASS; current gate weakening 0, manifest mismatch 0, freeze mismatch 0.
- Frozen regression counts: official 326, choice 275, constructed 51, practice 252, approved import 72, gold 12, legacy P7 0, leaks 0.

## Release smoke

Targeted public smoke after publication: PASS. GitHub Pages returned HTTP 200 for the root, curriculum/exam/supplementary hash entry URLs, GDP query entry URL, `app.js`, `data/supplementary.js`, Europe and world basemaps, and the L31 V-valley photo.

Release commit: `c67defc` (`release: republish final social studies runtime`).
Push: PASS to `origin/main`.

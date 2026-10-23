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

Targeted release smoke covers the required production routes and assets after publication. Public Pages availability is recorded after the push in the accompanying JSON audit.

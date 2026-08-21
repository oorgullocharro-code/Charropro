# Files Changed

## Functional metadata

- `js/data/fmch2026ManganasPasoRules.js`: confirms the existing single Contra mascara identity at 14 points and prohibits duplicate simultaneous selection.
- `js/data/ruleProfiles.js`: adds certified FieldID mappings, non-sporting control classifications and certification metadata while preserving `draft`, `activationReady:false`, 731 rules and all sporting values.

## Tests

- `tests/fmch-2026-cala-scorer.test.mjs`
- `tests/fmch-2026-manganas-paso-scorer.test.mjs`
- `tests/fmch-2026-piales-coleadero-scorer.test.mjs`
- `tests/fmch-2026-rule-profile-certification.test.mjs`
- `tests/rule-profile-engine.test.mjs`

These tests verify alias resolution, control classification, three active coleadores, the single Contra mascara identity, P0 closure, profile state and unchanged effective sporting fingerprints.

## Updated certification evidence

- `CHARROPRO-FMCH-2026-RULE-PROFILE-SPORTING-BLOCKERS-CERTIFICATION-001/EVIDENCE_MATRIX.md`
- `CHARROPRO-FMCH-2026-RULE-PROFILE-SPORTING-BLOCKERS-CERTIFICATION-001/CERTIFICATION_RECORD.md`
- `CHARROPRO-FMCH-2026-RULE-PROFILE-SPORTING-BLOCKERS-CERTIFICATION-001/CERTIFICATION_RECORD.json`
- `CHARROPRO-FMCH-2026-RULE-PROFILE-SPORTING-BLOCKERS-CERTIFICATION-001/AUDIT_SUMMARY.md`

## Resolution evidence

- `CHARROPRO-FMCH-2026-RULE-PROFILE-SPORTING-BLOCKERS-RESOLUTION-002/OFFICIAL_SOURCE_REVIEW.md`
- `CHARROPRO-FMCH-2026-RULE-PROFILE-SPORTING-BLOCKERS-RESOLUTION-002/SPORTING_VALUES_COMPARISON.md`
- `CHARROPRO-FMCH-2026-RULE-PROFILE-SPORTING-BLOCKERS-RESOLUTION-002/TEST_RESULTS.md`
- `CHARROPRO-FMCH-2026-RULE-PROFILE-SPORTING-BLOCKERS-RESOLUTION-002/FILES_CHANGED.md`

Total files: `15`.

No Firebase Rules, application UI, scoring calculations, timer, flow, publication, portal, Broadcast, dependency or production configuration file changed.

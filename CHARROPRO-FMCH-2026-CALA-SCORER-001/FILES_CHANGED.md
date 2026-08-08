# Files Changed

## Functional product changes

| File | Reason |
| --- | --- |
| `js/data/calaRules.js` | Confirmed FMCH Cala catalog and Punta decimal normalization |
| `js/data/ruleProfiles.js` | Cala-only `FMCH_2026_LIBRE` profile version `0.2.0`, still draft |
| `js/data/suertes.js` | Expose team-infractions through the resolved catalog |
| `js/app.js` | Resolved Cala controls, repeatable quantities, stable DQ identity, decimal Punta input |
| `js/core/state.js` | Draft fields for Punta detail, DQ RuleID, and quantities |
| `js/core/scoring.js` | Approved shared DQ total contract and Punta detail |
| `js/core/scoringAttempt.js` | Attempt V2 quantities, DQ identity, and frozen Punta detail |
| `css/styles.css` | Minimal styles for repeatable rules and decimal Punta control |
| `tools/development/localRuntimeSeed.mjs` | Explicit emulator-only FMCH Cala fixture; canonical profile remains draft |

## Tests

| File | Reason |
| --- | --- |
| `tests/fmch-2026-cala-scorer.test.mjs` | Dedicated FMCH Cala reconciliation suite |
| `tests/cala-rules.test.mjs` | Punta and migration regression |
| `tests/rule-profile-engine.test.mjs` | FMCH profile and shared DQ regression |
| `tests/scoring-attempt-v2.test.mjs` | DQ contract and Attempt V2 regression |
| `tests/scorer-responsive-components.test.mjs` | Responsive scorer and DQ summary regression |
| `tests/local-runtime-seed.test.mjs` | Emulator-only profile fixture validation |
| `tests/fixtures/scorer-responsive-viewport.html` | Real scorer viewport validation and one-pixel browser-rounding tolerance |

Other modified tests contain only the ticket cache identity unless the final diff inventory states otherwise.

## Client version propagation

HTML and JavaScript entrypoints/importers that changed only from
`20260808-scorer-responsive-component-system-001-v1` to
`20260808-fmch-2026-cala-scorer-001-v1` are cache-buster changes. They do not alter navigation, rendering, sports calculation, Firebase behavior, public behavior, Broadcast behavior, or operator workflows.

## Documentation

- `FMCH_2026_CALA_IMPLEMENTATION.md`
- `FMCH_2026_CALA_RULE_RECONCILIATION.md`
- `FMCH_2026_CALA_FIELDID_MAP.md`
- `FMCH_2026_CALA_PUNTA_PRESERVATION.md`
- `FMCH_2026_CALA_TEST_EVIDENCE.md`
- `FMCH_2026_CALA_BLOCKED_SOURCE_ITEMS.md`
- `FILES_CHANGED.md`

Visual evidence is stored in:

- `evidence/desktop-cala.png`
- `evidence/ipad-landscape-cala.png`
- `evidence/ipad-portrait-cala.png`

## Explicit absences

- No Firebase Rules or Firebase route changes.
- No dependency changes.
- No production profile activation.
- No historical migration or recalculation.
- No production writes, deploy, or push.
- No new functional engine.

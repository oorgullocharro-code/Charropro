# Files changed

## Functional client files

- `js/core/manganasFaenaScoring.js`: faena settlement, technical remate, event evidence, and official validation domain.
- `js/data/fmch2026ManganasPasoRules.js`: separate practical manual additional authority with legacy fallback.
- `js/core/scoringAttempt.js`: freezes corrected Manganas fields in Attempt V2 / Official Score.
- `js/core/state.js`: initializes corrected optional Manganas fields.
- `js/app.js`: practical scorer capture, single faena settlement, publication guard, and remate validation.
- `css/styles.css`: responsive Manganas-only controls.

The post-deploy visibility correction remains limited to `js/app.js`, `css/styles.css`, the directed Manganas test, ticket evidence, and mechanical build propagation. It separates technical remate capture from scoring effects and adds quick documentary capture without changing points.

The later publication correction changes only `js/core/manganasFaenaScoring.js` functionally: `removeTimeSettlement()` now normalizes optional `applied` and `ruleQuantities` collections before settlement cleanup. The directed test preserves the physical sparse third-opportunity payload and its Official Score result.

## Tests

- `tests/fmch-manganas-time-remate-practical-capture.test.mjs`
- `tests/fmch-2026-manganas-paso-scorer.test.mjs`
- `tests/scoring-ui-final-polish.test.mjs`

Build identity propagation is mechanical and is recorded separately by the canonical release authority. No RTDB Rules or Functions runtime source changed.

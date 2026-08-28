# Files Changed

## Implementacion funcional autorizada

- `js/app.js`
- `js/core/history.js`
- `js/core/officialFormat.js`
- `js/core/scoring.js`
- `js/core/state.js`
- `js/core/sync.js`
- `js/core/ternaParticipantIdentity.js`
- `js/data/fmch2026TernaRules.js`

## Pruebas autorizadas

- `tests/fmch-terna-federation-official-score-recovery.test.mjs`
- `tests/official-format-authoritative-snapshot.test.mjs`
- `tests/official-format-semantic-field-certification.test.mjs`
- `tests/terna-operational-flow.test.mjs`

## Release mecanico

- `functions/configuration.defaults.json` actualiza build, checksum y fingerprint
  de configuracion.
- Los imports relativos de `fixtures/`, `js/` y `tests/` actualizan solamente
  su query `?v=` mediante `tools/release/applyClientBuildVersion.mjs`.
- Las expectativas de identidad de build se actualizan al mismo valor canonico.
- Esta carpeta contiene la evidencia documental de cierre.

No se modifican reglas, Functions runtime, perfiles deportivos, Timer,
lifecycle, RuleIDs ni FieldIDs.

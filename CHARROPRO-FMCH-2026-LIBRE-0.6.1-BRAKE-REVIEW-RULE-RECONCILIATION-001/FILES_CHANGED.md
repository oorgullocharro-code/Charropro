# Files Changed

## Autoridad y datos

- `js/data/fmch2026BrakeReviewRules.js`: matriz ejecutable, RuleID nuevos,
  aliases y ownership de fase.
- `js/data/ruleProfiles.js`: conserva `0.6.0`, registra `0.6.1` y agrega consulta
  desacoplada por fase.
- `functions/ruleProfileCertificationRegistry.json`: certificado local y
  versionado de `0.6.1`; no fue desplegado.

## Pruebas

- `tests/fmch-2026-0.6.1-brake-review-rules.test.mjs`
- `tests/fmch-2026-0.6.1-brake-review-dq.test.mjs`
- `tests/fmch-2026-0.6.1-brake-review-phase.test.mjs`
- `tests/fmch-2026-0.6.1-backward-compatibility.test.mjs`
- `tests/fmch-2026-0.6.1-fingerprint.test.mjs`
- `tests/fmch-2026-0.6.1-fieldid-integrity.test.mjs`

## Documentacion

Esta carpeta contiene los ocho documentos exigidos por el ticket.

No se modificaron `calaRules.js`, Timer Engine, Flow Engine, scorer, Formato
Federacion, RTDB Rules, Functions runtime ni configuracion productiva.

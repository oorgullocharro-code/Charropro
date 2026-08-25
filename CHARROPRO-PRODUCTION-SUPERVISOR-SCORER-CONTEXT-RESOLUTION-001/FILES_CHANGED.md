# Files Changed

## Logica y UI

- `js/core/scorerContextResolution.js`: resolver puro y estados.
- `js/app.js`: gates, diagnostico, creacion y recuperacion.
- `js/core/firebaseSync.js`: error explicito de lectura de torneo.
- `js/core/state.js`: firma de cache contextual.
- `css/styles.css`: acciones y diagnostico responsive.

## Pruebas

- Cuatro suites nuevas del ticket.
- `tests/terna-rule-catalog-resolution-audit-003.test.mjs`: expectativa arquitectonica actualizada.

## Build

- `functions/configuration.defaults.json`: autoridad canonica, checksum y fingerprint.
- Consumidores bajo `js/`, `fixtures/` y `tests/`: solo imports/expectativas mecanicas derivados por `applyClientBuildVersion.mjs`.

## Documentacion

- Los 18 archivos de esta carpeta.

El manifiesto exacto se congela mediante `git diff --cached --name-status` antes del commit.

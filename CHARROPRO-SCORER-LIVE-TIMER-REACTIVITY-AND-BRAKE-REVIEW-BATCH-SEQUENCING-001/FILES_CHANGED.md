# Files Changed

## Cambios funcionales

- `js/app.js`: reconciliacion reactiva del Timer y secuencia batch de Brake Review.
- `js/core/officialTimerOrchestration.js`: snapshot y reconciliacion compartida del consumidor.
- `js/core/brakeReviewPhase.js`: estado derivado del lote y confirmacion de DQ.
- `js/core/firebaseSync.js`: cierre del timer al confirmar DQ mediante la autoridad existente.

## Pruebas

- `tests/scorer-live-timer-brake-review-batch.test.mjs`: cobertura nueva end-to-end en memoria.
- `tests/brake-review-to-cala-transition.test.mjs`: expectativa actualizada al gate global.

## Build

- `functions/configuration.defaults.json`: autoridad canonica, checksum y fingerprint del build.
- Imports relativos bajo `js/`, `fixtures/` y `tests/`: propagacion mecanica mediante `tools/release/applyClientBuildVersion.mjs`.
- Expectativas de identidad de build: actualizacion mecanica al valor canonico.

## Evidencia

- Nueve documentos dentro de esta carpeta.

No se modificaron RTDB Rules, Firebase Functions, perfiles, FieldIDs, lifecycle ni valores deportivos.

# Files Changed

## Logica

- `js/core/timerRules.js`: autoridad inicial limitada a Brake Review y seleccion de nueva oportunidad.
- `js/core/firebaseSync.js`: contexto temporal seguro en `live/current`.
- `js/core/officialTimerLiveDisplay.js`: actualizacion compartida de nodos DOM.
- `js/app.js`: ticker oficial basado en DOM montado.

## Pruebas

- `tests/pre-cala-brake-review-timer-context-blocker-003.test.mjs`.
- `tests/fixtures/official-timer-dom-runtime.html`.

## Configuracion y build

- `functions/configuration.defaults.json`: nueva autoridad de build y checksum.
- Tests de integridad/version que fijan el build canónico.
- Imports internos en `js/`, `fixtures/` y `tests/`: propagacion mecanica mediante `tools/release/applyClientBuildVersion.mjs`.

## Evidencia

- Carpeta `CHARROPRO-PRE-CALA-BRAKE-REVIEW-TIMER-AUTHORITY-CONTEXT-BLOCKER-003/`.

No se modificaron `firebase-rules-auditoria.json`, `functions/index.js`, definiciones deportivas, Rule Profile, FieldIDs, lifecycle ni assignments.

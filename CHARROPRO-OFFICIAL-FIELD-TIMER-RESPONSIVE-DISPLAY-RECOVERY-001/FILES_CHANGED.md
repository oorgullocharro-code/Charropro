# Files Changed

## Correctivo funcional

- `css/styles.css`: geometria container-aware de la pantalla de campo.
- `js/views/cronometro-pantalla.js`: aplica formato exclusivo de campo a la vista oficial y fallback local.
- `js/core/officialFieldTimerDisplay.js`: formatter presentacional de segundos/minutos para esta salida.
- `tests/official-field-timer-responsive-display.test.mjs`: contrato dirigido.
- `tests/fixtures/official-field-timer-responsive.html`: fixture DOM visual.

## Build mecanico

- `functions/configuration.defaults.json`: appVersion y checksum canonicos.
- Modulos y tests versionados por `tools/release/applyClientBuildVersion.mjs`: solo cambio de query `?v=` y expectativas explicitas del build.

## Documentacion

- Esta carpeta de cierre.

## Fronteras no modificadas

- `firebase-rules-auditoria.json`
- Firebase Functions runtime
- Timer Authority y `js/core/officialTimerLiveDisplay.js`
- scoring, Attempt V2 y politica temporal
- perfiles FMCH, sporting values, RuleIDs y FieldIDs
- `grafico-cronometro.html`

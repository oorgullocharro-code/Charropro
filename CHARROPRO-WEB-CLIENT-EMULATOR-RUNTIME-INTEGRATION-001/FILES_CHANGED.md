# Archivos Cambiados

## Funcionales

- `js/core/firebaseRuntime.js`: resolución y guardas del runtime local.
- `js/core/firebaseSync.js`: app local nombrada y conexión Auth/RTDB/Functions Emulator.
- `js/app.js`, `js/views/jueces.js`, `css/styles.css`: identificación visible LOCAL.
- `tools/development/localRuntimeSeed.mjs`: usuarios y datos sintéticos idempotentes.
- `tools/development/localWebServer.mjs`: servidor loopback sin caché.
- `tools/development/charropro-development.mjs`: comandos seed, reset y web.
- `tests/firebase-runtime-local.test.mjs`, `tests/local-runtime-seed.test.mjs`: guardas y fixtures.
- `functions/officialScoreConcurrency.js`, `functions/index.js` y `tests/official-score-concurrency.test.mjs`: conversión segura en el borde de transacciones RTDB para que el objeto interno sin prototipo no sea rechazado por el Admin SDK del Emulator. No cambia reglas, cálculo, contrato deportivo ni flujo visible.

## Versionado de entradas

`index.html`, `torneo.html`, `jueces.html` y `js/tournamentApp.js` reciben el cache-buster del ticket para impedir cargar el módulo previo desde caché.

## Excluido del commit de este ticket

- `CHARROPRO-FMCH-CURRENT-SCORER-FUNCTIONAL-AUDIT-001/`: auditoría preexistente, sin tocar.

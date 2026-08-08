# Files Changed

## Funcionales

- `js/core/scoringAttempt.js`: nuevo contrato puro V2, adapter legacy, identidad, estados, calculo declarativo, DQ reversible, clasificacion dinamica, validacion, serializacion y snapshot official.
- `js/core/scoring.js`: extrae el resumen central legacy de puntos sin cambiar resultados.
- `js/app.js`: agrega el snapshot V2 al breakdown official y evita que DQ borre captura.
- `js/core/firebaseSync.js`: conserva `breakdown.attemptV2` en la compactacion durable.
- `tests/scoring-attempt-v2.test.mjs`: cobertura del contrato y compatibilidad.

## Documentacion

- `SCORING_ATTEMPT_V2_ARCHITECTURE.md`.
- `SCORING_ATTEMPT_V2_DATA_CONTRACT.md`.
- `SCORING_ATTEMPT_V2_LEGACY_COMPATIBILITY.md`.
- `SCORING_ATTEMPT_V2_STATE_SEMANTICS.md`.
- `SCORING_ATTEMPT_V2_TEST_EVIDENCE.md`.
- `FILES_CHANGED.md`.

## Cache-buster

Token nuevo: `20260808-scoring-attempt-model-v2-001-v1`.

Los entrypoints, imports transitivos y expectativas de identidad de pruebas cambian solo de token para impedir coexistencia de instancias anteriores. `js/core/scoring.js`, `js/app.js` y `js/core/firebaseSync.js` tambien contienen los cambios funcionales descritos arriba.

Archivos exclusivamente de cache-buster o expectativa de identidad:

- `announcer-monitor.html`
- `broadcast-studio.html`
- `cronometro-pantalla.html`
- `cronometro.html`
- `formato-federacion.html`
- `grafico-cala-detalle.html`
- `grafico-caladero-turno.html`
- `grafico-categoria.html`
- `grafico-coleadero-turno.html`
- `grafico-coleadero.html`
- `grafico-cronometro.html`
- `grafico-marcador.html`
- `grafico-ranking.html`
- `grafico-turno.html`
- `graficos.html`
- `index.html`
- `js/broadcast/announcerMonitor.js`
- `js/broadcast/broadcastStudioWorkspace.js`
- `js/broadcast/outputSynchronization.js`
- `js/broadcast/productionConsole.js`
- `js/broadcast/programMainOutput.js`
- `js/core/exporters.js`
- `js/core/flow.js`
- `js/core/history.js`
- `js/core/officialFormat.js`
- `js/core/state.js`
- `js/core/statistics.js`
- `js/core/sync.js`
- `js/data/suertes.js`
- `js/publicPortal/portalApp.js`
- `js/tournamentApp.js`
- `js/views/cronometro-control.js`
- `js/views/cronometro-pantalla.js`
- `js/views/formato-federacion.js`
- `js/views/grafico.js`
- `js/views/graficos-control.js`
- `js/views/jueces.js`
- `js/views/locutores.js`
- `js/views/obs.js`
- `js/views/supervision.js`
- `js/views/torneo-publico.js`
- `jueces.html`
- `locutores.html`
- `obs.html`
- `production-console.html`
- `program-main-output.html`
- `supervision.html`
- `tests/announcer-monitor.test.mjs`
- `tests/broadcast-studio-workspace.test.mjs`
- `tests/output-synchronization.test.mjs`
- `tests/production-console.test.mjs`
- `tests/public-live-feed-integration.test.mjs`
- `tests/public-portal-core.test.mjs`
- `tests/public-snapshot-cache-coherence.test.mjs`
- `tests/team-penalties-zero.test.mjs`
- `torneo-publico.html`
- `torneo.html`

## Resumen

- 4 archivos funcionales de producto, incluido 1 nuevo.
- 1 test funcional nuevo.
- 6 documentos nuevos.
- 57 archivos exclusivamente de cache-buster/expectativas.
- 68 rutas totales.

## Excluidos

- Firebase Rules, Functions y rutas.
- Migraciones y escrituras productivas.
- UI y footer.
- Reglas deportivas, FieldID y equivalencias FMCH.
- Portal Publico y Broadcast, salvo cache-busters transitivos.
- Resultados, ranking, estadisticas y exportadores, salvo cache-busters transitivos.
- Dependencias.

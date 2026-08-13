# Files Changed

## Archivos funcionales

- `firebase-rules-auditoria.json`: validación atómica de ownership, revisión y transiciones del timer oficial.
- `js/core/timerRules.js`: autoridad temporal, estados, comandos, ownership, takeover/handoff, proyección y contextos.
- `js/core/firebaseSync.js`: persistencia transaccional, CAS, idempotencia y suscripción RTDB.
- `js/core/sync.js`: selección y proyección de la autoridad en el contexto live.
- `js/core/state.js`: estado normalizado de timers oficiales.
- `js/app.js`: Scorer sincronizado, controles de respaldo y contexto live.
- `js/views/cronometro-control.js`: Remote principal, ACK, selector, ownership y reconexión.
- `js/views/cronometro-pantalla.js`: Timer Display consumidor.
- `js/broadcast/announcerMonitor.js`: consumo de estado y motivo de pausa.
- `js/broadcast/outputRouting.js`: transporte de la proyección oficial.
- `css/styles.css`: botón circular y responsive del Remote/Scorer.

## Integración y compatibilidad

- `js/broadcast/broadcastStudioWorkspace.js`
- `js/broadcast/outputSynchronization.js`
- `js/broadcast/productionConsole.js`
- `js/broadcast/programMainOutput.js`
- `js/core/exporters.js`
- `js/core/flow.js`
- `js/core/history.js`
- `js/core/officialFormat.js`
- `js/core/scorerComponents.js`
- `js/core/scoring.js`
- `js/core/statistics.js`
- `js/data/ruleProfiles.js`
- `js/data/suertes.js`
- `js/tournamentApp.js`
- `js/views/formato-federacion.js`
- `js/views/grafico.js`
- `js/views/graficos-control.js`
- `js/views/jueces.js`
- `js/views/locutores.js`
- `js/views/obs.js`
- `js/views/supervision.js`

Los cambios de estos archivos se limitan a propagación del contrato/imports y cache-busters necesarios. `FMCH_2026_LIBRE 0.6.0` se conserva.

## Entrypoints y cache-busters

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
- `jueces.html`
- `locutores.html`
- `obs.html`
- `production-console.html`
- `program-main-output.html`
- `supervision.html`
- `torneo-publico.html`
- `torneo.html`
- `js/publicPortal/portalApp.js`
- `js/views/torneo-publico.js`
- `functions/configuration.defaults.json`: checksum canónico actualizado para la versión aprobada de configuración.

Token final: `20260811-official-timer-authority-sync-001-v1`.

## Pruebas

- `tests/official-timer-authority-sync.test.mjs` (nuevo)
- `tests/announcer-monitor.test.mjs`
- `tests/broadcast-studio-workspace.test.mjs`
- `tests/fixtures/fmch-jineteos-runtime.html`
- `tests/fixtures/fmch-piales-coleadero-runtime.html`
- `tests/fixtures/scorer-responsive-viewport.html`
- `tests/fmch-2026-cala-scorer.test.mjs`
- `tests/full-scorer-integration.test.mjs`
- `tests/output-synchronization.test.mjs`
- `tests/pending-score-review-workflow.test.mjs`
- `tests/production-console.test.mjs`
- `tests/production-nav.test.mjs`
- `tests/public-live-feed-integration.test.mjs`
- `tests/public-portal-core.test.mjs`
- `tests/public-snapshot-cache-coherence.test.mjs`
- `tests/scorer-responsive-components.test.mjs`
- `tests/team-penalties-zero.test.mjs`

Los archivos existentes de pruebas reciben cobertura o cache-busters coherentes con el contrato vigente.

## Documentación nueva

- `CHARROPRO-OFFICIAL-TIMER-AUTHORITY-AND-SYNC-INTEGRATION-001/IMPLEMENTATION_SUMMARY.md`
- `CHARROPRO-OFFICIAL-TIMER-AUTHORITY-AND-SYNC-INTEGRATION-001/TIMER_AUTHORITY_CONTRACT.md`
- `CHARROPRO-OFFICIAL-TIMER-AUTHORITY-AND-SYNC-INTEGRATION-001/REMOTE_CONTROL_UX_CONTRACT.md`
- `CHARROPRO-OFFICIAL-TIMER-AUTHORITY-AND-SYNC-INTEGRATION-001/SYNC_AND_FAILOVER_TEST_EVIDENCE.md`
- `CHARROPRO-OFFICIAL-TIMER-AUTHORITY-AND-SYNC-INTEGRATION-001/FILES_CHANGED.md`

## Exclusiones confirmadas

- Sin nueva app remota ni Timer Engine paralelo.
- Sin cambios a reglas deportivas, Attempt V2 o Pending Workflow.
- Sin recálculo histórico.
- Sin push, deploy o escrituras a Firebase Production.

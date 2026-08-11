# Archivos modificados

## Cambios funcionales

- `js/data/fmch2026ManganasPasoRules.js`: catálogo y helpers deportivos FMCH 2026 de Manganas y Paso.
- `js/data/ruleProfiles.js`: perfil histórico 0.5.0 y nuevo perfil draft 0.6.0.
- `js/core/state.js`: campos de estado para floreo, tirones y Paso.
- `js/core/scoringAttempt.js`: preservación y freeze en Attempt V2.
- `js/app.js`: UI, acciones, timers, reconciliación y validación de publicación.
- `css/styles.css`: componentes responsivos de Manganas y Paso.
- `tests/fmch-2026-manganas-paso-scorer.test.mjs`: pruebas del ticket.

## Regresiones ajustadas

- `tests/fmch-2026-cala-scorer.test.mjs`
- `tests/fmch-2026-piales-coleadero-scorer.test.mjs`
- `tests/fmch-2026-jineteos-dynamic-scorer.test.mjs`
- `tests/fmch-2026-terna-complete.test.mjs`
- `tests/local-runtime-seed.test.mjs`
- `tests/rule-profile-engine.test.mjs`

Estos cambios actualizan expectativas del perfil vigente a 0.6.0 y preservan las versiones históricas.

## Cache-buster exclusivamente

Los siguientes archivos sustituyen el token anterior por `20260810-fmch-2026-manganas-paso-001-v1` sin cambio funcional adicional:

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
- `js/broadcast/announcerMonitor.js`
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
- `tests/announcer-monitor.test.mjs`
- `tests/broadcast-studio-workspace.test.mjs`
- `tests/fixtures/fmch-jineteos-runtime.html`
- `tests/fixtures/fmch-piales-coleadero-runtime.html`
- `tests/fixtures/scorer-responsive-viewport.html`
- `tests/output-synchronization.test.mjs`
- `tests/production-console.test.mjs`
- `tests/public-live-feed-integration.test.mjs`
- `tests/public-portal-core.test.mjs`
- `tests/public-snapshot-cache-coherence.test.mjs`
- `tests/scorer-responsive-components.test.mjs`
- `tests/team-penalties-zero.test.mjs`

## Documentación nueva

- `CHARROPRO-FMCH-2026-MANGANAS-PASO-IMPLEMENTATION-001/IMPLEMENTATION_SUMMARY.md`
- `CHARROPRO-FMCH-2026-MANGANAS-PASO-IMPLEMENTATION-001/RULE_RECONCILIATION_AND_BLOCKERS.md`
- `CHARROPRO-FMCH-2026-MANGANAS-PASO-IMPLEMENTATION-001/FLOREO_AND_TIMING_CONTRACT.md`
- `CHARROPRO-FMCH-2026-MANGANAS-PASO-IMPLEMENTATION-001/TEST_EVIDENCE.md`
- `CHARROPRO-FMCH-2026-MANGANAS-PASO-IMPLEMENTATION-001/FILES_CHANGED.md`

No se modificaron reglas de Firebase, dependencias, infraestructura ni datos productivos.

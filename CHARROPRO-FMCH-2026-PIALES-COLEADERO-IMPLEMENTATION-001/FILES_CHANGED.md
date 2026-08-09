# Archivos modificados

## Funcionales

- `js/data/fmch2026PialesColeaderoRules.js`: catalogos FMCH 2026, condiciones y helpers puros.
- `js/data/ruleProfiles.js`: perfil `FMCH_2026_LIBRE` 0.3.0 con Piales y Coleadero.
- `js/app.js`: UI y reconciliacion operativa sobre el scorer existente.
- `js/core/state.js`: campos compatibles de distancia/remate en Attempt legacy.
- `js/core/scoringAttempt.js`: adaptacion V2 del detalle de distancia/remate.
- `css/styles.css`: controles responsive de distancia y soporte opcional de diagramas.
- `tools/development/localRuntimeSeed.mjs`: roster sintetico realista para Piales y Coleadero.

## Pruebas y fixture

- `tests/fmch-2026-piales-coleadero-scorer.test.mjs`: cobertura nueva.
- `tests/fixtures/fmch-piales-coleadero-runtime.html`: fixture local con guard de loopback.
- `tests/fmch-2026-cala-scorer.test.mjs`: version y alcance esperado del perfil.
- `tests/rule-profile-engine.test.mjs`: version esperada.
- `tests/local-runtime-seed.test.mjs`: version esperada.

## Evidencia y documentacion

- `CHARROPRO-FMCH-2026-PIALES-COLEADERO-IMPLEMENTATION-001/IMPLEMENTATION_SUMMARY.md`
- `CHARROPRO-FMCH-2026-PIALES-COLEADERO-IMPLEMENTATION-001/RULE_RECONCILIATION.md`
- `CHARROPRO-FMCH-2026-PIALES-COLEADERO-IMPLEMENTATION-001/FIELDID_AND_BLOCKERS.md`
- `CHARROPRO-FMCH-2026-PIALES-COLEADERO-IMPLEMENTATION-001/TEST_EVIDENCE.md`
- `CHARROPRO-FMCH-2026-PIALES-COLEADERO-IMPLEMENTATION-001/FILES_CHANGED.md`
- `CHARROPRO-FMCH-2026-PIALES-COLEADERO-IMPLEMENTATION-001/evidence/ipad-landscape-piales.jpg`
- `CHARROPRO-FMCH-2026-PIALES-COLEADERO-IMPLEMENTATION-001/evidence/ipad-portrait-piales.jpg`
- `CHARROPRO-FMCH-2026-PIALES-COLEADERO-IMPLEMENTATION-001/evidence/ipad-landscape-coleadero.jpg`
- `CHARROPRO-FMCH-2026-PIALES-COLEADERO-IMPLEMENTATION-001/evidence/ipad-portrait-coleadero.jpg`

## Cache-buster solamente

Los siguientes archivos solo reemplazan `20260808-fmch-2026-cala-scorer-001-v1` por `20260808-fmch-2026-piales-coleadero-001-v1` en entrypoints/imports/tests, salvo los ya listados como funcionales:

- `announcer-monitor.html`, `broadcast-studio.html`, `cronometro-pantalla.html`, `cronometro.html`
- `formato-federacion.html`, `graficos.html`, `index.html`, `jueces.html`, `locutores.html`, `obs.html`
- `production-console.html`, `program-main-output.html`, `supervision.html`, `torneo-publico.html`, `torneo.html`
- `grafico-cala-detalle.html`, `grafico-caladero-turno.html`, `grafico-categoria.html`, `grafico-coleadero-turno.html`, `grafico-coleadero.html`
- `grafico-cronometro.html`, `grafico-marcador.html`, `grafico-ranking.html`, `grafico-turno.html`
- `js/broadcast/announcerMonitor.js`, `js/broadcast/broadcastStudioWorkspace.js`, `js/broadcast/outputSynchronization.js`
- `js/broadcast/productionConsole.js`, `js/broadcast/programMainOutput.js`
- `js/core/exporters.js`, `js/core/flow.js`, `js/core/history.js`, `js/core/officialFormat.js`
- `js/core/scorerComponents.js`, `js/core/scoring.js`, `js/core/statistics.js`, `js/core/sync.js`
- `js/data/suertes.js`, `js/publicPortal/portalApp.js`, `js/tournamentApp.js`
- `js/views/cronometro-control.js`, `js/views/cronometro-pantalla.js`, `js/views/formato-federacion.js`
- `js/views/grafico.js`, `js/views/graficos-control.js`, `js/views/jueces.js`, `js/views/locutores.js`
- `js/views/obs.js`, `js/views/supervision.js`, `js/views/torneo-publico.js`
- `tests/announcer-monitor.test.mjs`, `tests/broadcast-studio-workspace.test.mjs`
- `tests/fixtures/scorer-responsive-viewport.html`, `tests/output-synchronization.test.mjs`
- `tests/production-console.test.mjs`, `tests/public-live-feed-integration.test.mjs`
- `tests/public-portal-core.test.mjs`, `tests/public-snapshot-cache-coherence.test.mjs`
- `tests/scorer-responsive-components.test.mjs`, `tests/team-penalties-zero.test.mjs`

No se modificaron reglas deportivas fuera de Piales/Coleadero. Cala solo cambia expectativas de version en pruebas. Tampoco se modificaron Firebase Rules, configuracion, dependencias, Portal, Broadcast ni pipeline de publicacion.

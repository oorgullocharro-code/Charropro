# Files Changed

## Trabajo previo preservado

- `js/app.js`: polish de Manganas.
- `css/styles.css`: composición horizontal de Manganas.
- `tests/scoring-ui-final-polish.test.mjs`: cobertura del polish pendiente.

## Cambios funcionales de este ticket

- `js/app.js`: reconciliación Pending, líder global, rol activo y layout de Paso.
- `css/styles.css`: composición y responsive de Paso.
- `js/core/pendingScoreReview.js`: reconciliación monotónica.
- `js/core/scoring.js`: agregación global de Coleadero.
- `js/data/fmch2026TernaRules.js`: transición por estado de fase.
- `tests/fmch-2026-terna-complete.test.mjs`: fixtures compatibles con el contrato de rol.
- `tests/terna-operational-flow.test.mjs`: regresión de transición y cierre temprano.
- `tests/operational-validation-corrections-002.test.mjs`: cobertura dirigida del ticket.

## Versionado y cache-buster solamente

`functions/configuration.defaults.json` actualiza `values.system.appVersion` y sus campos derivados `checksum` / `fingerprint`; no cambia valores operativos adicionales.

- `announcer-monitor.html`
- `broadcast-studio.html`
- `cronometro-pantalla.html`
- `cronometro.html`
- `formato-federacion.html`
- `functions/configuration.defaults.json`
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
- `js/core/firebaseSync.js`
- `js/core/flow.js`
- `js/core/history.js`
- `js/core/officialFormat.js`
- `js/core/scorerComponents.js`
- `js/core/state.js`
- `js/core/statistics.js`
- `js/core/sync.js`
- `js/data/ruleProfiles.js`
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
- `tests/fixtures/fmch-jineteos-runtime.html`
- `tests/fixtures/fmch-piales-coleadero-runtime.html`
- `tests/fixtures/public-portal-ux.html`
- `tests/fixtures/publicPortalUxFixture.js`
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
- `torneo-publico.html`
- `torneo.html`

## Documentación nueva

- `CHARROPRO-OPERATIONAL-VALIDATION-CORRECTIONS-002/FILES_CHANGED.md`
- `CHARROPRO-OPERATIONAL-VALIDATION-CORRECTIONS-002/IMPLEMENTATION_SUMMARY.md`
- `CHARROPRO-OPERATIONAL-VALIDATION-CORRECTIONS-002/PENDING_REVIEW_RECONCILIATION.md`
- `CHARROPRO-OPERATIONAL-VALIDATION-CORRECTIONS-002/COLEADERO_GLOBAL_LEADER_CONTRACT.md`
- `CHARROPRO-OPERATIONAL-VALIDATION-CORRECTIONS-002/TERNA_ROLE_TRANSITION_CONTRACT.md`
- `CHARROPRO-OPERATIONAL-VALIDATION-CORRECTIONS-002/PASO_LAYOUT_CONTRACT.md`
- `CHARROPRO-OPERATIONAL-VALIDATION-CORRECTIONS-002/TEST_EVIDENCE.md`

No se modificaron Rules, dependencias ni archivos de producto fuera de las categorías anteriores.

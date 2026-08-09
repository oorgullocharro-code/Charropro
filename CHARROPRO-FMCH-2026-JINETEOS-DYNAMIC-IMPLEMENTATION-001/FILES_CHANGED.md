# Archivos Modificados

## Cambios funcionales y pruebas dirigidas

- `js/data/fmch2026JineteosRules.js`: reglas y reconciliación dinámica compartida.
- `js/data/ruleProfiles.js`: perfil `FMCH_2026_LIBRE 0.4.0`, Toro/Yegua y límite declarativo compatible.
- `js/core/scoringAttempt.js`: `resolvedValue` dinámico en el adaptador Attempt V2.
- `js/core/state.js`: estado vacío compatible con clasificación, timing y valores resueltos.
- `js/app.js`: UI compartida, clasificación, No repara y aplicación de tiempo.
- `css/styles.css`: integración responsive mínima de controles de Jineteos.
- `tests/fmch-2026-jineteos-dynamic-scorer.test.mjs`: cobertura nueva.
- `tests/fixtures/fmch-jineteos-runtime.html`: fixture sintético local.
- `tests/fmch-2026-cala-scorer.test.mjs`: expectativas del perfil ampliado, sin cambio deportivo de Cala.
- `tests/fmch-2026-piales-coleadero-scorer.test.mjs`: expectativas del perfil ampliado, sin cambio deportivo.
- `tests/local-runtime-seed.test.mjs`: versión del perfil local.
- `tests/rule-profile-engine.test.mjs`: versión y validación del perfil ampliado.

## Cache-buster únicamente

En los siguientes 61 archivos solo se sustituyó `20260808-fmch-2026-piales-coleadero-001-v1` por `20260808-fmch-2026-jineteos-dynamic-001-v1`:

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
- `jueces.html`
- `locutores.html`
- `obs.html`
- `production-console.html`
- `program-main-output.html`
- `supervision.html`
- `tests/announcer-monitor.test.mjs`
- `tests/broadcast-studio-workspace.test.mjs`
- `tests/fixtures/fmch-piales-coleadero-runtime.html`
- `tests/fixtures/scorer-responsive-viewport.html`
- `tests/output-synchronization.test.mjs`
- `tests/production-console.test.mjs`
- `tests/public-live-feed-integration.test.mjs`
- `tests/public-portal-core.test.mjs`
- `tests/public-snapshot-cache-coherence.test.mjs`
- `tests/scorer-responsive-components.test.mjs`
- `tests/team-penalties-zero.test.mjs`
- `torneo-publico.html`
- `torneo.html`

## Documentación y evidencia

- `CHARROPRO-FMCH-2026-JINETEOS-DYNAMIC-IMPLEMENTATION-001/IMPLEMENTATION_SUMMARY.md`
- `CHARROPRO-FMCH-2026-JINETEOS-DYNAMIC-IMPLEMENTATION-001/DYNAMIC_RULE_RECONCILIATION.md`
- `CHARROPRO-FMCH-2026-JINETEOS-DYNAMIC-IMPLEMENTATION-001/FIELDID_AND_BLOCKERS.md`
- `CHARROPRO-FMCH-2026-JINETEOS-DYNAMIC-IMPLEMENTATION-001/TEST_EVIDENCE.md`
- `CHARROPRO-FMCH-2026-JINETEOS-DYNAMIC-IMPLEMENTATION-001/FILES_CHANGED.md`
- cuatro imágenes JPG bajo `evidence/`.

## Totales

- Archivos con cambios funcionales o de prueba dirigida: 12.
- Archivos con cambio exclusivo de cache-buster: 61.
- Documentos: 5.
- Evidencias visuales: 4.
- Total del ticket: 82 archivos.

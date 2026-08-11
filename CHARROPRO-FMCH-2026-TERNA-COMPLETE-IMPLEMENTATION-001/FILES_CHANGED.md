# Archivos del Ticket

## Cambios funcionales

- `js/data/fmch2026TernaRules.js`: catalogos FMCH 2026, sesion, oportunidades, historial, remates y adicional por tiempo.
- `js/data/ruleProfiles.js`: perfil `FMCH_2026_LIBRE 0.5.0`, preservacion de `0.4.0` y metadata compartida de Terna.
- `js/core/timerRules.js`: contextos oficiales versionados, comandos, CAS, pausas y soporte para multiples timers.
- `js/core/state.js`: almacenamiento de sesiones/timers y campos compartidos de Attempt V2.
- `js/core/flow.js`: avance controlado al completar 5/5.
- `js/app.js`: pantallas Cabecero/Pial, panel compartido, timer, publicacion atomica del flujo y correcciones de tiempo.
- `css/styles.css`: presentacion responsive de Terna y ajuste comun del footer en iPad landscape.
- `tools/development/localRuntimeSeed.mjs`: datos sinteticos para Terna en emulador local.

## Pruebas dirigidas

- `tests/fmch-2026-terna-complete.test.mjs`: cobertura nueva de reglas, sesion, timer, publicacion y compatibilidad.
- `tests/fmch-2026-cala-scorer.test.mjs`: expectativa del perfil ampliado, sin cambio deportivo de Cala.
- `tests/fmch-2026-piales-coleadero-scorer.test.mjs`: expectativa del perfil ampliado, sin cambio deportivo.
- `tests/fmch-2026-jineteos-dynamic-scorer.test.mjs`: expectativa del perfil ampliado, sin cambio deportivo.
- `tests/local-runtime-seed.test.mjs`: fixture local con Terna.
- `tests/rule-profile-engine.test.mjs`: version y validacion del perfil.
- `tests/scorer-responsive-components.test.mjs`: contrato de publicacion y regresion responsive.

## Cache-buster

Los siguientes 60 archivos solo sustituyen `20260808-fmch-2026-jineteos-dynamic-001-v1` por `20260810-fmch-2026-terna-complete-001-v1`:

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
- `tests/fixtures/fmch-jineteos-runtime.html`
- `tests/fixtures/fmch-piales-coleadero-runtime.html`
- `tests/fixtures/scorer-responsive-viewport.html`
- `tests/output-synchronization.test.mjs`
- `tests/production-console.test.mjs`
- `tests/public-live-feed-integration.test.mjs`
- `tests/public-portal-core.test.mjs`
- `tests/public-snapshot-cache-coherence.test.mjs`
- `tests/team-penalties-zero.test.mjs`
- `torneo-publico.html`
- `torneo.html`

La documentacion historica del ticket de Jineteos no fue reescrita.

## Documentacion y evidencia

- `IMPLEMENTATION_SUMMARY.md`
- `TERNA_SHARED_STATE_CONTRACT.md`
- `RULE_RECONCILIATION_AND_BLOCKERS.md`
- `TEST_EVIDENCE.md`
- `FILES_CHANGED.md`
- cuatro JPG finales bajo `evidence/`.

## Totales

- Archivos funcionales o de prueba dirigida: 15.
- Archivos con cambio exclusivo de cache-buster: 60.
- Documentos: 5.
- Evidencias visuales: 4.
- Total del ticket: 84 archivos.

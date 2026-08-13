# Archivos modificados

## Cambios funcionales

- `js/app.js`: flujo automatico de Terna, cierre anticipado, permiso de Juez e integracion con Timer Authority y Flow Engine.
- `js/data/fmch2026TernaRules.js`: orden canonico, cierre `CLOSED_UNUSED` y normalizacion durable.
- `js/public/publicProjection.js`: acumulados parciales, posiciones provisionales y columnas `LC`/`PR` para IDs oficiales.
- `js/public/publicProjectionSchema.js`: allowlist del contrato parcial.
- `js/publicPortal/portalSelectors.js`: modelo unico de total y posicion visibles.
- `js/publicPortal/portalRender.js`: consumo uniforme en Inicio, Rankings, Resultados, Sabana y En Vivo.
- `firebase-rules-auditoria.json`: allowlist declarativa para los tres campos nuevos; no cambia permisos de lectura o escritura.

## Pruebas y fixtures

- `tests/terna-operational-flow.test.mjs`
- `tests/public-portal-partial-standings.test.mjs`
- `tests/public-projection.test.mjs`
- `tests/fixtures/publicPortalUxFixture.js`
- `tests/fixtures/public-portal-ux.html`

## Version y cache-buster

- `functions/configuration.defaults.json`: `system.appVersion`, checksum y fingerprint.
- Entry points HTML: `announcer-monitor.html`, `broadcast-studio.html`, `cronometro-pantalla.html`, `cronometro.html`, `formato-federacion.html`, `grafico-cala-detalle.html`, `grafico-caladero-turno.html`, `grafico-categoria.html`, `grafico-coleadero-turno.html`, `grafico-coleadero.html`, `grafico-cronometro.html`, `grafico-marcador.html`, `grafico-ranking.html`, `grafico-turno.html`, `graficos.html`, `index.html`, `jueces.html`, `locutores.html`, `obs.html`, `production-console.html`, `program-main-output.html`, `supervision.html`, `torneo-publico.html`, `torneo.html`.
- Broadcast: `js/broadcast/announcerMonitor.js`, `js/broadcast/broadcastStudioWorkspace.js`, `js/broadcast/outputSynchronization.js`, `js/broadcast/productionConsole.js`, `js/broadcast/programMainOutput.js`.
- Core: `js/core/exporters.js`, `js/core/firebaseSync.js`, `js/core/flow.js`, `js/core/history.js`, `js/core/officialFormat.js`, `js/core/scorerComponents.js`, `js/core/scoring.js`, `js/core/state.js`, `js/core/statistics.js`, `js/core/sync.js`.
- Data y entrypoints JS: `js/data/ruleProfiles.js`, `js/data/suertes.js`, `js/publicPortal/portalApp.js`, `js/tournamentApp.js`.
- Vistas: `js/views/cronometro-control.js`, `js/views/cronometro-pantalla.js`, `js/views/formato-federacion.js`, `js/views/grafico.js`, `js/views/graficos-control.js`, `js/views/jueces.js`, `js/views/locutores.js`, `js/views/obs.js`, `js/views/supervision.js`, `js/views/torneo-publico.js`.
- Pruebas de identidad: `tests/announcer-monitor.test.mjs`, `tests/broadcast-studio-workspace.test.mjs`, `tests/fmch-2026-cala-scorer.test.mjs`, `tests/full-scorer-integration.test.mjs`, `tests/output-synchronization.test.mjs`, `tests/pending-score-review-workflow.test.mjs`, `tests/production-console.test.mjs`, `tests/production-nav.test.mjs`, `tests/public-live-feed-integration.test.mjs`, `tests/public-portal-core.test.mjs`, `tests/public-snapshot-cache-coherence.test.mjs`, `tests/scorer-responsive-components.test.mjs`, `tests/team-penalties-zero.test.mjs`.
- Fixtures de identidad: `tests/fixtures/fmch-jineteos-runtime.html`, `tests/fixtures/fmch-piales-coleadero-runtime.html`, `tests/fixtures/scorer-responsive-viewport.html`.

Los archivos de esta seccion solo sustituyen el cache-buster anterior por `20260813-operational-flow-public-portal-corrections-001-v1`, excepto los archivos ya descritos como funcionales o fixtures visuales.

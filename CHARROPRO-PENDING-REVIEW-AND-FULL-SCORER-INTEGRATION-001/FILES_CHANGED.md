# Files Changed

## Cambios funcionales

| Archivo | Motivo |
| --- | --- |
| `js/core/pendingScoreReview.js` | Contrato puro, estados, seguridad, idempotencia, CAS local y auditoria. |
| `js/core/state.js` | Estado canonico, normalizacion, cache y aislamiento por torneo. |
| `js/core/firebaseSync.js` | Transaccion RTDB, suscripcion dedicada y exclusion del guardado generico. |
| `firebase-rules-auditoria.json` | Reglas minimas para Juez/Supervisor, identidad y revision. |
| `js/app.js` | Footer, panel, lista, permisos, retorno exacto, aislamiento por pestana, proteccion del draft recuperado y publicacion canonica. |
| `css/styles.css` | Integracion compacta y responsive. |
| `tests/pending-score-review-workflow.test.mjs` | Contrato, seguridad, lifecycle, revision y arquitectura. |
| `tests/full-scorer-integration.test.mjs` | Recorrido 10/10 y pendientes simple, Terna, Manganas y Paso. |

## Version e integridad solamente

Los siguientes archivos solo cambian referencias de cache-buster al token final. `functions/configuration.defaults.json` cambia ademas `system.appVersion`, `checksum` y `fingerprint` correspondientes al mismo versionado.

```text
announcer-monitor.html
broadcast-studio.html
cronometro-pantalla.html
cronometro.html
formato-federacion.html
functions/configuration.defaults.json
grafico-cala-detalle.html
grafico-caladero-turno.html
grafico-categoria.html
grafico-coleadero-turno.html
grafico-coleadero.html
grafico-cronometro.html
grafico-marcador.html
grafico-ranking.html
grafico-turno.html
graficos.html
index.html
js/broadcast/announcerMonitor.js
js/broadcast/broadcastStudioWorkspace.js
js/broadcast/outputSynchronization.js
js/broadcast/productionConsole.js
js/broadcast/programMainOutput.js
js/core/exporters.js
js/core/flow.js
js/core/history.js
js/core/officialFormat.js
js/core/scorerComponents.js
js/core/scoring.js
js/core/statistics.js
js/core/sync.js
js/data/ruleProfiles.js
js/data/suertes.js
js/publicPortal/portalApp.js
js/tournamentApp.js
js/views/cronometro-control.js
js/views/cronometro-pantalla.js
js/views/formato-federacion.js
js/views/grafico.js
js/views/graficos-control.js
js/views/jueces.js
js/views/locutores.js
js/views/obs.js
js/views/supervision.js
js/views/torneo-publico.js
jueces.html
locutores.html
obs.html
production-console.html
program-main-output.html
supervision.html
tests/announcer-monitor.test.mjs
tests/broadcast-studio-workspace.test.mjs
tests/fixtures/fmch-jineteos-runtime.html
tests/fixtures/fmch-piales-coleadero-runtime.html
tests/fixtures/scorer-responsive-viewport.html
tests/fmch-2026-cala-scorer.test.mjs
tests/output-synchronization.test.mjs
tests/production-console.test.mjs
tests/production-nav.test.mjs
tests/public-live-feed-integration.test.mjs
tests/public-portal-core.test.mjs
tests/public-snapshot-cache-coherence.test.mjs
tests/scorer-responsive-components.test.mjs
tests/team-penalties-zero.test.mjs
torneo-publico.html
torneo.html
```

## Documentacion

```text
CHARROPRO-PENDING-REVIEW-AND-FULL-SCORER-INTEGRATION-001/IMPLEMENTATION_SUMMARY.md
CHARROPRO-PENDING-REVIEW-AND-FULL-SCORER-INTEGRATION-001/PENDING_REVIEW_CONTRACT.md
CHARROPRO-PENDING-REVIEW-AND-FULL-SCORER-INTEGRATION-001/FULL_SCORER_INTEGRATION_EVIDENCE.md
CHARROPRO-PENDING-REVIEW-AND-FULL-SCORER-INTEGRATION-001/TEST_EVIDENCE.md
CHARROPRO-PENDING-REVIEW-AND-FULL-SCORER-INTEGRATION-001/FILES_CHANGED.md
```

No se modificaron dependencias, infraestructura de deploy, datos productivos ni modulos deportivos fuera del versionado requerido.

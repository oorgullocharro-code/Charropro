# Files Changed

## Funcionales

- `js/data/ruleProfiles.js`: contrato, validacion, perfiles estaticos y merge determinista. Es un archivo nuevo porque esta responsabilidad no pertenecia al catalogo deportivo ni al scorer; no persiste, no calcula puntos y no duplica `getTournamentSuertes()`.
- `js/data/suertes.js`: extiende el resolver existente y conserva `getTournamentSuertes()` como API central.
- `js/app.js`: identifica herencia de perfil en el editor y persiste contexto reglamentario en `breakdown.rulebook`.
- `tests/rule-profile-engine.test.mjs`: pruebas unitarias y de compatibilidad.

## Documentacion

- `CHARROPRO-RULE-PROFILE-ENGINE-001/RULE_PROFILE_ENGINE_ARCHITECTURE.md`.
- `CHARROPRO-RULE-PROFILE-ENGINE-001/RULE_PROFILE_DATA_CONTRACT.md`.
- `CHARROPRO-RULE-PROFILE-ENGINE-001/RULE_PROFILE_RESOLUTION_PRECEDENCE.md`.
- `CHARROPRO-RULE-PROFILE-ENGINE-001/RULE_PROFILE_COMPATIBILITY_MATRIX.md`.
- `CHARROPRO-RULE-PROFILE-ENGINE-001/RULE_PROFILE_TEST_EVIDENCE.md`.
- `CHARROPRO-RULE-PROFILE-ENGINE-001/FILES_CHANGED.md`.

## Cache-buster solamente

Token: `20260808-rule-profile-engine-001-v1`.

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
- `js/core/scoring.js`
- `js/core/state.js`
- `js/core/statistics.js`
- `js/core/sync.js`
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

Los 57 archivos de esta seccion solo cambian URLs de importacion/entrypoint o sus expectativas de prueba. No cambian comportamiento funcional. La actualizacion transitiva evita coexistencia entre instancias viejas y nuevas de `state`, `suertes` y `firebaseSync`.

## Resumen

- 4 archivos funcionales.
- 6 documentos.
- 57 archivos de cache-buster/pruebas de identidad.
- 67 rutas totales.

## Excluidos

- Firebase Rules y rutas.
- Functions y autoridad oficial.
- Portal Publico, salvo cache-busters transitivos.
- Broadcast Studio, salvo cache-busters transitivos.
- Recovery.
- Reglas deportivas y FieldID.
- Dependencias.

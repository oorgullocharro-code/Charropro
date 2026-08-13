# Files Changed

## Cambios funcionales

- `js/app.js`: composición común, zonas especializadas, ayuda contextual y etiqueta de avance.
- `css/styles.css`: layout compacto, estados táctiles y responsive.

## Pruebas

- `tests/scorer-screen-by-screen-ux-refinement.test.mjs`: contrato nuevo del ticket.
- `tests/scorer-information-hierarchy-compaction.test.mjs`: expectativa actualizada para el resumen live en cabecera.

## Configuración/versionado

- `functions/configuration.defaults.json`: `system.appVersion`, checksum y fingerprint.
- Entry points HTML, imports JS, fixtures y pruebas existentes que contenían el token anterior: reemplazo literal al único token del ticket.
- Dos documentos del cierre anterior que citaban el token reemplazado: actualización literal de versión.

No hay cambios funcionales en Core deportivo, reglas, Portal Público, Broadcast, Announcer, gráficos o Firebase Sync. En esos archivos el diff se limita al cache-buster.

## Documentación nueva

- `IMPLEMENTATION_SUMMARY.md`
- `SCREEN_LAYOUT_CONTRACT.md`
- `TIMER_UI_AND_TRANSITION_AUDIT.md`
- `TEST_EVIDENCE.md`
- `FILES_CHANGED.md`

## Token

Anterior: token vigente del ticket previo, reemplazado globalmente.

Nuevo: `20260813-scorer-screen-by-screen-ux-refinement-001-v1`

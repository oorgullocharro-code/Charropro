# Files Changed

## Producto

- `js/core/officialFormat.js`: papel Oficio, regla `0`/`-`, Cala por posicion, Terna por participante y alturas de fila.
- `js/core/xlsx.js`: papel personalizado y estilos de texto compactos.
- `js/views/formato-federacion.js`: normalizacion de geometria XLSX a porcentajes web.
- `css/styles.css`: geometria web acotada e impresion Oficio.
- `js/core/sync.js`, `js/app.js`, `js/tournamentApp.js`: cadena de importacion del build actualizado.
- `formato-federacion.html`, `index.html`, `torneo.html`: entradas productivas necesarias del build.
- `functions/configuration.defaults.json`: unicamente `system.appVersion` y checksum/fingerprint derivados.

## Pruebas

- `tests/official-format-authoritative-snapshot.test.mjs`.
- `tests/official-format-semantic-field-certification.test.mjs`.
- `tests/official-format-pre-judge-final-corrections.test.mjs`.
- `tests/fixtures/official-format-web-geometry.html`.

## Expediente

- Documentos de este directorio.
- Dos artefactos binarios bajo `evidence/`.

No se modificaron Official Score, Attempt V2, snapshot, Rule Profile, scoring, Flow, Timer, Firebase Rules, Functions backend, Broadcast, Portal Publico ni datos productivos.

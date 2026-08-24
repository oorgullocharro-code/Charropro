# Files Changed

## Implementación documental

- `js/core/officialFormatDocumentModel.js`: autoridad compartida de papel, columnas, filas, texto y abreviaturas.
- `js/core/officialFormatHtml.js`: renderer HTML puro, seguro y desacoplado.
- `js/core/officialFormatSnapshot.js`: metadata documental de códigos de Cala.
- `js/core/officialFormat.js`: geometría compartida aplicada al workbook XLSX.
- `js/core/xlsx.js`: estilo compacto de encabezados largos.
- `js/views/formato-federacion.js`: consumo del renderer compartido.
- `css/styles.css`: screen/scroll, roles de fila y print Oficio.
- `formato-federacion.html`: cache-buster del build.

## Pruebas

- `tests/official-format-html-print-geometry.test.mjs`: nueva cobertura de geometría, códigos, print, overflow y paridad.
- `tests/official-format-authoritative-snapshot.test.mjs`: golden XLSX actualizado por cambio documental.
- `tests/official-format-pre-judge-final-corrections.test.mjs`: validación del renderer puro.
- `tests/official-format-semantic-field-certification.test.mjs`: códigos individuales y generación de evidencia.

## Build

El cache-buster cambió de `20260824-fmch-team-sheet-pre-judge-final-001-v1` a `20260824-fmch-team-sheet-html-print-geometry-001-v1` en los 76 entrypoints/imports/fixtures que ya participaban en el mecanismo transversal. `functions/configuration.defaults.json` cambió únicamente `values.system.appVersion` y el checksum/fingerprint canónico asociado.

No se modificaron Functions ejecutables, RTDB Rules, Firebase Rules, dependencias, valores deportivos ni assets institucionales certificados.

## Evidencia y documentación

- Nueve documentos del ticket en esta carpeta.
- Dos XLSX integrales.
- Dos HTML integrales.
- Dos PDF derivados de XLSX.
- Un PDF de impresión HTML.
- Dos PNG de comparación visual.

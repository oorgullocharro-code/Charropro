# Resultados de pruebas

## Pruebas dirigidas

- `official-format-authoritative-snapshot.test.mjs`: PASS
- `scoring-attempt-v2.test.mjs`: PASS
- `official-score-concurrency.test.mjs`: PASS
- `fmch-2026-rule-profile-certification.test.mjs`: PASS
- `fmch-2026-cala-scorer.test.mjs`: PASS
- `fmch-2026-piales-coleadero-scorer.test.mjs`: PASS
- `fmch-2026-jineteos-dynamic-scorer.test.mjs`: PASS
- `fmch-2026-terna-complete.test.mjs`: PASS
- `fmch-2026-manganas-paso-scorer.test.mjs`: PASS

Resultado: `9/9 PASS`.

## Golden XLSX

SHA-256 esperado: `ff138b677c48fbecfc910744ebe7ee6384a615ac33270bbc3169c6c66b59f26f`.

El golden valida determinismo, 239/239 FieldID reconciliados, cero bloqueos documentales, assets con checksum, una hoja limpia y ausencia de campos tecnicos visibles.

## Conversion PDF

- Rancho Los Laureles: 1 pagina, Carta vertical, 2 imagenes embebidas.
- Hacienda San Miguel: 1 pagina, Carta vertical, 2 imagenes embebidas.
- Charros de Jalisco: 1 pagina, Carta vertical, 2 imagenes embebidas.

Busqueda de campos tecnicos en XLSX y PDF: `0 coincidencias`.

## Validaciones

- `node --check js/core/officialFormat.js`: PASS
- `node --check js/core/xlsx.js`: PASS
- JSON del manifiesto y reconciliacion: PASS
- `git diff --check`: PASS
- `git diff --cached --check`: PASS
- Secret scan: PASS
- Debugger scan: PASS

Firebase Production Writes: `0`.

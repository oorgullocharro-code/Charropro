# Validation

## Controles

- Source FieldID count: `239`.
- Reconciled FieldID count: `239`.
- FieldID duplicados: `0`.
- FieldID omitidos: `0`.
- Clasificaciones fuera de taxonomia: `0`.
- Suma de clasificaciones: `239`.
- Sporting blockers abiertos: `0`.
- Institutional resolved: `5`.
- Unsupported real blockers: `0`.
- Revisiones documentales de equivalencia exacta: `0`.
- Fingerprint esperado: `rptp_0f90f7a3944a82d7`.
- Valores deportivos modificados: `NO`.
- Perfil modificado: `NO`.
- Scorer/Rule Profile modificados: `NO`.
- Snapshot/exportador institucional modificados: `SI`, sin calculo deportivo.

## Validaciones ejecutables

La matriz JSON se valida contra el baseline existente y contra las resoluciones
explicitas del Certification Record. Tambien se ejecutan JSON parse, prueba de
certificacion vigente, `git diff --check` y comprobacion de que no haya cambios
de producto.

## Resultado ejecutado

- Reconciliacion FieldID: `239/239 PASS`.
- Unicidad FieldID: `239/239 PASS`.
- Reclasificaciones criticas: `10/10 PASS`.
- JSON: `3/3 PASS`.
- `fmch-2026-rule-profile-certification.test.mjs`: `PASS`.
- `fmch-2026-cala-scorer.test.mjs`: `PASS`.
- `fmch-2026-piales-coleadero-scorer.test.mjs`: `PASS`.
- `fmch-2026-jineteos-dynamic-scorer.test.mjs`: `PASS`.
- `fmch-2026-manganas-paso-scorer.test.mjs`: `PASS`.
- `scoring-attempt-v2.test.mjs`: `PASS`.
- `full-scorer-integration.test.mjs`: `PASS`.
- `official-format-authoritative-snapshot.test.mjs`: `PASS`.
- Charreada golden completa: `24/24` intentos representados.
- Official Score = Snapshot = XLSX: `24/24 PASS`.
- Coleadero deportivo: `9` intentos (`3x3`) y `1` fila administrativa vacia.
- Firmas manuales: `4/4`, orden `JUEZ / JUEZ / JUEZ / CAPITÁN`.
- Perfil documental: `FMCH_TEAM_SHEET_2024_2028 1.0.0 PASS`.
- Source PDF SHA-256: `3a14fe3d6add5add76033765b27227c44f04c8e31330ce4aeb3248828701dca7 PASS`.
- Raster SHA-256: `c6be367e02a182fd8d2c116cce77e627cc890cc0c98d987073eff31a3e727a5f PASS`.
- Asset FMCH SHA-256: `f76354074a3ec45cd731c95e52439a8f8806a7bdeb0aa92f2eff117ae7b0ab56 PASS`.
- Asset CONADE SHA-256: `56c192cad952528d60b9e312033ca68246eb9b63a9a01196ef0b4816bede42b5 PASS`.
- Carga visual de assets: `150x150` y `170x88 PASS`.
- Assets embebidos en XLSX: `2/2 PASS`.
- Golden XLSX SHA-256: `356bce10c954b276d114e773280684877376fe90d2c3dd6df8bb881926c5335b PASS`.
- Apertura LibreOffice y conversion XLSX -> PDF: `PASS`.
- Comparacion visual de orden, secciones, controles, firmas y logos: `PASS`.
- Paginas del golden renderizado: `1`, carta vertical.
- `node --check`: `5/5 PASS`.
- JSON: `3/3 PASS`.
- `git diff --check`: `PASS`.
- Valores deportivos modificados: `0`.
- `FMCH_2026_LIBRE 0.6.0` modificado: `NO`.

## Dictamen actualizado

La fuente de los cinco FieldID institucionales esta certificada para la version
documental 2024-2028. No quedan `UNSUPPORTED_REAL_BLOCKER`, revisiones
documentales ni bloqueos deportivos. El estado global es `READY`; HTML y XLSX
consumen los assets autorizados y el XLSX los embebe como medios OOXML.

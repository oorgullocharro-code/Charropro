# Test Results

## Dirigidas

- `node --check js/core/officialFormatSnapshot.js`: PASS.
- `node --check js/core/officialFormat.js`: PASS.
- `node --check tests/official-format-semantic-field-certification.test.mjs`: PASS.
- `node tests/official-format-authoritative-snapshot.test.mjs`: PASS.
- `node tests/official-format-semantic-field-certification.test.mjs`: PASS.
- `node tests/fmch-2026-cala-scorer.test.mjs`: PASS.
- `node tests/cala-rules.test.mjs`: PASS; `45,005` combinaciones verifican `P + T = total`.
- `git diff --check`: PASS.

## Artefactos

- Dos XLSX generados.
- Dos PDF generados por LibreOffice.
- Cada PDF: una página Letter vertical (`612 × 792 pt`).
- Logos FMCH y CONADE embebidos.

## Regresión final

- Suite completa: `85/85 PASS`.
- `node --check`: `197/197 PASS`.
- JSON: `25/25 PASS`.
- `git diff --check`: PASS.
- `git diff --cached --check`: PASS; staging vacío.
- Secret scan del alcance: PASS.
- Debugger scan: PASS.
- Console scan: PASS; únicamente permanecen los mensajes terminales de éxito de las pruebas.
- Matriz semántica: `239/239` filas.

## SHA-256 de evidencia

- Primera vuelta XLSX: `a30c3b7502ca986d485d9e4c9ee5dc0faa99159d9166db679f8b4b30527a38b1`.
- Primera vuelta PDF: `27b155cb470ec8bbcfcd83a62663e9386e08844860fdac675053b6fc6a776aa3`.
- Segunda vuelta XLSX: `90693a345c2d06969c6ea0b9a7c1bfbb6d4697ccfe0f7616cd5565338994aca1`.
- Segunda vuelta PDF: `80ca10d83f8d6c150229932edd991601334957a8fe6aab8b951066db65738cf8`.

## SHA-256 de evidencia rica

- Cala positiva XLSX: `3beea9f42be558a2532c1b15d025c90a84aebc5b873b098cdd75b4736156e2f3`.
- Cala positiva PDF: `e9a5c1e86d242106b3514ff25d1203ac501d722569e444b9a6b4847ac51b6941`.
- Cala con infracciones XLSX: `41b3fe470845420f6975c42636170d08b27faa70d360c0f6acd242a29031252e`.
- Cala con infracciones PDF: `955e48401f5b4d0682844fc4a09f90d53674c4afd97d0c7a290c5498e1f6087b`.
- Jineteos complejos XLSX: `5e3ab8bb322e3b808552e222c7141200ac35c4fe36b2a429b173bf8bf879d0cb`.
- Jineteos complejos PDF: `f7e97626bf2b032362259aef87ee680611fc2ee5145424a2a87a36815ddb46a6`.

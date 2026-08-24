# Test Results

## Pruebas dirigidas

- `official-format-pre-judge-final-corrections.test.mjs`: PASS.
- `official-format-semantic-field-certification.test.mjs`: PASS.
- `official-format-authoritative-snapshot.test.mjs`: PASS.
- `configuration-management.test.mjs`: PASS.
- `fmch-2026-rule-profile-certification.test.mjs`: PASS.

## Integridad

- Golden XLSX SHA-256: `ab9f3c401320d0fe2ffb442915366db9ca969fa82d08767927b9290a2061cd07`.
- Evidencia XLSX SHA-256: `b3ef6c2d04c72fb4dcb7c623c57b13c37959c3d126b1581e8f39e6bca61d97cf`.
- Evidencia PDF SHA-256: `4bf6665703580da1ea0e3d84a12fd7a3ae3a135e8e37ec847254caef0eaeb8a8`.
- Configuracion checksum: `63a99e675efef604bb3305a4026a95e002b4002230e652eb0359e0b21a131d44`.

## Regresion final

- Suites: `86/86 PASS`.
- `node --check`: `197/197 PASS`.
- JSON parse: `25/25 PASS`.
- `git diff --check`: PASS.
- Secret scan sobre adiciones: PASS.
- Debugger scan sobre adiciones: PASS.
- Artefactos prohibidos: `0`.
- Referencias runtime al build anterior: `0`.

La primera corrida encontro dos expectativas literales del build anterior en `production-nav` y `public-snapshot-cache-coherence`. Se actualizaron exclusivamente sus identidades de cache y la segunda corrida completa termino sin fallos.

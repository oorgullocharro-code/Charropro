# Test Evidence

## Validacion automatica final

- `node --check`: 168 archivos JavaScript/MJS, PASS.
- Suite completa: 66/66 archivos `tests/*.test.mjs`, PASS.
- `tests/pending-score-review-workflow.test.mjs`: PASS.
- `tests/full-scorer-integration.test.mjs`: PASS.
- `tests/official-score-concurrency.test.mjs`: PASS.
- `tests/public-projection-outbox.test.mjs`: PASS.
- `tests/public-snapshot-cache-coherence.test.mjs`: PASS.
- `tests/rule-profile-engine.test.mjs`: PASS.
- `tests/scoring-attempt-v2.test.mjs`: PASS.
- Suites FMCH 2026 de Cala, Piales/Coleadero, Jineteos, Terna y Manganas/Paso: PASS.
- `tests/configuration-management.test.mjs`: PASS con el nuevo checksum.

## Emulator

- Reset y seed sintetico: PASS.
- Inicio de sesion Juez: PASS.
- Escritura transaccional real de `pendingScoreReviews`: PASS.
- Suscripcion, recarga y contador: PASS.
- Dos pestanas: ambas reciben el contador remoto y solo la pestana que abre la pendiente recupera su sesion de resolucion: PASS.
- Recarga activa: sesion y draft de Piales de 14 puntos se conservan frente a la hidratacion remota de scores: PASS.
- Resolucion con score oficial y fanout confirmado: PASS.
- Rules cargadas por la suite local; Juez/Supervisor permitidos y Operador excluido: PASS.
- Firebase Production writes: 0.

## Seguridad y calidad

- JSON parse: PASS.
- `git diff --check`: PASS.
- Cache-buster unico: PASS.
- Mixed version del token reemplazado: NO.
- `debugger` agregado: NO.
- Secretos nuevos: NO.
- Dependencias nuevas: NO.

## Evidencia visual

Se inspeccionaron footer, lista, pendiente abierta y regreso exacto. Tambien se verificaron las diez suertes y cuatro viewports mediante DOM visible y capturas locales sinteticas. Las capturas no contienen datos reales y no se agregan al repositorio porque el ticket limita la documentacion a estos cinco archivos.

# Resultados de Pruebas

- `node --check` de 147 archivos `js/`, `functions/`, `tools/` y `tests/`: aprobado con Node `24.16.0`.
- `node tests/firebase-runtime-local.test.mjs`: aprobado.
- `node tests/local-runtime-seed.test.mjs`: aprobado.
- Suite existente y nueva: 54/54 archivos `tests/*.test.mjs` aprobados con Node `24.16.0`.
- `node tools/development/charropro-development.mjs validate`: aprobado.
- Servidor local: `http://127.0.0.1:8765/index.html` respondió `200`, `Cache-Control: no-store` y `X-CharroPro-Environment: LOCAL / EMULATOR`.
- `node tools/development/charropro-development.mjs validate`: aprobado para `demo-charropro-local` y los cuatro hosts loopback.
- Cliente real en navegador: badge `LOCAL / EMULATOR`, proyecto local, juez y supervisor sintéticos, calificador y Resultados visibles.
- Validación directa de callable: primer request autenticado devolvió `idempotent: false`; el retry idéntico devolvió `idempotent: true`; quedó un único published score, un ledger, una auditoría y fanout `DELIVERED`.
- `git diff --check`: aprobado durante la suite.
El intento de ejecutar la suite completa con Node `20.20.2` se detuvo en `tests/public-live-feed-integration.test.mjs`: esa prueba requiere `node:module.registerHooks`, API ausente en Node 20. Es una incompatibilidad de runtime de prueba, no una falla de código. La misma suite completa pasó con Node `24.16.0`; los emuladores y Functions permanecieron en Node 20.

# Archivos cambiados

## Nuevos

- `functions/officialScoreConcurrency.js`
  Contrato puro, identidad, CAS, ledger, historial, auditoria, fanout y
  sanitizacion.
- `tests/official-score-concurrency.test.mjs`
  Cobertura P0 de concurrencia, idempotencia, conflictos, historia, seguridad y
  Rules.
- `CHARROPRO-OFFICIAL-SCORE-CONCURRENCY-001/SUMMARY.md`
- `CHARROPRO-OFFICIAL-SCORE-CONCURRENCY-001/VALIDATION.md`
- `CHARROPRO-OFFICIAL-SCORE-CONCURRENCY-001/TEST_RESULTS.md`
- `CHARROPRO-OFFICIAL-SCORE-CONCURRENCY-001/RISKS.md`
- `CHARROPRO-OFFICIAL-SCORE-CONCURRENCY-001/ROLLBACK.md`
- `CHARROPRO-OFFICIAL-SCORE-CONCURRENCY-001/FILES_CHANGED.md`

## Modificados funcionalmente

- `functions/index.js`
  Callable autenticada, validacion de perfil y acceso, transaccion RTDB y
  trigger durable de fanout.
- `functions/package.json`
  El comando de deploy existente incluye las dos Functions nuevas. No cambia
  dependencias.
- `firebase-rules-auditoria.json`
  Cierra writes cliente a fuente oficial, ledger, fanout y audit; protege
  historia contra eliminacion cliente.
- `js/core/firebaseSync.js`
  Sustituye la publicacion directa por la autoridad Callable, conserva
  idempotency key entre retries y evita que una sincronizacion general reescriba
  `publishedScores` o metadata oficial.
- `js/core/state.js`
  Calcula la revision provisional desde el maximo historico, no desde el numero
  de filas. No cambia puntos ni calculos deportivos.
- `js/app.js`
  Reconcilia el record canonico servidor y muestra un mensaje solo ante conflicto
  real. Tambien actualiza su import versionado.
- `tests/public-live-feed-integration.test.mjs`
  Integra el motor transaccional real con el adapter falso y conserva la prueba
  end-to-end de Public Projection Recovery.

## Versionado

- `js/core/version.js`
- `js/tournamentApp.js`
- `index.html`
- `torneo.html`
- `tests/production-nav.test.mjs`

Version anterior:

`20260729-public-projection-recovery-001-v1`

Version nueva:

`20260801-official-score-concurrency-001-v1`

## No modificados

- reglamento deportivo;
- motor de calificacion y formulas;
- rankings y estadisticas;
- Broadcast Studio y Output Routing;
- Portal Publico visual;
- Recovery Center;
- Firebase Hosting;
- dependencias y lockfiles;
- `CHARROPRO_CORE_STABILIZATION_PROGRAM.md`.

No se eliminaron archivos. No hubo push ni deploy.

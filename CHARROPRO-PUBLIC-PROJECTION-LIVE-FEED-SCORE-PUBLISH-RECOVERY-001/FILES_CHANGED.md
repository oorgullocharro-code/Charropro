# Archivos cambiados

## Nuevos

- `js/core/publicProjectionOutbox.js`
  Modelo puro de identidad, estados, retry, lease, sanitizacion y observabilidad.
- `tests/public-projection-outbox.test.mjs`
  Pruebas unitarias del modelo durable.
- `CHARROPRO-PUBLIC-PROJECTION-LIVE-FEED-SCORE-PUBLISH-RECOVERY-001/SUMMARY.md`
- `CHARROPRO-PUBLIC-PROJECTION-LIVE-FEED-SCORE-PUBLISH-RECOVERY-001/VALIDATION.md`
- `CHARROPRO-PUBLIC-PROJECTION-LIVE-FEED-SCORE-PUBLISH-RECOVERY-001/TEST_RESULTS.md`
- `CHARROPRO-PUBLIC-PROJECTION-LIVE-FEED-SCORE-PUBLISH-RECOVERY-001/ROLLBACK.md`
- `CHARROPRO-PUBLIC-PROJECTION-LIVE-FEED-SCORE-PUBLISH-RECOVERY-001/FILES_CHANGED.md`
- `CHARROPRO-PUBLIC-PROJECTION-LIVE-FEED-SCORE-PUBLISH-RECOVERY-001/RISKS.md`

## Modificados funcionalmente

- `js/core/firebaseSync.js`
  Escritura atomica del intent, actor autenticado, reconciliador, claim,
  proyeccion, confirmacion cliente, retry y diagnostico manual.
- `js/app.js`
  Triggers automaticos, estado correcto para el operador y panel minimo en
  Recovery Center.
- `firebase-rules-auditoria.json`
  Reglas privadas del nuevo outbox, autor immutable, actores vinculados a
  `auth.uid` y bloqueo cliente de `VERIFIED`.
- `tests/public-live-feed-integration.test.mjs`
  Reproduccion y recovery end-to-end con adapter Firebase falso.
- `tests/firebase-public-rules.test.mjs`
  Validacion estatica y espejo de logica equivalente con casos negativos de
  autor, identidad, retry, cancelacion y `VERIFIED`.

## Versionado

- `js/core/version.js`
- `js/tournamentApp.js`
- `index.html`
- `torneo.html`
- `tests/production-nav.test.mjs`

Version anterior:

`20260728-app-supervisor-navigation-recovery-001-v1`

Version nueva:

`20260729-public-projection-recovery-001-v1`

## No cambiados

- reglas deportivas;
- calculos de score;
- ranking;
- Portal Publico visual;
- Broadcast Engine;
- Firebase Functions;
- dependencias;
- `CHARROPRO_CORE_STABILIZATION_PROGRAM.md`.

No se eliminaron archivos.

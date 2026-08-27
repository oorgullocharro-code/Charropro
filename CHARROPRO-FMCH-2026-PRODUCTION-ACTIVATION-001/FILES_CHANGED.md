# Files Changed

## Cambios funcionales

- `functions/configuration.defaults.json`: build y default Libre `0.6.1` con policy v2 y checksum nuevo.
- `js/app.js`: lifecycle y asignacion toman perfil/version desde la configuracion; se elimina el hardcode productivo `0.6.0`.
- `tests/productive-rule-profile-policy.test.mjs`: default `0.6.1` y preservacion explicita de `0.6.0`.
- `tests/new-tournament-fmch-scorer-readiness.test.mjs`: asignacion automatica de un torneo nuevo con `0.6.1`.
- `tests/global-fmch-scorer-first-load.test.mjs`: fingerprint coherente con el default `0.6.1`.
- `tests/global-fmch-scorer-suerte-resolution.test.mjs`: catalogo completo con asignacion `0.6.1`.

## Cambios mecanicos

Los demas archivos modificados contienen exclusivamente la sustitucion del query `?v=` por el build canonico `20260826-fmch-2026-061-production-activation-v1`, aplicada por `tools/release/applyClientBuildVersion.mjs`.

## Documentacion

- `SUMMARY.md`
- `VALIDATION.md`
- `FILES_CHANGED.md`
- `EXPLICIT_TOURNAMENT_MIGRATION.md`

No se modificaron Functions source, RTDB Rules, sporting values ni FieldIDs.

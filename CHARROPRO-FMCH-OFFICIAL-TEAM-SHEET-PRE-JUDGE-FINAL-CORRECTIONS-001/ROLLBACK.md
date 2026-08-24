# Rollback

## Cliente

Si el nuevo renderer falla despues del deploy, restaurar el backup previo de `public_html/charropro` correspondiente al build:

`20260822-fmch-official-team-sheet-judge-review-001-v1`

Commit previo:

`dd2dd98e19b39ecc19c77208bac49029a157bf5d`

## Alcance

El rollback es exclusivamente de cliente/documento. No requiere modificar Firebase Rules, Functions, Rule Profiles, scores, Attempt V2, Official Publication ni datos.

Antes de restaurar, conservar el paquete nuevo y su SHA-256 para permitir diagnostico reproducible. Despues de restaurar, verificar version, carga, login y acceso al Formato Federacion.

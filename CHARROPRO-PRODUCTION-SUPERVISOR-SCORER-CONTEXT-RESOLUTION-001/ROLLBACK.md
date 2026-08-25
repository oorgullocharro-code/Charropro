# Rollback

## Cliente

1. Detener rollout y conservar logs/checksums.
2. Restaurar el backup remoto creado por Hostinger Terminal Deploy.
3. Verificar el build anterior `20260824-global-fmch-scorer-resolution-fix-001-v1` por HTTP.
4. Ejecutar smoke test read-only.

## Datos

No se requiere rollback de datos: el ticket no modifica perfiles, scores, Rules ni Functions. Los torneos creados durante validacion fisica deben ser fixtures productivos claramente controlados y no contienen scores reales.

## Git

No reescribir historial. Si se requiere revertir, crear un commit de revert sobre el commit del ticket.

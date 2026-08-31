# Rollback

## Cliente

Restaurar el backup remoto generado inmediatamente antes del deploy con `scripts/hostinger/rollback-client.sh`, usando el artefacto reportado por el pipeline.

## Git

Crear un revert normal del commit de este ticket. No reescribir historial ni usar force push.

## Datos

No hay migraciones ni escrituras de datos. El rollback no requiere cambios en RTDB, Functions, perfiles o scoring.

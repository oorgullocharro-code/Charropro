# Rollback

## Cliente

1. Restaurar el paquete Hostinger previo al build `20260825-user-access-bootstrap-001-v1`.
2. Confirmar que `functions/configuration.defaults.json` servido vuelve al build anterior.
3. Limpiar cache del navegador y verificar entrypoints.

## Git

Crear un revert normal del commit del ticket. No usar reset, force push ni reescritura de historia.

## Firebase

No hay rollback de Rules, Functions ni datos porque este ticket no los modifica ni despliega. Firebase Production Writes: 0.

## Consecuencia conocida

Volver al build anterior reintroduce el `permission_denied` para Jueces con acceso `selected`. Supervisor no se ve afectado por esa regresion.

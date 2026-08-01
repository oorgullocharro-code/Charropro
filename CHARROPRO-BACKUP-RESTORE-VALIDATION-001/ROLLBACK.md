# Rollback

## Antes De Deploy

Este ticket no fue desplegado. El rollback consiste en revertir el commit local del ticket. No existen cambios remotos ni de datos.

## Despues De Deploy, Antes De Usar Restore

1. Deshabilitar o retirar las cuatro Functions de Restore.
2. Mantener `restoreFoundation` cerrado a clientes.
3. Conservar catalogo, auditoria y archivos Backup; no eliminar evidencia.
4. Revertir el codigo mediante un commit nuevo.

## Despues De Un Restore Completado

Cada operacion sobre un target existente registra `safetyBackupId`. Para volver al estado anterior:

1. Congelar escrituras del alcance.
2. Validar el safety backup como nuevo source.
3. Generar un safety backup del estado actualmente restaurado.
4. Ejecutar un nuevo preflight.
5. Confirmar explicitamente el Restore inverso.
6. Verificar fingerprint, auditoria, Scores Oficiales y proyeccion publica.

No debe editarse RTDB manualmente ni borrar auditorias para simular rollback.

## Falla Durante APPLYING

La transaccion es todo o nada. Si no fue confirmada, el target conserva el fingerprint anterior. Si fue confirmada y el proceso cae, el worker retoma por fingerprint y completa validacion/catalogo sin reaplicar datos.

## Charreada

Despues de revertir una charreada debe publicarse nuevamente la proyeccion oficial del torneo. No reutilizar un snapshot publico parcial o anterior.

## Verificacion

- `restoreFoundation/audit` contiene la secuencia completa.
- El catalogo referencia source y safety.
- El ledger oficial conserva una sola revision activa.
- No existen fanouts restaurados pendientes.
- Outbox no terminal archivado permanece `SUPERSEDED`.
- Portal y Broadcast reciben datos solo despues de la reproyeccion normal.

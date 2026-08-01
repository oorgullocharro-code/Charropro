# Rollback

## Rollback de este ticket

Este ticket no despliega ni escribe datos. Si debe retirarse antes de uso:

1. Crear un commit inverso del commit local del ticket; no usar reset destructivo.
2. Retirar solo `tools/release`, la prueba dedicada y esta carpeta documental.
3. Ejecutar la suite completa.
4. Confirmar que no cambiaron Rules, Functions, configuracion, Backup, Restore, Scores, Portal o Broadcast.

No existe rollback remoto porque no hubo push ni deploy.

## Politica operativa para releases futuros

El plan generado por el motor aplica este orden:

1. Detener rollout y preservar evidencia.
2. Reactivar el artefacto cliente inmutable anterior.
3. Publicar una nueva revision de configuracion con valores anteriores mediante CAS.
4. Desplegar el artefacto Functions anterior compatible.
5. Restaurar Rules anteriores solo despues de validar compatibilidad con clientes y Functions activos.
6. Publicar documentacion correspondiente a la version restaurada.
7. Validar salud, integridad y auditoria.

## Reglas de datos

- No borrar registros para simular rollback.
- No reescribir versiones publicadas.
- No eliminar historicos, auditoria, outbox, ledger, backups o manifests.
- No restaurar datos salvo corrupcion demostrada, backup verificado, preflight aprobado y autorizacion explicita.
- Si una configuracion debe volver a valores anteriores, crear una version nueva vinculada al historial.

## Decision

El release pasa a `rolling_back`, ejecuta pasos con evidencia y termina en `rolled_back`. Si falla un paso, permanece `failed` y requiere intervencion; nunca se marca completo por omision.

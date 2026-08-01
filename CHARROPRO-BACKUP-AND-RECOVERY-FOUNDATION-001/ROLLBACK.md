# Rollback

## Alcance

Este ticket no fue desplegado. El rollback local consiste en revertir el commit unico del ticket cuando exista, sin tocar archivos de datos ni eliminar respaldos.

```bash
git revert <commit-de-backup-foundation>
```

No usar reset destructivo sobre una rama compartida.

## Si Se Despliega En El Futuro

1. Pausar `scheduleCharroProBackups` para detener solicitudes automaticas nuevas.
2. Deshabilitar las callables de solicitud/cancelacion si existe una incidencia de autorizacion.
3. Permitir terminar o clasificar los jobs activos; no borrar objetos validados.
4. Conservar `charropro/backupFoundation/catalog` y `audit` como evidencia.
5. Conservar los objetos `charropro-backups/v1/**` hasta completar una revision de integridad.
6. Revertir las Functions y despues las reglas, en ese orden.
7. Confirmar que los flujos deportivos, Portal y Broadcast siguen sin cambios.

## Datos

- No ejecutar Restore: no existe en v1.
- No copiar un archivo directamente sobre `charropro/tournaments`.
- No borrar catalogo o auditoria para simular rollback.
- No eliminar respaldos publicados como parte del rollback de codigo.
- La regla legacy `charropro/backups` debe mantenerse hasta un ticket explicito de migracion.

## Verificacion

```bash
node tests/backup-foundation.test.mjs
node tests/official-score-concurrency.test.mjs
node tests/public-live-feed-integration.test.mjs
git diff --check
git status --short
```

El rollback es correcto cuando las Functions nuevas dejan de estar activas, los payloads historicos siguen preservados y no hay cambios en datos deportivos.

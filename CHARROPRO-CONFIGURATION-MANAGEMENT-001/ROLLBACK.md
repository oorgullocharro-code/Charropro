# Rollback

## Objetivo

Retirar Configuration Management v1 sin alterar datos deportivos ni los módulos estabilizados.

## Procedimiento

1. Revertir el commit local del ticket mediante un commit inverso; no usar reset destructivo.
2. Restaurar los imports estáticos de Firebase y las constantes previas de `firebaseSync.js` desde el commit padre.
3. Restaurar en `functions/index.js` los mismos valores que actualmente contiene el baseline.
4. Retirar `getCharroProConfiguration` y `publishCharroProConfiguration` del script de despliegue.
5. Mantener `configurationManagement` cerrado en Rules hasta confirmar que ninguna Function publicada lo usa.
6. Si el servicio hubiera sido desplegado en otro entorno, despublicar únicamente sus dos callables.
7. No borrar registros de configuración; conservarlos como evidencia hasta una decisión de retención aprobada.
8. Ejecutar los 49 tests y los `node --check` documentados.

## Datos

Este ticket no crea migraciones ni escribe datos. El rollback local no requiere restauración de torneos, scores, backups, Portal o Broadcast.

## Verificación

- Firebase Sync vuelve a iniciar con los valores previos.
- Backup y Restore continúan aprobando.
- Official Score y Projection Recovery continúan aprobando.
- Rules siguen negando acceso directo al namespace si existiera.
- No se eliminan históricos ni auditoría.

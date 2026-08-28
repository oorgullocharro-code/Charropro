# Rollback

## Cliente

Usar `scripts/hostinger/rollback-client.sh` con el backup inmutable generado
inmediatamente antes del deploy. Ejecutar primero `--dry-run` y verificar la
ruta exacta del backup registrada por el deploy.

## Git

Crear un revert normal del commit de publicación. No reescribir historial ni
editar perfiles deportivos certificados.

## Alcance

El rollback restaura el mapping de filas anterior y la identidad del build.
No requiere rollback de RTDB Rules, Firebase Functions, lifecycle ni datos.

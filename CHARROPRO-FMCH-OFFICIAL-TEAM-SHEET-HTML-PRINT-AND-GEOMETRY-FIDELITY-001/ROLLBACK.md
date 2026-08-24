# Rollback

## Antes del deploy

1. Crear `public_html/charropro-backup-20260824-pre-<SHORT_SHA>.zip`.
2. Verificar que el backup no sobrescriba `public_html/charropro-backup-20260824-pre-fda54e6.zip`.
3. Registrar hash y tamaño del paquete cliente nuevo.

## Activación de rollback

Restaurar el backup nuevo si falla login, scorer, Formato Federación, impresión, XLSX, Portal Público, Graphics o Broadcast Studio.

## Procedimiento

1. Detener la extracción del paquete nuevo si sigue activa.
2. Reemplazar `public_html/charropro` con el contenido del backup previo a este deploy.
3. Verificar el build anterior `20260824-fmch-team-sheet-pre-judge-final-001-v1`.
4. Ejecutar smoke read-only de login, scorer, Formato Federación, Portal, Graphics y Broadcast.
5. No modificar Functions ni RTDB Rules.
6. No escribir datos deportivos ni publicar scores durante rollback.

## Git

El rollback operativo no reescribe historial. Cualquier reversión de código debe hacerse posteriormente mediante un commit explícito, nunca con force push.

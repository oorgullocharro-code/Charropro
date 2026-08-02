# Rollback

No existe cambio remoto que revertir. Para deshacer el runtime local, retirar los archivos de este ticket en un cambio revisado posterior. Para limpiar el entorno local, detener emuladores y ejecutar `local:reset --confirm` con Java 21 y Node 20 configurados.

Los datos locales viven bajo `.local/`, ignorado por Git. No se debe borrar ni modificar el directorio de auditoría FMCH existente.

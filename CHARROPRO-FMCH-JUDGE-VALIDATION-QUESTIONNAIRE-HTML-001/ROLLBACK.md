# Rollback

La herramienta está aislada en `tools/fmch-judge-questionnaire/` y no importa módulos del producto. Revertir el ticket consiste únicamente en retirar ese directorio y el paquete documental asociado mediante un commit posterior autorizado.

No hay migraciones, Firebase, reglas, despliegues, dependencias ni cambios deportivos que revertir. Las entrevistas guardadas en el navegador no se modifican por Git; se eliminan desde la lista local o al limpiar los datos del sitio en el navegador.

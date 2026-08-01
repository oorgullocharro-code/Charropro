# Formatos de exportación

## JSON

Exporta una envoltura versionada con metadatos de entrevista, perfil, consentimiento y respuestas. Mantiene identificadores, FieldID y GAP en la definición local del cuestionario, y las respuestas permanecen `PENDING_REVIEW` salvo que una revisión humana posterior las clasifique.

## CSV

Exporta una fila por pregunta. Incluye entrevistado, sección, pregunta, selección, explicación, ejemplo, fuentes, certeza, notas y estado. Los caracteres especiales y comillas se escapan conforme a CSV.

## Impresión

La vista de entrevista cuenta con estilos de impresión. El navegador puede usar "Imprimir" o "Guardar como PDF"; V1 no genera un PDF binario ni usa una biblioteca externa.

## Importación

Solo acepta JSON creado por la herramienta con `format: charropro-fmch-judge-interview`, versión compatible y estructura válida. Se limita a 1 MB. Nunca importa ejecutables, HTML ni adjuntos.

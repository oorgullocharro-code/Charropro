# Resultados de pruebas

## Automatizadas

- `node --check tools/fmch-judge-questionnaire/app.js`: aprobado.
- `node --check tools/fmch-judge-questionnaire/questionnaire-data.js`: aprobado.
- `node tests/fmch-judge-questionnaire.test.mjs`: aprobado.
- Suite completa `tests/*.test.mjs`: aprobada.

La prueba específica verifica 14 secciones, 60 preguntas, 13 QuestionID fuente, 239 FieldID, cinco GAP P0, IDs únicos, múltiples entrevistas, exportación JSON/CSV, importación validada, comparación no resolutiva, ausencia de llamadas de red/Firebase y ausencia de inserción HTML de respuestas.

## Revisión en navegador local

- Flujo de demostración, navegación y recortes oficiales: aprobado en Chromium local.
- Autosave y recuperación tras recarga: aprobado.
- Cadena HTML de prueba conservada como texto en un área de captura, sin errores de consola: aprobado.
- Modo técnico: FieldID ocultos por defecto y visibles solo al activarlo: aprobado.
- Responsive: layout de una columna, imagen cargada y sin overflow horizontal en breakpoint reducido: aprobado.
- Apertura directa `file://`: no ejecutada por la automatización, porque la política del navegador local bloquea ese esquema. No se usó ningún mecanismo alterno. La revisión estática confirma recursos relativos y ausencia de dependencias o solicitudes de red.
- Safari: pendiente de validación manual por un operador en un dispositivo Safari; no se declara ejecutada en este cierre técnico.

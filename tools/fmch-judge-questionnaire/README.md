# Cuestionario FMCH para jueces

Herramienta HTML local para entrevistar a jueces, calificadores y personal deportivo sobre la Hoja Oficial de Calificación por Equipo FMCH 2024-2028.

## Uso offline

Abra `index.html` directamente desde una laptop o tablet. No requiere servidor, internet, cuenta, Firebase ni dependencias externas. Las entrevistas se guardan en el `localStorage` del navegador y se deben exportar en JSON o CSV para conservarlas fuera del dispositivo.

## Contenido

- `index.html`, `styles.css` y `app.js`: interfaz local.
- `questionnaire-data.js`: 14 secciones, 60 preguntas sencillas, los 13 QuestionID fuente y los 239 FieldID relacionados de manera interna.
- `assets/`: hoja completa y recortes derivados directamente del PDF FMCH original; no son una redibujada de la hoja.

## Privacidad y límites

No use datos reales en la entrevista de demostración. No adjunte audio, video o fotografías en V1: registre solo una referencia textual de evidencia. La herramienta no aprueba reglas, no cambia calificaciones y no envía información a internet.

Fuente visual: `HOJA-CALIFICACION-EQUIPO-CHARROS-2024-2028 (2).pdf`, SHA-256 `3a14fe3d6add5add76033765b27227c44f04c8e31330ce4aeb3248828701dca7`.

# Validation

## Contrato documental

- FieldID reconciliados: `239/239`.
- `MISSING_SOURCE_DATA`: `0`.
- `SEMANTIC_MISMATCH`: `0`.
- Abreviaturas certificadas de Cala: `AH`, `D`, `R`.
- Variantes no certificadas: se representan como `-`; no se inventan abreviaturas.
- Control de malos obligatorio: `5 + 4 = 9`, con `affectsScore=false`.
- Cero real: `0`.
- No aplica/no utilizado: `-`.

## Terna

- Tres filas corresponden a tres integrantes congelados del equipo.
- Cabecero usa el bloque izquierdo.
- Pial usa el bloque derecho.
- El remate se mantiene en la fila del ejecutante.
- No se crean Attempts documentales para llenar filas vacias.

## Geometria web

La fixture de regresion confirma que el renderer ya no multiplica anchos XLSX por siete ni genera columnas CSS en pixeles. En la validacion de navegador el documento midio `1120px` en desktop y `920px` en mobile controlado, muy por debajo del defecto productivo aproximado de `1,333,333px`.

## Evidencia

- `evidence/formato-fmch-pre-juez-fixtures-a-d.xlsx`
- `evidence/formato-fmch-pre-juez-fixtures-a-d.pdf`

El PDF es una sola pagina Oficio vertical. La evidencia es ficticia y local; no hubo escritura en Firebase Produccion.

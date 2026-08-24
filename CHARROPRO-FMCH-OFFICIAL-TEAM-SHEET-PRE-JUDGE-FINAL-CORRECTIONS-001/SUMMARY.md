# Summary

## Estado

`DOCUMENT SEMANTICS: PASS`

`JUDGE REVIEW: READY_FOR_CERTIFIED_JUDGE_REVIEW`

El Formato Federacion `FMCH_TEAM_SHEET_2024_2028 1.0.0` conserva el pipeline `Official Score -> Attempt V2 -> Official Format Snapshot -> XLSX/PDF/HTML`. No se modificaron formulas, valores deportivos, Rule Profile, Attempt V2 ni autoridad de publicacion.

## Correcciones

- Cala coloca cada abreviatura documental en la fila superior y su valor en la celda inferior de la misma posicion.
- Terna usa tres filas de participantes congelados; Cabecero queda a la izquierda y Pial a la derecha.
- Un cero real se representa como `0`; una celda no aplicable o no utilizada se representa como `-`.
- Las infracciones de equipo y controles acumulados conservan su semantica documental, sin doble descuento.
- El XLSX usa el Oficio exacto del PDF fuente: `215.9 x 340.44 mm`, vertical y una pagina.
- El HTML deja de convertir anchos XLSX en pixeles y limita la tabla a geometria web controlada.

## Invariantes

- `FMCH_2026_LIBRE 0.6.0` permanece sin cambios.
- Fingerprint deportivo: `rptp_0f90f7a3944a82d7`.
- Sporting values modified: `NO`.
- Firebase Production Writes: `0`.
- La revision de juez certificado sigue pendiente; este ticket no declara certificacion humana.

## Build

- Build anterior: `20260822-fmch-official-team-sheet-judge-review-001-v1`.
- Build nuevo: `20260824-fmch-team-sheet-pre-judge-final-001-v1`.
- Checksum de configuracion: `63a99e675efef604bb3305a4026a95e002b4002230e652eb0359e0b21a131d44`.
- La identidad de cache se actualizo mecanicamente en toda la cadena runtime protegida; no quedan referencias runtime al build anterior.

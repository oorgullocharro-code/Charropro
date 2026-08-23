# Summary

## Dictamen

`DICTAMEN: APROBADO`

La auditoría cubrió `239/239` FieldID. Remate de Terna, vuelta/base de Paso, seis campos temporales, ocho slots de malos de Cala, controles laterales y el desglose `P/T` de Punta tienen una proyección documental explícita desde evidencia congelada. No se modificaron reglas ni valores deportivos.

`FMCH.TEAM_SHEET.CALA.P` y `FMCH.TEAM_SHEET.CALA.T` se originan en `calculatePuntaBreakdown()`, se conservan como `puntaPuntosDistancia` y `puntaPuntosTiempos`, y se congelan en Attempt V2 como `scoring.calculationDetail.details.distancePoints` y `timePoints`. El snapshot y el exportador únicamente proyectan esos valores. Los históricos sin desglose explícito continúan como `UNAVAILABLE_FROM_HISTORICAL_SOURCE`.

## Resultado cuantitativo

- FieldID auditados: `239/239`.
- `SEMANTIC_MATCH`: `96`.
- `ADMINISTRATIVE_CORRECT`: `39`.
- `DOCUMENT_CONTROL_CORRECT`: `38`.
- `DERIVED_CORRECT`: `62`.
- `MANUAL_CORRECT`: `4`.
- `MISSING_SOURCE_DATA`: `0`.
- `SEMANTIC_PARTIAL`: `0`.
- `SEMANTIC_MISMATCH`: `0`.
- `UNSUPPORTED`: `0`.
- Sporting blockers del Rule Profile: `0`.
- Valores deportivos modificados: `NO`.
- FMCH profile modificado: `NO`.
- Firebase Production Writes: `0`.

## Evidencia

Los XLSX/PDF de `evidence/` usan la ruta real `calculatePuntaBreakdown() -> applyPuntaCalculation() -> Attempt V2 -> Official Format Snapshot`. Ambos muestran `P=2`, `T=2`, total de Punta `4`, conservan totales ficticios `216` y `211`, ocupan una sola página Carta vertical e incluyen los assets institucionales.

Totales ficticios: primera vuelta `216`; segunda vuelta `211`. Cada PDF ocupa una sola página Carta vertical e incluye los assets institucionales.

La evidencia rica adicional certifica Cala positiva, Cala con infracciones y Jineteos complejos. Sus puntuaciones finales ficticias son `225`, `204` y `241`. Los controles acumulados concluyen exactamente en la puntuación final y el caso obligatorio de Cala conserva `5 + 4 = 9` sin doble descuento.

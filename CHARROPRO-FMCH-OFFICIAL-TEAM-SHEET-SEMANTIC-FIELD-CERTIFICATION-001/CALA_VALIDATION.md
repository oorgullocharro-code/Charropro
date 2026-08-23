# Cala Validation

## Resultado

`PASS`

| FieldID | Concepto | Fuente actual | Resultado |
| --- | --- | --- | --- |
| `CALA.METERS` | Metros calificados | `calculationDetail.details.metrosCalificados` | PASS |
| `CALA.TIMES` | Piquetes/tiempos | `calculationDetail.details.piquetes` | PASS |
| `CALA.P` | Puntos por distancia de Punta | `calculationDetail.details.distancePoints` | PASS |
| `CALA.T` | Puntos por tiempos de Punta | `calculationDetail.details.timePoints` | PASS |
| `CALA.LD/LI/MD/MI/PC` | Adicionales canónicos | `additionalSelections[]` por RuleID | PASS |
| `CALA.BAD_POINT_01..08` | Detalle de malos | `infractions[]` con RuleID, label, quantity y total | PASS |
| `CALA.BAD_POINTS_TOTAL` | Total malos | `individualBadPoints` | PASS |
| `CALA.PARTIAL_POINTS` | Resultado congelado | Official Score / Attempt V2 | PASS |

El cálculo autoritativo conserva `puntaPuntosDistancia` y `puntaPuntosTiempos`; Attempt V2 los congela como `distancePoints` y `timePoints`. El snapshot `1.1.0` también admite los aliases explícitos previos `puntosDistancia` y `puntosTiempos`, pero nunca replica `calculatePuntaBreakdown()` ni deduce valores desde el total.

## Evidencia implementada

1. `applyPuntaCalculation()` conserva `puntaPuntosDistancia` y `puntaPuntosTiempos` desde el cálculo existente.
2. La frontera de publicación vuelve a aplicar el cálculo autoritativo sobre una copia del intento y no muta el estado fuente.
3. Attempt V2 congela `distancePoints`, `timePoints` y `totalPoints`.
4. Official Score conserva el Attempt V2 inmutable.
5. Los históricos sin esos campos permanecen `UNAVAILABLE_FROM_HISTORICAL_SOURCE`.

La identidad verificada es `distancePoints + timePoints = totalPoints`. La fórmula y el total deportivo no cambiaron.

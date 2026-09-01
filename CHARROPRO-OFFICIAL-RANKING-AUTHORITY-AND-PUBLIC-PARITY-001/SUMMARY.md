# CHARROPRO-OFFICIAL-RANKING-AUTHORITY-AND-PUBLIC-PARITY-001

## Resultado tecnico

La autoridad oficial de ranking se deriva una sola vez de las filas normalizadas
de Official Score. La proyeccion publica transporta rankings de competencia,
fase y charreada; Portal, salida operativa y adaptador legacy consumen esa misma
verdad sin recalcular scoring.

## Primer punto de perdida

`buildPublicProjection()` publicaba `rankings.status = unavailable` aunque
`results.items` ya contenia la acumulacion oficial correcta. El Portal ordenaba
despues filas documentales por charreada, por lo que un equipo podia aparecer
varias veces en el ranking agregado.

## Autoridad final

`Official Score -> publicProjection results -> officialRanking -> rankings -> consumers`

El comparador conserva el comportamiento existente: promedio, total, menos
puntos negativos, mejor resultado, nombre e identificador estable. No se agrego
ningun desempate deportivo.

## Limites preservados

- `FMCH_2026_LIBRE 0.6.1` sin cambios.
- Sporting values, RuleIDs, FieldIDs, Timer y politica temporal sin cambios.
- Attempt V2 y Functions sin cambios.
- Firebase Production Writes: 0.
- No deploy ejecutado: el cambio de esquema requiere autorizacion expresa para
  desplegar RTDB Rules junto con el cliente.

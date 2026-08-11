# Reconciliación de reglas y bloqueos

## Fuente

La implementación usa exclusivamente la especificación aprobada `CHARROPRO-FMCH-2026-SCORING-SPECIFICATION-001`. Las reglas nuevas registran esa fuente y el rulebook `fmch_2026_manganas_paso_0.6.0`.

## Manganas a Pie

Estado técnico: PASS.

Estado deportivo: PASS.

Se reconciliaron bases, remates, floreo opcional, adicionales, infracciones, infracciones al equipo, DQ, tres oportunidades y tiempo oficial de siete minutos. El resultado logrado/no logrado es explícito; cero y no lograda no producen DQ.

## Manganas a Caballo

Estado técnico: PASS.

Estado deportivo: BLOCKED parcialmente por fuente.

Se reconciliaron bases, remates, floreo opcional, tirones, historial, adicionales, infracciones, infracciones al equipo, DQ, tres oportunidades y tiempo oficial de siete minutos.

### USI-003: Contra máscara

La fuente conserva una ambigüedad de identidad por doble mención impresa de Contra máscara. La implementación registra una sola identidad deportiva segura con 14 puntos y marca:

`SOURCE_CONFIRMATION_REQUIRED`

No se inventó una segunda regla. Este bloqueo impide considerar el perfil completo listo para activación productiva, pero no impide usar ni probar el resto del catálogo confirmado.

## Paso de la Muerte

Estado técnico: PASS.

Estado deportivo: PASS.

Se implementaron primera vuelta, segunda vuelta, distancia Libre, clasificación, adicionales e infracciones dinámicas, infracciones al equipo, DQ y los dos contextos temporales confirmados. No se mezclaron valores de Charro Mayor.

## Bloqueos de activación del perfil

`FMCH_2026_LIBRE` 0.6.0 permanece `draft` y `activationReady: false` por:

1. Cala: equivalencias ML/CR frente a MD/MI/PC pendientes de confirmación de fuente.
2. Coleadero: cuarta fila pendiente de confirmación de fuente.
3. Manganas a Caballo: identidad impresa de Contra máscara pendiente de confirmación.

## FieldID

Los FieldID existentes se preservan. Para Manganas, Paso, floreo, remates, tiempo y oportunidades el estado es `TRANSFORMATION_REQUIRED`; no se inventaron mappings no confirmados ni se reauditaron los 239 FieldID.

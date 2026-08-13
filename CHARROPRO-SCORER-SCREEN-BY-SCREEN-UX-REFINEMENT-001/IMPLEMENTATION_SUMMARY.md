# CHARROPRO-SCORER-SCREEN-BY-SCREEN-UX-REFINEMENT-001

## Resultado

Se refinó el calificador existente pantalla por pantalla. La implementación reutiliza el scorer, los cálculos, el Flow Engine, Attempt V2, Pending Review, Official Publication, Score Protection y Timer Authority ya aprobados.

No se creó un scorer alterno ni un Timer Engine paralelo. No se modificaron puntos, matrices, fórmulas, Rule IDs, FieldIDs o reglas deportivas. `FMCH_2026_LIBRE` permanece en `0.6.0`.

## Cambios comunes

- Cabecera compacta con suerte, entidad, participante, oportunidad, total, desglose y timer contextual.
- Fichas de equipos siempre visibles, con acumulado calculado por el helper existente.
- Suertes y contexto en una sola banda responsive.
- Timer visible una sola vez en cabecera; el cuerpo conserva únicamente controles operativos.
- Infracciones individuales abiertas por defecto en Colas, Toro, Terna y Yegua.
- Motivo visible para acciones deshabilitadas por dependencia.
- Barra inferior con destino contextual, sin alterar el avance canónico.

## Cambios por suerte

- Cala: se preservó su calculador; se eliminó la fila `1/1` y se agruparon adicionales.
- Piales: se eliminaron tarjetas duplicadas y se dejó un stepper compacto de metros.
- Coleadero: participante y oportunidad comparten una banda; no hay tarjetas duplicadas.
- Toro/Yegua: clasificación primero y controles temporales compactos.
- Terna: zona compacta de lazador, intento compartido, siguiente contexto y referencia al timer.
- Manganas: intento, resultado, floreo, tirones, remate e historial compacto.
- Manganas a Caballo: bases agrupadas por familias visuales.
- Paso: clasificación, resultado y faena en una zona; dos contextos temporales visibles.

## Compatibilidad

El Portal Público, Broadcast, Announcer, gráficos, Official Publication y Firebase productivo no fueron rediseñados ni escritos. Sus archivos solo recibieron el cache-buster unificado requerido por el ticket.

## Versión

`20260813-scorer-screen-by-screen-ux-refinement-001-v1`

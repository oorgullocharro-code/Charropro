# Contrato de floreo y tiempo

## Floreo

El valor oficial capturado se conserva con identidad propia:

- `floreoTotal`
- `floreoScoredTotal`
- `floreoSource`
- `floreoDetail`

`floreoTotal` no se convierte en `manualAdditional`. El total rápido es suficiente para calificar y exportar. `floreoDetail` es opcional, se expande inline y documenta la ejecución sin volver a sumar los puntos del total rápido.

El contrato conserva `0`, detalle vacío y total sin desglose como valores válidos. En Centenario, el total crudo de floreo se preserva para auditoría, pero `floreoScoredTotal` es cero conforme al contrato deportivo.

## Resultado deportivo

Manganas y Paso registran un resultado explícito:

- `ACHIEVED`
- `NOT_ACHIEVED`
- `NOT_STARTED`

No se infiere la ejecución únicamente de `total > 0`. Marcar cero o seleccionar no lograda no equivale a DQ.

## Timers

Se reutiliza la autoridad temporal común con contextos lógicos independientes:

- `timer_manganas_pie`
- `timer_manganas_caballo`
- `timer_paso_3min`
- `timer_paso_1min`

Cada contexto soporta `START`, `PAUSE`, `RESUME` y `FINISH`. Las pausas oficiales no consumen tiempo deportivo. El estado distingue `wallElapsedMs` de `officialElapsedMs` y conserva ambos al congelar Attempt V2.

## Aplicación deportiva

- Manganas: límite de siete minutos, minutos completos no usados y penalización confirmada del minuto siete.
- Paso: contexto de salida de tres minutos y contexto independiente de desmontar de un minuto.
- No se crearon `ManganaPieTimerEngine`, `PasoEngine` ni una segunda autoridad temporal.

## Publicación y falla

El snapshot oficial congela el floreo, remate, resultado y timing. Una falla de publicación no debe avanzar oportunidad ni perder el draft. La prueba visual offline preservó oportunidad, floreo, remate, DQ y timer; la retroalimentación visible del estado pendiente no apareció de inmediato y queda documentada como riesgo operativo, sin pérdida de datos observada.

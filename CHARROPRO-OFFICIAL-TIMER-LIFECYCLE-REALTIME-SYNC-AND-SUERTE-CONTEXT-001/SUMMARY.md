# Official Timer lifecycle y contexto

## Resultado tecnico

Se preserva una sola autoridad temporal: `js/core/timerRules.js`, persistida por transaccion en `charropro/tournaments/{tournamentId}/officialTimers/{timerKey}`.

El bloqueo observado despues de Finalizar no era destruccion del motor. El control movil conservaba el `selectedTimerId` historico mientras ese registro siguiera en RTDB, aunque la suerte activa ya hubiera producido una definicion nueva. La seleccion ahora sigue el contexto deportivo vigente cuando el Timer anterior esta `FINISHED` o `READY`; si el anterior sigue `RUNNING` o `PAUSED`, el cambio se bloquea y exige finalizarlo.

Piales y Coleadero incorporan oportunidad/participante a la identidad temporal para no reutilizar accidentalmente un Timer terminado. Terna, Manganas y Paso conservan sus alcances compartidos existentes.

Scorer, Timer Display y Broadcast siguen siendo consumidores. No se creo otro Timer Engine, no se modificaron Rules o Functions y no hubo escrituras en Firebase Produccion durante desarrollo.

## Estado previo al cierre fisico

El resultado tecnico queda sujeto a la validacion fisica posterior en celular/iPad definida por el ticket.

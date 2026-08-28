# Zero Refresh Validation

La matriz automatizada recorre sin refresh:

- Brake Review E1, E2 y E3.
- Protocolo, llamada de jueces y CALA_READY.
- Cala, Piales, Coleadero, Toro, Terna, Yegua, Manganas a Pie, Manganas a Caballo y Paso.
- READY, START, PAUSE, RESUME, FINISH y cambio de timer.

Resultado: `REFRESH COUNT = 0`.

La validacion real de navegador confirmo E1 -> E2, E2 -> E3, cierre global, protocolo, llamada de jueces y Cala E1. La certificacion fisica final de una charreada completa continua queda pendiente despues del deploy.

# Timer Identity

La identidad determinista distingue torneo, charreada, suerte, fase, equipo, participante, intento, oportunidad y coleador cuando aplica.

- Coleadero 3x3 produce nueve identidades independientes.
- Piales distingue cada oportunidad del mismo pialador.
- Manganas y Paso conservan fase/oportunidad segun la politica certificada.
- `horseId` y `attemptId` se conservan desde la definicion hasta el contexto oficial.

Solo se reconstruye estado cuando coincide exactamente el mismo `timerId`; un contexto nuevo nace READY con elapsed cero.

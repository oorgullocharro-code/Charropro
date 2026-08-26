# Brake Review Timer

Brake Review reutiliza el registro y la transaccion de Official Timer Authority bajo `officialTimers`. El estado deportivo `brakeReview` se persiste junto al timer para reconstruir fase, revision, infracciones, resultado y auditoria despues de refresh.

La vista usa la derivacion compartida del timer para interpolar en vivo. No existen escrituras Firebase por tick. Solo un cruce de umbral faltante genera un comando canonico idempotente.

Limites certificados:

- `> 1:00`: primer `-1`.
- `> 2:00`: segundo `-1`.
- `>= 3:00`: DQ canonica de revision de freno.

CAS valida revision del timer y revision de Brake Review. `commandId` evita doble aplicacion por retry, doble tap, refresh o snapshot tardio.

Un mismo usuario autenticado puede operar desde telefono y scorer sin crear otro timer. Un UID distinto requiere handoff/takeover de la autoridad existente; no se amplio acceso global.

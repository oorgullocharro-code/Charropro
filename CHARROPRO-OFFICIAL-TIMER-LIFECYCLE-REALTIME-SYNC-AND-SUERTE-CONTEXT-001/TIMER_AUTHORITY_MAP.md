# Timer Authority Map

```text
Official Timer Authority (timerRules + RTDB transaction)
  |-- cronometro-control: controlador principal de campo
  |-- Scorer: suscriptor read-only y respaldo por takeover explicito
  |-- sync/buildLivePayload: proyeccion oficial sanitizada
  |-- Output Routing: transporte timer_projection
  |-- Timer Display: consumidor visual read-only
  |-- Announcer/Broadcast: consumidores de la proyeccion
```

## Autoridad

- Estado: `READY`, `RUNNING`, `PAUSED`, `FINISHED`.
- Concurrencia: transaccion RTDB, `expectedRevision`, `commandId` y ownership.
- Identidad: torneo, competencia, charreada, equipo/participante, suerte y alcance de oportunidad cuando aplica.
- Tiempo: `officialElapsedMs` y `runningSince`; el navegador solo interpola la vista entre revisiones.

## Consumidores

Ningun consumidor escribe un contador oficial independiente. Scorer escucha `officialTimers`; Graphics/Broadcast recibe `current/timer`; Output Routing conserva `sourceRevision`.

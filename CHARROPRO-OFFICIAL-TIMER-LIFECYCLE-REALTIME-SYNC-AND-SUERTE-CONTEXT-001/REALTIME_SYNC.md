# Realtime Sync

## Timer a Scorer

`subscribeFirebaseOfficialTimers(tournamentId)` reemplaza el registro del torneo y solicita render de Scorer. Los displays oficiales interpolan cada 100 ms desde `runningSince`, pero se reconcilian con cada revision RTDB.

## Timer a Graphics/Broadcast

Una mutacion aceptada genera `buildOfficialTimerProjection()` y publica `current/timer` con accion `official_timer_update`. Output Routing transporta la proyeccion como `timer_projection`; Timer Display, Announcer y Broadcast consumen copias read-only.

## Protecciones

- Revisiones obsoletas son rechazadas por CAS.
- `suerteId` y `timerId` determinan el contexto.
- La seleccion no adopta un contexto nuevo mientras el anterior siga activo.
- Un retry con el mismo `commandId` no crea otra revision.
- Refresh recupera el estado desde RTDB; no crea una autoridad local nueva.

La latencia fisica de red queda pendiente de la prueba posterior. Las pruebas deterministas certifican una sola aplicacion por revision y actualizacion visual local inmediata tras el snapshot.

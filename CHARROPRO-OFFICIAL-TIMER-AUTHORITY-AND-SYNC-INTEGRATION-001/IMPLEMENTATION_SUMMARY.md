# CHARROPRO-OFFICIAL-TIMER-AUTHORITY-AND-SYNC-INTEGRATION-001

## Resumen

CharroPro conserva un solo tiempo oficial por contexto deportivo. El control existente `cronometro.html` es el controlador principal de campo; el calificador escucha la misma autoridad y puede asumir control de respaldo mediante takeover explícito. Timer Display, Announcer Monitor y Broadcast consumen proyecciones de esa autoridad, sin crear motores paralelos.

La implementación reutiliza el Timer Engine de `js/core/timerRules.js` y persiste el estado canónico bajo:

`charropro/tournaments/{tournamentId}/officialTimers/{timerKey}`

## Alcance implementado

- Identidad estable mediante `timerId` y `timerKey` por torneo, competencia, charreada, participante/equipo, suerte y contexto.
- Ciclo `READY -> RUNNING -> PAUSED -> RUNNING|FINISHED` y `RUNNING -> FINISHED`.
- Control remoto principal con ACK antes de confirmar el estado visual.
- Calificador como consumidor sincronizado y controlador de respaldo.
- Ownership con `controllerId`, `controllerUid`, `controllerRole`, `controllerSessionId` y `controllerType`.
- Concurrencia mediante transacción RTDB, `expectedRevision`, idempotencia por `commandId`, takeover y handoff.
- Retry idempotente sin nueva escritura: conserva `revision`, estado, `updatedAt` y `authorityAcceptedAt` canónicos.
- Pausas con tiempo oficial congelado y tiempo real auditable.
- Contextos simultáneos, incluidos Terna y Apretalamiento.
- Duraciones preservadas: Manganas 7 min; Paso salida 3 min y desmonte 1 min.
- Consumo sincronizado por Timer Display, Announcer y Output Routing/Broadcast.
- Control remoto responsive con botón circular dominante y acción primaria visible en smartphone portrait.

## Correcciones finales RTDB

1. Rules acepta las transiciones válidas `PAUSED -> RUNNING` y `PAUSED -> FINISHED`.
2. Un retry con el mismo `commandId` se resuelve antes de escribir. La transacción se aborta como idempotente y devuelve la aceptación canónica existente, por lo que `acceptedAt` no cambia ni aparenta una nueva aceptación.

## Compatibilidad

- `FMCH_2026_LIBRE` permanece en versión `0.6.0`.
- Attempt V2 y Pending Workflow permanecen compatibles.
- No se modificaron cálculos deportivos, duraciones oficiales ni históricos.
- No se creó una aplicación remota nueva ni otro Timer Engine.
- Smartwatch y control físico quedan preparados como tipos de controlador, pero no fueron implementados.
- No hubo push, deploy ni escrituras a Firebase Production.

## Límites fuera de alcance

No se corrigieron: acumulados provisionales del Portal Público, transición automática Cabecero/Pial, cierre anticipado de oportunidades de Terna, revisión UX integral del scorer, fichas de equipos/totales ni CORS productivo de publicación oficial.

## Estado de cierre

La matriz RTDB real en Emulator y la validación operativa dirigida están aprobadas. Los resultados de la validación final completa se registran en `SYNC_AND_FAILOVER_TEST_EVIDENCE.md`.

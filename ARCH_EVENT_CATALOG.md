# Filosofía del Event Engine

Todo lo importante que ocurre en CharroPro debe convertirse en un evento.

El Event Engine existe para que CharroPro pueda crecer sin que sus módulos se acoplen de forma peligrosa. El calificador, Recovery Center, Programa, Producción, Página Pública, Estadísticas, Auditoría e IA no deben depender de llamadas directas entre sí cuando un evento pueda resolver la comunicación.

El Event Engine será la única fuente oficial de eventos. Un evento representa un hecho ocurrido, no una intención futura. Por eso los eventos deben ser inmutables: ningún módulo debe modificar un evento una vez registrado. Si algo cambia después, se registra un nuevo evento que explique el cambio.

Los eventos permiten reconstruir una historia operativa del torneo, alimentar bitácoras, detectar riesgos, generar estadísticas, activar automatizaciones futuras y dar contexto confiable a módulos de inteligencia artificial sin alterar el Core deportivo.

## Estructura canónica del evento

```json
{
  "eventId": "evt_mabc1234_x9k2pz",
  "sequence": 1,
  "timestamp": "2026-07-08T18:00:00.000Z",
  "category": "SCORING",
  "type": "SCORE_PUBLISHED",
  "tournamentId": "torneo_abc123",
  "phase": "Fase 1",
  "charreadaId": "charreada_1",
  "teamId": "team_1",
  "participantId": "charro_1",
  "horseId": "horse_1",
  "source": "calificador",
  "actor": {
    "userId": "uid_1",
    "name": "Juez Principal",
    "role": "juez"
  },
  "payload": {}
}
```

### Propósito de cada campo

| Campo | Propósito |
|---|---|
| `eventId` | Identificador único e irrepetible del evento. Nunca debe reutilizarse. |
| `sequence` | Número consecutivo en la sesión o flujo donde se registró el evento. Ayuda a ordenar eventos con timestamps cercanos. |
| `timestamp` | Fecha y hora exacta en formato ISO. Todo evento debe tener timestamp. |
| `category` | Familia funcional del evento: sistema, torneo, programa, calificación, recuperación, etc. |
| `type` | Nombre específico del hecho ocurrido. Debe ser estable y en mayúsculas con guiones bajos. |
| `tournamentId` | Torneo asociado al evento. Puede ser `null` solo en eventos globales del sistema. |
| `phase` | Fase o ronda competitiva asociada, si aplica. |
| `charreadaId` | Charreada asociada, si aplica. |
| `teamId` | Equipo asociado, si aplica. |
| `participantId` | Charro, coleador, jinete, manganador u otro participante asociado, si aplica. |
| `horseId` | Caballo asociado, si aplica. |
| `source` | Módulo que generó el evento: `calificador`, `recovery-center`, `programa`, `public-snapshot`, etc. |
| `actor` | Usuario o rol que provocó el evento. Si no existe, debe ser `null`; no se inventa usuario. |
| `payload` | Datos específicos del evento. Debe conservar contexto suficiente sin duplicar todo el torneo. |

## Categorías oficiales

Las categorías oficiales son:

- `SYSTEM`
- `TOURNAMENT`
- `PROGRAM`
- `SCORING`
- `PARTICIPANTS`
- `STATISTICS`
- `PRODUCTION`
- `PUBLIC`
- `RECOVERY`
- `AUDIT`
- `AI`

## Nivel de importancia

| Nivel | Uso |
|---|---|
| `INFO` | Evento informativo sin impacto operativo directo. |
| `SUCCESS` | Acción completada correctamente. |
| `WARNING` | Situación que requiere atención, pero no bloquea operación. |
| `ERROR` | Fallo que afecta un flujo o módulo. |
| `CRITICAL` | Riesgo de pérdida de datos, publicación incorrecta o afectación en vivo. |
| `HISTORICAL` | Evento relevante para estadísticas, historial o memoria permanente del deporte. |

## Persistencia

| Nivel | Uso |
|---|---|
| `MEMORY` | Eventos temporales de sesión. Útiles para UI, pruebas y flujos inmediatos. |
| `LOCAL` | Eventos útiles para recuperación local, diagnóstico o continuidad del operador. |
| `FIREBASE` | Eventos operativos que deben compartirse entre dispositivos autorizados. |
| `HISTORICAL` | Eventos permanentes que formarán parte del historial deportivo o auditoría de largo plazo. |

`MEMORY` debe usarse para eventos efímeros. `LOCAL` para estado de operación del navegador. `FIREBASE` para bitácora oficial multiusuario. `HISTORICAL` para datos que CharroPro deberá preservar durante años.

## Catálogo maestro de eventos

### SYSTEM

#### APP_STARTED
- Descripción: La aplicación inició en el navegador.
- Generado por: Core.
- Prioridad: Operativa.
- Nivel: `INFO`.
- Persistencia: `MEMORY`.
- Visible en Bitácora: No.
- Visible Dashboard: No.
- Visible IA: No.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "appVersion": "string", "userAgent": "string" }
```

#### APP_READY
- Descripción: CharroPro terminó de preparar estado, permisos y módulos básicos.
- Generado por: Core.
- Prioridad: Operativa.
- Nivel: `SUCCESS`.
- Persistencia: `MEMORY`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: No.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "tournamentId": "string", "modulesReady": ["string"] }
```

#### APP_VERSION_LOADED
- Descripción: Se cargó una versión/cache-buster de CharroPro.
- Generado por: Core Infra.
- Prioridad: Diagnóstico.
- Nivel: `INFO`.
- Persistencia: `LOCAL`.
- Visible en Bitácora: No.
- Visible Dashboard: No.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "appVersion": "string" }
```

#### MODULE_LOADED
- Descripción: Un módulo crítico fue cargado correctamente.
- Generado por: Core.
- Prioridad: Diagnóstico.
- Nivel: `INFO`.
- Persistencia: `MEMORY`.
- Visible en Bitácora: No.
- Visible Dashboard: No.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "module": "string", "version": "string" }
```

#### MODULE_ERROR
- Descripción: Un módulo crítico falló al cargar o ejecutar.
- Generado por: Core.
- Prioridad: Operativa.
- Nivel: `ERROR`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "module": "string", "message": "string", "stack": "string" }
```

#### CONNECTION_ONLINE
- Descripción: El cliente recuperó conexión.
- Generado por: Sync.
- Prioridad: Operativa.
- Nivel: `SUCCESS`.
- Persistencia: `MEMORY`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: No.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "networkType": "string" }
```

#### CONNECTION_OFFLINE
- Descripción: El cliente perdió conexión.
- Generado por: Sync.
- Prioridad: Operativa.
- Nivel: `WARNING`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "lastOnlineAt": "string" }
```

#### FIREBASE_SYNC_STARTED
- Descripción: Inició sincronización con Firebase.
- Generado por: Firebase Sync.
- Prioridad: Diagnóstico.
- Nivel: `INFO`.
- Persistencia: `MEMORY`.
- Visible en Bitácora: No.
- Visible Dashboard: No.
- Visible IA: No.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "paths": ["string"] }
```

#### FIREBASE_SYNC_COMPLETED
- Descripción: La sincronización con Firebase terminó correctamente.
- Generado por: Firebase Sync.
- Prioridad: Diagnóstico.
- Nivel: `SUCCESS`.
- Persistencia: `MEMORY`.
- Visible en Bitácora: No.
- Visible Dashboard: No.
- Visible IA: No.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "durationMs": 0, "paths": ["string"] }
```

#### FIREBASE_SYNC_FAILED
- Descripción: La sincronización con Firebase falló.
- Generado por: Firebase Sync.
- Prioridad: Operativa.
- Nivel: `ERROR`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "path": "string", "code": "string", "message": "string" }
```

#### PERMISSION_DENIED
- Descripción: Firebase rechazó una operación por permisos.
- Generado por: Firebase Sync.
- Prioridad: Operativa.
- Nivel: `ERROR`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "path": "string", "operation": "read|write", "role": "string" }
```

#### CACHE_MIGRATED
- Descripción: Se migró caché local a una estructura nueva.
- Generado por: Local Cache.
- Prioridad: Técnica.
- Nivel: `SUCCESS`.
- Persistencia: `LOCAL`.
- Visible en Bitácora: Sí.
- Visible Dashboard: No.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "fromKey": "string", "toKey": "string" }
```

#### CACHE_CLEANED
- Descripción: Se limpiaron llaves locales obsoletas.
- Generado por: Local Cache.
- Prioridad: Técnica.
- Nivel: `SUCCESS`.
- Persistencia: `LOCAL`.
- Visible en Bitácora: Sí.
- Visible Dashboard: No.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "removedKeys": ["string"] }
```

### TOURNAMENT

#### TOURNAMENT_CREATED
- Descripción: Se creó un torneo.
- Generado por: Configuración del torneo.
- Prioridad: Operativa.
- Nivel: `SUCCESS`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "name": "string", "createdBy": "string" }
```

#### TOURNAMENT_OPENED
- Descripción: Un usuario abrió un torneo existente.
- Generado por: Core.
- Prioridad: Operativa.
- Nivel: `INFO`.
- Persistencia: `MEMORY`.
- Visible en Bitácora: No.
- Visible Dashboard: No.
- Visible IA: No.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "tournamentName": "string" }
```

#### TOURNAMENT_ACTIVATED
- Descripción: Se marcó un torneo como activo para operación.
- Generado por: Supervisor.
- Prioridad: Operativa.
- Nivel: `SUCCESS`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "previousTournamentId": "string" }
```

#### TOURNAMENT_UPDATED
- Descripción: Se actualizaron datos generales del torneo.
- Generado por: Configuración.
- Prioridad: Administrativa.
- Nivel: `INFO`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: No.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "changedFields": ["string"] }
```

#### TOURNAMENT_CLOSED
- Descripción: El torneo fue cerrado operativamente.
- Generado por: Supervisor.
- Prioridad: Histórica.
- Nivel: `HISTORICAL`.
- Persistencia: `HISTORICAL`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "closedAt": "string", "winnerTeamId": "string" }
```

#### TOURNAMENT_ARCHIVED
- Descripción: El torneo fue enviado a archivo histórico.
- Generado por: Administrador.
- Prioridad: Histórica.
- Nivel: `HISTORICAL`.
- Persistencia: `HISTORICAL`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "archiveId": "string" }
```

#### TOURNAMENT_SETTINGS_UPDATED
- Descripción: Se modificó configuración operativa del torneo.
- Generado por: Configuración.
- Prioridad: Administrativa.
- Nivel: `WARNING`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "settings": ["string"] }
```

#### TOURNAMENT_EXPORTED
- Descripción: Se exportó información del torneo.
- Generado por: Exportaciones.
- Prioridad: Administrativa.
- Nivel: `INFO`.
- Persistencia: `LOCAL`.
- Visible en Bitácora: Sí.
- Visible Dashboard: No.
- Visible IA: No.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "format": "json|csv|xlsx", "fileName": "string" }
```

#### PUBLIC_SNAPSHOT_GENERATED
- Descripción: Se generó el snapshot público del torneo.
- Generado por: Public Snapshot Builder.
- Prioridad: Operativa.
- Nivel: `SUCCESS`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "version": 1, "keys": ["string"] }
```

### PROGRAM

#### PHASE_CREATED
- Descripción: Se creó una fase o ronda competitiva.
- Generado por: Programa.
- Prioridad: Administrativa.
- Nivel: `INFO`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: No.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "phase": "string", "phaseOrder": 1 }
```

#### PHASE_UPDATED
- Descripción: Se actualizó una fase o ronda.
- Generado por: Programa.
- Prioridad: Administrativa.
- Nivel: `INFO`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: No.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "phase": "string", "changedFields": ["string"] }
```

#### CHARREADA_CREATED
- Descripción: Se creó una charreada dentro del torneo.
- Generado por: Programa.
- Prioridad: Operativa.
- Nivel: `SUCCESS`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "name": "string", "phase": "string", "scheduledAt": "string" }
```

#### CHARREADA_UPDATED
- Descripción: Se editó información de una charreada.
- Generado por: Programa.
- Prioridad: Operativa.
- Nivel: `INFO`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "changedFields": ["string"] }
```

#### CHARREADA_ACTIVATED
- Descripción: Una charreada fue marcada como activa.
- Generado por: Supervisor.
- Prioridad: Crítica.
- Nivel: `CRITICAL`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "previousCharreadaId": "string", "activeCharreadaId": "string" }
```

#### CHARREADA_STARTED
- Descripción: Una charreada inició oficialmente.
- Generado por: Supervisor o Programa.
- Prioridad: Operativa.
- Nivel: `SUCCESS`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "startedAt": "string", "teamIds": ["string"] }
```

#### CHARREADA_PAUSED
- Descripción: Una charreada fue pausada.
- Generado por: Producción o Supervisor.
- Prioridad: Operativa.
- Nivel: `WARNING`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "reason": "string" }
```

#### CHARREADA_RESUMED
- Descripción: Una charreada pausada fue reanudada.
- Generado por: Producción o Supervisor.
- Prioridad: Operativa.
- Nivel: `SUCCESS`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "resumedAt": "string" }
```

#### CHARREADA_FINISHED
- Descripción: Una charreada terminó oficialmente.
- Generado por: Supervisor.
- Prioridad: Histórica.
- Nivel: `HISTORICAL`.
- Persistencia: `HISTORICAL`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "finishedAt": "string", "winnerTeamId": "string" }
```

#### CHARREADA_SUSPENDED
- Descripción: Una charreada fue suspendida.
- Generado por: Supervisor.
- Prioridad: Crítica.
- Nivel: `CRITICAL`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "reason": "string" }
```

#### CHARREADA_CANCELLED
- Descripción: Una charreada fue cancelada.
- Generado por: Supervisor.
- Prioridad: Crítica.
- Nivel: `CRITICAL`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "reason": "string" }
```

#### CHARREADA_ORDER_CHANGED
- Descripción: Cambió el orden de participación o programación.
- Generado por: Programa.
- Prioridad: Operativa.
- Nivel: `WARNING`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "previousOrder": ["string"], "newOrder": ["string"] }
```

#### TEAM_ASSIGNED_TO_CHARREADA
- Descripción: Un equipo fue agregado a una charreada.
- Generado por: Programa.
- Prioridad: Operativa.
- Nivel: `INFO`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: No.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "teamId": "string", "order": 1 }
```

#### TEAM_REMOVED_FROM_CHARREADA
- Descripción: Un equipo fue retirado de una charreada.
- Generado por: Programa.
- Prioridad: Operativa.
- Nivel: `WARNING`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "teamId": "string", "reason": "string" }
```

### SCORING

#### SCORING_SESSION_STARTED
- Descripción: Un juez abrió una sesión de calificación.
- Generado por: Calificador.
- Prioridad: Operativa.
- Nivel: `INFO`.
- Persistencia: `MEMORY`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: No.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "suerteId": "string", "teamId": "string" }
```

#### SUERTE_STARTED
- Descripción: Se inicia oficialmente una suerte.
- Generado por: Calificador.
- Prioridad: Operativa.
- Nivel: `INFO`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: No.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "suerteId": "string", "teamId": "string", "participantId": "string", "horseId": "string" }
```

#### SUERTE_FINISHED
- Descripción: Se terminó la captura de una suerte.
- Generado por: Calificador.
- Prioridad: Operativa.
- Nivel: `SUCCESS`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "suerteId": "string", "teamId": "string", "total": 0 }
```

#### ATTEMPT_STARTED
- Descripción: Inició un intento u oportunidad.
- Generado por: Calificador.
- Prioridad: Operativa.
- Nivel: `INFO`.
- Persistencia: `MEMORY`.
- Visible en Bitácora: No.
- Visible Dashboard: No.
- Visible IA: No.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "attempt": 1, "opportunity": 1, "suerteId": "string" }
```

#### ATTEMPT_UPDATED
- Descripción: Se actualizó un intento antes de publicar.
- Generado por: Calificador.
- Prioridad: Operativa.
- Nivel: `INFO`.
- Persistencia: `MEMORY`.
- Visible en Bitácora: No.
- Visible Dashboard: No.
- Visible IA: No.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "attempt": 1, "base": 0, "additional": 0, "penalties": 0 }
```

#### ATTEMPT_FINISHED
- Descripción: Terminó un intento u oportunidad.
- Generado por: Calificador.
- Prioridad: Operativa.
- Nivel: `SUCCESS`.
- Persistencia: `MEMORY`.
- Visible en Bitácora: No.
- Visible Dashboard: No.
- Visible IA: No.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "attempt": 1, "total": 0 }
```

#### TIME_EVIDENCE_CAPTURED
- Descripción: El juez capturó evidencia manual de tiempo.
- Generado por: Calificador.
- Prioridad: Operativa.
- Nivel: `INFO`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "label": "string", "timeMs": 0, "timeText": "string", "timerRunning": true }
```

#### TIME_EVIDENCE_REMOVED
- Descripción: El juez eliminó una evidencia de tiempo antes de publicar.
- Generado por: Calificador.
- Prioridad: Operativa.
- Nivel: `WARNING`.
- Persistencia: `MEMORY`.
- Visible en Bitácora: Sí.
- Visible Dashboard: No.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "evidenceId": "string", "reason": "string" }
```

#### SCORE_DRAFT_CREATED
- Descripción: Se creó un borrador de calificación local.
- Generado por: Calificador.
- Prioridad: Operativa.
- Nivel: `INFO`.
- Persistencia: `LOCAL`.
- Visible en Bitácora: No.
- Visible Dashboard: No.
- Visible IA: No.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "draftId": "string", "suerteId": "string" }
```

#### SCORE_DRAFT_UPDATED
- Descripción: Se actualizó un borrador de calificación.
- Generado por: Calificador.
- Prioridad: Operativa.
- Nivel: `INFO`.
- Persistencia: `LOCAL`.
- Visible en Bitácora: No.
- Visible Dashboard: No.
- Visible IA: No.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "draftId": "string", "changedFields": ["string"] }
```

#### SCORE_DRAFT_DISCARDED
- Descripción: Se descartó un borrador.
- Generado por: Calificador.
- Prioridad: Operativa.
- Nivel: `WARNING`.
- Persistencia: `LOCAL`.
- Visible en Bitácora: Sí.
- Visible Dashboard: No.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "draftId": "string", "reason": "string" }
```

#### SCORE_SAVED
- Descripción: La calificación fue guardada en el Core.
- Generado por: Calificador.
- Prioridad: Crítica.
- Nivel: `SUCCESS`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "scoreId": "string", "total": 0 }
```

#### SCORE_PUBLISHED
- Descripción: La calificación fue publicada oficialmente.
- Generado por: Calificador.
- Prioridad: Crítica.
- Nivel: `HISTORICAL`.
- Persistencia: `HISTORICAL`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "scoreId": "string", "total": 0, "publishedAt": "string" }
```

#### SCORE_CORRECTED
- Descripción: Una calificación publicada fue corregida.
- Generado por: Supervisor.
- Prioridad: Crítica.
- Nivel: `CRITICAL`.
- Persistencia: `HISTORICAL`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "scoreId": "string", "previousTotal": 0, "newTotal": 0, "reason": "string" }
```

#### SCORE_REVOKED
- Descripción: Una calificación fue anulada operativamente.
- Generado por: Supervisor.
- Prioridad: Crítica.
- Nivel: `CRITICAL`.
- Persistencia: `HISTORICAL`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "scoreId": "string", "reason": "string" }
```

#### SCORE_PUBLICATION_BLOCKED
- Descripción: Se bloqueó una publicación por guardia de seguridad.
- Generado por: Calificador.
- Prioridad: Crítica.
- Nivel: `CRITICAL`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "reason": "active-charreada-changed", "expectedCharreadaId": "string", "actualCharreadaId": "string" }
```

#### SAVE_AND_NEXT_COMPLETED
- Descripción: Se guardó y avanzó correctamente al siguiente participante.
- Generado por: Calificador.
- Prioridad: Operativa.
- Nivel: `SUCCESS`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "previousTeamId": "string", "nextTeamId": "string", "nextSuerteId": "string" }
```

#### TEAM_FINISHED
- Descripción: Un equipo terminó su participación en una charreada o fase.
- Generado por: Calificador.
- Prioridad: Histórica.
- Nivel: `HISTORICAL`.
- Persistencia: `HISTORICAL`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "teamId": "string", "total": 0, "completedSuertes": ["string"] }
```

#### BEST_COLEADOR_CALCULATED
- Descripción: Se calculó el mejor coleador de la suerte de Colas.
- Generado por: Calificador.
- Prioridad: Producción.
- Nivel: `INFO`.
- Persistencia: `MEMORY`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "winners": [{ "participantId": "string", "name": "string", "score": 0 }] }
```

### PARTICIPANTS

#### TEAM_CREATED
- Descripción: Se registró un equipo.
- Generado por: Configuración.
- Prioridad: Operativa.
- Nivel: `SUCCESS`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "teamName": "string", "association": "string" }
```

#### TEAM_UPDATED
- Descripción: Se actualizó información de un equipo.
- Generado por: Configuración.
- Prioridad: Operativa.
- Nivel: `INFO`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: No.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "changedFields": ["string"] }
```

#### TEAM_REMOVED
- Descripción: Se retiró un equipo del torneo.
- Generado por: Supervisor.
- Prioridad: Crítica.
- Nivel: `WARNING`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "teamId": "string", "reason": "string" }
```

#### LINEUP_CREATED
- Descripción: Se creó una alineación de equipo.
- Generado por: Configuración.
- Prioridad: Operativa.
- Nivel: `SUCCESS`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: No.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "teamId": "string", "participantsCount": 0, "horsesCount": 0 }
```

#### LINEUP_UPDATED
- Descripción: Se actualizó una alineación.
- Generado por: Configuración.
- Prioridad: Operativa.
- Nivel: `INFO`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: No.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "teamId": "string", "changedFields": ["string"] }
```

#### PARTICIPANT_CREATED
- Descripción: Se registró un charro o participante.
- Generado por: Configuración.
- Prioridad: Operativa.
- Nivel: `SUCCESS`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: No.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "participantName": "string", "role": "string" }
```

#### PARTICIPANT_UPDATED
- Descripción: Se actualizó información de un participante.
- Generado por: Configuración.
- Prioridad: Administrativa.
- Nivel: `INFO`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: No.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "participantId": "string", "changedFields": ["string"] }
```

#### HORSE_CREATED
- Descripción: Se registró un caballo.
- Generado por: Configuración.
- Prioridad: Operativa.
- Nivel: `SUCCESS`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: No.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "horseName": "string", "teamId": "string" }
```

#### HORSE_UPDATED
- Descripción: Se actualizó información de un caballo.
- Generado por: Configuración.
- Prioridad: Administrativa.
- Nivel: `INFO`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: No.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "horseId": "string", "changedFields": ["string"] }
```

#### PARTICIPANT_ASSIGNED_TO_SUERTE
- Descripción: Un participante fue asignado a una suerte.
- Generado por: Alineaciones.
- Prioridad: Operativa.
- Nivel: `INFO`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: No.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "participantId": "string", "suerteId": "string", "teamId": "string" }
```

#### HORSE_ASSIGNED_TO_PARTICIPANT
- Descripción: Un caballo fue asignado a un participante.
- Generado por: Alineaciones.
- Prioridad: Operativa.
- Nivel: `INFO`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: No.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "horseId": "string", "participantId": "string", "suerteId": "string" }
```

### STATISTICS

#### SCOREBOARD_REBUILT
- Descripción: Se reconstruyó el marcador actual.
- Generado por: Core Statistics.
- Prioridad: Operativa.
- Nivel: `SUCCESS`.
- Persistencia: `MEMORY`.
- Visible en Bitácora: No.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "rows": 0, "activeCharreadaId": "string" }
```

#### RANKING_REBUILT
- Descripción: Se reconstruyó el ranking general.
- Generado por: Core Statistics.
- Prioridad: Operativa.
- Nivel: `SUCCESS`.
- Persistencia: `MEMORY`.
- Visible en Bitácora: No.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "rows": 0, "leaderTeamId": "string" }
```

#### SCORESHEET_REBUILT
- Descripción: Se reconstruyó la sábana del torneo.
- Generado por: Core Statistics.
- Prioridad: Operativa.
- Nivel: `SUCCESS`.
- Persistencia: `MEMORY`.
- Visible en Bitácora: No.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "rows": 0, "columns": ["string"] }
```

#### LEADERS_REBUILT
- Descripción: Se recalcularon líderes por suerte.
- Generado por: Core Statistics.
- Prioridad: Estadística.
- Nivel: `SUCCESS`.
- Persistencia: `MEMORY`.
- Visible en Bitácora: No.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "leadersCount": 0 }
```

#### TEAM_RANK_CHANGED
- Descripción: Un equipo cambió de posición en el ranking.
- Generado por: Core Statistics.
- Prioridad: Estadística.
- Nivel: `INFO`.
- Persistencia: `HISTORICAL`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "teamId": "string", "previousPosition": 0, "newPosition": 0 }
```

#### RECORD_SET
- Descripción: Se registró un nuevo récord.
- Generado por: Core Statistics.
- Prioridad: Histórica.
- Nivel: `HISTORICAL`.
- Persistencia: `HISTORICAL`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: Sí.
- Payload esperado:
```json
{ "recordType": "string", "value": 0, "holderId": "string" }
```

#### STATISTICS_EXPORT_CREATED
- Descripción: Se creó una exportación estadística.
- Generado por: Estadísticas.
- Prioridad: Administrativa.
- Nivel: `INFO`.
- Persistencia: `LOCAL`.
- Visible en Bitácora: Sí.
- Visible Dashboard: No.
- Visible IA: No.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "format": "string", "fileName": "string" }
```

### PRODUCTION

#### GRAPHIC_TEMPLATE_ACTIVATED
- Descripción: Se activó una plantilla gráfica.
- Generado por: Gráficos.
- Prioridad: Producción.
- Nivel: `SUCCESS`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "templateId": "string", "type": "scoreboard|ranking|timer" }
```

#### GRAPHIC_PUBLISHED
- Descripción: Se publicó un gráfico a la ruta live.
- Generado por: Gráficos.
- Prioridad: Producción.
- Nivel: `SUCCESS`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "type": "string", "path": "string" }
```

#### GRAPHIC_PUBLISH_FAILED
- Descripción: Falló la publicación de un gráfico.
- Generado por: Gráficos.
- Prioridad: Producción.
- Nivel: `ERROR`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "type": "string", "path": "string", "code": "string", "message": "string" }
```

#### OBS_CONNECTED
- Descripción: OBS o pantalla de producción se conectó.
- Generado por: OBS.
- Prioridad: Producción.
- Nivel: `SUCCESS`.
- Persistencia: `MEMORY`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: No.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "screen": "string" }
```

#### OBS_DISCONNECTED
- Descripción: OBS o pantalla de producción se desconectó.
- Generado por: OBS.
- Prioridad: Producción.
- Nivel: `WARNING`.
- Persistencia: `MEMORY`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: No.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "screen": "string", "lastSeenAt": "string" }
```

#### TIMER_STARTED
- Descripción: El cronómetro inició.
- Generado por: Cronómetro.
- Prioridad: Producción.
- Nivel: `INFO`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: No.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "timerId": "string", "durationMs": 0 }
```

#### TIMER_PAUSED
- Descripción: El cronómetro fue pausado.
- Generado por: Cronómetro.
- Prioridad: Producción.
- Nivel: `INFO`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: No.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "timerId": "string", "elapsedMs": 0 }
```

#### TIMER_RESUMED
- Descripción: El cronómetro fue reanudado.
- Generado por: Cronómetro.
- Prioridad: Producción.
- Nivel: `INFO`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: No.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "timerId": "string", "elapsedMs": 0 }
```

#### TIMER_STOPPED
- Descripción: El cronómetro se detuvo.
- Generado por: Cronómetro.
- Prioridad: Producción.
- Nivel: `INFO`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: No.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "timerId": "string", "elapsedMs": 0 }
```

#### PRODUCTION_NOTE_ADDED
- Descripción: Producción agregó una nota operativa.
- Generado por: Programa o Producción.
- Prioridad: Producción.
- Nivel: `INFO`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "note": "string", "visibility": "internal" }
```

### PUBLIC

#### PUBLIC_SNAPSHOT_PUBLISHED
- Descripción: El snapshot público fue escrito correctamente.
- Generado por: Public Snapshot Builder.
- Prioridad: Pública.
- Nivel: `SUCCESS`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "version": 1, "generatedAt": "string" }
```

#### PUBLIC_SNAPSHOT_FAILED
- Descripción: Falló la publicación del snapshot público.
- Generado por: Public Snapshot Builder.
- Prioridad: Pública.
- Nivel: `ERROR`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "code": "string", "message": "string", "path": "string" }
```

#### PUBLIC_PAGE_VIEWED
- Descripción: Se abrió la página pública.
- Generado por: Página Pública.
- Prioridad: Analítica.
- Nivel: `INFO`.
- Persistencia: `MEMORY`.
- Visible en Bitácora: No.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "route": "string", "device": "string" }
```

#### PUBLIC_DATA_LOADED
- Descripción: La página pública cargó datos reales.
- Generado por: Página Pública.
- Prioridad: Pública.
- Nivel: `SUCCESS`.
- Persistencia: `MEMORY`.
- Visible en Bitácora: No.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "snapshotVersion": 1, "sections": ["string"] }
```

#### PUBLIC_DATA_UNAVAILABLE
- Descripción: La página pública no encontró datos reales disponibles.
- Generado por: Página Pública.
- Prioridad: Pública.
- Nivel: `WARNING`.
- Persistencia: `MEMORY`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "reason": "string" }
```

#### PUBLIC_SPONSOR_DISPLAYED
- Descripción: Se mostró un patrocinador en la vista pública.
- Generado por: Página Pública.
- Prioridad: Comercial.
- Nivel: `INFO`.
- Persistencia: `MEMORY`.
- Visible en Bitácora: No.
- Visible Dashboard: Sí.
- Visible IA: No.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "sponsorId": "string", "placement": "string" }
```

### RECOVERY

#### BACKUP_CREATED
- Descripción: Se generó un respaldo manual completo.
- Generado por: Recovery Center.
- Prioridad: Seguridad.
- Nivel: `SUCCESS`.
- Persistencia: `LOCAL`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "fileName": "string", "teamsCount": 0, "charreadasCount": 0, "scoresCount": 0, "publishedScoresCount": 0 }
```

#### BACKUP_DOWNLOAD_STARTED
- Descripción: Inició descarga de respaldo.
- Generado por: Recovery Center.
- Prioridad: Seguridad.
- Nivel: `INFO`.
- Persistencia: `MEMORY`.
- Visible en Bitácora: No.
- Visible Dashboard: No.
- Visible IA: No.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "fileName": "string" }
```

#### BACKUP_DOWNLOAD_FAILED
- Descripción: Falló descarga o generación de archivo de respaldo.
- Generado por: Recovery Center.
- Prioridad: Seguridad.
- Nivel: `ERROR`.
- Persistencia: `LOCAL`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "fileName": "string", "message": "string" }
```

#### BACKUP_HISTORY_CLEARED
- Descripción: El usuario limpió el historial local de respaldos.
- Generado por: Recovery Center.
- Prioridad: Seguridad.
- Nivel: `WARNING`.
- Persistencia: `LOCAL`.
- Visible en Bitácora: Sí.
- Visible Dashboard: No.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "tournamentId": "string", "recordsRemoved": 0 }
```

#### RECOVERY_STATUS_CHANGED
- Descripción: Cambió el estado de salud del torneo.
- Generado por: Recovery Center.
- Prioridad: Seguridad.
- Nivel: `WARNING`.
- Persistencia: `LOCAL`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "previousStatus": "string", "newStatus": "string", "indicators": {} }
```

#### RESTORE_STARTED
- Descripción: Inició un proceso futuro de restauración.
- Generado por: Recovery Center.
- Prioridad: Crítica.
- Nivel: `CRITICAL`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "backupId": "string", "fileName": "string" }
```

#### RESTORE_COMPLETED
- Descripción: Terminó correctamente una restauración futura.
- Generado por: Recovery Center.
- Prioridad: Crítica.
- Nivel: `CRITICAL`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "backupId": "string", "restoredKeys": ["string"] }
```

#### RESTORE_FAILED
- Descripción: Falló una restauración futura.
- Generado por: Recovery Center.
- Prioridad: Crítica.
- Nivel: `CRITICAL`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "backupId": "string", "message": "string" }
```

### AUDIT

#### USER_LOGIN
- Descripción: Un usuario inició sesión.
- Generado por: Autenticación.
- Prioridad: Seguridad.
- Nivel: `INFO`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: No.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "role": "string" }
```

#### USER_LOGOUT
- Descripción: Un usuario cerró sesión.
- Generado por: Autenticación.
- Prioridad: Seguridad.
- Nivel: `INFO`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: No.
- Visible IA: No.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "role": "string" }
```

#### ROLE_GRANTED
- Descripción: Se asignó un rol a un usuario.
- Generado por: Administración.
- Prioridad: Seguridad.
- Nivel: `WARNING`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "targetUserId": "string", "role": "string" }
```

#### ROLE_REVOKED
- Descripción: Se revocó un rol a un usuario.
- Generado por: Administración.
- Prioridad: Seguridad.
- Nivel: `WARNING`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "targetUserId": "string", "role": "string" }
```

#### AUTHORIZATION_FAILED
- Descripción: Un usuario intentó ejecutar una acción no permitida.
- Generado por: Core o Firebase Sync.
- Prioridad: Seguridad.
- Nivel: `ERROR`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "action": "string", "role": "string", "path": "string" }
```

#### CRITICAL_ACTION_CONFIRMED
- Descripción: Un usuario confirmó una acción sensible.
- Generado por: Core.
- Prioridad: Seguridad.
- Nivel: `WARNING`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "action": "string", "confirmationText": "string" }
```

#### AUDIT_EXPORT_CREATED
- Descripción: Se exportó una bitácora o auditoría.
- Generado por: Auditoría.
- Prioridad: Administrativa.
- Nivel: `INFO`.
- Persistencia: `LOCAL`.
- Visible en Bitácora: Sí.
- Visible Dashboard: No.
- Visible IA: No.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "fileName": "string", "range": "string" }
```

### AI

#### AI_CONTEXT_BUILT
- Descripción: Se preparó contexto para análisis de IA.
- Generado por: AI Engine.
- Prioridad: Inteligencia.
- Nivel: `INFO`.
- Persistencia: `MEMORY`.
- Visible en Bitácora: No.
- Visible Dashboard: No.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "contextType": "string", "eventCount": 0 }
```

#### AI_INSIGHT_GENERATED
- Descripción: La IA generó una observación o recomendación.
- Generado por: AI Engine.
- Prioridad: Inteligencia.
- Nivel: `INFO`.
- Persistencia: `LOCAL`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "insightType": "string", "summary": "string", "confidence": 0 }
```

#### AI_RISK_DETECTED
- Descripción: La IA detectó riesgo operativo o deportivo.
- Generado por: AI Engine.
- Prioridad: Inteligencia.
- Nivel: `WARNING`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "riskType": "string", "severity": "string", "recommendation": "string" }
```

#### AI_ANOMALY_DETECTED
- Descripción: Se detectó una anomalía en datos, operación o publicación.
- Generado por: AI Engine.
- Prioridad: Inteligencia.
- Nivel: `ERROR`.
- Persistencia: `FIREBASE`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "anomalyType": "string", "affectedIds": ["string"] }
```

#### AI_REPORT_CREATED
- Descripción: La IA generó un reporte del torneo.
- Generado por: AI Engine.
- Prioridad: Inteligencia.
- Nivel: `HISTORICAL`.
- Persistencia: `HISTORICAL`.
- Visible en Bitácora: Sí.
- Visible Dashboard: Sí.
- Visible IA: Sí.
- Visible Página Pública: No.
- Payload esperado:
```json
{ "reportId": "string", "reportType": "string" }
```

## Política de retención

### Eventos temporales

Eventos de UI, navegación, carga de módulos y acciones efímeras deben vivir en memoria. No deben saturar Firebase ni formar parte de auditorías oficiales.

Ejemplos: `APP_STARTED`, `MODULE_LOADED`, `ATTEMPT_UPDATED`.

### Eventos permanentes

Eventos operativos que explican el estado del torneo deben persistirse mientras el torneo esté activo y durante su revisión posterior.

Ejemplos: `CHARREADA_ACTIVATED`, `SCORE_SAVED`, `PUBLIC_SNAPSHOT_PUBLISHED`.

### Eventos históricos

Eventos que forman parte de la historia deportiva o estadística deben conservarse a largo plazo.

Ejemplos: `SCORE_PUBLISHED`, `TEAM_FINISHED`, `RECORD_SET`, `TOURNAMENT_CLOSED`.

### Eventos de auditoría

Eventos de seguridad, permisos, correcciones, anulaciones y acciones críticas deben conservarse con mayor rigor. No deben poder editarse ni eliminarse desde la interfaz ordinaria.

Ejemplos: `SCORE_CORRECTED`, `AUTHORIZATION_FAILED`, `ROLE_GRANTED`, `RESTORE_COMPLETED`.

## Reglas del Event Engine

1. No modificar eventos.
2. No eliminar eventos históricos.
3. No reutilizar IDs.
4. Todo evento debe tener `timestamp`.
5. Todo evento debe tener `category`.
6. Todo evento debe tener `type`.
7. Todo evento debe tener `source`.
8. El `payload` debe ser clonado para evitar mutaciones externas.
9. Un evento describe algo que ya ocurrió.
10. Si se corrige un hecho, se registra otro evento; no se edita el original.
11. Los módulos deben consumir eventos, no depender de detalles internos de otros módulos.
12. Los eventos no deben reemplazar los datos oficiales del Core; deben describir cambios y hechos.

## Buenas prácticas

### Qué sí hacer

- Usar nombres de evento estables y explícitos.
- Mantener `payload` pequeño pero suficiente.
- Registrar eventos críticos antes y después de operaciones sensibles.
- Incluir IDs estables: torneo, charreada, equipo, participante y caballo.
- Diferenciar `source` de `actor`: el source es el módulo; el actor es quien provocó la acción.
- Usar `WARNING`, `ERROR` y `CRITICAL` con disciplina.
- Diseñar eventos para que puedan ser leídos por humanos, dashboards e IA.
- Versionar cambios mayores del catálogo.

### Qué no hacer

- No usar eventos para guardar estado mutable principal.
- No guardar datos sensibles innecesarios en `payload`.
- No registrar emails, tokens, contraseñas, claves o información privada.
- No registrar eventos duplicados para la misma acción.
- No usar textos libres como `type`.
- No mezclar categorías.
- No hacer que un módulo dependa de la estructura privada del payload de otro módulo sin contrato.
- No borrar eventos de auditoría para "limpiar" la interfaz.

## Roadmap

### EVENT-002 - Captura automática

Integrar captura automática de eventos desde puntos críticos del Core: torneo, programa, calificador, publicación, recovery y snapshot público.

### EVENT-003 - Bitácora

Crear una bitácora operativa visible para supervisor y producción, filtrable por categoría, severidad, módulo, torneo, charreada y equipo.

### EVENT-004 - Dashboard

Crear un dashboard de estado del torneo basado en eventos: salud, actividad reciente, errores, publicaciones y alertas.

### EVENT-005 - Timeline

Construir una línea de tiempo por torneo, charreada, equipo y suerte para reconstruir lo ocurrido durante una competencia.

### EVENT-006 - IA

Usar eventos como contexto oficial para recomendaciones, detección de anomalías y resúmenes inteligentes sin tocar cálculos deportivos.

### EVENT-007 - Analytics

Generar analítica histórica, eficiencia operativa, tiempos de competencia, tendencias por suerte, récords y rendimiento por equipo.

## Conclusiones del arquitecto

El Event Engine debe convertirse en la memoria estructurada de CharroPro. Su función no es reemplazar el Core, sino explicar lo que el Core hizo y cuándo lo hizo. Esa separación protege la lógica deportiva, mejora la auditoría y permite que módulos futuros crezcan sin contaminar los flujos estables.

Para mantener el Event Engine durante los próximos años, CharroPro debe tratar este catálogo como contrato oficial. Cada nuevo módulo debe registrar eventos con categoría, tipo, source y payload bien definidos. Cada evento nuevo debe justificar su existencia, su nivel de persistencia y su visibilidad.

La prioridad arquitectónica debe ser conservar eventos inmutables, evitar datos sensibles, mantener nombres estables y construir herramientas de lectura antes de expandir la escritura masiva. Un Event Engine disciplinado permitirá bitácoras confiables, dashboards útiles, recuperación más segura, IA con contexto real y estadísticas históricas sin poner en riesgo la operación deportiva.

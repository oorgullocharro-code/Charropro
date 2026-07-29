# CharroPro Master Audit - Firebase y modelo de datos

## Resumen

Firebase Realtime Database es la persistencia autoritativa online. `localStorage` funciona como cache/draft del dispositivo, no como fuente multi-dispositivo. El modelo contiene una fuente privada por torneo, una capa live operativa, una proyección pública, auditoría, backups, usuarios y sesiones Broadcast.

## Mapa de rutas

```text
charropro/
  users/{uid}
  userTournamentAccess/{uid}/{tournamentId}
  tournamentIndex/{tournamentId}
  tournaments/{tournamentId}/
    info
    teams
    charreadas
    settings
    scores
    publishedScores
    history
    meta
  live/{tournamentId}/
    current
    timer
    turn
    ranking
    category
    calaDetail
    coleadero
    graphicsConfig
  publicTournaments/{tournamentId}
  audit/publishedScores/{tournamentId}/{recordId}
  history/statistics/{tournamentId}
  backups/{tournamentId}/{backupId}
  judges/
  broadcastStudio/sessions/{sessionId}/
    context
    program/current
    announcer/current
    outputs
    access
    revisions/health
```

## Fuente de verdad

| Concepto | Fuente actual | Proyección/caché |
| --- | --- | --- |
| Torneo/configuración | `tournaments/{id}/info|settings` | `tournamentIndex`, `publicTournaments.metadata` |
| Equipos/charreadas | `tournaments/{id}` | programa/resultados públicos |
| Score en edición | Estado local + `tournaments/{id}/scores` al publicar | Ninguna durable de draft |
| Score oficial | `tournaments/{id}/publishedScores` | audit, live, public results/feed, Broadcast |
| Auditoría | `audit/publishedScores` | No debería tener proyección |
| Turno operativo | `live/{id}/turn` y `live/{id}/current/turn` | public overview/live, Broadcast contract |
| Cronómetro | `live/{id}/timer` y `live/{id}/current/timer` | portal/Broadcast |
| Portal | `publicTournaments/{id}` | Estado en memoria del navegador |
| Broadcast Program | `broadcastStudio/sessions/{sessionId}/program/current` | Program Main |
| Announcer | `broadcastStudio/.../announcer/current` | Announcer Monitor |
| Backup | `backups/{id}/{timestamp}` y JSON descargado | Historial local solo metadata |

## Origen -> transformación -> consumidor

```text
Calificador
  -> scorePayload/publishedScore
  -> multipath tournaments + audit + live
  -> publicProjection V2
  -> publicTournaments
  -> Portal/Live Feed/Minuto a minuto

tournaments + live/current
  -> Broadcast Data Contract
  -> Live Bindings
  -> Preview/Program/Announcer projections
  -> broadcastStudio/sessions
  -> Program Main/Announcer Monitor
```

## Publicación oficial

`publishFirebaseOfficialScoreAtomic` construye una actualización multipath para:

- `tournaments/{id}/scores/{scoreId}`;
- `tournaments/{id}/publishedScores/{publishedId}`;
- `audit/publishedScores/{id}/{publishedId}`;
- `tournaments/{id}/meta`;
- `live/{id}/current`.

Esa parte usa una sola llamada `update`. Después ejecuta `publishPublicTournamentSnapshot` de forma separada. Si esta última falla:

- devuelve `ok: true`;
- marca `partialFailure: true`;
- la UI muestra “Guardado; portal pendiente”;
- el llamador libera el draft y avanza porque solo comprueba `ok`.

No se encontró:

- outbox durable;
- reintento programado;
- dead-letter;
- botón de reparación;
- reconciliador periódico;
- evento persistente de proyección pendiente.

## Concurrencia de score

`recordPublishedScore`:

- calcula `revision = previousRecords.length + 1` en memoria local;
- encuentra la versión activa local;
- muta publicaciones locales previas a `superseded`;
- crea un ID nuevo.

La escritura remota:

- agrega el nuevo ID;
- no usa transacción por `attemptKey`;
- no verifica expected revision;
- no actualiza atómicamente una cabeza canónica del intento;
- no supersede de forma única todas las publicaciones remotas previas.

Dos dispositivos con estado desactualizado pueden publicar el mismo intento con la misma revisión y ambos quedar activos.

## Correcciones

Una corrección normal desde un solo dispositivo crea un nuevo registro y conserva el anterior localmente como supersedido. Es una buena intención de historial. El problema es que la relación de reemplazo no es autoritativa en Firebase bajo concurrencia y la auditoría permite sobrescribir registros existentes.

## Valores nulos, vacíos y cero

Hallazgo confirmado:

```js
total: Number(record.total || 0)
```

en `normalizePublishedScore`.

Resultado:

- `0` se conserva correctamente;
- `null`, `undefined` y `""` también se convierten a `0`;
- se pierde la distinción “sin dato” vs score oficial cero.

En el flujo de calificación, `markAttemptZeroIfBlank` convierte deliberadamente un intento en cero antes de publicar. Esa decisión deportiva/operativa es distinta del defecto de normalización y no se debe mezclar.

## Participante o caballo “Sin registrar”

- Los contratos permiten nombre vacío/fallback.
- Participantes individuales pueden existir con ID temporal dentro de la jornada.
- El portal y Broadcast pueden mostrar fallback de nombre.
- No hay `participantId`/`charroId`/`horseId` maestro garantizado.
- El score sigue siendo publicable, pero estadísticas, deduplicación y lineage histórico pierden precisión.

## Turno y charreada activa

- La publicación valida que la charreada remota activa coincida.
- Broadcast usa el turno explícito del contrato, no el último score.
- Si la charreada activa cambia antes de publicar, el guard bloquea.
- Si el turno queda atrasado en `live`, portal y Broadcast reproducen ese atraso; no deben inferirlo del score.
- Turno y timer también publican la proyección pública en una segunda llamada, por lo que pueden quedar divergentes.

## Reglas: fortalezas

- Root `.read/.write` denegado.
- Usuarios requieren Auth y perfil activo.
- `publicTournaments` tiene lectura pública y esquema V2 con allowlists.
- La revisión pública debe avanzar y liveFeed no puede retroceder.
- Broadcast tiene contexto de sesión, visibility, revision y restricciones de rol.
- Program Main y Announcer se modelan como canales de solo lectura en sus clientes.

## Reglas: riesgos

### Datos privados

- Un usuario activo con `tournamentAccess` distinto de `selected` obtiene acceso amplio.
- El valor por defecto normalizado en JS es `all`.
- `tournaments/{id}` permite lectura completa a usuarios autorizados al torneo, sin reducción por rol.
- `scores`, `publishedScores`, `history` y `meta` tienen write por rol, pero no validación profunda de schema.
- Un juez puede escribir cualquier hijo de `meta`.

### Live

`live/{tournamentId}` tiene `.read: true`. Esto expone el payload operativo completo, no solo una proyección pública mínima. Aunque sea legado necesario para salidas V1, evita la frontera pública V2.

### Auditoría

`audit/publishedScores/{tournamentId}/{recordId}` permite `newData.exists()` e ID coincidente, pero no exige `!data.exists()`. Un registro se puede sobrescribir.

### Proyección pública

Supervisor, operador y juez pueden escribir un documento V2 completo válido. Las reglas protegen forma y revisión, pero no prueban que los datos se deriven del score oficial.

### Broadcast

Las reglas están mejor aisladas, pero fijan:

- `tenantId = charropro-e8a68`;
- `organizationId = null`;
- `clientId = null`.

Esto es single-tenant, no una política SaaS.

## Eliminación y archivado

`deleteFirebaseTournament` elimina:

- `tournamentIndex`;
- `tournaments`;
- `live`;
- `history/statistics`;
- `audit/publishedScores`.

No elimina:

- `publicTournaments/{id}`;
- sesiones Broadcast asociadas;
- backups existentes.

La limpieza de accesos de usuarios ocurre después. Si falla, la función devuelve `ok: true, cleanupOk: false`.

No existe un estado de tombstone/archived previo al borrado irreversible ni una restauración.

## Backups

Backup Firebase incluye:

- info;
- teams;
- charreadas;
- scores;
- publishedScores;
- history;
- meta;
- actor y timestamp.

No incluye:

- public projection;
- audit externo;
- usuarios/roles;
- settings globales;
- Broadcast sessions;
- manifest/checksum;
- firma/cifrado.

El JSON local incluye más datos, incluso usuarios visibles y diagnóstico, pero tampoco tiene restore.

## Public projection V2

Fortalezas:

- lee torneo privado y live/current;
- construye un candidato sanitizado;
- reconcilia con transacción;
- impide regresiones;
- valida schema antes de declarar éxito;
- el portal consume únicamente esta ruta.

Limitaciones:

- rankings/statistics/search deben quedar `unavailable` según reglas;
- la proyección se genera desde el cliente;
- no hay proceso server-side de reparación;
- el fallo posterior a score no bloquea el avance.

## Live Feed/minuto a minuto

El feed público es una sección persistida de `publicTournaments`:

- mezcla eventos explícitos y eventos derivados de publicaciones;
- limita el historial;
- usa IDs deterministas/derivados;
- viaja con la revisión pública;
- no es un event log independiente;
- una falla de proyección evita que llegue al portal;
- una corrección genera otra entrada, no reescribe necesariamente la narrativa anterior.

## Índices y costos

No se detectó un diseño de índices/costeo por tenant. La construcción de la proyección lee documentos completos de torneo/live. Para pocos torneos es viable; para cientos de organizaciones requiere:

- partición por organización;
- índices y queries acotadas;
- workers/proyecciones server-side;
- retención;
- métricas de bytes/lecturas/escrituras;
- archivos históricos fuera del working set.

## Recomendaciones

### P0

1. Outbox y reconciliación de `publicTournaments`.
2. Ledger transaccional por `attemptKey`.
3. Auditoría append-only.
4. Tombstone/borrado completo.
5. Autoridad transaccional del timer.

### P1

1. Validaciones de schema privadas.
2. Cerrar lectura pública de `live` tras migrar consumidores.
3. Reglas probadas con Emulator.
4. Normalización explícita de ausencia vs cero.
5. Restore verificado.
6. Repositorios separados del módulo Firebase universal.

### P2

1. Introducir `tenantId` y `organizationId`.
2. Mover publicación crítica a backend autorizado.
3. Políticas de retención/archivo.
4. Cost telemetry y límites.

## Estado si Firebase falla

- Antes/durante multipath privado: la publicación devuelve error, restaura estado local de publishedScores y no avanza.
- Después del multipath y antes/durante proyección pública: score/audit/live quedan guardados; portal puede quedar atrasado; la UI avanza.
- Durante `saveState`: un error de storage puede propagarse y cortar el flujo local.
- Sin internet: no existe outbox autoritativa para publicar después de forma automática y reconciliada.

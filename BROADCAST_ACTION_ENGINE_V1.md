# Broadcast Action Engine v1

## Proposito

Broadcast Action Engine es la puerta operativa oficial de Broadcast Studio. Convierte una intención declarativa de Production Console en una transición controlada sobre Broadcast State, Broadcast Output, Asset Manager y Broadcast Data Contract. Su versión inicial es `1.0.0`.

El motor no sustituye esos módulos ni modifica sus estructuras directamente. Orquesta exclusivamente sus APIs públicas, devuelve bloques nuevos y registra resultado y auditoría en memoria. No abre conexiones, no escribe en Firebase, no persiste permisos y no habilita automatización real.

## Arquitectura

```text
Production Console
        |
        v
createBroadcastAction()
        |
        v
dispatchBroadcastAction()
        |
        +--> validación
        +--> permisos conceptuales
        +--> precondiciones
        +--> expectedRevision
        +--> confirmación
        +--> idempotencia
        |
        v
APIs públicas de State / Output / Assets / Contract
        |
        v
resultado + auditoría + nuevos bloques
```

Una acción persistible contiene referencias y revisiones. El State, el contrato, los registries y el actor controlado viven en `BroadcastActionContext` durante la ejecución y no se duplican dentro de la acción.

## API publica

El módulo `js/broadcast/actionEngine.js` exporta:

- `BROADCAST_ACTION_ENGINE_VERSION`
- `ACTION_TYPES`
- `ACTION_STATUSES`
- `ACTION_MODES`
- `ACTION_CONFIRMATION_TYPES`
- `ACTION_RESULT_CODES`
- `BroadcastActionError`
- `createBroadcastAction()`
- `normalizeBroadcastAction()`
- `validateBroadcastAction()`
- `dispatchBroadcastAction()`
- `executeBroadcastAction()`
- `canExecuteBroadcastAction()`
- `requiresBroadcastActionConfirmation()`
- `confirmBroadcastAction()`
- `rejectBroadcastAction()`
- `cancelBroadcastAction()`
- `getBroadcastAction()`
- `listBroadcastActions()`
- `getBroadcastActionWarnings()`
- `buildBroadcastActionAuditEntry()`
- `cloneBroadcastAction()`
- `createBroadcastActionContext()`
- `validateBroadcastActionContext()`
- `getBroadcastActionResult()`

## Estructura canonica

```json
{
  "actionEngineVersion": "1.0.0",
  "actionId": "act_...",
  "sequence": 1,
  "actionType": "TAKE",
  "status": "created",
  "mode": "manual",
  "target": {},
  "payload": {},
  "actor": {
    "id": "operator_id",
    "name": "Operador",
    "role": "operador",
    "sessionId": "session_id",
    "deviceId": null,
    "source": "production-console",
    "visibility": "operational"
  },
  "context": {
    "tenantId": null,
    "organizationId": null,
    "tournamentId": null,
    "competitionId": null,
    "charreadaId": null,
    "outputIds": [],
    "stateRevision": 0,
    "contractRevision": 0
  },
  "permissions": [],
  "confirmation": {},
  "preconditions": [],
  "correlationId": null,
  "causationId": null,
  "idempotencyKey": null,
  "createdAt": "ISO-8601",
  "validatedAt": null,
  "confirmedAt": null,
  "executedAt": null,
  "completedAt": null,
  "expiresAt": null,
  "result": null,
  "warnings": [],
  "errors": [],
  "audit": {}
}
```

| Campo | Etiqueta en español | Tipo | Requerido | Significado |
| --- | --- | --- | --- | --- |
| `actionId` | ID de acción | string | Sí | Identificador único de la intención |
| `actionType` | Tipo de acción | string | Sí | Take, Clear, Heartbeat, etc. |
| `status` | Estado | string | Sí | Etapa actual del ciclo de vida |
| `mode` | Modo | string | Sí | Manual, semiautomático, automático o sistema |
| `target` | Objetivo | object | Sí | IDs explícitos de gráfico, layer u output |
| `payload` | Datos de acción | object | Sí | Datos declarativos permitidos para la acción |
| `actor.role` | Rol del actor | string | Condicional | Rol normalizado usado para capacidad conceptual |
| `context.stateRevision` | Revisión esperada | number | Condicional | Control optimista de concurrencia |
| `idempotencyKey` | Clave idempotente | string | No | Evita reejecuciones de una misma intención |
| `confirmation` | Confirmación | object | Condicional | Tipo, cantidad y registros explícitos |
| `result.code` | Código de resultado | string | No | Resultado final o requisito pendiente |

## Tipos de accion

### Seleccion y Preview

- `SELECT_GRAPHIC`
- `SET_SELECTION`
- `PREPARE_PREVIEW`
- `CLEAR_PREVIEW`

### Program

- `TAKE`
- `CUT`
- `AUTO`
- `CLEAR_PROGRAM`

### Graficos

- `SHOW_GRAPHIC`
- `HIDE_GRAPHIC`
- `HIDE_ALL`
- `UPDATE_GRAPHIC`
- `SET_GRAPHIC_GEOMETRY`
- `SET_GRAPHIC_LAYER`
- `SET_GRAPHIC_ASSET`
- `SET_GRAPHIC_OPACITY`
- `SET_GRAPHIC_SCALE`

### Outputs

- `SET_OUTPUT`
- `UPDATE_OUTPUT`
- `SET_OUTPUT_STATUS`
- `SEND_HEARTBEAT`
- `ASSIGN_LAYERS_TO_OUTPUT`
- `ASSIGN_THEME_TO_OUTPUT`

### Cola

- `ENQUEUE_GRAPHIC`
- `DEQUEUE_GRAPHIC`
- `CLEAR_QUEUE`

### Layers y reconocimiento

- `SET_LAYER`
- `LOCK_LAYER`
- `UNLOCK_LAYER`
- `SHOW_LAYER`
- `HIDE_LAYER`
- `ACKNOWLEDGE_WARNING`
- `ACKNOWLEDGE_ERROR`

No existen acciones de mensajes, escenas, macros, variables ni automatizaciones en v1.

Los 33 tipos anteriores tienen handler explícito y son ejecutables cuando su target, payload, contexto, actor, revisión y confirmación son válidos. No hay tipos modelados sin ejecución ni reservados para futuro en `ACTION_TYPES`. El estado `partially_succeeded` está reservado, pero ninguna acción v1 lo devuelve actualmente.

## Estados

- `created`: definida, sin efectos.
- `validating`: validando contexto y política.
- `pending_confirmation`: espera confirmación y no ejecuta.
- `confirmed`: tiene las confirmaciones requeridas.
- `executing`: delegando a APIs públicas.
- `succeeded`: ejecución completa.
- `partially_succeeded`: reservado para una ejecución parcialmente aceptada.
- `rejected`: no autorizada o inválida antes de ejecutar.
- `cancelled`: cancelada antes de aplicar.
- `failed`: una API pública rechazó la transición.
- `expired`: venció antes de ejecutar.

## Modos

`manual` es el modo operativo de v1. `semiautomatic`, `automatic` y `system` quedan modelados; no habilitan automatización real. `system` se admite para heartbeat y reconocimientos técnicos controlados.

## Actor

El actor se obtiene del contexto controlado, no del payload. Incluye ID, nombre, rol, sesión, dispositivo, origen y visibilidad. `TAKE`, `CUT`, `AUTO`, `CLEAR_PROGRAM` y la cola manual requieren actor. El heartbeat puede usar un actor de sistema.

Los campos `actor`, `role` y `permissions` recibidos dentro de `payload` se eliminan y nunca pueden sustituir al actor del contexto.

## Contexto de ejecucion

`createBroadcastActionContext()` recibe:

- Broadcast State actual;
- Broadcast Data Contract;
- snapshots del Output registry;
- Asset registry;
- visibilidad;
- Modo seguro;
- actor;
- revisión esperada;
- timestamp inyectable;
- confirmaciones disponibles;
- referencias de tenant, organización, torneo, competencia y jornada.

El contexto se clona de forma serializable. El motor consulta las APIs públicas de Output para aplicar cambios al registry en memoria y devuelve snapshots actualizados.

## Flujo de dispatch

1. Normaliza y sanitiza la acción.
2. Valida estructura, target, payload, actor, expiración y contexto.
3. Aplica la matriz conceptual de capacidades.
4. Evalúa precondiciones de Preview, Program y emergencia.
5. Compara `expectedRevision` con State antes de ejecutar.
6. Determina confirmación requerida.
7. Verifica idempotencia.
8. Ejecuta mediante APIs públicas.
9. Construye un resultado compacto.
10. Construye auditoría sin State ni Contract completos.
11. Devuelve nuevos bloques de State, outputs y assets.

## Delegacion

- `PREPARE_PREVIEW` usa `setGraphicState()`, `setLayerState()` y `setPreviewState()`.
- `TAKE`, `CUT` y `AUTO` usan `promotePreviewToProgram()`.
- Clear usa `clearPreviewState()` o `clearProgramState()`.
- Outputs usan `updateBroadcastOutput()`, `setBroadcastOutputStatus()`, `updateBroadcastOutputHeartbeat()`, `assignLayersToOutput()` y `assignThemeToOutput()`.
- Queue usa `enqueueBroadcastItem()` y `dequeueBroadcastItem()`.
- Layers usan `setLayerState()`.
- Assets se resuelven mediante `getBroadcastAsset()` antes de asignarlos.

El Action Engine no escribe propiedades de Program, Preview, layers, graphics, outputs ni queue de forma directa.

## Confirmaciones

- `none`: no requiere confirmación.
- `simple`: una confirmación explícita.
- `destructive`: confirma limpieza o sustitución activa.
- `critical`: confirma una protección operativa.
- `double_confirmation`: exige dos confirmaciones explícitas.

`TAKE`, `AUTO`, `HIDE_ALL` y `CLEAR_QUEUE` requieren confirmación simple. `CUT` la requiere con Modo seguro. `CLEAR_PROGRAM` y sustituir Program activo son destructivas. Desbloquear `emergency` es crítico; una operación `force` sobre emergencia exige doble confirmación.

`confirmBroadcastAction()` solo registra la confirmación. No ejecuta. `rejectBroadcastAction()` y `cancelBroadcastAction()` finalizan sin modificar Broadcast State.

`double_confirmation` modela dos confirmaciones explícitas, pero v1 no exige que provengan de actores distintos. Es capacidad preparada y no debe presentarse como doble autorización distribuida.

## Modo seguro

Modo seguro nunca se desactiva desde el motor. Exige Preview activo y válido antes de Program, confirmación explícita para transiciones protegidas, confirmación destructiva para limpiar Program y protección de layers locked y emergency en `HIDE_ALL`. `force` solo llega a las APIs públicas después de cumplir la confirmación correspondiente.

## Expected Revision

Production Console envía siempre la revisión actual como `expectedRevision`. Una diferencia produce `state-revision-conflict` antes de llamar a cualquier API. State, revisión y `updatedAt` permanecen intactos.

Las orquestaciones de varios pasos verifican la revisión inicial una vez y luego utilizan el State devuelto por cada API pública como entrada del siguiente paso.

## Idempotencia

El registro en memoria asocia `idempotencyKey` con una huella determinista de tipo, modo, target, payload, actor y referencias estables de contexto. Las revisiones dinámicas de State y Contract no forman parte de la huella porque cambian como resultado de la primera ejecución. Un reintento idéntico devuelve el resultado previo. La misma clave con otra intención produce `idempotency-conflict` y no ejecuta.

Esto evita doble Take, heartbeat, enqueue y Clear por reintentos dentro de la sesión. No existe persistencia entre recargas en v1.

## Resultados

Todo resultado contiene código, éxito, mensaje, acción, timestamps, revisión anterior y posterior, outputs, warnings, errores y datos compactos. Los códigos implementados son:

- `action-succeeded`
- `action-rejected`
- `action-cancelled`
- `action-failed`
- `confirmation-required`
- `invalid-action`
- `invalid-payload`
- `invalid-target`
- `invalid-actor`
- `output-not-found`
- `graphic-not-found`
- `layer-not-found`
- `preview-not-ready`
- `program-protected`
- `state-revision-conflict`
- `action-expired`
- `idempotency-conflict`
- `permission-denied`
- `safe-mode-blocked`

## Auditoria

Cada ejecución devuelve una entrada con ID de auditoría, acción, tipo, actor controlado, timestamp, modo, target, outputs, revisiones, resultado, confirmación, correlación, causalidad, idempotencia, warnings y errores.

La auditoría no contiene State o Contract completos, credenciales ni secretos. Vive en memoria y no se publica en Firebase.

## Permisos conceptuales

La matriz usa nombres exactos de rol y actionType; no usa coincidencias parciales ni concede automáticamente tipos futuros.

| ActionType | supervisor | operador | graficos | locutor | juez | lectura | system |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `SELECT_GRAPHIC` | Sí | Sí | Sí | Sí | No | No | No |
| `SET_SELECTION` | Sí | Sí | Sí | Sí | No | No | No |
| `PREPARE_PREVIEW` | Sí | Sí | Sí | No | No | No | No |
| `CLEAR_PREVIEW` | Sí | Sí | Sí | No | No | No | No |
| `TAKE` | Sí | Sí | Sí | No | No | No | No |
| `CUT` | Sí | Sí | Sí | No | No | No | No |
| `AUTO` | Sí | Sí | Sí | No | No | No | No |
| `CLEAR_PROGRAM` | Sí | Sí | Sí | No | No | No | No |
| `SHOW_GRAPHIC` | Sí | Sí | Sí | No | No | No | No |
| `HIDE_GRAPHIC` | Sí | Sí | Sí | No | No | No | No |
| `HIDE_ALL` | Sí | Sí | Sí | No | No | No | No |
| `UPDATE_GRAPHIC` | Sí | Sí | Sí | No | No | No | No |
| `SET_GRAPHIC_GEOMETRY` | Sí | Sí | Sí | No | No | No | No |
| `SET_GRAPHIC_LAYER` | Sí | Sí | Sí | No | No | No | No |
| `SET_GRAPHIC_ASSET` | Sí | Sí | Sí | No | No | No | No |
| `SET_GRAPHIC_OPACITY` | Sí | Sí | Sí | No | No | No | No |
| `SET_GRAPHIC_SCALE` | Sí | Sí | Sí | No | No | No | No |
| `SET_OUTPUT` | Sí | Sí | Sí | No | No | No | No |
| `UPDATE_OUTPUT` | Sí | Sí | No | No | No | No | No |
| `SET_OUTPUT_STATUS` | Sí | Sí | No | No | No | No | No |
| `SEND_HEARTBEAT` | Sí | Sí | Sí | No | No | No | Sí |
| `ASSIGN_LAYERS_TO_OUTPUT` | Sí | Sí | No | No | No | No | No |
| `ASSIGN_THEME_TO_OUTPUT` | Sí | Sí | No | No | No | No | No |
| `ENQUEUE_GRAPHIC` | Sí | Sí | Sí | No | No | No | No |
| `DEQUEUE_GRAPHIC` | Sí | Sí | Sí | No | No | No | No |
| `CLEAR_QUEUE` | Sí | Sí | Sí | No | No | No | No |
| `SET_LAYER` | Sí | Sí | Sí | No | No | No | No |
| `LOCK_LAYER` | Sí | Sí | Sí | No | No | No | No |
| `UNLOCK_LAYER` | Sí | Sí | Sí | No | No | No | No |
| `SHOW_LAYER` | Sí | Sí | Sí | No | No | No | No |
| `HIDE_LAYER` | Sí | Sí | Sí | No | No | No | No |
| `ACKNOWLEDGE_WARNING` | Sí | Sí | No | No | No | No | Sí |
| `ACKNOWLEDGE_ERROR` | Sí | Sí | No | No | No | No | Sí |

`locutor` puede sugerir o seleccionar contenido, pero no emitirlo. Su `SET_SELECTION` rechaza `clearPreview` y `contextRef`, por lo que jamás modifica Preview, Program, layers, outputs, queue o heartbeat. `juez` no tiene acciones de producción y `lectura` es estrictamente consulta. `system` solo opera heartbeat y reconocimientos técnicos; declarar `mode: system` con otro rol no eleva permisos.

Esta matriz no autentica ni persiste roles. Production Navigation y los permisos reales no se modifican.

## Integracion con Production Console

`productionConsole.js` conserva su interfaz y adaptadores públicos, pero cada operación visible crea y despacha acciones. Preparar Preview, Take, Cut, Auto, Clear, selección, geometría, assets, layers, outputs, heartbeat y queue pasan por `dispatchProductionConsoleAction()`.

La sección `Últimas acciones` muestra tipo, estado, código, timestamp y revisiones antes/después. El actor solo aparece con visibilidad `operational` o `restricted`. Tanto el panel como el inspector eliminan identidad operativa en `public`; el inspector también la elimina en `production`.

Preview y Program siguen separados; heartbeat y queue no alteran Program; los outputs arrancan offline; la recarga no recupera Program; Modo seguro arranca activo.

## Seguridad

El motor:

- no muta inputs;
- elimina funciones y símbolos;
- controla ciclos;
- bloquea `__proto__`, `constructor` y `prototype`;
- limita profundidad y arreglos;
- conserva `0`, `false`, `""` y `null`;
- valida IDs, tipos, targets y payloads;
- no acepta rutas arbitrarias de patch;
- no permite una mutación genérica de Program;
- no ejecuta código del payload;
- usa clonación estructurada segura, no JSON como única defensa.

## Compatibilidad

Broadcast Playground permanece sin cambios y continúa usando APIs directas como banco de pruebas legacy de V2. Broadcast Data Contract v1, Broadcast State v1, Broadcast Output v1, Asset Manager v1, gráficos V1, OBS V1 y Firebase permanecen intactos.

## Limitaciones actuales

- registro de acciones, auditoría e idempotencia solo en memoria;
- permisos conceptuales, sin autenticación real;
- no hay persistencia ni listeners;
- no existen escenas, macros, variables o automatización;
- no hay ejecución remota ni integración real con OBS;
- reconocimientos de warning/error son informativos y no eliminan diagnósticos del State;
- Production Playground se migrará en un ticket posterior.

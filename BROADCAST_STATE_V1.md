# Broadcast State v1

## Propósito

Broadcast State es el modelo central, serializable y controlado de CharroPro Broadcast Studio. Coordina lo que el operador selecciona, lo que prepara en Preview, lo que está al aire en Program, las capas, gráficos, outputs y cola de producción sin depender de Firebase, DOM, OBS ni de una implementación visual.

La versión `1.0.0` prepara la arquitectura para un Action Engine posterior. En esta versión ninguna consola V2 está activa y los gráficos V1 mantienen el control de sus outputs. El estado no calcula puntuaciones ni copia el contrato deportivo completo: conserva solamente `contextRef`, una referencia mínima al Broadcast Data Contract.

## Principios

- Preview y Program son estados separados.
- Program solo cambia mediante `setProgramState()`, `promotePreviewToProgram()` y `clearProgramState()`.
- Cada transición válida produce un objeto nuevo e incrementa `revision`.
- `expectedRevision` permite rechazar una operación sobre un estado desactualizado.
- La recuperación nunca reactiva Program automáticamente.
- Los datos se normalizan a estructuras serializables y con límites defensivos.
- Cero, `false` y cadena vacía se conservan como valores válidos.
- V1 y V2 pueden coexistir, pero no deben controlar el mismo output.

## Versión

```text
1.0.0
```

La versión del estado es independiente del cache-buster de la aplicación. Un cambio incompatible en campos, tipos o semántica requiere una versión mayor y una migración explícita.

## API pública

```js
import {
  BROADCAST_STATE_VERSION,
  createInitialBroadcastState,
  normalizeBroadcastState,
  validateBroadcastState,
  applyBroadcastStatePatch,
  setPreviewState,
  setProgramState,
  promotePreviewToProgram,
  clearPreviewState,
  clearProgramState,
  setLayerState,
  setGraphicState,
  setOutputState,
  setBroadcastContextRef,
  enqueueBroadcastItem,
  dequeueBroadcastItem,
  getBroadcastQueue,
  getVisibleGraphics,
  getActiveLayers,
  getBroadcastStateWarnings,
  cloneBroadcastState,
  getBroadcastStateRevision
} from "./js/broadcast/broadcastState.js";
```

## Estructura raíz

```json
{
  "stateVersion": "1.0.0",
  "revision": 0,
  "createdAt": "2026-07-13T12:00:00.000Z",
  "updatedAt": "2026-07-13T12:00:00.000Z",
  "sessionId": null,
  "source": "broadcast-state",
  "status": "idle",
  "session": {},
  "contextRef": {},
  "selection": {},
  "preview": {},
  "program": {},
  "layers": {},
  "graphics": {},
  "outputs": {},
  "queue": [],
  "automation": {},
  "messages": {},
  "legacy": {},
  "warnings": [],
  "errors": []
}
```

## Metadatos raíz

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Significado |
| --- | --- | --- | --- | --- |
| stateVersion | Versión del estado | string | Sí | Contrato de compatibilidad de Broadcast State |
| revision | Revisión del estado | integer | Sí | Número monotónico para concurrencia |
| createdAt | Creado en | ISO-8601 | Sí | Fecha de creación; nunca cambia |
| updatedAt | Actualizado en | ISO-8601 | Sí | Fecha de la última transición válida |
| sessionId | ID de sesión | string/null | No | Alias normalizado de `session.id` |
| source | Fuente | string/null | No | Componente que construyó la proyección |
| status | Estado general | string | Sí | Estado informativo del Broadcast State |
| warnings | Advertencias | string[] | Sí | Riesgos no bloqueantes detectados |
| errors | Errores | string[] | Sí | Errores normalizados del estado |

## Session

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Significado |
| --- | --- | --- | --- | --- |
| session.id | ID de sesión | string/null | No | Sesión de producción conocida |
| session.tournamentId | Torneo | string/null | No | Torneo asociado |
| session.competitionId | Competencia | string/null | No | Competencia asociada |
| session.outputIds | Outputs de sesión | string[] | Sí | Outputs administrados por la sesión |
| session.operatorId | ID de operador | string/null | No | Actor operativo, sin inventarlo |
| session.operatorName | Operador | string/null | No | Nombre conocido del operador |
| session.startedAt | Inicio | ISO-8601/null | No | Inicio declarado de sesión |
| session.lastActivityAt | Última actividad | ISO-8601/null | No | Última transición controlada |
| session.status | Estado de sesión | string | Sí | Estado informativo; inicia `inactive` |
| session.recoverable | Recuperable | boolean | Sí | Indica si puede intentarse recuperación futura |
| session.recoveryRequired | Requiere recuperación | boolean | Sí | Fuerza revisión manual; nunca reactiva Program |
| session.closedAt | Cierre | ISO-8601/null | No | Cierre conocido |
| session.deviceId | Dispositivo | string/null | No | Identificador conocido del dispositivo |
| session.clientId | Cliente técnico | string/null | No | Cliente técnico conocido |
| session.tenantId | Organización/tenant | string/null | No | Scope organizativo conocido |
| session.createdAt | Registro de sesión | ISO-8601 | Sí | Fecha normalizada del bloque |

## ContextRef

`contextRef` no contiene el Broadcast Data Contract completo. Cambiar su revisión o frescura no modifica Preview ni Program.

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Significado |
| --- | --- | --- | --- | --- |
| contextRef.contractVersion | Versión del contrato | string/null | No | Versión de Broadcast Data Contract |
| contextRef.contractRevision | Revisión del contrato | integer/null | No | Revisión deportiva de referencia |
| contextRef.generatedAt | Contexto generado en | ISO-8601/null | No | Fecha del contrato referenciado |
| contextRef.freshness | Frescura | string | Sí | `current`, `stale` o estado informado |
| contextRef.tournamentId | Torneo | string/null | No | Torneo referenciado |
| contextRef.competitionId | Competencia | string/null | No | Competencia referenciada |
| contextRef.charreadaId | Jornada | string/null | No | Jornada/charreada referenciada |
| contextRef.participantId | Participante | string/null | No | Participante individual, si aplica |
| contextRef.teamId | Equipo | string/null | No | Equipo, si aplica |
| contextRef.suerteId | Suerte | string/null | No | Suerte activa conocida |
| contextRef.scoreId | Calificación | string/null | No | Score oficial referenciado |
| contextRef.timerId | Cronómetro | string/null | No | Cronómetro referenciado |
| contextRef.sourceType | Tipo de fuente | string/null | No | Forma del contrato/contexto de origen |

## Selection

Selection representa lo que el operador está preparando. No es Preview ni Program.

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Significado |
| --- | --- | --- | --- | --- |
| selection.templateId | Plantilla | string/null | No | Plantilla seleccionada |
| selection.templateVersion | Versión de plantilla | string/null | No | Versión seleccionada |
| selection.variantId | Variante | string/null | No | Variante seleccionada |
| selection.themeId | Tema | string/null | No | Tema seleccionado |
| selection.sceneId | Escena | string/null | No | Escena futura seleccionada |
| selection.graphicId | Gráfico | string/null | No | Instancia seleccionada |
| selection.layerId | Capa | string/null | No | Capa destino |
| selection.outputIds | Outputs | string[] | Sí | Destinos preparados |
| selection.position.x | Posición X | number | Sí | Posición horizontal |
| selection.position.y | Posición Y | number | Sí | Posición vertical |
| selection.position.anchor | Ancla | string | Sí | Referencia geométrica |
| selection.position.unit | Unidad de posición | enum | Sí | `normalized`, `%`, `px`, `vw` o `vh` |
| selection.size.width | Ancho | number/null | No | Ancho no negativo |
| selection.size.height | Alto | number/null | No | Alto no negativo |
| selection.size.unit | Unidad de tamaño | enum | Sí | Unidad geométrica |
| selection.scale | Escala | number | Sí | Factor mayor que cero |
| selection.opacity | Opacidad | number | Sí | Valor entre 0 y 1 |
| selection.rotation | Rotación futura | number | Sí | Campo reservado; no aplica layout |
| selection.duration | Duración | number/null | No | Duración no negativa |
| selection.autoHide | Ocultar automáticamente | boolean | Sí | Intención futura, sin temporizador real |
| selection.payloadBindings | Enlaces de datos | object | Sí | Referencias declarativas seguras |
| selection.selectedAt | Seleccionado en | ISO-8601/null | No | Timestamp conocido |
| selection.selectedBy | Seleccionado por | string/null | No | Actor conocido |

## Preview y Program

Preview puede contener una composición preparada y validada. Program representa exclusivamente lo que está al aire. Limpiar Preview no afecta Program; promover Preview copia una proyección segura. Un Preview con errores bloqueantes no puede promoverse.

Activar Program mediante `setProgramState()` exige actor en `options` y al menos un output válido. La función genera `takenAt`, registra `takenBy`, fuerza estado `on_air`, incrementa la revisión propia y normaliza el modo a `take`, `cut` o `auto` (`take` por defecto). Una activación con borrador, errores bloqueantes, actor ausente u outputs vacíos se rechaza antes de modificar el estado; un `takenBy` dentro del payload no sustituye al actor controlado. `promotePreviewToProgram()` aplica las mismas exigencias de actor y output además de validar Preview. Un Program activo no puede desactivarse mediante `setProgramState()`; debe pasar por `clearProgramState()` para respetar capas bloqueadas y emergencia.

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Significado |
| --- | --- | --- | --- | --- |
| preview.active | Preview activo | boolean | Sí | Existe composición preparada |
| preview.revision | Revisión de Preview | integer | Sí | Revisión interna de Preview |
| preview.compositionId | Composición | string/null | No | Composición preparada |
| preview.sceneId | Escena | string/null | No | Escena preparada |
| preview.templateInstances | Instancias | object/array | Sí | Plantillas preparadas |
| preview.visibleGraphics | Gráficos visibles | string[] | Sí | Gráficos proyectados en Preview |
| preview.activeLayers | Capas activas | string[] | Sí | Capas proyectadas en Preview |
| preview.outputIds | Outputs Preview | string[] | Sí | Outputs destino |
| preview.themeId | Tema | string/null | No | Tema preparado |
| preview.contextRef | Contexto de Preview | object | Sí | Referencia deportiva congelada |
| preview.preparedAt | Preparado en | ISO-8601/null | No | Fecha de preparación |
| preview.preparedBy | Preparado por | string/null | No | Actor de preparación |
| preview.clearedAt | Limpiado en | ISO-8601/null | No | Fecha de limpieza |
| preview.clearedBy | Limpiado por | string/null | No | Actor de limpieza |
| preview.status | Estado Preview | enum | Sí | `inactive`, `ready`, `on_air`, `clearing`, `error` |
| preview.validation.valid | Validación | boolean | Sí | Indica si puede promoverse |
| preview.validation.checkedAt | Validado en | ISO-8601/null | No | Fecha de validación |
| preview.validation.errors | Errores de validación | string[] | Sí | Errores bloqueantes |
| preview.validation.warnings | Avisos de validación | string[] | Sí | Avisos no bloqueantes |
| preview.warnings | Avisos Preview | string[] | Sí | Avisos de composición |
| preview.errors | Errores Preview | string[] | Sí | Errores bloqueantes |
| program.active | Program al aire | boolean | Sí | Existe composición activa al aire |
| program.revision | Revisión de Program | integer | Sí | Revisión interna al aire |
| program.compositionId | Composición al aire | string/null | No | Composición activa |
| program.sceneId | Escena al aire | string/null | No | Escena activa |
| program.templateInstances | Instancias al aire | object/array | Sí | Instancias autorizadas |
| program.visibleGraphics | Gráficos al aire | string[] | Sí | Gráficos activos |
| program.activeLayers | Capas al aire | string[] | Sí | Capas activas |
| program.outputIds | Outputs Program | string[] | Sí | Destinos al aire |
| program.themeId | Tema al aire | string/null | No | Tema vigente |
| program.contextRef | Contexto de Program | object | Sí | Contexto congelado al Take |
| program.takenAt | Take ejecutado en | ISO-8601/null | No | Fecha de promoción/activación |
| program.takenBy | Take ejecutado por | string/null | No | Actor conocido |
| program.clearedAt | Program limpiado en | ISO-8601/null | No | Fecha de limpieza |
| program.clearedBy | Program limpiado por | string/null | No | Actor conocido |
| program.status | Estado Program | enum | Sí | Estado de salida al aire |
| program.transitionMode | Modo solicitado | enum/null | No | `take`, `cut` o `auto`; no anima todavía |
| program.lockedLayers | Capas bloqueadas | string[] | Sí | Capas protegidas contra reemplazo/clear |
| program.emergencyMode | Emergencia | boolean | Sí | Impide clear ordinario |
| program.warnings | Avisos Program | string[] | Sí | Avisos al aire |
| program.errors | Errores Program | string[] | Sí | Errores al aire |

## Layers

El catálogo inicial incluye `background`, `scoreboard`, `turn`, `score`, `timer`, `alerts`, `sponsors`, `fullscreen` y `emergency`, con órdenes de 10 a 90. Varias capas pueden coexistir. `getActiveLayers()` devuelve la proyección efectiva: `emergency` tiene prioridad, después `fullscreen` y después cualquier capa exclusiva; las capas ocultadas temporalmente no se destruyen.

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Significado |
| --- | --- | --- | --- | --- |
| layers.*.id | ID de capa | string | Sí | Identificador estable |
| layers.*.order | Orden | number | Sí | Orden visual |
| layers.*.group | Grupo | string | Sí | Grupo operativo |
| layers.*.visible | Visible | boolean | Sí | Estado declarado, no proyección efectiva |
| layers.*.locked | Bloqueada | boolean | Sí | Requiere `force` para editar |
| layers.*.exclusive | Exclusiva | boolean | Sí | Puede ocultar otras en la proyección |
| layers.*.priority | Prioridad | number | Sí | Prioridad entre exclusivas |
| layers.*.outputIds | Outputs | string[] | Sí | Destinos; vacío significa sin restricción |
| layers.*.graphicIds | Gráficos | string[] | Sí | Gráficos asignados |
| layers.*.status | Estado | string | Sí | Estado informativo |
| layers.*.updatedAt | Actualizada en | ISO-8601 | Sí | Última transición |
| layers.*.updatedBy | Actualizada por | string/null | No | Actor conocido |

## Graphics

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Significado |
| --- | --- | --- | --- | --- |
| graphics.*.graphicId | ID de gráfico | string | Sí | Instancia del gráfico |
| graphics.*.templateId | Plantilla | string/null | No | Plantilla declarativa |
| graphics.*.templateVersion | Versión | string/null | No | Versión de plantilla |
| graphics.*.variantId | Variante | string/null | No | Variante activa |
| graphics.*.themeId | Tema | string/null | No | Tema activo |
| graphics.*.layerId | Capa | string/null | No | Capa asignada |
| graphics.*.visible | Visible | boolean | Sí | Estado declarado |
| graphics.*.status | Ciclo de vida | enum | Sí | `idle`, `prepared`, `visible`, `hidden`, `entering`, `exiting`, `error` |
| graphics.*.position | Posición | object | Sí | X, Y, ancla y unidad |
| graphics.*.size | Tamaño | object | Sí | Ancho, alto y unidad |
| graphics.*.scale | Escala | number | Sí | Mayor que cero |
| graphics.*.opacity | Opacidad | number | Sí | Entre 0 y 1 |
| graphics.*.rotation | Rotación futura | number | Sí | Campo reservado |
| graphics.*.duration | Duración | number/null | No | Duración declarada |
| graphics.*.autoHide | Auto ocultar | boolean | Sí | Intención futura |
| graphics.*.outputIds | Outputs | string[] | Sí | Destinos del gráfico |
| graphics.*.contextRef | Contexto | object | Sí | Referencias deportivas mínimas |
| graphics.*.payloadBindings | Enlaces | object | Sí | Enlaces declarativos de datos |
| graphics.*.startedAt | Iniciado en | ISO-8601/null | No | Inicio de lifecycle |
| graphics.*.updatedAt | Actualizado en | ISO-8601/null | No | Última transición |
| graphics.*.updatedBy | Actualizado por | string/null | No | Actor conocido |
| graphics.*.errors | Errores | string[] | Sí | Errores del gráfico |
| graphics.*.warnings | Advertencias | string[] | Sí | Advertencias del gráfico |

## Outputs

No existen adaptadores reales en v1. El estado modela `preview`, `program`, `browser`, `obs`, `vmix`, `wirecast`, `streamlabs`, `led`, `locutor_monitor` y `mobile_monitor`.

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Significado |
| --- | --- | --- | --- | --- |
| outputs.*.id | ID de output | string | Sí | Destino estable |
| outputs.*.name | Nombre | string/null | No | Etiqueta operativa |
| outputs.*.type | Tipo | enum | Sí | Tipo de destino |
| outputs.*.status | Estado | string | Sí | Conectado/desconectado u otro estado informado |
| outputs.*.resolution | Resolución | object | Sí | Width/height enteros no negativos o null |
| outputs.*.orientation | Orientación | string/null | No | Orientación informada |
| outputs.*.aspectRatio | Relación de aspecto | string/null | No | Ejemplo `16:9` |
| outputs.*.safeArea | Área segura | object | Sí | Márgenes y unidad |
| outputs.*.assignedLayers | Capas asignadas | string[] | Sí | Capas del output |
| outputs.*.themeId | Tema | string/null | No | Tema del destino |
| outputs.*.heartbeat.at | Heartbeat | ISO-8601/null | No | Último pulso conocido |
| outputs.*.heartbeat.status | Estado heartbeat | string | Sí | Estado informado |
| outputs.*.lastAppliedRevision | Revisión aplicada | integer | Sí | Revisión de Program confirmada |
| outputs.*.latency | Latencia | number/null | No | Latencia no negativa |
| outputs.*.stale | Output obsoleto | boolean | Sí | Derivado de heartbeat/status o informado |
| outputs.*.errors | Errores | string[] | Sí | Errores del output |
| outputs.*.warnings | Advertencias | string[] | Sí | Avisos del output |
| outputs.*.capabilities | Capacidades | object | Sí | Capacidades declaradas |
| outputs.*.connectedAt | Conectado en | ISO-8601/null | No | Fecha conocida |
| outputs.*.disconnectedAt | Desconectado en | ISO-8601/null | No | Fecha conocida |
| outputs.*.targetRevision | Revisión objetivo | integer | Sí | Revisión que debe aplicar |

## Queue

La cola se ordena por prioridad descendente y FIFO dentro de la misma prioridad. `dequeueBroadcastItem()` retira el siguiente item reproducible; no lo reproduce. Un item vencido cambia a `expired` al normalizar o leer.

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Significado |
| --- | --- | --- | --- | --- |
| queue[].queueItemId | ID de cola | string | Sí | ID único del item |
| queue[].type | Tipo | string | Sí | Tipo de instrucción futura |
| queue[].graphicId | Gráfico | string/null | No | Gráfico asociado |
| queue[].templateId | Plantilla | string/null | No | Plantilla asociada |
| queue[].sceneId | Escena | string/null | No | Escena futura |
| queue[].payloadBindings | Enlaces | object | Sí | Datos declarativos |
| queue[].outputIds | Outputs | string[] | Sí | Destinos |
| queue[].priority | Prioridad | number | Sí | Mayor valor primero |
| queue[].status | Estado | enum | Sí | `queued`, `ready`, `playing`, `completed`, `cancelled`, `expired`, `error` |
| queue[].queuedAt | Encolado en | ISO-8601 | Sí | Fecha para FIFO |
| queue[].queuedBy | Encolado por | string/null | No | Actor conocido |
| queue[].scheduledAt | Programado en | ISO-8601/null | No | No sale antes de esta fecha |
| queue[].expiresAt | Expira en | ISO-8601/null | No | Se marca expired al vencer |
| queue[].duration | Duración | number/null | No | Duración declarada |
| queue[].autoHide | Auto ocultar | boolean | Sí | Intención futura |
| queue[].notes | Notas | string/null | No | Nota operativa |

## Automation y Messages

Estos bloques reservan estado; no ejecutan automatizaciones ni mensajería.

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Significado |
| --- | --- | --- | --- | --- |
| automation.enabled | Automatización habilitada | boolean | Sí | Inicia en false |
| automation.mode | Modo | enum | Sí | `manual`, `semiautomatic`, `automatic` |
| automation.paused | Pausada | boolean | Sí | Estado reservado |
| automation.pausedAt | Pausada en | ISO-8601/null | No | Fecha conocida |
| automation.pausedBy | Pausada por | string/null | No | Actor conocido |
| automation.lastTrigger | Último trigger | object/array/null | No | Proyección serializable |
| automation.pendingSuggestions | Sugerencias | array | Sí | Sugerencias futuras |
| automation.errors | Errores | string[] | Sí | Errores reservados |
| messages.active | Mensajería activa | boolean | Sí | Inicia en false |
| messages.unreadCount | No leídos | integer | Sí | Conteo no negativo |
| messages.lastMessageId | Último mensaje | string/null | No | Referencia futura |
| messages.pendingAcknowledgements | Acuses pendientes | array | Sí | Estado reservado |
| messages.channels | Canales | array | Sí | Canales futuros |
| messages.errors | Errores | string[] | Sí | Errores reservados |

## Legacy

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Significado |
| --- | --- | --- | --- | --- |
| legacy.enabled | Compatibilidad habilitada | boolean | Sí | Mantiene convivencia V1 |
| legacy.activeEngine | Motor activo | enum | Sí | `v1`, `v2` o `none` |
| legacy.v1OutputIds | Outputs V1 | string[] | Sí | Outputs controlados por V1 |
| legacy.v2OutputIds | Outputs V2 | string[] | Sí | Outputs controlados por V2 |
| legacy.fallbackAvailable | Fallback disponible | boolean | Sí | Capacidad declarada |
| legacy.fallbackReason | Motivo de fallback | string/null | No | Motivo informativo |
| legacy.legacyProjectionRevision | Revisión legacy | integer | Sí | Revisión de proyección V1 |
| legacy.warnings | Advertencias legacy | string[] | Sí | Avisos de convivencia |

El módulo advierte si V1 y V2 reclaman el mismo output. Nunca cambia `activeEngine` ni activa fallback por sí solo.

## Revisionado y concurrencia

```js
const next = setPreviewState(state, preview, {
  expectedRevision: state.revision,
  now: new Date().toISOString(),
  actor: { userId: "operator_1" }
});
```

Cada transición válida:

1. normaliza el estado fuente;
2. compara `expectedRevision`, si fue enviada;
3. clona sin mutar;
4. aplica únicamente la transición autorizada;
5. valida antes y después de normalizar;
6. incrementa `revision` una vez;
7. conserva `createdAt` y actualiza `updatedAt`.

Una revisión distinta lanza `BroadcastStateError` con código `expected-revision-mismatch` y no modifica la fuente.

## Patches permitidos

`applyBroadcastStatePatch()` usa una allowlist y admite únicamente estas raíces:

```text
session, selection, automation, messages, legacy, source, status
```

No permite modificar `stateVersion`, `revision`, `createdAt`, `updatedAt`, `warnings`, `errors` ni Program. Un intento contra `program` o `program.*` lanza `BroadcastStateError` con código `program-patch-forbidden`. Preview, layers, graphics, outputs, queue y contextRef también quedan fuera del patch porque cuentan con setters específicos.

La validación de todas las raíces ocurre antes de iniciar la transición. Por ello, un patch que mezcle Selection válida con Program prohibido se rechaza completo: no modifica Selection, Program, Preview, revisión, `createdAt` ni `updatedAt`. No implementa JSON Patch ni rutas con punto.

## Recuperación segura

```js
const recovered = createInitialBroadcastState({
  recovery: true,
  state: persistedProjection,
  session: { recoveryRequired: true }
});
```

`createInitialBroadcastState()` siempre crea Program vacío e inactivo. Si recibe un Program activo, lo descarta y registra `program-initialization-blocked` o `program-recovery-cleared`. En recuperación, `normalizeBroadcastState(state, { recovery: true })` también normaliza Program vacío e inactivo aunque la proyección recibida diga `on_air`. `recovery-required` o `program-recovery-cleared` queda como advertencia según la entrada. Reactivar Program exigirá una acción manual futura; no existe recuperación automática al aire ni envío automático a outputs.

## Seguridad e inmutabilidad

- No usa `JSON.stringify/parse` como única estrategia de clonado.
- Elimina funciones y símbolos.
- Convierte fechas válidas a ISO-8601.
- Controla referencias circulares.
- Bloquea `__proto__`, `constructor` y `prototype`.
- Limita la profundidad a 12 niveles.
- Limita arreglos a 250 elementos.
- No muta options, estado, payload bindings ni contexto de entrada.
- Rechaza escala menor o igual a cero, opacidad fuera de 0..1 y geometría no finita.

## Advertencias detectadas

`getBroadcastStateWarnings()` detecta:

- sesión o torneo ausentes;
- recuperación requerida;
- Preview con errores;
- Program activo sin outputs;
- output desconectado o stale;
- revisión de Program no aplicada;
- contexto stale;
- gráfico visible sin plantilla;
- layer visible sin gráficos;
- layer bloqueada inconsistente;
- cola vencida;
- conflicto V1/V2 sobre un output;
- emergencia activa;
- revisión inválida.

## Integración inicial en CharroPro

`buildLivePayload()` construye una proyección inicial bajo:

```text
charropro/live/{tournamentId}/current/broadcastState
```

La integración es aditiva:

- `broadcastContext` permanece intacto;
- `broadcastContract` permanece intacto;
- campos planos y gráficos V1 permanecen intactos;
- `broadcastState` inicia en revisión 0;
- Preview y Program V2 inician inactivos;
- `legacy.activeEngine` queda en `v1`;
- no se publica en `publicTournaments`;
- no se crean listeners ni rutas definitivas nuevas.

Esta proyección publicada es un estado inicial seguro y temporal, no la persistencia definitiva de una futura sesión V2. El Action Engine y una política explícita de persistencia se definirán en tickets posteriores.

## Ejemplo Preview a Program

```js
const prepared = setPreviewState(state, {
  active: true,
  compositionId: "scoreboard_main",
  visibleGraphics: ["scoreboard_graphic"],
  activeLayers: ["scoreboard"],
  outputIds: ["program_1"],
  validation: { valid: true, errors: [], warnings: [] }
}, {
  expectedRevision: state.revision,
  actor: { userId: "operator_1" }
});

const onAir = promotePreviewToProgram(prepared, {
  expectedRevision: prepared.revision,
  actor: { userId: "director_1" },
  mode: "take"
});
```

## Límites de v1

Esta versión no implementa Action Engine completo, consola, gráficos V2, adaptadores de outputs, escenas, macros, animaciones, timers de auto-hide, restauración automática, rollback, automatizaciones, mensajería ni Run of Show.

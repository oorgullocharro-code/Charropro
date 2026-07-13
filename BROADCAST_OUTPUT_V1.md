# Broadcast Output v1

## 1. Proposito

Broadcast Output v1 define el motor universal de destinos de Broadcast Studio. Su responsabilidad es describir, registrar y proyectar contenido hacia una salida abstracta sin depender de OBS, vMix, Wirecast, Streamlabs, Firebase, el Core deportivo o una interfaz HTML.

La version del contrato de Output es `1.0.0` y se exporta como `BROADCAST_OUTPUT_VERSION` desde `js/broadcast/broadcastOutput.js`.

Esta primera version es infraestructura. No abre conexiones, no reproduce contenido, no controla aplicaciones externas y no sustituye los graficos V1. Los adaptadores reales se agregaran en tickets posteriores.

## 2. Lugar en la arquitectura

```text
CharroPro Core
  -> Broadcast Data Contract
  -> Broadcast State
  -> Broadcast Output Projection
  -> Adaptador futuro (OBS, vMix, browser, LED, monitor, API)
```

El Output Engine recibe solamente:

- un Output normalizado;
- un Broadcast State v1;
- un Broadcast Data Contract v1;
- opciones explicitas de proyeccion.

No acepta `broadcastContext`, rutas Firebase, `state.js`, scores internos ni datos privados del Core.

## 3. API publica

El modulo exporta:

| Export | Responsabilidad |
| --- | --- |
| `BROADCAST_OUTPUT_VERSION` | Version semantica del motor, `1.0.0`. |
| `BROADCAST_OUTPUT_TYPES` | Catalogo inmutable de tipos permitidos. |
| `BROADCAST_OUTPUT_STATUSES` | Catalogo inmutable de estados permitidos. |
| `BROADCAST_OUTPUT_VISIBILITIES` | Catalogo de visibilidades. |
| `BROADCAST_OUTPUT_CAPABILITIES` | Catalogo de capabilities soportadas. |
| `BroadcastOutputError` | Error controlado con `code` y `details`. |
| `createBroadcastOutput(input, options)` | Crea un Output independiente y valido. |
| `normalizeBroadcastOutput(input, options)` | Convierte una entrada tolerante al formato canonico. |
| `validateBroadcastOutput(output)` | Devuelve `valid`, `errors`, `warnings` y version. |
| `registerBroadcastOutput(input, options)` | Registra en memoria un Output nuevo. |
| `updateBroadcastOutput(outputId, patch, options)` | Actualiza de forma controlada un Output registrado. |
| `removeBroadcastOutput(outputId, options)` | Elimina un Output solo del registro en memoria. |
| `getBroadcastOutput(outputId)` | Obtiene una copia defensiva. |
| `listBroadcastOutputs(filter)` | Lista copias y filtra por identidad, scope o estado. |
| `setBroadcastOutputStatus(outputId, status, options)` | Cambia estado y habilitacion. |
| `updateBroadcastOutputHeartbeat(outputId, heartbeat, options)` | Registra heartbeat monotono sin abrir conexiones. |
| `setBroadcastOutputCapabilities(outputId, capabilities, options)` | Actualiza capabilities permitidas. |
| `assignLayersToOutput(outputId, layerIds, options)` | Define las capas que puede consumir el Output. |
| `assignThemeToOutput(outputId, themeId, options)` | Asigna una referencia de Theme. |
| `setOutputResolution(outputId, resolution, options)` | Configura dimensiones y recalcula orientacion/relacion. |
| `setOutputSafeArea(outputId, safeArea, options)` | Configura margenes seguros y unidad. |
| `buildBroadcastOutputProjection(output, state, contract, options)` | Construye la proyeccion serializable del destino. |
| `validateOutputProjection(projection)` | Valida estructura y separacion de la proyeccion. |
| `getBroadcastOutputWarnings(output, options)` | Devuelve alertas operativas sin modificar el Output. |
| `isBroadcastOutputStale(output, options)` | Detecta heartbeat vencido. |
| `cloneBroadcastOutput(output)` | Genera copia serializable y protegida. |

## 4. Tipos

| Tipo | Uso previsto inicial |
| --- | --- |
| `preview` | Revision previa dentro de Broadcast Studio. |
| `program` | Salida oficial preparada para aire. |
| `browser` | Navegador universal o Browser Source generico. |
| `obs` | Adaptador futuro para OBS. |
| `vmix` | Adaptador futuro para vMix. |
| `wirecast` | Adaptador futuro para Wirecast. |
| `streamlabs` | Adaptador futuro para Streamlabs. |
| `led` | Pantalla LED con resolucion y safe area propias. |
| `locutor_monitor` | Monitor operativo para locutores. |
| `mobile_monitor` | Monitor operativo en dispositivo movil. |
| `api` | Consumidor de API futuro. |

El tipo describe el destino. No crea una conexion ni activa automaticamente un adaptador.

## 5. Estados

| Estado | Significado |
| --- | --- |
| `unregistered` | Aun no existe registro operativo del adaptador. |
| `offline` | Registrado pero sin conexion disponible. |
| `connecting` | El adaptador reporta intento de conexion. |
| `online` | Heartbeat vigente y operacion normal. |
| `stale` | Heartbeat vencido o estado marcado como obsoleto. |
| `degraded` | Opera con una limitacion o alerta. |
| `error` | El adaptador reporta una falla. |
| `disabled` | Deshabilitado explicitamente. |

`setBroadcastOutputStatus()` no abre ni cierra conexiones. Solo actualiza el modelo en memoria.

## 6. Estructura canonica

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| `outputVersion` | string | Version `1.0.0`. |
| `revision` | integer | Revision monotona del Output registrado. |
| `id` | string | Identificador unico del Output. |
| `name` | string/null | Nombre operativo. La cadena vacia se conserva. |
| `type` | enum | Tipo universal de salida. |
| `status` | enum | Estado operativo. |
| `enabled` | boolean | Indica si el Output esta habilitado. |
| `visibility` | enum | Visibilidad maxima autorizada. |
| `resolution` | object | Dimensiones, pixel ratio y refresh rate. |
| `orientation` | string | `landscape`, `portrait` o `square`. |
| `aspectRatio` | string | Relacion calculada o declarada, por ejemplo `16:9`. |
| `safeArea` | object | Margenes seguros por borde. |
| `assignedLayers` | string[] | Capas que el Output puede consumir. |
| `themeId` | string/null | Referencia declarativa de Theme. |
| `capabilities` | object | Capacidades declaradas del destino. |
| `heartbeat` | object | Ultimo pulso conocido. |
| `staleAfterMs` | number | Umbral de obsolescencia; default 15000 ms. |
| `lastAppliedRevision` | integer | Ultima revision que el adaptador confirma haber aplicado. |
| `lastAppliedAt` | ISO/null | Momento de la ultima revision aplicada. |
| `latency` | number/null | Latencia no negativa informada por el adaptador. Cero es valido. |
| `projection` | object | Preferencias de habilitacion, view y visibilidad. |
| `warnings` | string[] | Alertas no bloqueantes. |
| `errors` | string[] | Errores reportados por la salida. |
| `createdAt` | ISO | Fecha de creacion. |
| `updatedAt` | ISO | Fecha de ultima actualizacion. |
| `createdBy` | actor/null | Actor de creacion cuando existe. |
| `updatedBy` | actor/null | Actor de ultima actualizacion cuando existe. |
| `tenantId` | string/null | Tenant propietario. |
| `organizationId` | string/null | Organizacion propietaria. |
| `tournamentId` | string/null | Torneo asociado. |
| `competitionId` | string/null | Competencia asociada. |
| `sessionId` | string/null | Sesion de produccion asociada. |

El actor normalizado usa `userId`, `name` y `role`. Si no existe actor se conserva `null`; no se inventa identidad.

### 6.1 Preferencias `projection`

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| `enabled` | boolean | Permite o bloquea construir una proyeccion para ese Output. |
| `view` | `preview`/`program` | View unica que consumira. |
| `visibility` | enum | Visibilidad efectiva maxima para sus datos. |

Un Output o una preferencia de proyeccion deshabilitados producen un error controlado y no generan contenido.

## 7. Registro y revision

El registro es un `Map` privado del modulo y vive solamente durante la sesion JavaScript.

- `registerBroadcastOutput()` rechaza IDs duplicados salvo `replace: true` explicito.
- `updateBroadcastOutput()` incrementa `revision` exactamente una vez.
- `expectedRevision` permite control optimista de concurrencia.
- Un conflicto produce `output-expected-revision-mismatch` sin aplicar cambios.
- `createdAt` y `createdBy` no pueden modificarse mediante patches.
- Todas las lecturas devuelven copias; modificar una respuesta no cambia el registro.
- `removeBroadcastOutput()` no elimina datos en Firebase ni dispara acciones externas.

## 8. Capabilities

Las capabilities booleanas son:

- `transparency`
- `audio`
- `video`
- `browserSource`
- `heartbeat`
- `interaction`
- `multiLayer`
- `dynamicResize`
- `alphaChannel`
- `animation`
- `reducedMotion`
- `supportsPreview`
- `supportsProgram`

Ademas se soportan:

- `maxWidth`
- `maxHeight`
- `supportedFormats`

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| `transparency` | boolean | Puede representar fondo transparente. |
| `audio` | boolean | Declara soporte de audio. No lo controla. |
| `video` | boolean | Declara soporte de video. No lo controla. |
| `browserSource` | boolean | Puede consumir una salida web futura. |
| `heartbeat` | boolean | Puede reportar frescura. |
| `interaction` | boolean | Puede aceptar interaccion futura. |
| `multiLayer` | boolean | Puede representar varias capas. |
| `dynamicResize` | boolean | Puede adaptarse a cambios de dimensiones. |
| `alphaChannel` | boolean | Puede conservar canal alfa. |
| `animation` | boolean | Declara soporte de animacion. |
| `reducedMotion` | boolean | Prefiere movimiento reducido. |
| `supportsPreview` | boolean | Puede consumir Preview. |
| `supportsProgram` | boolean | Puede consumir Program. |
| `maxWidth` | integer/null | Ancho maximo declarado. |
| `maxHeight` | integer/null | Alto maximo declarado. |
| `supportedFormats` | string[] | Formatos declarados por el adaptador futuro. |

El motor asigna perfiles iniciales conservadores segun el tipo. Estos perfiles describen compatibilidad esperada, no garantizan que una aplicacion externa este conectada. Los valores explicitos siempre se normalizan; `false` permanece valido.

Una resolucion superior a `maxWidth` o `maxHeight` produce warning. No se redimensiona silenciosamente.

### 8.1 Evolucion versionada

La version `1.0.0` usa un esquema interno por capability que declara su tipo (`boolean`, entero positivo nullable o arreglo de strings). La implementacion no presupone que todas las capabilities presentes y futuras deban ser booleanas; normalizacion, validacion y setters consultan ese esquema versionado.

En v1, `animation` y las demas capabilities booleanas aceptan exclusivamente `true` o `false`. Un objeto como `{ enabled: true, maxFPS: 60 }` se rechaza de forma controlada, igual que cualquier clave no registrada. Una futura estructura compleja requerira nueva version del schema, documentacion, migracion y compatibilidad explicita; no se reinterpretara silenciosamente un valor v1.

## 9. Heartbeat

La estructura es:

```json
{
  "at": "2026-07-13T12:00:00.000Z",
  "status": "online",
  "sequence": 1,
  "source": "obs-adapter",
  "version": "30.1",
  "lastError": null
}
```

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| `at` | ISO/null | Momento del ultimo pulso. |
| `status` | enum | Estado reportado por el adaptador. |
| `sequence` | integer | Secuencia monotona no negativa. |
| `source` | string/null | Adaptador que produjo el pulso. |
| `version` | string/null | Version reportada por el adaptador. |
| `lastError` | string/null | Ultimo error reportado; cadena vacia es valida. |

Reglas:

- `sequence` debe crecer de manera monotona.
- Una secuencia repetida o atrasada se rechaza.
- Si no se envia secuencia, se usa la anterior mas uno.
- Sin secuencia explicita, un timestamp anterior al ultimo heartbeat se rechaza y no reemplaza el pulso reciente.
- `at` usa ISO-8601.
- `lastError` puede ser cadena vacia.
- El heartbeat puede reportar `offline`, `connecting`, `online`, `stale`, `degraded` o `error`.
- Un Output deshabilitado nunca se clasifica como stale.
- Un Output offline o unregistered conserva ese estado; stale representa especificamente perdida de frescura.
- No se abren sockets, listeners, timers ni conexiones de red.

## 10. Deteccion stale

`isBroadcastOutputStale()` compara `heartbeat.at` contra `now` y `staleAfterMs`.

La deteccion aplica cuando:

- el Output esta habilitado;
- declara capability `heartbeat`;
- esta online, connecting, degraded o stale.

El umbral default es 15000 ms y puede definirse por Output o por llamada. La funcion no modifica el registro.

## 11. Resolucion

```json
{
  "width": 1920,
  "height": 1080,
  "orientation": "landscape",
  "aspectRatio": "16:9",
  "pixelRatio": 1,
  "refreshRate": 60
}
```

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| `width` | integer | Ancho en pixeles. |
| `height` | integer | Alto en pixeles. |
| `orientation` | enum | `landscape`, `portrait` o `square`. |
| `aspectRatio` | string | Relacion declarada o calculada. |
| `pixelRatio` | number | Densidad mayor que cero. |
| `refreshRate` | number/null | Frecuencia declarada mayor que cero. |

Reglas:

- `width` y `height` son enteros mayores que cero.
- `pixelRatio` es finito y mayor que cero.
- `refreshRate` es `null` o un numero finito mayor que cero.
- Si cambian ancho o alto sin indicar orientacion, esta se recalcula.
- Si cambian ancho o alto sin indicar aspect ratio, este se reduce matematicamente.
- `NaN`, `Infinity`, cero y valores negativos se rechazan en setters.

## 12. Safe Area

```json
{
  "top": 0.05,
  "right": 0,
  "bottom": 0.1,
  "left": 0,
  "unit": "normalized"
}
```

Unidades:

- `px`: valores no negativos sin limite artificial.
- `%`: rango de 0 a 100.
- `normalized`: rango de 0 a 1.

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| `top` | number | Margen superior. |
| `right` | number | Margen derecho. |
| `bottom` | number | Margen inferior. |
| `left` | number | Margen izquierdo. |
| `unit` | enum | `px`, `%` o `normalized`. |

Los cuatro bordes conservan cero como valor valido. El motor solo describe el area segura; el Layout Engine futuro sera responsable de aplicarla al render.

## 13. Proyeccion universal

`buildBroadcastOutputProjection(output, broadcastState, broadcastContract, options)` genera una estructura serializable para el adaptador futuro.

La proyeccion contiene:

| Campo | Descripcion |
| --- | --- |
| `projectionVersion` | Version del formato de proyeccion. |
| `projectionId` | ID determinista por Output, view y revision de estado. |
| `generatedAt` | Momento de construccion. |
| `visibility` | Visibilidad efectiva. |
| `output` | Descriptor seguro del destino. |
| `broadcast` | Solo la view seleccionada y sus referencias. |
| `layers` | Capas activas permitidas para ese Output. |
| `graphics` | Graficos visibles permitidos para ese Output. |
| `contract` | Broadcast Data Contract sanitizado. |
| `warnings` | Alertas de estado, datos o compatibilidad. |
| `errors` | Errores de validacion del State o Contract. |
| `validation` | Resultado final de validacion. |

El descriptor `output` contiene `id`, `name`, `type`, `status`, `enabled`, `visibility`, `resolution`, `orientation`, `aspectRatio`, `safeArea`, `assignedLayers`, `themeId`, `capabilities`, `lastAppliedRevision`, `lastAppliedAt`, `latency`, `stale`, `tenantId`, `organizationId`, `tournamentId`, `competitionId` y `sessionId`. Los tres campos internos indicados en la seccion de visibilidad se omiten para publico.

El bloque `broadcast` contiene:

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| `stateVersion` | string | Version de Broadcast State. |
| `revision` | integer | Revision global del State. |
| `selectedView` | enum | `preview` o `program`; nunca ambas. |
| `viewRevision` | integer | Revision de la view seleccionada. |
| `active` | boolean | Estado activo de esa view. |
| `status` | string/null | Estado normalizado de la view. |
| `compositionId` | string/null | Composicion seleccionada. |
| `sceneId` | string/null | Escena seleccionada. |
| `themeId` | string/null | Theme resuelto para el Output. |
| `transitionMode` | string/null | `take`, `cut` o `auto` solo en Program. |
| `contextRef` | object | Referencia ligera al Data Contract. |
| `templateInstances` | object | Instancias visibles permitidas. |
| `activeLayerIds` | string[] | Capas activas efectivas. |
| `visibleGraphicIds` | string[] | Graficos visibles efectivos. |

La funcion no guarda la proyeccion, no actualiza `lastAppliedRevision` y no asume que un adaptador aplico el contenido.

## 14. Separacion Preview y Program

La view se resuelve por `options.view`, `output.projection.view` o tipo de Output.

### Preview

- consume exclusivamente `broadcastState.preview`;
- no incluye `broadcastState.program`;
- usa sus `activeLayers`, `visibleGraphics`, `templateInstances`, escena y composicion;
- un cambio en Program no se mezcla en esa proyeccion.

### Program

- consume exclusivamente `broadcastState.program`;
- no incluye `broadcastState.preview`;
- conserva `transitionMode` solamente para Program;
- un borrador de Preview nunca aparece por accidente en Program.

La proyeccion publica una unica propiedad `broadcast` con `selectedView`; no expone bloques paralelos `preview` y `program`.

## 15. Layers

`assignedLayers` no modifica Broadcast State. Solo limita lo que consume el Output.

- Sin asignacion explicita se usan las capas activas de la view.
- Con asignacion explicita se usa la interseccion con las capas activas.
- Una capa asignada pero inactiva produce warning.
- Los graficos se filtran por layer, `visibleGraphics` y `graphic.outputIds`.
- Las instancias de plantilla se filtran con el mismo scope.

## 16. Theme

`themeId` es una referencia declarativa. El Output puede sobreescribir el Theme de la view para su propia proyeccion. Esta version no resuelve tokens, assets ni estilos; eso corresponde al Theme Engine futuro.

## 17. Visibilidad

Niveles soportados:

1. `public`
2. `production`
3. `operational`
4. `restricted`

El Output define la visibilidad maxima autorizada. Una llamada puede solicitar una visibilidad mas restrictiva, pero nunca elevarla.

Ejemplo: un Output `public` continua siendo publico aunque el caller solicite `restricted`.

El contrato se filtra usando `sanitizeBroadcastDataContract()`. Para visibilidad publica se eliminan, entre otros:

- identidad del operador;
- identidad del juez;
- diagnosticos restringidos;
- IDs privados de organizacion;
- custom fields no publicos.

El descriptor del Output tambien omite `tenantId`, `organizationId` y `sessionId` en proyecciones publicas. Conserva `tournamentId` y `competitionId` como contexto deportivo de la salida.

El filtro conserva valores publicos validos como `0`, `false` y `""`.

## 18. Multi-tenant

Cada Output puede portar simultaneamente:

- `tenantId`
- `organizationId`
- `tournamentId`
- `competitionId`
- `sessionId`

`listBroadcastOutputs()` puede filtrar por esos campos. El motor no infiere ni inventa scopes y no mezcla registros. La autorizacion de acceso persistente se implementara fuera de este modulo.

## 19. Seguridad e inmutabilidad

El clonador interno:

- no muta entradas;
- elimina funciones, simbolos y bigint;
- convierte numeros no finitos en `null`;
- controla ciclos;
- limita profundidad a 12 niveles;
- limita arreglos y claves procesadas a 250;
- ignora getters/setters para no ejecutar accesores;
- bloquea `__proto__`, `constructor` y `prototype`;
- conserva cero, `false` y cadena vacia.

El registro almacena copias congeladas y todas las APIs publicas devuelven nuevas copias.

## 20. Compatibilidad Legacy

Broadcast Output v1 es aditivo:

- no modifica `broadcastContext`;
- no modifica Broadcast Data Contract;
- no modifica Broadcast State;
- no sustituye campos legacy;
- no cambia `legacy.activeEngine`;
- no activa V2 en ningun output existente;
- no crea un adaptador OBS;
- no toca graficos V1 ni OBS V1;
- no publica un nuevo nodo en `live/current`.

Los aliases legacy que ya existan en el Data Contract pueden viajar en una proyeccion de produccion cuando la visibilidad los permita.

## 21. Errores controlados

Las operaciones que no pueden aplicarse lanzan `BroadcastOutputError` con un `code` estable. Casos principales:

- `output-id-required`
- `output-not-registered`
- `output-already-registered`
- `output-invalid`
- `output-expected-revision-mismatch`
- `output-patch-field-forbidden:*`
- `output-status-invalid`
- `output-type-invalid`
- `heartbeat-sequence-out-of-order`
- errores de resolution, safe area o capability.

Una operacion rechazada no modifica el registro.

## 22. Ejemplo minimo

```js
import {
  registerBroadcastOutput,
  buildBroadcastOutputProjection
} from "./js/broadcast/broadcastOutput.js";

const output = registerBroadcastOutput({
  id: "obs_program_1",
  name: "OBS Program",
  type: "obs",
  status: "offline",
  visibility: "production",
  resolution: { width: 1920, height: 1080 },
  safeArea: { top: 40, right: 40, bottom: 40, left: 40, unit: "px" },
  assignedLayers: ["scoreboard", "turn", "score", "timer"],
  tenantId: "tenant_1",
  organizationId: "org_1",
  tournamentId: "torneo_1",
  sessionId: "session_1"
});

const projection = buildBroadcastOutputProjection(
  output,
  broadcastState,
  broadcastContract,
  { view: "program" }
);
```

El ejemplo solo construye datos. No envia nada a OBS.

## 23. Limitaciones de v1

Esta version no incluye:

- adaptadores reales;
- sockets o heartbeat automatico;
- persistencia local o Firebase;
- confirmacion remota de revisiones;
- Renderer;
- Template Engine;
- Theme Engine;
- Layout Engine;
- Preview o Program visual;
- Action Engine;
- retry, backoff o failover;
- negociacion automatica de capabilities;
- URLs de Browser Source;
- control de audio o video;
- editor visual.

Estas limitaciones son intencionales para mantener el ticket pequeno, reversible y compatible con CharroPro estable.

## 24. Criterio para adaptadores futuros

Un adaptador futuro debera:

1. registrarse como Output;
2. declarar capabilities reales;
3. recibir solamente una Output Projection valida;
4. aplicar la revision autorizada;
5. reportar heartbeat y `lastAppliedRevision` mediante una transicion controlada;
6. no leer Firebase, Broadcast State ni el Core directamente;
7. no alterar Preview o Program.

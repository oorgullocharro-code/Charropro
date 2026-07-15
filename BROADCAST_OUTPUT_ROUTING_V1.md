# Broadcast Output Routing V1

## Propósito

Output Routing V1 define qué fuente oficial recibe cada salida lógica de Broadcast Studio. Es una capa pura, declarativa y en memoria situada después de Program Engine. No crea una salida física, no genera HTML ni URLs y no abre conexiones externas.

Versión del contrato: `1.0.0`.

## Arquitectura

```text
Broadcast Data Contract
        ↓
Production Variables
        ↓
Preview Engine
        ↓
Program Engine
        ↓
Output Routing
        ├── program-main
        ├── announcer-monitor
        └── timer-display
```

`program-main` recibe exclusivamente un snapshot oficial de Program. `announcer-monitor` recibe una proyección operativa construida con datos ya resueltos. `timer-display` recibe una copia de solo lectura del cronómetro oficial existente.

Output Routing no escribe al Core deportivo, Preview, Program, Broadcast State, Broadcast Output, Data Contract, Production Variables ni cronómetro.

## API pública

El módulo `js/broadcast/outputRouting.js` exporta:

- `OUTPUT_ROUTING_VERSION`
- `OUTPUT_ROUTE_TYPES`
- `OUTPUT_ROUTE_STATES`
- `OUTPUT_ROUTE_VISIBILITIES`
- `OUTPUT_ROUTE_ERROR_CODES`
- `BroadcastOutputRoutingError`
- `createOutputRoutingEngine()`
- `destroyOutputRoutingEngine()`
- `createOutputRoute()`
- `updateOutputRoute()`
- `removeOutputRoute()`
- `enableOutputRoute()`
- `disableOutputRoute()`
- `clearOutputRoute()`
- `resolveOutputRoute()`
- `validateOutputRoute()`
- `routeProgramToOutput()`
- `routeAnnouncerMonitor()`
- `routeTimerDisplay()`
- `getOutputRoute()`
- `listOutputRoutes()`
- `getOutputRoutingStatus()`
- `getOutputRoutingWarnings()`
- `getOutputRoutingErrors()`
- `buildOutputRoutingSnapshot()`
- `validateOutputRoutingSnapshot()`
- `cloneOutputRoutingResult()`

## Tipos oficiales

V1 admite exactamente:

| routeType | outputId | sourceType | Propósito |
| --- | --- | --- | --- |
| `program_main` | `program-main` | `program_snapshot` | Programa gráfico oficial al aire |
| `announcer_monitor` | `announcer-monitor` | `announcer_projection` | Información operativa para locución |
| `timer_display` | `timer-display` | `timer_projection` | Pantalla de solo lectura del cronómetro oficial |

No existen en V1 rutas para jueces, resultados públicos, LED genérico, vertical, Social Output o Multiview.

## Estados

Los estados implementados son:

- `uninitialized`
- `ready`
- `configured`
- `resolving`
- `routed`
- `stale`
- `disabled`
- `cleared`
- `destroyed`
- `error`

Crear una ruta deja el motor configurado. Resolverla guarda una proyección desacoplada. Deshabilitar impide entregas. Limpiar elimina solamente la proyección de esa ruta y conserva el motor. Destruir es terminal y las operaciones posteriores fallan con `output-routing-destroyed`.

`controlled-empty` es un estado de resultado de `program-main`, no un estado persistente de la definición de ruta. Indica que el snapshot oficial de Program es válido pero no contiene un Program activo.

## Modelo de ruta

Cada ruta normalizada contiene:

```json
{
  "outputRoutingVersion": "1.0.0",
  "routeId": "route-program-main",
  "routeType": "program_main",
  "outputId": "program-main",
  "name": "Program Main",
  "description": null,
  "status": "configured",
  "enabled": true,
  "visibility": "public",
  "sourceType": "program_snapshot",
  "sourceId": null,
  "resolution": {
    "width": 1920,
    "height": 1080,
    "transparentBackground": true
  },
  "orientation": "landscape",
  "safeArea": {
    "top": 0,
    "right": 0,
    "bottom": 0,
    "left": 0
  },
  "refreshMode": "manual",
  "permissions": {
    "readOnly": true,
    "canResolve": true,
    "canConfigure": false,
    "canControlProgram": false,
    "canControlPreview": false,
    "canControlTimer": false
  },
  "scope": "global",
  "tenantId": null,
  "organizationId": null,
  "clientId": null,
  "tournamentId": null,
  "competitionId": null,
  "sessionId": null,
  "revision": 0,
  "sourceRevision": null,
  "lastResolvedAt": null,
  "staleAfterMs": 15000,
  "expiresAt": null,
  "projection": null,
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "createdBy": null,
  "updatedBy": null,
  "warnings": [],
  "errors": [],
  "metadata": {}
}
```

El registro interno vive en un `WeakMap` privado por motor. Las lecturas y resultados son copias serializables sin referencias mutables compartidas.

## Program Main

`routeProgramToOutput()` acepta únicamente snapshots con versión compatible con Program Engine, fecha válida y Program validado mediante `validateProgram()`.

La proyección conserva, cuando existen:

- `programId`
- revisión de Program
- `previewId`
- `themeRenderId`
- `templateRenderId`
- `templateId`
- `themeId`
- `templateInstanceId`
- modo de transición
- metadata de output
- componentes o composición declarativa presentes en Program
- warnings y errors sanitizados

No contiene DOM, runtime, renderer, listeners, actores, secretos ni identidad tenant en visibilidad pública. No prepara Program ni ejecuta Take, Cut, Auto, Update o Clear.

Un snapshot oficial sin Program produce `controlled-empty`. La ruta no crea un Program alterno.

## Announcer Monitor

`routeAnnouncerMonitor()` crea una proyección de solo lectura con:

- `current`
- `next`
- `standings`
- `timer`
- `notes`
- `sponsorMention`
- `alerts`
- `context`
- `generatedAt`

`current` puede contener torneo, competencia, charreada, suerte, equipo, participante, caballo, score y posición ya calculados. La ruta no calcula score, ranking, diferencia, tiempo o estadísticas. Si un dato no existe se conserva vacío o se presenta como `NO DISPONIBLE`.

Su visibilidad solo puede ser `operational` o `restricted`; nunca `public`. Las notas privadas solo se incorporan en una resolución `restricted`. No incluye datos del juez, controles de producción, secretos o datos personales privados.

## Timer Display

`routeTimerDisplay()` consume una lectura del cronómetro oficial con:

```json
{
  "timerId": "timer_official",
  "status": "running",
  "formattedTime": "00:42.18",
  "elapsedMs": 42180,
  "remainingMs": null,
  "startedAt": "ISO-8601",
  "pausedAt": null,
  "stoppedAt": null,
  "sourceRevision": 7,
  "contextRef": {},
  "generatedAt": "ISO-8601",
  "alertState": null
}
```

Los estados aceptados son `ready`, `running`, `paused`, `stopped`, `finished`, `unavailable`, `stale` y `offline`.

El valor formateado, los milisegundos y la revisión se copian sin recalcular ni incrementar. No se crean intervalos, controles Start/Pause/Stop/Reset ni un segundo cronómetro. La proyección puede contener suerte, equipo, participante e intento como contexto mínimo.

La política futura ante desconexión será conservar el último valor conocido, marcar falta de conexión y resincronizar desde una nueva revisión oficial. V1 solo modela ese estado; no implementa polling, sockets ni Firebase.

## Resolución

`resolveOutputRoute()` ejecuta de forma explícita:

1. validación del motor;
2. validación de la ruta;
3. validación de `enabled`;
4. aislamiento tenant y scope;
5. compatibilidad de output y `sourceType`;
6. visibilidad efectiva;
7. revisión de fuente;
8. construcción de la proyección;
9. sanitización;
10. almacenamiento de una copia privada.

No crea DOM ni actualiza automáticamente al cambiar la fuente. Cada actualización requiere una nueva llamada explícita.

El resultado incluye `routeId`, `routeType`, `outputId`, `sourceType`, `sourceRevision`, `routeRevision`, `status`, `visibility`, `resolution`, `projection`, `warnings`, `errors` y `resolvedAt`.

## Stale y revisiones

Cada ruta conserva `revision`, `sourceRevision`, `lastResolvedAt`, `staleAfterMs`, `expiresAt` y `status`.

La evaluación de stale ocurre únicamente al resolver o consultar. Puede marcarse por:

- fuente más antigua que `staleAfterMs`;
- revisión detrás de `currentSourceRevision`;
- revisión que no avanza durante el periodo configurado;
- expiración de ruta;
- cambio de torneo o competencia solicitado.

No existen timers globales. Un resultado stale conserva la última proyección y agrega diagnóstico.

## Expected Revision

`updateOutputRoute()`, `removeOutputRoute()`, `enableOutputRoute()` y `disableOutputRoute()` aceptan `expectedRevision`. `clearOutputRoute()` también lo admite como protección adicional.

Un conflicto produce `output-route-revision-conflict`. El rechazo es atómico: no cambia ruta, proyección, timestamps, revisión ni otras rutas.

## Idempotencia

Crear, actualizar, habilitar, deshabilitar, eliminar, limpiar y resolver aceptan `idempotencyKey`.

- misma llave y misma intención devuelve el resultado previo;
- misma llave con una intención diferente falla con `output-route-idempotency-conflict`;
- no se duplican rutas, revisiones o resoluciones efectivas.

El registro de idempotencia vive únicamente en memoria durante V1.

## Visibilidad

La visibilidad efectiva es la más restrictiva entre ruta, fuente y solicitud.

- `program-main`: `public` o `production`;
- `announcer-monitor`: `operational` o `restricted`;
- `timer-display`: `public`, `production` u `operational`.

La sanitización nunca eleva acceso. Un snapshot público elimina identidad tenant, organización, cliente, sesión y actores.

## Multi-tenant

Las rutas pueden estar en scope `global`, `tenant`, `organization`, `client`, `tournament`, `competition` o `session`.

Una ruta no puede consumir una fuente con tenant, organización, cliente, torneo, competencia o sesión incompatibles. Una ruta global solo puede consumir fuentes públicas. No existe fallback cruzado ni mezcla de registros.

## Seguridad

El clonado seguro:

- no muta entradas;
- elimina funciones, símbolos y `BigInt`;
- controla ciclos, profundidad, arreglos, objetos y longitud de texto;
- ignora getters y setters sin ejecutarlos;
- bloquea `__proto__`, `constructor` y `prototype`;
- excluye DOM, runtime, renderer, listeners, conexiones, plugins y handlers;
- excluye credenciales, tokens, secretos y URLs firmadas;
- bloquea `javascript:`, `file:`, `vbscript:` y `data:text/html`;
- escapa markup peligroso como texto;
- conserva `0`, `false`, `""` y `null`.

El módulo no usa `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `eval`, `new Function`, `cssText` ni eventos inline.

## Snapshot

`buildOutputRoutingSnapshot()` produce:

- `snapshotVersion`
- `outputRoutingVersion`
- `engineId`
- `status`
- definiciones de rutas sin proyección completa
- resúmenes de rutas
- revisiones de fuente y ruta
- estado enabled
- stale
- resolución y visibilidad
- warnings y errors
- `generatedAt`

No incluye Program completo, contrato completo, fuente completa del timer, DOM, runtime, renderer, listeners, registries, actores públicos, tenant público, secretos o URLs inseguras. Modificar el snapshot no afecta el motor.

## Production Console

La sección `OUTPUT ROUTING` muestra tres tarjetas:

- Program Main
- Announcer Monitor
- Timer Display

Cada tarjeta muestra estado, revisiones, resolución, visibilidad, stale y diagnósticos. Las previsualizaciones son técnicas y declarativas; no representan una salida física.

Los controles disponibles son Configurar, Resolver, Actualizar, Habilitar, Deshabilitar, Limpiar proyección y Copiar Snapshot.

La consola no ofrece Abrir Browser Source, URL pública, OBS, vMix, Take, Cut, Auto ni controles del cronómetro dentro de Output Routing.

## Compatibilidad

Output Routing V1 opera en paralelo y no modifica:

- Program Engine;
- Preview Engine;
- Theme Template Integration;
- Theme Engine;
- Template Renderer Integration;
- Template Engine;
- Component Renderer;
- Component Library;
- Production Variables;
- Action Engine;
- Broadcast Output;
- Broadcast State;
- Asset Manager;
- gráficos V1;
- OBS V1;
- cronómetro del juez;
- calificador;
- resultados;
- página pública;
- Core deportivo;
- Firebase.

## Limitaciones actuales

- No existen Browser Outputs.
- No existen URLs físicas.
- No conecta OBS, vMix, Wirecast, Streamlabs ni software externo.
- No usa Firebase, Storage, sockets o polling.
- No persiste rutas o resultados.
- No actualiza rutas automáticamente.
- `timer-display` no controla el cronómetro.
- `announcer-monitor` es solo lectura.
- La página pública continúa separada mediante `publicTournaments`.
- No existe una salida adicional para jueces.
- No renderiza HTML ni iframes.

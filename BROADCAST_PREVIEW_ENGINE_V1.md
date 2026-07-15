# Broadcast Preview Engine V1

## Propósito

Preview Engine V1 convierte una composición validada por Theme Template Integration en el Preview oficial de Broadcast Studio. Opera exclusivamente en memoria y mantiene una sola composición activa. No controla Program, Take, Cut, Outputs, OBS, Firebase ni Live Bindings.

Versión del contrato: `1.0.0`.

## Arquitectura

```text
Broadcast Data Contract
  -> Production Variables
  -> Component Library
  -> Template Engine
  -> Theme Engine
  -> Theme Template Integration
  -> Template Renderer Integration
  -> Preview Engine
  -> Preview Canvas
```

Preview Engine no importa ni invoca Component Renderer. El runtime visual se crea, actualiza y retira mediante Theme Template Integration. El DOM nunca forma parte del estado público o de los snapshots de Preview.

## API pública

- `PREVIEW_ENGINE_VERSION`
- `BroadcastPreviewError`
- `createPreviewEngine()`
- `destroyPreviewEngine()`
- `preparePreview()`
- `renderPreview()`
- `updatePreview()`
- `clearPreview()`
- `getPreview()`
- `hasPreview()`
- `getPreviewState()`
- `getPreviewSnapshot()`
- `validatePreview()`
- `disposePreview()`
- `isPreviewReady()`
- `isPreviewDestroyed()`

## Estados

Los únicos estados permitidos son:

`uninitialized`, `ready`, `preparing`, `prepared`, `rendering`, `rendered`, `updating`, `cleared`, `destroyed` y `error`.

La creación termina en `ready`. `preparePreview()` deja el motor en `prepared`; `renderPreview()` y una actualización exitosa terminan en `rendered`. `clearPreview()` limpia la composición y devuelve el motor a `ready`. `destroyPreviewEngine()` es terminal.

## Identidad

Cada Preview contiene:

| Campo | Tipo | Significado |
| --- | --- | --- |
| `previewId` | string | Identidad estable de la composición compatible |
| `createdAt` | ISO-8601 | Creación del Preview |
| `updatedAt` | ISO-8601 | Última transición exitosa |
| `revision` | integer | Revisión del Preview |
| `status` | string | Estado de la composición |
| `visibility` | string | Visibilidad efectiva |
| `output` | object | Descriptor serializable del canvas |
| `themeRenderId` | string | Render temático delegado |
| `templateRenderId` | string | Render del template delegado |
| `templateId` | string | Template fuente |
| `themeId` | string | Theme aplicado |
| `templateInstanceId` | string | Instancia declarativa del template |

Una actualización compatible conserva `previewId`. Un cambio incompatible de output o template crea una nueva identidad determinista. No se generan IDs aleatorios durante una actualización compatible.

## Preparación

`preparePreview()` recibe un Theme Template Integration Snapshot. Antes de aceptar la preparación verifica:

- versión, timestamp, visibilidad e identidad de integración;
- presencia de un `themedRenderId` y sus IDs de template y theme;
- serialización segura;
- ausencia de DOM, runtime, renderer, listeners, actores y secretos;
- ausencia de funciones, símbolos, `BigInt`, ciclos, accessors y claves peligrosas.

La preparación privada que Theme Template Integration necesita se resuelve mediante el adaptador creado junto con el motor. Esa referencia no se expone en Preview ni en snapshots.

## Render y runtime

`renderPreview()` solo acepta un Preview preparado. Delega el render a Theme Template Integration, conserva la raíz únicamente en el runtime privado y publica un descriptor desacoplado. Una segunda llamada sobre el mismo Preview renderizado es idempotente y no crea otra raíz.

La separación es:

```text
Preview Engine -> Preview Runtime -> Theme Template Integration -> Renderer Runtime
```

No se comparten referencias mutables entre el descriptor público y los runtimes.

## Actualización y atomicidad

`updatePreview()` admite un nuevo snapshot, theme, template, binding resuelto, contexto, visibilidad u output mediante una allowlist. La operación se delega al adaptador temático.

Si la actualización falla, el motor restaura exactamente:

- `previewId`;
- revisión y timestamps;
- descriptor y snapshot fuente;
- estado;
- referencia al render activo.

Theme Template Integration aporta la restauración atómica del DOM para actualizaciones compatibles. Un cambio incompatible se trata como reemplazo y recibe una nueva identidad.

## Clear, dispose y destroy

`clearPreview()` y `disposePreview()` retiran el render delegado y eliminan preparación, snapshot fuente, runtime y diagnósticos temporales. El motor permanece listo para una nueva preparación.

`destroyPreviewEngine()` elimina Preview, adaptador, caches y referencias privadas. Después de destroy, preparar, renderizar, actualizar, limpiar u obtener un snapshot operativo falla con `preview-engine-destroyed`.

## Snapshot

`getPreviewSnapshot()` devuelve una copia serializable y desacoplada con:

- versión;
- fecha de generación;
- estado y revisión del motor;
- visibilidad efectiva;
- descriptor del Preview;
- warnings y errors.

No incluye DOM, renderer, runtime, listeners, caches, actores, credenciales ni URLs firmadas. Un snapshot público elimina identidad tenant, organización, cliente, sesión y operador. Modificar el snapshot no modifica el motor.

## Visibilidad

La visibilidad nunca se amplía respecto a Theme Template Integration. Preview puede operar con una visibilidad más restrictiva, pero no transformar contenido `production`, `operational` o `restricted` en contenido público.

## Seguridad

La clonación segura usa descriptores de propiedad y límites explícitos. Se rechazan:

- `__proto__`, `constructor` y `prototype`;
- getters y setters;
- funciones, símbolos y `BigInt`;
- ciclos, `WeakMap`, `WeakSet` y referencias DOM;
- HTML ejecutable, scripts, iframes, objetos embebidos y eventos inline;
- esquemas `javascript:`, `data:` y `file:`;
- `eval` y `new Function` en datos;
- estructuras que exceden límites de profundidad, cantidad de claves o arreglos.

Los valores `0`, `false`, `""` y `null` permanecen válidos.

## Production Console

La sección `Official Preview` reemplaza el laboratorio visual de Theme + Template. Conserva selectores declarativos de Template, Theme, fixture, output y visibilidad. Sus únicas acciones son:

- Preparar;
- Renderizar;
- Actualizar;
- Limpiar;
- Snapshot.

Muestra Preview ID, estado, revisión, Theme, Template, output, visibilidad, warnings y errors. No contiene acciones Take, Cut, Auto o Program. El canvas conserva una sola raíz del renderer.

## Límites V1

- No existe Program oficial V2.
- No existe Take, Cut o Auto.
- No se controlan Outputs u OBS.
- No hay Firebase, persistencia ni Live Bindings.
- No se recupera Preview al recargar.
- Los cambios son manuales desde Production Console.

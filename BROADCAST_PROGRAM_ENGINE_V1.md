# Broadcast Program Engine V1

## Propósito

Program Engine V1 representa la composición oficial que está al aire. Recibe exclusivamente snapshots emitidos por Preview Engine V1, mantiene un único Program activo y modela manualmente `Take`, `Cut`, `Auto`, actualización y limpieza. Todo opera en memoria.

Versión del contrato: `1.0.0`.

## Arquitectura

```text
Broadcast Data Contract
  -> Production Variables
  -> Component Library
  -> Template Engine
  -> Theme Engine
  -> Theme Template Integration
  -> Preview Engine
  -> Program Engine
  -> Program Runtime
```

Program Engine no importa Template Engine, Theme Engine, Renderer ni Component Library. Su única entrada de contenido es un Preview Snapshot oficial validado. No consulta Firebase, Broadcast State, Outputs ni estructuras legacy.

## API pública

- `PROGRAM_ENGINE_VERSION`
- `BroadcastProgramError`
- `createProgramEngine()`
- `destroyProgramEngine()`
- `prepareProgram()`
- `takeProgram()`
- `cutProgram()`
- `autoProgram()`
- `updateProgram()`
- `clearProgram()`
- `getProgram()`
- `hasProgram()`
- `getProgramState()`
- `getProgramSnapshot()`
- `validateProgram()`
- `disposeProgram()`
- `isProgramReady()`
- `isProgramDestroyed()`

## Estados

Los estados oficiales son:

`uninitialized`, `ready`, `prepared`, `taking`, `program`, `cutting`, `auto_transition`, `updating`, `cleared`, `destroyed` y `error`.

Las transiciones `taking`, `cutting` y `auto_transition` son sincrónicas y terminan en `program`. V1 no ejecuta duración, delay, fade ni animación.

## Identidad

Cada Program contiene:

| Campo | Tipo | Significado |
| --- | --- | --- |
| `programId` | string | Identidad estable mientras output y renderer sean compatibles |
| `createdAt` | ISO-8601 | Creación de la identidad actual |
| `updatedAt` | ISO-8601 | Última transición exitosa |
| `revision` | integer | Revisión del Program activo |
| `status` | string | Estado público `program` |
| `visibility` | string | Visibilidad efectiva heredada de Preview |
| `output` | object | Descriptor serializable del output preparado |
| `previewId` | string | Preview oficial promovido |
| `themeRenderId` | string | Render temático fuente |
| `templateRenderId` | string | Render de template fuente |
| `templateId` | string | Template fuente |
| `themeId` | string | Theme aplicado |
| `templateInstanceId` | string | Instancia declarativa del template |
| `transitionMode` | string | `take`, `cut`, `auto` o `update` |

Un cambio compatible conserva `programId` e incrementa su revisión. Un output con identidad, tipo, orientación o resolución distinta, o un renderer incompatible, crea un Program nuevo. Cambiar Preview, Theme o Template dentro del mismo output no obliga a sustituir la identidad.

## Prepare y fuente oficial

`prepareProgram()` recibe únicamente un snapshot de Preview Engine V1. Valida:

- versión oficial de Preview;
- timestamp e identidad de Preview;
- descriptor validado por `validatePreview()`;
- estado `prepared` o `rendered`;
- ausencia de errores bloqueantes;
- ausencia de DOM, runtime, renderer, listeners, funciones, símbolos, `BigInt`, accessors, ciclos y secretos.

Production Console exige además que Preview esté `rendered` antes de preparar Program, porque su canvas visual necesita una raíz ya materializada.

## Take, Cut y Auto

Las tres operaciones consumen únicamente la preparación privada actual:

- `takeProgram()` modela `taking -> program`;
- `cutProgram()` modela `cutting -> program` de forma inmediata;
- `autoProgram()` modela `auto_transition -> program` sin animar.

Ninguna operación destruye, limpia o muta Preview. Después de la promoción, Preview y Program continúan disponibles con identidades y referencias separadas.

## Program Runtime

El runtime es privado en un `WeakMap`. Conserva una copia segura del Preview Snapshot, un descriptor de raíz única, renderer, contexto y clave de compatibilidad. No se expone por la API ni se serializa.

Program Engine no crea DOM. En Production Console, la interfaz clona una sola vez la raíz visual ya sanitizada de Preview al ejecutar Take, Cut, Auto o Update. Esa copia pertenece a la consola y no comparte nodos ni listeners con Preview. Cambios posteriores de Preview no modifican el canvas de Program.

## Update y atomicidad

`updateProgram()` acepta otro Preview Snapshot oficial. Puede incorporar otro Preview, Theme, Template, contexto, visibilidad u output únicamente a través de esa fuente validada y opciones operativas seguras.

La validación termina antes de tocar el estado. Si la actualización falla, permanecen exactamente iguales:

- `programId`;
- Program y snapshot;
- estado;
- revisión y timestamps;
- runtime privado;
- canvas de Production Console.

## Clear, dispose y destroy

`clearProgram()` y `disposeProgram()` eliminan Program, preparación, runtime, snapshot fuente, diagnósticos y referencias privadas. El motor vuelve a `ready` y puede reutilizarse.

`destroyProgramEngine()` es terminal. Después de destroy, preparar, Take, Cut, Auto, actualizar, limpiar u obtener snapshot falla con `program-engine-destroyed`.

## Snapshot

`getProgramSnapshot()` devuelve una copia serializable y desacoplada con versión, fecha, estado, revisión, visibilidad, descriptor Program, warnings y errors.

No incluye DOM, runtime, renderer, listeners, actores, caches, credenciales ni URLs firmadas. En visibilidad pública elimina identidad tenant, organización, cliente, sesión, usuario y operador. Modificar el snapshot no cambia Program.

## Seguridad

La clonación segura usa descriptores de propiedad y límites explícitos. Rechaza:

- `__proto__`, `constructor` y `prototype`;
- getters y setters;
- funciones, símbolos y `BigInt`;
- ciclos, `WeakMap`, `WeakSet` y referencias DOM;
- HTML ejecutable, scripts, iframes, objetos embebidos y handlers inline;
- `javascript:`, `file:`, `data:`, `eval` y `new Function`;
- estructuras que exceden profundidad, cantidad de claves, longitud de texto o arreglos permitidos.

Los valores `0`, `false`, `""` y `null` permanecen válidos.

## Production Console

La sección `Official Program` muestra Program ID, estado, revisión, Theme, Template, output, Preview fuente, visibilidad, warnings y errors. Sus acciones son:

- Prepare;
- Take;
- Cut;
- Auto;
- Update;
- Clear;
- Snapshot.

El canvas mantiene una sola raíz independiente. No agrega controles de OBS, vMix, Browser Output, Firebase ni routing.

## Límites V1

- No existe Browser Source ni conexión a Outputs.
- No existe OBS, vMix o Wirecast.
- No hay Firebase, persistencia, Live Sync o recuperación de sesión.
- Cut y Auto no animan.
- No hay Output Routing.
- Program se pierde al recargar.
- Broadcast State V1 y su Program legacy permanecen sin cambios y separados del Program oficial.

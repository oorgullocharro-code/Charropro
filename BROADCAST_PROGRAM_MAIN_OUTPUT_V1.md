# Broadcast Program Main Output V1

## Propósito

Program Main Output es la primera salida visual oficial de Broadcast Studio. Presenta, sin controles operativos, la composición declarativa vigente recibida por la ruta `program-main`.

Versión del módulo: `1.0.0`.

Versión de aplicación: `20260715-program-main-output-001-official-program-visual-output-v1`.

La página local es:

```text
./program-main-output.html
```

No es todavía una URL productiva ni una Browser Source autenticada.

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
Program Projection
        ↓
Output Routing
        ↓
Browser Output Infrastructure
        ↓
Program Main Output
```

Program Main Output consume exclusivamente el sobre validado de Output Routing para `program-main`. No consulta Preview Engine, Program Engine, Data Contract, Production Variables, Firebase ni el estado del juez.

## Responsabilidades

- Output Routing construye y sanitiza la proyección oficial.
- Browser Output Infrastructure aporta configuración, montaje, revisiones y lifecycle web común.
- Component Renderer monta componentes declarativos mediante su API pública.
- Program Main Output adapta la geometría proyectada al lienzo lógico y presenta el resultado.

Program Main Output no prepara Templates, no resuelve Themes y no calcula datos deportivos.

## Diferencias Entre Módulos

### Program Engine

Conserva la composición oficial al aire y solo cambia mediante operaciones controladas de Program.

### Program Projection

Transporta una copia declarativa, serializable y desacoplada de Program.

### Output Routing

Resuelve la ruta lógica `route-program-main` y entrega el sobre compatible con salidas web.

### Browser Output

Proporciona lifecycle, validación común, revisiones, montaje y aislamiento para salidas web.

### Program Main Output

Presenta visualmente la composición ya resuelta. No controla Program ni modifica la proyección.

## API Pública

El módulo `js/broadcast/programMainOutput.js` exporta:

- `PROGRAM_MAIN_OUTPUT_VERSION`
- `PROGRAM_MAIN_OUTPUT_STATES`
- `PROGRAM_MAIN_OUTPUT_ERROR_CODES`
- `PROGRAM_MAIN_OUTPUT_DISPLAY_MODES`
- `PROGRAM_MAIN_OUTPUT_RENDER_STATES`
- `BroadcastProgramMainOutputError`
- `createProgramMainOutput()`
- `configureProgramMainOutput()`
- `mountProgramMainOutput()`
- `applyProgramMainProjection()`
- `updateProgramMainOutput()`
- `clearProgramMainOutput()`
- `destroyProgramMainOutput()`
- `getProgramMainOutput()`
- `getProgramMainOutputStatus()`
- `getProgramMainOutputWarnings()`
- `getProgramMainOutputErrors()`
- `validateProgramMainOutputConfig()`
- `validateProgramMainProjection()`
- `validateProgramMainOutputSnapshot()`
- `renderProgramMainProjection()`
- `setProgramMainOutputViewport()`
- `setProgramMainOutputDisplayMode()`
- `buildProgramMainOutputSnapshot()`
- `cloneProgramMainOutputResult()`

No existen APIs de Take, Cut, Auto, cronómetro, Firebase, OBS, vMix o Wirecast.

## Configuración

La configuración oficial usa:

```json
{
  "programMainOutputId": "program-main-output",
  "browserOutputId": "browser-output-program-main",
  "routeId": "route-program-main",
  "outputId": "program-main",
  "routeType": "program_main",
  "sourceType": "program_snapshot",
  "displayMode": "fit",
  "visibility": "public",
  "resolution": { "width": 1920, "height": 1080 },
  "orientation": "landscape",
  "safeArea": { "top": 0, "right": 0, "bottom": 0, "left": 0, "unit": "percent" },
  "transparentBackground": true
}
```

`routeId`, `outputId`, `routeType` y `sourceType` son exclusivos de Program Main V1. No se aceptan rutas de locución, cronómetro, Preview, jueces, LED, redes sociales ni salidas genéricas.

## Lifecycle

El lifecycle soportado es:

```text
created
→ configured
→ mounting
→ mounted
→ applying
→ ready | empty | stale | disabled | unavailable | error
→ cleared
→ destroyed
```

- No se puede montar antes de configurar.
- No se puede aplicar una proyección antes de montar.
- `clear` retira todo el contenido visual y conserva una raíz reutilizable.
- Después de `clear` puede aplicarse otra proyección.
- `destroy` elimina la raíz y termina la instancia.
- Toda operación posterior a `destroy` rechaza con `program-main-output-destroyed`.

## Projection Contract

La entrada debe ser el sobre completo de Output Routing:

```json
{
  "routeId": "route-program-main",
  "routeType": "program_main",
  "outputId": "program-main",
  "sourceType": "program_snapshot",
  "sourceRevision": 12,
  "routeRevision": 4,
  "status": "routed",
  "visibility": "public",
  "resolution": { "width": 1920, "height": 1080 },
  "projection": {
    "programId": "program-main",
    "templateId": "template-scoreboard",
    "themeId": "theme-default",
    "appliedThemeId": "theme-default",
    "composition": {},
    "components": [],
    "layers": []
  },
  "warnings": [],
  "errors": [],
  "resolvedAt": "ISO-8601"
}
```

Un Program Snapshot directo, Preview Snapshot, Template, Theme, Component o payload arbitrario es inválido.

Por compatibilidad con Program Projection V1, si `appliedThemeId` no existe como campo superior se toma la identidad efectiva ya declarada en `composition.metadata.appliedThemeId`, `composition.appliedThemeId` o `themeId`. No se vuelve a resolver el Theme.

## Program Vacío

`controlled-empty` es un estado válido:

```json
{
  "composition": null,
  "components": [],
  "layers": []
}
```

En modo normal la página queda completamente transparente y sin texto. El estado `empty` permanece disponible en el descriptor y en atributos DOM seguros. `?debug=1` puede mostrar una etiqueta técnica local, sin controles.

## Program Activo

Un Program activo conserva:

- `programId`
- `templateId`
- `themeId`
- `appliedThemeId`
- `compositionId`
- `rootComponentId`
- componentes
- capas y orden
- geometría
- estilos y contenido sanitizados
- referencias de assets autorizadas
- revisiones
- visibilidad

La salida no cambia scores, turno, equipos, orden, Template o Theme.

## Render de Composición

Program Main Output usa la API pública de Component Renderer. Cada componente declarativo se adapta a una instancia de render conservando:

- identidad;
- tipo;
- propiedades;
- contenido resuelto;
- datos resueltos;
- estilo;
- opacidad;
- capa;
- z-index;
- posición y dimensiones.

La geometría en píxeles de Program Projection se normaliza contra el tamaño lógico de la composición para el renderer existente. Esto es una adaptación de coordenadas, no una reconstrucción del Template ni del Theme.

No se genera HTML desde strings. El contenido se asigna mediante `textContent` y propiedades DOM seguras.

## Capas y Múltiples Gráficos

Los componentes se ordenan primero por `layer.order`, después por `layer.zIndex`, orden del componente e identidad. El renderer conserva todos los componentes declarados, sin límite editorial fijo.

Una actualización crea el siguiente render de forma aislada. Solo después de validarlo sustituye al render anterior. Así, Program B elimina por completo residuos visuales de Program A.

## Turno Oficial

La salida presenta exactamente `composition.data.turn` recibido. Nunca infiere el turno desde:

- el último score;
- el último equipo calificado;
- un índice local;
- el orden visual.

Las pruebas cubren a Charros de Jalisco como último calificado y a Rancheros de Tijuana como equipo oficial en turno.

## Tres y Cuatro Equipos

Program Main Output no decide la cantidad de equipos. Las pruebas conservan tres y cuatro equipos con nombres, scores, orden y un único turno, sin truncamiento ni duplicación.

## Transparencia

La página, el host y la raíz usan fondo transparente por defecto. No existe chroma key ni una imagen de simulación. Un fondo declarado dentro de la composición sigue perteneciendo al Theme y no se elimina.

## Display Modes

Se admiten:

- `fit`: contiene la composición completa;
- `fill`: ocupa el viewport y permite recorte visual;
- `native`: conserva la resolución lógica cuando cabe;
- `responsive`: adapta el contenedor sin cambiar datos;
- `fullscreen`: ocupa el área disponible, sin solicitar fullscreen automáticamente.

No se usa el zoom global del navegador.

## Orientaciones y Resoluciones

Se admiten `landscape`, `portrait`, `ultra_wide` y `auto`, junto con resoluciones horizontales, verticales y panorámicas. La salida escala la composición recibida; no convierte diseños horizontales en verticales.

## Safe Areas

Las safe areas aceptan porcentajes o píxeles. Se aplican al área externa de presentación con propiedades DOM seguras. No mutan la geometría de la proyección original.

## Estados Visuales

- `ready`: composición activa.
- `empty`: sin contenido al aire.
- `stale`: conserva el último Program válido.
- `disabled`: ruta deshabilitada y sin composición visible.
- `unavailable`: fuente no disponible y sin contenido inventado.
- `error`: fallo controlado sin detalles privados.
- `cleared`: raíz reutilizable y vacía.
- `destroyed`: instancia terminal sin interfaz.

Los diagnósticos no se muestran en modo normal.

## Revisiones y Stale

La salida conserva `routeRevision`, `sourceRevision`, `projectionRevision` y `lastProjectionAt`.

- No incrementa revisiones de Output Routing o Program.
- Rechaza regresiones de ruta o fuente.
- Una entrada idéntica con las mismas revisiones es idempotente.
- Una entrada distinta con las mismas revisiones es conflicto.
- `projectionRevision` es local.
- `stale` conserva el último render válido.

## Visibilidad

Solo se aceptan `public` y `production`. `operational` y `restricted` se rechazan.

La sanitización pública elimina actor, tenant, organización, sesión y notas operativas. Ninguna opción puede elevar la visibilidad de datos.

## Multi-Tenant

Program Main Output no resuelve tenancy. Verifica compatibilidad del contexto recibido y rechaza cruces de tenant, torneo, competencia o sesión cuando la configuración establece esos límites. No consulta registros externos ni ofrece fallback entre organizaciones.

## Seguridad

El módulo:

- no muta entradas;
- rechaza funciones, símbolos, BigInt, ciclos, getters y setters;
- bloquea `__proto__`, `constructor` y `prototype`;
- rechaza protocolos `javascript:`, `file:`, `vbscript:` y `data:text/html`;
- elimina secretos y referencias runtime;
- limita profundidad, strings, arreglos, objetos, componentes y capas;
- convierte markup ejecutable en texto neutralizado;
- conserva `0`, `false`, `""` y `null`.

No usa `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`, `cssText` ni eventos inline.

## DOM

Cada instancia monta una sola raíz con atributos seguros:

- `data-program-main-output-id`
- `data-output-state`
- `data-route-id`
- `data-output-id`
- `data-program-id`
- `data-layer-count`

El render de Component Renderer permanece dentro de esa raíz. `clear` conserva la raíz; `destroy` la elimina. No se escribe fuera del contenedor explícito.

## Snapshot

`buildProgramMainOutputSnapshot()` produce un resumen serializable y desacoplado con identidad, presentación, revisiones, conteos y `compositionSummary` segura.

No incluye DOM, renderer, listeners, callbacks, Program completo, Preview, Data Contract, secretos ni payload íntegro.

## Aislamiento y No Mutación

- Dos instancias mantienen roots, renderers y estados separados.
- `clear`, `destroy` o error de una instancia no afectan otra.
- La proyección y el snapshot son copias desacopladas.
- La salida no modifica Output Routing, Browser Output global, Program, Preview, Broadcast State, Data Contract, Variables, Asset Manager, cronómetro, página pública ni Core deportivo.

## Production Console

Output Routing incluye un único acceso de solo navegación:

```text
Abrir Program Main Output
```

El enlace abre `./program-main-output.html` y no ejecuta Take, Cut, Auto ni cambios de Program.

## Fixtures Locales

Los fixtures se activan únicamente en modo local explícito:

```text
program-main-output.html?debug=1&fixture=empty
program-main-output.html?debug=1&fixture=active-3
program-main-output.html?debug=1&fixture=active-4
```

Sin `debug=1` no se activa ningún fixture. Los fixtures no son Program real ni una fuente productiva.

## Compatibilidad

Program Projection, Output Routing, Browser Output, Program Engine, Preview Engine, Themes, Templates, Component Renderer y gráficos V1 permanecen sin cambios funcionales. La página pública y el Core deportivo no participan en esta salida.

## Limitaciones Actuales

- No existe sincronización automática.
- No usa Firebase, WebSocket, polling, BroadcastChannel, EventSource ni Service Worker.
- No existe autenticación de salida.
- No existe URL productiva protegida.
- No existe integración con OBS, vMix, Wirecast o Streamlabs.
- No controla Program, Preview ni cronómetro.
- No ejecuta Take, Cut o Auto.
- No forma parte de la página pública.
- No existe salida final para locutores, cronómetro o jueces.
- Los assets sin URL autorizada se mantienen como fallback seguro del renderer existente.

Program Main Output V1 queda preparado para un futuro `OUTPUT-SYNCHRONIZATION-001`, sin anticipar su transporte.

# Broadcast Browser Output V1

## Propósito

Browser Output V1 es la infraestructura común que recibe una proyección ya resuelta por Output Routing, valida su envoltura y la presenta dentro de una única raíz DOM controlada. Su versión es `1.0.0`.

Esta capa no decide qué datos pertenecen a una salida. Tampoco calcula resultados, ranking, cronómetro, Program ni Preview.

## Arquitectura

```text
Program Engine
      ↓
Output Routing
      ↓
Browser Output Infrastructure
      ├── futura salida program-main
      ├── futuro announcer-monitor
      └── futuro timer-display
```

Output Routing conserva la responsabilidad de crear y sanitizar la proyección. Browser Output valida el contrato recibido, administra el lifecycle web, monta una raíz técnica y produce un snapshot resumido.

## Responsabilidad

Browser Output V1 sí administra:

- identidad y configuración de una instancia web;
- compatibilidad entre tipo, ruta, output y fuente;
- montaje seguro dentro de un contenedor explícito;
- display mode, resolución, orientación y safe area;
- aplicación y actualización explícita de projections;
- revisiones locales y rechazo de regresiones;
- estados comunes de presentación;
- limpieza reutilizable y destrucción terminal;
- snapshot resumido y sanitizado;
- aislamiento entre instancias.

Browser Output V1 no administra:

- Program Engine o Preview Engine;
- Output Routing;
- Broadcast State o Broadcast Output;
- Data Contract o Production Variables;
- cronómetro del juez;
- Firebase, sockets, polling o persistencia;
- interfaces finales de producción.

## Diferencia con Output Routing

Output Routing decide cuál proyección segura corresponde a una ruta lógica. Browser Output recibe esa proyección y la monta. Browser Output no puede cambiar la ruta, volver a consultar la fuente ni reconstruir la información.

## API pública

El módulo `js/broadcast/browserOutput.js` exporta:

- `BROWSER_OUTPUT_VERSION`
- `BROWSER_OUTPUT_STATES`
- `BROWSER_OUTPUT_TYPES`
- `BROWSER_OUTPUT_ERROR_CODES`
- `BROWSER_OUTPUT_ORIENTATIONS`
- `BROWSER_OUTPUT_DISPLAY_MODES`
- `BroadcastBrowserOutputError`
- `createBrowserOutput()`
- `configureBrowserOutput()`
- `mountBrowserOutput()`
- `updateBrowserOutput()`
- `clearBrowserOutput()`
- `destroyBrowserOutput()`
- `getBrowserOutput()`
- `getBrowserOutputStatus()`
- `getBrowserOutputWarnings()`
- `getBrowserOutputErrors()`
- `validateBrowserOutputConfig()`
- `validateBrowserOutputProjection()`
- `validateBrowserOutputSnapshot()`
- `resolveBrowserOutputRequest()`
- `applyBrowserOutputProjection()`
- `setBrowserOutputDisplayMode()`
- `setBrowserOutputViewport()`
- `buildBrowserOutputSnapshot()`
- `cloneBrowserOutputResult()`
- `initializeBrowserOutputLab()`

La última función solo inicializa `browser-output.html`. No registra una salida productiva.

## Tipos

V1 admite exactamente:

| Tipo | Uso |
| --- | --- |
| `generic` | Laboratorio técnico y pruebas de infraestructura |
| `program_main` | Reservado para la futura salida final de Program |
| `announcer_monitor` | Reservado para el futuro monitor final de locución |
| `timer_display` | Reservado para la futura pantalla final del cronómetro |

No existen tipos `judge`, `public_results`, `led`, `vertical`, `social`, `multiview`, `obs`, `vmix` o `wirecast`.

## Lifecycle

Los estados implementados son:

- `uninitialized`
- `created`
- `configured`
- `mounting`
- `mounted`
- `updating`
- `ready`
- `empty`
- `stale`
- `unavailable`
- `disabled`
- `error`
- `cleared`
- `destroyed`

Flujo normal:

```text
created
  ↓
configured
  ↓
mounting
  ↓
mounted
  ↓
ready | empty | stale | unavailable | disabled
  ↓
updating
  ↓
ready | empty | stale | unavailable | disabled
  ↓
cleared
  ↓
destroyed
```

`clearBrowserOutput()` elimina la proyección y conserva configuración y raíz. Una aplicación posterior puede reutilizar la instancia. `destroyBrowserOutput()` elimina la raíz y referencias privadas; después de destruir, todas las operaciones fallan con `browser-output-destroyed`.

## Browser Output Definition

Cada instancia pública conserva:

| Campo | Tipo | Propósito |
| --- | --- | --- |
| `browserOutputVersion` | string | Versión de la infraestructura |
| `browserOutputId` | string | Identidad estable de la instancia |
| `outputType` | string | Tipo genérico o reservado |
| `routeId` | string/null | Ruta lógica esperada |
| `outputId` | string/null | Identificador de output esperado |
| `name` | string | Nombre técnico |
| `status` | string | Estado del lifecycle |
| `displayMode` | string | Estrategia de presentación |
| `visibility` | string | Visibilidad efectiva |
| `resolution` | object | Resolución lógica |
| `orientation` | string | Orientación declarada |
| `safeArea` | object | Área segura declarativa |
| `transparentBackground` | boolean | Fondo transparente o sólido |
| `fullscreenAllowed` | boolean | Permiso técnico para fullscreen manual |
| `scaleMode` | string | `contain` o `cover` derivado del display mode |
| `viewport` | object/null | Viewport técnico explícito |
| `projectionRevision` | integer | Número local de aplicaciones |
| `routeRevision` | integer/null | Revisión recibida, nunca recalculada |
| `sourceRevision` | integer/null | Revisión fuente recibida, nunca recalculada |
| `mounted` | boolean | Presencia de raíz controlada |
| `rootId` | string | ID técnico de la raíz |
| timestamps | ISO-8601/null | Creación, montaje, actualización, limpieza y destrucción |
| `warnings` | string[] | Diagnósticos controlados |
| `errors` | string[] | Errores controlados |
| `metadata` | object | Metadata segura de configuración |

DOM, renderer, listeners, sources y projections completas permanecen fuera del descriptor público.

## Configuración

Ejemplo:

```json
{
  "browserOutputId": "browser-output-lab",
  "outputType": "generic",
  "routeId": "route-program-main",
  "outputId": "program-main",
  "displayMode": "fit",
  "visibility": "production",
  "resolution": { "width": 1920, "height": 1080 },
  "orientation": "landscape",
  "safeArea": {
    "top": 5,
    "right": 5,
    "bottom": 5,
    "left": 5,
    "unit": "percent"
  },
  "transparentBackground": false,
  "fullscreenAllowed": true
}
```

La validación rechaza IDs inválidos, tipos desconocidos, combinaciones incompatibles, visibilidad no autorizada, valores no finitos, resoluciones excesivas y safe areas que eliminan el viewport.

## Projection Contract

Browser Output acepta exclusivamente una envoltura de ruta validada:

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
  "projection": {},
  "warnings": [],
  "errors": [],
  "resolvedAt": "2026-07-15T20:00:00.000Z"
}
```

Program Snapshot, Preview Snapshot, Contract o Timer directos son inválidos porque no incluyen la envoltura de ruta.

## Compatibilidad de tipos

| `routeType` | `outputId` | `sourceType` |
| --- | --- | --- |
| `program_main` | `program-main` | `program_snapshot` |
| `announcer_monitor` | `announcer-monitor` | `announcer_projection` |
| `timer_display` | `timer-display` | `timer_projection` |

El tipo `generic` puede recibir cualquiera de las tres combinaciones en laboratorio. No interpreta ni renderiza una interfaz final.

## Estados visuales

La raíz común muestra mensajes controlados:

| Estado | Mensaje |
| --- | --- |
| mounting/mounted | `Cargando salida…` |
| empty/cleared | `Sin contenido al aire` |
| stale | `Datos pendientes de actualización` |
| unavailable | `Salida no disponible` |
| disabled | `Salida deshabilitada` |
| error | Mensaje seguro y código controlado |

`stale` conserva el último resumen válido. No inventa contenido ni revisiones.

## Montaje DOM

Cada instancia crea exactamente una raíz dentro del contenedor explícito recibido por `mountBrowserOutput()`. Un montaje repetido sobre el mismo contenedor es idempotente. Intentar mover la raíz a otro contenedor genera `browser-output-root-conflict`.

La implementación usa `createElement`, `textContent`, `setAttribute`, `append` y `replaceChildren`. No usa HTML dinámico, eventos inline, `cssText`, `eval`, `document.write` ni código remoto.

La raíz declara únicamente identificadores técnicos seguros:

- `data-browser-output-id`
- `data-output-type`
- `data-output-state`
- `data-route-id`
- `data-output-id`

## Actualización explícita

No hay actualización automática. `applyBrowserOutputProjection()` y `updateBrowserOutput()` son las únicas entradas de projection.

Cada aplicación valida, clona y sanitiza antes de tocar el estado. Una entrada inválida o incompatible es atómica: conserva descriptor, revisión, raíz y resumen anteriores.

## Revisiones

Browser Output conserva tres revisiones distintas:

- `routeRevision`: recibida de Output Routing;
- `sourceRevision`: recibida de la fuente oficial;
- `projectionRevision`: contador local de aplicaciones y limpieza.

Una revisión inferior produce `browser-output-revision-regression`. La misma pareja de revisiones con la misma intención es idempotente. Cambiar contenido sin cambiar revisiones produce `browser-output-revision-conflict`.

Browser Output nunca incrementa `routeRevision` o `sourceRevision`.

## Visibilidad

Orden de visibilidad:

```text
public < production < operational < restricted
```

Se utiliza la combinación más restrictiva entre configuración, projection y solicitud. Una configuración no puede mostrar una projection más privada que su autorización.

- `program_main`: `public` o `production`;
- `announcer_monitor`: `operational` o `restricted`;
- `timer_display`: `public`, `production` u `operational`.

Un snapshot público elimina identidad tenant y contexto interno. Las notas operativas no se copian; el resumen solo conserva conteos.

## Transparencia

`transparentBackground` afecta exclusivamente el fondo de la raíz. No cambia Template, Theme, componentes ni projection.

## Display Modes

- `fit`: conserva proporción y muestra el canvas completo;
- `fill`: llena el área y puede recortar visualmente;
- `native`: conserva la resolución lógica mientras el viewport lo permita;
- `responsive`: adapta el contenedor sin cambiar datos;
- `fullscreen`: prepara el modo de presentación, pero nunca activa Fullscreen API automáticamente.

No se modifica el zoom global del navegador.

## Orientaciones

- `landscape`
- `portrait`
- `ultra_wide`
- `auto`

La orientación es declarativa y no impone un aspect ratio fijo. El laboratorio incluye referencias `1920×1080`, `1280×720`, `1080×1920` y `3840×720`.

## Safe Areas

Las unidades permitidas son `percent` y `pixel`. Los valores no pueden ser negativos ni eliminar completamente el viewport. La aplicación usa propiedades DOM individuales, nunca `cssText`.

## Fullscreen

El módulo únicamente valida si fullscreen está permitido y cambia el modo de presentación. La página de laboratorio solicita Fullscreen API dentro del click explícito del usuario. No se activa al montar, configurar o aplicar una projection.

Si la API no existe, el laboratorio muestra `browser-output-fullscreen-api-unavailable`. Escape y salida de fullscreen dependen del comportamiento nativo del navegador y no destruyen la instancia.

## Seguridad

La clonación y sanitización:

- usa descriptores y no ejecuta getters o setters;
- elimina o rechaza funciones, símbolos y BigInt;
- controla ciclos, profundidad, objetos, arreglos y longitud de texto;
- bloquea `__proto__`, `constructor` y `prototype`;
- bloquea runtime, DOM, listeners, plugins, hooks y handlers;
- elimina tokens, contraseñas, secretos, credenciales y URLs firmadas;
- bloquea `javascript:`, `file:`, `data:text/html` y `vbscript:`;
- conserva `0`, `false`, `""` y `null`;
- convierte markup no autorizado en texto seguro.

No se muestran stacks, rutas locales o excepciones internas.

## Multi-tenant

Browser Output no resuelve permisos externos. Compara las referencias ya incluidas en configuración y projection:

- `tenantId`
- `organizationId`
- `clientId`
- `tournamentId`
- `competitionId`
- `sessionId`

Una diferencia genera `browser-output-context-conflict`. No existe fallback cruzado. Los snapshots públicos eliminan las referencias privadas.

## Snapshot

`buildBrowserOutputSnapshot()` incluye:

- versiones;
- identidad de la instancia;
- tipo, ruta y output;
- estado y display mode;
- visibilidad;
- resolución, orientación y safe area;
- transparencia y montaje;
- revisiones;
- warnings y errors;
- fecha de generación;
- `projectionSummary` segura.

El snapshot nunca contiene DOM, renderer, listeners, callbacks, sockets, Firebase, caches, Program completo, Contract completo, Timer completo, actor público, tenant público, secretos o URLs inseguras.

La proyección resumida incluye solo identidad técnica y métricas necesarias para diagnóstico. Modificar el snapshot no modifica la instancia ni la raíz.

## Aislamiento y no mutación

Cada instancia tiene un runtime privado en `WeakMap`. Las roots, projections, resúmenes y snapshots se clonan por instancia.

- limpiar una instancia no limpia otra;
- destruir una instancia no destruye otra;
- un error no cambia el lifecycle de otra;
- fullscreen no cambia otra instancia;
- una projection no comparte referencias mutables;
- ninguna operación modifica Output Routing, Program, Preview, cronómetro o fixture de entrada.

## Production Console

La sección Output Routing incluye únicamente el enlace interno `Abrir laboratorio Browser Output`, dirigido a:

```text
browser-output.html?type=generic
```

Es una ruta local de laboratorio. No es una URL productiva ni una Browser Source.

## Laboratorio

`browser-output.html` permite probar:

- Program Main vacío y activo;
- Announcer Monitor operacional;
- Timer Display ready, running, paused, stopped, finished y stale;
- unavailable y disabled;
- display modes;
- resoluciones y orientaciones;
- transparencia;
- configuración, montaje, aplicación, actualización, clear y destroy;
- fullscreen manual;
- snapshot, warnings y errors.

El laboratorio usa fixtures locales. No consulta fuentes reales y no sincroniza automáticamente.

## Compatibilidad

Browser Output V1 opera en paralelo. No modifica:

- Output Routing;
- Program Engine;
- Preview Engine;
- Theme/Template Integration;
- Component Library o Renderer;
- Production Variables o Action Engine;
- Broadcast Output o Broadcast State;
- Asset Manager;
- cronómetro del juez;
- calificador, resultados o página pública;
- gráficos V1 u OBS V1;
- Firebase.

## Limitaciones actuales

- No es una Browser Source oficial.
- No existe todavía URL productiva.
- No conecta OBS, vMix o Wirecast.
- No usa Firebase.
- No usa sockets, polling o persistencia.
- No sincroniza automáticamente.
- No renderiza Program Main final.
- No implementa Announcer Monitor final.
- No implementa Timer Display final.
- No controla el cronómetro.
- No modifica Program ni Preview.
- La página pública no forma parte de Browser Output.

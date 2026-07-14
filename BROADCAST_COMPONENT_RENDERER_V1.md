# Broadcast Component Renderer v1

## Proposito

Component Renderer v1 convierte instancias validas de Component Library en nodos visuales seguros y aislados. Su version es `1.0.0` y opera completamente en memoria. No es Template Engine, no es Program Output, no controla OBS y no persiste informacion.

## Arquitectura

El flujo permitido es:

```text
Component Library
  -> Component Instance valida
  -> contenido, bindings y assets ya resueltos
  -> Component Renderer
  -> DOM propiedad del renderer dentro de un target autorizado
```

El renderer no consulta Firebase, Core, rutas deportivas, Broadcast State, Preview, Program, Outputs, Production Variables ni Asset Manager. Las URLs llegan resueltas y autorizadas; los valores deportivos llegan calculados.

Component Library v1 usa los campos canonicos `instanceVersion`, `componentType`, `style`, `layout` y `properties`. El renderer valida ese contrato existente. Los valores resueltos se entregan mediante `resolvedContent`, `resolvedBindings` y `resolvedAssets` para no modificar ni duplicar Component Library.

## API publica

- `COMPONENT_RENDERER_VERSION`
- `RENDERABLE_COMPONENT_TYPES`
- `COMPONENT_RENDERER_STATES`
- `COMPONENT_RENDERER_ERROR_CODES`
- `BroadcastComponentRendererError`
- `createComponentRenderer()` y `destroyComponentRenderer()`
- `validateComponentRenderTarget()`
- `createComponentRenderNode()`
- `renderBroadcastComponent()` y `updateBroadcastComponentRender()`
- `removeBroadcastComponentRender()` y `clearBroadcastComponentRenderer()`
- `getRenderedComponent()` y `listRenderedComponents()`
- `getComponentRenderWarnings()`
- `cloneComponentRenderResult()`
- `buildComponentRenderSnapshot()` y `validateComponentRenderSnapshot()`

## Lifecycle y estado

Los estados son `uninitialized`, `ready`, `rendering`, `rendered`, `updating`, `cleared`, `destroyed` y `error`. `createComponentRenderer()` crea una raiz interna dentro del target. `clear` elimina solo nodos registrados por el renderer y conserva target y raiz. `destroy` limpia, retira la raiz interna, libera referencias y bloquea operaciones futuras.

Una actualizacion conserva `renderId`. Si el tipo no cambia reutiliza el nodo; si cambia, reemplaza exactamente ese nodo. La eliminacion es idempotente.

## Target y render result

El target debe ser un elemento HTML valido, conectado o autorizado explicitamente para pruebas, con documento accesible del mismo origen. Se rechazan `document`, `window`, strings, objetos falsos, SVG root, `iframe`, `object`, `embed`, `script` y targets de otro origen.

El resultado runtime incluye identidad del render, renderer, instancia, componente, tipo, output, estado, timestamps, warnings, errors y opcionalmente el nodo DOM. `cloneComponentRenderResult()` omite el nodo salvo solicitud explicita.

## Tipos renderizables

V1 soporta `container`, `text`, `image`, `logo`, `icon`, `rectangle`, `line`, `circle`, `badge`, `timer`, `score`, `ranking`, `table`, `list`, `qr`, `sponsor`, `progress` y `ticker`. `custom` se rechaza con error controlado.

- Textos usan `textContent` y respetan multilinea, ellipsis, maxLines y transformacion tipografica.
- Imagen, logo y sponsor usan assets resueltos autorizados.
- Iconos salen de un catalogo cerrado; no aceptan SVG ni paths libres.
- Figuras usan elementos HTML, sin Canvas ni SVG dinamico.
- Containers limitan profundidad y cantidad de hijos.
- Timer solo presenta el valor recibido; no controla ni calcula tiempo.
- Score solo presenta el valor oficial recibido; no suma ni recalcula.
- Ranking conserva el orden recibido y solo aplica el limite declarado.
- Table y list construyen celdas e items con `textContent`.
- QR es un placeholder tecnico; no genera un codigo real.
- Progress clampa solo la representacion visual sin mutar la fuente.
- Ticker es estatico, sin intervalos ni animacion continua.

## Geometria y responsive

La geometria se aplica respecto de la raiz del renderer con `absolute`, nunca con `fixed`. Soporta `x`, `y`, `width`, `height`, `rotation`, `anchor`, `scale`, `zIndex` y safe area. Cero es valido, scale se limita a valores positivos y todos los numeros deben ser finitos. La resolucion y orientacion forman parte del contexto, con fixtures 1920 x 1080, 1080 x 1920 y 3840 x 720.

El renderer crea un canvas virtual con las dimensiones reales del output y lo escala dentro del target. Un `ResizeObserver` local, desconectado al destruir el renderer, mantiene esa escala sin listeners globales. El laboratorio reduce visualmente el output sin cambiar sus datos ni deformar su relacion de aspecto.

## Estilos seguros

La allowlist cubre tipografia, tamanos, peso, cursiva, subrayado, espaciado, line-height, colores hexadecimales, fondo, borde, radio, opacidad, alineacion, padding, margin, sombra y overflow. Las propiedades se asignan individualmente.

No se aceptan `cssText`, strings de estilo, selectores, custom properties, `@import`, `url()`, `expression()`, `behavior`, filtros arbitrarios, eventos inline, animacion CSS arbitraria ni posicion global fija.

## Visibilidad y fallbacks

La visibilidad respeta la precedencia `public < production < operational < restricted`; nunca se eleva. Una instancia bloqueada o deshabilitada no genera contenido visual y registra warning.

Los fallbacks permitidos son `text`, `placeholder`, `asset`, `hide`, `empty` y `error_badge`. El asset alterno pasa por la misma validacion de URL. Todo fallback usado queda registrado como warning y nunca inventa score, timer o ranking.

## Seguridad DOM

Los datos dinamicos usan `textContent`. Los atributos pasan por una allowlist y las clases nacen de catalogos internos. No existen `innerHTML`, `insertAdjacentHTML`, `eval`, `new Function`, scripts, iframes, objects, embeds, eventos inline, sockets, polling ni listeners globales.

Las URLs requieren un asset resuelto con `authorized: true`. Se aceptan HTTP/HTTPS del mismo origen. Externas requieren autorizacion doble explicita. Blob requiere `allowBlobAssets` y `blobAuthorized`. Se bloquean `javascript:`, `file:`, `data:`, `vbscript:` y protocol-relative externo.

Las copias serializables eliminan funciones, simbolos, BigInt, referencias DOM, ciclos y claves `__proto__`, `constructor` y `prototype`; tambien limitan profundidad, arreglos, objetos y textos.

## Snapshots

`buildComponentRenderSnapshot()` contiene version, renderer, output, resolucion, orientacion, safe area, visibilidad, estado, IDs, resumen de componentes, warnings, errors y timestamp. No incluye DOM, listeners, window, document, actores, URLs ni datos fuente. La visibilidad del snapshot filtra componentes de mayor nivel.

## Production Console

La pestaña Componentes contiene el Laboratorio de Componentes V2 con selector de fixture, selector de output, Renderizar, Actualizar y Limpiar. Muestra safe area, resolucion, tipo, estado, warnings, errors y snapshot JSON sanitizado.

El laboratorio usa fixtures construidos por Component Library. Su runtime se conserva fuera del modelo serializable de consola. No prepara Preview, no hace Take, no cambia Program, no actualiza Outputs y no manda componentes al aire.

## Compatibilidad y limitaciones

Component Renderer v1 funciona en paralelo con Component Library y el stack Broadcast existente. No modifica Data Contract, State, Output, Asset Manager, Variables, Action Engine, Playground, OBS V1, graficos V1, Core deportivo ni pagina publica.

Limitaciones actuales:

- no existe Template Engine ni Theme Engine;
- no existe Layout Engine avanzado;
- no hay Animation Engine completo;
- no hay escenas, macros ni editor libre;
- no hay persistencia ni Firebase;
- no hay output OBS o Program independiente;
- ticker no se anima;
- timer no corre;
- score no se calcula;
- QR permanece como placeholder.

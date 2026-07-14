# Broadcast Component Library v1

## Proposito

Broadcast Component Library define los bloques visuales declarativos que podran utilizar las plantillas de Broadcast Studio V2. La version `1.0.0` modela, valida, registra, clona y resuelve componentes, pero no los dibuja ni los envia a Preview o Program.

El modulo es puro y opera exclusivamente en memoria. No consulta Firebase, Core Deportivo, Broadcast State, outputs, DOM, Canvas, SVG, OBS ni rutas legacy.

## Version

- Libreria: `1.0.0`
- Aplicacion: `20260713-component-library-001-components-v1`

## API publica

- `BroadcastComponentError`
- `COMPONENT_LIBRARY_VERSION`
- `COMPONENT_TYPES`
- `COMPONENT_STATES`
- `COMPONENT_VISIBILITY`
- `createBroadcastComponent()`
- `cloneBroadcastComponent()`
- `normalizeBroadcastComponent()`
- `validateBroadcastComponent()`
- `registerBroadcastComponent()`
- `updateBroadcastComponent()`
- `removeBroadcastComponent()`
- `listBroadcastComponents()`
- `findBroadcastComponent()`
- `buildComponentInstance()`
- `validateComponentInstance()`
- `cloneComponentInstance()`
- `resolveComponentBindings()`
- `buildComponentSnapshot()`
- `validateComponentSnapshot()`
- `sanitizeComponentSnapshot()`
- `getComponentWarnings()`

## Tipos

La libreria reconoce: `container`, `text`, `image`, `logo`, `icon`, `rectangle`, `line`, `circle`, `badge`, `timer`, `score`, `ranking`, `table`, `list`, `qr`, `sponsor`, `progress`, `ticker` y `custom`.

Los tipos son modelos declarativos. `timer` no ejecuta cronometros, `score` no calcula puntos, `ranking` no ordena resultados y `ticker` no reproduce animaciones.

## Estados y visibilidad

Estados: `draft`, `active`, `disabled`, `deprecated`, `error`.

Visibilidad, de menor a mayor: `public`, `production`, `operational`, `restricted`. Un snapshot no eleva la visibilidad del componente; si el consumidor tiene menor visibilidad, el componente se bloquea.

## Estructura del componente

```json
{
  "libraryVersion": "1.0.0",
  "componentId": "component_score_main",
  "name": "Marcador principal",
  "description": null,
  "componentType": "score",
  "componentVersion": "1.0.0",
  "componentRevision": 0,
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "createdBy": null,
  "updatedBy": null,
  "visibility": "production",
  "status": "draft",
  "bindings": [],
  "style": {},
  "layout": {},
  "animation": {},
  "properties": {},
  "metadata": {},
  "warnings": [],
  "errors": []
}
```

`componentId`, `componentType`, `componentVersion`, `createdAt`, `createdBy` y `libraryVersion` no pueden modificarse mediante patch. Las actualizaciones permitidas incrementan `componentRevision` y exigen revision esperada.

## Style

El modelo soporta `fontFamily`, `fontSize`, `fontWeight`, `italic`, `underline`, `letterSpacing`, `lineHeight`, `color`, `backgroundColor`, `borderColor`, `borderWidth`, `borderRadius`, `opacity`, `shadow`, `textAlign`, `verticalAlign`, `padding` y `margin`.

Los colores aceptan formato hexadecimal. Opacidad se limita de `0` a `1`; dimensiones de borde, tipografia y cajas no admiten valores negativos.

## Layout

El modelo soporta `x`, `y`, `width`, `height`, `rotation`, `anchor`, `scale`, `zIndex`, `safeArea` y `responsive`. Escala debe ser mayor que cero. Layout describe geometria; no posiciona ningun elemento real.

## Animation

Incluye `type`, `duration`, `delay`, `easing`, `repeat`, `direction` y `trigger`. Es solo configuracion: la libreria no reproduce animaciones.

## Bindings

Un binding solo puede usar:

- `production_variables`, mediante una clave `production.*`;
- `broadcast_contract`, mediante una ruta segura;
- `asset_manager`, mediante `assetId`, `version` y `variantId`.

No se aceptan Core, Firebase, State, scores, `live/current` ni URLs. La resolucion conserva `0`, `false`, cadena vacia y `null`, y usa fallback solo cuando la fuente no contiene el dato.

## Propiedades por tipo

- `text`: `text`, `multiline`, `ellipsis`, `maxLines`, `textTransform` (`none`, `uppercase`, `lowercase`, `capitalize`).
- `image`, `logo`, `icon`, `qr`, `sponsor`: solo `assetRef`; nunca URL directa.
- `timer`: `value`, `display`, `format`.
- `score`: `label`, `value`.
- `table`: `columns`, `rows`, `alignments`.
- `list`: `items`, `spacing`, `bullet`.
- `ranking`: `entries` sin reordenamiento.
- `progress`: `value` entre `0` y `100`, `direction` horizontal o vertical.
- `ticker`: `items`, `separator`.
- Tipos restantes: propiedades declarativas sanitizadas.

## Registro e inmutabilidad

El registro usa `libraryVersion`, `revision`, `components`, `createdAt` y `updatedAt`. Registro, actualizacion y eliminacion devuelven una copia nueva. No se comparten referencias mutables con entradas, componentes, instancias o snapshots.

La eliminacion normal requiere componente `draft`, `disabled` o `deprecated` y revision esperada. Los componentes activos no se eliminan sin opcion explicita.

## Instancias

`buildComponentInstance()` crea una instancia separada con identidad, revision y overrides propios. Modificar style, layout, animation, properties, bindings o metadata de una instancia nunca modifica su componente base.

## Snapshot

`buildComponentSnapshot()` produce:

```json
{
  "version": "1.0.0",
  "generatedAt": "ISO-8601",
  "visibility": "production",
  "component": {},
  "resolvedBindings": {},
  "warnings": [],
  "errors": []
}
```

El snapshot es serializable, desacoplado y filtrado por visibilidad. No es una plantilla ni un descriptor de renderizado.

## Seguridad y limites

La clonacion segura:

- elimina funciones, simbolos, BigInt, ciclos y accessors;
- bloquea `__proto__`, `constructor` y `prototype`;
- rechaza `javascript:`, `data:` y `file://`;
- rechaza markup ejecutable como `script`, `iframe`, `object`, `embed` y handlers `on*`;
- limita profundidad a 12 niveles;
- limita arreglos a 200 elementos;
- limita objetos a 500 claves;
- limita bindings a 50;
- limita strings a 10,000 caracteres;
- conserva `0`, `false`, `""` y `null`.

## Production Console

La pestaña `Componentes` permite crear un componente de prueba, seleccionarlo, duplicarlo, eliminarlo e inspeccionar su snapshot JSON. El registro vive solo durante la sesion en memoria y una recarga inicia una biblioteca vacia.

Estas acciones no usan Action Engine y no modifican Broadcast State, Preview, Program, outputs ni persistencia. El panel tampoco renderiza el componente: solo muestra datos e inspector JSON.

## Limitaciones de v1

- No Template Engine.
- No Renderer HTML, Canvas o SVG.
- No escenas ni composiciones.
- No persistencia, Firebase o Storage.
- No outputs, Program, OBS o graficos V2 completos.
- No migracion automatica de graficos V1.
- No editor visual.

La siguiente capa debera consumir esta API sin agregar lecturas directas al Core ni compartir referencias mutables.

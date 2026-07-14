# Broadcast Template Engine V1

## Propósito

Broadcast Template Engine V1 define plantillas reutilizables como agrupaciones declarativas de Component Instances. El motor prepara instancias, bindings y snapshots serializables para un consumidor futuro. No renderiza, no crea Program Output y no modifica Preview, Program, Outputs ni Broadcast State.

Versión del contrato: `1.0.0`.

## Flujo

```text
Broadcast Data Contract
Production Variables
Asset Manager
        ↓
Component Library
        ↓
Template Engine
        ↓
Component Renderer (integración futura explícita)
        ↓
Program Output (ticket futuro)
```

Template Engine consume Component Instances y la API pública `resolveComponentBindings()` de Component Library. No consulta Firebase, HTML, rutas internas ni almacenamiento persistente.

## API pública

- `TEMPLATE_ENGINE_VERSION`
- `BroadcastTemplateError`
- `TemplateTypes`
- `TemplateStates`
- `TemplateVisibility`
- `createBroadcastTemplate()`
- `cloneBroadcastTemplate()`
- `updateBroadcastTemplate()`
- `validateBroadcastTemplate()`
- `registerBroadcastTemplate()`
- `removeBroadcastTemplate()`
- `duplicateBroadcastTemplate()`
- `instantiateBroadcastTemplate()`
- `buildTemplateSnapshot()`
- `validateTemplateSnapshot()`
- `resolveTemplateBindings()`
- `listRegisteredTemplates()`
- `getRegisteredTemplate()`
- `clearTemplateRegistry()`
- `cloneTemplateResult()`

## Tipos

`lower_third`, `scoreboard`, `ranking`, `timer`, `full_screen`, `sponsor`, `qr`, `interview`, `roster`, `standings`, `ticker`, `bug` y `custom`.

`custom` es exclusivamente estructural. Requiere al menos una Component Instance declarativa válida y se instancia con el warning `template-custom-structure-only`; no renderiza ni ejecuta código. Un `custom` vacío se rechaza con `custom-template-empty`. Metadata con plugins, hooks, scripts, handlers, renderer, HTML, JavaScript o claves ejecutables equivalentes se rechaza con `custom-template-executable-metadata-forbidden`.

## Estados y visibilidad

Estados canónicos: `draft`, `valid`, `published`, `deprecated`, `disabled` y `error`. `active` y `archived` se conservan como compatibilidad V1.

Visibilidad: `public < production < operational < restricted`.

Un template no puede declarar una visibilidad menor que la de uno de sus Component Instances. Los snapshots filtran componentes que exceden la visibilidad solicitada.

## Estructura canónica

```js
{
  engineVersion: "1.0.0",
  templateId: "template_scoreboard_main",
  templateVersion: "1.0.0",
  templateType: "scoreboard",
  name: "Marcador principal",
  description: null,
  visibility: "production",
  status: "valid",
  state: "valid", // alias de compatibilidad
  tenantId: "tenant_orgullo_charro",
  organizationId: "organization_oc",
  tournamentId: "tournament_2026",
  competitionId: "competition_equipos",
  sourceTemplateId: null,
  createdBy: { id: "operator_1", name: "Operador", role: "producer" },
  updatedBy: { id: "operator_1", name: "Operador", role: "producer" },
  revision: 0,
  components: [],
  layout: {},
  bindings: [],
  defaults: {},
  outputs: ["preview", "program"],
  metadata: {},
  warnings: [],
  errors: [],
  createdAt: "ISO-8601",
  updatedAt: "ISO-8601"
}
```

`components` contiene exclusivamente Component Instances válidas. Una Component Definition sin `instanceId` se rechaza. No se clona el registro de Component Library.

`templateId`, `templateVersion`, `tenantId`, `organizationId`, `tournamentId`, `competitionId`, `createdAt`, `createdBy` y `sourceTemplateId` son inmutables mediante patch. `updatedBy` solo se modifica mediante `updateBroadcastTemplate()` con un actor controlado. Un conflicto de revisión rechaza la operación completa sin cambiar template, registro, revisión ni timestamps.

## Layout declarativo

`layout.mode` admite `absolute`, `stack`, `row`, `column`, `grid`, `overlay` y `safe_area`.

El bloque conserva:

- `safeArea`
- `anchor`
- `zIndex`
- `gap`
- `padding`
- `margin`
- `align`
- `justify`
- `clip`
- `columns`
- `rows`
- `x`
- `y`
- `width`
- `height`

V1 almacena y valida el layout. No contiene Layout Engine ni calcula posiciones de render.

`NaN`, `Infinity` y `-Infinity` se rechazan con `template-layout-non-finite` en `zIndex`, `gap`, `rows`, `columns`, `x`, `y`, `width`, `height` y los lados de `safeArea`, `padding` y `margin`. El valor `0` permanece válido.

## Bindings

Las fuentes permitidas son:

- `production_variables`
- `broadcast_contract`
- `asset_manager`

Cada binding contiene identidad, target, fuente, key/path o assetRef, fallback, obligatoriedad y visibilidad. No se aceptan funciones, expresiones dinámicas, JavaScript, HTML, URLs ni consultas directas.

La resolución delega en `resolveComponentBindings()` y devuelve:

```js
{
  resolvedBindings: {},
  componentBindings: {
    instanceId: { values: {}, warnings: [], errors: [] }
  },
  warnings: [],
  errors: []
}
```

Los fallbacks son explícitos y conservan `0`, `false`, `""` y `null`.

La resolución valida el tenant efectivo del template, del contexto, de Production Variables, Data Contract, Asset Manager, assets referenciados y fallbacks. Un template de tenant no puede consumir componentes o fuentes de otro tenant. Un template global solo admite componentes globales o tenants autorizados de forma explícita. Si una plantilla global se instancia dentro de un único contexto tenant coherente, ese tenant se usa únicamente como contexto efectivo de resolución.

## Registro en memoria

El registro es un objeto funcional serializable:

```js
{
  engineVersion: "1.0.0",
  revision: 0,
  templates: {},
  createdAt: "ISO-8601",
  updatedAt: "ISO-8601"
}
```

Cada operación devuelve un registro nuevo. No existe singleton, listener, Firebase, localStorage ni sessionStorage. `expectedRevision` protege cambios de template; `expectedRegistryRevision` protege reemplazos del registro. Un conflicto rechaza la operación completa.

La duplicación exige actor, genera `templateId` nuevo, conserva tenant y contexto, crea `sourceTemplateId`, reinicia `status` a `draft` y `revision` a `0`, asigna `createdBy` al actor actual y deja `updatedBy` en `null`. Componentes, bindings, layout y metadata quedan desacoplados; secretos y metadata ejecutable no se copian.

## Instanciación

`instantiateBroadcastTemplate()` valida el template, resuelve bindings y devuelve:

- `templateInstance`
- lista clonada de `components`
- `resolvedBindings`
- `componentBindings`
- `warnings`
- `errors`
- `snapshot`

La instancia incluye identidad, versión/revisión del template, tipo, visibilidad, layout, defaults, outputs, IDs de componentes y fecha. No contiene nodos DOM, renderer, Preview, Program u Outputs mutables.

Antes de instanciar se vuelve a validar el template, sus Component Instances, el tenant del contexto y los tenants de bindings/fallbacks. Un template publicado pero inválido, un `custom` vacío o un cruce tenant se rechazan antes de producir una instancia.

## Snapshot

`buildTemplateSnapshot()` produce un documento serializable y desacoplado con:

- versión y fecha;
- visibilidad;
- resumen del template;
- Template Instance;
- Component Instances visibles;
- bindings resueltos;
- warnings y errors sanitizados.

El snapshot no contiene funciones, símbolos, BigInt, ciclos, referencias DOM, listeners ni claves peligrosas. Modificarlo no modifica el template, registro o resultado original.

La sanitización recursiva se aplica al resumen del template, Template Instance, Component Instances, bindings, layout, metadata, warnings y errors. Conserva `0`, `false`, `""` y `null`.

| Visibilidad | Identidad operativa | Contexto tenant | Secretos y URLs firmadas | Metadata visual segura |
| --- | --- | --- | --- | --- |
| `public` | Eliminada | Eliminado; también organización interna, cliente y sesión | Eliminados | Permitida si no es sensible ni ejecutable |
| `production` | Eliminada | Tenant, cliente y sesión eliminados | Eliminados | Permitida |
| `operational` | Permitida | Permitido según contexto autorizado | Eliminados | Permitida |
| `restricted` | Permitida | Permitido según contexto autorizado | Eliminados siempre | Permitida |

En `public`, las Component Instances tampoco exponen `createdBy`, `updatedBy`, `tenantId`, permisos internos, actores, sesión, diagnósticos, `storageRef`, `apiKey`, tokens, secretos, credenciales, plugins, hooks o handlers. Los nombres derivados, como `accessToken` o `secretKey`, también se eliminan.

## Versionado

`templateVersion` representa la versión declarativa del template. `revision` aumenta una vez en cada actualización válida. `createdAt` permanece estable y `updatedAt` cambia en la actualización. V1 no sobrescribe silenciosamente `templateVersion` mediante patch.

Cuando `status === "published"`, la definición es inmutable: no pueden cambiar componentes, bindings, layout, defaults, outputs, metadata, versión, tipo, tenant ni identidad. `updateBroadcastTemplate()` rechaza esos intentos con `template-published-immutable`, sin cambiar revisión ni fecha. La única transición controlada admitida en V1 es `published → deprecated`; una edición de contenido requerirá una versión futura nueva.

## Seguridad

El motor:

- no muta inputs;
- elimina o rechaza funciones, símbolos y BigInt;
- controla ciclos, profundidad, arreglos, objetos y texto;
- bloquea `__proto__`, `constructor` y `prototype`;
- rechaza marcado ejecutable y handlers inline;
- rechaza protocolos `javascript:`, `file:`, `data:` y `vbscript:`;
- valida IDs, paths, versiones, fechas, outputs y assetRefs;
- usa allowlist para updates;
- conserva valores falsy válidos.

La sanitización de snapshots nunca conserva passwords, tokens, credenciales, secretos, claves API, URLs firmadas ni metadata ejecutable, incluso con visibilidad `restricted`.

## Production Console

La pestaña `Templates` permite seleccionar un fixture, crear, duplicar, eliminar, instanciar y construir snapshot. El JSON visible y el botón `Copiar JSON` usan exclusivamente `getProductionConsoleTemplateClipboardSnapshot()` con la visibilidad actual; no copian el inspector completo ni referencias internas.

`initializeProductionConsole()` es idempotente por documento/root mediante una instancia registrada en `WeakMap`. Una segunda inicialización devuelve la misma API y no agrega listeners. Cada instancia usa `AbortController`; `dispose()` aborta solo sus handlers, libera outputs y renderer propios, elimina su referencia y permite reinicializar limpiamente.

## Fixtures

`fixtures/templateEngineFixtures.js` incluye:

- Lower Third
- Marcador
- Ranking
- Cronómetro
- Sponsor
- QR
- Roster
- Full Screen
- Interview
- Ticker
- Standings
- Bug

## Limitaciones actuales

- Sin Program Output.
- Sin render automático.
- Sin escenas ni composiciones.
- Sin editor visual.
- Sin persistencia.
- Sin Firebase.
- Sin integración OBS.
- Sin expresiones o scripts.
- Sin ejecución de templates `custom`.
- Sin creación de una versión nueva editable a partir de un template publicado; V1 solo permite deprecarlo o duplicarlo como `draft`.
- Sin permisos reales multi-tenant; la autorización cruzada global se recibe como contexto explícito y no se persiste.

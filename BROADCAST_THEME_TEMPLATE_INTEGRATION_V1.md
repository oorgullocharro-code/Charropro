# Theme Template Integration V1

## Propósito

Theme Template Integration conecta Theme Engine V1 con Template Renderer Integration V1 sin acoplar ambos motores. Resuelve un Theme efectivo, aplica un catálogo cerrado de tokens sobre copias de Component Instances y delega el render compuesto al renderer existente.

Versión del contrato: `1.0.0`.

La integración opera solo en memoria. No modifica Preview oficial, Program, Broadcast State, Outputs, Firebase ni persistencia.

## Arquitectura

```text
Theme Registry ──> Theme Engine ──> Theme efectivo
                                      │
Template ──> Template Preparation ────┼──> Themed Preparation
                                      │
Asset Registry ──> Asset Manager ─────┘
                                              │
                                              v
                               Template Renderer Integration
                                              │
                                              v
                                    Component Renderer DOM
```

Responsabilidades:

- Theme Engine resuelve identidad, herencia y apariencia; no conoce Templates.
- Template Engine mantiene definiciones e instancias declarativas.
- Theme Template Integration aplica tokens sobre clones y coordina el ciclo temático.
- Template Renderer Integration conserva orden, root, output y composición.
- Component Renderer sigue siendo el único creador de nodos visuales.
- Asset Manager valida referencias y aislamiento; no descarga archivos.

## API pública

- `THEME_TEMPLATE_INTEGRATION_VERSION`
- `THEME_TEMPLATE_INTEGRATION_STATES`
- `THEME_TEMPLATE_INTEGRATION_ERROR_CODES`
- `BroadcastThemeTemplateIntegrationError`
- `createThemeTemplateIntegration()`
- `destroyThemeTemplateIntegration()`
- `validateThemeTemplateIntegrationContext()`
- `resolveThemeForTemplate()`
- `buildThemedTemplatePreparation()`
- `applyThemeToComponentInstance()`
- `applyThemeToTemplatePreparation()`
- `renderThemedTemplate()`
- `updateThemedTemplateRender()`
- `removeThemedTemplateRender()`
- `clearThemeTemplateIntegration()`
- `getThemedTemplateRender()`
- `listThemedTemplateRenders()`
- `buildThemeTemplateSnapshot()`
- `validateThemeTemplateSnapshot()`
- `getThemeTemplateWarnings()`
- `cloneThemedTemplateResult()`

## Lifecycle

Estados disponibles:

```text
uninitialized
ready
resolving_theme
theme_resolved
preparing
prepared
rendering
rendered
updating
partially_rendered
cleared
destroyed
error
```

No se puede renderizar sin preparación temática. `clear` elimina únicamente renders y preparaciones propias y conserva la integración externa. `destroy` libera referencias propias, no destruye el Template Renderer inyectado y bloquea todas las operaciones posteriores con `theme-template-integration-destroyed`, incluido un nuevo `clear`.

## Contexto runtime

El contexto acepta registries y fuentes únicamente en runtime:

```js
{
  integrationId,
  themeRegistry,
  templateRegistry,
  componentRegistry,
  templateRendererIntegration,
  assetRegistry,
  productionVariables,
  broadcastContract,
  output,
  visibility,
  tenantId,
  organizationId,
  clientId,
  tournamentId,
  competitionId,
  eventId,
  sessionId,
  themeSelections
}
```

Los registries, objetos DOM, renderer y listeners nunca se copian al snapshot.

## Selección de Theme

La resolución es determinista y usa esta precedencia:

1. Theme explícito.
2. Theme activo de sesión.
3. Theme activo de output.
4. Theme activo de competencia.
5. Theme activo de torneo.
6. Theme activo de cliente.
7. Theme activo de organización.
8. Theme activo de tenant.
9. Theme global activo.
10. `theme_default` autorizado.

Session y output se expresan mediante `themeSelections`; Theme Engine permanece sin conocer estos scopes operativos. Los scopes persistentes se consultan con `getActiveBroadcastThemeForContext()`.

La resolución devuelve identidad, versión, scope, `effectiveScopeKey`, `selectionReason`, `fallbackUsed`, `resolvedFrom`, `brandingStatus`, warnings, errors y una copia del Theme efectivo.

La resolución automática acepta únicamente Themes publicados: `published` o `active` con `publishedAt` válido; en Theme Engine, `active` es el estado publicado y activado del Theme. Una selección explícita puede inspeccionar o aplicar `draft`, `inactive` o `deprecated`; los estados del ciclo publicado conservan metadata de publicación válida y `error` nunca es aplicable. Los estados eliminados o inexistentes producen `theme-not-found`.

## Precedencia visual

La aplicación respeta:

1. Default seguro del Component Instance.
2. Theme base.
3. Theme heredado.
4. Variant declarativa disponible.
5. Override permitido del Template.
6. Override permitido del Component Instance.

Theme Engine entrega la herencia ya resuelta. Los overrides solo admiten campos de estilo presentes en Component Library V1. `0`, `false`, cadena vacía y `null` se conservan según el contrato del campo.

## Theme Requirements

Se leen desde metadata de Template Instance:

- `themeVariant`
- `themeScope`
- `themeRequirements`
- `themeTokensRequired`
- `themeAssetsRequired`

Un requisito ausente genera warning y fallback. Con `themeRequirements.strict: true`, el requisito faltante bloquea la preparación. `themeVariant` queda declarada pero no se aplica en V1 y genera `theme-variant-not-supported:{variant}`. No se inventan branding, colores, logos ni recursos.

## Catálogo cerrado de tokens

### Colores

`color.primary`, `color.secondary`, `color.accent`, `color.success`, `color.warning`, `color.danger`, `color.neutral`, `color.background`, `color.surface`, `color.textPrimary`, `color.textSecondary`, `color.border`, `color.highlight`, `color.overlay`, `color.transparent`.

### Tipografía

`typography.family`, `typography.weight`, `typography.size`, `typography.lineHeight`, `typography.tracking`, `typography.uppercase`, `typography.capitalize`, `typography.italic`.

La familia efectiva se construye con `family` y fallbacks seguros. Score y timer usan el grupo `score`; badges y ticker usan `label`; el resto usa `body`, salvo mapping explícito.

### Espaciado y radios

`spacing.xs`, `spacing.sm`, `spacing.md`, `spacing.lg`, `spacing.xl`.

`radius.none`, `radius.sm`, `radius.md`, `radius.lg`, `radius.full`.

### Bordes y sombras

`border.width`, `border.style`, `border.color`.

`shadow.sm`, `shadow.md`, `shadow.lg`.

### Assets

`asset.logoPrimary`, `asset.logoSecondary`, `asset.background`, `asset.watermark`, `asset.iconSet`.

Un token desconocido queda en `ignoredTokens`; un token válido ausente queda en `fallbackTokens`.

## Mapeo a Component Instances

Campos aplicables en Component Library V1:

- `color`
- `backgroundColor`
- `borderColor`
- `borderWidth`
- `borderRadius`
- `fontFamily`
- `fontSize`
- `fontWeight`
- `italic`
- `lineHeight`
- `letterSpacing`
- `shadow`
- `padding`
- `margin`
- `opacity`

Las equivalencias declarativas son:

- `fontStyle` se expresa con `italic`.
- `boxShadowToken` se normaliza al objeto `shadow` cerrado del renderer.
- `textTransform` sigue siendo propiedad del Component Instance; la integración no altera contenido.
- `gap`, `border.style` y adaptación de layout quedan fuera de V1 porque Component Library no los expone en style.

Los tokens `spacing.*` y `border.style` se diagnostican, pero `gap` y `border.style` quedan en `ignoredTokens` con `component-style-property-unsupported`; no se reportan como aplicados.

Se conservan `instanceId`, `componentId`, `componentType`, bindings, contenido resuelto, layout, geometry, visibility y revision.

## Preparación temática

`buildThemedTemplatePreparation()` acepta una Template Definition, Template Instance/Result o preparación existente. Si hace falta, delega la preparación base a `prepareTemplateRender()` y después aplica el Theme a cada copia de Component Instance.

La integración conserva en runtime dos copias desacopladas:

- `basePreparation`: preparación original inmutable usada como única base para cada cambio de Theme;
- `themedPreparation`: resultado temático vigente.

`basePreparation` nunca se deriva de una preparación ya tematizada y nunca se publica en snapshots.

La salida incluye:

- identidad de Template y Theme;
- scope y brandingStatus;
- componentes temáticos;
- orden original y z-index;
- tokens aplicados, fallback e ignorados;
- background validado;
- warnings y errors;
- timestamp.

No crea DOM.

## Render y actualización

`renderThemedTemplate()` delega a `renderTemplateInstance()`. La integración no construye nodos. Solo aplica al root creado por Template Renderer un fondo sólido, transparente o gradient generado internamente.

`updateThemedTemplateRender()` vuelve a resolver y aplicar el Theme siempre sobre `basePreparation`, delega a `updateTemplateRender()` y conserva:

- `themedRenderId`;
- `templateRenderId` compatible;
- una sola raíz;
- orden y datos;
- bindings;
- timestamps de creación.

El cambio de Theme es manual. No hay observadores ni live binding.

La actualización es atómica: valida Theme, visibility, requirements y Assets antes de cambiar el estado visible. Si la actualización del renderer falla, restaura preparación, resultado, DOM, estado, revision y timestamps anteriores. Cambiar de Theme A a Theme B elimina completamente tokens, fuentes, sombras, bordes, backgrounds, gradients y assets de A que B no defina; en esos casos reaparece el valor original de la plantilla.

## Fondos y gradients

Tipos soportados:

- `solid`
- `gradient`
- `asset`
- `transparent`
- `placeholder`

Los gradients aceptan solo estructura validada: linear/radial, ángulo finito, entre 2 y 8 stops, colores hex/transparent y posiciones de 0 a 1. La cadena CSS se genera internamente. No se aceptan `url()`, CSS textual, `@import`, `expression()` ni gradient como string de entrada.

Un fondo asset se conserva como referencia autorizada. V1 no convierte `storageRef` en URL ni descarga archivos.

## Assets, logos y watermark

La referencia pública permitida es:

```js
{ assetId, version, variantId }
```

Se rechazan URL, `signedUrl`, `externalUrl`, `storageRef`, `file://`, `javascript:`, `data:` y `vbscript:` como identidad de asset.

La resolución usa Asset Manager y valida scope, tenant, visibility, status, variante y derechos. Un Theme global no puede aplicar assets no globales. Si un asset opcional no resuelve, el Component Instance conserva su referencia original y registra warning. Un asset requerido ausente, expirado, de otro tenant, con estado no resoluble o con variante requerida inválida bloquea con `theme-required-asset-unavailable`. Un fallback solo es válido cuando Asset Manager lo autoriza expresamente.

La integración aplica logo o watermark únicamente a un componente visual declarativo existente; nunca crea un nodo adicional. No hay duplicación al cambiar Theme.

## Visibilidad

La operación usa la visibilidad más restrictiva entre solicitud, output, Template, Component, Theme y asset. Un output `public` no resuelve Theme o asset de mayor visibilidad. Bajar visibilidad mediante `updateThemedTemplateRender(..., { visibility: "public" })` retira del DOM componentes, bindings, valores y referencias no autorizadas sin recrear la raíz. Volver a `production` restaura el contenido desde `basePreparation`, no desde una copia pública incompleta.

El snapshot `public` elimina tenant, organización, cliente, sesión, actor, secretos y metadata operativa.

## Multi-tenant

Se rechazan:

- Theme tenant A con contexto tenant B;
- Template tenant A con integración tenant B;
- output de otro tenant;
- Theme scoped a otro torneo/competencia;
- asset de otro tenant;
- asset no global aplicado por Theme global.

No existe fallback cruzado entre tenants.

## Snapshot

`buildThemeTemplateSnapshot()` genera una copia serializable con:

- versiones;
- IDs de integración, render, Template y Theme;
- scope, branding y resolución;
- output y visibility;
- tokens aplicados/fallback/ignorados;
- resúmenes de componentes;
- warnings/errors;
- timestamps.

No incluye DOM, renderer, registries, funciones, listeners, `window`, `document`, `basePreparation`, actor público, tenant público, secretos ni URLs inseguras. Modificar el snapshot no altera runtime.

## Seguridad

La clonación segura:

- lee solo data descriptors propios;
- no ejecuta getters/setters;
- elimina funciones, símbolos y BigInt;
- controla ciclos;
- limita profundidad, arreglos, claves y texto;
- bloquea `__proto__`, `constructor` y `prototype`;
- elimina claves ejecutables;
- conserva `0`, `false`, `""` y `null`;
- no usa `JSON.stringify/parse` como única defensa.

La integración no usa `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `cssText`, `eval`, `new Function` ni eventos inline.

## Theme + Template Lab

Production Console ofrece controles para:

- Template;
- Theme;
- fixture/contexto;
- output 16:9, vertical o LED;
- visibility;
- resolver Theme;
- preparar;
- renderizar;
- cambiar Theme;
- actualizar;
- limpiar;
- copiar snapshot sanitizado.

El inspector muestra selección, Theme resuelto, preparación, Component Instances temáticos, resultado, tokens y diagnósticos. El laboratorio no envía nada a Preview ni Program y no modifica Outputs registrados.

Themes disponibles: Default, Orgullo Charro, Liga Mexicana provisional, Rodeo provisional, Empresarial provisional, Dark y Light. Los presets provisionales mantienen `brandingStatus: provisional`.

Templates verificados: Lower Third, Marcador, Ranking, Cronómetro, Sponsor, Interview, Full Screen, Standings, Bug, QR, Ticker y Roster. El adaptador declarativo existente de Production Console conserva marcadores de tres y cuatro equipos en 16:9, vertical y LED sin crear equipos ni recalcular scores.

## Compatibilidad

La integración es aditiva. No modifica Theme Engine, Template Renderer Integration, Template Engine, Component Renderer, Component Library, Production Variables, Action Engine, Broadcast State, Broadcast Output ni Asset Manager.

También deja intactos Core deportivo, calificador, resultados, página pública, OBS V1, gráficos V1, Firebase, Recovery y Event Engine.

## Limitaciones actuales

- No hay actualización automática al cambiar Theme.
- Theme variants se diagnostican, pero todavía no se aplican.
- `gap` y `border.style` se ignoran hasta que Component Library los soporte.
- No es Layout Engine.
- No es Animation Engine.
- No crea Program Output.
- No controla OBS.
- No persiste.
- No carga fuentes ni crea `@font-face`.
- No convierte referencias de Storage en URLs renderizables.
- Un background asset queda preparado hasta que exista un resolved asset URL autorizado.
- Watermark y logos requieren un componente visual declarativo existente.

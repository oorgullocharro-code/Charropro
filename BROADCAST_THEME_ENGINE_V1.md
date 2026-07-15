# Broadcast Theme Engine V1

## Propósito

Theme Engine V1 administra apariencia declarativa de Broadcast Studio sin modificar datos deportivos, bindings, Templates, Renderer, Preview, Program u Outputs.

- Versión del motor: `1.0.0`.
- Versión de aplicación: `20260714-theme-engine-001-theme-system-v1`.
- Implementación: `js/broadcast/themeEngine.js`.
- Persistencia: ninguna; el registro vive en memoria.
- Integración visual: pendiente; este motor no aplica temas al Renderer.

## Principios

1. Un Theme controla apariencia, nunca comportamiento.
2. `themeId` es su identidad canónica y estable.
3. Las operaciones devuelven registros nuevos y no mutan sus fuentes.
4. Un Theme publicado es inmutable.
5. La activación se aísla por tenant y scope efectivo.
6. Los assets se referencian por identidad de Asset Manager, nunca por URL.
7. La herencia se resuelve de base a descendiente de forma determinista.
8. Los snapshots se sanitizan según visibilidad.

## API pública

El módulo exporta:

- `THEME_ENGINE_VERSION`
- `THEME_ENGINE_STATES`
- `THEME_ENGINE_ERROR_CODES`
- `BroadcastThemeError`
- `createBroadcastTheme()`
- `updateBroadcastTheme()`
- `deleteBroadcastTheme()`
- `duplicateBroadcastTheme()`
- `publishBroadcastTheme()`
- `deprecateBroadcastTheme()`
- `activateBroadcastTheme()`
- `deactivateBroadcastTheme()`
- `listBroadcastThemes()`
- `getBroadcastTheme()`
- `resolveBroadcastTheme()`
- `getBroadcastThemeEffectiveScopeKey()`
- `listActiveBroadcastThemes()`
- `getActiveBroadcastThemeForContext()`
- `validateBroadcastTheme()`
- `buildBroadcastThemeSnapshot()`
- `cloneBroadcastTheme()`

Las escrituras admiten `expectedRegistryRevision`; las operaciones sobre un Theme admiten `expectedRevision`. Un conflicto rechaza la operación completa sin cambiar registro, revisión ni timestamps.

## Identidad canónica

```json
{
  "themeEngineVersion": "1.0.0",
  "themeId": "theme_tournament_brand",
  "id": "theme_tournament_brand",
  "themeVersion": "1.0.0",
  "name": "Tournament Brand",
  "description": null,
  "revision": 0,
  "status": "draft",
  "visibility": "production",
  "scope": "tournament",
  "tenantId": "tenant_a",
  "organizationId": null,
  "clientId": null,
  "tournamentId": "tournament_x",
  "competitionId": null,
  "eventId": null,
  "baseThemeId": null,
  "createdBy": "operator_a",
  "updatedBy": "operator_a",
  "publishedBy": null,
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "publishedAt": null
}
```

`id` se acepta como alias de entrada y se conserva internamente para compatibilidad. `themeId` es la identidad oficial. `themeVersion` usa SemVer.

Son inmutables mediante patch: `themeId`, `id`, `themeVersion`, todos los IDs de contexto, `scope`, `createdAt`, `createdBy`, `revision`, `publishedAt` y `publishedBy`. `updatedBy` solo cambia a través de una operación controlada.

## Scopes

Scopes oficiales:

`global`, `tenant`, `organization`, `client`, `tournament`, `competition`, `event`.

- `global` no admite IDs privados de contexto.
- Cualquier scope no global exige `tenantId`.
- Cada scope exige su ID correspondiente: `organizationId`, `clientId`, `tournamentId`, `competitionId` o `eventId`.
- Los IDs de contexto se conservan durante normalización y no se modifican por patch.

## Registro y activación

```json
{
  "themeEngineVersion": "1.0.0",
  "revision": 0,
  "activeThemeId": null,
  "activeThemes": {},
  "themes": {},
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

`activeThemes` usa una clave efectiva formada por:

```text
tenantId | scope | organizationId | clientId | tournamentId | competitionId | eventId
```

Puede haber simultáneamente un Theme global, otro para cada tenant y otros para torneos o competencias diferentes. Activar un Theme solo desactiva el Theme de la misma clave efectiva. `activeThemeId` se conserva como alias legacy exclusivamente para el Theme global activo.

`getBroadcastThemeEffectiveScopeKey()`, `listActiveBroadcastThemes()` y `getActiveBroadcastThemeForContext()` permiten consultar este modelo sin inferencias externas.

## Estados y publicación

| Estado | Política |
| --- | --- |
| `draft` | Editable; todavía no puede activarse. |
| `published` | Publicado, inmutable y disponible para activación. |
| `active` | Publicado y activo en su scope efectivo; conserva `publishedAt`. |
| `inactive` | Publicado, pero desactivado. |
| `deprecated` | Histórico; no puede activarse. |
| `error` | Inválido para publicación y activación. |

`publishBroadcastTheme()` exige actor, valida definición, assets y herencia, registra `publishedAt` y `publishedBy`, e incrementa una revisión. No activa automáticamente.

`activateBroadcastTheme()` solo acepta `published` o `inactive`. `deactivateBroadcastTheme()` pasa un Theme activo a `inactive` sin activar otro. `deprecateBroadcastTheme()` acepta `published`, `active` o `inactive`, elimina su activación efectiva cuando corresponde y conserva la definición.

Un Theme con `publishedAt` no puede editarse ni eliminarse. Cualquier cambio visual requiere crear otra versión mediante duplicación controlada y un `themeVersion` nuevo. El rechazo usa `theme-published-immutable`.

## Multi-tenant

- Un Theme global solo hereda de otro Theme global.
- Un Theme de tenant puede heredar de un Theme global cuyo `metadata.allowTenantInheritance` sea `true`, o de otro Theme del mismo tenant.
- Los scopes organization, client, tournament, competition y event permanecen dentro del mismo tenant y respetan la jerarquía de contexto.
- La herencia entre tenants se rechaza con `theme-tenant-conflict`.
- Activar un Theme en tenant A no cambia activos del tenant B.
- El snapshot `public` elimina tenant y contexto interno; `restricted` puede conservarlos.

## Asset ownership

Logos, fondos, iconos y watermarks usan referencias declarativas:

```json
{
  "assetId": "asset-tournament-logo",
  "version": "1.0.0",
  "variantId": "original",
  "tenantId": "tenant_a",
  "position": "top-right",
  "scale": 1,
  "visibility": "public"
}
```

Cuando se entrega `assetRegistry` a la operación, Theme Engine valida propiedad:

- asset global autorizado: permitido;
- asset del mismo tenant: permitido;
- asset de otro tenant: `theme-asset-tenant-conflict`;
- asset inexistente: `theme-asset-not-found`;
- Theme global con asset privado: rechazado.

No se admiten `url`, `src`, `href`, `externalUrl`, `signedUrl`, `storageRef`, `localDevelopmentRef`, `cdnRef`, fallbacks inyectados ni protocolos `file:`, `javascript:`, `data:` o `vbscript:`. El motor no consulta Storage ni descarga archivos.

## Herencia

La cadena se resuelve en orden base a descendiente y `resolvedFrom` conserva ese orden. La combinación solo sobrescribe propiedades declaradas por el descendiente; no borra tokens heredados ausentes.

El máximo es de 12 Themes en una cadena resuelta. El nivel 13 se rechaza con `theme-inheritance-depth-exceeded`. También se rechazan:

- autociclos;
- ciclos de dos o más Themes;
- base inexistente;
- herencia entre tenants;
- ascenso inválido de scope.

El resultado no depende del orden de las claves del registro.

## Colores

Claves admitidas: `primary`, `secondary`, `accent`, `success`, `warning`, `danger`, `neutral`, `background`, `surface`, `textPrimary`, `textSecondary`, `border`, `highlight`, `overlay` y `transparent`.

Formatos exactos aceptados:

- `#RGB`
- `#RGBA`
- `#RRGGBB`
- `#RRGGBBAA`
- `transparent`

Se rechazan otras longitudes, `rgb()`, `rgba()`, `hsl()`, `var()`, `url()`, `expression()`, CSS y gradients textuales.

## Tipografía segura

Cada token puede incluir `family`, `weight`, `size`, `lineHeight`, `tracking`, `uppercase`, `capitalize`, `italic` y `fallbacks`.

Las familias solo admiten letras Unicode, números, espacios, guiones y comas controladas. Se rechazan `@font-face`, `font-face`, `@import`, `url()`, protocolos, llaves, punto y coma, guion bajo, CSS y HTML. Theme Engine no carga ni distribuye fuentes.

## Fondos

Tipos oficiales:

- `solid`: exige un color válido.
- `gradient`: exige `gradientType` `linear` o `radial` y entre 2 y 8 stops.
- `asset`: exige una referencia segura.
- `transparent`: no admite color ni asset.
- `placeholder`: exige texto declarativo seguro.

El tipo es obligatorio. Un tipo ausente o desconocido se rechaza con `theme-background-type-invalid`; nunca se convierte silenciosamente a `transparent`.

Un gradient usa stops `{ color, position }`, donde `position` está entre 0 y 1. Un linear exige ángulo finito entre 0 y 360. Nueve stops se rechazan con `theme-gradient-stop-limit-exceeded`; no se truncan.

## Validación numérica

Los valores se validan sin corregirse silenciosamente:

- `NaN`, `Infinity` y `-Infinity`: rechazo;
- `spacing`, radius, border width, blur y safe areas: no negativos;
- `opacity`: 0 a 1;
- `scale`: mayor que 0 y máximo 10;
- `safeArea`: 0 a 2000;
- gradient stop: 0 a 1;
- valores cero: se conservan donde son válidos.

Los errores usan `theme-number-non-finite` o `theme-number-out-of-range` dentro del diagnóstico. Toda escritura inválida es atómica.

## Snapshots

`buildBroadcastThemeSnapshot()` puede resolver herencia con `resolve: true` y filtra Themes por su visibilidad.

Cuando recibe `tenantId`, incluye únicamente Themes globales y Themes de ese tenant; excluye definiciones y activaciones de cualquier otro tenant. Sin `tenantId` conserva el comportamiento compatible de snapshot completo del registro.

| Visibilidad | Contexto y actores | Tokens visuales | Secretos |
| --- | --- | --- | --- |
| `public` | Eliminados | Conservados | Eliminados |
| `production` | Eliminados | Conservados | Eliminados |
| `operational` | Pueden conservarse | Conservados | Eliminados |
| `restricted` | Conservados | Conservados | Eliminados |

En `public`, `metadata` se reduce a `brandingStatus` cuando es válido. En todos los niveles se eliminan recursivamente passwords, tokens, API keys, secrets, credentials, signed URLs, URLs, plugins, hooks, handlers y claves peligrosas. Se conservan `0`, `false`, `""` y `null`. La sanitización no muta registro ni Themes.

## Themes iniciales

| Theme | brandingStatus | Política |
| --- | --- | --- |
| Default | `neutral` | Base técnica neutral y heredable. |
| Orgullo Charro | `confirmed` | Negro, azul rey, plata y rojo tinto. El dorado no es color principal. |
| Liga Mexicana - Provisional | `provisional` | Hereda Default; no declara paleta oficial. |
| Rodeo | `provisional` | Preset técnico, no identidad oficial. |
| Empresarial | `provisional` | Preset técnico, no identidad oficial. |
| Dark | `neutral` | Tema técnico oscuro. |
| Light | `neutral` | Tema técnico claro. |

## Production Console

La pestaña Themes mantiene listar, crear, duplicar, eliminar borradores, activar, desactivar, inspeccionar, generar snapshot y copiar JSON sanitizado. Los siete presets se registran como draft, se publican por API y solo Default se activa inicialmente.

La API ya soporta publicar y deprecar. Los controles visuales `Publicar` y `Deprecar` quedan pendientes porque agregarlos requiere modificar HTML/CSS fuera del alcance de THEME-ENGINE-001B. La consola no crea una vía insegura: un Theme creado o duplicado permanece draft y no puede activarse hasta publicarse mediante API autorizada.

## Seguridad

La entrada y clonación segura:

- rechazan funciones, símbolos, BigInt, ciclos y accessors;
- bloquean `__proto__`, `constructor` y `prototype`;
- bloquean HTML ejecutable, CSS libre y protocolos peligrosos;
- limitan profundidad a 12, arreglos a 100 elementos, objetos a 200 claves y texto a 2000 caracteres;
- conservan valores falsy válidos;
- no usan `JSON.stringify/parse` como mecanismo de seguridad.

## Compatibilidad y límites

Theme Engine V1 opera en paralelo y no integra ni modifica Template Renderer Integration, Template Engine, Component Renderer, Component Library, Production Variables, Action Engine, Broadcast State, Broadcast Output, Asset Manager, Preview, Program, Outputs, Firebase, Core deportivo, OBS V1 ni gráficos V1.

No existe persistencia, UI de publicación/deprecación, descarga de assets, fallback automático hacia recursos legacy ni aplicación visual al Renderer. Estas capacidades requieren tickets posteriores.

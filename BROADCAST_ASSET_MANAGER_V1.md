# Broadcast Asset Manager v1

## Proposito

Broadcast Asset Manager v1 define el catalogo puro y en memoria de recursos para CharroPro Broadcast Studio. Su contrato separa la familia logica, la identidad tecnica, la version fisica, sus variantes, su alcance, su visibilidad y sus derechos de uso. Plantillas, temas, escenas y componentes futuros deberan referenciar `assetFamilyId`, `assetId`, `version` y, cuando aplique, `variantId`; no deben depender de rutas manuales ni nombres de archivo.

La version del contrato es `1.0.0` y se exporta como `ASSET_MANAGER_VERSION` desde `js/broadcast/assetManager.js`.

Esta primera version no sube, descarga ni persiste archivos. No consulta Firebase, Firebase Storage, URLs remotas ni rutas legacy. Todas sus operaciones reciben datos, validan y devuelven copias serializables.

## API publica

Constantes:

- `ASSET_MANAGER_VERSION`
- `ASSET_TYPES`
- `ASSET_STATUSES`
- `ASSET_VISIBILITIES`
- `ASSET_SCOPES`
- `ASSET_VARIANT_TYPES`

Modelo y validacion:

- `createBroadcastAsset(input, options)`
- `normalizeBroadcastAsset(input, options)`
- `validateBroadcastAsset(asset, options)`
- `cloneBroadcastAsset(asset)`
- `getBroadcastAssetWarnings(asset, context)`

Registro y ciclo de vida:

- `registerBroadcastAsset(registry, asset, options)`
- `updateBroadcastAsset(registry, assetId, patch, options)`
- `createBroadcastAssetVersion(asset, changes, options)`
- `getBroadcastAsset(registry, assetId, version)`
- `listBroadcastAssets(registry, filter)`
- `setBroadcastAssetStatus(asset, status, options)`
- `deprecateBroadcastAsset(asset, options)`
- `archiveBroadcastAsset(asset, options)`
- `restoreBroadcastAsset(asset, options)`
- `removeBroadcastAsset(registry, assetId, options)`
- `setBroadcastAssetRights(asset, rights, options)`
- `setBroadcastAssetVisibility(asset, visibility, options)`
- `setBroadcastAssetScope(asset, scope, scopeValues, options)`

Variantes y resolucion:

- `addBroadcastAssetVariant(asset, variant, options)`
- `removeBroadcastAssetVariant(asset, variantId, options)`
- `validateBroadcastAssetVariant(variant, options)`
- `resolveBroadcastAssetVariant(asset, request, context, options)`
- `resolveBroadcastAsset(registry, request, context, options)`

Manifiestos:

- `buildBroadcastAssetManifest(registry, options)`
- `validateBroadcastAssetManifest(manifest, options)`

Las operaciones que no pueden completarse lanzan `BroadcastAssetError` con un `code` estable y detalles serializables.

## Tipos

`image`, `logo`, `photo`, `background`, `video`, `audio`, `font`, `icon`, `svg`, `animation`, `lottie`, `sponsor`, `watermark`, `thumbnail`, `overlay`, `lower_third`, `bumper`, `stinger`, `qr`, `document`, `data` y `custom`.

`type` describe la funcion principal. `mimeType` describe el formato tecnico. Por ejemplo, un logo puede tener `type: "logo"` y `mimeType: "image/png"`.

## Estados y ciclo de vida

| Estado | Uso |
| --- | --- |
| `draft` | Editable; no puede resolverse para Program. |
| `validating` | Pendiente de controles tecnicos. |
| `pending_review` | Pendiente de revision editorial u operativa. |
| `approved` | Aprobado; solo puede resolverse en Preview si se autoriza. |
| `published` | Seleccionable para nuevos usos autorizados. |
| `deprecated` | Disponible para versiones exactas o recuperacion historica autorizada. |
| `archived` | Fuera de seleccion para usos nuevos. |
| `rejected` | Conserva historial y requiere nueva revision. |
| `unavailable` | La referencia fisica no se encuentra disponible. |
| `expired` | La vigencia termino. |
| `revoked` | No se resuelve ni se restaura automaticamente. |
| `error` | Conserva el asset y el diagnostico tecnico. |

El flujo publicado normal es `approved -> published -> deprecated -> archived`. Un asset archivado vuelve a `deprecated` si fue archivado desde ese estado; de lo contrario vuelve a `draft`. Un asset publicado o historico no se borra: se depreca y archiva. `removeBroadcastAsset()` solo elimina versiones no historicas y no referenciadas.

## Visibilidad

La precedencia es:

`public < production < operational < restricted`

Un contexto solo puede resolver recursos con visibilidad igual o menos restrictiva. Un output `public` nunca recibe un asset `production`, `operational` o `restricted`. Una variante tampoco puede tener visibilidad menos restrictiva que su asset padre.

## Scopes y multi-tenant

La precedencia de resolucion es:

`session -> user -> output -> charreada -> competition -> tournament -> client -> organization -> tenant -> global`

Los scopes disponibles son `global`, `tenant`, `organization`, `client`, `tournament`, `competition`, `charreada`, `output`, `user` y `session`.

Todo scope distinto de `global` exige `tenantId` y el ID propio de su alcance. El registro rechaza una familia cuyo `assetFamilyId` cambie de tenant y tambien rechaza versiones de un mismo `assetId` con familias distintas. La resolucion requiere coincidencia de tenant y del ID de scope. Los manifiestos pueden filtrarse por tenant, organizacion y torneo, y marcan como error cualquier mezcla de tenants no filtrada.

El permiso real para compartir recursos entre organizaciones no se implementa en v1. Un catalogo global debe declararse expresamente con `scope: "global"`.

## Registro serializable

La forma canonica del registro es:

```json
{
  "assetManagerVersion": "1.0.0",
  "revision": 1,
  "assets": {
    "logo_org@1.0.0": {
      "assetFamilyId": "logo_org"
    }
  },
  "currentVersions": {
    "logo_org": "1.0.0"
  },
  "createdAt": "2026-07-13T12:00:00.000Z",
  "updatedAt": "2026-07-13T12:00:00.000Z",
  "warnings": [],
  "errors": []
}
```

La llave interna combina `assetId@version`; el nombre visible o el nombre de archivo nunca se usan como identidad. El registro tambien acepta como entrada un arreglo o mapa de assets y siempre devuelve la forma canonica sin mutar el origen.

## Identidad, version y revision

`assetFamilyId` identifica la familia logica a traves del tiempo. Si no se entrega al crear la version inicial `1.0.0`, se deriva exclusivamente de `assetId`; nunca se deriva del nombre visible, filename o URL. Una version posterior sin familia se rechaza y debe construirse mediante `createBroadcastAssetVersion()`. `assetId` es el identificador tecnico estable usado por resolucion. La version concreta se identifica por la tupla `(assetId, version)`. `version` usa SemVer y `revision` registra ajustes permitidos de metadata dentro de una version editable.

Son inmutables despues del registro: `assetId`, `assetFamilyId`, `assetManagerVersion`, `createdAt`, `createdBy`, `tenantId`, `version`, `revision` directa, checksum publicado y vinculos de version. Un patch que intente cambiar cualquiera de esos campos se rechaza atomicamente.

`createBroadcastAssetVersion()` crea una version superior, conserva exactamente `assetFamilyId` y `assetId`, conserva `parentVersion` y `previousVersion`, reinicia `revision` y registra actor y timestamp. Un cambio de `storageRef`, `externalUrl`, `localDevelopmentRef`, `cdnRef`, checksum o MIME se considera cambio fisico y limpia las variantes salvo que se entreguen variantes nuevas de forma explicita. Nunca muta la version origen.

Los ajustes menores de un draft usan `updateBroadcastAsset()` y una allowlist. El rechazo es atomico. Los cambios legales mediante `setBroadcastAssetRights()` pueden restringir una version publicada sin sustituir su contenido; quedan revisionados y no cambian identidad, archivo ni checksum.

## Referencias de almacenamiento

El modelo incluye:

- `storageRef`: referencia persistente autorizada.
- `externalUrl`: URL externa permitida solo con politica explicita.
- `localDevelopmentRef`: fixture local, valido solamente con `environment: "development"`. Se elimina de manifiestos por defecto.
- `cdnRef`: referencia CDN futura.
- `signedUrl`: referencia temporal; se elimina al registrar y nunca entra al manifiesto.
- `sourceType`: `none`, `storage`, `external`, `local_development` o `cdn`.

No se permiten esquemas `javascript:`, `data:` o `file:` en referencias persistentes. Una URL externa debe ser HTTP(S); HTTP produce advertencia salvo autorizacion. Los data URLs solo se aceptan con opcion explicita, tienen limite reducido y no son identidad permanente. Un manifiesto solo conserva `localDevelopmentRef` cuando se solicitan simultaneamente `environment: "development"`, `includeDevelopmentRefs: true` y `exportable: false`, y nunca cuando `productionReady: true`.

## Checksum e integridad

Se modelan `checksum`, `checksumAlgorithm`, `integrityStatus`, `verifiedAt` y `verifiedBy`. Los algoritmos aceptados son `sha256`, `sha384` y `sha512`, con validacion de longitud hexadecimal. v1 no calcula hashes porque no procesa archivos fisicos.

Un asset publicado sin checksum genera advertencia. Un `integrityStatus: "mismatch"` invalida el asset. Al registrar un checksum ya utilizado por otro `assetId`, se agrega `asset-probable-duplicate-checksum` como advertencia; no se fusionan registros automaticamente.

## Metadata tecnica

Imagenes, logos, fotos, fondos y SVG pueden registrar dimensiones, relacion de aspecto, alpha, perfil de color y orientacion. Video agrega duracion, frame rate, codec, audio, canales y bitrate. Audio usa duracion, codec, sample rate, canales y bitrate. Fuentes usan familia, estilo, peso, formato, caracteres compatibles, licencia, fallback y permiso de preload.

No se inspeccionan ni transforman archivos en v1. La metadata desconocida genera advertencias cuando es relevante, pero la ausencia de campos opcionales no bloquea un draft valido.

## Variantes

Los tipos son `thumbnail`, `low_resolution`, `medium_resolution`, `high_resolution`, `transparent`, `dark_background`, `light_background`, `landscape`, `portrait`, `square`, `panoramic`, `mobile`, `led`, `preview`, `program`, `compressed` y `original`.

Cada variante tiene identidad propia, referencia, MIME, dimensiones, checksum, estado, visibilidad, outputs compatibles, orientacion y calidad. `variantId` es unico dentro del asset. De forma predeterminada tampoco se permiten variantes equivalentes con la misma combinacion tipo/orientacion/output/dimensiones.

Cada version puede tener como maximo una variante `type: "original"`. Esa variante no puede eliminarse ni convertirse indirectamente mediante un patch generico. Intentar eliminarla produce `original-variant-removal-forbidden` sin cambiar revision, timestamp, variantes ni objeto fuente. Una nueva version puede conservar o declarar su propia variante original.

La resolucion prioriza ID exacto, tipo, orientacion, output y ancho solicitado. Si no existe la variante, solo usa `fallbackVariantId` cuando esta autorizado, visible y operativo. Nunca inventa una variante. La eliminacion se bloquea si `options.references` declara que una composicion la utiliza.

## Resolucion y fallback

`resolveBroadcastAsset()` filtra por identidad o tipo, version, tags, categorias, tenant, scope, visibilidad, estado, expiracion y derechos. Despues ordena de manera determinista por scope mas especifico, estado, version, fecha e ID.

Estados resolubles:

- `published`: uso normal.
- `deprecated`: solo version exacta, contexto historico o opcion explicita.
- `approved`: solo Preview u opcion explicita.

Estrategias de fallback: `none`, `inherit`, `default_by_type`, `default_by_scope`, `placeholder` y `hide_component`. Se admite `fallbackAssetId` explicito y `fallbackVariantId`. La profundidad es limitada y se detectan ciclos. El resultado indica `fallbackUsed`, `fallbackReason`, advertencias y errores. La causa original, incluidos derechos vencidos, queda visible y no se oculta silenciosamente.

Los fallbacks declarativos por tipo o scope solo consideran assets marcados `metadata.isDefault: true`; `placeholder` requiere el tag `placeholder`. Todos vuelven a pasar aislamiento de tenant, visibilidad, estado y derechos.

## Derechos de uso

El bloque `rights` modela propietario, licencia, vigencia, territorios, usos permitidos/restringidos, credito, uso comercial, broadcast, publicacion, descarga, derivados y notas.

La resolucion rechaza usos antes de `validFrom`, despues de `validUntil`, broadcast prohibido, uso comercial prohibido, publicacion prohibida, derivados prohibidos y territorios no autorizados. La cercania del vencimiento y el credito requerido generan advertencias. No se ofrece asesoria legal ni se interpreta una licencia fuera de los campos declarados.

## Patrocinadores y fuentes

Un asset `sponsor` puede incluir patrocinador, campana, prioridad, vigencia, competencias, suertes, outputs, reglas declarativas, URL HTTP(S) y QR vinculado. No existe todavia motor de campanas ni automatizacion.

Un asset `font` exige familia y formato; la licencia ausente produce advertencia. v1 no carga fuentes dinamicamente ni distribuye archivos fuera del catalogo.

## Tags y categorias

Tags y categorias se normalizan a minusculas, eliminan duplicados, bloquean claves peligrosas y tienen limites de cantidad y longitud. `listBroadcastAssets()` permite filtrarlos, pero nunca funcionan como permisos.

## Manifiestos

`buildBroadcastAssetManifest()` produce:

- version y fecha del manifiesto;
- entorno, condicion exportable, estado production-ready y politica de referencias de desarrollo;
- tenant, organizacion y torneo solicitados;
- assets sin `signedUrl`, referencias locales no autorizadas ni metadata sensible;
- inventario de versiones;
- inventario de variantes;
- checksums;
- resumen de derechos;
- advertencias y errores.

Antes de incluir assets, el builder recorre assets, variantes, rights, bloques anidados y arreglos. Elimina claves sensibles sin importar mayusculas o separadores, incluyendo password, secret, API keys, tokens, authorization, credentials, private keys, client secrets, signed URLs y cookies. Conserva metadata segura y valores `0`, `false` y `""`, no muta el registro y agrega una sola advertencia `sensitive-metadata-redacted` sin revelar valores ni rutas sensibles.

El manifiesto sirve como base futura de exportacion, respaldo, auditoria, migracion y precarga. No descarga recursos. `validateBroadcastAssetManifest()` rechaza URLs firmadas, referencias locales no autorizadas, `file://`, claves sensibles, assets sin `assetFamilyId`, familias inconsistentes, versiones cuya familia no coincide y multiples variantes originales. La opcion `requireOriginalVariant: true` convierte la ausencia de original en error; sin esa politica, la ausencia es valida.

## Seguridad

Todas las entradas se copian mediante un clon estructural controlado que:

- no muta objetos fuente;
- conserva `0`, `false` y cadena vacia;
- elimina funciones, simbolos y bigint;
- controla ciclos;
- limita profundidad, arreglos, objetos, tags y metadata;
- ignora accessors para no ejecutar getters;
- bloquea `__proto__`, `constructor` y `prototype`;
- redacta metadata sensible en manifiestos;
- normaliza IDs y MIME;
- rechaza URLs peligrosas y estructuras no serializables.

No se utiliza `JSON.stringify/parse` como unica defensa. No hay estado global, listeners, timers, red, Firebase, Storage ni almacenamiento del navegador.

## Tabla de campos implementados

| Ruta tecnica | Etiqueta en espanol | Tipo | Requerido | Significado |
| --- | --- | --- | --- | --- |
| `assetManagerVersion` | Version del gestor | string | Si | Version del contrato Asset Manager. |
| `assetId` | ID tecnico del recurso | string | Si | Identificador estable usado junto con `version`. |
| `assetFamilyId` | ID de familia | string | Si | Identidad logica inmutable compartida entre versiones. |
| `name` | Nombre | string | Si | Nombre visible del recurso. |
| `description` | Descripcion | string/null | No | Contexto editorial u operativo. |
| `type` | Tipo de recurso | enum | Si | Funcion principal: logo, video, fuente, etc. |
| `mimeType` | Tipo MIME | string | Si | Formato tecnico del contenido. |
| `extension` | Extension | string/null | No | Extension sin punto. |
| `status` | Estado | enum | Si | Estado dentro del ciclo de vida. |
| `visibility` | Visibilidad | enum | Si | Nivel maximo autorizado. |
| `scope` | Alcance | enum | Si | Contexto propietario del asset. |
| `tenantId` | Tenant | string/null | Segun scope | Limite principal de aislamiento. |
| `organizationId` | Organizacion | string/null | Segun scope | Organizacion propietaria. |
| `clientId` | Cliente | string/null | Segun scope | Cliente propietario. |
| `tournamentId` | Torneo | string/null | Segun scope | Torneo propietario. |
| `competitionId` | Competencia | string/null | Segun scope | Competencia propietaria. |
| `charreadaId` | Jornada | string/null | Segun scope | Jornada propietaria. |
| `outputId` | Salida | string/null | Segun scope | Output propietario. |
| `userId` | Usuario | string/null | Segun scope | Usuario propietario. |
| `sessionId` | Sesion | string/null | Segun scope | Sesion propietaria. |
| `ownerId` | ID del propietario | string/null | Publicado | Propietario responsable. |
| `ownerName` | Nombre del propietario | string/null | Publicado | Nombre alternativo del propietario. |
| `storageRef` | Referencia de almacenamiento | string/null | Publicado | Referencia persistente autorizada. |
| `externalUrl` | URL externa | string/null | No | URL HTTP(S) bajo politica explicita. |
| `localDevelopmentRef` | Referencia local de desarrollo | string/null | No | Fixture local no productivo. |
| `cdnRef` | Referencia CDN | string/null | No | Referencia CDN futura. |
| `signedUrl` | URL firmada | string/null | No persistir | URL temporal eliminada de registro/manifiesto. |
| `sourceType` | Tipo de fuente | enum | Si | Origen tecnico declarado. |
| `checksum` | Suma de integridad | string/null | Recomendado | Hash hexadecimal del contenido. |
| `checksumAlgorithm` | Algoritmo de checksum | enum/null | Con checksum | SHA-256, SHA-384 o SHA-512. |
| `integrityStatus` | Estado de integridad | enum | Si | Unknown, pending, verified, failed o mismatch. |
| `verifiedAt` | Fecha de verificacion | ISO-8601/null | No | Ultima verificacion de integridad. |
| `verifiedBy` | Verificado por | actor/null | No | Actor responsable de verificar. |
| `fileSize` | Peso de archivo | integer/null | No | Bytes del recurso. |
| `dimensions.width` | Ancho | integer/null | No | Ancho en pixeles. |
| `dimensions.height` | Alto | integer/null | No | Alto en pixeles. |
| `dimensions.aspectRatio` | Relacion de aspecto | string/null | No | Proporcion normalizada. |
| `dimensions.hasAlpha` | Transparencia | boolean/null | No | Si la imagen admite alpha. |
| `dimensions.colorProfile` | Perfil de color | string/null | No | Perfil declarado. |
| `dimensions.orientation` | Orientacion | enum/null | No | Landscape, portrait o square. |
| `duration` | Duracion | number/null | No | Duracion en segundos. |
| `frameRate` | Cuadros por segundo | number/null | No | FPS del video. |
| `audioChannels` | Canales de audio | integer/null | No | Canales declarados para video. |
| `codec` | Codec | string/null | No | Codec tecnico. |
| `bitrate` | Bitrate | number/null | No | Tasa de bits. |
| `sampleRate` | Frecuencia de audio | number/null | No | Sample rate. |
| `channels` | Canales | integer/null | No | Canales de audio. |
| `hasAlpha` | Alpha principal | boolean/null | No | Alpha a nivel principal. |
| `hasAudio` | Audio incluido | boolean/null | No | Indica si el video incluye audio. |
| `colorProfile` | Perfil principal | string/null | No | Perfil a nivel principal. |
| `orientation` | Orientacion principal | enum/null | No | Orientacion derivada o declarada. |
| `version` | Version | SemVer | Si | Version inmutable del recurso. |
| `revision` | Revision | integer | Si | Cambios de metadata editable. |
| `parentVersion` | Version padre | SemVer/null | No | Version que origino la actual. |
| `previousVersion` | Version anterior | SemVer/null | No | Vinculo historico anterior. |
| `nextVersion` | Version siguiente | SemVer/null | No | Vinculo futuro si existe. |
| `changelog` | Historial de cambios | string/null | No | Descripcion del cambio. |
| `migrationNotes` | Notas de migracion | string/null | No | Contexto de migracion. |
| `variants` | Variantes | array | Si | Representaciones tecnicas derivadas. |
| `tags` | Etiquetas | string[] | Si | Busqueda y clasificacion. |
| `categories` | Categorias | string[] | Si | Clasificacion funcional. |
| `rights` | Derechos | object | Si | Condiciones declaradas de uso. |
| `sponsor` | Patrocinador | object | Si | Metadata opcional de patrocinio. |
| `font` | Fuente | object | Si | Metadata opcional de tipografia. |
| `metadata` | Metadata adicional | object | Si | Datos declarativos limitados. |
| `fallbackAssetId` | Asset alternativo | string/null | No | Recurso de respaldo explicito. |
| `fallbackVariantId` | Variante alternativa | string/null | No | Variante de respaldo explicita. |
| `fallbackStrategy` | Estrategia de fallback | enum | Si | Comportamiento cuando no se resuelve. |
| `createdAt` | Fecha de creacion | ISO-8601 | Si | Timestamp inmutable de version. |
| `updatedAt` | Fecha de actualizacion | ISO-8601 | Si | Ultima revision. |
| `createdBy` | Creado por | actor/null | No | Actor de creacion. |
| `updatedBy` | Actualizado por | actor/null | No | Actor de ultima revision. |
| `publishedAt` | Fecha de publicacion | ISO-8601/null | Publicado | Inicio del uso publicado. |
| `deprecatedAt` | Fecha de deprecacion | ISO-8601/null | No | Inicio de deprecacion. |
| `archivedAt` | Fecha de archivo | ISO-8601/null | No | Fecha de archivo. |
| `expiresAt` | Expiracion operativa | ISO-8601/null | No | Fecha limite del asset. |
| `warnings` | Advertencias | string[] | Si | Riesgos no bloqueantes. |
| `errors` | Errores | string[] | Si | Diagnosticos conservados. |
| `rights.owner` | Titular de derechos | string/null | No | Titular declarado. |
| `rights.licenseType` | Tipo de licencia | string/null | No | Clasificacion de licencia. |
| `rights.licenseId` | ID de licencia | string/null | No | Referencia contractual. |
| `rights.validFrom` | Inicio de derechos | ISO-8601/null | No | Inicio de vigencia. |
| `rights.validUntil` | Vigencia de derechos | ISO-8601/null | No | Fecha limite de uso autorizado. |
| `rights.territories` | Territorios | string[] | No | Territorios permitidos. |
| `rights.allowedUses` | Usos permitidos | string[] | No | Lista declarativa. |
| `rights.restrictedUses` | Usos restringidos | string[] | No | Lista declarativa. |
| `rights.creditRequired` | Credito obligatorio | boolean | Si | Exige credito visible. |
| `rights.creditText` | Texto de credito | string/null | Segun uso | Texto que debe mostrarse. |
| `rights.commercialUse` | Uso comercial | boolean/null | No | Permiso comercial. |
| `rights.broadcastUse` | Uso en transmision | boolean/null | No | Permiso para broadcast. |
| `rights.publicDisplay` | Exhibicion publica | boolean/null | No | Permiso en outputs publicos. |
| `rights.downloadAllowed` | Descarga permitida | boolean/null | No | Permiso de descarga. |
| `rights.derivativesAllowed` | Derivados permitidos | boolean/null | No | Permiso de modificacion. |
| `rights.notes` | Notas legales | string/null | No | Observaciones sin interpretacion legal. |
| `rights.metadata` | Metadata de derechos | object | Si | Datos declarativos sujetos a redaccion del manifiesto. |
| `variants[].variantId` | ID de variante | string | Si | Identificador dentro del asset. |
| `variants[].type` | Tipo de variante | enum | Si | Program, LED, portrait, etc. |
| `variants[].name` | Nombre de variante | string | Si | Etiqueta visible. |
| `variants[].storageRef` | Referencia de variante | string/null | No | Referencia persistente. |
| `variants[].externalUrl` | URL de variante | string/null | No | URL HTTP(S) autorizada. |
| `variants[].mimeType` | MIME de variante | string | Si | Formato tecnico. |
| `variants[].extension` | Extension de variante | string/null | No | Extension sin punto. |
| `variants[].width` | Ancho de variante | integer/null | No | Pixeles. |
| `variants[].height` | Alto de variante | integer/null | No | Pixeles. |
| `variants[].aspectRatio` | Proporcion de variante | string/null | No | Relacion de aspecto. |
| `variants[].fileSize` | Peso de variante | integer/null | No | Bytes. |
| `variants[].checksum` | Checksum de variante | string/null | Recomendado | Integridad declarada. |
| `variants[].status` | Estado de variante | enum | Si | Disponibilidad de la variante. |
| `variants[].visibility` | Visibilidad de variante | enum | Si | Nunca menos restrictiva que el padre. |
| `variants[].outputTypes` | Outputs compatibles | string[] | Si | Destinos declarados. |
| `variants[].orientation` | Orientacion de variante | enum/null | No | Landscape, portrait o square. |
| `variants[].quality` | Calidad | number/null | No | Escala de 0 a 100. |
| `variants[].createdAt` | Creacion de variante | ISO-8601 | Si | Timestamp. |
| `variants[].createdBy` | Autor de variante | actor/null | No | Actor responsable. |
| `variants[].metadata` | Metadata de variante | object | Si | Datos declarativos limitados. |

## Compatibilidad legacy

Asset Manager v1 opera en paralelo. No modifica logos actuales, rutas, publicTournaments, `broadcastContext`, Broadcast Data Contract, Broadcast State, Broadcast Output, graficos V1 u OBS V1. No migra assets, no sustituye URLs legacy y no habilita fallback automatico hacia recursos existentes. La migracion requerira un ticket futuro con inventario, versionado y validacion explicitos.

## Limitaciones actuales

- Sin Firebase ni Firebase Storage.
- Sin uploads, descargas, CDN real o URLs firmadas persistentes.
- Sin permisos reales; solo modelado y filtrado conceptual.
- Sin deteccion real de referencias externas; se aceptan fixtures en `options.references`.
- Sin procesamiento de imagen, video, audio o fuentes.
- Sin editor, plantillas, temas, escenas, consola, marketplace o plugins.
- Sin migracion desde recursos legacy.

## Fixtures y pruebas

`tests/broadcast-asset-manager.test.mjs` cubre imagen, logo, video, fuente, sponsor, foto de participante, foto de caballo, fondo, variantes horizontal/vertical/LED, derechos vigentes/vencidos, fallback, precedencia por torneo, separacion de tenants, manifiestos, deprecacion, archivo, revocacion, seguridad y compatibilidad legacy. Todos los fixtures son objetos en memoria y no requieren archivos fisicos.

# Broadcast Production Variables v1

## Propósito

Production Variables es el registro tipado en memoria para datos manuales de producción que no pertenecen al Core deportivo. Su versión es `1.0.0` y opera en paralelo al Broadcast Data Contract, Broadcast State, Broadcast Output y Asset Manager.

Las variables no recalculan resultados, no sobrescriben el contrato deportivo y no se publican en Firebase. Toda mutación iniciada por Production Console pasa por Action Engine `1.1.0`.

## Límites de v1

- Registro serializable únicamente en memoria.
- Sin Firebase, `localStorage`, `sessionStorage` ni `live/current`.
- Sin Automation Engine ni expresiones ejecutables.
- Sin resolución directa de archivos, URLs o Asset Manager.
- Sin escritura sobre el Broadcast Data Contract.
- Una recarga crea un registro nuevo con las definiciones iniciales.

## API pública

El módulo `js/broadcast/productionVariables.js` exporta:

- `PRODUCTION_VARIABLES_VERSION`
- `VARIABLE_TYPES`
- `VARIABLE_SCOPES`
- `VARIABLE_VISIBILITIES`
- `VARIABLE_STATUSES`
- `VARIABLE_SOURCES`
- `PRODUCTION_VARIABLE_DEFINITIONS`
- `BroadcastVariableError`
- `createProductionVariable()`
- `normalizeProductionVariable()`
- `validateProductionVariable()`
- `registerProductionVariable()`
- `updateProductionVariable()`
- `removeProductionVariable()`
- `getProductionVariable()`
- `listProductionVariables()`
- `resolveProductionVariable()`
- `resolveProductionVariables()`
- `setProductionVariableValue()`
- `resetProductionVariableValue()`
- `expireProductionVariable()`
- `getProductionVariableWarnings()`
- `cloneProductionVariable()`
- `buildProductionVariablesSnapshot()`
- `validateProductionVariablesSnapshot()`

## Estructura canónica

```json
{
  "variablesVersion": "1.0.0",
  "variableId": "var_production_message",
  "key": "production.message",
  "label": "Mensaje",
  "description": null,
  "dataType": "text",
  "value": null,
  "defaultValue": "",
  "status": "active",
  "scope": "tournament",
  "visibility": "public",
  "source": "operator",
  "tenantId": "tenant_console_fixture",
  "organizationId": "organizacion_playground",
  "clientId": null,
  "tournamentId": "torneo_playground",
  "competitionId": null,
  "charreadaId": null,
  "outputId": null,
  "userId": null,
  "sessionId": null,
  "schemaId": null,
  "options": [],
  "validation": {
    "min": null,
    "max": null,
    "decimals": null,
    "maxLength": 500,
    "allowEmpty": true
  },
  "writableBy": ["supervisor", "operador", "graficos"],
  "readableBy": [],
  "ttl": null,
  "expiresAt": null,
  "revision": 0,
  "version": "1.0.0",
  "createdAt": "2026-07-13T20:00:00.000Z",
  "updatedAt": "2026-07-13T20:00:00.000Z",
  "createdBy": null,
  "updatedBy": null,
  "warnings": [],
  "errors": []
}
```

## Campos

| Campo | Etiqueta en español | Tipo | Requerido | Significado |
| --- | --- | --- | --- | --- |
| variablesVersion | Versión del sistema | string | Sí | Versión del contrato de variables |
| variableId | ID de variable | string | Sí | Identificador estable |
| key | Clave | string | Sí | Nombre técnico único dentro del namespace |
| label | Etiqueta | string | Sí | Nombre visible para operación |
| description | Descripción | string/null | No | Contexto funcional |
| dataType | Tipo de dato | string | Sí | Tipo y validación del valor |
| value | Valor actual | variable | No | Valor definido en ese scope |
| defaultValue | Valor predeterminado | variable | No | Fallback de la definición |
| status | Estado | string | Sí | Estado del ciclo de vida |
| scope | Alcance | string | Sí | Alcance de resolución |
| visibility | Visibilidad | string | Sí | Límite máximo de exposición |
| source | Fuente | string | Sí | Procedencia conceptual del valor |
| tenantId | Tenant | string/null | Según scope | Aislamiento de tenant |
| organizationId | Organización | string/null | Según scope | Identidad organizacional |
| clientId | Cliente | string/null | Según scope | Identidad del cliente |
| tournamentId | Torneo | string/null | Según scope | Identidad del torneo |
| competitionId | Competencia | string/null | Según scope | Identidad de competencia |
| charreadaId | Jornada | string/null | Según scope | Identidad de jornada |
| outputId | Salida | string/null | Según scope | Identidad del output |
| userId | Usuario | string/null | Según scope | Identidad conceptual de usuario |
| sessionId | Sesión | string/null | Según scope | Identidad temporal de sesión |
| schemaId | Esquema | string/null | Para structured | Esquema registrado |
| options | Opciones | string[] | Para enum | Valores permitidos |
| validation | Validación | object | No | Rango, decimales y longitud |
| writableBy | Roles de escritura | string[] | Sí | Permisos conceptuales |
| readableBy | Roles de lectura | string[] | No | Restricción conceptual adicional |
| ttl | Vigencia | integer/null | No | Milisegundos desde la escritura |
| expiresAt | Expiración | ISO-8601/null | No | Fecha efectiva de expiración |
| revision | Revisión | number | Sí | Control de concurrencia |
| version | Versión | semver | Sí | Versión de la definición |
| createdAt | Creación | ISO-8601 | Sí | Fecha inmutable de creación |
| updatedAt | Actualización | ISO-8601 | Sí | Fecha de último cambio |
| createdBy | Creado por | actor/null | No | Actor conceptual de creación |
| updatedBy | Actualizado por | actor/null | No | Actor conceptual de cambio |
| warnings | Advertencias | string[] | Sí | Diagnósticos no bloqueantes |
| errors | Errores | string[] | Sí | Diagnósticos bloqueantes conservados |

## Tipos

### `text`

Cadena con longitud máxima. Conserva `""` cuando está permitida y rechaza HTML ejecutable, manejadores de eventos y protocolos `javascript:`.

### `number`

Número finito con mínimo, máximo y decimales opcionales. `NaN` e `Infinity` son inválidos. El valor `0` es válido.

### `boolean`

Acepta exclusivamente `true` o `false`.

### `color`

Acepta `#RGB`, `#RRGGBB` y `#RRGGBBAA`. No acepta CSS arbitrario.

### `date` y `datetime`

`date` usa `YYYY-MM-DD` válido. `datetime` exige ISO-8601 con zona horaria.

### `duration`

Entero no negativo expresado en milisegundos.

### `enum`

El valor debe existir en `options`.

### `asset_ref`

```json
{
  "assetId": "asset-sponsor",
  "version": "1.0.0",
  "variantId": "program"
}
```

Solo modela identidad mediante `assetId`, `version` y `variantId`. No admite URLs, `file://`, `javascript:`, `data:`, `externalUrl`, `signedUrl`, `storageRef` ni carga el archivo.

### `contract_ref`

Referencia de solo lectura al Broadcast Data Contract. Las rutas permitidas son:

- `tournament.name`
- `competition.name`
- `participant.name`
- `team.name`
- `horse.name`
- `score.total`
- `timer.value`

No copia el contrato completo y bloquea rutas peligrosas o restringidas.

### `structured`

Solo admite los esquemas registrados `production.key_value_v1` y `production.note_v1`. La profundidad y cantidad de nodos están limitadas.

## Scopes y precedencia

La resolución usa este orden, del más específico al más general:

1. `session`
2. `user`
3. `output`
4. `charreada`
5. `competition`
6. `tournament`
7. `client`
8. `organization`
9. `tenant`
10. `global`

La identidad correspondiente al scope y cualquier identidad adicional declarada por la variable deben existir y coincidir en el contexto. Un override de sesión no modifica la variable de torneo. Ante empate dentro del mismo scope gana primero la mayor `revision`; después se compara versión compatible y finalmente `variableId`, lo que evita depender del orden del registro.

## Resolución y fallback

La respuesta de `resolveProductionVariable()` incluye valor, scope de procedencia, fuente, revisión, visibilidad, uso de fallback, advertencias y errores.

El orden de fallback es:

1. `value` del scope más específico activo.
2. `value` heredado de un scope superior.
3. `defaultValue` disponible.
4. Fallback explícito del consumidor.

Una variable `draft`, `disabled`, `expired`, `deprecated` o `error` no aporta un valor activo. Nunca se inventa contenido.

## Visibilidad

La precedencia es `public < production < operational < restricted`.

- `public` recibe solo variables públicas.
- `production` recibe públicas y de producción.
- `operational` agrega las operativas.
- `restricted` puede ver las autorizadas de todos los niveles.

La resolución nunca eleva visibilidad. El inspector público elimina actor, tenant, sesión y metadata interna. Las claves con apariencia de secretos se rechazan y los campos sensibles se eliminan del inspector incluso en vistas de mayor alcance.

## Estados y fuentes

Estados: `draft`, `active`, `disabled`, `expired`, `deprecated`, `error`.

Fuentes: `default`, `operator`, `system`, `imported`, `automation_future`, `contract_reference`.

`automation_future` es únicamente una clasificación reservada; v1 no ejecuta automatizaciones.

## Identidad e inmutabilidad

Después del registro no pueden modificarse por patch:

- `variableId`
- `variablesVersion`
- `key`
- `createdAt`
- `createdBy`
- `tenantId`
- `version`
- `revision` directamente

La clave es única por scope e identidades de namespace. Cada mutación exige `expectedRevision`; un conflicto rechaza toda la operación sin modificar el registro original.

## TTL

`ttl` está expresado en milisegundos. Al establecer un valor se deriva `expiresAt`. No existen timers globales: expiración se evalúa al normalizar o resolver, y solo `expireProductionVariable()` cambia explícitamente el registro a `expired`.

## Permisos conceptuales

| Rol | Registro | Set | Reset | Activar/desactivar | Expirar |
| --- | --- | --- | --- | --- | --- |
| supervisor | Sí | Sí | Sí | Sí | Sí |
| operador | No | Según `writableBy` | Según `writableBy` | Variables permitidas | No |
| graficos | No | Según `writableBy` | Según `writableBy` | No | No |
| locutor | No | No | No | No | No |
| juez | No | No | No | No | No |
| lectura | No | No | No | No | No |
| system | No | No | No | No | Sí |

Son permisos de arquitectura en memoria; no cambian roles persistentes ni Firebase Rules.

## Action Engine 1.1

La extensión agrega:

- `REGISTER_VARIABLE`
- `SET_VARIABLE`
- `RESET_VARIABLE`
- `DISABLE_VARIABLE`
- `ENABLE_VARIABLE`
- `EXPIRE_VARIABLE`

Cada acción exige `target.variableId` y `payload.expectedRevision`. Las acciones usan idempotencia y auditoría existentes. El registro viaja en paralelo como `variables`; Broadcast State, Preview, Program, outputs y assets no son sustituidos ni modificados por estas acciones.

## Variables iniciales

Production Console crea en memoria:

- `production.message`
- `production.blockTitle`
- `production.interviewName`
- `production.interviewRole`
- `production.activeCamera`
- `production.commercialCue`
- `production.bumperDuration`
- `production.emergencyText`
- `production.nextBroadcast`
- `production.qrAsset`
- `production.selectedSponsor`
- `production.lowerThirdTitle`
- `production.lowerThirdSubtitle`
- `production.customColor`

## Integración con Production Console

El panel Variables de Producción agrupa Textos, Entrevista, Producción y Recursos. Permite guardar, resetear, activar y desactivar. Cada operación despacha una acción y aparece en Últimas acciones.

El panel muestra scope, valor efectivo, procedencia, revisión y expiración. Cambiar una variable no actualiza Preview ni Program; futuras plantillas podrán consumir snapshots controlados.

## Snapshot

`buildProductionVariablesSnapshot()` produce una copia completamente desacoplada del registro, contexto, Action Engine y Production Console:

```json
{
  "snapshotVersion": "1.0.0",
  "generatedAt": "2026-07-13T20:00:00.000Z",
  "context": {},
  "values": {},
  "sourceScopes": {},
  "revisions": {},
  "warnings": [],
  "errors": []
}
```

Solo incluye valores resolubles para la visibilidad solicitada. No incluye URLs firmadas, funciones ni actores en vista pública.

## Seguridad

- No muta inputs.
- Elimina funciones, símbolos y valores no serializables.
- Controla ciclos, profundidad y tamaño de arreglos.
- Bloquea `__proto__`, `constructor` y `prototype`.
- Limita texto, opciones y objetos estructurados.
- Rechaza JavaScript, HTML ejecutable y referencias inseguras.
- Restringe rutas de contrato mediante allowlist.
- Restringe referencias de asset a identidad y versión.
- Conserva `0`, `false`, `""` y `null`.
- No usa `JSON.stringify/parse` como estrategia de clonación.

## Compatibilidad

Action Engine mantiene las 33 acciones de v1.0 y agrega seis acciones compatibles en v1.1. Production Console, Production Navigation, Broadcast Playground, Data Contract, State, Output, Asset Manager, OBS V1 y gráficos V1 continúan operando con sus contratos existentes.

No se crean rutas Firebase, nodos de `live/current`, `publicTournaments` ni persistencia local.

# Broadcast Data Contract v1

## Propósito

El Broadcast Data Contract es la única interfaz de datos autorizada para las futuras plantillas, componentes, salidas Preview/Program, monitores, automatizaciones, consola de producción y gráficos V2 de CharroPro Broadcast Studio.

El contrato transforma el `broadcastContext` actual o un contexto compatible en una proyección estable, segura y serializable. No consulta Firebase, no conoce rutas internas, no depende de HTML y no contiene decisiones de diseño visual. El Core conserva la lógica deportiva y entrega los valores oficiales; el contrato solamente los normaliza.

Los gráficos V1 continúan consumiendo sus estructuras actuales durante la transición. Ninguna plantilla V2 debe depender de `state.js`, `live/current`, scores internos, Firebase o aliases legacy.

## Versión

```text
1.0.0
```

La versión del contrato es independiente de la versión de despliegue de la aplicación. Los cambios aditivos compatibles conservarán la versión mayor. Eliminar campos, cambiar tipos o alterar semántica exige una versión mayor y una migración explícita.

## Construcción

```js
const contract = buildBroadcastDataContract(broadcastContext, {
  visibility: "production",
  outputType: "program",
  includeLegacyAliases: true
});
```

Entradas aceptadas:

- `broadcastContext` actual;
- payload que contenga `broadcastContext`;
- objeto equivalente normalizado;
- contexto legacy parcial.

El builder no modifica la fuente. El resultado contiene únicamente datos serializables, elimina funciones y claves peligrosas, corta referencias circulares y limita profundidad y tamaño de arreglos.

## Estructura raíz

```json
{
  "contractVersion": "1.0.0",
  "generatedAt": "2026-07-12T18:00:00.000Z",
  "revision": 0,
  "visibility": "production",
  "source": {},
  "tournament": {},
  "organization": {},
  "competition": {},
  "charreada": {},
  "participant": {},
  "team": {},
  "charro": {},
  "horse": {},
  "suerte": {},
  "score": {},
  "scoreDetail": {},
  "ranking": {},
  "timer": {},
  "sponsor": {},
  "branding": {},
  "production": {},
  "system": {},
  "customFields": {},
  "warnings": [],
  "errors": [],
  "legacy": {},
  "legacyAliases": {}
}
```

`legacyAliases` existe únicamente cuando se solicita con `includeLegacyAliases: true`.

## Convenciones

- Todos los timestamps normalizados usan ISO-8601 UTC.
- `null` indica campo conocido sin dato confiable disponible.
- Cero, `false` y cadena vacía son valores presentes y válidos.
- Los arreglos sin datos usan `[]`.
- `getBroadcastField()` usa fallback solo cuando la ruta está ausente o su valor es `undefined`; un campo presente con `null` devuelve `null`.
- Los IDs son strings cuando existen.
- Los totales se toman del score oficial; el contrato no los recalcula.
- Los campos condicionales dependen del scope, la suerte o la disponibilidad de la fuente.
- `Requerido` aplica cuando el nivel solicitado autoriza la ruta; un contrato sanitizado puede omitir módulos y campos de niveles superiores.

## Metadatos raíz

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Visibilidad | Origen | Fallback | Ejemplo | Compatibilidad |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| contractVersion | Versión del contrato | string | Sí | public | Builder | `1.0.0` | `1.0.0` | Valida compatibilidad V2 |
| generatedAt | Generado en | string ISO | Sí | public | Builder | Hora UTC actual | `2026-07-12T18:00:00.000Z` | No usa hora local ambigua |
| revision | Revisión | number | Sí | production | Fuente/timer | `0` | `17` | Comparable cuando la fuente la provee |
| visibility | Visibilidad efectiva | enum | Sí | public | Options | `production` | `public` | Cuatro niveles oficiales |
| source.type | Tipo de fuente | string | Sí | production | Detector | `legacyPartial` | `broadcastContext` | También `livePayload` y `broadcastContract` |
| source.version | Versión de fuente | string/null | No | operational | Fuente | `null` | `20260712...` | Se elimina en public y production |
| source.generatedAt | Fecha de fuente | string ISO/null | No | production | Fuente | `null` | `2026-07-12T17:59:59.000Z` | No se inventa |
| source.freshness | Frescura | enum | Sí | production | Fuente/timestamp | `unknown` | `current` | `current`, `stale`, `unknown` |
| source.available | Fuente disponible | boolean | Sí | production | Detector | `false` | `true` | Indica contexto utilizable |
| warnings | Advertencias | string[] | Sí | production | Builder/validador | `[]` | `["legacy-context"]` | No bloquean campos opcionales |
| errors | Errores | string[] | Sí | operational | Validador | `[]` | `["contract-version-incompatible"]` | No se incluye en public ni production |
| legacy.used | Compatibilidad usada | boolean | Sí | production | Builder | `false` | `true` | Señala fallback legacy |
| legacy.fallbacks | Fallbacks usados | string[] | Sí | production | Builder | `[]` | `["competition:id-from-type"]` | Diagnóstico transitorio |
| legacy.sourceShape | Forma de fuente | string | Sí | production | Detector | `legacyPartial` | `broadcastContext` | No es ruta Firebase |
| legacy.aliasesIncluded | Aliases incluidos | boolean | Sí | production | Options | `false` | `true` | Solo transición V1/V2 |

## Tournament

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Visibilidad | Origen | Fallback | Ejemplo | Notas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| tournament.id | ID del torneo | string/null | Condicional | public | Torneo | `null` | `torneo_abc` | Esperado cuando hay torneo activo |
| tournament.name | Nombre del torneo | string/null | No | public | Torneo | `null` | `Millonario 2026` | No inventa título |
| tournament.type | Tipo de torneo | string/null | No | public | Torneo | `null` | `completo` | No sustituye competencia interna |
| tournament.status | Estado del torneo | string/null | No | public | Torneo | `null` | `en_vivo` | Conserva origen |
| tournament.startDate | Fecha inicial | string/null | No | public | Torneo | `null` | `2026-07-12` | Sin interpretación local |
| tournament.endDate | Fecha final | string/null | No | public | Torneo | `null` | `2026-07-14` | Opcional |
| tournament.venue | Sede/lienzo | string/null | No | public | Torneo | `null` | `Lienzo Charro` | Usa sede disponible |
| tournament.city | Ciudad | string/null | No | public | Torneo | `null` | `Guadalajara` | Opcional |
| tournament.state | Estado/región | string/null | No | public | Torneo | `null` | `Jalisco` | No confundir con status |
| tournament.country | País | string/null | No | public | Torneo | `null` | `México` | Opcional |
| tournament.logo | Logo | string/null | No | public | Torneo | `null` | `/assets/logo.png` | Asset Manager futuro |
| tournament.slug | Slug | string/null | No | public | Torneo | `null` | `millonario-2026` | No se genera automáticamente |
| tournament.organizerName | Organizador | string/null | No | public | Torneo | `null` | `Orgullo Charro` | Nombre organizativo |

## Organization

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Visibilidad | Origen | Fallback | Ejemplo | Notas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| organization.id | ID de organización | string/null | No | public | Organización | `null` | `org_1` | Solo identificador deportivo autorizado |
| organization.name | Organización | string/null | No | public | Organización/organizador | `null` | `Orgullo Charro` | Sin datos personales inferidos |
| organization.shortName | Nombre corto | string/null | No | public | Organización | `null` | `OC` | Opcional |
| organization.logo | Logo | string/null | No | public | Organización | `null` | `/assets/oc.png` | Asset Manager futuro |
| organization.type | Tipo | string/null | No | public | Organización | `null` | `productor` | Conserva origen |
| organization.tenantId | Tenant | string/null | No | restricted | Organización | `null` | `tenant_1` | Aislamiento interno; nunca público |
| organization.clientId | Cliente | string/null | No | restricted | Organización | `null` | `client_1` | Aislamiento interno; nunca público |

## Competition

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Visibilidad | Origen | Fallback | Ejemplo | Notas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| competition.id | ID de competencia | string/null | Condicional | public | Competencia/jornada | Tipo normalizado | `charro_completo` | Legacy cae a `equipos_completo` |
| competition.type | Tipo | string | Condicional | public | Competencia | `equipos_completo` | `caladero` | Catálogo actual |
| competition.name | Nombre | string/null | No | public | Competencia/catálogo | Nombre canónico | `Charro Completo` | No es nombre de jornada |
| competition.scope | Scope | enum | Condicional | public | Competencia | `team` | `individual` | `team`, `individual`, `exhibition` |
| competition.category | Categoría | string/null | No | public | Competencia/jornada | `null` | `Juvenil` | Texto actual |
| competition.phase | Fase | string/null | No | public | Competencia/jornada | `null` | `Semifinal` | No inventa fase |
| competition.round | Ronda | string/null | No | public | Competencia | `null` | `Ronda 2` | Opcional |
| competition.status | Estado | string/null | No | public | Competencia/jornada | `null` | `en_vivo` | Conserva origen |
| competition.suerteIds | Suertes | string[] | Sí | public | Jornada/competencia/catálogo | Catálogo del tipo | `["cala"]` | Charro Completo excluye Terna/Yegua |
| competition.participantCount | Participantes | number/null | No | public | Competencia/jornada | `null` | `12` | Individual |
| competition.teamCount | Equipos | number/null | No | public | Competencia/jornada | `null` | `3` | Team |
| competition.affectsTeamRanking | Afecta ranking team | boolean/null | No | production | Competencia/catálogo | Según tipo | `false` | Metadata, no cálculo |
| competition.affectsGeneralStatistics | Afecta estadísticas | boolean/null | No | production | Competencia/catálogo | Según tipo | `true` | Metadata, no cálculo |

## Charreada

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Visibilidad | Origen | Fallback | Ejemplo | Notas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| charreada.id | ID de jornada | string/null | Condicional | public | Charreada activa | `null` | `charreada_1` | Acepta `charreadaId` legacy |
| charreada.name | Nombre | string/null | No | public | Charreada | `null` | `Charreada 1` | No es competencia |
| charreada.status | Estado | string/null | No | public | Charreada | `null` | `en_vivo` | Conserva origen |
| charreada.date | Fecha | string/null | No | public | Charreada | `null` | `2026-07-12` | Opcional |
| charreada.startTime | Inicio | string/null | No | public | Charreada | `null` | `12:00` | Según fuente |
| charreada.endTime | Término | string/null | No | public | Charreada | `null` | `14:30` | Opcional |
| charreada.order | Orden | number/null | No | public | Charreada | `null` | `1` | No ordena por nombre |
| charreada.phase | Fase | string/null | No | public | Charreada/competencia | `null` | `Fase 1` | Compatibilidad con `fase` |
| charreada.category | Categoría | string/null | No | public | Charreada/competencia | `null` | `AAA` | Opcional |
| charreada.active | Activa | boolean/null | No | public | Contexto actual | `null` | `true` | Contexto activo puede inferir `true` |
| charreada.competitionId | Competencia | string/null | No | public | Charreada/competencia | `null` | `caladero_libre` | Relación estable |
| charreada.competitionType | Tipo competencia | string/null | No | public | Charreada/competencia | `null` | `caladero` | Compatibilidad |
| charreada.suerteIds | Suertes | string[] | Sí | public | Charreada/competencia | `[]` | `["colas"]` | IDs oficiales |

## Participant

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Visibilidad | Origen | Fallback | Ejemplo | Notas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| participant.id | ID de participante | string/null | Individual | public | Participante | `null` | `participant_1` | No usa teamId |
| participant.name | Participante/ejecutante | string/null | Condicional | public | Participante actual | `null` | `Luis Martínez` | En team puede ser el charro actual |
| participant.alias | Alias | string/null | No | public | Participante | `null` | `El Güero` | Opcional |
| participant.scope | Scope | string/null | No | public | Participante/competencia | `null` | `individual` | No convierte equipo en individuo |
| participant.category | Categoría | string/null | No | public | Participante | `null` | `Libre` | Opcional |
| participant.association | Asociación | string/null | No | public | Participante | `null` | `Asociación Norte` | Campo actual |
| participant.number | Número | string/null | No | public | Participante | `null` | `14` | Puede contener formato no numérico |
| participant.order | Orden | number/null | No | public | Participante | `null` | `2` | Orden de participación |
| participant.photo | Fotografía | string/null | No | public | Participante | `null` | `/assets/charro.jpg` | Solo fuente autorizada |
| participant.active | Activo | boolean/null | No | public | Contexto | `null` | `true` | Opcional |
| participant.total | Total | number/null | No | public | Resultado oficial | `null` | `42` | No se recalcula |
| participant.position | Posición | number/null | No | public | Ranking oficial | `null` | `1` | No se recalcula |

## Team

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Visibilidad | Origen | Fallback | Ejemplo | Notas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| team.id | ID de equipo | string/null | Team | public | Equipo actual | `null` | `equipo_1` | Siempre `null` en individual |
| team.name | Equipo | string/null | Team | public | Equipo actual | `null` | `Rancho El Ejemplo` | No se usa como individuo |
| team.shortName | Nombre corto | string/null | No | public | Equipo | `null` | `REE` | Opcional |
| team.logo | Logo | string/null | No | public | Equipo | `null` | `/assets/equipo.png` | Asset Manager futuro |
| team.category | Categoría | string/null | No | public | Equipo | `null` | `AAA` | Opcional |
| team.association | Asociación | string/null | No | public | Equipo | `null` | `Asociación Centro` | Opcional |
| team.order | Orden | number/null | No | public | Equipo | `null` | `2` | Orden de participación |
| team.total | Total | number/null | No | public | Resultado oficial | `null` | `303` | No se recalcula |
| team.position | Posición | number/null | No | public | Ranking oficial | `null` | `1` | No se recalcula |
| team.active | Activo | boolean/null | No | public | Contexto | `null` | `true` | Opcional |
| team.members | Integrantes | array | No | production | Equipo | `[]` | `[{"name":"Juan"}]` | Proyección serializable |

## Charro

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Visibilidad | Origen | Fallback | Ejemplo | Notas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| charro.id | ID de charro | string/null | No | public | Datos actuales | `null` | `charro_1` | Master Data futuro |
| charro.name | Nombre del charro | string/null | No | public | Charro/ejecutante team | `null` | `José González` | No duplica individual sin diferencia real |
| charro.firstName | Nombre desglosado | string/null | No | production | Charro | `null` | `José` | El nombre deportivo público usa `charro.name` |
| charro.lastName | Apellidos desglosados | string/null | No | production | Charro | `null` | `González` | El nombre deportivo público usa `charro.name` |
| charro.alias | Alias | string/null | No | public | Charro | `null` | `El Güero` | Opcional |
| charro.photo | Fotografía | string/null | No | public | Charro | `null` | `/assets/charro.jpg` | Solo con autorización |
| charro.association | Asociación | string/null | No | public | Charro/participante | `null` | `Asociación Centro` | Opcional |
| charro.category | Categoría | string/null | No | public | Charro/participante | `null` | `AAA` | Opcional |
| charro.active | Activo | boolean/null | No | public | Contexto | `null` | `true` | Opcional |

## Horse

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Visibilidad | Origen | Fallback | Ejemplo | Notas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| horse.id | ID de caballo | string/null | No | production | Caballo | `null` | `horse_1` | Nunca se inventa |
| horse.name | Caballo | string/null | No | public | Caballo/participante | `null` | `Relámpago` | Puede venir de `horseName` |
| horse.photo | Fotografía | string/null | No | public | Caballo | `null` | `/assets/horse.jpg` | Opcional |
| horse.owner | Propietario | string/null | No | restricted | Caballo | `null` | `Propietario registrado` | Se elimina en public/production |
| horse.breeder | Criador | string/null | No | restricted | Caballo | `null` | `Criadero X` | Se elimina en public/production |
| horse.category | Categoría | string/null | No | public | Caballo | `null` | `Libre` | Opcional |
| horse.active | Activo | boolean/null | No | public | Contexto | `null` | `true` | Opcional |

## Suerte

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Visibilidad | Origen | Fallback | Ejemplo | Notas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| suerte.id | ID de suerte | string/null | Condicional | public | Suerte activa | `null` | `cala` | IDs oficiales |
| suerte.name | Suerte | string/null | No | public | Suerte | `null` | `Cala de Caballo` | Nombre visible |
| suerte.order | Orden | number/null | No | public | Catálogo/contexto | `null` | `1` | Opcional |
| suerte.status | Estado | string/null | No | public | Contexto | `null` | `en_curso` | Conserva origen |
| suerte.active | Activa | boolean/null | No | public | Contexto | `null` | `true` | Opcional |
| suerte.completed | Terminada | boolean/null | No | public | Contexto | `null` | `false` | Opcional |
| suerte.attempt | Intento actual | number/null | No | public | Contexto | `null` | `2` | No cuenta intentos |
| suerte.maxAttempts | Máximo intentos | number/null | No | public | Suerte/contexto | `null` | `3` | Metadata existente |

## Score

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Visibilidad | Origen | Fallback | Ejemplo | Notas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| score.id | ID de score | string/null | No | production | Score publicado | `null` | `score_1` | Alias de `scoreId` actual |
| score.basePoints | Puntos base | number/null | No | public | Score/breakdown | `null` | `25` | Cero válido |
| score.additionalPoints | Adicionales | number/null | No | public | Score/breakdown | `null` | `4` | No se recalcula |
| score.infractions | Infracciones | serializable/null | No | public | Score/breakdown | `null` | `1` | Número u objeto real |
| score.penalties | Penalizaciones | serializable/null | No | public | Score individual/general | `null` | `[]` | No recibe team penalties en individual |
| score.teamPenalties | Penalizaciones equipo | serializable/null | No | production | Score team | `null` | `[{"pts":5}]` | Separadas de individuales |
| score.total | Total oficial | number/null | Condicional | public | Score publicado | `null` | `28` | Nunca se recalcula; cero válido |
| score.time | Tiempo del score | serializable/null | No | public | Score | `null` | `00:18.2` | No recalcula timer |
| score.attempts | Intentos | serializable/null | No | public | Score | `null` | `3` | Contador o estructura real |
| score.status | Estado | string/null | No | public | Score | `null` | `published` | Conserva origen |
| score.published | Publicado | boolean/null | No | public | Score | `null` | `true` | No se infiere sin fuente |
| score.timestamp | Fecha | string ISO/null | No | public | Score | `null` | `2026-07-12T18:00:00.000Z` | UTC |
| score.judgeId | ID juez | string/null | No | operational | Score | `null` | `judge_1` | Se elimina en public/production |
| score.judgeName | Juez | string/null | No | operational | Score | `null` | `Juez autorizado` | Se elimina en public/production |
| score.participantId | Participante | string/null | Individual | public | Score/participante | `null` | `participant_1` | `null` en team |
| score.teamId | Equipo | string/null | Team | public | Score/equipo | `null` | `equipo_1` | `null` en individual |
| score.suerteId | Suerte | string/null | No | public | Score/suerte | `null` | `cala` | ID oficial |
| score.competitionId | Competencia | string/null | No | public | Score/competencia | `null` | `caladero_libre` | Evita mezclas |
| score.competitionType | Tipo competencia | string/null | No | public | Score/competencia | `null` | `caladero` | Metadata |
| score.participantScope | Scope del score | string/null | No | public | Score/competencia | `null` | `individual` | Team vs individual |

## ScoreDetail

`scoreDetail` conserva bloques técnicos anidados. No se aplana y no duplica automáticamente todo `score`.

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Visibilidad | Origen | Fallback | Ejemplo | Notas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| scoreDetail.attempt | Intento técnico | object/null | No | production | Score publicado | Ausente | `{"punta":{}}` | Cala, Colas, Piales y otras |
| scoreDetail.breakdown | Desglose | object/null | No | production | Score publicado | Ausente | `{"base":25,"total":28}` | Total oficial |
| scoreDetail.evidence | Evidencia | serializable/null | No | operational | Score | Ausente | `[{"type":"timer"}]` | Se elimina en public |
| scoreDetail.timeEvidence | Evidencia tiempo | serializable/null | No | operational | Score | Ausente | `[{"timeMs":18200}]` | Se elimina en public |
| scoreDetail.raw | Fuente cruda | serializable/null | No | restricted | Fuente | Ausente | `{}` | Se elimina en public/production |
| scoreDetail.* | Bloque adicional | serializable | No | production | Fuente | Ausente | `{"coleadores":[]}` | Solo datos reales y seguros |

Para Cala se conservan, cuando existen, punta, adicionales, infracciones, penalizaciones, tiempo, evidencia y desglose. El contrato no interpreta ni recalcula esos campos.

## Ranking

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Visibilidad | Origen | Fallback | Ejemplo | Notas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ranking.scope | Scope ranking | string/null | No | public | Ranking/competencia | Scope actual | `team` | No mezcla team/individual |
| ranking.type | Tipo ranking | string/null | No | public | Ranking/competencia | Tipo actual | `charro_completo` | Opcional |
| ranking.currentPosition | Posición actual | number/null | No | public | Ranking | `null` | `1` | Puede usar entry actual |
| ranking.previousPosition | Posición anterior | number/null | No | public | Ranking | `null` | `2` | No se inventa |
| ranking.movement | Movimiento | string/null | No | public | Ranking | `null` | `up` | No se calcula si falta |
| ranking.total | Total actual | number/null | No | public | Ranking | `null` | `303` | No se recalcula |
| ranking.differenceToLeader | Diferencia líder | number/null | No | public | Ranking | `null` | `-4` | No se calcula si falta |
| ranking.entries | Entradas | array | Sí | public | Ranking | `[]` | `[{"position":1}]` | Proyección limitada |
| ranking.entries[].id | ID entrada | string/null | Condicional | public | Participante/equipo | `null` | `equipo_1` | Según scope |
| ranking.entries[].name | Nombre | string/null | No | public | Participante/equipo | `null` | `Rancho El Ejemplo` | Visible |
| ranking.entries[].scope | Scope | string | Sí | public | Competencia | Scope actual | `individual` | Consistente en la lista |
| ranking.entries[].position | Posición | number/null | No | public | Ranking/orden recibido | Índice + 1 | `1` | Fallback de presentación |
| ranking.entries[].total | Total | number/null | No | public | Ranking oficial | `null` | `303` | Cero válido |
| ranking.entries[].category | Categoría | string/null | No | public | Entrada | `null` | `AAA` | Opcional |
| ranking.entries[].association | Asociación | string/null | No | public | Entrada | `null` | `Asociación Norte` | Opcional |
| ranking.entries[].teamId | Equipo | string/null | Team | public | Entrada team | `null` | `equipo_1` | `null` en individual |
| ranking.entries[].participantId | Participante | string/null | Individual | public | Entrada individual | `null` | `participant_1` | `null` en team |

## Timer

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Visibilidad | Origen | Fallback | Ejemplo | Notas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| timer.id | ID cronómetro | string/null | No | production | Timer | `null` | `timer_1` | Opcional |
| timer.value | Valor | number/null | No | public | Timer | `null` | `15000` | Unidades de la fuente actual |
| timer.elapsed | Transcurrido | number/null | No | public | Timer | `null` | `15000` | No se recalcula |
| timer.remaining | Restante | number/null | No | public | Timer | `null` | `45000` | No se recalcula |
| timer.running | En marcha | boolean/null | No | public | Timer | `null` | `true` | Conserva fuente |
| timer.paused | Pausado | boolean/null | No | public | Timer | `null` | `false` | Conserva fuente cuando existe |
| timer.startedAt | Inicio | string ISO/null | No | production | Timer | `null` | `2026-07-12T17:59:45.000Z` | UTC |
| timer.updatedAt | Actualizado | string ISO/null | No | production | Timer | `null` | `2026-07-12T18:00:00.000Z` | Detecta obsolescencia |
| timer.limit | Límite | number/null | No | public | Timer | `null` | `60000` | No se interpreta |
| timer.status | Estado | string/null | No | public | Timer | `null` | `running` | Opcional |
| timer.display | Texto de tiempo | string/null | No | public | Timer | `null` | `00:15.0` | Fallback visual existente |
| timer.revision | Revisión | number | Sí | production | Timer | `0` | `3` | Sincronía |
| timer.source | Fuente timer | serializable/null | No | operational | Timer | `null` | `{"type":"remote"}` | Sin secretos |

## Sponsor

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Visibilidad | Origen | Fallback | Ejemplo | Notas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| sponsor.active | Patrocinador activo | object/null | No | public | Sponsor | `null` | `{"name":"Marca"}` | Opcional |
| sponsor.primary | Patrocinador principal | object/null | No | public | Sponsor | `null` | `{"name":"Marca"}` | Opcional |
| sponsor.list | Patrocinadores | array | Sí | public | Sponsor(s) | `[]` | `[]` | Según scope de origen |
| sponsor.*.id | ID | string/null | No | public | Sponsor | `null` | `sponsor_1` | Aplica a active/primary/list |
| sponsor.*.name | Nombre | string/null | No | public | Sponsor | `null` | `Patrocinador` | Visible |
| sponsor.*.logo | Logo | string/null | No | public | Sponsor | `null` | `/assets/sponsor.png` | Asset Manager futuro |
| sponsor.*.website | Sitio | string/null | No | public | Sponsor | `null` | `https://example.com` | Opcional |
| sponsor.*.campaign | Campaña | string/null | No | production | Sponsor | `null` | `Verano 2026` | Opcional |
| sponsor.*.scope | Scope | string/null | No | production | Sponsor | `null` | `competition` | Opcional |
| sponsor.*.priority | Prioridad | number/null | No | production | Sponsor | `null` | `10` | No decide rotación |
| sponsor.*.active | Activo | boolean/null | No | public | Sponsor | `null` | `true` | Opcional |
| sponsor.*.metadata | Metadata | serializable/null | No | production | Sponsor | `null` | `{}` | Limitada y segura |

## Branding

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Visibilidad | Origen | Fallback | Ejemplo | Notas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| branding.themeId | Tema | string/null | No | public | Branding/config | `null` | `theme_gold` | Theme Engine futuro |
| branding.primaryColor | Color primario | string/null | No | public | Branding | `null` | `#D4AF37` | Sin herencia todavía |
| branding.secondaryColor | Color secundario | string/null | No | public | Branding | `null` | `#111111` | Opcional |
| branding.accentColor | Color acento | string/null | No | public | Branding | `null` | `#FFFFFF` | Opcional |
| branding.backgroundColor | Fondo | string/null | No | public | Branding | `null` | `#000000` | Opcional |
| branding.textColor | Texto | string/null | No | public | Branding | `null` | `#FFFFFF` | Opcional |
| branding.logo | Logo | string/null | No | public | Branding | `null` | `/assets/logo.png` | Asset Manager futuro |
| branding.watermark | Marca de agua | string/null | No | public | Branding | `null` | `/assets/watermark.png` | Opcional |
| branding.typography | Tipografía | serializable/null | No | public | Branding | `null` | `{"family":"Inter"}` | Sin CSS arbitrario |
| branding.backgrounds | Fondos | serializable | No | public | Branding | `[]` | `[]` | Asset Manager futuro |
| branding.iconSet | Iconos | string/null | No | public | Branding | `null` | `charropro` | Opcional |

## Production

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Visibilidad | Origen | Fallback | Ejemplo | Notas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| production.sessionId | Sesión | string/null | No | production | Producción/options | `null` | `session_1` | Se elimina en public |
| production.outputId | Salida | string/null | No | production | Producción/options | `null` | `program_1` | Se elimina en public |
| production.outputType | Tipo salida | string/null | No | production | Producción/options | `null` | `program` | Contexto de salida |
| production.preview | Preview | serializable/null | No | production | Producción | `null` | `{}` | Broadcast State futuro |
| production.program | Program | serializable/null | No | production | Producción | `null` | `{}` | Broadcast State futuro |
| production.activeGraphic | Gráfico activo | serializable/null | No | production | Producción | `null` | `{}` | No implementa state |
| production.visibleGraphics | Gráficos visibles | serializable | No | production | Producción | `[]` | `[]` | No implementa layers |
| production.activeLayers | Capas activas | serializable | No | production | Producción | `[]` | `[]` | Layers futuro |
| production.mode | Modo | string/null | No | production | Producción | `null` | `manual` | Opcional |
| production.automationEnabled | Automatización | boolean/null | No | production | Producción | `null` | `false` | No ejecuta automatizaciones |
| production.operatorId | ID operador | string/null | No | operational | Producción | `null` | `user_1` | Se elimina en public |
| production.operatorName | Operador | string/null | No | operational | Producción | `null` | `Operador` | Se elimina en public |
| production.status | Estado | string/null | No | production | Producción | `null` | `ready` | Opcional |
| production.liveChannel | Canal live | string/null | No | production | Contexto actual | `null` | `torneo_abc` | Alias operativo actual |
| production.currentTurnId | ID turno | string/null | No | production | Contexto actual | `null` | `equipo_1` | Según scope |
| production.currentTurnName | Turno | string/null | No | production | Contexto actual | `null` | `Rancho El Ejemplo` | No altera identidad |
| production.updatedAt | Actualización | string ISO/null | No | production | Contexto actual | `null` | `2026-07-12T18:00:00.000Z` | Frescura |

## System

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Visibilidad | Origen | Fallback | Ejemplo | Notas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| system.online | En línea | boolean/null | No | public | Sistema | `null` | `true` | Estado mínimo seguro |
| system.firebaseConnected | Firebase conectado | boolean/null | No | operational | Sistema | `null` | `true` | Se elimina en public |
| system.syncStatus | Sincronización | string/null | No | public | Sistema | `null` | `connected` | Estado público mínimo; no incluye Firebase ni latencia |
| system.appVersion | Versión app | string/null | No | production | Options/sistema | `null` | `20260712...` | No es contractVersion |
| system.contractVersion | Versión contrato | string | Sí | public | Builder | `1.0.0` | `1.0.0` | Igual a raíz |
| system.sourceVersion | Versión fuente | string/null | No | operational | Fuente | `null` | `v1` | Se elimina en public |
| system.lastUpdate | Última actualización | string ISO/null | No | public | Fuente/builder | Build time | `2026-07-12T18:00:00.000Z` | UTC |
| system.latency | Latencia | number/null | No | operational | Sistema | `null` | `20` | Se elimina en public |
| system.warnings | Advertencias sistema | string[] | Sí | operational | Sistema | `[]` | `[]` | No sustituye warnings raíz |
| system.errors | Errores sistema | string[] | Sí | restricted | Sistema | `[]` | `[]` | Solo administración interna |
| system.diagnostics | Diagnóstico | serializable/null | No | restricted | Sistema | `null` | `{}` | Solo administración interna; nunca público |

## Custom Fields

Scopes canónicos:

```text
global
organization
tournament
competition
charreada
participant
team
horse
score
production
session
```

Cada scope siempre existe como objeto. Si la fuente trae campos sin scope, se colocan temporalmente en `global` y se agrega `custom-fields-unscoped`.

| Ruta técnica | Etiqueta en español | Tipo | Requerido | Visibilidad | Origen | Fallback | Ejemplo | Notas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| customFields.{scope}.{key}.key | Clave | string | Sí | Según campo | Custom field | Clave del mapa | `transmisor` | Bloquea claves peligrosas |
| customFields.{scope}.{key}.label | Etiqueta | string/null | No | Según campo | Custom field | `null` | `Canal` | Opcional |
| customFields.{scope}.{key}.dataType | Tipo | string | Sí | Según campo | Campo/inferencia | Tipo inferido | `string` | Sin funciones |
| customFields.{scope}.{key}.value | Valor | serializable/null | No | Según campo | Custom field | `null` | `Canal 1` | Profundidad limitada |
| customFields.{scope}.{key}.scope | Scope | string | Sí | Según campo | Contenedor | Scope actual | `tournament` | Canónico |
| customFields.{scope}.{key}.visibility | Visibilidad | enum | Sí | Según campo | Campo | `production` | `public` | Filtrado declarativo |
| customFields.{scope}.{key}.description | Descripción | string/null | No | Según campo | Campo | `null` | `Canal al aire` | Opcional |
| customFields.{scope}.{key}.source | Origen | string/null | No | Según campo | Campo | `null` | `operator` | No es ruta Firebase |
| customFields.{scope}.{key}.required | Requerido | boolean | Sí | Según campo | Campo | `false` | `true` | No bloquea el contrato |
| customFields.{scope}.{key}.defaultValue | Default | serializable/null | No | Según campo | Campo | `null` | `Canal 1` | No inventa datos deportivos |
| customFields.{scope}.{key}.validation | Validación | object | Sí | Según campo | Campo | `{}` | `{"maxLength":50}` | Declarativa y limitada |

Se eliminan `__proto__`, `constructor` y `prototype`. No se aceptan funciones, símbolos, ciclos o profundidad ilimitada.

## Legacy aliases

Bloque opcional y temporal. Las plantillas nuevas no deben usarlo.

| Ruta técnica | Significado | Fallback |
| --- | --- | --- |
| legacyAliases.teamName | Nombre de equipo en scope team | `null` |
| legacyAliases.participantName | Participante/ejecutante | `null` |
| legacyAliases.horseName | Caballo | `null` |
| legacyAliases.competitionType | Tipo de competencia | `equipos_completo` por fallback explícito |
| legacyAliases.competitionScope | Scope | `team` por fallback explícito |
| legacyAliases.totalPoints | Total oficial | `null` |
| legacyAliases.timerValue | Valor del timer | `null` |

## Visibilidad

### Precedencia de visibilidad

La matriz declarativa aplica esta precedencia acumulativa:

`public < production < operational < restricted`

- `public` conserva únicamente rutas declaradas como públicas.
- `production` conserva rutas `public` y `production`.
- `operational` conserva rutas `public`, `production` y `operational`.
- `restricted` conserva todas las rutas canónicas autorizadas.

Las rutas no declaradas se eliminan por defecto. Solo los subárboles serializables expresamente registrados pueden heredar la visibilidad de su contenedor. Esta regla evita que un campo nuevo se publique accidentalmente.

### Public

Conserva datos deportivos y branding aptos para salida pública. Elimina:

- `production` completo, incluidos operador, sesión, outputs, Preview, Program y layers;
- juez, ID interno del score y penalizaciones de equipo operativas;
- `scoreDetail` completo;
- roster interno `team.members`;
- ID, propietario y criador del caballo;
- `tenantId` y `clientId`;
- diagnóstico, errores, advertencias internas, Firebase y latencia;
- custom fields no públicos.

Conserva `score.total` sin recalcular, `score.published`, estado mínimo (`system.online`, `system.syncStatus`, `system.contractVersion`, `system.lastUpdate`) y branding autorizado.

### Production

Conserva datos públicos, `scoreDetail.attempt`, `scoreDetail.breakdown`, `team.members`, ID del score, penalizaciones de equipo y contexto de producción. Elimina operador, juez, evidencia operacional, datos privados de organización/caballo, raw y diagnósticos restringidos.

### Operational

Agrega operador, juez, evidencia técnica, fuente del cronómetro, estado Firebase, latencia y advertencias operativas. No incluye `tenantId`, `clientId`, propietario/criador, `scoreDetail.raw`, errores internos ni `system.diagnostics` porque son `restricted`.

### Restricted

Conserva toda la proyección canónica segura y serializable, incluidos datos privados y diagnósticos autorizados. No recupera funciones, secretos, prototipos o claves eliminadas.

La sanitización siempre devuelve una copia y nunca modifica el contrato recibido.

## Helpers públicos

### `getBroadcastField(contract, path, fallback)`

Lee rutas con punto sin lanzar errores. Conserva cero, `false`, cadena vacía y `null`. Usa fallback solo si la ruta no existe o vale `undefined`.

### `hasBroadcastField(contract, path)`

Distingue campo ausente de campo presente con `null`, cero o `false`. Bloquea segmentos peligrosos.

### `listAvailableBroadcastFields(contract)`

Devuelve rutas de hojas ordenadas. Los arreglos usan notación estable `[]`, por ejemplo `ranking.entries[].name`. Un contrato sanitizado no lista campos eliminados.

### `validateBroadcastDataContract(contract)`

Devuelve:

```json
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "contractVersion": "1.0.0"
}
```

Valida estructura raíz, versión, timestamps, revisión, visibilidad, módulos, arreglos, números, scope, separación team/individual, suertes de Charro Completo, profundidad y claves peligrosas. Los campos opcionales ausentes producen warnings, no errores.

### `getBroadcastContractWarnings(contract)`

Combina warnings de construcción con estas detecciones:

- `tournament-missing`;
- `competition-id-missing`;
- `individual-participant-missing`;
- `team-missing`;
- `suerte-missing`;
- `score-incomplete`;
- `timer-stale`;
- `contract-version-incompatible`;
- `legacy-context`;
- `source-freshness-unknown`;
- `source-unavailable`;
- advertencias de sanitización y custom fields.

## Seguridad e inmutabilidad

- La fuente se clona sin usar `JSON.stringify/parse` como única estrategia.
- Date se conserva como ISO, bigint como string y solo pasan números finitos.
- Se eliminan funciones, símbolos, ciclos y claves peligrosas.
- La profundidad general se limita a 12 niveles y custom fields a 6.
- Cada arreglo se limita a 250 elementos.
- No se recorren históricos completos ni la base de datos.
- La salida es una proyección serializable del contexto actual.
- La sanitización crea otra copia.
- Ninguna función consulta Firebase o muta `state.js`.

## Compatibilidad team frente a individual

### Team

- `competition.scope` es `team`.
- `team.id` y `team.name` identifican la unidad competitiva.
- `score.teamId` se publica y `score.participantId` queda `null`.
- `participant` puede describir al ejecutante actual sin volverlo competidor individual.
- Ranking publica `teamId` y deja `participantId` en `null`.

### Individual

- `competition.scope` es `individual`.
- `participant.id` identifica la unidad competitiva.
- `team` queda con identidad `null` y miembros vacíos.
- `score.participantId` se publica y `score.teamId` queda `null`.
- Ranking publica `participantId` y deja `teamId` en `null`.
- El caballo puede resolverse desde `horse` o `horseName` sin inventar `horse.id`.

### Legacy

Sin metadata competitiva se usa explícitamente:

```json
{
  "id": "equipos_completo",
  "type": "equipos_completo",
  "scope": "team"
}
```

También se activa `legacy.used`, se registra el fallback y se agrega `legacy-context`.

## Rendimiento

El contrato representa solo el contexto actual. Los builders recorren una vez los arreglos necesarios, eliminan históricos ajenos al render y aplican límites. Puede reconstruirse ante cambios de turno, competencia, score, ranking, cronómetro o jornada sin consultar Firebase.

## Integración actual

`js/core/sync.js` mantiene este flujo:

```text
Core actual
-> buildBroadcastContext()
-> buildBroadcastDataContract()
-> live/current.broadcastContract
```

`broadcastContext`, campos planos y gráficos V1 permanecen intactos. `broadcastContract` se agrega como bloque nuevo con visibilidad `production`, output `program` y aliases legacy explícitos durante la transición.

## Ejemplo abreviado team

```json
{
  "contractVersion": "1.0.0",
  "competition": {
    "id": "equipos_completo",
    "type": "equipos_completo",
    "scope": "team"
  },
  "participant": {
    "id": null,
    "name": "José González",
    "scope": "team"
  },
  "team": {
    "id": "equipo_1",
    "name": "Rancho El Ejemplo"
  },
  "score": {
    "participantId": null,
    "teamId": "equipo_1",
    "total": 0
  }
}
```

## Ejemplo abreviado individual

```json
{
  "contractVersion": "1.0.0",
  "competition": {
    "id": "charro_completo",
    "type": "charro_completo",
    "scope": "individual",
    "suerteIds": [
      "cala",
      "piales",
      "colas",
      "toro",
      "manganas_pie",
      "manganas_caballo",
      "paso"
    ]
  },
  "participant": {
    "id": "participant_1",
    "name": "Luis Martínez",
    "scope": "individual"
  },
  "team": {
    "id": null,
    "name": null,
    "members": []
  },
  "horse": {
    "id": null,
    "name": "Relámpago"
  },
  "score": {
    "participantId": "participant_1",
    "teamId": null,
    "total": 42
  }
}
```

## Política para plantillas V2

Una plantilla V2 puede usar únicamente:

- campos oficiales documentados;
- custom fields registrados y visibles;
- helpers públicos del contrato;
- aliases legacy solo durante migración, nunca como dependencia nueva.

Una plantilla V2 no puede consultar Firebase, `state.js`, `live/current`, scores internos, objetos del calificador o propiedades no documentadas.

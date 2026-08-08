# Scoring Attempt V2 Data Contract

## Version

- `attemptSchemaVersion`: `2`
- `contractVersion`: `2.0.0`
- `writeMode`: `official_snapshot_only`

## Estructura

```json
{
  "attemptSchemaVersion": 2,
  "contractVersion": "2.0.0",
  "identity": {},
  "context": {},
  "sportState": {},
  "scoring": {},
  "infractions": [],
  "teamInfractions": [],
  "dq": {},
  "timing": {},
  "evidence": [],
  "note": "",
  "publication": {},
  "auditMetadata": {}
}
```

## Identidad

`identity` contiene `tournamentId`, `competitionId`, `charreadaId`, `participantId`, `teamId`, `suerteId`, `opportunityNumber`, `participantSlot`, `revision` y `attemptId`.

`attemptId` no usa nombres visibles. Se deriva de las claves estables del dominio. Una competencia individual es valida con `participantId` y `teamId: null`.

## Selecciones

Base, adicionales, infracciones y penalizaciones de equipo usan selecciones declarativas:

```json
{
  "selectionId": "selection_A",
  "selectedRuleId": "rule_A",
  "label": "Adicional A",
  "category": "additional",
  "value": 3,
  "resolvedValue": 3,
  "quantity": 1,
  "total": 3,
  "source": "RULE_PROFILE",
  "manual": false,
  "reason": null,
  "timestamp": null,
  "context": {},
  "valueByClassification": null,
  "metadata": {}
}
```

`selectionId` identifica la seleccion. `selectedRuleId` identifica la regla. `resolvedValue` congela el valor efectivo. Los manuales exigen `reason` y no se convierten en reglas permanentes.

## Puntos

- `goodPoints`: base + adicionales + resultado de calculador especializado.
- `individualBadPoints`: suma de `infractions`.
- `teamBadPoints`: suma de `teamInfractions`.
- `netAttemptPoints`: puntos buenos menos infracciones individuales; DQ lo fuerza a cero.
- `teamAdjustedPoints`: neto del intento menos penalizaciones de equipo.

Esta separacion preserva el comportamiento actual: las penalizaciones de equipo no cambian el total individual del intento.

## Contexto reglamentario

`context` conserva scope, categoria, fase, nombres descriptivos, caballo, `ruleProfileId`, `ruleProfileVersion` y `effectiveRulesFingerprint`. El score oficial no consulta de nuevo el perfil para reinterpretar valores.

## Oportunidad y remate

`sportState.opportunity` contiene numero, estado, tipo, `sharedOpportunityId` y `sharedSequenceNumber`. Lazo Cabecero y Pial de Ruedo mantienen scores independientes que pueden referenciar una secuencia compartida.

`sportState.remate` contiene `remateId`, `remateLabel` y metadata declarativa.

## Calculadores y Cala

`scoring.calculationDetail` acepta `type`, `value`, `selections` y `details`. Para Cala, el adapter conserva `puntaPts`, metros y piquetes bajo `type: cala_punta`; el calculo existente no cambia.

## Timing

`timing` puede contener `timerId`, `sharedTimerId`, elapsed/remaining, inicio, fin, estado, texto legacy y ajustes. Solo referencia Timer Engine; no crea ni duplica cronometros.

## Publicacion

`publication.state` es `DRAFT` u `OFFICIAL`. Un oficial exige `frozen: true` y `publishedAt` ISO. El snapshot persiste valores resueltos, labels, sources y metadata necesarios para lectura historica.

## Matriz de campos

| Field | Legacy source | V2 field | Req. | Persisted | Derived | Official freeze | FieldID impact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| tournament | published tournament | identity.tournamentId | Si | Si | No | Si | Ninguno |
| competition | charreada/context | identity.competitionId | Si | Si | No | Si | Ninguno |
| charreada | active context | identity.charreadaId | Si | Si | No | Si | Ninguno |
| participant | individual entry | identity.participantId | Scope | Si | No | Si | Ninguno |
| team | team entry | identity.teamId | Scope | Si | No | Si | Ninguno |
| suerte | active suerte | identity.suerteId | Si | Si | No | Si | Ninguno |
| opportunity | attemptIndex | identity.opportunityNumber | Si | Si | Si | Si | Ninguno |
| base | base/applied/catalog | scoring.baseSelection | No | Si | Adaptado | Si | Ninguno |
| additions | adic/applied/customAdic | scoring.additionalSelections | No | Si | Adaptado | Si | Ninguno |
| infractions | infr/applied/customInfr | infractions | No | Si | Adaptado | Si | Ninguno |
| team bad | teamPenalties | teamInfractions | No | Si | Adaptado | Si | Ninguno |
| DQ | desc | dq + sportState.status | No | Si | Adaptado | Si | Ninguno |
| zero | attempted/notAchieved | sportState.status | No | Si | Adaptado | Si | Ninguno |
| classification | future/legacy fields | sportState.classification | No | Si | No | Si | Ninguno |
| punta | puntaPts/Metros/Piquetes | scoring.calculationDetail | No | Si | Adaptado | Si | Ninguno |
| time | tiempo/timing | timing | No | Si | Adaptado | Si | Ninguno |
| evidence | timeEvidence | evidence | No | Si | Adaptado | Si | Ninguno |
| note | note | note | No | Si | No | Si | Ninguno |
| profile | ruleResolution.profile | context rule profile fields | No | Si | Adaptado | Si | Ninguno |
| points | central calculator | scoring point summary | Si | Si | Si | Si | Ninguno |

## Firebase-safe

La serializacion rechaza funciones, simbolos, BigInt, ciclos, instancias de clase, `Date`, `Map`, `Set`, accessors, claves peligrosas, numeros no finitos, exceso de profundidad/arreglos/claves y `undefined`. Conserva `0`, `false`, `""` y `null`. No usa `JSON.stringify/parse` como unica defensa.

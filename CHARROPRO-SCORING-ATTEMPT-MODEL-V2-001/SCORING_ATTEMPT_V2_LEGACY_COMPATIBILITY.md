# Scoring Attempt V2 Legacy Compatibility

## Politica

No se migran scores historicos ni drafts. La ausencia de `attemptSchemaVersion` identifica un intento legacy. `isScoringAttemptV2()` reconoce version 2 y `adaptLegacyAttemptToV2()` permite lectura normalizada sin mutar el registro.

## Escritura transitoria

- Draft: conserva `state.scores` y `emptyAttempt()` actuales.
- Score oficial: conserva `attempt`, `total` y `breakdown` legacy.
- V2: se agrega en `breakdown.attemptV2` solo durante la publicacion oficial.
- Firebase: `compactPublishedBreakdown()` conserva el snapshot aditivo.
- Autoridad: el servidor sigue usando la publicacion atomica y no recalcula V2.

## Mapeo principal

| Legacy | V2 | Comportamiento |
| --- | --- | --- |
| base + applied | scoring.baseSelection | Regla seleccionada o agregado legacy |
| adic + applied | additionalSelections | Reglas y ajuste agregado si hace falta |
| customAdic | additionalSelections manual | Motivo preservado desde label |
| infr + applied | infractions | Reglas y ajuste agregado si hace falta |
| customInfr | infractions manual | Motivo preservado desde label |
| teamPenalties | teamInfractions | Nunca mezclado con individual |
| desc | dq | DQ explicito, detalle preservado |
| attempted/notAchieved | sport status | Distingue intentado y no logrado |
| punta* | calculationDetail | Cala compatible |
| tiempo | timing.legacyText | Lectura conservadora |
| timeEvidence | evidence | Evidencia no puntua |
| note | note | Sin efecto deportivo |

Cuando el agregado legacy no puede reconstruirse solo con reglas identificadas, el adapter agrega una seleccion `LEGACY_AGGREGATE` por la diferencia exacta. Esto conserva total y auditabilidad sin inventar un Rule Profile ni un FieldID.

## Casos demostrados

- Cala legacy.
- Piales legacy.
- Coleadero legacy.
- Score con infracciones.
- Score con DQ.
- Score con nota.
- Score con evidencia, incluido `timeMs: 0` y texto vacio.
- Competencia individual sin `teamId` en V2.

Cada fixture se compara antes y despues para asegurar no mutacion.

## DQ legacy

La interfaz anterior borraba base/adicionales al aplicar `desc`. El cambio minimo evita esa destruccion. El total visible sigue siendo cero porque `calculateAttemptTotal()` ya considera `desc`; retirar DQ en draft recupera la seleccion original.

## Consumidores

No se modifican contratos de Resultados, historial, supervisor, exportador, Broadcast, Portal Publico ni live feed. Todos siguen leyendo campos legacy. La adopcion de `attemptV2` por cada consumidor requiere tickets posteriores y no bloquea la lectura actual.

## Score protection

No se agrega escritura masiva. El V2 viaja dentro del mismo score individual. El guard aprobado sigue bloqueando el escenario remoto 453 / local 450 y la ausencia local no autoriza eliminacion remota.

## FieldID y ttm

Los 239 FieldID permanecen intactos. No se crean IDs FMCH ni se resuelve la colision `ttm`. Los IDs nuevos pertenecen solo al contrato tecnico y las selecciones reutilizan `ruleId` cuando existe.

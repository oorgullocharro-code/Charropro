# Scoring Attempt V2 Architecture

## Proposito

Scoring Attempt V2 normaliza la semantica de una oportunidad deportiva sin sustituir el scorer existente. Su version inicial es `2.0.0` y su modo de escritura es `official_snapshot_only`.

No existe un `AttemptStore`, un segundo motor de puntuacion ni una ruta Firebase nueva. `js/core/scoringAttempt.js` es un modulo puro de contrato, adaptacion, validacion y congelamiento. Se creo separado porque esas responsabilidades cruzan todas las suertes y no pertenecen a `state.js`, al catalogo de reglas ni a la formula legacy.

## Auditoria del flujo existente

```text
UI del calificador
  -> getCurrentContext() / emptyAttempt()
  -> state.scores[charreada__entry__suerte]
  -> calculateAttemptTotal()
  -> saveState() para draft local
  -> buildPublishedScoreSnapshot()
  -> recordPublishedScore()
  -> publishFirebaseOfficialScoreAtomic()
  -> Official Score Authority
  -> historial / public projection / live / exports
```

El intento legacy contiene `base`, `adic`, `infr`, punta de Cala, `applied`, manuales, penalizaciones al equipo, DQ en `desc`, cero mediante `attempted/notAchieved`, nota y evidencia de tiempo. Los scores oficiales ya tienen identidad de oportunidad, revision e historial inmutable en el ledger.

## Frontera V2

```text
Legacy draft
  -> calculateAttemptPointSummary() (autoridad deportiva existente)
  -> adaptLegacyAttemptToV2()
  -> validateScoringAttemptV2()
  -> buildOfficialScoringAttemptSnapshot()
  -> publishedScore.breakdown.attemptV2
  -> compactPublishedBreakdown()
  -> publicacion atomica existente
```

El total superior de `publishedScore` no se recalcula ni se reemplaza. `attemptV2` se agrega en paralelo al `attempt` y al `breakdown` legacy. Functions conserva el breakdown completo y sigue asignando la revision oficial, idempotencia, actor y auditoria del score.

## Decisiones

- Drafts: continúan en el formato legacy. No hay gate V2 productivo para captura.
- Official: agrega un snapshot V2 autosuficiente e inmutable al publicar.
- Lectura legacy: usa adapter bajo demanda, sin escribir ni migrar el origen.
- Identidad: hash determinista de torneo, competencia, charreada, scope, participante/equipo, suerte, oportunidad y slot.
- Individual: requiere `participantId`; `teamId` queda `null`.
- Equipo: requiere `teamId`; puede conservar `participantId` auxiliar si existe.
- Revision: `identity.revision` representa revision de draft disponible; la revision oficial canonica sigue en el registro oficial. `publication.officialRevision` queda disponible para consumidores que ya conozcan esa revision.
- DQ: estado explicito que anula el neto del intento sin borrar selecciones, infracciones, evidencia ni nota.
- Team bad points: permanecen fuera de `netAttemptPoints`, igual que el contrato actual; se reflejan en `teamAdjustedPoints`.

## Responsabilidades reutilizadas

- `emptyAttempt()`, `state.scores` y navegacion: drafts legacy.
- `calculateAttemptTotal()`: total oficial legacy.
- `calculatePuntaBreakdown()`: calculo especializado de Cala.
- `recordPublishedScore()`: revision e historial local.
- `publishFirebaseOfficialScoreAtomic()`: autoridad atomica, CAS e idempotencia.
- Official Score Authority: ledger, auditoria y fanout durable.

## Fuera de alcance

No se implementaron botonera 2026, calculadores de floreo, Terna Shared Engine, timers nuevos, suertes dinamicas reales, UI responsive, FieldID nuevos, migraciones, reglas deportivas, rutas Firebase ni despliegues.

## Compatibilidad

Resultados, historial, supervisor, exportadores, Portal Publico y Broadcast siguen consumiendo el contrato existente. El snapshot V2 es aditivo. Ningun consumidor queda obligado a adoptarlo en este ticket.

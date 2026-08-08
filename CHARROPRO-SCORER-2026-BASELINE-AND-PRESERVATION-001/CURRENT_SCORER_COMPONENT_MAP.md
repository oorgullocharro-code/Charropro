# Current Scorer Component Map

## Mapa de archivos

| Archivo | Responsabilidad actual |
| --- | --- |
| `torneo.html`, `jueces.html`, `js/tournamentApp.js` | Entradas privadas y bootstrap del calificador. |
| `js/app.js` | UI, eventos, borrador, footer, evidencia, DQ, snapshot y orquestacion de publicacion. |
| `css/styles.css` | Shell, botoneras, footer y responsive. |
| `js/core/state.js` | Estado canonico cliente, intentos, colecciones, participantes y contexto de competencia. |
| `js/core/flow.js` | Secuencia anterior/siguiente por suerte, entrada, oportunidad y coleador. |
| `js/core/scoring.js` | Totales de intento, suerte, charreada, torneo, penalizaciones y rankings. |
| `js/data/suertes.js` | IDs, nombres, oportunidades y catalogos base por suerte. |
| `js/data/calaRules.js` | Reglas Cala, punta, migracion y penalizaciones de equipo Cala. |
| `js/data/defaultScoringButtonLayouts.js` | Grupos y overrides de presentacion de botonera. |
| `js/core/timerRules.js` | Scope, modo, limite y formato de cronometro. |
| `js/core/roles.js` | Roles, capacidades y acceso por torneo. |
| `js/core/firebaseSync.js` | Adapter Firebase, callable oficial, live, Outbox, snapshot y guards. |
| `functions/officialScoreConcurrency.js` | CAS, ledger, idempotencia, auditoria y fanout oficial. |
| `functions/index.js` | Callable y transaccion RTDB server-side. |
| `js/core/officialFormat.js` | Paquete, filas y libro oficial. |
| `js/core/history.js`, `js/core/statistics.js`, `js/core/exporters.js` | Historial, estadistica y exportaciones derivadas. |

## Mapa por suerte

Todos los renglones usan el shell `renderScoring()`, `renderTimeNoteSection()`,
`renderScoringActionAccordions()` y `renderScoringBottomBar()`.

| Suerte | UI/componente | Catalogo (B/A/I/D) | Estado | Calculo y total | Persistencia/official/audit | Export/FMCH |
| --- | --- | ---: | --- | --- | --- | --- |
| Cala | `renderCalaMainPanel`, `renderCalaPuntaSection`, grupos Cala | 1/7/18/17 | intento unico + punta + grupos | `calculatePuntaBreakdown`, `applyPuntaCalculation`, total de intento | `state.scores`, snapshot con `adicGroups`, punta, penalties y revision | `buildCalaRows`; 25 FieldID |
| Piales | `renderAttemptMainPanel` | 3/6/5/3 | 3 intentos | total por intento y suma de coleccion | intento clonado por oportunidad; ledger por `attemptKey` | `buildPialesRows`; 17 FieldID |
| Colas | `renderColeaderoMainPanel` | 4/4/7/4 | 3 coleadores x 3 intentos (1 x 3 individual) | suma por coleador y coleccion | `coleadorIndex` forma parte de identidad oficial | `buildColeaderoRows`; 51 FieldID; falta fila 4 |
| Toro | `renderJineteoMainPanel` | 2/8/5/3 | intento unico | total comun | snapshot y ledger comun | `buildJineteoRows`; 21 FieldID; `ttm` duplicado |
| Lazo | `renderGenericMainPanel` + botonera | 1/6/3/2 | 3 intentos | total comun | identidad `lazo` independiente | parte de `buildTernaRows`; 32 FieldID Terna compartidos |
| Pial Ruedo | `renderGenericMainPanel` + botonera | 1/6/3/2 | 3 intentos | total comun | identidad `pial_ruedo` independiente | parte de `buildTernaRows` |
| Yegua | `renderJineteoMainPanel` | 2/8/3/2 | intento unico | total comun | snapshot y ledger comun | `buildJineteoRows`; 21 FieldID |
| Manganas Pie | `renderAttemptMainPanel` | 4/7/3/1 | 3 intentos | total por intento y coleccion | snapshot por oportunidad | `buildThreeShotRows`; 19 FieldID |
| Manganas Caballo | `renderAttemptMainPanel` | 4/7/3/1 | 3 intentos | total por intento y coleccion | snapshot por oportunidad | `buildThreeShotRows`; 19 FieldID |
| Paso | `renderPasoMainPanel` | 2/5/2/2 | intento unico | total comun | snapshot y ledger comun | `buildPasoRows`; 16 FieldID |

`B/A/I/D` significa base/adicional/infraccion/descalificacion. Los valores son el
catalogo actual, no una certificacion del Reglamento FMCH 2026.

## Ruta UI a datos

| UI | Evento | Estado | Calculo | Persistencia | Official/audit | FieldID |
| --- | --- | --- | --- | --- | --- | --- |
| Boton base | `toggle-rule` | `base`, `applied` | `calculateAttemptTotal` | intento en `state.scores` | breakdown base/revision | `BASE`, `GOOD_POINTS` |
| Boton adicional | `toggle-rule` | `adic`, `applied` | suma | intento | `adicItems` | `ADDITIONAL_POINTS` |
| Boton infraccion | `toggle-rule` | `infr`, `applied` | resta | intento | `infrItems` | `BAD_POINTS` |
| Manual +/- | `add-custom` | `customAdic/customInfr` | suma/resta en `adic/infr` | intento | items manuales | derivable por concepto |
| Equipo | `toggle/add-team-penalty` | `teamPenalties` | resta del total de equipo | intento | breakdown separado | `TEAM_INFRACTION` |
| DQ | `desc-select/toggle-desc` | `desc` | total de intento 0 | intento | motivo y desglose | `DESQUALIFICATION` |
| Cero | `toggle-attempt-zero` | `attempted/notAchieved` | total 0 | intento | oportunidad publicada | `ATTEMPT_TOTAL` |
| Metros/marcas | `punta-field` | campos punta | punta automatica | intento | breakdown punta | FieldID Cala |
| Tiempo/nota | `attempt-field` | `tiempo/note` | no cambia por si solo | intento | clon oficial | `TIME/COMPLETION_TIME` |
| Evidencia | capture/save/remove | `timeEvidence[]` | no cambia por si sola | intento | clon oficial/auditabilidad | soporte operativo |
| Guardado automatico | cualquier cambio deportivo | `state.scores` + draft activo | recalculo vigente | `saveState({ silent: true })` | no publica | no aplica |
| Deshacer | `previous-score` | puntero de navegacion | no revierte calculo | guarda navegacion | no modifica score oficial | no aplica |
| Guardar y siguiente | `next-score` | published + puntero | snapshot total | transaccion oficial | ledger/audit/fanout | `OFFICIAL_SCORE` |

La matriz exhaustiva permanece en
`../CHARROPRO-FMCH-CURRENT-SCORER-FUNCTIONAL-AUDIT-001/UI_TO_DATA_TRACEABILITY.json`.

## Participantes y nombres

1. `getCharreadaCompetitionContext()` decide `team` o `individual`.
2. Competencia individual usa `charreada.individualParticipants`; legacy especializado
   puede adaptar `teamIds` sin convertir datos de forma persistente.
3. `getEntryDisplayName()` prioriza `participantName` y `horseName`.
4. Equipos usan `team.name` y `roster` por suerte.
5. Lazo y Pial en el Ruedo usan `roster.terna[0]` y `[1]`.
6. Coleadero usa `roster.colas[coleadorIndex]`; placeholders solo son fallback visual.

## Estado de intento y coleccion

- Clave de coleccion: `charreadaId__entryId__suerteId`.
- Intento comun: objeto `emptyAttempt()`.
- Multi-intento: arreglo de intentos.
- Coleadero: arreglo de coleadores, cada uno con arreglo de oportunidades.
- Revision oficial: vive en ledger/record publicado, no en el borrador `emptyAttempt`.
- Draft/oficial: `persistScoreChange()` guarda local; `nextScore()` publica.

## Pipeline oficial

```text
control UI
  -> attempt draft
  -> saveState local
  -> buildPublishedScoreSnapshot
  -> publishFirebaseOfficialScoreAtomic
  -> callable publishCharroProOfficialScore
  -> RTDB transaction sobre tournament
  -> scores + officialScoreLedger + publishedScores + officialScoreAudit
  -> officialScoreFanout
  -> audit/publishedScores + projectionOutbox + live/current
  -> publicTournaments por Recovery/Outbox
```

La operacion usa `expectedRevision`, idempotency key, fingerprint, actor, dispositivo y
timestamp server-side. Una correccion historiza el registro anterior.

## Reconciliacion FMCH

La matriz actual contiene exactamente los mismos 239 IDs unicos que
`FIELD_DICTIONARY.json`:

| Evaluacion | Cantidad |
| --- | ---: |
| Presentes directos | 13 |
| Derivables | 177 |
| Ambiguos | 42 |
| Faltantes | 7 |

| Capa | FieldID |
| --- | ---: |
| UI | 182 |
| Estado | 195 |
| Calculo | 184 |
| Persistencia | 184 |
| Score oficial | 184 |
| Auditoria | 184 |
| Exportacion | 232 |
| Derivable | 215 |

No se duplican aqui los 239 registros. La fuente detallada es
`../CHARROPRO-FMCH-CURRENT-SCORER-FUNCTIONAL-AUDIT-001/FMCH_FIELD_LAYER_MATRIX.json`.

## Responsive

El shell actual usa scroll vertical en el contenido, footer separado y breakpoints en
1220, 980 y 640 px. A 980 px se apilan contexto, workspace y footer; a 640 px la
botonera es de una columna. Existen tiras horizontales de turnos/suertes y columnas
clasicas de 160 px que deben considerarse riesgo, no eliminarse sin prueba visual.

## Mapa historico del footer

| Control | Estado actual | Primera evidencia Git disponible | Semantica confirmada |
| --- | --- | --- | --- |
| Deshacer | Visible | `fe309687` / `CORE-1.0-STABLE` | `previousScore()`: reinicia timer y navega al puntero anterior. |
| Marcar 0 | Visible | `fe309687` / `CORE-1.0-STABLE` | Alterna `attempted/notAchieved` solo sin valor deportivo. |
| Guardar y siguiente | Visible | `fe309687` / `CORE-1.0-STABLE` | Guarda borrador, publica oficialmente y avanza tras exito. |
| Guardar separado | No visible | No localizado | El borrador se guarda automaticamente mediante `persistScoreChange()`. |
| Evidencia | Visible fuera del footer | `09f9eb5e` para captura manual | Captura, etiqueta, guarda o elimina `timeEvidence`; no cambia puntos. |
| Nota de juez | Visible fuera del footer | `fe309687` / `CORE-1.0-STABLE` | Edita `attempt.note` y persiste borrador. |
| Pendiente a revision | No visible | No localizado | Sin handler, estado, persistencia ni impacto verificables. |

La busqueda cubrio HEAD, todos los commits alcanzables, ramas, etiquetas, reflog y
documentacion local. El repositorio no contiene historia anterior a `fe309687`; por ello
`Pendiente a revision` queda como antecedente referido por el usuario, no como contrato
tecnico reconstruible todavia. Los mocks visuales no sustituyen este mapa ni autorizan
eliminar controles confirmados.

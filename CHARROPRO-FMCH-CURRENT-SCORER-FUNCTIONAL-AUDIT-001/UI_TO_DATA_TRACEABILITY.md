# Trazabilidad interfaz a dato

La tabla identifica la ruta actual. PRESENT_IN_UI significa que la ruta de renderizado
esta implementada; no significa que fue visualmente ejecutada con sesion de juez en esta
auditoria. Ver SCREENSHOT_INDEX.md.

| Control | Suerte | Evento / funcion | Estado | Calculo | Persistencia / score | FieldID FMCH |
| --- | --- | --- | --- | --- | --- | --- |
| Selector de base | Todas | toggleRule(base, id) | attempt.base, applied, initializedBase | total de intento | score.attempt y breakdown | BASE / GOOD_POINTS |
| Boton adicional | Todas | toggleRule(adic, id) | attempt.adic, applied | total de intento | score.attempt y adicItems | ADDITIONAL_POINTS |
| Boton infraccion | Todas | toggleRule(infr, id) | attempt.infr, applied | total de intento | score.attempt e infrItems | BAD_POINTS |
| Descalificacion | Todas | selector de desc | attempt.desc | total 0 | attempt y score publicado | DESQUALIFICATION |
| Cero no logrado | Piales, Colas, Manganas | toggleAttemptZero() | attempted, notAchieved | total 0 | attempt / score | ATTEMPT_TOTAL |
| Metros | Cala | writePuntaField | puntaMetros | applyPuntaCalculation | attempt / breakdown | CALA.METERS |
| Marcas / piquetes | Cala | writePuntaField | puntaPiquetes | applyPuntaCalculation | attempt / breakdown | CALA.TIMES, CALA.P, CALA.T |
| Grupos adicionales | Cala | renderCalaAdicGroup | applied, adic | suma de reglas | attempt / adicGroups | CALA.LD, LI, MD, MI, PC |
| Tiempo | Todas | entrada de tiempo | tiempo, timeEvidence | reglas aplicadas / total | attempt / score | COMPLETION_TIME / TIME |
| Penalizacion equipo | Todas | toggleTeamPenalty | teamPenalties | calculateAttemptFinalTotal | attempt / published breakdown | TEAM_INFRACTION |
| Nota / evidencia | Todas | acciones de tiempo | note, timeEvidence | no recalcula por si sola | attempt clonado | auditabilidad operativa |
| Guardar y siguiente | Todas | nextScore() | score publicado, puntero | marca cero vacio si procede | callable oficial + historial | OFFICIAL_SCORE |
| Hoja oficial | Todas | buildOfficialPackage() | estado y colecciones | totales por suerte/equipo | filas visuales | campos DERIVABLE de hoja |

## Ruta de datos

CONTROL -> handler -> attempt -> calculateAttemptTotal / collection -> snapshot
publicado -> publicacion atomica -> historial/auditoria -> formato oficial.

La ruta remota exacta se resuelve por publishFirebaseOfficialScoreAtomic(); no fue
invocada contra Firebase durante la auditoria. La evidencia ejecutada se limita al motor
local y sus snapshots sinteticos.

# Reconciliacion con diagnosticos FMCH previos

## Evidencia de reanudacion

El bloqueo de autenticacion y navegador fue eliminado por
`CHARROPRO-WEB-CLIENT-EMULATOR-RUNTIME-INTEGRATION-001`. La reanudacion uso el
cliente real en `LOCAL / EMULATOR`, ingreso con un juez sintetico y recorrio las
diez vistas del calificador sin tocar datos reales ni Produccion.

La evidencia temporal quedo en
`/private/tmp/charropro-fmch-current-scorer-audit/`: captura de Cala y un inventario
JSON de controles visibles por suerte. No se agregaron binarios al repositorio.

## Trazabilidad de controles comunes

| Control observado | Estado | Calculo | Persistencia | Score oficial / FieldID |
| --- | --- | --- | --- | --- |
| Base | `attempt.base`, `attempt.applied`, `attempt.initializedBase` | `calculateAttemptTotal` | `published.attempt` | `published.breakdown`; `BASE` y `GOOD_POINTS` |
| Adicional | `attempt.adic`, `attempt.applied` | `calculateAttemptTotal` | `published.attempt` | `published.breakdown.adicItems`; `ADDITIONAL_POINTS` |
| Infraccion | `attempt.infr`, `attempt.applied` | `calculateAttemptTotal` | `published.attempt` | `published.breakdown.infrItems`; `BAD_POINTS` |
| Marcar 0 | `attempt.attempted`, `attempt.notAchieved` | intento en cero | `published.attempt` | `published.total`; `ATTEMPT_TOTAL` |
| Metros de punta | `attempt.puntaMetros` | `applyPuntaCalculation` | `published.attempt` | `FMCH.TEAM_SHEET.CALA.METERS` |
| Marcas de punta | `attempt.puntaPiquetes` | `applyPuntaCalculation` | `published.attempt` | `CALA.TIMES`, `CALA.P`, `CALA.T` |
| Grupos Cala | `attempt.applied`, `attempt.adic` | `calculateAttemptTotal` | `published.attempt` | `CALA.LD`, `LI`, `MD`, `MI`, `PC`, con equivalencia pendiente para `ML/CR` |
| Tiempo y evidencia | `attempt.tiempo`, `timeEvidence`, `note` | depende de la regla | `published.attempt` | `COMPLETION_TIME` y `TIME` |
| Infraccion al equipo | `attempt.teamPenalties` | `calculateAttemptFinalTotal` | `published.attempt` | `published.breakdown.teamPenalties`; `TEAM_INFRACTION` |
| Guardar y siguiente | `state.publishedScores`, `state.lastPublishedScore` | `buildPublishedScoreSnapshot` | `publishFirebaseOfficialScoreAtomic` | score oficial, historial y auditoria |

La prueba de Cala confirmo la cadena real completa: boton Base Cala de 20,
estado de pasada 20, score oficial revision 1 con total 20, recarga, ranking 20 e
historial auditable. No se modificaron calculos para producir esta evidencia.

## Reconciliacion por suerte

| Vista real | Controles observados | FieldID de seccion | Reconciliacion |
| --- | ---: | ---: | --- |
| Cala | 44 | 25 | Punta, base, LD, LI, ambos medios lados, cambio de rectangulo, malos, tiempo, equipo y descalificacion existen. `ML/CR` frente a `MD/MI/PC` sigue sin equivalencia deportiva certificada. |
| Piales | 24 | 17 | Existen tres intentos, bases Remolineado/Madera/Floreado, distancia, adicionales, malos y tiempo. |
| Colas | 28 | 51 | Existen tres coleadores con tres oportunidades cada uno, bases, distancia, adicionales y malos. Falta el cuarto coleador FMCH. |
| Toro | 22 | 21 | Existen bases Gasa/Clasico, adicionales, malos, tiempo y descalificacion. El id `ttm` duplicado sigue siendo brecha real de trazabilidad. |
| Lazo | 17 | parte de 32 Terna | La primera mitad de Terna existe como Lazo a la Cabeza, con base, remates, floreo, tiempo y malos. |
| Pial en el Ruedo | 17 | parte de 32 Terna | La segunda mitad de Terna existe de forma independiente y su total conjunto es derivable. |
| Yegua | 20 | 21 | Existen bases Gasa/Clasico, adicionales, malos, tiempo y descalificacion. |
| Manganas a Pie | 24 | 19 | Existen tres intentos, cuatro tipos de base, floreo, tiempo y malos. |
| Manganas a Caballo | 24 | 19 | Existen tres intentos, cuatro tipos de base, floreo, tiempo y malos. |
| Paso | 16 | 16 | Existen primera/segunda vuelta, distancia, cuarta, reparos, oreja, malos y tiempo. |

## Correcciones de interpretacion

| Area | Diagnostico previo posible | Evidencia actual | Reconciliacion |
| --- | --- | --- | --- |
| Cala punta | Metros, marcas o punta ausentes por no ser columnas planas. | Controles visuales, `puntaMetros`, `puntaPiquetes`, `puntaPts` y `applyPuntaCalculation()`. | Ya existe; no falta como capacidad de captura o calculo. |
| Cala adicionales | LD/LI/MD/MI/PC ausentes si se revisa solo exportacion. | Botones LD, LI, Medio lado derecho/izquierdo, Cambio de rectangulo; grupos `LD`, `LI`, `ML`, `CR`. | Existe con otro nombre y agrupacion; la equivalencia FMCH requiere validacion deportiva. |
| Malos | Ausentes si solo se ve total. | Botones por infraccion, `applied`, `infr`, `infrItems` y total. | Ya existen y persisten; la fila visual es derivable. |
| Piales / Manganas | Tres tiros no visibles en estructura plana. | Tres tarjetas de intento en cada vista real. | Ya existen en UI, estado y modelo. |
| Terna | Sin una entidad unica se puede inferir ausencia. | Vistas separadas `Lazo` y `Pial R.` con total conjunto. | Existe con otro nombre operativo; la traduccion a renglones FMCH es derivable. |
| Tiempo | Evidencia o cronometro ausente del score. | Seccion `Evidencia de tiempo`, input observado y estado `tiempo/timeEvidence/note`. | Ya existe; la exportacion debe seleccionar el FieldID aplicable. |
| Penalizacion de equipo | Confundida con infraccion individual. | Seccion separada en las diez vistas y `teamPenalties`. | Ya existe como estado y calculo diferenciado. |
| Coleadero | Cuarta fila tratada como solo problema de exportacion. | La UI real muestra unicamente Coleador 1, 2 y 3. | Falta funcional real; no es solo formato. |
| Firmas y pie | Puede confundirse con falla de score. | Cuatro firmas nominales sin captura y siete faltantes documentales. | Existe pero no persiste como firma; logos y footer faltan realmente. |
| Hoja llenada | Se puede asumir que el enlace usa el score ya persistido. | Resultados mostro Cala=20, pero `formato-federacion.html` mostro que no habia charreada activa. | Los datos permiten una hoja parcial, pero el entrypoint independiente no la materializa hoy de forma confiable. |

## Revision por capas

Los 239 FieldID fueron contabilizados por seccion y por bitmask. No hay ningun
FieldID presente en UI que carezca de persistencia deportiva. Los 11 registros
con estado y sin persistencia dentro del score son 7 datos de encabezado
contextual y 4 asignaciones de firma. Los 184 campos deportivos trazables tienen
evidencia de calculo, persistencia, score oficial y auditoria; 48 campos
adicionales solo necesitan composicion o derivacion para exportarse; 7 no tienen
fuente actual.

## Regla de este diagnostico

No se renombraron ni modificaron los otros 23 documentos. Esta reconciliacion no
declara ausencia cuando existe una representacion equivalente en estado, regla
aplicada, desglose o calculo. Tampoco declara equivalencia oficial cuando falta
identidad, semantica deportiva, captura documental o capacidad funcional
verificable.

No se corrigieron la cuarta fila de Coleadero, el id `ttm` duplicado ni las
equivalencias FMCH de Cala.

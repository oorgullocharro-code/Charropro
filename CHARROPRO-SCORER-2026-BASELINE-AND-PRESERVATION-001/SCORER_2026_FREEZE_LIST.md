# Scorer 2026 Freeze List

## Identidad del baseline

- Ticket: `CHARROPRO-SCORER-2026-BASELINE-AND-PRESERVATION-001`
- Commit base: `fc225a848ef738d56cc9567979333d3ada57ee62`
- Fecha de auditoria: 2026-08-08
- Alcance: comportamiento existente del calificador, sin cambios de producto.
- Evidencia reutilizada: `CHARROPRO-FMCH-CURRENT-SCORER-FUNCTIONAL-AUDIT-001/`.

Esta lista congela capacidades, contratos e identidades. Congelar no significa que el
codigo no pueda extenderse; significa que ningun ticket 2026 puede retirar o cambiar
silenciosamente el comportamiento aprobado.

## Superficies protegidas

| Superficie | Implementacion actual | Contrato que debe preservarse |
| --- | --- | --- |
| Acceso | `js/core/roles.js`, puerta privada y entradas `torneo.html`/`jueces.html` | Solo sesiones activas con capacidad `score`; Juez conserva `score`, `timer` y `sync`. |
| Contexto | `getCharreadaCompetitionContext()`, `getCharreadaScoringSuertes()`, `getCharreadaScoringEntries()` | Torneo, competencia, charreada, equipo o participante y suerte se resuelven antes de calificar. |
| Puntero | `js/core/flow.js` | El orden oficial conserva suerte, equipo/participante, oportunidad y coleador. |
| Borrador | `emptyAttempt()`, `state.scores`, `scoreKey()` | Los cambios de botonera son borrador hasta `Guardar y siguiente`. |
| Calculo | `js/core/scoring.js` | `base + adic + punta - infr`; DQ produce cero; penalizacion de equipo permanece separada. |
| Publicacion | `publishOfficialScoreForContext()` y `publishFirebaseOfficialScoreAtomic()` | Publicacion autoritativa, revision, CAS, idempotencia, historial y fanout. |
| Resultados | helpers de `scoring.js` y vistas de `js/app.js` | Totales y rankings consumen el score existente; no se recalculan con reglas nuevas. |
| Exportacion | `js/core/officialFormat.js` | El paquete oficial consume estado y catalogos actuales; FieldID mantienen identidad. |
| Live/Broadcast | `live/current`, Public Projection Outbox y Broadcast Data Contract | Solo reciben datos publicados/sanitizados; no se convierten en fuente deportiva. |

## Diez suertes congeladas

| Suerte | ID actual | Oportunidades | Componente principal | Particularidad preservada |
| --- | --- | ---: | --- | --- |
| Cala de Caballo | `cala` | 1 | `renderCalaMainPanel()` | Calculador de punta, grupos Cala y catalogo especializado. |
| Piales en el Lienzo | `piales` | 3 | `renderAttemptMainPanel()` | Tres tiros independientes. |
| Coleadero | `colas` | 3 por coleador | `renderColeaderoMainPanel()` | Matriz coleador x oportunidad; hoy tres coleadores por equipo. |
| Jineteo de Toro | `toro` | 1 | `renderJineteoMainPanel()` | Base exclusiva, adicionales, infracciones y DQ. |
| Lazo de Cabeza | `lazo` | 3 | `renderGenericMainPanel()` + botonera comun | Primera parte operativa de Terna. |
| Pial en el Ruedo | `pial_ruedo` | 3 | `renderGenericMainPanel()` + botonera comun | Segunda parte operativa de Terna. |
| Jineteo de Yegua | `yegua` | 1 | `renderJineteoMainPanel()` | Base exclusiva, adicionales, infracciones y DQ. |
| Manganas a Pie | `manganas_pie` | 3 | `renderAttemptMainPanel()` | Tres intentos y adicionales de floreo. |
| Manganas a Caballo | `manganas_caballo` | 3 | `renderAttemptMainPanel()` | Tres intentos y adicionales de floreo. |
| Paso de la Muerte | `paso` | 1 | `renderPasoMainPanel()` | Primera/segunda vuelta, adicionales, infracciones y DQ. |

Lazo y Pial en el Ruedo son dos suertes reales del flujo. `officialFormat.js` las
compone como Terna sin perder sus intentos independientes.

## Funciones transversales que no pueden desaparecer

| Capacidad | Estado/campo | Handler o helper | Efecto preservado |
| --- | --- | --- | --- |
| Base | `base`, `applied`, `initializedBase` | `toggleRule("base", id)` | Seleccion exclusiva y participacion en total. |
| Adicional | `adic`, `applied` | `toggleRule("adic", id)` | Suma/remocion acumulable. |
| Infraccion individual | `infr`, `applied` | `toggleRule("infr", id)` | Resta acumulable y detalle oficial. |
| Adicional manual | `customAdic` | `addCustomScore("adic")` | Motivo y puntos positivos persistidos. |
| Infraccion manual | `customInfr` | `addCustomScore("infr")` | Motivo y puntos negativos persistidos. |
| Infraccion al equipo | `teamPenalties` | `toggleTeamPenalty()`, `addTeamPenalty()` | Separada de la calificacion individual. |
| DQ/cero reglamentario | `desc` | `applyDescReason()`, `clearDesc()` | Puntos buenos en cero; motivo persistido. |
| Cero no logrado | `attempted`, `notAchieved` | `toggleAttemptZero()`, `markAttemptZeroIfBlank()` | Registra oportunidad realizada sin puntaje. |
| Tiempo observado | `tiempo` | `attempt-field` | Texto de tiempo en el intento. |
| Evidencia | `timeEvidence[]` | `captureTimeEvidence()`, `saveTimeEvidence()` | Captura desacoplada con fecha, estado y fuente. |
| Nota | `note` | `attempt-field` | Observacion del juez persistida en el intento. |
| Guardar | estado local | `saveState()` | Conserva borrador local por torneo. |
| Publicar y siguiente | score oficial + puntero | `nextScore()` | Publica atomicamente y avanza solo con exito. |
| Historial | `publishedScores`, ledger y auditoria | `recordPublishedScore()` y autoridad server-side | Revision anterior queda historica/superseded. |

## Footer congelado

| Etiqueta actual | Handler | Estado requerido | Efecto real |
| --- | --- | --- | --- |
| Teclado | ninguno | siempre deshabilitado | Reserva visual; no existe operacion activa. |
| Ajustar botonera | `show-scoring-button-settings` | Supervisor u Operador | Edita layout/etiquetas mediante overrides, no reglas deportivas. |
| Estado de conexion | lectura | contexto actual | Muestra estado y detalle del ultimo guardado/publicacion. |
| Deshacer | `previousScore()` | capacidad `score` | Reinicia cronometro y navega al puntero anterior. No revierte la ultima accion. |
| Marcar 0 | `toggleAttemptZero()` | intento sin valor deportivo | Alterna `attempted/notAchieved`. |
| Guardar y siguiente | `nextScore()` | jornada abierta y publicacion libre | Publica score oficial; bloqueo de doble accion; luego avanza. |

La etiqueta `Deshacer` no debe tomarse como contrato de undo por accion. La diferencia
entre etiqueta y comportamiento esta registrada como brecha P2.

## Regla DQ observada

`applyDescReason()` es transversal a las diez suertes. Al aplicar DQ:

- conserva `infr`, `customInfr`, `teamPenalties`, `timeEvidence` y `note`;
- conserva en `applied` solo IDs presentes en el catalogo de infracciones;
- pone en cero `base`, `adic`, `puntaPts` y `puntaMetros`;
- reinicia `puntaPiquetes` y elimina `customAdic`;
- `calculateAttemptTotal()` devuelve cero cuando existe `desc`.

Resultado actual: **DQ preserva las infracciones numericas y de equipo**. El ID `ttm`
duplicado en Toro impide garantizar por identidad que cada elemento de `applied` sea del
tipo correcto. Quitar la DQ no reconstruye los puntos buenos eliminados; esa semantica
debe validarse antes de cualquier correccion.

## Cala de Caballo

El calculador de punta queda congelado como componente especializado:

- entradas: `puntaMetros` y `puntaPiquetes`;
- normalizacion: metros enteros no negativos; marcas entre 1 y 4 en UI;
- formula actual: desde 6 m, distancia adicional mas 3/2/1/0 por 1/2/3/4 marcas;
- salida: `puntaPts` y breakdown de punta;
- integracion: `applyPuntaCalculation()` y `calculateAttemptTotal()`;
- persistencia: intento clonado y score oficial;
- FieldID: metros, tiempos/marcas, `P`, `T` y punta derivada.

No se autoriza sustituirlo por captura manual ni agregar topes arbitrarios de distancia.

## Cronometros congelados

- Estado: `state.liveTimer` y cache auxiliar por torneo.
- Scope: charreada, entrada/equipo, suerte, oportunidad y coleador.
- Acciones: iniciar, pausar y reiniciar.
- Regla general: tiempo transcurrido.
- Coleadero: cuenta regresiva de 15 segundos.
- Persistencia: revision, `startedAt`, `elapsedMs`, metadatos y `updatedAt`.
- Live: publicacion solo al cambiar estado; consumidores calculan avance desde `startedAt`.
- Evidencia: captura manual al intento, independiente del estado live.

## Protecciones de publicacion congeladas

1. `nextScore()` bloquea doble accion y conserva el borrador si falla.
2. La autoridad valida sesion, rol, tenant/organizacion, torneo, charreada activa,
   competencia, intento e `expectedRevision`.
3. La transaccion RTDB resuelve CAS e idempotencia; no depende del reloj cliente.
4. Solo un registro queda `active`; anteriores quedan `historical/superseded`.
5. El fanout entrega auditoria, Outbox y `live/current` sin convertirlos en autoridad.
6. Public Projection Outbox genera el snapshot publico; `publicTournaments` no es fuente.
7. `publishFirebaseTournamentState()` no puede reemplazar destructivamente `scores` ni
   las colecciones oficiales remotas.
8. Los guards de IDs remotos y snapshot de seguridad permanecen obligatorios.

## Responsive actual

- Desktop: shell de altura estable, area principal con scroll vertical y footer propio.
- iPad/<=980 px: una columna, area principal desplazable y footer apilado.
- <=640 px: botoneras, resumen y formularios en una columna.
- Botones tactiles: 74-88 px de altura minima segun variante.
- Riesgo conocido: tiras de suerte/turno usan scroll horizontal intencional y la variante
  clasica mantiene columnas fijas de 160 px hasta 980 px.

El objetivo futuro de cero scroll horizontal requiere una correccion responsive
controlada, no una sustitucion del scorer.

## Brechas excluidas del baseline funcional

Permanecen sin corregir: cuarta fila de Coleadero, `ttm` duplicado, equivalencias Cala,
firmas, elementos institucionales, encabezados, resolucion de charreada en el formato
Federacion, semantica de `Deshacer` y ausencia de un modelo autonomo de
fusiones/fusionales. La fuente oficial es
`../CHARROPRO-FMCH-CURRENT-SCORER-FUNCTIONAL-AUDIT-001/CURRENT_REAL_GAPS.md`.

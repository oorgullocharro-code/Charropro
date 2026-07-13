# Despliegue CharroPro

## Version ASSET-MANAGER-001

Version actual de cache:

```text
v=20260713-asset-manager-001-assets-v1
```

Esta version agrega Broadcast Asset Manager v1 (`1.0.0`) como catalogo universal, puro y exclusivamente en memoria para recursos de Broadcast Studio. `js/broadcast/assetManager.js` modela identidad, version, revision, tipos, estados, visibilidad, scopes, variantes, resolucion determinista, fallback, derechos, ciclo de vida, aislamiento multi-tenant y manifiestos serializables.

No se integra almacenamiento, Firebase, Firebase Storage, uploads, descargas, listeners, rutas nuevas ni recursos legacy. El modulo opera en paralelo y no modifica Broadcast Data Contract, Broadcast State, Broadcast Output, graficos V1 u OBS V1. La referencia tecnica completa esta en `BROADCAST_ASSET_MANAGER_V1.md` y la matriz automatizada en `tests/broadcast-asset-manager.test.mjs`.

### Correccion ASSET-MANAGER-001B

Antes del primer commit se agrego `assetFamilyId` como identidad logica inmutable, conservada entre versiones y publicada en manifiestos. La variante `original` queda protegida contra eliminacion o duplicado. Los manifiestos eliminan por defecto `localDevelopmentRef`, `file://`, `signedUrl` y metadata sensible anidada; el modo local solo se permite de forma explicita para desarrollo no exportable y nunca para un manifest production-ready. La validacion rechaza familias inconsistentes, assets sin familia, originales duplicados y referencias o secretos no autorizados.

## Version BROADCAST-OUTPUT-001

Version de cierre del ticket:

```text
v=20260713-broadcast-output-001-output-v1
```

Esta version agrega Broadcast Output v1 (`1.0.0`) como motor universal y aditivo de salidas para Broadcast Studio. El modulo `js/broadcast/broadcastOutput.js` administra un registro exclusivamente en memoria, tipos y estados de Output, revision optimista, capabilities, heartbeat, deteccion stale, resolucion, orientacion, safe area, layers, Theme y aislamiento por tenant, organizacion, torneo, competencia y sesion.

`buildBroadcastOutputProjection()` consume solamente Broadcast State y Broadcast Data Contract. Genera una proyeccion serializable y segura que separa estrictamente Preview de Program, filtra layers y graficos por Output y sanitiza el contrato segun `public`, `production`, `operational` o `restricted`; una llamada nunca puede elevar la visibilidad maxima configurada. El motor no abre conexiones, no crea adaptadores, no persiste datos y no publica nodos nuevos en Firebase.

La implementacion se documenta en `BROADCAST_OUTPUT_V1.md` y se valida con `tests/broadcast-output.test.mjs`. No modifica Firebase Rules, Core deportivo, reglas o calculos oficiales, calificador, Resultados, Recovery, Event Engine, pagina publica, OBS V1 ni graficos V1. `broadcastContext`, `broadcastContract`, `broadcastState` y el respaldo `pre-broadcast-studio-v1` permanecen intactos.

## Version BROADCAST-STATE-001

Version actual de cache:

```text
v=20260713-broadcast-state-001-state-v1
```

Esta base agrega Broadcast State v1 (`1.0.0`) como modelo central, inmutable y serializable para el futuro Broadcast Studio. El modulo `js/broadcast/broadcastState.js` separa Selection, Preview y Program; administra layers, graficos, outputs, queue, session, contextRef, automation, messages y compatibilidad legacy; aplica revisionado monotónico con `expectedRevision`; y protege Program mediante promociones, bloqueos, emergencia y limpieza controlada.

La integracion es aditiva bajo `live/current.broadcastState`: `broadcastContext`, `broadcastContract`, campos legacy, OBS y graficos V1 permanecen intactos. La proyeccion V2 inicia siempre con Preview y Program inactivos, revision 0 y `legacy.activeEngine: "v1"`; no agrega listeners, no define rutas definitivas, no publica en `publicTournaments` y no activa recuperacion o fallback automaticamente.

El estado elimina funciones, controla ciclos, bloquea `__proto__`, `constructor` y `prototype`, limita profundidad/arreglos y conserva cero, `false` y cadena vacia. Se documenta en `BROADCAST_STATE_V1.md` y cuenta con pruebas independientes para inicializacion, concurrencia, Preview/Program, capas, graficos, outputs, queue, contexto, legacy, recuperacion e inmutabilidad. No se modifican reglas deportivas, calculos oficiales, Firebase Rules, calificador, Resultados, pagina publica, Recovery, Event Engine, roles, permisos, OBS ni graficos V1.

### Correccion BROADCAST-STATE-001B

Antes del primer commit se retiro `program` y todos los bloques con setter dedicado de la allowlist de `applyBroadcastStatePatch()`. Program solo puede cambiar mediante `setProgramState()`, `promotePreviewToProgram()` y `clearProgramState()`; un patch contra `program` o `program.*` se rechaza atomicamente con `program-patch-forbidden`, sin cambiar revision, timestamps ni otras rutas del mismo patch. La activacion controlada de Program exige actor y output valido, registra timestamp y modo, conserva capas bloqueadas y respeta emergencia. La recuperacion normalizada limpia cualquier Program persistido activo y no envia contenido automaticamente a outputs.

## Version BROADCAST-DATA-001

Version actual de cache:

```text
v=20260712-broadcast-data-001-contract-v1
```

Esta base incorpora el Broadcast Data Contract v1 bajo `live/current.broadcastContract`, generado exclusivamente desde el `broadcastContext` actual. El contrato `1.0.0` es independiente de Firebase, HTML y diseño visual; normaliza torneo, organizacion, competencia, jornada, participante/equipo, charro, caballo, suerte, score oficial, detalle tecnico, ranking, cronometro, patrocinadores, branding, produccion, sistema y campos personalizados.

La integracion es aditiva: `broadcastContext`, campos planos legacy y todos los graficos V1 siguen funcionando sin cambios. Las futuras plantillas, componentes y salidas V2 deberan consumir solamente `broadcastContract`. El contrato conserva cero como valor valido, no recalcula puntajes, separa competencias `team` e `individual`, mantiene `scoreDetail` anidado y ofrece filtrado declarativo `public`, `production`, `operational` y `restricted`.

El builder elimina funciones, referencias circulares y claves peligrosas; limita profundidad y arreglos; no muta la fuente; y expone validacion, advertencias, lectura segura por rutas e inventario de campos disponibles. Los aliases temporales se publican solo bajo `legacyAliases` cuando se solicitan. No se modifican reglas deportivas, calculos oficiales, Firebase Rules, calificador, Resultados, pagina publica, Recovery, Event Engine, OBS ni graficos V1.

### Correccion BROADCAST-DATA-001B

Antes de publicar la primera version del contrato se reemplazo el filtrado manual incompleto por una matriz declarativa con precedencia `public < production < operational < restricted`. La vista publica elimina ahora `scoreDetail`, roster interno, IDs operativos, datos privados de organizacion/caballo, produccion, operador, juez y diagnosticos; los custom fields respetan su visibilidad exacta. Esta correccion conserva el mismo contrato `1.0.0` y el mismo cache-buster de BROADCAST-DATA-001 porque forma parte de su cierre previo al primer commit.

## Version PRODUCTION-COMPETITIONS-001

Version actual de cache:

```text
v=20260712-production-competitions-001-broadcast-context1
```

Esta base agrega un contrato normalizado de Produccion dentro de `charropro/live/{tournamentId}/current` bajo `broadcastContext`. El contexto resuelve la competencia desde la charreada activa, su metadata, el catalogo de competencias y el fallback legacy por `tournament.type`. Incluye torneo, competencia, jornada, participante o equipo, caballo, suerte, score publicado, detalle tecnico, ranking, cronometro y datos de produccion. Tambien conserva campos planos de compatibilidad para integraciones existentes.

Las competencias individuales publican `participantId`, `participantName`, asociacion, categoria y caballo sin inventar `teamId`; las competencias por equipos conservan `teamId`, `teamName`, logo y marcador por equipos. Charro Completo respeta sus suertes configuradas sin Terna ni Yegua. Cala, Coleadero y Pialadero reutilizan el score real existente, y el detalle tecnico permanece bajo `scoreDetail.attempt` y `scoreDetail.breakdown` sin crear calculos deportivos nuevos.

La consola de Graficos muestra de forma informativa el contexto oficial recibido en tiempo real: competencia, tipo Equipo/Individual, jornada, turno, suerte, categoria y caballo. OBS y los graficos conservan todos los campos legacy; cuando el contexto es individual muestran al participante como unidad principal y el ranking activo usa el ranking de esa competencia. No se agregan automatizaciones, escenas, plantillas ni listeners duplicados.

No se modifican reglas deportivas, calculos oficiales, Firebase Rules, Recovery, Event Engine, Resultados internos, pagina publica, Snapshot Publico, Master Data, roles, permisos ni exportaciones.

Esta base agrega metadata de competencias al Snapshot Publico en `charropro/publicTournaments/{tournamentId}`. `schedule`, `activeCharreada`, `currentScoreboard`, `generalRanking`, `scoresheet`, `leaders`, `lastScores`, `teams` y `competitions` publican `competitionType`, `competitionScope`, `competitionId`, `category`, `participantScope` y `suerteIds` cuando aplica. En competencias individuales se agregan `participantId`, `participantName`, `association` y `horseName`; en competencias por equipos se conservan `teamId` y `teamName`. Las charreadas legacy sin metadata caen a `equipos_completo` con scope `team`.

Esta base agrega en `Conexion` una seccion `Pagina publica` con acciones para abrir y copiar el enlace publico del torneo activo. Si las jornadas tienen metadatos de competencia (`competitionType`, `competitionScope`, `competitionId` o `suerteIds`), muestra accesos por competencia hacia `torneo-publico.html?tournamentId={tournamentId}&competition={competitionType}`. Tambien deja preparado el helper/documentacion para rutas futuras `/evento/{slug}` sin implementar rewrites reales del servidor.

Esta base adapta `torneo-publico.html` al modelo de competencias internas desde el snapshot publico. La pagina lee solo `charropro/publicTournaments/{tournamentId}`, agrega selector `Competencia`, acepta `?competition=` en la URL y actualiza Programa, Ranking, Sabana, Top y Premiacion sin recargar. Si el snapshot aun no trae metadatos por competencia, mantiene compatibilidad legacy mostrando `Competencia por equipos` sin leer rutas privadas ni inventar resultados.

Esta base separa los Resultados internos por competencia. La pantalla de Resultados agrega selector `Competencia` y solo muestra competencias existentes en el torneo. Ranking, sabana y top se calculan desde las jornadas de la competencia seleccionada, usando `competitionType`, `competitionScope`, `competitionId`, `phase`, `category`, `suerteIds` y la lista de participantes/equipos correspondiente.

Cuando la competencia es por equipos, el ranking se muestra por equipos y usa `teamIds`. Cuando la competencia es individual, el ranking y la premiacion usan `individualParticipants`. Charro Completo muestra solo Cala, Piales, Colas, Toro, Manganas Pie, Manganas Caballo y Paso; no incluye Terna ni Yegua. Caladero, Coleadero y Pialadero quedan limitados a su suerte correspondiente. No se modifica pagina publica, OBS, graficos, Recovery, Event Engine, Firebase Rules ni reglas deportivas.

Esta base conecta el calificador con el modelo de competencias internas. La jornada activa resuelve `competitionType`, `competitionScope`, `competitionId` y `suerteIds`; si la competencia es individual, el calificador usa `individualParticipants` como lista de turnos. Charro Completo, Caladero, Coleadero y Pialadero dejan de depender de equipos para el flujo del juez y conservan sus suertes configuradas. Competencia por equipos mantiene `teamIds` y el comportamiento anterior.

El avance de `Guardar y siguiente` ahora usa una secuencia construida desde las suertes reales de la jornada, por lo que Charro Completo puede recorrer `cala`, `piales`, `colas`, `toro`, `manganas_pie`, `manganas_caballo` y `paso` sin cargar terna ni yegua. No se modifican reglas deportivas, calculos oficiales, Resultados generales, pagina publica, OBS, graficos, Recovery, Event Engine ni Firebase Rules.

Esta base prepara participantes individuales por jornada/competencia cuando `competitionScope` es `individual`. En el formulario de crear o editar charreada/jornada, al elegir Charro Completo, Caladero, Coleadero o Pialadero se muestra la seccion `Participantes`, con alta local de nombre, asociacion, categoria, caballo y orden de participacion. El modelo temporal se guarda dentro de la jornada como `individualParticipants` y no crea todavia `charroId`, `horseId` ni `ownerId`; esos campos pertenecen a MASTER-DATA-001.

Las competencias por equipos conservan el comportamiento actual con `teamIds`. Las competencias individuales usan `individualParticipants` y no convierten automaticamente equipos en participantes. Si una competencia individual queda sin participantes, la interfaz muestra la advertencia `Esta competencia requiere participantes individuales antes de poder calificarse`, pero no bloquea el guardado. COMPETITIONS-003 debera leer `individualParticipants` para construir el flujo del juez sin modificar reglas deportivas ni calculos oficiales.

Esta base actualiza el modulo Programa para presentar visualmente `Programa de Competencias`. Al crear o editar una charreada/jornada se puede elegir `Tipo de competencia` desde el catalogo interno: Competencia por equipos, Charro Completo, Caladero, Coleadero, Pialadero o Exhibicion. El guardado agrega `competitionType`, `competitionScope`, `competitionId` y `suerteIds` a la charreada, con compatibilidad por defecto a `Competencia por equipos` cuando no exista seleccion previa. No conecta todavia estos campos al calificador, resultados, pagina publica, OBS, graficos, ranking, estadisticas, Recovery, Event Engine ni Firebase Rules.

Por ahora `competitionId` se mantiene igual a `competitionType` como compatibilidad. La separacion operativa de Caladero Juvenil, Caladero Libre, Caladero Femenil, etc. se manejara por categoria y fase/ronda, sin modificar la mecanica de calificacion. En el futuro, si se requiere manejar varias competencias independientes del mismo tipo dentro de un torneo, se podra evolucionar a `competitionId` unico por instancia.

Esta base agrega el catalogo de competencias internas en `js/data/competitionTypes.js`, siguiendo `ARCH_INTERNAL_COMPETITIONS.md`. El catalogo define `equipos_completo`, `charro_completo`, `caladero`, `coleadero`, `pialadero` y `exhibicion`, junto con `scope`, `suerteIds`, `rankingMode`, `awardGroup`, `affectsTeamRanking`, `affectsGeneralStatistics` y `statsScope`. Tambien expone helpers para resolver tipos, suertes, compatibilidad legacy desde `tournament.type` y validacion basica. No agrega selector UI, no cambia creacion de charreada, no modifica calificador profundo, resultados profundos, pagina publica visual, snapshot publico, Firebase Rules, Recovery ni Event Engine.

Esta base agrega `Pialadero` como tipo de torneo especializado con valor interno `pialadero`. El catalogo de tipos lo muestra al crear torneo, guarda `type: "pialadero"` y limita la estructura deportiva a la unica suerte `Piales` mediante `suerteIds: ["piales"]`. El calificador usa la botonera y reglas existentes de Piales, el flujo recorre solo esa suerte, y resultados/ranking/exportaciones se calculan desde el mismo catalogo reducido. No se modifican reglas deportivas, calculos de Piales, Firebase Rules, Recovery, Event Engine, pagina publica visual ni graficos.

Esta base fortalece el motor de eventos en memoria `js/core/events.js`. El modulo expone `EVENT_TYPES`, `EVENT_CATEGORIES`, `buildEvent`, `normalizeEvent`, `registerEvent`, `getEvents` y `clearEvents`; cada evento queda normalizado con `eventId`, `sequence`, `timestamp`, `type`, `category`, `tournamentId`, `charreadaId`, `teamId`, `suerteId`, `phase`, `source`, `actor` y `payload`. La secuencia vive solo en memoria, se reinicia con `clearEvents()` y `getEvents()` permite filtrar por tipo, categoria, torneo, charreada, equipo, suerte y fuente.

Como integracion minima, `Recovery Center` registra un evento `BACKUP_CREATED` con `source: "recovery-center"` cuando se genera un respaldo manual completo. La categoria se infiere como `RECOVERY`, el payload se clona para no mutar el objeto original y no se inventa actor. No muestra interfaz de eventos, no escribe en Firebase, no usa `localStorage`, no cambia el JSON del respaldo, no implementa restauracion y no modifica reglas deportivas.

Esta base mantiene el versionado/cache-buster centralizado por `js/core/version.js` mediante `CHARROPRO_APP_VERSION`. Al iniciar se registra un unico log `[core-infra-001] app version`.

Esta base agrega una ventana informativa al terminar la captura de Colas para el equipo actual. Cuando el flujo esta por salir del ultimo coleador del ultimo intento de Colas, el sistema suma los puntos ya capturados por coleador, identifica al mejor o a los empatados, muestra equipo y puntos, y continua el flujo normal al tocar `Aceptar`. No guarda scores nuevos, no cambia puntos, no altera reglas deportivas, no toca publicacion, pagina publica, snapshot publico, cronometro, OBS ni graficos.

Esta base agrega en el calificador el boton manual `Tomar tiempo` dentro de la tarjeta de evidencia de tiempo. El juez decide cuando capturar el cronometro, selecciona una etiqueta rapida o personalizada, y el tiempo queda guardado temporalmente en el intento actual dentro del arreglo `timeEvidence`. La evidencia puede eliminarse antes de guardar/publicar. No se captura automaticamente al usar `Guardar y siguiente`, no cambia puntajes, no cambia reglas deportivas, no modifica cronometro ni Firebase Rules.

Esta base simplifica la pantalla interna de Resultados. La tabla general del torneo queda fija como resumen por fases/rondas y ya no cambia a columnas por charreada al seleccionar una fase. El selector de fase queda aplicado a la sabana: `Todas` muestra resumen general por fases y una fase especifica muestra el detalle solo de sus equipos participantes y sus charreadas. No modifica scores, calculos, calificador, pagina publica, snapshot publico ni Firebase Rules.

Esta base convierte la pestana oficial `Programa` en un tablero operativo de produccion. Cada charreada conserva la misma coleccion existente, pero ahora puede guardar datos logisticos opcionales: lienzo/sede, locutor asignado, jueces asignados, hora real de inicio, hora real de termino, estado operativo, notas internas y responsable de produccion. Si un campo no existe, la vista muestra `—` sin romper torneos anteriores.

La tarjeta de Programa ahora muestra hora programada, fecha, charreada, fase, equipos, estado deportivo, estado operativo, inicio real, termino real, duracion calculada, responsables y acciones rapidas a Juez, Locutores, Graficos y OBS. No modifica calificador, reglas deportivas, puntajes, Firebase Rules ni estructura de scores.

Esta base conecta el selector de fase/ronda de Resultados con el resumen y la sabana. En `Todas`, Resultados muestra resumen por fases. Al elegir una fase, muestra solo equipos participantes o con score registrado en esa fase, abre el desglose por charreada, agrega `Total {fase}` y conserva el `Total` general. La sabana tambien cambia: en `Todas` muestra resumen por fases y en una fase muestra solo el detalle de esa fase. No modifica scores, totales oficiales, calificador, snapshot publico ni reglas.

Esta base agrega el modulo oficial de consulta `Programa` como una pestana separada de la pantalla operativa de `Programacion`. El modulo oficial reutiliza las charreadas existentes del torneo, las agrupa por fecha/dia, permite contraer/desplegar cada dia en la sesion, y muestra hora, nombre, fase, estado, numero de equipos, equipos participantes y acciones `Abrir`, `Editar` y `Activar` segun permisos. No crea colecciones nuevas ni modifica activacion, calificador, Firebase Rules, Snapshot publico ni calculos deportivos.

Esta base agrega agrupacion por dia en la vista Programa. Las charreadas se ordenan por fecha/hora, se agrupan por fecha, cada grupo muestra dia/fecha, numero de charreadas, fases incluidas y puede desplegarse o colapsarse. No cambia activacion, calificador, Firebase Rules ni datos guardados.

Esta base agrega en la pantalla interna de Resultados un selector de fase/ronda: `Todas`, `Fase 1`, `Semifinal`, `Final`, `Ronda unica`, segun las fases reales configuradas en las charreadas. Al elegir una fase se muestra el titulo `Desglose de {fase}`, las charreadas incluidas en esa fase como columnas internas y la tabla conserva el total general visible. El selector solo cambia la vista; no modifica calificaciones, scores ni calculos.

Esta base corrige la vista interna de Resultados para leer la fase real desde las charreadas actuales, la misma fuente que usa Programa. Si varias charreadas pertenecen a `Fase 1`, Resultados muestra una sola columna `Fase 1` y suma ahi los resultados de esas charreadas por equipo. Si una charreada no tiene fase, la vista usa `Ronda unica` como agrupacion visual sin modificar los datos guardados.

La correccion agrega logs de diagnostico:

```text
[resultados-002B] charreadas source sample
[resultados-002B] phase by charreada
[resultados-002B] phase columns built
[resultados-002B] scores grouped by phase
[resultados-003] selected phase
[resultados-003] phase detail charreadas
[resultados-003] selector phase changed
[program-fase-002] day groups built
[program-fase-002] day group toggled
[programa-001] grouped by day
[programa-001] collapse restored
[programa-001] program rendered
[resultados-004] selector phase changed
[resultados-004] summary by phase rendered
[resultados-004] phase detail rendered
[resultados-004] visible teams by phase
```

Tambien conserva `phase` como campo canonico de fase/ronda por charreada. La fase se captura al crear o editar una charreada, se conserva en el estado local/Firebase y se publica en el Snapshot Publico dentro de `activeCharreada` y `schedule`.

Tambien conserva el Snapshot Publico alrededor de `normalizedScores`: el Core normaliza equipos, charreadas y calificaciones reales una sola vez, y desde esa fuente construye `currentScoreboard`, `generalRanking`, `scoresheet`, `leaders`, `lastScores`, `teams.total` y `stats` en `charropro/publicTournaments/{tournamentId}`.

El snapshot publico contiene:

```text
info
activeCharreada
currentScoreboard
generalRanking
scoresheet
scoresheetColumns
leaders
schedule
lastScores
teams
stats
generatedAt
generatedAtMs
version
```

El nodo raiz ya no conserva `summary`, `teamStandings`, `scoreSheets`, `charreadas`, `charreadaSummaries` ni `live`.

La ruta publica nunca contiene usuarios, permisos, auditorias, configuraciones internas ni datos privados.

El snapshot se reconstruye desde el Core cuando se actualiza el estado del torneo, scores, publishedScores o publicaciones oficiales. Antes de escribir se compara contra el snapshot anterior y se omite la escritura si no hubo cambios reales en el contenido publico.

Tambien conserva el fortalecimiento del flujo Preparar CharroPro sobre el aislamiento local por torneo. Antes de operar, el dispositivo limpia caches locales del sandbox, sincroniza Firebase y restaura solo el estado autorizado del torneo.

Si existe una cache anterior, CharroPro la migra automaticamente a las nuevas llaves por torneo y elimina las llaves legacy solo cuando la migracion queda verificada.

No se tocaron:

```text
calculos deportivos
reglas deportivas
flujo de calificacion
cronometro
graficos OBS
Firebase Rules
Cloud Functions
Google Sheets
pagina publica
```

Rutas oficiales activas en esta base:

```text
charropro/tournaments/{tournamentId}
charropro/tournaments/{tournamentId}/charreadas
charropro/tournaments/{tournamentId}/scores
charropro/tournaments/{tournamentId}/publishedScores
charropro/tournaments/{tournamentId}/tournamentState
charropro/live/{tournamentId}/current
charropro/live/{tournamentId}/timer
charropro/live/{tournamentId}/turn
charropro/live/{tournamentId}/ranking
charropro/publicTournaments/{tournamentId}
charropro/audit/publishedScores/{tournamentId}
```

`publicTournaments` queda como snapshot publico oficial generado por el Core. `torneo-publico.html` puede leer esa ruta cuando exista y usar `charropro/live/{tournamentId}/current` solo como respaldo operativo.

## 1. Archivos del sitio web

Estos archivos se suben a Hostinger dentro de:

```text
public_html/charropro
```

Subir o reemplazar:

```text
*.html
css/
js/
assets/
google-apps-script/
FIREBASE_ROLES_SETUP.md
firebase-rules-auditoria.json
DESPLIEGUE_CHARROPRO.md
```

No subir al hosting:

```text
functions/
node_modules/
package.json
package-lock.json
firebase.json
.firebaserc
tests/
```

`functions/` no es una carpeta publica del sitio. Si se sube a `public_html`, no funciona como Cloud Function.

## 2. Cloud Functions

Las funciones se despliegan con Firebase CLI desde la terminal, no desde Hostinger.

Desde la carpeta del proyecto:

```bash
cd "/Users/orgullocharro/Documents/Codex/2026-05-23/files-mentioned-by-the-user-index/charropro-organizado"
firebase deploy --only functions --project charropro-e8a68
```

Si solo quieres desplegar la funcion de usuarios:

```bash
firebase deploy --only functions:upsertCharroProUser --project charropro-e8a68
```

## 3. Reglas de Realtime Database

Las reglas tambien se despliegan con Firebase CLI:

```bash
firebase deploy --only database --project charropro-e8a68
```

## 4. Node modules

`node_modules/` nunca se sube a Hostinger.

Solo se usa en tu Mac para instalar dependencias y desplegar Cloud Functions.

Si falta instalar dependencias de functions:

```bash
cd "/Users/orgullocharro/Documents/Codex/2026-05-23/files-mentioned-by-the-user-index/charropro-organizado/functions"
npm install
```

Despues regresa a la carpeta principal para desplegar:

```bash
cd ..
firebase deploy --only functions --project charropro-e8a68
```

## 5. Actualizar cache de navegador

Despues de subir archivos, abre una vez:

```text
https://orgullocharro.com/charropro/?v=20260709-public-core-004-competition-snapshot1
```

Si un dispositivo sigue mostrando datos viejos:

1. Entra a CharroPro.
2. Abre `Conexion`.
3. Presiona `Limpiar cache local`.
4. Inicia sesion otra vez.

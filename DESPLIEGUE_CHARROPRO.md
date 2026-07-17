# Despliegue CharroPro

## Version THEME-ENGINE-001

Version actual de cache:

```text
v=20260714-theme-template-integration-001-themed-compositions-v1

## THEME-TEMPLATE-INTEGRATION-001

- Se agregó `Theme Template Integration V1` como capa pura entre Theme Engine y Template Renderer Integration.
- Production Console incorpora `Theme + Template Lab` con resolución, preparación, render, cambio manual de Theme, update, clear y snapshot sanitizado.
- La integración aplica tokens sobre clones de Component Instances y conserva datos, bindings, orden, scores, ranking y timer.
- Los fondos sólidos y gradients seguros se aplican al único root creado por Template Renderer; no se acepta CSS de entrada.
- Preview oficial, Program, Outputs, Broadcast State, Firebase y gráficos V1 permanecen sin cambios.
- No existe actualización automática, persistencia, Layout Engine, Animation Engine ni control de OBS.
```

Se agrego Theme Engine V1 (`1.0.0`) como registro declarativo, inmutable y exclusivamente en memoria para paletas, tipografia, espaciado, radios, bordes, sombras, logos, fondos, iconos, watermarks, safe area y defaults. La herencia se resuelve de tema base a descendiente con precedencia determinista, rechazo de ciclos y snapshots filtrados por visibilidad.

Production Console incorpora la pestana `Themes` con siete presets iniciales, acciones de crear, duplicar, eliminar, activar y desactivar, inspector JSON, snapshot y muestras visuales controladas. Estas operaciones no modifican Preview, Program, Outputs, Broadcast State, Components ni Templates.

No se agregan persistencia, Firebase, URLs de assets, editor visual, Layout Engine, Animation Engine, OBS ni Program Output. El contrato y sus limitaciones estan documentados en `BROADCAST_THEME_ENGINE_V1.md`; las pruebas puras estan en `tests/broadcast-theme-engine.test.mjs`.

### THEME-ENGINE-001B

La correccion 001B establece `themeId` como identidad canonica, conserva `id` solo como alias compatible y agrega contexto completo de tenant, organizacion, cliente, torneo, competencia y evento. Los Themes se crean como `draft`, se publican mediante API controlada y quedan inmutables; la activacion solo acepta Themes publicados y se aisla por clave efectiva de scope, sin desactivar otros tenants o torneos.

La herencia queda limitada a 12 Themes, valida jerarquia y tenant, y revisa ownership de assets en toda la cadena cuando se proporciona Asset Registry. Colores, tipografia, fondos, gradients y numeros usan validacion estricta sin correcciones silenciosas. Los snapshots `public` eliminan contexto interno y actores; `restricted` conserva contexto autorizado, pero ningun nivel expone secretos o URLs.

Los siete presets se registran y publican por API. `Default`, `Dark` y `Light` son neutrales; `Orgullo Charro` usa la identidad confirmada negro, azul rey, plata y rojo tinto; `Liga Mexicana - Provisional`, `Rodeo` y `Empresarial` se marcan como provisionales. Los controles visuales de Publicar y Deprecar quedan pendientes porque su HTML y CSS estan fuera del alcance de 001B. No se modifica Renderer, Preview, Program, Outputs ni Firebase.

## Version TEMPLATE-ENGINE-001

Version actual de cache:

```text
v=20260714-template-renderer-integration-001-composed-preview-v1
```

Esta version agrega Broadcast Template Engine V1 (`1.0.0`) como motor declarativo, puro y exclusivamente en memoria para agrupar Component Instances reutilizables. Las plantillas resuelven bindings unicamente mediante Production Variables, Broadcast Data Contract y Asset Manager; crean instancias y snapshots serializables, pero no renderizan ni modifican Preview, Program, Outputs o Broadcast State.

Production Console incorpora una pestaña `Templates` para crear, duplicar, eliminar, instanciar, inspeccionar y construir snapshots desde fixtures controlados. El registro no se persiste y permanece aislado de Component Renderer. La referencia tecnica esta en `BROADCAST_TEMPLATE_ENGINE_V1.md`, los fixtures en `fixtures/templateEngineFixtures.js` y las pruebas en `tests/broadcast-template-engine.test.mjs`.

No se agregan Firebase, listeners, rutas nuevas, escenas, composiciones, editor visual, OBS V2, expresiones, scripts ni ejecucion de plantillas `custom`. Broadcast Data Contract, Production Variables, Asset Manager, Component Library, Component Renderer, Broadcast State, Broadcast Output y graficos V1 permanecen intactos.

### TEMPLATE-ENGINE-001B

La correccion 001B completa identidad y trazabilidad con `tenantId`, contexto organizacional/deportivo, `createdBy`, `updatedBy` y `status`; protege templates publicados contra cambios y permite solo la transicion controlada a `deprecated`. La validacion bloquea cruces de tenant en componentes, contexto, bindings, fallbacks y assets.

Los snapshots aplican una matriz recursiva de visibilidad a templates y Component Instances. La vista publica elimina actores, tenant, organizacion interna, sesion, permisos, diagnosticos, secretos, URLs firmadas y metadata ejecutable; `restricted` conserva contexto autorizado, pero nunca credenciales o secretos. `custom` requiere estructura declarativa y rechaza vacios o metadata ejecutable. Layout rechaza `NaN` e infinitos sin modificar el registro.

Production Console muestra y copia el mismo snapshot sanitizado mediante un unico helper. Su inicializacion queda idempotente por root y `dispose()` elimina exclusivamente los listeners de esa instancia mediante `AbortController`. No se modifican Renderer, Preview, Program, Outputs, Firebase ni Core deportivo.

## Version COMPONENT-LIBRARY-001

Version actual de cache:

```text
v=20260713-component-library-001-components-v1
```

Esta version agrega Broadcast Component Library v1 (`1.0.0`) como base declarativa e independiente de los futuros graficos V2. `js/broadcast/componentLibrary.js` define 19 tipos, estados, visibilidad, style, layout, animation, bindings, registros inmutables, instancias desacopladas y snapshots sanitizados.

Los bindings solo resuelven Production Variables, Broadcast Data Contract o identidades del Asset Manager. No leen Core, Firebase, Broadcast State, outputs ni estructuras legacy. La libreria conserva `0`, `false`, cadena vacia y `null`; elimina funciones, simbolos, BigInt, ciclos, claves peligrosas, protocolos no autorizados y markup ejecutable; y limita profundidad y tamanos.

Production Console incorpora la pestaña `Componentes` para crear, duplicar, eliminar e inspeccionar fixtures exclusivamente en memoria. Estas operaciones no cambian Preview, Program, outputs ni persistencia. No se agregan Template Engine, renderer, Canvas, SVG, OBS, escenas o graficos V2 completos. La referencia esta en `BROADCAST_COMPONENT_LIBRARY_V1.md` y las pruebas en `tests/broadcast-component-library.test.mjs` y `tests/production-console.test.mjs`.

## Version PRODUCTION-VARIABLES-001

Version actual de cache:

```text
v=20260713-production-variables-001-variables-v1
```

Esta version agrega Production Variables v1 (`1.0.0`) como registro tipado y exclusivamente en memoria para mensajes, entrevista, produccion y referencias de recursos. La resolucion soporta scopes desde global hasta sesion, visibilidad, fallback, TTL, referencias controladas al Data Contract y referencias por identidad al Asset Manager.

Action Engine avanza de forma compatible a `1.1.0` con `REGISTER_VARIABLE`, `SET_VARIABLE`, `RESET_VARIABLE`, `DISABLE_VARIABLE`, `ENABLE_VARIABLE` y `EXPIRE_VARIABLE`. Toda mutacion desde Production Console usa esas acciones con actor conceptual, permisos, revision esperada, idempotencia y auditoria. Las variables viajan en paralelo a Broadcast State: editar una variable no modifica Preview ni Program.

Production Console incorpora el panel `Variables de Produccion`, agrupado en Textos, Entrevista, Produccion y Recursos. Muestra scope, valor efectivo, procedencia, revision y expiracion; permite guardar, resetear, activar y desactivar; y agrega una pestaña Variables al inspector. La vista publica solo incluye variables publicas y elimina actor, tenant, sesion y metadata interna.

No se agregan Firebase, Storage, `live/current`, `publicTournaments`, persistencia, permisos reales, automatizaciones, escenas, macros, OBS V2 ni cambios a graficos V1. La recarga vuelve a definiciones limpias. La referencia completa esta en `BROADCAST_PRODUCTION_VARIABLES_V1.md` y las pruebas en `tests/production-variables.test.mjs`, `tests/broadcast-action-engine.test.mjs` y `tests/production-console.test.mjs`.

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

## BROADCAST-PLAYGROUND-001

Versión:

    v=20260713-broadcast-playground-001-visual-test1

Se agregó broadcast-playground.html como banco visual aislado para probar Broadcast Data Contract v1, Broadcast State v1, Broadcast Output v1 y Asset Manager v1 con fixtures locales.

El Playground:

- funciona solo en memoria;
- mantiene Preview y Program separados;
- deja Program vacío al recargar;
- registra cinco outputs de prueba;
- registra siete assets controlados;
- permite probar layers, geometría, animaciones, heartbeat, stale y visibilidad;
- no consulta Firebase, state.js, live/current, gráficos V1 ni OBS V1;
- no es la consola ni el renderer final de Broadcast Studio.

Para abrirlo:

    https://orgullocharro.com/charropro/broadcast-playground.html?v=20260713-broadcast-playground-001-visual-test1

La especificación operativa está en BROADCAST_PLAYGROUND_V1.md.

## PRODUCTION-CONSOLE-001

Versión:

    v=20260713-production-console-001-control-center1

Se agregó `production-console.html` como primer centro de control visible de Broadcast Studio.

La consola:

- trabaja únicamente en memoria y con fixtures locales;
- consume Data Contract, Broadcast State, Broadcast Output y Asset Manager v1;
- separa Preview de Program y activa Modo seguro en cada recarga;
- opera layers, outputs, queue, assets, visibilidad e inspector mediante APIs públicas;
- inicia los outputs offline para no inventar conectividad;
- no consulta Firebase ni modifica el Core deportivo;
- no persiste Program, Preview ni queue;
- no es la consola final y todavía no incluye Template Engine ni OBS real.

Para abrirla localmente:

    http://127.0.0.1:8765/production-console.html

La especificación operativa está en `PRODUCTION_CONSOLE_V1.md`.

### PRODUCTION-CONSOLE-001B

Se cerró la fuga de identidad operativa del inspector público mediante una sanitización central y recursiva aplicada a todas sus pestañas. Preview y Program pueden permanecer activos y visibles sin exponer `preparedBy`, `takenBy`, `updatedBy`, operador, juez, sesión, tenant, cliente o diagnósticos internos.

La matriz deja actores operativos disponibles desde `operational`; `restricted` conserva contexto autorizado, pero ningún nivel expone credenciales, tokens, secretos ni referencias inseguras. La corrección no modifica Preview, Program, layers, outputs, queue, heartbeat, fixtures ni assets.

## PRODUCTION-NAV-001

Versión:

    v=20260713-production-nav-001-broadcast-access1

La aplicación principal incorpora la sección `Producción` como punto oficial de acceso a Broadcast Studio. La sección usa el identificador estable `production`, muestra el estado declarativo de sus módulos y enlaza de forma segura a:

- `production-console.html`;
- `broadcast-playground.html`.

También se agregó una tarjeta compacta de accesos rápidos en `Conexión`. La visibilidad reutiliza la capacidad existente `graphics`: supervisor, administrador normalizado, operador y gráficos tienen acceso; juez, locutor, lectura, organizador y usuarios sin permiso quedan bloqueados.

Las URLs se generan desde el origen actual y solo aceptan archivos HTML internos de una lista cerrada. No se agregaron consultas Firebase, polling, persistencia de Program, control real de OBS ni permisos persistentes nuevos. Consulta `PRODUCTION_NAV_V1.md` para la especificación completa.
# COMPONENT-RENDERER-001 - Render visual seguro de componentes V2

- Version de aplicacion: `20260714-template-renderer-integration-001-composed-preview-v1`.
- Se agrego `js/broadcast/componentRenderer.js` como renderer puro, seguro y en memoria para instancias validas de Component Library.
- Se incorporaron 18 tipos visuales, lifecycle completo, geometria por output, estilos por allowlist, fallbacks controlados y snapshots sin DOM.
- Production Console incorpora un Laboratorio de Componentes V2 para 1920 x 1080, 1080 x 1920 y 3840 x 720, sin modificar Preview, Program ni Outputs.
- No se agregaron Firebase, persistencia, OBS, calculos deportivos, timer activo, QR real, ticker animado ni Program Output.
- Contrato y limitaciones: `BROADCAST_COMPONENT_RENDERER_V1.md`.

# TEMPLATE-RENDERER-INTEGRATION-001 - Render visual de plantillas compuestas V1

- Version de aplicacion: `20260714-template-renderer-integration-001-composed-preview-v1`.
- Se agrego `js/broadcast/templateRendererIntegration.js` como capa pura entre Template Engine V1 y Component Renderer V1.
- La integracion prepara bindings antes del DOM, compone por `instanceId`, conserva una sola raiz por Template y actualiza manualmente sin duplicar nodos.
- Los errores opcionales producen `partially_rendered`; un componente required no renderizable y sin fallback bloquea antes de crear nodos.
- Production Console incorpora el Laboratorio de Templates V2 con contextos de prueba, outputs 1920 x 1080, 1080 x 1920 y 3840 x 720, visibilidad, safe area, metricas, diagnosticos y snapshot sanitizado.
- Los doce fixtures oficiales de Template Engine pueden prepararse, renderizarse, actualizarse y limpiarse desde el laboratorio.
- El runtime es exclusivo del laboratorio: no modifica Preview, Program, Outputs, Broadcast State, Firebase ni el Core deportivo.
- QR permanece como placeholder sin asset resuelto, ticker es estatico y timer no crea intervalos.
- Contrato, seguridad y limitaciones: `BROADCAST_TEMPLATE_RENDERER_INTEGRATION_V1.md`.

# THEME-TEMPLATE-INTEGRATION-001C - Cierre final

- La integración conserva una `basePreparation` privada e inmutable y reconstruye cada Theme desde esa fuente, evitando residuos al cambiar de Theme.
- Las actualizaciones son atómicas: un Theme, Asset o visibility inválido conserva estado, DOM, revision y timestamps anteriores.
- La resolución automática admite solo Themes publicados (`published` o `active` con `publishedAt`); selecciones explícitas pueden usar `draft`, `inactive` o `deprecated`; `error` nunca se aplica.
- Los Assets requeridos bloquean con `theme-required-asset-unavailable` cuando no están disponibles o autorizados.
- `themeVariant`, `gap` y `border.style` quedan diagnosticados como capacidades no soportadas en V1 y no se reportan como aplicados.
- La visibilidad pública elimina contenido no público del DOM y permite restaurarlo desde la base al volver a producción.
- Los snapshots no contienen `basePreparation`, DOM, registries ni referencias runtime.
- `destroy` bloquea todas las operaciones posteriores con `theme-template-integration-destroyed`.
- No se integraron Preview oficial, Program, Outputs, OBS, Firebase ni persistencia.

# PREVIEW-ENGINE-001 - Official Broadcast Preview Engine V1

- Versión de aplicación: `20260715-preview-engine-001-official-preview-v1`.
- Se agregó `js/broadcast/previewEngine.js` como motor oficial, aislado y en memoria para una sola composición Preview.
- El motor recibe exclusivamente snapshots de Theme Template Integration y delega el DOM al runtime temático existente; no invoca Component Renderer directamente.
- El lifecycle cubre preparación, render, actualización atómica, limpieza, reutilización y destrucción terminal.
- Los snapshots son desacoplados y no contienen DOM, runtime, renderer, listeners, actores, secretos ni identidad tenant en visibilidad pública.
- Production Console sustituye el bloque Theme + Template Lab por `Official Preview`, con las acciones Preparar, Renderizar, Actualizar, Limpiar y Snapshot.
- Official Preview no modifica Broadcast State V1, Program, Outputs, OBS, Firebase ni el Core deportivo.
- Contrato y limitaciones: `BROADCAST_PREVIEW_ENGINE_V1.md`.

# PROGRAM-ENGINE-001 - Official Broadcast Program Engine V1

- Versión de aplicación: `20260715-program-engine-001-official-program-v1`.
- Se agregó `js/broadcast/programEngine.js` como motor oficial en memoria para una sola composición Program.
- Program recibe únicamente snapshots validados de Preview Engine y modela Prepare, Take, Cut, Auto, Update, Clear y Snapshot.
- Preview permanece vivo después de cualquier promoción; Program usa identidad y runtime privados, sin compartir referencias mutables.
- Las actualizaciones son atómicas y conservan el Program anterior ante una validación fallida.
- Production Console incorpora `Official Program` con canvas de raíz única, estado, métricas y diagnósticos separados de Official Preview.
- No se agregaron Browser Outputs, OBS, vMix, Firebase, persistencia, Live Sync, animaciones ni routing.
- Broadcast State V1, Output Engine y los gráficos V1 permanecen intactos.
- Contrato y limitaciones: `BROADCAST_PROGRAM_ENGINE_V1.md`.

# OUTPUT-ROUTING-001 - Enrutamiento oficial de salidas Broadcast V1

- Versión de aplicación: `20260715-output-routing-001-three-official-routes-v1`.
- Se agregó `js/broadcast/outputRouting.js` como motor puro, privado y en memoria para las tres rutas lógicas oficiales: `program-main`, `announcer-monitor` y `timer-display`.
- `program-main` recibe exclusivamente snapshots validados de Program; no prepara ni modifica Program.
- `announcer-monitor` proyecta datos ya calculados para locución con visibilidad operational/restricted y sin controles de producción.
- `timer-display` conserva tiempo, estado y revisión del cronómetro oficial existente sin crear un segundo reloj ni controles.
- El motor incluye lifecycle, revisión esperada, idempotencia, stale bajo consulta, aislamiento multi-tenant, sanitización y snapshots desacoplados.
- Production Console incorpora `OUTPUT ROUTING` con tres tarjetas, proyecciones técnicas y acciones explícitas de configuración y resolución.
- No se agregaron Browser Outputs, URLs físicas, OBS, vMix, Firebase, persistencia, polling, sockets ni automatización.
- La página pública continúa fuera de Output Routing y sigue usando `publicTournaments`.
- Contrato y limitaciones: `BROADCAST_OUTPUT_ROUTING_V1.md`.

# BROWSER-OUTPUT-001 - Infraestructura común de salidas web Broadcast V1

- Versión de aplicación: `20260715-browser-output-001-common-web-output-infrastructure-v1`.
- Se agregó `js/broadcast/browserOutput.js` como infraestructura pura, aislada y en memoria para recibir proyecciones ya resueltas por Output Routing.
- El lifecycle cubre configuración, montaje de una sola raíz, aplicación explícita, actualización, limpieza reutilizable y destrucción terminal.
- `browser-output.html` funciona únicamente como laboratorio técnico común con fixtures locales, display modes, orientaciones, safe areas, transparencia, fullscreen manual e inspector seguro.
- Production Console incorpora un acceso mínimo al laboratorio, sin generar una URL productiva ni una Browser Source oficial.
- No se agregaron Firebase, sockets, polling, persistencia, OBS, vMix, Wirecast ni conexión en tiempo real.

## BROADCAST-REALTIME-LIVE-001

Versión: `20260716-broadcast-context-resolution-001-real-context-v1`.

Se agregó transporte Broadcast RTDB bajo `charropro/broadcastStudio/sessions/{sessionId}` y Live Bindings declarativos. Production Console publica únicamente proyecciones sanitizadas y revisiones monotónicas; Program Main y Announcer Monitor reciben copias limitadas mediante accesos temporales de solo lectura.

`BROADCAST-SIMPLE-ACCESS-001` reutiliza el login y los roles existentes `supervisor` y `graficos`, siempre sujetos al acceso del torneo. La sesión se deriva automáticamente de torneo, competencia y charreada activa. No requiere perfiles nuevos, rol locutor, IDs manuales, `broadcastSessions`, `broadcastPublishSessions` ni identidad organizacional en el perfil.

V1 usa el scope interno single-tenant `charropro-e8a68` y conserva aislamiento por torneo, competencia, charreada, sesión y tipo de salida. Los enlaces comparten solo `sessionId` y un `accessId` criptográfico, revocable, expirante y ligado a `program_main` o `announcer_monitor`; nunca incluyen UID, permisos, tenant, organización, cliente o credenciales.

Las reglas de `charropro/broadcastStudio` se desplegaron de forma controlada en el proyecto `charropro-e8a68`; la verificación posterior confirmó igualdad con `firebase-rules-auditoria.json`. No se modificaron perfiles reales ni se crearon usuarios. Las reglas deportivas fuera del namespace Broadcast permanecieron sin cambios y la migración a multi-tenant oficial queda pendiente para una fase posterior.

`BROADCAST-CONTEXT-RESOLUTION-001` centraliza la identidad productiva en `resolveCurrentBroadcastContext()`. Production Console solo aporta el torneo seleccionado como pista; Firebase valida acceso, torneo y charreada activa, deriva la competencia y crea un `sessionId` determinista. URL, `localStorage` y fixtures no pueden imponer competencia, charreada, sesión ni identidad organizacional. Live Bindings usa el contrato Firebase real como base y valida torneo, competencia y charreada antes de actualizar Output Routing.

Al recibir el primer contrato real, Production Console invalida cualquier Preview, Program o ruta preparada en laboratorio. Templates, Themes, Official Preview y Official Program pasan a consumir exclusivamente el Broadcast Data Contract de la sesión; los fixtures no se reutilizan ni se publican en el contexto oficial.

El cierre de sesión revoca primero Program Main y Announcer, después marca el contexto como cerrado y admite repetición idempotente. Una sesión inexistente devuelve `not-found` controlado; renovar revoca capacidades anteriores y crea accesos nuevos sobre la misma sesión determinista.

Las pruebas automatizadas usan adapter falso y no escriben en Firebase de producción. Continúan fuera de alcance NDI, video, audio, Timer Display, OBS/vMix, WebSocket, polling y cualquier cambio al Core deportivo.
- No se implementaron todavía las interfaces finales de Program Main, Announcer Monitor o Timer Display.
- Contrato y limitaciones: `BROADCAST_BROWSER_OUTPUT_V1.md`.

# PROGRAM-PROJECTION-001 + THEME-PREPARATION-EXPORT-001 - Transporte declarativo coherente V1

- Version de aplicacion: `20260715-program-projection-001b-theme-preparation-export-v1`.
- Preview Snapshot conserva una composicion declarativa sanitizada con componentes, capas, orden, geometria, estilos resueltos, contenido, datos y referencias de assets por identidad.
- Theme Template Integration expone `preparation` vigente en render, update y snapshot mediante copias sanitizadas y desacopladas.
- Preview rechaza `preview-theme-preparation-mismatch` si un cambio de Theme, Template, bindings, contexto, visibilidad o snapshot no entrega una preparacion coherente.
- La frescura se valida por la preparacion devuelta y su identidad Theme/Template; `preparedAt` y `updatedAt` pueden ser marcas consecutivas y no requieren igualdad exacta.
- La regresion de integracion real cubre Theme A a Theme B, retiro de residuos, tres y cuatro equipos, Take, Cut, Auto, Program Snapshot y Output Routing.
- Take, Cut y Auto copian esa composicion hacia Program sin compartir referencias mutables; un cambio posterior de Preview no modifica Program.
- Program Snapshot publica `projectionVersion`, `composition`, `components`, `layers`, `sourceRevision` y `programRevision` sin DOM, renderer, listeners, actores ni secretos.
- Output Routing reenvia la proyeccion oficial y conserva Program vacio como `controlled-empty`, con `composition: null`, `components: []` y `layers: []`.
- Browser Output no fue modificado y continua como infraestructura tecnica; el render final de Program Main queda fuera de este ticket.
- Contrato, seguridad y limitaciones: `BROADCAST_PROGRAM_PROJECTION_V1.md`.

# PROGRAM-MAIN-OUTPUT-001 - Salida visual oficial Program Main V1

- Versión de aplicación: `20260715-program-main-output-001-official-program-visual-output-v1`.
- Se agregó `js/broadcast/programMainOutput.js` como salida visual específica para la ruta oficial `program-main`.
- La salida recibe exclusivamente el sobre validado de Output Routing y usa Browser Output para lifecycle/revisiones y Component Renderer para el DOM declarativo.
- `program-main-output.html` es una página local limpia, transparente, sin navegación, inspector ni controles de Program.
- Program vacío permanece transparente; Program activo conserva identidad, composición, componentes, capas, geometría, Theme, Template y turno oficial.
- El cambio A → B prepara el siguiente render de forma aislada y retira por completo las capas anteriores después de validar el nuevo resultado.
- Production Console incorpora únicamente el enlace local `Abrir Program Main Output`; abrirlo no modifica Preview ni Program.
- Los fixtures locales requieren `?debug=1&fixture=...` y nunca se activan en modo normal.
- No se agregaron Firebase, WebSocket, polling, BroadcastChannel, OBS, vMix, Wirecast, autenticación, URL productiva ni sincronización automática.
- Contrato, seguridad, lifecycle y limitaciones: `BROADCAST_PROGRAM_MAIN_OUTPUT_V1.md`.

# ANNOUNCER-MONITOR-001 + ANNOUNCER-MONITOR-001A - Monitor operativo para locutores V1

- Versión de aplicación: `20260715-announcer-monitor-001-operational-monitor-ndi-ready-v1`.
- Se agregó `js/broadcast/announcerMonitor.js` como salida operacional de solo lectura que consume exclusivamente `announcer_projection` desde Output Routing mediante Browser Output.
- `announcer-monitor.html` presenta contexto, turno actual, siguiente, cronómetro oficial, posiciones, mensajes, patrocinador y alertas sin consultar Program, Preview, Firebase o el Core deportivo.
- La región `announcer-video-region` queda reservada como placeholder 16:9 para una futura fuente NDI local; no existe conexión, receptor, reproducción, audio, URL, IP, socket o integración de red.
- Se soportan los modos locales `balanced`, `video_focus`, `data_focus`, `compact` y `large_text`, además de tamaño de texto y fullscreen explícito.
- Production Console incorpora un único acceso `Abrir Announcer Monitor`; el acceso heredado de Locutores no se modifica porque vive fuera del alcance autorizado. Jueces y Supervisión permanecen intactos.
- El módulo incluye lifecycle, revisiones, stale, visibilidad operational/restricted, aislamiento multi-tenant, sanitización, snapshots desacoplados y pruebas de regresión.
- Archivos nuevos: `js/broadcast/announcerMonitor.js`, `announcer-monitor.html`, `css/announcer-monitor.css`, `tests/announcer-monitor.test.mjs` y `BROADCAST_ANNOUNCER_MONITOR_V1.md`.
- Estado: implementado localmente y pendiente de publicación; este cierre no crea commit ni push.
- Limitaciones: sin sincronización productiva de la página aislada, sin NDI/video/audio real, sin persistencia y sin controles de producción o cronómetro.
- Siguiente paso después de publicar este ticket: `TIMER-DISPLAY-001`; la conexión local de video se reserva para `ANNOUNCER-NDI-VIDEO-001`.
- Contrato, seguridad y limitaciones: `BROADCAST_ANNOUNCER_MONITOR_V1.md`.
# BROADCAST-ACCESS-AND-SYNC-001 — Centro de acceso y sincronización local

- Se agregó `broadcast-studio.html` como centro de acceso para Production Console, Playground, Program Main Output, Announcer Monitor, Browser Output Lab y los portales independientes de Jueces/Supervisión.
- Se agregó `js/broadcast/outputSynchronization.js` V1 para aplicar Program Snapshot y `announcer_projection` en targets locales montados dentro de Production Console.
- Program vacío se aplica como `cleared` sin error; el receptor interno de Program Main usa visibilidad `production` y conserva la política de no elevar datos hacia salidas públicas.
- La sincronización es explícita, aislada, revisionada e idempotente. No ejecuta Take/Cut/Auto y no modifica Program, Preview, Output Routing ni los módulos de salida.
- Production Console distingue `FIXTURE DE LABORATORIO` de `DATOS REALES DE LA SESIÓN` y no presenta fixtures como operación productiva.
- Los accesos heredados `Abrir OBS` y `Locutores` están definidos en `js/app.js`, fuera del alcance autorizado, por lo que su migración queda pendiente.
- Jueces y Supervisión permanecen intactos.
- Esta fase no usa Firebase, WebSocket, polling, BroadcastChannel, NDI ni transporte entre pestañas o computadoras.
- Versión: `20260715-broadcast-access-and-sync-001-local-output-sync-v1`.

# BROADCAST-STUDIO-WORKSPACE-001 — Workspace oficial de producción

- Versión de la interfaz: `20260717-broadcast-studio-workspace-001-operator-workspace-v1`.
- `broadcast-studio.html` deja de ser un directorio de módulos y se convierte en la aplicación operativa de Broadcast Studio.
- El Workspace integra un catálogo de 15 gráficos, búsqueda, filtros, Preview, Program y botonera Prepare/Take/Cut/Auto/Limpiar en una sola pantalla.
- El catálogo delega en Template Engine y Theme Engine; Preview y Program usan exclusivamente sus motores oficiales existentes.
- La columna Program monta Program Main Output dentro del Workspace y recibe la proyección resuelta por Output Routing. No se creó renderer alterno.
- El contexto se conecta mediante el transporte Realtime certificado y solo habilita operación cuando existe contrato oficial del torneo activo.
- La vista del operador oculta contratos, snapshots, IDs, revisiones, bindings, variables, rutas y detalles Firebase; Production Console y Playground permanecen disponibles únicamente como herramientas técnicas heredadas.
- El acceso principal de Producción ahora abre directamente `broadcast-studio.html`.
- Cronómetro permanece como placeholder deshabilitado; siguen fuera de alcance NDI, OBS, vMix, Wirecast, editor visual, capas manuales, timeline y macros.

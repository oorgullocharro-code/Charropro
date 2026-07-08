# Despliegue CharroPro

## Version RECOVERY-001E

Version actual de cache:

```text
v=20260708-recovery-001e-snapshot-status1
```

Esta base aclara el indicador de `Snapshot publico` dentro de `Recovery Center`. Cuando no hay snapshot cargado localmente, ahora muestra `Snapshot publico no detectado en esta sesion` y explica que puede existir en Firebase porque la revision solo valida datos cargados localmente. Si existe `publicSnapshot` o `publicTournaments` en memoria local, el indicador sigue en verde; si no existe localmente, queda en amarillo, nunca en rojo. No consulta Firebase directamente, no escribe en Firebase, no cambia el JSON de respaldo, no implementa restauracion, no modifica calificador, jueces, resultados ni pagina publica.

Esta base mantiene el versionado/cache-buster centralizado por `js/core/version.js` mediante `CHARROPRO_APP_VERSION` y actualiza la entrada principal de `index.html` a `v=20260708-recovery-001e-snapshot-status1` para refrescar `app.js` y `styles.css`. Al iniciar se registra un unico log `[core-infra-001] app version`.

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
https://orgullocharro.com/charropro/?v=20260708-recovery-001e-snapshot-status1
```

Si un dispositivo sigue mostrando datos viejos:

1. Entra a CharroPro.
2. Abre `Conexion`.
3. Presiona `Limpiar cache local`.
4. Inicia sesion otra vez.

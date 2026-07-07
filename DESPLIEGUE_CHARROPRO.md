# Despliegue CharroPro

## Version PUBLIC-CORE-003

Version actual de cache:

```text
v=20260706-public-core-003-normalized-snapshot1
```

Esta base unifica el Snapshot Publico alrededor de `normalizedScores`. El Core normaliza equipos, charreadas y calificaciones reales una sola vez, y desde esa fuente construye `currentScoreboard`, `generalRanking`, `scoresheet`, `leaders`, `lastScores`, `teams.total` y `stats` en `charropro/publicTournaments/{tournamentId}`.

La pagina publica y clientes futuros solo consumen el snapshot; no calculan ranking, marcador ni sabana.

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
https://orgullocharro.com/charropro/?v=20260706-release22d-active-charreada-source2
```

Si un dispositivo sigue mostrando datos viejos:

1. Entra a CharroPro.
2. Abre `Conexion`.
3. Presiona `Limpiar cache local`.
4. Inicia sesion otra vez.

# Despliegue CharroPro

## Version comercial 22D

Version actual de cache:

```text
v=20260706-release22d-active-charreada-source2
```

Esta base unifica la fuente de verdad de la charreada activa. La tarjeta superior, la lista de charreadas, jueces y el estado sincronizado usan el mismo `activeCharreadaId`, evitando que dos charreadas aparezcan como `EN VIVO`.

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
charropro/audit/publishedScores/{tournamentId}
```

`publicTournaments` queda tratado como modulo publico/futuro si no esta completo en esta base. `torneo-publico.html` intenta leer `charropro/publicTournaments/{tournamentId}` cuando exista y usa `charropro/live/{tournamentId}/current` como respaldo real de broadcast. Si no hay datos publicos disponibles, muestra `Informacion publica no disponible todavia` en vez de datos demo.

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

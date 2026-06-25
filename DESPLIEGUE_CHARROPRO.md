# Despliegue CharroPro

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
https://orgullocharro.com/charropro/?v=20260622-prepare-gate1
```

Si un dispositivo sigue mostrando datos viejos:

1. Entra a CharroPro.
2. Abre `Conexion`.
3. Presiona `Limpiar cache local`.
4. Inicia sesion otra vez.


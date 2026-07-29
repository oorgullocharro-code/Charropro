# CharroPro Master Audit - Evidencia

## Estado base

Verificado antes de la auditoría:

```text
branch: main
HEAD:        78a51f23ae1f2b13e48667041048b9624f57d6ae
main:        78a51f23ae1f2b13e48667041048b9624f57d6ae
origin/main: 78a51f23ae1f2b13e48667041048b9624f57d6ae
working tree: clean
staging: empty
```

La auditoría no escribió Firebase, no desplegó reglas, no modificó dependencias y no ejecutó migraciones.

## Inventario reproducible

Comandos:

```bash
rg --files
git ls-files
find . -type f
find js -type f -name '*.js'
find tests -maxdepth 1 -type f
wc -l
```

Resultados iniciales:

- 223 archivos visibles por `rg --files`.
- 226 archivos rastreados por Git.
- 201 archivos de texto incluidos en el conteo de líneas.
- Aproximadamente 125,122 líneas de texto/código.
- 44 archivos de prueba.

Archivos de mayor tamaño:

| Archivo | Líneas |
| --- | ---: |
| `js/app.js` | 12,209 |
| `css/styles.css` | 8,618 |
| `js/broadcast/productionConsole.js` | 6,701 |
| `js/core/firebaseSync.js` | 4,333 |
| `css/production-console.css` | 2,466 |
| `css/public-portal.css` | 2,376 |
| `js/broadcast/announcerMonitor.js` | 2,007 |
| `js/broadcast/assetManager.js` | 1,849 |
| `js/broadcast/broadcastPlayground.js` | 1,824 |
| `js/broadcast/themeTemplateIntegration.js` | 1,733 |
| `js/broadcast/programMainOutput.js` | 1,717 |

## Áreas y archivos revisados

### Entradas

- `index.html`, `torneo.html`, `torneo-publico.html`.
- `jueces.html`, `supervision.html`, `locutores.html`.
- `cronometro.html`, `cronometro-pantalla.html`.
- `graficos.html`, `obs.html`, `grafico-*.html`.
- `broadcast-studio.html`, `production-console.html`, `broadcast-playground.html`.
- `program-main-output.html`, `announcer-monitor.html`, `browser-output.html`.
- `formato-federacion.html`.

### Core

Todos los archivos en `js/core`, incluyendo:

- estado, scoring, flow, statistics, history;
- Firebase sync, roles, local cache, sync;
- exports, XLSX, formato oficial;
- context, timer rules, graphics config;
- events, DOM y versionado.

### Datos y reglas deportivas

- `js/data/calaRules.js`.
- `js/data/suertes.js`.
- `js/data/competitionTypes.js`.
- layouts de scoring.

### Público

- Todos los archivos en `js/public`.
- Todos los archivos en `js/publicPortal`.
- `js/views/torneo-publico.js`.
- CSS y HTML del portal.

### Broadcast

Todos los archivos en `js/broadcast`, fixtures, HTML, CSS y documentación V1:

- contracts/state/actions/variables/assets;
- components/templates/themes;
- Preview/Program/projection/output;
- realtime/workspace/console;
- Program Main/Announcer/Browser Output;
- Live Bindings/synchronization.

### Firebase/backend

- `firebase-rules-auditoria.json`.
- `firebase.json`, `.firebaserc`.
- `functions/index.js`.
- `functions/package.json` y lockfile.

### Legacy/integraciones

- Todos los archivos en `js/views`.
- Google Apps Script.
- gráficas/OBS/locutor/timer V1.

### Documentación

- README.
- Arquitecturas.
- Despliegue.
- documentos de Portal/Broadcast.
- auditorías/sprints previos.

### Tests

Los 44 archivos en `tests`.

## Comandos de pruebas

### Suite completa

```bash
node --test tests/*.test.mjs
```

Resultado:

```text
tests: 44
pass: 44
fail: 0
cancelled: 0
skipped: 0
todo: 0
duration_ms: 2068.943333
```

### Sintaxis JavaScript

Se ejecutó `node --check` sobre todos los archivos JavaScript rastreados.

Resultado: sin errores.

### Whitespace/diff

```bash
git diff --check
```

Resultado previo a crear estos reportes: sin errores.

### Dependencias Functions

```bash
cd functions
npm audit --omit=dev --json
```

Resultado:

```text
exit: 1
dependencies: 252
prod: 160
optional: 93
vulnerabilities: 10
low: 1
moderate: 9
high: 0
critical: 0
```

### Versiones/cache-busters

```bash
rg -n "\\?v=" --glob "*.js" --glob "*.html" .
```

Se encontraron 24 valores distintos. Los más repetidos:

| Versión | Referencias |
| --- | ---: |
| `20260708-recovery-001b-panel-status1` | 65 |
| `20260727-broadcast-live-graphics-001-live-data-geometry-v1e` | 37 |
| `20260712-production-competitions-001-broadcast-context1` | 37 |
| `20260709-competitions-003-scoring-by-competition1` | 24 |
| `20260727-public-portal-program-ux-001-program-phase-pm-v1` | 17 |
| `20260713-broadcast-output-001-output-v1` | 11 |
| `20260728-public-live-feed-integration-001-fix-001-v1` | 9 |

El mapa de imports confirmó:

- `firebaseSync.js`: seis URLs/versiones.
- `state.js`: dos.
- `sync.js`: tres.
- `version.js`: cuatro.
- `publicProjectionSchema.js`: dos.

## Evidencia de hallazgos críticos

### Publicación parcial

- `firebaseSync.js:686` inicia la publicación oficial.
- `firebaseSync.js:736` completa el multipath privado.
- `firebaseSync.js:744` inicia la proyección pública.
- `firebaseSync.js:768` devuelve `ok:true` aunque exista `partialFailure`.
- `app.js:11495` detecta la advertencia.
- `app.js:11525` retorna el resultado con `ok` heredado.
- `app.js:11728` llama publicar.
- `app.js:11729` bloquea solo si `!ok`.
- `app.js:11747` libera draft.
- `app.js:11750` avanza.

### Concurrencia

- `state.js:966` obtiene versiones desde memoria.
- `state.js:973` calcula revisión local.
- `state.js:982` supersede registros locales.
- La actualización Firebase agrega el nuevo ID, sin transaction por `attemptKey`.

### Auditoría mutable

- `firebase-rules-auditoria.json:410` permite write con `newData.exists()` e ID igual.
- No existe condición `!data.exists()`.

### Delete inconsistente

- `firebaseSync.js:985-990` enumera las únicas rutas eliminadas.
- `publicTournaments` y `broadcastStudio` no están.
- `firebaseSync.js:1035` puede devolver `ok:true` con cleanup fallido.

### Missing -> zero

- `state.js:447`: `total: Number(record.total || 0)`.

### Local storage

- `state.js:601-610`: `saveState` escribe storage sin contención.

### Recovery

- `app.js:6466-6520`: JSON completo local.
- `firebaseSync.js:2928-2959`: backup remoto.
- No se encontró función de restore/import del backup.

### Reglas

- `firebase-rules-auditoria.json:59`: live público.
- `firebase-rules-auditoria.json:37-48`: writes privados amplios.
- `firebase-rules-auditoria.json:175`: cliente juez puede publicar proyección V2.
- `firebase-rules-auditoria.json:338-350`: rankings/statistics/search públicos se fuerzan a unavailable.
- Broadcast exige tenant único fijo.

## Análisis de referencias

Se construyó un grafo de imports estáticos y exports. Resultado relevante:

- No se detectaron módulos JS de producción totalmente sin incoming imports salvo entrypoints.
- `broadcastAccessHub.js` solo se observa desde su test; el HTML activo carga Workspace.
- Hay rutas legacy activas por HTML directo aunque no tengan import desde app.
- No se intentó borrar nada porque un HTML externo puede ser consumidor.

## Validaciones no ejecutadas

### Bloqueadas por seguridad/alcance

- Escritura real a Firebase de producción.
- Emulación de delete/restore contra datos reales.
- Publicación simultánea desde dos usuarios reales.
- Deploy de reglas.
- Modificación de dependencias.

### No disponibles en el repositorio

- Firebase Emulator test harness.
- Playwright/Puppeteer/browser E2E.
- Cobertura de código.
- Visual regression.
- Accessibility automation.
- Load testing.

### No verificadas físicamente

- Evento completo con juez, portal y Broadcast en dispositivos distintos.
- Operación de 8+ horas.
- Luz exterior/tableta.
- OBS/vMix hardware.
- Recuperación después de corte eléctrico.
- 100 dispositivos/100 organizaciones.

Estas limitaciones se etiquetan como “no verificable en producción” y no se convierten en afirmaciones positivas.

## Método de confirmación

- **Confirmado:** visible directamente en código/reglas/tests o resultado de comando.
- **Parcialmente confirmado:** módulo y flujo local existen, pero falta backend/hardware real.
- **Inferido:** consecuencia lógica de reglas/código; se indica explícitamente.
- **No verificable:** requiere producción, usuario o hardware.
- **Bloqueado:** ejecutar la prueba podría afectar datos.
- **No implementado:** no existe un path funcional encontrado.

## Integridad de la auditoría

- No se corrigió ningún defecto.
- No se cambió configuración.
- No se alteraron documentos existentes.
- Los únicos archivos creados son los 13 reportes exigidos.
- No se hizo commit ni push.

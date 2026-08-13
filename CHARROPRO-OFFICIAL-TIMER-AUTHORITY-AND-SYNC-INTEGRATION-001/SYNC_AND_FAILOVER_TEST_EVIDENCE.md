# Sync and Failover Test Evidence

## Entorno

- Proyecto Emulator: `demo-charropro-local`
- Auth: `127.0.0.1:9099`
- RTDB: `127.0.0.1:9000`
- Functions: `127.0.0.1:5001`
- Storage: `127.0.0.1:9199`
- Torneo sintético: `demo-local-fmch-2026`
- Charreada sintética: `demo-local-fmch-jornada-1`
- Firebase Production writes: 0

## Matriz real de Firebase Rules

La Rules vigente se cargó únicamente en el Emulator local y se probó con Auth Emulator y el adaptador real de `firebaseSync.js`.

| Caso | Resultado |
| --- | --- |
| Controlador autenticado | PASS |
| `controllerUid` coincide con `auth.uid` | PASS |
| Suplantación de controlador | REJECTED |
| Revisión obsoleta | REJECTED |
| Usuario no autorizado | REJECTED |
| PAUSED -> RUNNING | PASS |
| PAUSED -> FINISHED | PASS |
| Reescritura directa sin transición | REJECTED |
| Retry mismo `commandId` | IDEMPOTENT |
| Retry conserva `authorityAcceptedAt` | PASS |
| Retry conserva estado y revisión | PASS |
| Datos sintéticos de prueba eliminados | PASS |

## Validación operativa dirigida

Se usaron simultáneamente el Scorer real y el Remote real en LOCAL / EMULATOR.

| Flujo | Evidencia observada |
| --- | --- |
| START remoto | Remote y Scorer mostraron RUNNING y el mismo tiempo |
| PAUSE remoto | Ambos mostraron PAUSED y el mismo tiempo congelado |
| RESUME remoto | Ambos regresaron a RUNNING sin salto oficial |
| FINISH remoto | Estado FINISHED persistió tras reconectar |
| Takeover | Scorer pasó a `Calificador de respaldo`; Remote quedó observador |
| Handback | Control regresó a `Juez de campo` sin cambiar `timerId` ni tiempo |
| Reload/reconnect | La última revisión canónica reapareció sin reset |
| Paso salida | 3 min, START/PAUSE/RESUME/FINISH sincronizados |
| Paso desmonte | 1 min, START/PAUSE/FINISH sincronizados |
| Manganas | Contexto de 7 min visible en Scorer y Remote |
| Terna + Apretalamiento | Ambos contextos coexistieron con estados independientes |
| Timer Display | Mostró la misma Terna FINISHED y tiempo 06:04.0 |
| Announcer sin sesión Broadcast | Estado seguro `No disponible`; sin datos inventados |

La cobertura de Announcer y Broadcast con proyección válida se completa con sus suites automáticas y las aserciones de `official-timer-authority-sync.test.mjs`. No se creó ni publicó una sesión Broadcast artificial durante esta validación.

## Evidencia visual

La inspección en el navegador local confirmó READY, RUNNING, PAUSED, dos contextos simultáneos, Scorer sincronizado y takeover. No se agregaron capturas al repositorio para respetar el límite documental de cinco archivos y evitar evidencia redundante.

## Pruebas automáticas

- Suite completa: 67/67 archivos de prueba aprobados.
- `tests/official-timer-authority-sync.test.mjs`: PASS.
- `node --check`: 46/46 archivos JS/MJS modificados aprobados.
- JSON: 2/2 archivos modificados válidos.
- `git diff --check`: PASS.
- `git diff --cached --check`: PASS con staging vacío.
- Secret scan: PASS.
- `debugger` scan: PASS.
- `console.log` scan: PASS.
- Cache-buster scan: 71 archivos con el token final y cero archivos modificados con el token anterior.

La suite completa incluye las regresiones de Full Scorer, Pending Workflow, Terna, Manganas, Paso, Jineteos, Timer Display/Output Routing, Announcer Monitor, publicación oficial, protección de score, Portal Público, Broadcast y Configuration Management.

## Limitaciones conocidas fuera de alcance

- Portal Público: acumulados parciales y posición provisional.
- Terna: cambio automático Cabecero -> Pial y cierre anticipado de oportunidades.
- Revisión UX completa del Scorer y fichas de cabecera.
- CORS productivo de `publishCharroProOfficialScore`.

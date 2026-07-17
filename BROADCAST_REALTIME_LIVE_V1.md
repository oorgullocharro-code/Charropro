# Broadcast Realtime + Live Bindings V1

## Propósito

`BROADCAST-REALTIME-LIVE-001` agrega transporte entre pestañas o computadoras para Broadcast Studio sin reemplazar el Core deportivo. Firebase Realtime Database transporta únicamente proyecciones sanitizadas, revisiones, contexto mínimo y estado técnico.

Versiones:

- Broadcast Realtime Transport: `1.0.0`
- Live Bindings: `1.0.0`
- Aplicación: `20260716-broadcast-context-resolution-001-real-context-v1`

## Arquitectura

```text
Core deportivo
  -> Broadcast Data Contract
  -> Production Variables
  -> Live Bindings
  -> Preview / Program / Announcer Projection
  -> Broadcast Realtime Transport
  -> Firebase RTDB
  -> Program Main / Announcer Monitor (read-only)
```

Output Routing sigue siendo responsable de crear las proyecciones. El transporte no calcula scores, rankings, posiciones, penalizaciones ni tiempos.

## Namespace Firebase

```text
charropro/broadcastStudio/sessions/{sessionId}/
  context/
  program/current/
  announcer/current/
  outputs/{outputId}/
  revisions/{channel}/
  health/{clientId}/
  access/{accessId}/
    descriptor/
    program/current/
    announcer/current/
```

No se escribe en `scores`, `publishedScores`, `audit/publishedScores`, `live/current` ni `publicTournaments`.

## Contexto obligatorio

Production Console envía únicamente el `tournamentId` seleccionado por la aplicación como pista de resolución. `resolveCurrentBroadcastContext()` valida esa pista contra Firebase, el usuario autenticado y el torneo real, y obtiene de la charreada activa oficial:

- `tournamentId`
- `competitionId`
- `activeCharreadaId`
- `sessionId` determinista
- procedencia, revisión y fecha de resolución

La sesión se genera de forma determinista con torneo, competencia y charreada activa reales. El operador no escribe ni selecciona `sessionId`. Tampoco introduce `tenantId`, `organizationId` o `clientId`. Una competencia, charreada o sesión enviada por URL que no coincida con Firebase se rechaza sin crear ni modificar la sesión.

V1 opera como single-tenant controlado dentro del proyecto Firebase `charropro-e8a68`. Ese identificador es un scope técnico interno, no una identidad del perfil humano ni un parámetro de URL. El aislamiento operativo se mantiene por torneo, competencia, charreada, sesión y tipo de salida. La estructura conserva campos organizacionales para una evolución multi-tenant, pero V1 los mantiene en `null` y no aplica fallback cruzado.

La URL y `localStorage` no son autoridad de publicación. El caché `charropro_tournament_active_v1` solo permite recuperar el torneo seleccionado al navegar hacia la consola; Firebase vuelve a validar el torneo, deriva competencia y charreada y confirma los permisos. `sessionStorage`, payloads y fixtures no conceden identidad ni permisos. Los fixtures solo pueden entrar al transporte cuando una prueba o laboratorio pasa explícitamente `allowFixture: true`; la interfaz productiva nunca activa esa opción.

El contrato recibido desde `live/current` debe coincidir con torneo, competencia y charreada del contexto resuelto. Live Bindings usa ese contrato real como base, por lo que no conserva identidad ni datos de `torneo_playground`. Output Routing, Program Main y Announcer reciben exactamente el mismo contexto del transporte o de sus capacidades temporales.

Templates, Theme Template Integration, Official Preview y Official Program usan ese mismo contrato cuando la fuente real está lista. Al entrar por primera vez a un contexto oficial se limpian Preview, Program y rutas preparadas previamente en laboratorio; una composición fixture nunca puede heredarse ni publicarse dentro de la sesión real. Los fixtures permanecen disponibles únicamente cuando la consola opera como laboratorio desconectado.

## Acceso simplificado

Los roles existentes `supervisor` y `graficos` pueden inicializar y publicar una sesión Broadcast cuando están activos y tienen acceso al torneo. `juez`, páginas públicas y salidas no reciben publicación por defecto. No se crean usuarios `locutor` o `broadcast_output`, no se agregan opciones al login y no se requieren `broadcastSessions` ni `broadcastPublishSessions` en los perfiles.

Program Main y Announcer Monitor usan capacidades temporales de solo lectura. Cada descriptor contiene:

```json
{
  "accessId": "bca_...",
  "sessionId": "broadcast_...",
  "outputType": "program_main",
  "channel": "program",
  "readOnly": true,
  "status": "active",
  "expiresAt": 0
}
```

El identificador se genera con criptografía del navegador, expira como máximo en 24 horas y puede revocarse al renovar o cerrar la sesión. La copia accesible queda limitada a un canal: `program_main` solo lee `program`; `announcer_monitor` solo lee `announcer`. Los adaptadores de salida no exponen publicación ni escritura de estado.

Cerrar una sesión revoca primero todas las capacidades activas y después marca el contexto como `closed`. El cierre repetido es idempotente y una sesión inexistente devuelve `not-found` de forma controlada. Renovar revoca las capacidades anteriores, reactiva la sesión determinista si estaba cerrada y emite capacidades nuevas.

## Revisiones e idempotencia

Cada canal conserva una revisión monotónica. La escritura Firebase usa transacción:

- `expectedRevision` incorrecta aborta sin mutar;
- una revisión regresiva recibida se ignora;
- una revisión duplicada refresca health sin reaplicar la proyección;
- `idempotencyKey` repetida con la misma intención devuelve el resultado anterior;
- la misma llave con intención diferente se rechaza.

Al reconectar se lee la última revisión publicada y se conserva la última proyección válida. Una desconexión marca `stale/offline`; nunca limpia Program ni avanza un cronómetro.

## Live Bindings

Tipos V1:

- `current_team`
- `current_participant`
- `current_horse`
- `current_suerte`
- `current_score`
- `standings`
- `official_timer`
- `next_team`
- `next_participant`
- `sponsor_mention`
- `production_message`
- `tournament_context`

Cada binding usa una ruta fuente permitida y una ruta destino declarada como live-bindable. Aplicar bindings crea una copia nueva de la proyección; no muta Preview, Program ni Data Contract. Cambiar Template, Theme, geometría, capas, permisos, tenant o tipo de salida sigue requiriendo un Preview y Take oficial.

## Turno oficial

`current_team` lee `team`, el campo canónico del contrato que ya representa el turno oficial. Para compatibilidad controlada también acepta `turn.team` cuando recibe una fuente legacy. No usa el último score, el último calificado, índices locales ni inferencias. Rankings y timers se transportan tal como llegan del contrato.

## Seguridad

El transporte:

- elimina funciones, símbolos y BigInt;
- controla ciclos, profundidad, arreglos y tamaño de objetos;
- bloquea `__proto__`, `constructor` y `prototype`;
- rechaza markup ejecutable y protocolos inseguros;
- elimina secretos, credenciales, actor, datos del juez y referencias Firebase;
- conserva `0`, `false`, `""` y `null`;
- nunca incluye payloads completos en snapshots de health.

Las reglas propuestas aíslan torneo, competencia, charreada, sesión y salida. El scope single-tenant queda fijo en `charropro-e8a68`; una proyección con contexto diferente se rechaza también en el cliente.

Las proyecciones no pueden declarar `tenantId`, `organizationId` ni `clientId`. Production Console retira esas claves del payload antes de publicar y conserva la identidad autorizada únicamente en el sobre generado por el transporte. Un payload externo que intente incluirlas se rechaza de forma atómica.

El adapter codifica de forma reversible las claves declarativas que RTDB no admite, por ejemplo `properties.text`, antes de escribir. Program Main y Announcer reciben las claves originales después de la lectura; la codificación nunca altera valores, bindings, componentes ni el contrato en memoria.

## Consola y salidas

Production Console incorpora:

- Conectar
- Desconectar
- Resincronizar
- Renovar sesión
- Cerrar sesión
- Copiar Snapshot
- estado, revisiones, stale, reconexiones, warnings y errors
- Abrir y copiar enlaces temporales para Program Main y Locutores

Los enlaces contienen únicamente `sessionId` y un `accessId` revocable. No contienen UID, permisos, tenant, organización, cliente ni credenciales Firebase. `program-main-output.html` y `announcer-monitor.html` resuelven el contexto desde el descriptor autorizado; no requieren otro login. Sin acceso conservan su comportamiento local/laboratorio.

## Despliegue validado

Las reglas de `charropro/broadcastStudio` se desplegaron en el proyecto Firebase `charropro-e8a68`. La comparación posterior confirmó que las reglas remotas coinciden con `firebase-rules-auditoria.json` y que las reglas deportivas fuera del namespace Broadcast no cambiaron.

## Limitaciones V1

- El modelo V1 es single-tenant y no sustituye el futuro aislamiento real por `tenantId`, organización y cliente.
- Los accesos temporales son capacidades: quien posea un enlace vigente puede leer únicamente la salida indicada hasta su expiración o revocación.
- La distribución de copias por acceso ocurre después de publicar el canal canónico; no es una escritura multi-ruta atómica en V1.
- No existe NDI, video, audio, Timer Display, OBS Bridge, vMix Bridge, WebSocket ni polling.
- No se persisten Templates ni Themes.
- Las pruebas automatizadas usan adapter falso; no escriben en Firebase de producción.

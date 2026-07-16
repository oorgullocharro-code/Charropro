# Broadcast Access Hub y Output Synchronization V1

## Propósito

`BROADCAST-ACCESS-AND-SYNC-001` incorpora dos piezas complementarias:

- Broadcast Access Hub V1, como punto central para abrir herramientas y salidas;
- Output Synchronization V1, como coordinador explícito entre motores oficiales y salidas locales dentro del mismo contexto JavaScript.

Versiones:

- Broadcast Access Hub: `1.0.0`;
- Output Synchronization: `1.0.0`;
- aplicación: `20260715-broadcast-access-and-sync-001-local-output-sync-v1`.

## Arquitectura

Program usa el flujo:

```text
Preview Engine
→ Program Engine
→ Program Snapshot
→ Output Routing
→ Output Synchronization local
→ Program Main Output
```

Locutores usa el flujo:

```text
Datos operativos autorizados
→ announcer_projection
→ Output Routing
→ Output Synchronization local
→ Announcer Monitor
```

Output Synchronization no ejecuta Take, Cut o Auto. Solo consume el resultado oficial posterior y lo aplica en la salida seleccionada.

## Broadcast Access Hub

`broadcast-studio.html` separa cuatro áreas:

- Operación: Production Console y Broadcast Playground;
- Salidas: Program Main Output, Announcer Monitor y Browser Output Lab;
- Estado: Program, Program Main, Announcer Monitor y sincronización local;
- Portales operativos: Jueces y Supervisión.

Jueces y Supervisión no se presentan como outputs y conservan sus rutas existentes. El acceso principal al Hub queda disponible en `broadcast-studio.html` y desde el encabezado de Production Console.

Los accesos heredados `Abrir OBS` y `Locutores` viven en `js/app.js`, archivo no autorizado por este ticket. No fueron modificados y su migración queda pendiente para un ticket de navegación expresamente autorizado.

## Output Synchronization

El módulo `js/broadcast/outputSynchronization.js` coordina exclusivamente los targets:

- `program_main`;
- `announcer_monitor`.

Su API pública incluye creación, configuración, inicio, detención, sincronización individual o conjunta, limpieza aislada, stale explícito, consultas, diagnósticos, snapshot, validación, clonación y destrucción.

### Lifecycle

```text
uninitialized
→ configured
→ ready
→ synchronizing
→ synchronized / partial / stale / error
→ stopped / cleared
→ destroyed
```

`destroyed` es terminal. No se permiten sincronizaciones, consultas ni snapshots operativos posteriores.

## Program Main

`synchronizeProgramMain()`:

1. obtiene el Program Snapshot mediante la API pública de Program Engine o recibe uno ya autorizado;
2. resuelve `route-program-main` mediante Output Routing;
3. valida la envoltura para Program Main Output;
4. aplica la proyección sin modificar Program, el snapshot o la ruta fuente;
5. registra revisiones source, route, output y projection locales.

Soporta Program activo, controlled-empty, cambios de composición y clear explícito. `controlled-empty` limpia el target local y conserva las revisiones source/route sin tratar la ausencia de composición como error. Cambiar Preview sin una operación oficial de Program no cambia Program Main.

El receptor interno montado en Production Console usa visibilidad `production`: acepta Program de producción y también contenido público sin elevar visibilidad. Este receptor no publica ni transporta datos hacia las páginas independientes.

## Announcer Monitor

`synchronizeAnnouncerMonitor()` recibe fuentes operativas autorizadas, solicita `announcer_projection` a Output Routing, valida la envoltura y la aplica al monitor de solo lectura. No recalcula standings, no inventa next, no modifica el cronómetro y no consulta Data Contract o Production Variables por su cuenta.

## Sincronización explícita

Production Console ofrece:

- Sincronizar Program Main;
- Limpiar salida;
- Sincronizar Announcer Monitor;
- Limpiar monitor;
- Sincronizar todas.

Las instancias visuales locales se montan dentro de Production Console para conservar un único contexto de ejecución. Los enlaces “Abrir salida” y “Abrir monitor” abren las páginas independientes, pero V1 no transporta el estado hacia esas otras pestañas.

La consola distingue `FIXTURE DE LABORATORIO` y `DATOS REALES DE LA SESIÓN`. Los fixtures nunca se anuncian como Program productivo.

## Revisiones y stale

Las operaciones mutantes aceptan `expectedRevision` cuando aplica. Una revisión incorrecta produce `output-synchronization-revision-conflict` antes de modificar rutas o targets.

Stale se detecta al sincronizar o consultar cuando:

- expira `staleAfterMs`;
- se marca explícitamente una salida;
- existe una revisión anterior;
- cambia o desaparece un contexto autorizado.

No existen timers globales para stale. El último resultado válido se conserva y las demás salidas permanecen intactas.

## Idempotencia

`synchronizeProgramMain`, `synchronizeAnnouncerMonitor`, `synchronizeAllOutputs`, `clearSynchronizedOutput` y `stopOutputSynchronization` aceptan `idempotencyKey`.

- misma clave y misma intención: devuelve el resultado previo sin reaplicar ni incrementar revisiones;
- misma clave e intención distinta: rechaza con `output-synchronization-idempotency-conflict`.

## Snapshot

El snapshot contiene solo identidad, estado, revisiones resumidas, stale, última sincronización y diagnósticos. No incluye Program completo, announcer sources, DOM, listeners, callbacks, runtime, Firebase refs, actores o secretos.

Modificar el snapshot no modifica el sincronizador ni las salidas.

## Aislamiento

- sincronizar Program Main no cambia Announcer;
- sincronizar Announcer no cambia Program Main;
- clear de un target no limpia el otro;
- `synchronizeAllOutputs` registra resultado conjunto y puede quedar partial;
- dos sincronizadores no comparten estado ni referencias mutables.

## Seguridad

El coordinador rechaza funciones, símbolos, BigInt, ciclos, accesores, DOM, protocolos inseguros, claves peligrosas, secretos y estructuras excesivas. Conserva `0`, `false`, `""` y `null`. No usa `eval`, `new Function`, HTML dinámico ni callbacks recibidos por payload.

## Production Console

La sección `SINCRONIZACIÓN DE SALIDAS` muestra por target:

- estado;
- source revision;
- route revision;
- output revision;
- stale;
- última sincronización;
- conteo de warnings y errors.

La sección no incorpora controles de cronómetro, conexión NDI, conexión OBS, Firebase ni autenticación.

## Limitaciones V1

- no hay transporte entre pestañas, navegadores o computadoras;
- no hay Firebase, WebSocket, polling, BroadcastChannel, Service Worker, EventSource ni postMessage;
- no existe NDI, video o audio nuevo;
- no hay persistencia ni recuperación de sincronización;
- no hay autenticación ni URL productiva protegida;
- las páginas independientes abiertas desde enlaces no reciben el runtime de Production Console;
- el siguiente ticket autorizado podrá implementar transporte en tiempo real después de publicar este ticket y confirmar árbol limpio.

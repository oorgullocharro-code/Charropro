# Broadcast Announcer Monitor V1

## Propósito

Announcer Monitor es la salida operacional de solo lectura para narradores, comentaristas y cabina de CharroPro Broadcast Studio. Presenta el contexto oficial de la competencia, el turno vigente, el siguiente turno, el cronómetro, posiciones, mensajes, patrocinador y alertas sin ejecutar cálculos deportivos ni emitir comandos.

Versión del módulo: `1.0.0`.

Versión de aplicación: `20260715-announcer-monitor-001-operational-monitor-ndi-ready-v1`.

## Arquitectura

```text
Broadcast Data Contract
        ↓
Production Variables
        ↓
Preview Engine
        ↓
Program Engine
        ↓
Output Routing
        ↓
Browser Output
        ↓
Announcer Monitor
```

El monitor consume exclusivamente el sobre `announcer_projection` ya resuelto por Output Routing. No importa ni consulta Preview, Program, Firebase, el Core deportivo, el cronómetro del juez, Templates, Themes o Componentes. Browser Output aporta el lifecycle común de la salida web; Announcer Monitor conserva su raíz, regiones, reglas operativas y presentación especializada.

## Contrato de entrada

El sobre aceptado debe declarar:

```js
{
  routeId: "route-announcer-monitor",
  routeType: "announcer_monitor",
  outputId: "announcer-monitor",
  sourceType: "announcer_projection",
  sourceRevision: 12,
  routeRevision: 4,
  status: "routed",
  visibility: "operational",
  resolution: { width: 1920, height: 1080 },
  projection: {
    kind: "announcer-monitor",
    status: "ready",
    current: {},
    next: {},
    standings: [],
    timer: {},
    notes: [],
    sponsorMention: null,
    alerts: [],
    context: {},
    generatedAt: "ISO-8601"
  },
  warnings: [],
  errors: [],
  resolvedAt: "ISO-8601"
}
```

Solo se permiten las visibilidades `operational` y `restricted`. `public` y `production` se rechazan. Los identificadores de tenant, organización, cliente, torneo, competencia y sesión se comparan cuando existen; un conflicto se rechaza de forma atómica y no sustituye la última vista válida.

## Información presentada

### Actual

`current` puede aportar equipo, participante, caballo, suerte, intento, puntuación, posición, líder, estado y `turnRevision`. Todos los valores se muestran tal como llegan. El monitor no recalcula ni infiere el turno desde el último score, el último calificado o un índice local.

### Siguiente

`next` puede aportar equipo, participante, caballo, suerte, orden estimado y estado. Los datos ausentes se muestran como `No disponible`; no se deduce el siguiente participante.

### Contexto

`context` presenta torneo, competencia, sesión, charreada, sede, suerte actual, categoría, fecha, progreso y estado. Los valores faltantes no se inventan.

### Cronómetro

`timer` es una lectura del cronómetro oficial recibido: `ready`, `running`, `paused`, `stopped`, `finished`, `completed`, `unavailable`, `stale` u `offline`. Conserva texto, milisegundos, revisión y alerta. No crea intervalos, no avanza tiempo localmente y no ofrece Start, Pause, Stop o Reset.

### Posiciones

`standings` conserva exactamente orden, cantidad, posición, nombre, score, estado y diferencia recibidos. No recalcula ranking, desempates o diferencias y admite competencias por equipos e individuales.

### Mensajes, patrocinador y alertas

Las notas y alertas se presentan como texto plano. En `operational` se retira contenido `restricted`; una instancia `restricted` puede mostrarlo únicamente si la nueva proyección lo autoriza. El patrocinador usa nombre y mención como fallback; `logoRef` solo acepta identidad declarativa de asset y nunca resuelve URLs arbitrarias.

## Región de video reservada

`announcer-video-region` es únicamente una reserva visual 16:9 para `ANNOUNCER-NDI-VIDEO-001`. Cada instancia conserva un `videoRegionId` propio para aislar su DOM. Actualmente siempre conserva:

```js
{
  videoRegionPresent: true,
  videoRegionStatus: "placeholder",
  videoConnected: false,
  videoSourceType: null,
  videoMuted: true
}
```

El placeholder muestra `VIDEO LOCAL` y `Fuente NDI pendiente de conexión`.

NDI no está implementado: no existe conexión real, receptor, SDK, reproducción de video, audio, cámara, micrófono, canvas, socket, polling, WebRTC, SRT, HLS o RTMP. Los datos operativos y la futura señal local permanecerán separados. La fuente futura recomendada será una salida NDI local de OBS, vMix o una mezcladora compatible, preferentemente sobre Ethernet Gigabit; no se garantiza baja latencia por Wi-Fi.

## Modos de presentación

- `balanced`: balance predeterminado entre video y datos.
- `video_focus`: amplía la reserva de video y compacta información secundaria.
- `data_focus`: amplía el contexto deportivo y mantiene visible el video.
- `compact`: reduce densidad para espacios limitados.
- `large_text`: prioriza lectura a distancia.

Estos modos, el tamaño de texto, el viewport y pantalla completa son ajustes locales. No cambian la proyección, sus revisiones, visibilidad, Program, Preview, Output Routing o cronómetro.

## Lifecycle

- `uninitialized`: instancia creada.
- `ready`: configuración válida.
- `mounted`: raíz única montada.
- `ready` o `partial`: proyección vigente presentada.
- `stale`: conserva la última vista válida y muestra diagnóstico controlado.
- `disabled`, `unavailable` y `error`: estados de salida controlados.
- `cleared`: datos retirados, configuración y placeholder preservados.
- `destroyed`: raíz, listeners y referencias privadas retirados; el estado es terminal.

Una revisión menor se rechaza. La misma `routeRevision` y `sourceRevision` con contenido idéntico es idempotente; contenido distinto con las mismas revisiones produce conflicto. `projectionRevision` pertenece solo al monitor.

## DOM y accesibilidad

Cada instancia monta una raíz propia con regiones separadas para contexto, video, actual, cronómetro, siguiente, posiciones, mensajes, patrocinador, alertas y estado. `mount` repetido no duplica raíces, `clear` conserva la raíz y `destroy` la elimina sin afectar otras instancias.

La interfaz usa HTML semántico, encabezados, `aria-live` para estado, etiquetas explícitas y foco visible. Todo contenido dinámico se crea con nodos y `textContent`; no se usa `innerHTML`, eventos inline, iframes, scripts remotos ni estilos recibidos como texto.

## Responsive

El layout cubre 1920×1080, 1440×900, 1366×768, 1024×768, 390×844, 1080×1920 y 3840×720. En móvil se apilan contexto, video, cronómetro, actual, siguiente, alertas, mensajes, posiciones y patrocinador. Las listas usan desplazamiento interno y el documento evita overflow horizontal.

## Seguridad

La clonación segura:

- no muta inputs;
- elimina o rechaza funciones, símbolos, BigInt, ciclos y accesores;
- rechaza objetos no serializables y prototipos inesperados;
- bloquea `__proto__`, `constructor` y `prototype`;
- bloquea claves de secretos, red, video, runtime y APIs privadas;
- limita profundidad, propiedades, arreglos, textos y tamaño total;
- conserva `0`, `false`, `""` y `null`;
- neutraliza HTML y protocolos inseguros como texto;
- acepta assets solo por `assetId`, `version` y `variant`.

No se exponen DOM, listeners, renderer, Browser Output runtime, Program, Preview, contrato completo, variables completas, datos del juez, actor, secretos, IP, fuente NDI, frames, buffers o audio.

## Snapshot

`getAnnouncerSnapshot()` entrega un resumen serializable y desacoplado con identidad del monitor, estado, revisiones, resumen actual/siguiente/timer/contexto, conteos, presencia de patrocinador, estado seguro de la región de video, warnings y errors.

Un snapshot `operational` elimina notas y alertas restringidas. La visibilidad nunca puede elevarse. Modificar el snapshot o sus objetos anidados no modifica la instancia, el DOM ni la proyección fuente.

## Multi-tenant y aislamiento

Las transiciones validan tenant, organización, cliente, torneo, competencia y sesión cuando están definidos. No existe fallback cruzado ni consulta externa. Dos instancias conservan raíces, revisiones, modos, viewport, estado de video, proyecciones, snapshots y listeners independientes.

## Página y debug

`announcer-monitor.html` es la superficie normal limpia. `announcer-monitor.html?debug=1` habilita un laboratorio local identificado como `LABORATORIO LOCAL — DATOS DE PRUEBA`; sus fixtures no consultan datos productivos y no representan sincronización oficial.

## Acceso operativo

Production Console incorpora un único enlace `Abrir Announcer Monitor` a `./announcer-monitor.html`. El acceso heredado de Locutores vive fuera de los archivos autorizados por este ticket y no se sustituye todavía. Su migración queda pendiente; Jueces y Supervisión permanecen sin cambios.

## Limitaciones

- No hay conexión de datos en tiempo real en la página aislada.
- No existe NDI, video o audio real.
- No hay persistencia local ni remota del monitor.
- No hay controles de producción, Program, Preview, cronómetro o datos deportivos.
- No se modifican Output Routing, Browser Output, Firebase, OBS, gráficos V1 ni portales operativos existentes.

## Pruebas

La suite `tests/announcer-monitor.test.mjs` cubre API, configuración, contrato, lifecycle, DOM, current oficial, next, contexto, timer, standings, visibilidad, revisiones, multi-tenant, seguridad, modos, video placeholder, snapshots, aislamiento, clear y destroy. La validación manual se realiza en modo normal y debug sobre los siete viewports oficiales.

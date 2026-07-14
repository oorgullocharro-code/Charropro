# CharroPro Broadcast Studio Control Center v1

## Propósito

Production Console v1 es el primer centro de control visible de Broadcast Studio. Su objetivo es comprobar la operación conjunta de Broadcast Data Contract v1, Broadcast State v1, Broadcast Output v1 y Asset Manager v1 desde una interfaz profesional y segura.

Es un skeleton operativo. No es la consola final de producción.

## Versión

- Console: `1.0.0`
- Aplicación: `20260713-production-console-001-control-center1`

## Cómo abrir

La consola requiere un servidor local:

```text
http://127.0.0.1:8765/production-console.html
```

No se garantiza operación mediante `file://` porque utiliza módulos ES.

## Arquitectura

La consola funciona en memoria y consume únicamente:

- Broadcast Data Contract v1 para normalizar y sanitizar contexto.
- Broadcast State v1 para Preview, Program, layers, gráficos y queue.
- Broadcast Output v1 para outputs, proyecciones y heartbeat simulado.
- Asset Manager v1 para recursos, variantes y fallback.
- Fixtures declarativos compartidos del Broadcast Playground.

No consulta Firebase, `state.js`, `broadcastContext`, `live/current`, scores internos, gráficos V1, OBS V1, Event Engine ni Recovery.

## Barra superior

Muestra:

- versión de aplicación;
- versiones de los cuatro motores Broadcast;
- fixture activo;
- output seleccionado;
- estado general;
- estado de Modo seguro;
- acciones Restaurar, Limpiar todo y Modo seguro.

## Modo seguro

Modo seguro inicia activado en cada carga, incluso si se desactivó durante una sesión anterior.

Con Modo seguro:

- no se puede enviar contenido a Program sin Preview válido;
- Take, Cut y Auto requieren confirmación explícita;
- Clear Program requiere confirmación;
- capas protegidas y emergency conservan las guardas de Broadcast State.

## Contexto de prueba

La consola ofrece seis fixtures:

- competencia por equipos con tres equipos;
- competencia por equipos con cuatro equipos;
- Charro Completo;
- Caladero;
- Coleadero;
- Pialadero.

Cada fixture pasa por `buildBroadcastDataContract()`. El panel muestra torneo, competencia, jornada, equipo o participante, caballo, suerte, total y posición.

## Preview

Preview consume `broadcastState.preview`. Permite preparar definiciones declarativas y ajustar:

- posición;
- tamaño;
- escala;
- opacidad;
- anclaje;
- unidad;
- layer;
- output;
- asset;
- animación;
- duración;
- delay;
- autoHide.

Los cambios de Preview no modifican Program.

## Program

Program consume `broadcastState.program` y se presenta como panel de solo lectura.

Solo cambia mediante:

- Take;
- Cut;
- Auto;
- Clear Program controlado.

Al promover Preview se captura también el Data Contract correspondiente. Cambiar después fixture, asset, geometría, visibilidad, layer, output o heartbeat no modifica la composición al aire.

## Transiciones

Los controles disponibles son:

- Preparar en Preview;
- Take;
- Cut;
- Auto;
- Clear Preview;
- Clear Program;
- Ocultar gráfico;
- Ocultar todo;
- Reemplazar gráfico;
- Restaurar último Preview.

Restaurar último Preview solo funciona dentro del mismo contexto. Cargar otro fixture elimina esa restauración para evitar mezcla deportiva.

## Biblioteca de gráficos

Incluye ocho definiciones de prueba:

- Marcador;
- Turno;
- Calificación;
- Ranking;
- Cronómetro;
- Detalle de Cala;
- Patrocinador;
- Mensaje libre.

Las definiciones son declarativas y reutilizan el catálogo compartido del Playground. No existe un HTML por gráfico y no son plantillas definitivas.

## Geometría

Se validan números finitos, ancho y alto mayores que cero, escala mayor que cero y opacidad entre cero y uno. La posición cero, la opacidad cero, `false` y la cadena vacía se conservan.

Presets disponibles:

- superior izquierda;
- superior derecha;
- inferior izquierda;
- inferior derecha;
- centrado;
- pantalla completa;
- pequeño;
- mediano;
- grande.

## Layers

Se muestran las nueve layers oficiales:

- background;
- scoreboard;
- turn;
- score;
- timer;
- alerts;
- sponsors;
- fullscreen;
- emergency.

Las acciones seleccionar, mostrar, ocultar, bloquear y desbloquear usan `setLayerState()`. Fullscreen es exclusivo sin destruir otras layers. Emergency y layers locked requieren confirmación cuando corresponde.

## Outputs

Se registran en memoria:

- Preview 1920×1080;
- Program 1920×1080;
- Vertical 1080×1920;
- LED panorámico 3840×720;
- Monitor de locutor 1280×720.

Los outputs comienzan offline para no inventar conectividad. La consola permite simular online, offline, stale y heartbeat. No abre sockets, polling, timers de red ni conexiones reales.

## Queue

La cola usa `enqueueBroadcastItem()`, `dequeueBroadcastItem()` y `getBroadcastQueue()`.

Permite:

- agregar un gráfico;
- quitarlo;
- subir prioridad;
- bajar prioridad;
- limpiar la cola.

La cola respeta prioridad y FIFO. Nunca reproduce automáticamente ni modifica Program.

## Assets

La consola registra siete recursos controlados:

- logo de organización;
- logo de torneo;
- patrocinador;
- foto de participante;
- foto de caballo;
- fondo;
- watermark.

Se muestran `assetId`, `assetFamilyId`, versión, variante, scope, visibility, status y fallback. No se suben archivos, no se consulta Storage, no se usan `file://`, URLs arbitrarias ni signed URLs.

## Inspector

El inspector contiene vistas de solo lectura para:

- Data Contract;
- Broadcast State;
- Preview;
- Program;
- Output;
- Projection;
- Assets;
- Queue;
- Warnings;
- Errors.

Permite copiar JSON y actualizar la proyección mostrada. El JSON no puede editarse.

### Sanitización del inspector

Todas las pestañas pasan por `sanitizeProductionConsoleInspectorData()` antes de renderizarse. La misma copia sanitizada alimenta el `textContent` del inspector y la acción Copiar JSON. La barrera se vuelve a ejecutar al cambiar pestaña, visibilidad o actualizar el inspector.

La sanitización:

- recorre objetos y arreglos sin mutar Broadcast State, Preview, Program, outputs, assets o proyecciones;
- elimina funciones, símbolos, ciclos y números no finitos;
- bloquea `__proto__`, `constructor` y `prototype`;
- limita profundidad y cantidad de elementos;
- rechaza referencias `javascript:` y `file://`;
- conserva `0`, `false`, `""` y `null`;
- elimina credenciales, contraseñas, tokens, secretos, URLs firmadas y claves privadas en todos los niveles.

La defensa se aplica nuevamente a las proyecciones aunque Broadcast Output ya haya sanitizado su Data Contract.

### Matriz de visibilidad del inspector

| Visibilidad | Datos disponibles | Datos eliminados |
| --- | --- | --- |
| `public` | Estado visual, revisiones, composición, gráficos visibles, layers, geometría, outputs públicos y Program activo | Actores, operador, juez, sesión, tenant, cliente, organización interna, diagnósticos, latencia interna, metadata, `scoreDetail`, warnings y errors operativos, referencias locales y secretos |
| `production` | Datos visuales de producción, `scoreDetail`, latencia y metadata ya depurada | `preparedBy`, `takenBy`, `updatedBy`, actores, sesión, tenant, cliente, organización interna, diagnósticos y secretos |
| `operational` | Identidad operativa autorizada, actores, `preparedBy`, `takenBy`, `updatedBy`, dispositivo, sesión y diagnósticos | Tenant, cliente, organización interna y secretos |
| `restricted` | Contexto autorizado completo, incluidos actores, sesión, tenant, cliente y organización | Secretos, credenciales, tokens, funciones, símbolos, ciclos y referencias inseguras |

La visibilidad pública puede indicar que Program está `on_air`, conservar revisión, layers y gráficos visibles, pero nunca identifica quién preparó o promovió el contenido.

## Visibilidad

Los niveles disponibles son `public`, `production`, `operational` y `restricted`.

Cada cambio reconstruye el Data Contract. La proyección pública elimina tenant, cliente, operador, juez, diagnósticos, metadata sensible, `scoreDetail` restringido, secretos y referencias locales.

## Estado local

La consola usa `sessionStorage` solo para preferencias:

- fixture;
- output;
- pestaña del inspector;
- tamaño de panel;
- Modo seguro;
- visibilidad.

No guarda Preview, Program, queue, contratos, assets, tokens ni secretos. Una recarga crea Preview, Program y queue vacíos y reactiva Modo seguro.

## Renderer de consola

El renderer demostrativo consume únicamente una proyección de Broadcast Output. Renderiza safe area, layers, gráficos, geometría, opacidad, assets y fallbacks.

Los datos dinámicos se escriben con `textContent`. No ejecuta HTML, scripts, CSS o JavaScript arbitrario y no recalcula resultados.

## Responsive

La distribución fue diseñada para:

- 1920×1080;
- 1440×900;
- 1366×768;
- 1024×768.

En pantallas intermedias la columna derecha baja debajo de la operación. En pantallas estrechas todos los paneles se apilan. Los controles críticos permanecen disponibles y las tablas usan scroll interno controlado.

## Seguridad

- Program no se escribe directamente.
- Queue no se modifica directamente.
- Los fixtures, contratos, outputs y assets no se mutan.
- No se usa `innerHTML` con datos dinámicos.
- No se cargan esquemas `javascript:` o `file://`.
- No se persiste estado operativo.
- Los valores `0`, `false` y `""` se conservan.
- La visibilidad pública aplica una proyección reducida.
- Ninguna vista del inspector conserva referencias a los objetos internos.
- La identidad operativa aparece únicamente desde visibilidad `operational`.

## Limitaciones

- No existe Action Engine.
- No existe Template Engine.
- No existe Theme Engine definitivo.
- No existe Layout Engine definitivo.
- No existe Animation Engine definitivo.
- No existen scenes, macros, automation, mensajería ni Run of Show.
- No hay integración real con OBS, vMix, Wirecast o hardware LED.
- No persiste Program.
- No controla Firebase.
- Usa fixtures locales.
- No reemplaza el Playground ni los gráficos V1.
- No es la consola final de Broadcast Studio.

# Broadcast Playground v1

## Propósito

Broadcast Playground es el banco visual de pruebas de CharroPro Broadcast Studio. Permite comprobar manualmente la integración entre Broadcast Data Contract v1, Broadcast State v1, Broadcast Output v1 y Asset Manager v1 sin consultar Firebase ni el Core deportivo.

No es la consola final de producción, el renderer final, un Template Engine, un editor visual ni un controlador de OBS. No persiste Program y no abre conexiones reales.

## Versión

- Playground: 1.0.0
- Aplicación: 20260713-broadcast-playground-001-visual-test1

## Cómo abrirlo

Servir la carpeta de CharroPro por HTTP y abrir:

    /charropro/broadcast-playground.html

En desarrollo local:

    python3 -m http.server 8080

    http://127.0.0.1:8080/broadcast-playground.html

Los módulos ES no deben probarse abriendo el archivo directamente con file://.

## Módulos probados

| Módulo | Uso en Playground |
| --- | --- |
| Broadcast Data Contract v1 | Normaliza todos los fixtures y aplica visibilidad |
| Broadcast State v1 | Controla Preview, Program, layers, gráficos y contextRef |
| Broadcast Output v1 | Registra outputs, genera proyecciones y controla heartbeat |
| Asset Manager v1 | Registra, valida y resuelve assets y variantes en memoria |

No se lee state.js, live/current, broadcastContext, scores internos ni gráficos V1.

## Fixtures

El módulo js/broadcast/fixtures/broadcastPlaygroundFixtures.js define fixtures locales para:

- Competencia por equipos, con tres equipos por defecto y soporte para cuatro o más.
- Charro Completo, con participantes individuales y sin Terna ni Jineteo de Yegua.
- Caladero, con Cala y scoreDetail.
- Coleadero, con Colas e intentos.
- Pialadero, con Piales e intentos.

Cada fixture se convierte mediante buildBroadcastDataContract(). Los valores oficiales del fixture no se recalculan en la interfaz.

## Preview

Preview se construye exclusivamente desde broadcastState.preview. Cada preparación crea una instancia gráfica nueva para evitar que una edición posterior comparta referencias con Program.

Los cambios de fixture, posición, tamaño, escala, opacidad, layer, asset, animación y visibilidad afectan únicamente Preview hasta ejecutar Take, Cut o Auto.

## Program

Program solo cambia mediante:

- promotePreviewToProgram()
- clearProgramState()

Al enviar Preview a Program se captura una instantánea independiente del State y del Data Contract usados en ese momento. Los cambios posteriores de Preview no alteran el contenido al aire.

Al recargar la página se crea un estado nuevo con Program inactivo. Program nunca se escribe en localStorage ni sessionStorage.

## Outputs

El Playground registra en memoria:

| Output | Resolución | Tipo |
| --- | --- | --- |
| Preview | 1920 x 1080 | preview |
| Program | 1920 x 1080 | program |
| Vertical | 1080 x 1920 | mobile_monitor |
| LED panorámico | 3840 x 720 | led |
| Monitor de locutor | 1280 x 720 | locutor_monitor |

Cada output conserva resolución, orientación, safe area, estado, heartbeat, stale, revisión aplicada, visibilidad y layers asignadas. Cambiar el output visualizado no cambia Program.

## Heartbeat

Los controles usan las APIs de Broadcast Output para enviar heartbeat, simular retraso, rechazar secuencia repetida, simular stale, simular offline y restaurar online.

No se abre ninguna conexión de red. Un heartbeat puede actualizar el descriptor operativo del output, pero no modifica la composición de Program.

## Layers

Se muestran las nueve layers oficiales:

- background
- scoreboard
- turn
- score
- timer
- alerts
- sponsors
- fullscreen
- emergency

Cada fila muestra orden, visible, locked, exclusive, cantidad de gráficos y outputs. Las acciones de emergencia y las operaciones sobre layers bloqueadas requieren confirmación explícita.

## Assets

Asset Manager registra en memoria:

- logo de organización;
- logo de torneo;
- patrocinador;
- foto de participante;
- foto de caballo;
- fondo;
- watermark.

Los recursos usan assetId, assetFamilyId, versión, variantes, status, visibility, scope y fallback. Las referencias son placeholders locales controlados; no se consulta Firebase Storage ni se cargan URLs arbitrarias.

## Geometría

Los controles permiten definir X, Y, ancho, alto, escala mayor que cero, opacidad entre 0 y 1, anclaje, unidad y layer.

Los presets cubren esquinas, centro, pantalla completa y tamaños pequeño, mediano y grande. Broadcast State valida NaN, Infinity, escalas y opacidades inválidas.

## Animaciones

El renderer de prueba demuestra fade-in, fade-out, slide-up, slide-down, slide-left, slide-right, scale-in y scale-out. También permite duración y AutoHide. Estas transiciones no constituyen un Animation Engine.

## Renderer de prueba

buildPlaygroundRenderDescriptor() lee una proyección generada por Broadcast Output y produce un descriptor visual serializable. Aplica layers, geometría, safe area, assets, fallbacks, warnings y errores.

No modifica la proyección, no consulta datos y no recalcula resultados. El DOM se crea con createElement() y textContent; los datos no se insertan mediante innerHTML.

## Inspector

El inspector ofrece JSON de solo lectura para Data Contract, Broadcast State, Output, Projection, Assets, Warnings y Errors.

Cada sección puede expandirse, contraerse y copiarse. En visibilidad public, el inspector elimina información de tenant, operador, juez, diagnósticos restringidos y scoreDetail.

## Estado de sesión

sessionStorage puede recordar únicamente fixture, gráfico, asset, output y visibilidad. No guarda Program, tokens, secretos ni datos sensibles.

## Seguridad

- No usa Firebase, Storage, state.js ni rutas privadas.
- No ejecuta customFields.
- No carga javascript:, file:// ni URLs arbitrarias.
- No muta fixtures, contratos, proyecciones ni assets recibidos.
- Conserva 0, false y cadena vacía.
- Renderiza texto con textContent.
- La proyección pública se vuelve a sanitizar para el inspector.

## Limitaciones

- No existe persistencia de producción.
- No controla OBS, vMix, Wirecast ni hardware LED.
- No incluye escenas, macros, automatización ni mensajería.
- No sustituye gráficos V1.
- Los assets son metadatos y placeholders; no hay archivos físicos ni uploads.
- El renderer es deliberadamente mínimo y será reemplazado por el renderer oficial V2.

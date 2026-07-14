# Broadcast Template Renderer Integration V1

## Propósito

Template Renderer Integration V1 conecta de forma controlada el Template Engine V1 con Component Renderer V1. Recibe una definición o instancia declarativa de Template, resuelve sus bindings antes del render, entrega únicamente Component Instances válidas al Renderer y conserva la relación entre una composición y sus renders de componentes.

La versión del módulo es `1.0.0`.

Este módulo es un laboratorio visual en memoria. No es Program Output, no controla OBS, no modifica Preview ni Program, no abre Outputs reales, no consulta Firebase y no persiste datos.

## Arquitectura

```text
Template Definition o Template Instance
  -> Template Engine: instancia y resuelve bindings
  -> Template Renderer Integration: valida, ordena y compone
  -> Component Renderer: crea y actualiza nodos seguros
  -> Raíz controlada del Template dentro del laboratorio
```

La integración no crea componentes visuales por su cuenta. Todos los nodos de contenido proceden de `renderBroadcastComponent()` o `updateBroadcastComponentRender()`.

## API pública

El módulo `js/broadcast/templateRendererIntegration.js` exporta:

- `TEMPLATE_RENDERER_INTEGRATION_VERSION`
- `TEMPLATE_RENDERER_INTEGRATION_STATES`
- `TEMPLATE_RENDERER_INTEGRATION_ERROR_CODES`
- `BroadcastTemplateRendererIntegrationError`
- `createTemplateRendererIntegration()`
- `destroyTemplateRendererIntegration()`
- `validateTemplateRendererIntegrationTarget()`
- `prepareTemplateRender()`
- `renderTemplateInstance()`
- `updateTemplateRender()`
- `removeTemplateRender()`
- `clearTemplateRendererIntegration()`
- `getRenderedTemplate()`
- `listRenderedTemplates()`
- `getTemplateRenderWarnings()`
- `getTemplateRenderErrors()`
- `buildTemplateRenderSnapshot()`
- `validateTemplateRenderSnapshot()`
- `cloneTemplateRenderResult()`

## Estados

Los estados oficiales son:

- `uninitialized`: todavía no existe una integración operativa.
- `ready`: acepta preparación y render.
- `preparing`: reservado para la fase de resolución declarativa.
- `prepared`: la preparación es válida y todavía no creó DOM.
- `rendering`: se están creando los renders de componentes.
- `rendered`: todos los componentes incluidos terminaron correctamente.
- `updating`: se aplica una actualización manual.
- `partially_rendered`: hubo fallback o un componente opcional falló.
- `cleared`: no conserva composiciones renderizadas.
- `destroyed`: liberó sus referencias y ya no admite operaciones.
- `error`: conserva un diagnóstico bloqueante.

`partially_rendered` nunca oculta un error bloqueante.

## Creación

`createTemplateRendererIntegration(target, options)` valida un elemento HTML conectado, crea una raíz interna y crea o recibe un Component Renderer.

Opciones implementadas:

```js
{
  integrationId,
  rendererId,
  renderer,
  outputId,
  width,
  height,
  resolution,
  orientation,
  safeArea,
  visibility,
  tenantId,
  allowDisconnected,
  now,
  random
}
```

Si recibe un Renderer externo, la integración no lo destruye ni limpia renders ajenos. Si crea el Renderer, lo destruye junto con la integración.

## Target

`validateTemplateRendererIntegrationTarget()` reutiliza la validación pública del Component Renderer y rechaza:

- valores nulos, strings y selectores;
- `window` y `document`;
- elementos desconectados, salvo fixture autorizado;
- `iframe`, `object`, `embed`, `script` y raíz SVG;
- objetos que no cumplen el contrato DOM seguro.

La raíz de la integración se agrega sin reemplazar hijos preexistentes del target.

## Preparación

`prepareTemplateRender(templateOrResult, context, options)` no crea nodos. Acepta una Template Definition o el resultado completo de `instantiateBroadcastTemplate()`.

La preparación incluye:

- versión e identidad de preparación;
- `templateId`, `templateInstanceId` y `templateType`;
- `templateRenderId` estable;
- estado y status;
- Component Instances clonadas;
- bindings de Template y componentes ya resueltos;
- orden determinista;
- output, resolución, orientación y safe area;
- visibilidad y tenant autorizado;
- layout básico;
- warnings, errors y timestamp.

Las fuentes autorizadas son:

```js
{
  productionVariables,
  broadcastContract,
  assetManager
}
```

También se aceptan los aliases `variables`, `contract` y `assets`. No se aceptan funciones de ejecución, Firebase, rutas del Core ni observadores.

## Flujo de render

`renderTemplateInstance(integration, preparedTemplate, options)`:

1. valida integración y preparación;
2. verifica output, visibilidad y tenant;
3. aborta antes del DOM si existe un error required bloqueante;
4. crea una sola raíz de Template;
5. llama al Component Renderer por cada Component Instance;
6. mueve los nodos creados por el Renderer a la raíz de composición;
7. registra render IDs y resultados;
8. entrega resultado completo y clonado.

El resultado incluye:

- `templateRenderResultVersion`;
- `templateRenderId`;
- identidades de integración, Renderer, Template e instancia;
- output, resolución, orientación y safe area;
- `status` y `state`;
- conteos de componentes, renders y fallos;
- `componentRenderIds` y `componentResults`;
- warnings, errors y timestamps;
- `rootNode` solo cuando se solicita explícitamente en runtime.

## Orden visual

El orden DOM conserva el orden declarado por el Template. El z-index declarado en cada Component Instance permanece aplicado por Component Renderer y decide el apilamiento visual. El índice estable y `instanceId` mantienen resultados reproducibles.

No se usa el orden accidental de las claves de objetos.

## Layout básico

La integración reconoce:

- `absolute`
- `stack`
- `row`
- `column`
- `grid`
- `overlay`
- `safe_area`

La raíz aplica modo básico, dirección, columnas, gap, clip y z-index. La geometría individual sigue siendo responsabilidad de cada Component Instance y del Component Renderer. Los componentes conservan sus coordenadas declarativas; no existe reflow inteligente ni cálculo tipográfico.

La raíz se monta antes de medir el contenedor y aplica una escala uniforme basada en la resolución simulada. Así conserva la relación de aspecto y evita recortes al mostrar 1920 x 1080, 1080 x 1920 o 3840 x 720 dentro del panel.

Cuando el layout de contenedor no puede reorganizar componentes con geometría absoluta, prevalece la geometría individual. Esto evita inventar posiciones y mantiene el alcance fuera de un Layout Engine.

## Render parcial

La política V1 es:

- componente opcional que falla: se registra y la composición continúa como `partially_rendered`;
- componente con fallback válido: el fallback se renderiza mediante Component Renderer y queda registrado;
- componente required no renderizable y sin fallback: la preparación bloquea antes de crear nodos;
- fallo required inesperado durante render: se revierte la composición nueva y se lanza un error controlado.

## Actualización manual

`updateTemplateRender()` compara por `instanceId`:

- actualiza instancias existentes;
- crea las nuevas;
- elimina las ausentes;
- reemplaza el nodo cuando cambia `componentType` mediante la API del Renderer;
- conserva `templateRenderId` y una sola raíz;
- no duplica nodos.

La función acepta tanto una preparación como una Definition/Instance más contexto.

Un cambio de output, resolución o visibilidad puede reconstruir el Renderer interno cuando la integración contiene una sola composición. Si el Renderer es externo o existen varias composiciones, se rechaza el cambio para no afectar contenido ajeno. Production Console aplica la política más conservadora: al cambiar esos selectores destruye y crea un runtime de laboratorio nuevo.

No hay actualización automática. Cambiar Variables, Data Contract o Assets no modifica el canvas hasta presionar `Actualizar`.

## Eliminación, clear y destroy

`removeTemplateRender()` elimina solamente la composición solicitada y es idempotente.

`clearTemplateRendererIntegration()` recorre los render IDs propios. No usa un clear global sobre un Renderer inyectado y no elimina nodos externos.

`destroyTemplateRendererIntegration()`:

- limpia sus composiciones;
- destruye solamente el Renderer interno;
- elimina solamente su raíz;
- conserva el target;
- marca `destroyed` e impide nuevas operaciones.

## Snapshot

`buildTemplateRenderSnapshot()` genera un objeto serializable con:

- versiones;
- identidad de integración y Renderer;
- output, resolución, orientación y safe area;
- visibilidad y estado;
- render IDs;
- resúmenes de Templates y componentes;
- bindings resueltos sanitizados;
- warnings, errors y timestamp.

Nunca contiene:

- nodos DOM o `rootNode`;
- `document` o `window`;
- funciones, símbolos o BigInt;
- listeners;
- claves peligrosas;
- secretos o URLs inseguras;
- actor o tenant cuando la visibilidad solicitada es `public`.

`validateTemplateRenderSnapshot()` valida versión, timestamps, identidad, colecciones y ausencia de referencias runtime.

## Visibilidad

La preparación filtra Component Instances cuya visibilidad excede la solicitud. El Component Renderer vuelve a aplicar su propia validación de visibilidad. Por tanto, una solicitud `public` no puede elevar contenido `production`, `operational` o `restricted`.

Production Console reconstruye preparación e integración cuando cambia la visibilidad del laboratorio.

## Multi-tenant

La integración compara el tenant autorizado con el Template preparado y rechaza cruces. Template Engine conserva la validación de tenant de componentes, Variables, Data Contract y Asset Manager. Los resolved assets externos al tenant autorizado se omiten.

Una Template global no recibe autorización implícita para mezclar varios tenants. No existe fallback cruzado.

## Seguridad

El módulo:

- no usa `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `srcdoc`, `eval` ni `new Function`;
- no registra listeners globales;
- no usa polling, sockets ni animación propia;
- no acepta CSS arbitrario;
- conserva `0`, `false`, cadena vacía y `null`;
- elimina funciones, símbolos y BigInt;
- omite getters y setters sin ejecutarlos;
- controla ciclos, profundidad, tamaño de arreglos y número de claves;
- bloquea `__proto__`, `constructor` y `prototype`;
- filtra protocolos `javascript:`, `file:`, `data:text/html` y `vbscript:`;
- mantiene todos los textos dinámicos bajo `textContent` del Component Renderer.

## Production Variables

La integración consume el snapshot resuelto de Production Variables. No despacha acciones, no modifica el registry y no cambia Program. Variables disabled o expired se resuelven en Template Engine con su fallback declarado.

## Broadcast Data Contract

La integración recibe un Broadcast Data Contract ya construido y sanitizado. No recalcula scores, no ordena ranking, no controla timer y no consulta rutas internas.

## Asset Manager

La preparación puede resolver bindings declarativos contra Asset Manager. El render acepta únicamente un mapa explícito de assets ya autorizados con `assetId` y URL de render segura. No acepta Storage directo, signed URLs persistentes, `file://`, `javascript:` ni `data:text/html`.

Si el laboratorio no dispone de una URL resuelta autorizada, Component Renderer aplica su placeholder y registra warning. No se descarga ningún archivo.

## Laboratorio de Templates V2

Production Console incorpora dentro de la pestaña Templates:

- selector de Template;
- selector de fixture/contexto;
- selector de output 16:9, vertical y LED;
- selector de visibilidad;
- controles Instanciar, Preparar, Renderizar, Actualizar, Limpiar y Copiar Snapshot;
- estado de Template Engine, integración y Renderer;
- métricas de composición;
- canvas con cuadrícula y safe area;
- warnings y errors;
- inspector de Definition, Instance, preparación, resultado, componentes y snapshot.

Los outputs simulados son:

- 1920 x 1080;
- 1080 x 1920;
- 3840 x 720.

El laboratorio no ejecuta Take y no comparte su runtime con Preview o Program.

## Templates cubiertos

Los fixtures oficiales cubiertos son:

- Lower Third;
- Marcador;
- Ranking;
- Cronómetro;
- Sponsor;
- QR;
- Roster;
- Full Screen;
- Interview;
- Ticker;
- Standings;
- Bug.

QR conserva placeholder cuando no hay asset seguro. Ticker es estático. Timer muestra el valor resuelto y no crea intervalos.

El laboratorio agrega adaptadores declarativos privados para demostrar el Marcador con tres o cuatro equipos, Roster, Ticker y Standings. Esos adaptadores solo proyectan nombres, posiciones y valores ya ordenados del fixture hacia las propiedades esperadas por Component Renderer; no cambian los fixtures base, no recalculan scores y no forman parte del contrato de producción.

## Compatibilidad

Template Renderer Integration opera en paralelo y no modifica:

- Template Engine;
- Component Library;
- Component Renderer;
- Production Variables;
- Action Engine;
- Broadcast State;
- Broadcast Output;
- Asset Manager;
- Preview;
- Program;
- Outputs reales;
- OBS V1 o gráficos V1.

## Limitaciones actuales

- No es Theme Engine.
- No es Layout Engine.
- No es Animation Engine.
- No crea Scenes ni Macros.
- No observa datos automáticamente.
- No persiste composiciones.
- No abre Program Output.
- No resuelve ni descarga archivos físicos.
- El cambio en caliente de output o visibilidad requiere una sola composición y Renderer interno; la consola reconstruye su runtime para mantener aislamiento.

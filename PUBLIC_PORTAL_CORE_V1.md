# CharroPro Public Portal Core V1

## Propósito

`PUBLIC-PORTAL-CORE-001` convierte la proyección pública segura de `PUBLIC-FOUNDATION-001` en el Portal Público V2. El navegador mantiene una sola suscripción a:

`publicTournaments/{tournamentId}`

El Portal no consulta rutas privadas, no escribe en Firebase y no calcula resultados deportivos.

Versión del módulo: `1.0.0`.

Cache-buster de entrada: `20260727-public-portal-core-001-v1`.

## Arquitectura

```text
publicTournaments/{tournamentId}
  -> publicPortalClient
  -> portalApp
  -> portalSelectors
  -> portalRender
  -> Inicio / En Vivo / Programa / Competencias / Resultados / Sábana
```

- `js/publicPortal/portalRouter.js`: parámetros seguros, URLs compartibles e History API.
- `js/publicPortal/portalSelectors.js`: modelo visual puro, filtros por instancia y sábana oficial.
- `js/publicPortal/portalRender.js`: shell estable y DOM semántico construido con `textContent`.
- `js/publicPortal/portalApp.js`: lifecycle, listener único, conexión, stale, navegación y actualización parcial.
- `js/views/torneo-publico.js`: bootstrap delgado.
- `css/public-portal.css`: estilos aislados y responsive.

## Rutas

Vistas admitidas:

- `view=inicio`
- `view=en-vivo`
- `view=programa`
- `view=competencias`
- `view=resultados`
- `view=sabana`

Contexto opcional:

- `competitionId`
- `categoryId`
- `phaseId`
- `charreadaId`

El parámetro anterior `competition` se acepta como entrada y se normaliza a `competitionId`. Los valores inválidos regresan a Inicio o se eliminan. Back y Forward vuelven a resolver el estado sin recargar el documento.

## Fuente pública

Schema V2 se consume directamente:

- `metadata`
- `overview`
- `program`
- `live`
- `competitions`
- `results`

Schema V1 queda encapsulado dentro de un selector de compatibilidad. Una proyección V2 válida nunca se sustituye por V1.

El Portal no lee:

- torneo privado;
- `scores`;
- drafts;
- audit;
- `live/current`;
- sesiones Broadcast;
- notas internas.

## Competencias

La identidad de selección es siempre `competitionId`. `competitionType` solo describe la modalidad.

Esto permite mantener separadas:

- varias competencias Charro Completo;
- distintas categorías;
- distintas fases;
- competencias del mismo tipo con nombres semejantes.

La selección inicial usa, en orden:

1. `competitionId` válido en la URL;
2. `activeCompetitionId`;
3. primera competencia publicada.

## Resultados

La vista conserva el orden estable de `results.items`. No ordena por total ni inventa posiciones.

- `officialTotal` se presenta solo cuando existe.
- `officialPosition` se presenta solo cuando existe.
- `subtotal` puede mostrarse como dato secundario publicado.
- `null` se presenta como ausencia.
- `0` se conserva como valor válido.
- drafts y resultados sustituidos no se muestran.

Los filtros por competencia, categoría, fase y charreada se aplican sobre la proyección pública.

## Sábana

La sábana usa `suerteIds` de la competencia seleccionada y únicamente crea columnas para las que existe un valor publicado.

- Charro Completo no muestra Terna ni Jineteo de Yegua.
- Caladero solo puede mostrar Cala.
- Coleadero solo puede mostrar Colas.
- Pialadero solo puede mostrar Piales.
- No se suman columnas en el navegador.
- El total general no se interpreta como una suerte.
- La anomalía histórica de Cala 280 permanece protegida por la proyección V2.

La tabla utiliza `table`, `thead`, `tbody`, `th scope="col"` y `th scope="row"`. En móvil, el desplazamiento queda contenido en la tabla y la primera columna puede permanecer fija.

## Actualización parcial

`publicPortalClient` entrega `changedSections`. Cada vista declara sus dependencias:

- Inicio: metadata, overview, live, program, competitions y results.
- En Vivo: overview y live.
- Programa: overview, program y competitions.
- Competencias: overview, program, competitions y results.
- Resultados y Sábana: overview, competitions y results.

Encabezado, navegación y selector permanecen montados. Una sección irrelevante para la vista activa no reconstruye el contenido principal. El foco, la selección y el desplazamiento horizontal de tablas se conservan cuando es posible.

Las filas cuyo contenido publicado cambió reciben un resaltado temporal. `prefers-reduced-motion` elimina esa animación.

## Conexión

Estados visibles:

- connecting;
- online;
- stale;
- offline;
- reconnecting;
- error.

Ante stale, offline o error se conserva la última vista válida. No se muestran mensajes internos de Firebase.

## Accesibilidad

- enlace para saltar al contenido;
- navegación por teclado;
- foco visible;
- `aria-current`;
- región `aria-live="polite"` para cambios significativos;
- labels asociados a selectores;
- tablas semánticas;
- objetivos táctiles mínimos de 44 px;
- jerarquía de encabezados;
- contraste y texto que no depende del color;
- soporte de movimiento reducido.

## Seguridad

- parámetros URL limitados a una allowlist;
- rechazo de `javascript:`, `data:`, `file:`, `vbscript:` y claves de prototipo;
- los datos públicos se insertan con `textContent`;
- no se utiliza `innerHTML` para datos;
- no se construyen selectores CSS con IDs de la proyección;
- no se imprime el snapshot;
- no se agregan escrituras Firebase;
- no se agregan servicios de analítica.

## Rendimiento

- una suscripción a la proyección;
- una suscripción de conexión encapsulada por el cliente Firebase;
- cero listeners por fila;
- eventos delegados en la raíz;
- shell estable;
- selección y filtros puros;
- navegación sin recarga;
- logs de duración y nodos solo en localhost.

## Pruebas

- `tests/public-portal-router.test.mjs`
- `tests/public-portal-selectors.test.mjs`
- `tests/public-portal-core.test.mjs`
- suites de `PUBLIC-FOUNDATION-001`

La validación visual debe cubrir escritorio, tableta y móvil, además de navegación, selector, resultados, sábana y ausencia de overflow global.

## Limitaciones

- rankings, Top y estadísticas no se calculan porque la proyección los declara no disponibles;
- no se agregan perfiles, búsqueda, SEO avanzado ni video;
- no se despliegan Firebase Rules, Hosting o Functions;
- la etiqueta de charreada de un filtro puede usar su ID cuando la proyección de resultados no incluye un nombre público;
- la actualización parcial sustituye solo el contenido de la vista activa, no celdas individuales.

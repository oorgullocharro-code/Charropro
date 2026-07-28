# CharroPro Public Portal Design System V2

## Propósito

Este sistema visual convierte el Portal Público en una experiencia deportiva de charrería contemporánea. La capa visual consume exclusivamente el modelo público normalizado existente y no calcula posiciones, totales, desempates, tiempos ni eventos.

Principios:

- prioridad a la actividad deportiva oficial;
- lectura rápida en sede, transmisión y móvil;
- identidad oscura con superficies diferenciadas;
- datos oficiales por encima de decoración;
- componentes reutilizables y DOM seguro;
- funcionamiento íntegro con datos parciales, snapshots V1/V2 y sin imágenes;
- accesibilidad y rendimiento como requisitos del sistema.

## Paleta

| Token | Uso |
| --- | --- |
| `--cp-color-background` | Fondo carbón principal |
| `--cp-color-background-deep` | Profundidad y contraste de fondo |
| `--cp-color-surface` | Superficie base |
| `--cp-color-surface-raised` | Componentes destacados |
| `--cp-color-surface-soft` | Controles y estados secundarios |
| `--cp-color-primary` | Azul rey de interacción |
| `--cp-color-primary-strong` | Azul profundo |
| `--cp-color-accent` | Tinto puntual |
| `--cp-color-gold` | Logros, posición y jerarquía deportiva |
| `--cp-color-success` | Estado en vivo o correcto |
| `--cp-color-warning` | Stale, pausa y advertencia |
| `--cp-color-danger` | Offline, error o incidencia |
| `--cp-color-text` | Texto principal |
| `--cp-color-text-soft` | Texto secundario con énfasis |
| `--cp-color-text-muted` | Metadata |

El color siempre se acompaña de texto, icono o posición. No se usan degradados genéricos, neón ni negro puro como única superficie.

## Tokens

La raíz de `css/public-portal.css` contiene tokens de:

- color;
- tipografía;
- escala de texto;
- espaciado;
- radio;
- bordes;
- sombras;
- movimiento;
- ancho máximo;
- z-index;
- breakpoints documentales.

Los aliases `--public-portal-*` conservan compatibilidad con los estilos públicos anteriores mientras los componentes V2 usan `--cp-*`.

## Tipografía

- Cuerpo: pila de sistema segura, con `Inter` solo cuando ya exista localmente.
- Display: pila condensada local para torneo, puntos y posiciones.
- Los títulos de tarjeta son compactos; el tamaño hero se reserva al nombre del torneo.
- Puntos, posiciones y tiempos usan números tabulares.
- No se cargan fuentes remotas.

## Espaciado y forma

- La escala base es de 4 px.
- Los controles usan radio de 6 px.
- Las tarjetas usan un máximo de 8 px.
- Las acciones táctiles tienen al menos 44 px.
- El ancho de lectura se limita a 1240 px.
- Las sombras separan jerarquías sin convertir cada sección en una tarjeta flotante.

## Componentes

### PublicHero

Portada deportiva del torneo. Muestra nombre, estado, sede/fecha, competencia y accesos a En Vivo, Programa y Resultados. Funciona sin imagen de evento mediante composición tipográfica y superficies CSS.

### PublicNavigation

Conserva las rutas `inicio`, `en-vivo`, `programa`, `competencias`, `resultados` y `sabana`. La ruta legacy `competencias` se presenta como `Rankings`. En móvil utiliza una banda horizontal visible con iconos SVG internos y scroll local.

### PublicNowCard

Fuente visual única para el estado actual. Soporta `live`, `scheduled`, `paused`, `finished`, `unavailable`, `stale` y `offline`. Solo muestra tiempo, score, posición y turno cuando el modelo público los contiene.

### PublicSectionHeader

Combina icono interno, título y metadata breve. Mantiene una jerarquía consistente en Inicio, Resultados, Rankings y Sábana.

### PublicCompetitionCard

Describe modalidad, scope, categoría, fase, jornadas, resultados y suertes publicadas. No muestra Asociación.

### PublicScoreCard

Presenta posición, identidad, contexto y total oficial. No calcula movimientos ni barras basadas en un máximo inventado.

### PublicPodium

Representa únicamente filas que ya contienen posiciones oficiales 1, 2 y 3. El DOM conserva el orden publicado y CSS dispone las posiciones visuales. No resuelve empates ni desempates.

### PublicRankingCard

Lista compacta con posición oficial, nombre, categoría/fase y total oficial. El orden recibido no se reordena en el renderer.

### PublicLiveTimeline

Timeline vertical de eventos ya publicados. Sus iconos distinguen score, corrección, penalización, cronómetro, turno y competencia. Las etiquetas textuales permanecen como fuente accesible del tipo de evento.

### PublicScoreSheet

Conserva `CC P C JT LC PR JY MP MC PM PEN TOTAL POS`, cero como `0` y ausencia como `—`. Mantiene `abbr`, `title`, `aria-label`, encabezado fijo local, primera columna sticky, filas alternadas y scroll horizontal local.

### PublicEmptyState y PublicErrorState

Estados específicos con icono, título y descripción no técnica. Loading usa skeletons; offline y stale conservan la última vista válida y muestran una notificación persistente.

### PublicFooter

Identifica CharroPro y la versión de la proyección pública sin exponer revisiones internas, usuarios o rutas.

## Iconografía

Los iconos se crean mediante SVG internos con rutas cerradas, `currentColor`, `aria-hidden="true"` y `focusable="false"`. No se usan emojis, librerías remotas ni SVG procedente de datos.

## Imágenes y fallbacks

El logo público existente conserva `object-fit: contain`. Las imágenes opcionales de participantes usan dimensiones estables. El hero no exige imagen nueva y no inventa contenido cuando falta una imagen pública.

Una futura imagen de evento deberá entrar mediante una URL pública sanitizada por el modelo, no mediante estilos o HTML recibidos desde Firebase.

## Estados

| Estado | Presentación |
| --- | --- |
| Loading | Skeleton sin datos falsos |
| Live | Verde, texto En Vivo e icono de transmisión |
| Scheduled | Dorado moderado y texto Programado |
| Paused | Advertencia textual |
| Finished | Estado Finalizado |
| Empty | Mensaje específico por vista |
| Stale | Aviso de información atrasada, sin ocultar datos |
| Offline | Aviso de conexión y última vista válida |
| Error | Explicación pública sin detalles internos |

## Responsive

- `1920–1280`: composición completa limitada por ancho máximo.
- `1024`: grids de dos columnas y detalles compactos.
- `768`: hero lineal, podio vertical y navegación horizontal.
- `390–320`: una columna, acciones completas, filtros y navegación con scroll local.
- La Sábana nunca expande el viewport global.
- Los nombres largos usan wrap y las áreas fijas conservan dimensiones estables.

## Accesibilidad

- landmarks `header`, `nav`, `main` y `footer`;
- salto al contenido;
- `aria-current` en navegación;
- foco visible de 3 px;
- botones reales y controles con nombre accesible;
- encabezados y scopes correctos en tablas;
- abreviaturas accesibles en Sábana;
- regiones `aria-live` para cambios relevantes;
- estados que no dependen exclusivamente del color;
- objetivos táctiles mínimos de 44 px;
- `prefers-reduced-motion`.

## Movimiento

Las transiciones duran entre 160 y 240 ms y se limitan a foco, hover y cambios de estado. La actualización de filas usa una señal breve. Reduced motion desactiva animaciones y transiciones relevantes.

## Seguridad y rendimiento

- textos públicos mediante `textContent`;
- SVG construido con `createElementNS` y rutas internas;
- sin `innerHTML`, `eval`, `Function` o `document.write`;
- sin estilos, HTML o scripts procedentes de Firebase;
- una sola suscripción a `publicTournaments/{tournamentId}`;
- render selectivo por revisiones de sección;
- sin frameworks, fuentes remotas o librerías visuales nuevas.

## Compatibilidad

El sistema funciona con snapshots `schemaVersion: 1` y `schemaVersion: 2`, datos parciales, ausencia de liveFeed, participantes incompletos, cero oficial y valores ausentes. Las rutas públicas existentes permanecen válidas y `competencias` continúa como identificador URL.

## Restricciones

- no calcula datos deportivos;
- no muestra Asociación;
- no lee rutas privadas;
- no escribe Firebase;
- no agrega favicon, PWA, autenticación, video o publicidad;
- no modifica reglas, Core, Broadcast Studio, juez, supervisor u operador;
- no despliega Hosting, Functions ni Rules.

## Ejemplo de uso

El flujo de render sigue siendo:

```text
publicTournaments/{tournamentId}
  -> Public Projection V1/V2 adapter
  -> portalSelectors
  -> portalRender
  -> componentes visuales V2
```

Los componentes reciben únicamente el modelo público normalizado. Una posición `1` se muestra como `1.º`; el valor fuente sigue siendo `1` y nunca se reescribe.

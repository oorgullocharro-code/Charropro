# Portal Público: Programa UX V1

## Propósito

`PUBLIC-PORTAL-PROGRAM-UX-001` completa el Programa del Portal Público V2 con metadata oficial, participantes ordenados, navegación por día y fase, detalle de competencia y acciones contextuales. También fija la representación pública de `PM` y elimina Asociación de las vistas del Portal.

El Portal continúa consumiendo una sola fuente:

```text
charropro/publicTournaments/{tournamentId}
```

No consulta rutas privadas, no crea listeners por filtro y no calcula resultados deportivos.

## Problema original

La cadena pública reducía cada jornada a nombre, hora y estado. Aunque la charreada operativa ya podía contener participantes, categoría, fase, sede y contexto de competencia, esa información no atravesaba de forma completa:

```text
Core
→ Public Projection V2
→ portalSelectors
→ portalRender
```

Por ello Programa terminaba mostrando principalmente `Charreada 1`. La Sábana, por separado, descartaba columnas sin capturas presentes; esto podía ocultar `PM` incluso cuando Paso de la Muerte pertenecía a la competencia.

## Modelo público

Cada entrada de `program.items` puede publicar:

- identidad: `scheduleId`, `charreadaId`, `sequence`, `revision`;
- competencia: `competitionId`, `competitionType`, `competitionScope`, `competitionName`;
- contexto: `categoryId`, `categoryName`, `phaseId`, `phaseName`;
- programa: `name`, `shortTitle`, `scheduledDate`, `scheduledTime`, `endTime`, `order`, `status`;
- sede: `venueId`, `venueName`;
- participantes: `participantType`, `participants`;
- información pública: `publicNotes`, `liveAvailable`, `resultsAvailable`, `updatedAt`.

`internalNotes` y otros campos operativos privados no se proyectan.

## Participantes

El modelo público usa una identidad uniforme:

```json
{
  "id": "team-or-participant-id",
  "type": "team",
  "order": 1,
  "name": "Nombre público",
  "shortName": "",
  "logoUrl": "",
  "region": "",
  "status": "ready"
}
```

El orden oficial se conserva mediante `order`; los empates mantienen el orden publicado. La deduplicación solo usa un ID público existente. No se ordena por nombre ni por puntaje y no se inventan participantes.

## Fases y URL

Si una charreada publica `phaseId`, se conserva. Si solo publica un nombre oficial de fase, el productor crea un identificador estable derivado de ese nombre para que el enlace sea compartible. Si no existe fase oficial, se muestra `Ronda única` como contexto y no se crea una opción de filtro.

Programa usa:

```text
day=YYYY-MM-DD
phase={phaseId}
charreadaId={charreadaId}
```

Los filtros se aplican en memoria sobre el snapshot ya recibido. `pushState`, `replaceState` y `popstate` preservan recarga, Back y Forward. Los valores inválidos se eliminan de la URL.

## Programa y detalle

Programa agrupa por fecha oficial y muestra:

- hora inicial y final, cuando existe;
- título y secuencia;
- modalidad, categoría, fase y sede;
- participantes en orden;
- estado oficial normalizado;
- acceso al detalle;
- acceso a En Vivo o Resultados solo cuando la proyección lo autoriza.

El estado no se infiere con el reloj del navegador. El bloque destacado utiliza la charreada activa publicada o la siguiente actividad disponible.

## PM y PEN

La Sábana usa el orden:

```text
CC P C JT LC PR JY MP MC PM PEN TOTAL POS
```

En el contrato vigente `CC` representa Cala. No se cambió su significado.

`PM` es Paso de la Muerte y `PEN` son penalizaciones. Son campos separados; `PEN` nunca funciona como fallback de `PM`. Los aliases históricos seguros de Paso de la Muerte se normalizan a `PM`.

Las columnas se obtienen de `competition.suerteIds`, no de la presencia de capturas. Así:

- un cero oficial se muestra como `0`;
- un dato ausente se muestra como `—`;
- `PM` permanece visible cuando `paso` pertenece a la competencia;
- `PEN` permanece separado antes de `TOTAL` y `POS`.

Cada sigla se renderiza con `abbr`, `title` y `aria-label`.

## Asociación

Las nuevas proyecciones V2 no emiten Asociación en Programa, resultados ni turno público. Selectors y render ignoran el campo si aparece en un snapshot V1 o V2 anterior.

Las allowlists conservan lectura compatible de snapshots V2 ya publicados que todavía contengan la propiedad; esto no hace que la proyección nueva la publique ni que el Portal la muestre.

## Seguridad y accesibilidad

- Todo contenido visible usa nodos DOM y `textContent`.
- No se usa `innerHTML`, `eval`, `Function` ni HTML público.
- IDs, fechas, URLs de logos y parámetros del router se validan.
- Los filtros tienen objetivos táctiles de al menos 44 px, foco visible y estado accesible.
- Las tablas usan encabezados semánticos y scroll horizontal local.
- La composición se adapta a escritorio, tableta, 390 px y 320 px sin scroll horizontal global.

## Compatibilidad

La adaptación V1 conserva programas antiguos, participantes de equipos o individuales y aliases históricos de PM. Snapshots sin participantes, fecha, fase, sede o PM siguen siendo válidos y muestran ausencias explícitas.

Se mantiene:

- una sola suscripción a `publicTournaments`;
- compatibilidad `schemaVersion` 1 y 2;
- turno oficial;
- totales y posiciones publicados;
- estados offline, stale y reconexión.

## Limitaciones

- No se crean ni editan jornadas desde el Portal.
- No se publican notas internas.
- No se infieren fases, sedes, participantes o estados que no existan en la fuente.
- No se desplegaron reglas, Hosting ni Functions.
- El favicon permanece fuera del alcance de este ticket.

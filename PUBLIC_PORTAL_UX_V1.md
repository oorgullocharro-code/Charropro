# Portal Publico UX V1

## Objetivo

`PUBLIC-PORTAL-UX-001` agrega seguimiento deportivo oficial a la vista En Vivo del Portal Publico V2. La pantalla conserva las seis vistas y organiza En Vivo en dos bloques: `AHORA` y `MINUTO A MINUTO`.

## Arquitectura

El flujo de autoridad es:

```text
Core deportivo
-> publicacion oficial
-> buildPublicProjection()
-> publicTournaments/{tournamentId}
-> publicPortalClient
-> Portal Publico
```

El navegador mantiene un solo listener sobre `publicTournaments/{tournamentId}`. No lee `live/current`, scores privados, auditoria, juez, Broadcast Studio ni rutas internas.

## Live Feed

La seccion publica `liveFeed` pertenece al schemaVersion 2:

```json
{
  "revision": 1,
  "status": "live",
  "updatedAt": "2026-07-27T12:00:00.000Z",
  "current": {},
  "items": {}
}
```

Cada evento usa `eventId`, `sequence`, `eventType`, `occurredAt`, `publishedAt`, referencias publicas, datos oficiales opcionales, `status` y `revision`. El catalogo cerrado incluye inicios/finales de competencia, turno, participante, suerte, intento, calificacion, penalizacion, correccion, total, posicion y cronometro.

Los eventos de score se derivan dentro del mismo proceso que publica la proyeccion. Usan la precedencia oficial ya existente: intento, desglose final y campos publicados. El feed no recalcula scores, totales ni posiciones.

## Mensajes

Firebase no almacena narracion libre. `liveFeedTemplates.js` produce frases neutrales mediante plantillas cerradas y datos sanitizados. El DOM usa `textContent`. Eventos desconocidos se omiten y quedan contabilizados solo en diagnostico local.

Los eventos de resultado se etiquetan `OFICIAL`. Inicios, pausas operativas y cronometro se etiquetan `EN CURSO`.

## Identidad, orden y retencion

- `eventId` se genera de forma deterministica para publicaciones de score.
- Una nueva revision del mismo evento sustituye su representacion por `eventId`.
- Las correcciones reciben identidad propia y conservan la publicacion anterior.
- El orden es `sequence`, `publishedAt`, `occurredAt` y `eventId`, todos descendentes salvo el desempate alfabetico.
- El productor conserva como maximo 200 eventos recientes.
- El portal renderiza como maximo 50 eventos por vista.
- Reprocesar la misma publicacion no crea eventos ni revisiones adicionales.
- `liveFeed.revision` avanza solamente cuando cambia contenido publico efectivo.

## Filtros y URL

El parametro opcional `feed` acepta:

- `all`
- `score`
- `turn`
- `penalty`
- `timer`

Un valor desconocido cae a `all`. History API conserva Back y Forward. Los filtros aparecen como controles tactiles desplazables en movil.

## Actualizaciones

Si el usuario esta leyendo entradas anteriores, los nuevos eventos se retienen visualmente y aparece el control `actualizaciones nuevas`. Al activarlo se muestra la revision vigente. Si el usuario esta arriba, la informacion se incorpora directamente. No se crean listeners por evento.

## Estado de conexion

La ultima vista valida se conserva:

- stale leve: 60 segundos sin actualizacion durante actividad;
- stale importante: 180 segundos;
- offline: perdida de conexion.

Los mensajes son neutrales. No se insertan ceros ni se cambia el turno durante una desconexion. La reconexion se reconcilia por revision y `eventId`.

## Sabana

Los encabezados deportivos visibles usan abreviaturas:

`CC`, `P`, `C`, `JT`, `LC`, `PR`, `JY`, `MP`, `MC`, `PM`, `PEN`, `TOTAL` y `POS`.

Cada abreviatura usa `abbr`, `title` y `aria-label` para exponer el nombre completo. Las columnas siguen naciendo de `suerteIds` y resultados publicados; no se agregan suertes inexistentes.

## Seguridad

- Catalogo de tipos cerrado.
- Allowlist de campos.
- Limites de IDs, strings, profundidad, objetos y 200 eventos.
- Rechazo de `NaN`, infinito, secuencias negativas, posiciones no enteras y estructuras inesperadas.
- Bloqueo de `__proto__`, `constructor`, `prototype`, accessors y prototipos no planos.
- Sin HTML, JavaScript, URLs, secretos, datos de juez ni notas privadas.
- Rules preparadas para validar `liveFeed`; no fueron desplegadas.

## Compatibilidad

Snapshots V1 y V2 sin `liveFeed` mantienen AHORA con los datos disponibles y presentan un estado vacio en MINUTO A MINUTO. No se reconstruye historial en el navegador.

## Accesibilidad y responsive

La linea de tiempo es una lista semantica. Los estados tienen texto ademas de color, los controles admiten teclado y foco visible, y las actualizaciones se anuncian de forma moderada. `prefers-reduced-motion` desactiva pulso, skeleton y animaciones de cambio.

El mismo DOM responde desde 320 px hasta escritorio. AHORA y el feed pasan a una columna en movil; chips y tablas usan desplazamiento interno y no generan overflow general.

## Coste

El feed agrega hasta 200 objetos compactos a la proyeccion. Con el fixture de pruebas, una entrada serializada ocupa aproximadamente entre 250 y 550 bytes segun campos; el limite superior esperado es del orden de 50 a 110 KB antes de compresion. El portal solo crea DOM para 50 entradas.

## Limitaciones

No incluye narracion libre, IA, audio, video, notificaciones, perfiles, rankings avanzados ni carga incremental de eventos antiguos. Los eventos operativos que no se derivan de scores requieren que el productor autorizado los incorpore en `tournament.publicLiveFeed`.

## Despliegue pendiente

Este ticket no despliega Hosting, Firebase Rules, Functions ni RTDB. Las Rules deben validarse en Emulator Suite antes de una autorizacion de despliegue.

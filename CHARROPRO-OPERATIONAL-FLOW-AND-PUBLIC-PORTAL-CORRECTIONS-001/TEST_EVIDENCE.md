# Evidencia de pruebas

## Emulator local

Entorno: `DEMO / LOCAL / NO OFICIAL`, torneo `demo-local-fmch-2026`.

- Auth, RTDB, Functions y Storage locales disponibles.
- Usuario sintetico Juez autenticado.
- Cabecero Floreado de 10 puntos publicado oficialmente.
- Cambio automatico visible a Pial, oportunidad compartida `2/5`.
- Control de respaldo tomado mediante Timer Authority.
- Cierre anticipado visible y avance a Toro del siguiente equipo.
- Recarga con el mismo contexto posterior al cierre.
- RTDB registro un solo score oficial de Cabecero y Timer `FINISHED`.
- Fanout oficial termino `DELIVERED`.
- Cero escrituras a Firebase de produccion.

El proceso local de Emulator Suite anterior a la prueba no pudo reiniciarse desde el sandbox para recargar Rules modificadas. La allowlist nueva fue validada con pruebas automaticas de Rules y el snapshot corregido se verifico con el payload oficial capturado.

## Portal visual

Fixture oficial del Portal Publico con dos parciales: 38 y 26.

- Inicio: lideres 38 y 26.
- Rankings: posiciones provisionales 1 y 2.
- Resultados: acumulado parcial 38 y 26.
- Sabana: `CC`, `TOTAL` y `POS` muestran 38/1 y 26/2.
- En Vivo: encabezado `POSICION PROVISIONAL`, acumulados 38 y 26.
- Segundo score: acumulado 58 validado por prueba automatica.
- Zero y DQ oficiales validados sin reinterpretacion.
- Recarga conserva total y posicion.

Responsive validado en fixture existente para 320, 360, 390, 768, 1024, 1280, 1440 y 1920 px. La pagina no agrega overflow horizontal; la Sabana conserva desplazamiento horizontal interno.

## Pruebas dirigidas

- `tests/terna-operational-flow.test.mjs`
- `tests/public-portal-partial-standings.test.mjs`
- Terna completa, Pending Review, Full Scorer y Timer Authority.
- Public Projection, Public Portal, Public Live Feed y cache coherence.
- Official Score concurrency, graficos y Broadcast.

La salida de la suite final se registra en el cierre del ticket y debe quedar completamente verde antes del commit.

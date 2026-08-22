# Resultados de latencia

## Instrumentacion

Se instrumentaron T0 a T12 con reloj monotono. Las muestras se ejecutaron en el
cliente real contra Auth, RTDB, Functions y Storage Emulator.

## Antes

El modelo determinista reproducible con demoras inyectadas dio:

| Metrica | P50 | P95 | Maximo |
| --- | ---: | ---: | ---: |
| Ruta critica | 230 ms | 250 ms | 250 ms |
| Siguiente turno visual | 2,050 ms | 2,250 ms | 2,250 ms |
| Sincronizacion completa | 2,050 ms | 2,250 ms | 2,250 ms |

La primera traza real permitio reconstruir el flujo anterior en aproximadamente
1,882 ms: Projection Outbox terminaba antes de iniciar el avance y render.

## Despues

Cinco publicaciones sinteticas en LOCAL / EMULATOR:

| Metrica | P50 | P95 | Maximo |
| --- | ---: | ---: | ---: |
| Ruta critica | 848 ms | 886 ms | 886 ms |
| Siguiente turno visual | 1,012 ms | 1,051 ms | 1,051 ms |
| Tarea secundaria resuelta | 1,253 ms | 1,294 ms | 1,294 ms |

Projection Outbox termino despues de T11 en todas las muestras finales. Ya no
bloquea el siguiente turno. En la prueba manual con rol juez termino con estado
pendiente de Recovery. La prueba automatizada con adaptador autorizado confirmo
el mismo flujo hasta `CLIENT_CONFIRMED`.

## Ranking final

1. Callable oficial y fanout durable: aproximadamente 677 a 796 ms.
2. Preparacion del request y resolucion de sesion Firebase: aproximadamente
   152 a 157 ms.
3. Avance de puntero y render completo: aproximadamente 164 a 186 ms.

## Clasificacion

MUST BLOCK UI:

- validacion deportiva local;
- snapshot Attempt V2;
- persistencia local minima;
- callable oficial con Auth, CAS, idempotencia e historial;
- commit de Terna o Pending Review;
- avance canonico y render.

CAN RUN IN BACKGROUND:

- reconciliacion Projection Outbox;
- confirmacion del Portal Publico;
- Recovery de proyeccion;
- live/current posterior al avance;
- repeticiones de live y Google Sheets;
- listeners y diagnosticos no criticos.

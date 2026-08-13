# Contrato de acumulados parciales publicos

## Fuente unica

La fuente canonica es `buildPublicProjection()`. Solo agrega los totales oficiales ya publicados por intento; no recalcula deporte.

Cada fila publica incluye:

- `accumulatedTotal`: suma de totales oficiales publicados del alcance.
- `officialTotal`: total final cuando una fuente oficial lo entrega.
- `totalStatus`: `partial` o `final`.
- `officialPosition`: posicion final cuando existe.
- `provisionalPosition`: posicion temporal derivada del acumulado publicado.
- `positionStatus`: `provisional` u `official`.

## Alcance

Las filas nunca se mezclan entre competencia, categoria, fase, charreada o participante. Equipo e individual permanecen separados.

## Orden provisional

El orden usa primero el total publicado descendente. Los empates comparten posicion. El orden de presentacion estable solo hace determinista la UI y no constituye criterio deportivo de desempate.

## Consumidores

`portalSelectors.js` normaliza `displayTotal` y `displayPosition`. Inicio, Rankings, Resultados, Sabana y En Vivo consumen esos campos sin calculos independientes.

Un score oficial con valor `0` permanece publicado. Un DQ usa exclusivamente el total oficial publicado. Ninguna vista reinterpreta la causa deportiva.

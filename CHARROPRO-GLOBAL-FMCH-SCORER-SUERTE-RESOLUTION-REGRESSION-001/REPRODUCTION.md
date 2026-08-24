# Reproduccion

## Fixture minima

1. Crear torneo Libre por equipos sin lista manual de suertes.
2. Aplicar la politica productiva FMCH, con asignacion inicialmente pendiente.
3. Consultar `getCharreadaScoringSuertes()` antes de recibir la asignacion.
4. Incorporar sobre la misma referencia de torneo una asignacion activa `FMCH_2026_LIBRE 0.6.0`.
5. Consultar nuevamente.

## Antes del correctivo

- Primera consulta: `[]`.
- Misma referencia despues de asignacion valida: `[]`.
- Una copia nueva del mismo torneo: diez suertes.

Esto demostro que los datos eran validos y que la referencia original retenia un cache obsoleto.

## Despues del correctivo

- El vacio provisional no se almacena.
- La asignacion recibida sobre la misma referencia resuelve las diez suertes.
- La carga local y una recarga directa muestran Cala, Piales, Colas, Toro, Lazo, Pial R., Yegua, Manganas a Pie, Manganas a Caballo y Paso.

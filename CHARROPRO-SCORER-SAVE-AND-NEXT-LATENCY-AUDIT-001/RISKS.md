# Riesgos y seguimiento

## Riesgo residual

La latencia visual depende de la autoridad remota. Una conexion lenta puede
superar el P95 observado. El scorer no debe avanzar antes de esa confirmacion.

## Projection Outbox

El proceso secundario puede quedar pendiente. El score oficial permanece
durable y la UI lo comunica sin ocultar el fallo. Recovery conserva retries e
idempotencia.

## Render

El scorer aun ejecuta un render completo del siguiente turno. Su costo medido
es cercano a 117 ms en el dispositivo de prueba. Una optimizacion incremental
de render requiere un ticket separado y pruebas visuales completas.

## Publicacion futura

El cache-buster transversal ya fue actualizado de forma local a
`20260822-scorer-save-next-latency-audit-001-v1`. Antes de publicar debe
consolidarse el working tree completo aprobado, porque el build comparte los
cambios pendientes del Go-Live FMCH y no debe desplegarse como un conjunto
parcial de modulos con identidades distintas.

## Produccion

- Push: NO.
- Deploy: NO.
- Firebase Production Writes: 0.
- Scores productivos de prueba: 0.
- `FMCH_2026_LIBRE 0.6.0`: permanece `ACTIVE`; no se modifico en esta fase.

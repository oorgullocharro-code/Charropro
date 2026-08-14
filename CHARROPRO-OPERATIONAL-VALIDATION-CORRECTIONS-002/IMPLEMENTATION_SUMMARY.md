# CHARROPRO-OPERATIONAL-VALIDATION-CORRECTIONS-002

## Alcance implementado

- Pending Review reconcilia revisiones locales y remotas de forma monotónica.
- Coleadero obtiene el liderazgo general de la charreada desde scores oficiales publicados.
- Terna deriva el rol activo del estado `headCounted` / `pialCounted`, no de la paridad.
- La transición SUCCESS de Terna usa la selección base y estado deportivo canónicos de Attempt V2, no `attempt.base > 0`.
- Terna termina en cuanto Cabecero y Pial están contados; el máximo 5/5 ya no reserva oportunidades innecesarias y el Flow Engine avanza desde `COMPLETED`.
- Paso agrupa clasificación y resultado, conserva los timers debajo y separa el contexto lateral.

## Límites preservados

- No se modificaron fórmulas, catálogos, rankings ni reglas deportivas.
- `FMCH_2026_LIBRE` permanece en `0.6.0`.
- Attempt V2, la transición existente del Flow Engine y Timer Authority se preservaron; solo se corrigió cuándo se invoca el avance canónico.
- No hubo cambios en Firebase Rules, Portal Público, Broadcast ni Graphics.
- El polish local previo de Manganas y Piales se conservó íntegro.

## Versionado

Versión runtime única: `20260813-operational-validation-corrections-002-v1`.

Los documentos históricos conservan el identificador de la entrega que documentan.

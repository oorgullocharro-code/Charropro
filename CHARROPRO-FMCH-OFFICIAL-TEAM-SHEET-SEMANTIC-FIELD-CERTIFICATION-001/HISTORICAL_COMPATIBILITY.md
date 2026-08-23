# Historical Compatibility

- No se migró Firebase ni se reinterpretaron scores históricos.
- Un Official Score sin Attempt V2 continúa bloqueado.
- Un Attempt V2 antiguo sin vuelta, remate, tiempo o desglose P/T no recibe valores inferidos.
- En particular, un Attempt V2 histórico sin `distancePoints`/`timePoints` conserva el total de Punta, pero el Formato Federación reporta `UNAVAILABLE_FROM_HISTORICAL_SOURCE` para las dos casillas.
- Solo una nueva publicación oficial basada en los datos completos del intento puede congelar el desglose; no existe migración silenciosa.
- Los nuevos campos del snapshot `1.1.0` son proyecciones de evidencia existente; no mutan el origen.
- Los documentos históricos con evidencia incompleta deben reportar `UNAVAILABLE_FROM_HISTORICAL_SOURCE` o el error específico de fuente.
- `FMCH_2026_LIBRE 0.6.0` y su fingerprint permanecen sin cambios.

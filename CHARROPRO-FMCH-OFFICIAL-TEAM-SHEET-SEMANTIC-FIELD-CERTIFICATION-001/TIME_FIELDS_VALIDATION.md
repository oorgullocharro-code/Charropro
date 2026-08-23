# Time Fields Validation

## Puntos T

Existen ocho FieldID `T`. Cada uno se resuelve desde su Rule ID o desglose deportivo exacto congelado; no existe fórmula universal. Cala usa `calculationDetail.details.timePoints`; Toro/Yegua usan su regla `*_adic_tiempo_ahorrado`; Terna y Manganas usan sus reglas `*_adic_tiempo_no_usado`. Las celdas XLSX exactas se documentan en `T_FIELD_MATRIX.md` del ticket de revisión por juez.

`T` son puntos. Los campos siguientes son duración y permanecen separados.

## Inventario del PDF

| FieldID | Suerte | Label | Fuente | Fixture |
| --- | --- | --- | --- | --- |
| `JINETEO_TORO.COMPLETION_TIME` | Jineteo de Toro | TERMINADO EN ... MIN. | `timing.officialElapsedMs` | `0:41` |
| `TERNA.COMPLETION_TIME` | Terna | TERMINADO EN ... MIN. | `timing.officialElapsedMs` | `1:12` |
| `JINETEO_YEGUA.COMPLETION_TIME` | Jineteo de Yegua | TERMINADO EN ... MIN. | `timing.officialElapsedMs` | `2:03` |
| `MANGANAS_PIE.COMPLETION_TIME` | Manganas a Pie | TERMINADO EN ... MIN. | `timing.officialElapsedMs` | `3:04` |
| `MANGANAS_CABALLO.COMPLETION_TIME` | Manganas a Caballo | TERMINADO EN ... MIN. | `timing.officialElapsedMs` | `4:05` |
| `PASO.TIME_OUT` | Paso | TIEMPO EN SALIR ... MIN. | `timing.officialElapsedMs` | `0:36` |

## Transformación

`officialElapsedMs → floor(ms / 1000) → minutos:segundos`, con segundos de dos dígitos. No usa `Date.now()`, timestamps del navegador, duración estimada ni texto legacy.

Casos probados: cero (`0:00` por la función), segundos, varios minutos y ausencia. La ausencia en una sección presente bloquea el snapshot.

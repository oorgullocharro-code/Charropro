# Paso Validation

## Fuente

- Vuelta: `Attempt V2.sportState.vuelta`.
- Base: `Attempt V2.scoring.baseSelection.total`.
- Tiempo: `Attempt V2.timing.officialElapsedMs`.

El snapshot deposita la base únicamente en `firstLapBase` cuando `vuelta === 1` y únicamente en `secondLapBase` cuando `vuelta === 2`. No inspecciona el total ni el texto del RuleID para adivinar la vuelta.

## Fixtures

- Primera vuelta: base `20`, segunda vuelta vacía, tiempo `0:36`.
- Segunda vuelta: primera vuelta vacía, base `15`, tiempo `0:36`.

Ambos casos pasan Attempt V2 → Official Score → Snapshot → XLSX → PDF.

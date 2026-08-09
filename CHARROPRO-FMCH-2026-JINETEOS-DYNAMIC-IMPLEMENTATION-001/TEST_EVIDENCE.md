# Evidencia de Pruebas

## Automatización

| Validación | Resultado |
| --- | --- |
| Suite completa | `61/61 PASS` |
| Node check | `160 PASS` |
| JSON | `27/27 PASS` |
| Test nuevo de Jineteos | PASS |
| Rule Profile Engine | PASS |
| Attempt V2 | PASS |
| Responsive Component System | PASS |
| Official Score Concurrency | PASS |
| Cala | PASS |
| Piales/Coleadero | PASS |
| `git diff --check` | PASS |
| Escaneo de secretos/debugger/logs nuevos | PASS |

El test `tests/fmch-2026-jineteos-dynamic-scorer.test.mjs` cubre clasificaciones, matrices dinámicas, cambio de clasificación, valor cero, No repara, tiempo, infracciones, infracciones al equipo, DQ, manuales, Attempt V2, congelamiento oficial y lectura legacy para ambas suertes.

## Validación funcional local

Entorno: `LOCAL / EMULATOR`, proyecto sintético `demo-charropro-local`, RTDB `127.0.0.1:9000`. No se usaron datos reales ni conexiones de Producción.

### Toro

- Excelente + Tentemozo resolvió base 20 y adicional 4.
- Cambiar a Buena conservó la selección y volvió a resolver la matriz; Tentemozo permanece reglamentariamente en `+4` para ambas filas.
- Una mano se resolvió en `+2` para Buena.
- Nota y evidencia permanecieron.

### Yegua

- La selección permaneció al cambiar de Excelente a Media Regular.
- Jugar piernas resolvió `+1` y Tentemozo `+1` en Media Regular.
- No repara produjo Mínima 6, sin adicionales y sin DQ.

## Responsive

Se verificaron iPad landscape, iPad portrait y desktop. La composición mantuvo una sola shell, footer existente y `horizontalOverflow = 0` en los viewports medidos. Los controles conservaron tamaño táctil y la clasificación quedó visible en portrait.

Evidencia mínima autorizada:

1. `evidence/toro-ipad-landscape.jpg`
2. `evidence/toro-ipad-portrait.jpg`
3. `evidence/yegua-ipad-landscape.jpg`
4. `evidence/yegua-ipad-portrait.jpg`

No se generó screenshot adicional de desktop porque no apareció una diferencia funcional relevante.

## Operación remota

- Firebase Production writes: `0`.
- Deploy: `NO`.
- Push: `NO`.

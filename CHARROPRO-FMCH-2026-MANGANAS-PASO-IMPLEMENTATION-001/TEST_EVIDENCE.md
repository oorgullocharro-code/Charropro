# Evidencia de pruebas

## Automatización dirigida

La suite `tests/fmch-2026-manganas-paso-scorer.test.mjs` cubre:

- perfil 0.6.0, estado draft y RuleKey únicos;
- tres oportunidades y ausencia de una cuarta;
- remates e historial;
- floreo total y detalle opcional sin doble suma;
- tirones y acumulación confirmada;
- resultado logrado/no logrado distinto de DQ;
- DQ con preservación de floreo, remate, nota, evidencia e infracciones al equipo;
- timer, pausa, wall time, official time e independencia de contextos;
- Paso dinámico por clasificación, vueltas, distancia y timers;
- Attempt V2, freeze oficial y adapter legacy;
- capacidades de acción del juez y contrato responsive.

Las regresiones dirigidas cubren Cala, Piales, Coleadero, Toro, Yegua y Terna sin reabrir sus reglas deportivas.

## Validación visual real

Cliente: `http://127.0.0.1:8765/torneo.html?tournamentId=demo-local-fmch-2026&view=scoring&charreada=demo-local-fmch-jornada-1`

Datos: sintéticos, LOCAL / EMULATOR.

Capturas temporales de evidencia:

1. `/private/tmp/charropro-manganas-pie-crop.png`
2. `/private/tmp/charropro-manganas-caballo-ipad-landscape.png`
3. `/private/tmp/charropro-paso-ipad-landscape.png`
4. `/private/tmp/charropro-paso-ipad-portrait.png`
5. `/private/tmp/charropro-floreo-detail-inline.jpg`

Resultados observados:

- Pie: tres oportunidades, remate, floreo rápido, detalle inline, DQ preservando datos y timer con pausa.
- Caballo: tres oportunidades, Rodada, floreo, tres tirones, historial y timer independiente.
- Paso: primera/segunda vuelta, clasificación, distancia, total dinámico y dos timers independientes.
- Responsive: sin scroll horizontal en desktop, iPad landscape e iPad portrait.
- Falla simulada: sin avance ni pérdida del draft al quedar RTDB local no disponible.

## Riesgo conocido

Durante la falla simulada, el cliente conservó correctamente el intento pero no presentó inmediatamente un mensaje visible de publicación pendiente. No se modificó ese flujo porque el ticket no autoriza Pending Score Review; debe tratarse en el ticket correspondiente.

## Validación final

- Suite completa final: 63/63 suites aprobadas.
- Primer intento de cierre: detectó una expectativa obsoleta 0.5.0 en `local-runtime-seed.test.mjs`; se actualizó a 0.6.0 y la ejecución completa posterior aprobó.
- `node --check`: 164 archivos aprobados.
- JSON: 21 archivos válidos.
- `git diff --check`: correcto.
- `git diff --cached --check`: correcto.
- Firmas de secretos: 0.
- `debugger`: 0.
- Cache-buster activo anterior: 0 coincidencias.

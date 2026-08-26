# Files Changed

## Dominio y runtime

- `js/core/brakeReviewPhase.js`: maquina de estados, reglas, auditoria, idempotencia e integracion con Attempt V2.
- `js/core/firebaseSync.js`: transaccion Brake Review sobre Official Timer Authority.
- `js/core/timerRules.js`: compatibilidad exacta de politica temporal para `0.6.1` y contexto de caballo.
- `js/app.js`: frontera profile-aware, UI, acciones y transiciones.
- `js/views/cronometro-control.js`: contexto operativo de Revision de freno.
- `css/styles.css`: superficie responsive de Brake Review.

## Pruebas

Se agregaron 12 suites `tests/brake-review-*.test.mjs`, un fixture compartido y se actualizo la expectativa de activacion temporal para reconocer `0.6.1` solo con fingerprint certificado.

## Build

`functions/configuration.defaults.json` establece el build `20260826-pre-cala-brake-review-official-phase-002-v1`. El propagador canonico actualizo imports relativos en runtime, fixtures y pruebas; no hubo edicion manual dispersa de cache-busters.

## Fuera de alcance

- RTDB Rules: sin cambios.
- Functions de autoridad: sin cambios.
- Valores deportivos y FieldID: sin cambios.

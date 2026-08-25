# Deployment Decision

## Decision

`PRODUCTION DEPLOY: NO`

La certificacion puede consolidarse en Git, pero la politica permanece `CERTIFIED_NOT_ACTIVATED`. No esta cableada a Scorer, Remote, Graphics, Timer Display ni Broadcast.

## Motivos

1. `FMCH_2026_LIBRE@0.6.0` esta ACTIVE e inmutable; no se modifica su fingerprint.
2. Activar la politica requiere un cambio runtime explicito y cache-buster canonico.
3. Debe validarse en Emulator la seleccion por fase y el hecho condicional de Piales antes de Produccion.
4. El siguiente ticket tambien debe resolver interpolacion y contexto operativo, sin ticks continuos en Firebase.

## Targets

- RTDB Rules required: NO.
- Functions required: NO.
- Client required ahora: NO.
- Firebase Production Writes: 0.
- Profile lifecycle transition: NO.
- Tournament migration/assignment: NO.

## Gate posterior

Antes de cualquier deploy se requiere autorizacion separada, nuevo build, pruebas fisicas de las diez suertes y verificacion de que `PRODUCT_BASE` no adopta reglas FMCH por fallback.

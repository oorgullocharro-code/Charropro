# Brake Review Scoring

Las consecuencias deportivas se resuelven con RuleID canonicos del catalogo `0.6.1`. Las infracciones manuales son decisiones del juez; los tres umbrales temporales se derivan deterministicamente de Official Timer y la politica temporal certificada.

Al entrar al intento de Cala, `applyBrakeReviewToCalaAttempt` integra RuleIDs, puntos malos y DQ en el Attempt V2 existente. Official Score continua siendo la unica autoridad de publicacion.

No se usa `CALA.T` como almacen generico, no se crean FieldID ni columnas y no se altera la geometria del Formato Federacion. El snapshot conserva la trazabilidad de Brake Review y evita descontar dos veces.

Fingerprints preservados:

- `FMCH_2026_LIBRE 0.6.0`: `rptp_0f90f7a3944a82d7`.
- `FMCH_2026_LIBRE 0.6.1`: `rptp_10e596046446e850`.
- Temporal policy: `fmchtp_7d1e001181026f6d`.

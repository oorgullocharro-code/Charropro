# FieldID y bloqueos

## Piales

- Los tres intentos siguen mapeables a `PIALES.OPPORTUNITY_*`.
- `remateId`, `remateLabel`, `remateMetadata`, `distanceMeters` y `distanceAdditionalPoints` son estado operativo interno; no inventan FieldID.
- `PIALES.SIDE_CONTROL` y `PIALES.POST_INFRACTION_CONTROL_01..03` permanecen ambiguos para el exportador.
- Estado del scorer deportivo: PASS.
- Estado de equivalencia completa del formato: BLOCKED para controles impresos ambiguos.

## Coleadero

- La matriz 3 x 3 conserva coleador, oportunidad, caida, distancia y resultado.
- No se creo cuarto participante.
- FieldID bloqueados exactos:
  - `FMCH.TEAM_SHEET.COLEADERO.PARTICIPANT_04.NAME`
  - `FMCH.TEAM_SHEET.COLEADERO.BOTTOM_CONTROL_04`
- La fuente confirma tres coleadores y admite sustitucion reglada, pero no define si la cuarta fila impresa representa suplente, reserva, resumen u otro control.
- Estado: `SOURCE_CONFIRMATION_REQUIRED`.

## Efecto del bloqueo

El bloqueo no impide score 3 x 3, orden, caidas, adicionales, infracciones, Descalificacion, Attempt V2 ni freeze oficial. Si impide declarar equivalencia completa del exportador FMCH y mantiene `FMCH_2026_LIBRE` en `draft` con `activationReady: false`.

No se migraron FieldID, no se modifico el formato oficial y no se recalcularon historicos.

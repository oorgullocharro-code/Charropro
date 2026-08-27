# Migracion explicita de torneos FMCH

## Regla

El default productivo aplica solo al crear torneos Libre nuevos. Cambiar el default no modifica `ruleProfileId`, `ruleProfileVersion`, `ruleProfileAssignment` ni `effectiveRulesFingerprint` de torneos existentes.

## Autoridad

Una migracion permitida usa exclusivamente `assignCharroProTournamentRuleProfile` con:

- sesion Firebase Auth activa de `platformAdmin`;
- `tournamentId` exacto;
- `profileId: FMCH_2026_LIBRE`;
- `version: 0.6.1`;
- `expectedRevision` leida inmediatamente antes;
- `idempotencyKey` unica y trazable;
- tenant y organization del torneo;
- lifecycle `active`, certificacion `PASS`, P0 `0` y fingerprint `rptp_10e596046446e850`.

No se permite escritura directa a RTDB.

## Historicos

La autoridad rechaza un cambio de identidad cuando el torneo contiene `publishedScores`, `officialScoreLedger` u `officialScoreAudit`. Esos torneos permanecen fijados a su version original; no se reinterpretan scores ni Attempts ya publicados.

Para un torneo existente sin historial oficial, el administrador debe revisar el contexto, confirmar la migracion y verificar el read-back de la asignacion. No existe migracion masiva ni fallback cruzado.

## Verificacion

Despues de una migracion autorizada se debe confirmar:

1. revision incrementada exactamente una vez;
2. assignment y fingerprint coherentes;
3. auditoria e idempotencia persistidas;
4. scorer resuelto con la version asignada;
5. ausencia de cambios en torneos no seleccionados.

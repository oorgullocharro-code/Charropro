# Rule Profile Trace

## Cadena canonica

```text
Charreada
  -> tournamentId
  -> getActiveTournament()
  -> getCharreadaScoringSuertes(charreada, tournament)
  -> getTournamentSuertes(tournament)
  -> resolveTournamentRules(tournament)
  -> resolveRuleProfileSelection(tournament)
  -> resolveEffectiveRules({ suerte, profile })
  -> suerte.catalog + suerte.ruleResolution
  -> buildScoringActionButtons(context)
  -> scorer UI
```

No existe una entidad `createCompetition()` separada en el flujo actual. `saveCharreada()` materializa `competitionType`, `competitionScope`, `competitionId` y `suerteIds`. Esos campos seleccionan las suertes, pero no seleccionan el Rule Profile.

## Seleccion previa de Denver

Entrada:

```json
{
  "id": "torneo_mssamn82_w5hmly",
  "type": "completo"
}
```

Salida relevante:

```json
{
  "valid": true,
  "blocked": false,
  "profile": {
    "profileId": null,
    "profileVersion": null,
    "status": "product_base",
    "fallbackUsed": false
  },
  "layers": ["PRODUCT_BASE"]
}
```

## Seleccion esperada para validacion FMCH local

El contrato existente del seed local establece:

```json
{
  "ruleProfileId": "FMCH_2026_LIBRE",
  "ruleProfileVersion": "0.6.0",
  "ruleProfile": {
    "status": "active",
    "metadata": {
      "fixtureOnly": true,
      "activationReady": false,
      "environment": "local-emulator"
    }
  }
}
```

La resolucion resultante contiene `layers: ["PRODUCT_BASE", "RULE_PROFILE"]`; las reglas FMCH reemplazan o deshabilitan las entradas base mediante RuleKey, sin crear un catalogo paralelo.

## Seguridad de activacion

`FMCH_2026_LIBRE_PROFILE` permanece:

- version `0.6.0`;
- `status: draft`;
- `activationReady: false`;
- no seleccionable desde el registro productivo.

La copia `active` solo se construye cuando `getFirebaseRuntimeDiagnostics()` confirma `local: true` o `environment: local`. El helper no depende del hostname ni inventa un modo de produccion.

## Comportamientos preservados

- Sin perfil en produccion: `PRODUCT_BASE`, sin fallback.
- Referencia incompleta: resolucion bloqueada.
- Referencia desconocida: resolucion bloqueada.
- Referencia desconocida con `ruleProfileFallback: product_base`: fallback explicito y diagnosticado.
- Perfil explicito existente: nunca es reemplazado por el default local.
- Charreada: hereda el perfil del torneo; no duplica el contrato.

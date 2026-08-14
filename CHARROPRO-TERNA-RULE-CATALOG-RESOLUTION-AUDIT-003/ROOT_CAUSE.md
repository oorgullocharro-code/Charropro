# Root Cause

## Dictamen

La causa raiz esta demostrada. `Denver` fue creado mediante la interfaz normal en LOCAL / EMULATOR y su objeto de torneo no contenia `ruleProfileId`, `ruleProfileVersion` ni `ruleProfile`. La charreada no posee una copia propia del perfil: el scorer resuelve sus suertes a partir del torneo padre.

`resolveRuleProfileSelection()` considera valido un torneo sin referencia de perfil y devuelve `profile: null`, `status: product_base` y `fallbackUsed: false`. Por ello `resolveEffectiveRules()` conserva exclusivamente la capa `PRODUCT_BASE`. El scorer no sustituyo ni altero el catalogo: mostro fielmente ese resultado.

## Evidencia de Emulator

| Campo | Denver | Fixture FMCH local |
| --- | --- | --- |
| tournamentId | `torneo_mssamn82_w5hmly` | `demo-local-fmch-2026` |
| tournament | Denver | DEMO LOCAL / NO OFICIAL - Auditoria FMCH |
| charreadaId auditada | `charreada_mssanipe_1x6q32` | `demo-local-fmch-jornada-1` |
| charreada | Charreada 2 | Jornada de validacion local |
| competitionId | `equipos_completo` | `equipos_completo` |
| ruleProfileId | ausente | `FMCH_2026_LIBRE` |
| ruleProfileVersion | ausente | `0.6.0` |
| perfil embebido | ausente | copia local `active` |
| resultado | `PRODUCT_BASE` | `PRODUCT_BASE + RULE_PROFILE` |

Charreada 1 y Charreada 2 de Denver carecian igualmente de referencias propias de perfil. Esto es coherente con el modelo: heredan por referencia desde el torneo, pero Denver tampoco tenia perfil que heredar.

## Esperado y actual

EXPECTED RULE PROFILE: `FMCH_2026_LIBRE`

ACTUAL RULE PROFILE BEFORE: ninguno; `product_base`

EXPECTED VERSION: `0.6.0`

ACTUAL VERSION BEFORE: ninguna

EXPECTED CATALOG SOURCE: `js/data/fmch2026TernaRules.js`, aplicado mediante `FMCH_2026_LIBRE 0.6.0`

ACTUAL CATALOG SOURCE BEFORE: `SUERTES` / `PRODUCT_BASE` en `js/data/suertes.js`

FALLBACK USED BEFORE: NO

WHY FALLBACK: no hubo fallback explicito. La ausencia total de seleccion de perfil activa el comportamiento base valido del resolver. Un fallback real solo aparece ante referencia invalida con `ruleProfileFallback: product_base`.

## Flujo causal

1. `saveTournament()` creaba el torneo sin campos de Rule Profile.
2. `saveCharreada()` guardaba competencia y participantes, pero no copiaba el Rule Profile.
3. `getCharreadaScoringSuertes()` obtenia el catalogo desde el torneo padre.
4. `getTournamentSuertes()` llamaba a `resolveRuleProfileSelection()`.
5. La seleccion vacia devolvia `profile: null` sin bloqueo y sin fallback.
6. `resolveEffectiveRules()` conservaba unicamente `PRODUCT_BASE`.
7. `buildScoringActionButtons()` convertia ese catalogo en los botones observados.

## Frontera de correccion

La frontera minima correcta es la asignacion de configuracion al crear datos de validacion local, no el scorer ni el catalogo deportivo.

- Los torneos nuevos creados en LOCAL / EMULATOR reciben una copia explicita y aislada de `FMCH_2026_LIBRE 0.6.0` con `status: active`, `fixtureOnly: true` y `activationReady: false`.
- Al crear una charreada nueva bajo un torneo local anterior sin perfil, se completa el perfil del torneo padre antes de resolver su scoring.
- Una seleccion existente, incompleta, invalida o un fallback explicito nunca se sustituye silenciosamente.
- Produccion no recibe este default. El perfil canonico permanece `draft` y bloqueado para activacion productiva.

## Clasificacion de hipotesis

- A: confirmada. La nueva charreada dependia de un torneo sin Rule Profile.
- F: confirmada en su causa. La herencia funciona por referencia, pero no habia perfil padre.
- G: descartada como causa directa. El seed FMCH si incluye el perfil correcto; Denver no fue creado por el seed.
- H: descartada. El scorer recibio `PRODUCT_BASE` desde el resolver canonico, no desde una lectura legacy paralela.
- I: confirmada como detalle arquitectonico. Faltaba una politica local de asignacion para torneos creados por UI.

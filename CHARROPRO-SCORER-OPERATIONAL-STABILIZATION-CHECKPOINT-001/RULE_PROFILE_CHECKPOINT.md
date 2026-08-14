# Rule Profile Checkpoint

## Causa raiz confirmada

El torneo local Denver fue creado sin `ruleProfileId`, `ruleProfileVersion` ni perfil embebido. El resolver selecciono correctamente `PRODUCT_BASE` con `fallbackUsed: false`; no fue un fallback accidental.

## Frontera local

`js/core/localRuleProfileDefaults.js` aplica `FMCH_2026_LIBRE 0.6.0` solamente cuando el diagnostico runtime identifica LOCAL / EMULATOR y no existe una seleccion explicita previa. La misma asignacion es reutilizada por el seed local.

La asignacion local conserva:

- `status: active` solo dentro del fixture local;
- `metadata.fixtureOnly: true`;
- `metadata.activationReady: false`;
- `metadata.environment: local-emulator`.

## Produccion

El perfil canonico `FMCH_2026_LIBRE` permanece `draft` y `activationReady: false`. No existe default global, fallback cruzado ni activacion silenciosa en Produccion.

## Integridad deportiva

Los catalogos se resuelven desde el perfil existente. `app.js` no contiene una copia de puntos, IDs o reglas FMCH. `SUERTES`, el perfil canonico y sus valores deportivos no fueron alterados por la asignacion local.

# Canonical Official Results / Public Projection Parity

## Dictamen

`CANONICAL_OFFICIAL_RESULTS_PUBLIC_PROJECTION_PARITY_RECOVERED`

La evidencia read-only del torneo TEST confirmó el mecanismo reproducido por la auditoría. Una sola oportunidad deportiva de Pial de Ruedo, identificada por `terna:...:op:4`, tenía tres registros externos activos con `coleadorIndex` 0, 1 y 2. La colección operativa conservaba 21 y total 193, mientras la proyección pública sumaba 63 en PR y total 235.

La corrección introduce el contrato derivado `canonicalOfficialResults/1.0.0`. Selecciona el registro oficial vigente por identidad deportiva a partir de `officialScoreLedger`, registros oficiales activos y el Attempt V2 congelado. Conserva IDs de origen, revisión, desglose e historia superseded. No persiste un esquema productivo nuevo.

## Primera pérdida

- Valor oficial vigente: 21.
- Sábana interna: PR 21; total 193.
- Proyección pública observada: PR 63; total 235.
- Primera capa divergente: `buildResults` de Public Projection.
- Primera escritura divergente: la publicación temporal reconstruida con `coleadorIndex: 0`, seguida por publicaciones externas con índices 1 y 2 para la misma `sharedOpportunityId`.
- Causa: el ledger y la proyección usaban `attemptKey`, cuya identidad incluía un índice exterior mutable. La proyección sumaba las tres cabezas activas.

## Arquitectura resultante

`officialScoreLedger + active official records + frozen Attempt V2`

→ `canonical current results`

→ sábana interna, Formato Federación, ranking y Public Projection

→ Portal Público

La identidad de publicación conserva `recordId`, `attemptKey`, idempotencia, auditoría y revisión. La identidad deportiva usa torneo, competencia, charreada, equipo o participante, suerte y `sharedOpportunityId`; el fallback usa número de oportunidad y, solo para Coleadero, identidad del participante.

## Alcance

- Cliente modificado: sí.
- Functions modificadas: sí, en la transacción de score oficial.
- Rules modificadas: no.
- Datos productivos modificados: no.
- Migración de datos requerida: no.
- Valores deportivos, RuleIDs, FieldIDs y timers: sin cambios.

La derivación no agrega roundtrips. Añade una selección local determinista sobre los registros oficiales y transporta el ledger dentro de la lectura privada ya existente; la proyección pública no expone el ledger.

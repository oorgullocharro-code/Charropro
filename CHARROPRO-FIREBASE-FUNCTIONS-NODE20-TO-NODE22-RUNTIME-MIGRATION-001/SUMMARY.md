# CHARROPRO-FIREBASE-FUNCTIONS-NODE20-TO-NODE22-RUNTIME-MIGRATION-001

## Scope

- Base commit: `83316cc1d336589e04cf57bfa72a09fdeb7b7049`.
- Runtime authority: `functions/package.json`.
- Runtime migration: Node 20 to Node 22.
- Validated local runtime: Node `22.23.2`, npm `10.9.8`.
- Function generation remains Gen2.
- Dependencies remain `firebase-admin 13.10.0` and `firebase-functions 7.2.5`.
- Canonical build: `20260831-firebase-functions-node22-runtime-migration-001-v1`.

No Function behavior, RTDB Rules, IAM, regions, memory, concurrency, retries,
timeouts, scoring, Timer Authority, sporting data, RuleIDs, FieldIDs, or lifecycle
semantics changed.

## Production Set

Only these ten existing production Functions are in the deployment set:

1. `assignCharroProTournamentRuleProfile`
2. `deleteCharroProTournament`
3. `deliverCharroProOfficialScoreFanout`
4. `executeCharroProBackup`
5. `getCharroProConfiguration`
6. `getCharroProRuleProfileLifecycle`
7. `publishCharroProConfiguration`
8. `publishCharroProOfficialScore`
9. `transitionCharroProRuleProfileLifecycle`
10. `upsertCharroProUser`

The seven source exports not present in Production remain excluded from deploy.

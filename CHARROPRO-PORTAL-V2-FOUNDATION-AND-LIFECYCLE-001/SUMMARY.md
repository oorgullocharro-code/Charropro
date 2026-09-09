# Portal V2 Foundation And Lifecycle

## Scope

Portal Público V2 is a `PARALLEL_PREVIEW / NOT_PRODUCTION_DEFAULT` entrypoint at `portal-v2.html`. The legacy `torneo-publico.html` remains unchanged.

The V2 app subscribes only to `publicTournaments/{tournamentId}` through `subscribePublicTournamentSnapshot()`. It accepts only Canonical Public Tournament Data V3 (`schemaVersion: 3`, `projectionVersion: 3.0.0`) and uses the existing revision/content-hash guard. V1/V2 or malformed data fail closed without using a fallback source.

## Lifecycle

The shell renders `PRE_EVENT`, `LIVE`, `PAUSED`, `FINALIZED`, and `ARCHIVED` using values already resolved in V3. A stale connection keeps the last valid snapshot visible and identifies it as pending refresh; it never reconstructs results.

## Data Boundary

The portal does not read or calculate `publishedScores`, `officialScoreLedger`, `Attempt V2`, totals, positions, or tie-breaks. `PR = 21` and `total = 193` in the reference fixture are read directly from V3 resolved fields.

## Local Preview

With the local Emulator fixture running, open:

`http://127.0.0.1:8766/portal-v2.html?tournamentId=demo-local-fmch-2026&charroproEnv=local`

For LAN hardware validation, replace `127.0.0.1` with the local Mac LAN host only after enabling the existing local-only emulator LAN mode. This remains read-only against `demo-charropro-local` and is not a Production route.

## Deferred

Detailed Results, Standings, Sheet, Timeline, and Statistics screens are intentionally shells in this foundation. A follow-on Portal V2 content ticket owns their depth.

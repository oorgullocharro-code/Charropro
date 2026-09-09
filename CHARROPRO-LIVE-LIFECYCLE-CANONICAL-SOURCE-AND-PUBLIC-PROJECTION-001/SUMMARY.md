# Live Lifecycle Canonical Source And Public Projection

## First loss

`live/current` already carried a verifiable active charreada identity, but the V3 lifecycle adapter only inspected `liveCurrent.status`. The normal live payload did not materialize that field, so an active event fell back to the tournament's `preparacion` status and Portal V2 correctly rendered `PRE_EVENT`.

## Resolution

`resolveCanonicalTournamentLifecycle()` is now the shared lifecycle transport authority for the browser V3 builder and its Functions reconciliation mirror. It preserves explicit archived, finalized, paused, and live states first. Otherwise, it treats a `live/current` active charreada as `LIVE` only when its identity exists in the tournament program. Explicit program `en_vivo` status is also preserved. Scores, dates, timeline entries, and current teams are not inputs.

The live publisher persists the resolved `lifecycleStatus` in `live/current` before Public V3 reads it. V3 transports that value into both `lifecycle.status` and `live.status`; Portal V2 remains presentation-only.

## Operational boundaries

- `PAUSED` is supported only by an explicit persisted status; inactivity never implies pause.
- A completed charreada does not finalize a tournament with other charreadas.
- `FINALIZED` and `ARCHIVED` require explicit authoritative status.
- The observed production record was not read or written during this ticket. Its exact historical snapshot is unavailable locally; the failure is reproduced by the missing `liveCurrent.status` path and guarded with a fixture equivalent to an active charreada plus published results.
- Timeline production remains a separate upstream producer gap. This ticket does not create public events.

## Scope

No scoring, Official Score, Attempt V2, ranking, sheet, Timer, Rules, Functions deployment, Firebase data, or Portal V2 lifecycle inference changed.

Client build: `20260909-live-lifecycle-canonical-source-001-v1`.

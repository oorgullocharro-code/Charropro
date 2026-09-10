# Recovery Pending Reset Summary

## Root Cause

Manual Recovery ran a state transaction before the canonical claim for every
selected job. For an already `PENDING` job, that produced a prohibited
`PENDING -> PENDING` metadata-only write. The RTDB Rules correctly reject that
transition; the intended claim is `PENDING -> PROCESSING`.

## Corrective Behavior

`retryFirebasePublicProjectionJob()` and
`retryAllFirebasePublicProjectionJobs()` now skip the reset after a fresh
`PENDING` read and invoke the scoped canonical reconciliation directly.

`DEAD_LETTER`, `FAILED`, and `RETRY_WAIT` retain the required reset to
`PENDING` before claiming. `PROCESSING`, `PROJECTED`, `VERIFIED`, `CANCELLED`,
and `SUPERSEDED` remain non-retryable through this path.

## Production Boundary

This ticket changes only the client recovery flow and cache identity. It does
not alter Rules, Functions, Outbox schema, scoring, public projection builders,
or lifecycle behavior.

No production Recovery action was executed while implementing or publishing
this fix. The authorized job remains for a separately approved controlled
resume:

`projection_f873b7ce55c9f798_1` in tournament
`torneo_mtut0u78_ojpwf6`, expected to remain `PENDING` at `attempts=5` before
that later action.

## Deployment Gate

The certified client build is eligible for a client-only deployment. After a
successful deploy, the expected status is:

`RECOVERY_REDUNDANT_PENDING_RESET_FIX_DEPLOYED_PENDING_CONTROLLED_RECOVERY_RESUME`

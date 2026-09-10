# Projection Outbox Retry Actor Immutability Rules Fix

## Scope

The Recovery Center retry claim rematerializes the persisted `retriedBy` actor.
RTDB rejected `PENDING -> PROCESSING` after a dead-letter reset because the
prior Rule compared the actor map as a whole.

The Rule now preserves the four canonical actor leaves individually:
`uid`, `name`, `role`, and `clientId`. The symmetric `cancelledBy` validation
uses the same contract.

## Recovery Fixture

The isolated Emulator fixture reproduces the authorized recovery path:

`DEAD_LETTER (attempts 5) -> PENDING (attempts 5) -> PROCESSING (attempts 6)`

The second transition creates a lease and preserves the retry actor exactly by
its canonical leaves.

## Non-Goals

No client, Function, score, public projection, backfill, reconciliation, or
production data change is included. The existing production recovery job is
not retried by this ticket.

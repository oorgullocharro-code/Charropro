# Coordinated Deploy Plan

Deployment is intentionally not part of this ticket closeout.

## Preconditions

1. Confirm the approved commit is `main` and `origin/main`.
2. Re-run the V3 Rules Emulator test and the V3 parity tests from that commit.
3. Confirm no unrelated staged or untracked files exist.

## Ordered Targets

1. Deploy RTDB Rules only. This enables strict V3 public snapshots and V3 Outbox intents while rejecting new V2 writes and private fields.
2. Deploy only the Function surface containing historical reconciliation if the deployed Function still imports the V2 public projection module. No unrelated Functions are required.
3. Deploy the client so the public writer, Outbox confirmation, Portal adapter, and public reader move together.

## Post-Deploy Checks

- Read a public snapshot and confirm `schemaVersion: 3` and `projectionVersion: 3.0.0`.
- Confirm Results, Standings, and Sheet agree for one known canonical result.
- Confirm an Outbox job reaches its normal terminal confirmation state without creating a V2 intent.
- Do not repair, reproject, or otherwise mutate the historical TEST tournament without separate authorization.

## Rollback

Rollback must deploy the preceding coordinated Rules, Function, and client artifacts together. Do not restore only the client against V3 Rules, and do not re-enable new V2 writes. Existing V2 public snapshots remain readable as legacy data until a separately approved migration/reprojection plan exists.

# Summary

## Root cause

The configured Firebase Storage bucket did not exist in Production. The Cloud
Storage for Firebase API had never been enabled for the project, so the backup
worker received HTTP 404 while saving the archive. The delete authority stayed
fail-closed and did not begin the destructive multipath update.

The API was enabled and the default Firebase Storage bucket was provisioned
through the canonical Firebase endpoint. No RTDB or Storage Rules were opened.

## Corrective boundary

- Storage write, metadata and read failures now carry a sanitized stage and
  diagnostic code in the server-side backup job.
- A missing bucket/object is terminal instead of entering an ineffective retry
  cycle.
- Tournament deletion distinguishes backup creation failure from backup
  validation failure.
- The Supervisor sees only a safe diagnostic identifier; stack traces, bucket
  paths and credentials are not exposed.
- Backup creation and validation remain mandatory before deletion.

## Preserved contracts

- `releaseStatus = precommercial`.
- TEST tournament deletion authority, CAS, lock, idempotency and read-back.
- Commercial/OFFICIAL hard-delete protection.
- `FMCH_2026_LIBRE 0.6.1`, sporting values, RuleIDs, FieldIDs, Timer, scoring
  and lifecycle are unchanged.
- RTDB Rules are unchanged.

No production tournament was deleted by Codex.

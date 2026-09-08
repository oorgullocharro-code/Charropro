# Canonical historical reconciliation tooling

Administrative callable `reconcileCharroProHistoricalResults`, pending deployment authorization. No production operation was executed. The preserved production TEST tournament was not read or changed during implementation.

The API derives a plan with the existing `canonicalOfficialResults` authority, preserves official record IDs/revisions/Attempt V2, archives redundant heads, consolidates their requests into the same ledger ID used by normal publication, and rebuilds one public tournament with the existing public projection builder. It does not invoke judge publication or create a sporting revision. Legacy ledgers remain present as historical aliases with empty `activeRecordId`, a canonical ledger reference and their original requests/revisions. Their record copies reflect the canonical record status; they no longer claim independent authority.

The common RTDB ancestor of private authority and public projection is `/charropro`. The implementation uses the existing ETag CAS there, with a recursively enforced delta allowlist. Only selected published record nodes, affected ledger nodes, the selected public projection and one administrative audit/receipt node can differ. Unrelated subtrees are copied unchanged from the successful CAS read, including concurrent writes to other tournaments; a changed target source invalidates the plan. No general-purpose database patch is exposed to callers. This trades broad read/transaction contention for atomic private/public consistency without changing Rules or the data layout.

All operations resolve current server-side profile and access. Auth, active user, supervisor role, exact tournament access and tenant/organization binding are mandatory. Dry-run contains the source signature, deterministic plan token, current/historical record IDs, canonical totals, public before/after preview and exact allowed paths. Token and complete source signature are recomputed during execution. A token is a plan digest, not an authorization credential; authorization is independently enforced on every request and CAS attempt.

Different frozen sporting scoring evidence, absent shared identity, inconsistent identity/ledger/request records, or invalid public projection fail closed. This implementation intentionally rejects unsupported legacy shapes instead of guessing or silently migrating them. Real production data must undergo a fresh dry-run after separate deployment approval.

## Operations

Every call supplies `tournamentId`, `charreadaId`, `teamId`, full `sharedOpportunityId` and a path-safe `reconciliationId`. The caller's Firebase Auth token supplies identity; request-supplied roles are not used.

1. `mode: DRY_RUN`: read-only plan. Save `planToken` and `beforeSignature`.
2. `mode: BACKUP`: include `planToken` and `expectedBeforeSignature`. Creates a Storage object with create-only generation precondition, then downloads and verifies it. Existing mismatched objects block instead of being overwritten.
3. Repeat `DRY_RUN` if desired; source/plan must still match.
4. `mode: EXECUTE`: same fields. Downloads the backup and verifies its digest, manifest, archived payload and exact source signature. A single CAS commits reconciled ledgers/publications, derived public projection and `historicalReconciliations/{tournamentId}/{reconciliationId}` administrative audit. Scores, timers, prior sporting audit, fanout and outbox are unchanged.
5. Same `EXECUTE`: returns the receipt without another write if authority and request still match. `mode: REPROJECT` re-runs the public derivation against that same authority and requires its signature to equal the certified result. A different result blocks. A changed sporting source requires a new operation; an old receipt cannot overwrite new results.

RTDB null/empty omission and numeric-map/array equivalence are normalized for database signatures. The public adapter restores only omitted null/empty fields before using the existing revision comparator, preventing revision churn after readback. No browser code was modified.

## Backup

Object: `charropro/reconciliationBackups/{tournamentId}/{reconciliationId}.json` in the configured Functions default bucket. The envelope includes a validated tournament archive from `backupFoundation`, plus an exact scoped snapshot covering private state, audit, fanout, outbox, public projection, live metadata, index and history statistics. Manifest includes backup ID, timestamp, tournament ID, tooling build, source revision/signature and plan token. `checksum` is SHA-256 of canonical JSON of the envelope without its checksum field; the nested archive retains its own foundation payload fingerprint. Verification downloads persisted bytes and validates both layers before allowing CAS.

This is a forensic recovery artifact, not permission to run restore or retention cleanup. Existing backup/delete policy and restore exports are unchanged. A backup can remain orphaned if source changes before commit; the operation then blocks and never deletes that evidence.

## Deployment classification

`FUNCTIONS_ADDED=reconcileCharroProHistoricalResults` (Gen2 callable, us-central1, Node 22 declared, administrative recovery).

`FUNCTIONS_MODIFIED=NONE` for existing function implementations; `functions/index.js` registers the new API. Six browser-neutral authority modules are packaged verbatim into `functions/reconciliationShared`; `node tools/release/packageReconciliationShared.mjs --check` verifies parity. They must be regenerated and checked if original sources change.

`ALLOWLIST_CHANGE_REQUIRED=APPLIED_WITH_EXPLICIT_AUTHORIZATION`. The production allowlist now authorizes 11 Functions and keeps all seven excluded exports unchanged. The canonical wrapper requires an explicit subset of targets and an explicit initial-create declaration. It verifies the complete inventory (10 existing before this creation, 11 after), and guards the actual Firebase planner and Fabricator against any unexpected create, update, deletion or replacement. See DEPLOYMENT.md. No deployment, Rules modification, client build change or production repair is included.

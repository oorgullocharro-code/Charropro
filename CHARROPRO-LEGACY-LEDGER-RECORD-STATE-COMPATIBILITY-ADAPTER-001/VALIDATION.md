# Validation

## Adapter contract

Accepted:

- `EXACT_MATCH`
- `LEGACY_STATE_ASYMMETRY_COMPATIBLE`

Rejected explicitly:

- sporting or Attempt V2 differences;
- identity or shared-opportunity differences;
- revision differences;
- supersession or successor differences;
- missing successor;
- active-record conflicts;
- arbitrary status combinations;
- any unrecognized metadata difference.

## Real read-only snapshot

The previously captured local snapshot was read from disk and evaluated only through the pure `dryRun()` function. Its SHA-256 was `79a90014813c9e0a25928c5d0fd5d6c17f214655cc47e03e02896a415eb67ee0`. The snapshot was unchanged after evaluation.

- active heads before: 3
- canonical heads after plan: 1
- duplicate heads to historical: 2
- legacy compatible record: `official_c4ffdb24f29947e0f9078f179da831e4`
- legacy value: 15, superseded, does not count
- successor: present and authoritative
- canonical PR: 21
- canonical total: 193
- public target PR: 21
- public target total: 193

No private snapshot content is stored in this repository.

## Automated validation

Pure adapter coverage includes exact match, the demonstrated legacy pattern, and fail-closed cases for total, revision, Attempt V2, shared opportunity, supersession, successor, active conflicts, unknown status combinations, and unknown metadata.

Directed regressions cover Official Score Concurrency, Canonical Official Results, Historical Reconciliation, Terna Recovery, Public Projection, Projection Outbox, Official Ranking parity, and Attempt V2.

Emulator certification used only `demo-charropro-local` with Auth, RTDB, Functions, and Storage. It verified backup gating, read-only dry-run, stale-state rejection, concurrent idempotent execution, reload, reprojection, and canonical/public parity. No production resource was contacted.

Final consolidated non-service suite: `243/243 PASS`. The historical reconciliation and tournament deletion integration tests that require live local services were executed separately under Emulator and both passed. Node syntax checks passed for every changed JavaScript module and test. All 32 tracked JSON files validated successfully. `git diff --check`, secret scan, and debugger scan passed.

The Functions package dry-run includes both `historicalReconciliation.mjs` and `legacyLedgerRecordCompatibility.mjs`. No package was published and no deploy was attempted.

Rules, IAM, dependencies, secrets, client, sporting data, RuleIDs, FieldIDs, profiles, and lifecycle are unchanged.

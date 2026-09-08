# Targeted deployment preparation

Authorized source change: add `reconcileCharroProHistoricalResults` to the production allowlist and support explicit subsets through the canonical wrapper. Deployment and production reconciliation have not been authorized or executed in this preparation.

## Contract

The manifest contains 11 authorized exports and the unchanged seven excluded exports. `allowedInitialCreates` contains only `reconcileCharroProHistoricalResults`; this is an authorization boundary for a requested initial creation, not permission to recreate arbitrary missing Functions.

Every command requires `--targets` with a nonempty comma-separated subset. `--expect-create` declares which authorized initial creation must be absent. Without that flag, all 11 Functions must already exist. The initial creation preflight requires exactly the previous 10 names, ACTIVE, gcfv2, us-central1 and nodejs22, with no additional Functions and no missing existing Function. If the new Function already exists, the initial creation request blocks. `postflight` requires the complete final inventory of 11.

The package's existing npm deploy script remains routed through the canonical wrapper and now blocks without explicitly forwarded targets. No broad `firebase deploy --only functions` command is constructed. No `--force` option is accepted.

Read-only production preflight used for this gate:

```sh
node tools/release/productionFunctionsDeploy.mjs preflight --project charropro-e8a68 --targets reconcileCharroProHistoricalResults --expect-create reconcileCharroProHistoricalResults
```

Result: PASS, 10 existing Functions, exact new Function absent, one requested create, no deletions, zero excluded targets and zero other authorized targets. Only Firebase Functions inventory was read; no RTDB or Storage content was read or written.

For a later separately authorized execution, the same wrapper accepts the `deploy` command and requires `--execute`, plus the same explicit targets and initial-create flag. It forms only `--only functions:reconcileCharroProHistoricalResults --project charropro-e8a68 --non-interactive`. After successful execution it automatically validates the final complete inventory. This documentation is not authorization to execute that command.

## Actual Firebase plan guard

The guarded child loads Firebase Tools 15.20.0. The local planner, release driver and Fabricator source files are pinned by SHA-256 in `productionFunctionsFirebaseCliLock.json`. A different version, changed file, missing CLI or changed interface blocks. No new npm dependency is introduced. Upgrading Firebase Tools requires reviewing and certifying this integration and updating the lock intentionally.

The child revalidates the manifest, repository export set and arguments. Immediately before the Firebase planner filters targets, it validates Firebase's fresh existing backend against the full expected inventory. The generated plan must contain exactly the requested targets: creates exactly equal the declared initial creates; updates/skips only for requested existing Functions; no deletes, delete-and-recreate operations, unsafe migrations, unknown operations or duplicates. Endpoint project, codebase, platform, region and runtime must match. The new reconciliation callable also requires 1024 MiB, 540 seconds and no secrets.

The final aggregate plan is checked again immediately before Fabricator applies it. Applying without the planner guard is blocked. This uses a pinned internal Firebase interface because merely constructing `--only` arguments cannot certify the actual operations Firebase proposes. Tests use the real installed planner offline and a fake mutation executor; no production deployment is run for certification.

Firebase preparation may perform its ordinary service/API/IAM and source-upload preparation during a future authorized deployment before Functions release planning. The guard specifically blocks unexpected Function operations before they are applied; it is not a claim that a deployment has no other preparatory service effects. No deployment phase was invoked in this ticket.

## Directed validation

Node 22.23.2, 27 tests passed, zero failures/skips across:

- `tests/functions-production-deploy-allowlist.test.mjs` — 16 cases covering 11-authorized baseline, single/multiple targets, unauthorized/unknown/duplicate/empty targets, full export and inventory drift, no broad Functions target, exact creation transition and CLI failures.
- `tests/functions-production-deploy-tooling.test.mjs` — 9 cases covering actual plan operations, no unrelated create/update/delete, implicit replacement, guards before mutation, real Firebase planner single/multiple target behavior, version/hash drift, process argument failures and callable SDK metadata without invocation.
- Existing Node 22 migration and rule-profile lifecycle Rules tests — 2 regression checks.

Existing reconciliation unit/full-suite and Emulator certifications remain valid; the engine and six copied canonical modules were not changed by this tooling preparation. The Emulator was not repeated. A first metadata test attempt tried to load the complete Functions entrypoint and failed locally because no database URL was configured. The final test isolates the callable registration with the actual SDK and never invokes its callback or initializes the Admin SDK. The final directed run passes all 27 checks.

## Function safety review

Name: `reconcileCharroProHistoricalResults`. Gen2; us-central1; nodejs22; 1 GiB; 540 seconds. No new secrets, dependencies or Rules are required.

Every service mode verifies authenticated identity and active supervisor profile, tournament access and applicable tenant/organization binding. DRY_RUN is available without mutation. BACKUP and EXECUTE require the exact expected source signature and plan token; EXECUTE verifies a persisted immutable backup. Repeated EXECUTE checks the receipt, source and backup and returns idempotently. No sporting revision is added. REPROJECT derives only the selected tournament's public projection.

The RTDB CAS reads/replaces `/charropro` to atomically commit private/public authority, with a recursive delta guard restricting changes to the selected tournament's records, ledgers, public projection and administrative receipt. It preserves unrelated values and retries against the latest ETag. This is logical tournament write isolation with root-level contention, not a small per-tournament network PUT. No code changes to this mechanism were needed for the deployment gate.

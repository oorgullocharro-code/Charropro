# Architecture

## Purpose

The Rule Profile Lifecycle Authority turns the existing pure temporal policy into a trusted, persistent server operation. It does not edit sporting definitions and does not assign profiles to tournaments.

## Boundaries

```text
Certified Rule Profile definition
            |
            v
Server certification manifest
            |
            v
Callable Function authorization
            |
            v
Lifecycle Engine + certification/fingerprint gates
            |
            v
Single RTDB transaction
            |
            +-- state
            +-- idempotency requests
            +-- immutable audit events
```

The web client can request a transition but cannot set status, revision, lifecycle timestamps, actors or fingerprints directly.

## Source of truth

The canonical persistent source is:

`charropro/ruleProfileLifecycle/profiles/{profileKey}`

Each profile root contains version containers:

`versions/{versionKey}/state`

`versions/{versionKey}/requests/{requestId}`

`versions/{versionKey}/audit/{eventId}`

`profileKey`, `versionKey`, `requestId` and `eventId` are deterministic safe keys derived server-side. A transaction covers the full profile root, so a state transition, idempotency record and audit event commit together. Holding all versions of one `profileId` in the same transaction also allows deterministic temporal-overlap validation.

## Definition versus lifecycle state

The certified sporting definition remains in the application catalog. The deployed server manifest contains only identity, scope, certification result, P0 count, catalog counts and the certified content fingerprint. It does not copy the 731 sporting rules.

Automated parity tests compare the server manifest against the canonical application profile and certification record. A lifecycle state stores the trusted content fingerprint and certificate fingerprint. A mismatch blocks subsequent transitions.

## Authority modules

- `functions/ruleProfileLifecycleEngine.js`: pure contract, authorization, gates, CAS, idempotency, transitions, overlap checks and audit construction.
- `functions/ruleProfileLifecycleService.js`: runtime clock and memory/Firebase transactional adapters.
- `functions/ruleProfileCertificationRegistry.json`: minimal deployable certificate registry.
- `functions/index.js`: authenticated Callable Function and actor resolution.
- `firebase-rules-auditoria.json`: direct client read/write denial.

## Activation readiness

`metadata.activationReady` in the static definition remains `false` for compatibility. `activationReadyEligibility:true` and certification `PASS` allow the trusted authority to persist `activationReady:true` in lifecycle state only during `draft -> ready`. Thus eligibility, lifecycle readiness and product definition are distinct and non-contradictory:

- Definition: certified content, still `draft`, not activated.
- Certification: eligible for a controlled transition.
- Lifecycle state: authoritative operational status and readiness snapshot.

## Exclusions

- No tournament assignment.
- No profile activation in Production.
- No UI or direct client mutation path.
- No sporting-value edits.
- No deployment, push or Firebase Production write.

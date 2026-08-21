# Security Model

## Trusted mutation boundary

The only lifecycle mutation entry point is the authenticated Callable Function:

`transitionCharroProRuleProfileLifecycle`

Firebase Admin performs the transaction server-side. RTDB Rules set both `.read` and `.write` to `false` for `charropro/ruleProfileLifecycle`, including supervisors and platform administrators. Internal state is returned only as a sanitized operation result.

## Authorization

- The Firebase Auth UID is resolved by the Callable Function and cannot be supplied by the client.
- The CharroPro user must be active.
- Lifecycle writes require a supervisor or platform administrator.
- System-scoped certificates require `platformAdmin:true`.
- Organization-scoped certificates require exact tenant and organization matches.
- Client tenant/organization values must match the certificate scope; no fallback or cross-scope mutation exists.

`FMCH_2026_LIBRE 0.6.0` is system-scoped because it is a federation-wide certified definition. A regular organization supervisor cannot activate it.

## Trusted data

The client cannot provide:

- arbitrary `newStatus`;
- revision output;
- fingerprint;
- `activatedAt`, `activatedBy`, `retiredAt` or `retiredBy`;
- audit event identifiers;
- server timestamps.

The request uses an allowlist. Functions, symbols, cycles, accessors, dangerous prototype keys, non-finite numbers and oversized structures are rejected by the shared safe-clone boundary.

## Certification and fingerprint gates

Every transition requires a server-side certificate with:

- valid profile identity and version;
- `profileValid:true`;
- certification `PASS`;
- `remainingP0:0`;
- `activationReadyEligibility:true`;
- valid canonical profile fingerprint.

Persisted content and certificate fingerprints must match the current trusted certificate. The client never supplies either value.

## Concurrency and idempotency

- `expectedRevision` is compared inside the RTDB transaction.
- A stale revision fails with `rule-profile-revision-conflict`.
- Idempotency is stored per version in the same transaction.
- The same key and payload returns the original result without another audit event.
- The same key with a different payload or actor fails with `rule-profile-idempotency-conflict`.

## Atomicity

Successful state, request and audit records are written in one profile-root transaction. Rejected operations return no new persistent state. There is no state/audit fanout requiring later recovery.

## Failure policy

The authority fails closed for unauthenticated/inactive actors, wrong roles, missing platform authority, tenant or organization mismatch, missing/failed certification, P0 blockers, fingerprint mismatch, invalid transition, stale revision, idempotency conflict, invalid dates, temporal overlap, missing profile/version and unavailable persistence.

## Secrets and privacy

Audit records contain only bounded actor identity/context, transition data, authoritative time, idempotency key, fingerprint and optional sanitized reason. Tokens, credentials, Firebase references and internal Admin objects are never returned or persisted.

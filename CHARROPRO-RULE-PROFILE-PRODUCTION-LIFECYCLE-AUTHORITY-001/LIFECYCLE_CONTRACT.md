# Lifecycle Contract

## Version

- Authority: `1.0.0`
- Service: `1.0.0`
- Compatible temporal policy: `1.0.0`

## Request

```json
{
  "profileId": "FMCH_2026_LIBRE",
  "version": "0.6.0",
  "requestedTransition": "MARK_READY",
  "expectedRevision": 0,
  "idempotencyKey": "controlled-operation-key",
  "effectiveFrom": "2026-09-01T00:00:00.000Z",
  "effectiveTo": null,
  "reason": "Certification approved",
  "tenantId": "",
  "organizationId": ""
}
```

Only these fields are accepted. The Callable Function derives the actor from Firebase Auth and the server user profile.

## Transition operations

| Request | Target | Allowed source states |
| --- | --- | --- |
| `CREATE_DRAFT` | `draft` | `skeleton` |
| `MARK_READY` | `ready` | `draft` |
| `RETURN_TO_DRAFT` | `draft` | `ready` |
| `ACTIVATE` | `active` | `ready` |
| `RETIRE` | `retired` | `active` |
| `DEPRECATE` | `deprecated` | `active` |
| `ARCHIVE` | `archived` | `skeleton`, `draft`, `ready`, `retired`, `deprecated` |

The transition graph is regression-tested against `RULE_PROFILE_TEMPORAL_TRANSITIONS`. Historical states cannot reactivate.

## Result

```json
{
  "ok": true,
  "authorityVersion": "1.0.0",
  "profileId": "FMCH_2026_LIBRE",
  "version": "0.6.0",
  "previousStatus": "draft",
  "status": "ready",
  "previousRevision": 0,
  "revision": 1,
  "fingerprint": "rptp_...",
  "transition": "MARK_READY",
  "auditEventId": "event_...",
  "activationReady": true,
  "effectiveFrom": "2026-09-01T00:00:00.000Z",
  "effectiveTo": null,
  "updatedAt": "server-authoritative ISO-8601",
  "idempotent": false
}
```

No token, RTDB reference, internal state, certificate object or Admin SDK object is returned.

## Temporal behavior

- `MARK_READY` requires an explicit zoned `effectiveFrom` and optional valid `effectiveTo`.
- `ACTIVATE` uses server time for `activatedAt` and rejects overlapping active versions of the same profile.
- `RETIRE` and `DEPRECATE` use server time for `effectiveTo` and retirement metadata. A client-supplied retirement date is not authoritative.
- All successful transitions increment revision exactly once.

## Idempotency

The request fingerprint includes identity, transition, expected revision, effective dates, reason, context and authenticated actor UID. A retry can occur after later transitions and still returns its original result.

## Failure codes

Important deterministic codes include:

- `rule-profile-auth-required`
- `rule-profile-role-denied`
- `rule-profile-platform-admin-required`
- `rule-profile-tenant-mismatch`
- `rule-profile-organization-mismatch`
- `rule-profile-version-not-found`
- `rule-profile-certification-failed`
- `rule-profile-certification-p0-blocked`
- `rule-profile-certification-not-eligible`
- `rule-profile-fingerprint-mismatch`
- `rule-profile-revision-conflict`
- `rule-profile-idempotency-conflict`
- `rule-profile-transition-invalid`
- `rule-profile-temporal-overlap`
- `rule-profile-transaction-aborted`

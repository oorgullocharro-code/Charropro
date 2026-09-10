# Validation

Build: `20260909-public-timeline-canonical-event-producer-001-v1`

## Directed Evidence

- Accepted official score creates exactly one public event: PASS.
- Rejected official score creates no public event: PASS.
- Idempotent retry retains one deterministic event: PASS.
- Official zero is represented as zero: PASS.
- Negative official value is preserved: PASS.
- Correction `15 -> 21` is public narrative only: PASS.
- Canonical, V3, and Portal current Pial result remain `21`: PASS.
- Canonical and public total remain `193`: PASS.
- Incorrect current `63` is absent: PASS.
- Legacy duplicate Terna heads do not become retrospective public events: PASS.
- Public names/context are transported when canonical metadata exists: PASS.
- Missing public metadata never falls back to technical IDs: PASS.
- Browser/Functions V3 public timeline parity: PASS.
- Shared package verification: `RECONCILIATION_SHARED=VERIFIED FILES=10`.

## Regression Gates

- Full suite: `179/179` test files PASS.
- Node syntax: `347/347` PASS.
- JSON parsing: `93/93` PASS.
- Cache/build authority tests: PASS.
- `git diff --check`: PASS.
- `git diff --cached --check`: PASS after exact staging audit.
- Debugger scan: 0 matches.
- Secret scan: PASS. The Firebase web `apiKey` is a public client
  configuration value and was excluded from private-credential detection.

## Intentional Non-Actions

- Historical backfill: no.
- Reconciliation/reproject: no.
- Production data reads/writes: no.
- RTDB Rules: unchanged.
- Deploy: no.

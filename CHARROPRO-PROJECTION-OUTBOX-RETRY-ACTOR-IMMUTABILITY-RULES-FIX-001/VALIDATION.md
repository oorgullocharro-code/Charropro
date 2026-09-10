# Validation

## Rules Emulator

- Exact dead-letter retry fixture: PASS.
- First actor assignment: PASS.
- Equivalent actor rematerialization: PASS.
- Retry actor uid, name, role, and clientId mutation: DENIED.
- Cancellation actor uid, name, role, and clientId mutation: DENIED.
- Retry/cancel actor deletion and reassignment: DENIED.

## Regressions

- `firebase-public-rules.test.mjs`: PASS, including Auth and RTDB Emulator.
- `firebase-public-projection-v3-rules-parity-emulator.test.mjs`: PASS.
- `public-projection-outbox.test.mjs`: PASS.
- `public-projection.test.mjs`: PASS.
- `public-projection-v3-function-parity.test.mjs`: PASS.
- `judge-cross-tournament-denied.test.mjs`: PASS.

## Gates

- Rules JSON: PASS.
- `git diff --check`: PASS before staging.
- Production data writes during implementation and validation: 0.

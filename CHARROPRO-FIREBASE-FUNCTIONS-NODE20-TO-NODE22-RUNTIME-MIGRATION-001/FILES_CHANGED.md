# Files Changed

## Runtime Migration

- `functions/package.json`: runtime authority changed from Node 20 to Node 22.
- `functions/package-lock.json`: matching root engine metadata only.
- `tests/firebase-functions-node22-runtime-migration.test.mjs`: runtime, lock,
  export inventory, generation, and Firebase config contract.

## Canonical Build

- `functions/configuration.defaults.json`: canonical build and derived checksum.
- Runtime modules, fixtures, and tests: canonical `?v=` propagation only.
- Build authority tests: expected build updated.

## Test Robustness

Seven Broadcast source-isolation tests now ignore the cache query value before
checking for forbidden Firebase dependencies. No production logic changed.

## Documentation

- This ticket directory records scope, validation, deployment decision, and
  rollback.

No RTDB Rules, Function implementation, dependency version, sporting rule,
profile, RuleID, FieldID, Timer, scoring, lifecycle, or release-status change is
included.

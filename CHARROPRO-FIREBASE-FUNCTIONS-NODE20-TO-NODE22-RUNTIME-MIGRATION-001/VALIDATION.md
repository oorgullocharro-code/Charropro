# Validation

## Runtime and Dependencies

- Node 22 runtime contract test: PASS.
- `npm ci` under Node 22.23.2: PASS.
- Dependency tree: unchanged.
- Lockfile diff: root `engines.node` only.

## Emulator

- Previously blocked public RTDB Rules fixture under Node 20.20.2: PASS.
- Same public RTDB Rules fixture under Node 22.23.2: PASS.
- Node 22 callable, Auth, RTDB, Storage, CAS, lifecycle, Timer, Brake Review,
  configuration, backup, and ephemeral tournament deletion gates: PASS.
- Production Firebase used by automated tests: NO.

## Regression and Static Gates

- Full aggregate suite: 157/157 PASS.
- Standalone suite under final build: 156/156 PASS.
- Emulator-only Function flow under Node 22: 1/1 PASS.
- Node syntax checks: 291/291 PASS.
- JSON validation: 60/60 PASS.
- Canonical build, module identity, configuration checksum: PASS.
- `git diff --check`: PASS.
- Secret, private-key, debugger, temporary-file, and Emulator-artifact scans: PASS.
- RTDB Rules diff: none.
- Functions behavior diff: none.

Seven build-name false positives were hardened by removing only `?v=...` cache
queries before existing forbidden-dependency scans. A real Firebase import remains
forbidden by those tests.

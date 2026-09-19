# Test evidence

## Red first

Before implementation, `tests/fmch-cala-medios-lados-controls.test.mjs` failed because `FMCH_2026_CALA_GRANULAR_MEDIOS_LADOS_RULES` did not exist. Exit status: `1`. This proved the four-identity contract was absent before the implementation.

## Directed contract

- None selected: `+0`
- Each granular identity alone: `+1`
- Right ida + vuelta: `+2`
- Left ida + vuelta: `+2`
- All four: `+4`
- Duplicate selection identity: no residual accumulation
- Toggle ON/OFF: canonical duplicate-action guard passes
- JSON persistence/reopen: all four exact RuleIDs preserved
- Attempt V2: exact identities preserved
- Official Score: exact identities and official total preserved
- Snapshot/format: `MD=2`, `MI=2`
- Legacy aggregate read: preserved
- `ca5`-`ca8`: no invented granular mapping
- Mixed legacy/granular: no side-level double count
- Browser/Functions catalog and profile mirror parity: `PASS`
- Cala and Manganas directed regressions: `PASS`

## Full regression

Coordinated local Emulators used Auth, RTDB, Functions, and Storage under `demo-charropro-local`.

- Tests: `340`
- Pass: `339`
- Fail: `0`
- Skip: `1`
- Node syntax revalidation: `383/383 PASS`
- JSON revalidation: `202/202 PASS`
- `git diff --check`: `PASS`

## Deployment preflight revalidation

- Directed Cala/lifecycle/configuration/Manganas gates: `11/11 PASS`
- Production Functions inventory: `12/12 ACTIVE`
- Production Functions guardrail: `PASS`
- Requested Functions targets: `6`
- Other Functions targeted: `0`
- RTDB Rules diff: `0`
- Secret scan: `PASS`
- Debugger scan: `PASS`

The single skip is an existing gated test and is not a failure.

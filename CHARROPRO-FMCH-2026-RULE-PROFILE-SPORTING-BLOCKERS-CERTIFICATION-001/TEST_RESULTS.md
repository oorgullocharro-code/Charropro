# Test Results

## Automated validation

- Repository test suites: `76/76 PASS`.
- Product and test syntax checks: `104/104 PASS`.
- JSON validation: `22/22 PASS`.
- Directed certification guard: `PASS`.
- Rule Profile structural validation: `PASS`, zero diagnostics.
- Canonical content fingerprint: `rptp_a9988543eb21259f`.
- Profile state: `draft`.
- `activationReady`: `false`.
- Catalog: `731` rules across `10` suertes.
- `git diff --check`: `PASS`.
- `git diff --cached --check`: `PASS`.

## Certification guard coverage

- Cala values and RuleIDs remain unchanged.
- Cala uncertified printed mappings remain blocked.
- Coleadero remains three active participants x three opportunities.
- No fourth Coleadero competitor is introduced.
- Contra mascara remains one RuleID at 14 points.
- Certification fails with five unresolved P0 gaps and three ticket blockers.
- A synthetic record passes the guard only after all required blockers and P0 gaps are resolved and certification evidence is present.
- Fingerprint is deterministic over a structured clone.

## Integrity scans

- New product code: none.
- New debugger statements: none.
- New product console statements: none.
- Secrets or private keys in ticket artifacts: none.
- Configuration baseline validation is covered by the passing `configuration-management.test.mjs` suite.
- Temporal Policy is covered by the passing `rule-profile-temporal-policy.test.mjs` suite.

## Production effects

- Firebase production writes: `0`.
- Push: `NO`.
- Deploy: `NO`.
- Profile activation: `NO`.
- Tournament assignment: `NO`.

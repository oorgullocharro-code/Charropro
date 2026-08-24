# Validation

Required gates:

- package validation;
- SHA/build/checksum match;
- forbidden-content rejection;
- dry-run without writes;
- Bash syntax;
- automated pipeline tests;
- remote inventory and backup;
- remote package SHA;
- staged extraction;
- remote and HTTP build/checksum;
- five HTTP entrypoints;
- rollback dry-run;
- Git, secret and private-key scans.

Firebase Production Writes remain 0.

## Precommit results

- Tests: 92/92 PASS.
- Node check: 209/209 PASS.
- Bash syntax: 5/5 PASS.
- JSON: 28/28 PASS.
- Shellcheck: not installed; no installation performed.
- `git diff --check`: PASS.
- Secret/private-key scan: PASS.
- Debugger scan: PASS.
- Real environment file ignored: PASS.

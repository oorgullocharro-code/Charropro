# Risks and Required Follow-up

## Open external dependencies

| Risk | Impact | Mitigation / owner |
| --- | --- | --- |
| No staging Firebase project exists yet | Cloud staging and IAM cannot be validated | Platform administrator provisions an isolated project using `STAGING_ARCHITECTURE.md` |
| `gcloud` is not installed on this workstation | IAM, billing, and staging project checks cannot run | Install it only when staging governance authorizes access |
| Browser Firebase bootstrap has no emulator connector | Browser sessions cannot yet use local emulators through profiles | Future approved browser runtime-configuration ticket; do not patch it inside infrastructure-only work |
| `npm audit` reported 10 transitive Function dependency vulnerabilities | Dependency review is required before a release | Track through an approved dependency-security ticket; do not use `npm audit fix` in this foundation ticket |
| Functions Emulator reports an outdated `firebase-functions` package | The dependency baseline should be reviewed independently of infrastructure enablement | Schedule a scoped dependency update with regression validation; do not update it in this ticket |
| Functions require Node 20 while one existing full-suite test requires Node 24 `registerHooks` | A single Node runtime cannot currently execute every local command | Use Node 20 for Functions/Emulator and Node 24 for all tests; schedule a scoped runtime-harmonization decision |
| Emulator export data can contain local fixture records | Accidental sharing could expose test data | Keep all exports under ignored `.local/`; clear intentionally before sharing |

## Controlled non-risks

- The explicit production alias remains available for separately authorized release management; it is no longer a default alias.
- `storage.rules` is closed by default and was not deployed.
- No project creation, Firebase remote access, deployment, or production data use occurred.

## Rollback

All repository changes are configuration, tooling, templates, tests, and documentation. Reverting the single future ticket commit restores the prior repository state. No Firebase state requires rollback because this ticket performs no remote mutation.

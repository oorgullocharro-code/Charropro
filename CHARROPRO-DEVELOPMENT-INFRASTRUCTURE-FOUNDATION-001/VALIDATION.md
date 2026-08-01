# Validation

## Static validation

The ticket requires the following validation before approval:

```sh
node --check tools/development/environmentFoundation.mjs
node --check tools/development/charropro-development.mjs
node --check tools/development/emulatorSmokeTest.mjs
node tests/development-infrastructure.test.mjs
node tools/development/charropro-development.mjs validate --env-file .env.local.example
node tools/development/charropro-development.mjs versions
node tools/development/charropro-development.mjs emulators:smoke --env-file .env.local.example
git diff --check
git diff --cached --check
```

## Expected emulator evidence

The smoke command starts a short-lived suite under `demo-charropro-local` and verifies that the services respond on ports 9000, 9099, 9199, and 5001. It does not invoke a product Function, create remote data, or deploy.

## Security review

- `.env`, `.env.*`, `.firebase/`, and `.local/` are ignored.
- Only `*.example` profiles are tracked and contain no credentials.
- Repository text must be scanned for private key, bearer token, password assignment, and Firebase service-account material before approval.
- `firebase.json` and `.firebaserc` must not contain a local command that defaults to the production project.

## Result record

Final local validation completed with no remote Firebase target:

| Check | Result |
| --- | --- |
| Node 20.20.2 / npm 10.8.2 | Available; used for Functions dependencies and Emulator Suite |
| Java 21.0.12 LTS | Available; used by Database and Storage emulators |
| Firebase CLI 15.20.0 | Available |
| Functions dependencies | `npm ci --prefix functions` completed without lockfile changes |
| Static checks | All 140 repository JavaScript and MJS files passed `node --check`; the three new development modules are included |
| Foundation test | `tests/development-infrastructure.test.mjs` passed |
| Profile validation | Local profile and Firebase emulator configuration valid |
| Emulator smoke | Passed with local HTTP responses: RTDB 401, Auth 405, Storage 403, Functions 404 |
| Start, stop, and clear commands | Background suite started, Auth responded, managed stop succeeded, and guarded clear touched only `.local/` |
| Full regression suite | 51/51 test files passed with Node 24.16.0 |
| Diff checks | `git diff --check` and `git diff --cached --check` passed |

The Node 20 full-suite attempt stops at the existing `public-live-feed-integration` import of `node:module.registerHooks`; Node 20 does not provide that API. This is captured as a runtime-harmonization risk and does not affect the Node 20 Functions Emulator smoke validation.

Staging IAM validation remains intentionally pending until a separate project and approved access exist.

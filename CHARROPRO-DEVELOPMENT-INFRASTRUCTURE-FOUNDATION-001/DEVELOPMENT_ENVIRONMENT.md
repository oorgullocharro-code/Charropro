# Development Environment

## Profile model

| Profile | Configuration file | Firebase target | Intended use |
| --- | --- | --- | --- |
| Local | `.env.local` | `demo-charropro-local` plus emulators | Development and automated integration tests |
| Staging | `.env.staging` | Administrator-provisioned isolated project | Release candidate validation |
| Production | `.env.production` | Authorized production project only | Controlled release process |

Copied profiles are ignored by Git. The versioned `*.example` files are intentionally redacted and must remain credential-free.

## Safe environment selection

The foundation reads an explicit `CHARROPRO_ENV` and `FIREBASE_PROJECT_ID`. It never falls back from Local or Staging to the production alias.

- `local` must use exactly `demo-charropro-local` and emulators.
- `staging` must use an independently provisioned project ID and remote URLs supplied through an ignored profile or a secure CI secret store.
- `production` is an explicit release-only profile. It is not selected by `.firebaserc` defaults and requires a separately authorized release workflow.

Validate any profile before use:

```sh
node tools/development/charropro-development.mjs validate --env-file .env.local
```

## Source switching boundary

The scripts and Functions test tooling can move between the three profiles without source edits because the project and endpoint selection is profile-driven. The browser application is intentionally outside this ticket: its current Firebase bootstrap does not yet consume the emulator hosts from these profiles. The future browser-runtime configuration ticket must preserve the same profile contract and prohibit implicit production fallbacks.

## Local data policy

Local Emulator Suite data resides beneath `.local/`, which is ignored. It can contain fixture accounts and test data, never production exports or client information. Use the guarded clear command before sharing a workspace or beginning a clean test cycle.

## Runtime selection

Use Node 20 for `npm ci --prefix functions`, Functions Emulator, and the development command. Use Node 24 for the full repository test suite, which currently imports `node:module.registerHooks`. The two requirements are intentional until a separately scoped test-runtime harmonization effort is approved; do not change the Functions engine merely to satisfy a test runner.

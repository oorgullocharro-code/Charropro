# Emulator Configuration

## Services

| Service | Port | Role |
| --- | ---: | --- |
| Authentication | 9099 | Local accounts and auth flow tests |
| Realtime Database | 9000 | Local rules and data-path validation |
| Functions | 5001 | Local callable and trigger testing |
| Storage | 9199 | Local asset and permission-path tests |
| Emulator UI | 4000 | Local inspection only |
| Emulator Hub | 4400 | Suite coordination |
| Logging | 4500 | Local emulator diagnostics |

The configuration lives in `firebase.json`. It uses `singleProjectMode` and the local-only project ID `demo-charropro-local`; no command in this foundation uses the production alias.

## Storage default

`storage.rules` denies reads and writes by default. It exists to ensure a fresh local Storage emulator does not silently start with permissive rules. It is not a modification to production rules and this ticket does not deploy it.

## Commands

```sh
# Validate profile and static emulator configuration.
node tools/development/charropro-development.mjs validate --env-file .env.local

# Foreground suite. Stop with Ctrl+C.
node tools/development/charropro-development.mjs emulators:start --env-file .env.local

# Fresh start and non-writing endpoint smoke validation.
node tools/development/charropro-development.mjs emulators:smoke --env-file .env.local

# Remove only ignored local export data.
node tools/development/charropro-development.mjs emulators:clear --confirm
```

The smoke script only requests emulator endpoints. A Database or Storage permission-denied response is acceptable proof that the local server and closed rules responded; it never bypasses rules or performs a remote write.

## Functions dependencies

Run `npm ci --prefix functions` with Node 20 before starting Functions Emulator. `functions/node_modules` is ignored and no package lock change is expected from `npm ci`.

## Stop and diagnostics

Foreground execution stops with `Ctrl+C`. A suite started with `--background` can be stopped using the corresponding `emulators:stop` command. The Emulator UI is available only on `http://127.0.0.1:4000` while the suite is running.

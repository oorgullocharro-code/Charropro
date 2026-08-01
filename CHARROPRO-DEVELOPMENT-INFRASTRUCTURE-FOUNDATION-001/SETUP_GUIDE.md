# Setup Guide

## Supported baseline

| Tool | Required baseline | Purpose |
| --- | --- | --- |
| Node.js 20 LTS | Required | Functions Emulator and locked Functions dependencies |
| Node.js 24 LTS | Required by current tests | Complete repository test suite (`node:module.registerHooks`) |
| npm | Included with the selected Node runtime | Install Functions dependencies |
| Java | 21 LTS | Firebase Emulator Suite |
| Firebase CLI | 15 or newer | Emulator Suite and future controlled deploys |
| Git | 2.40 or newer | Source control |
| gcloud CLI | Before staging IAM work | Google Cloud project and IAM validation |

Node 20 is required for Functions because `functions/package.json` declares Node 20. Node 24 is also required until the existing full test suite stops relying on `node:module.registerHooks`, which Node 20 does not expose. A version manager such as nvm, fnm, Volta, or asdf is recommended so each command runs with its declared runtime.

## New computer setup

1. Clone the authorized repository and enter its root.
2. Install Node 20 LTS, Node 24 LTS, Java 21 LTS, Firebase CLI, and Git with the platform's trusted package manager or official installer.
3. Verify the tools:

   ```sh
   node tools/development/charropro-development.mjs versions
   ```

4. Select Node 20, then install the locked Functions dependencies:

   ```sh
   npm ci --prefix functions
   ```

5. Create the ignored local profile:

   ```sh
   cp .env.local.example .env.local
   ```

6. Validate the profile and Firebase configuration:

   ```sh
   node tools/development/charropro-development.mjs validate --env-file .env.local
   ```

7. Run the isolated emulator smoke test:

   ```sh
   node tools/development/charropro-development.mjs emulators:smoke --env-file .env.local
   ```

The command must report HTTP responses from Realtime Database, Authentication, Storage, and Functions. It does not call a deployed function and does not use a remote project.

8. Select Node 24 before running the complete repository test suite:

   ```sh
   for test_file in $(find tests -name '*.test.mjs' -type f | sort); do node "$test_file"; done
   ```

## Starting the laboratory

Use a foreground terminal during development:

```sh
node tools/development/charropro-development.mjs emulators:start --env-file .env.local
```

Stop it with `Ctrl+C`. For a managed detached process, use `--background`, then stop only that process with:

```sh
node tools/development/charropro-development.mjs emulators:stop
```

Reset only local exported emulator state after an intentional confirmation:

```sh
node tools/development/charropro-development.mjs emulators:clear --confirm
```

This command can remove only `.local/firebase-emulator-data`; it cannot target Firebase projects, databases, buckets, or production data.

## Platform notes

- macOS: install Node and Java from official installers or a supported version manager. Set `JAVA_HOME` to the Java 21 home if the Java launcher is not on `PATH`.
- Windows: use the official Node and Temurin installers, then open a new PowerShell session. Use `node` commands from the repository root.
- Linux: install Node 20 and OpenJDK/Temurin 21 using the distribution-approved method. Ensure `java -version` reports Java 21.

Do not copy `.env.local` between developers. Do not add credentials to environment templates, documentation, source, or Git.

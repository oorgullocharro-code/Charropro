# CharroPro Development Infrastructure Foundation 001

## Purpose

This baseline establishes an isolated, reproducible laboratory for CharroPro development and automated Firebase Emulator Suite validation. It is infrastructure only: no sports, score, portal, broadcast, recovery, configuration-management, or release-management behavior changes are included.

## Delivered foundation

- Node.js 20 LTS baseline for Functions Emulator and Node.js 24 LTS for the current full test suite.
- Java 21 LTS baseline for Firebase emulators.
- Firebase CLI configuration for Authentication, Realtime Database, Functions, Storage, Emulator UI, Hub, and Logging.
- A fixed local Firebase project ID: `demo-charropro-local`.
- Closed-by-default local Storage rules.
- Environment profile templates for local, staging, and production with no credentials.
- Portable Node-based commands for validation, version reporting, emulator startup, local data clearing, and endpoint smoke checks.
- Staging architecture and setup documentation for an administrator-created, isolated Firebase project.

## Isolation guarantees

1. `.firebaserc` no longer exposes a `default` alias pointing to production. Production retains only its explicit `production` alias.
2. Local emulator commands require `CHARROPRO_ENV=local` and the exact `demo-charropro-local` project ID.
3. Emulator state is retained only under ignored `.local/firebase-emulator-data`.
4. No Firebase deployment, remote write, project creation, or production read was performed.
5. All environment files containing real values are ignored; only redacted templates are versioned.

## Important boundary

The current browser bootstrap intentionally has no Firebase Emulator connector and currently validates a remote HTTPS database URL. This ticket does not alter product code, so the reusable infrastructure can test Functions and Firebase services locally, but it does not claim that the browser product automatically connects to emulators yet. A future, separately approved runtime-configuration integration is required before browser sessions can switch to local emulators without changing source.

## External follow-up

An administrator must provision and authorize an isolated staging Firebase project before staging IAM and release validation can occur. `gcloud` is therefore a staging prerequisite, not a requirement to operate the local laboratory.

The product's existing `public-live-feed-integration` test uses `node:module.registerHooks`, which is not available in Node 20. Functions remain pinned to Node 20, while the complete repository suite must currently run under Node 24. This is documented tooling compatibility, not a behavior change made by this ticket.

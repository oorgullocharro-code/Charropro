# Remote Rules Evidence

## Direct Read

`firebaserules.googleapis.com` returned HTTP 403 for the locally configured account. No IAM change, impersonation, alternate credential, or Rules mutation was attempted.

## Alternative Evidence

- Level: `RELEASE_METADATA_VERIFIED`.
- Last certified Rules release source: `35d708b7d74293e61856aa8840c514ebc897a2ab`.
- V2 Rules SHA-256: `d8d2f9b85c6a3de9382125e7f865211cd12f542952bc5855839a9d8893378479`.
- That release was the controlled public-ranking Rules deployment, with the remote Rules verified against its certified local artifact.
- The V3 candidate is the next Rules change and has not been deployed.
- Read-only production inspection found only legacy snapshots: four with `schemaVersion: 2` and two without a schema marker. No V3 materialization was created or forced.

## Decision

Current remote schema is inferred as V2 with release-metadata confidence sufficient for a controlled Rules-first deploy. Direct remote Rules read remains unavailable and should be recorded again during the coordinated deploy rather than bypassed.

The new V3 Rules artifact SHA-256 is `97805aaf18f2af97539842478a36b7e424ca361c3287a03f9f25bf908bb5c722` and has passed the V3 Emulator Rules suite.

# Deployment Decision

## Firebase

Deploy exactly the ten existing production Gen2 Functions listed in `SUMMARY.md`.
Do not use the package deploy script because it includes seven source exports that
are intentionally absent from Production.

- Old runtime: `nodejs20`.
- New runtime: `nodejs22`.
- RTDB Rules deploy: NO.
- Generation migration: NO.
- Function creation, deletion, or rename: NO.

## Client

The repository's canonical build authority propagates one build identity across
client modules. Therefore the immutable client package for
`20260831-firebase-functions-node22-runtime-migration-001-v1` must be deployed
through the existing Hostinger terminal workflow after the Functions deploy.

No client behavior changed; this is cache/build identity only.

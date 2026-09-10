# Deployment Decision

Deploy only the static CharroPro client after commit and normal push.

The client needs a new cache identity because browser entrypoints import
`firebaseSync.js`; serving an older cached module would preserve the rejected
pre-claim write.

Do not deploy:

- RTDB Rules
- Firebase Functions
- configuration through a Firebase write
- any recovery, reconciliation, reproject, backfill, or score action

Post-deploy verification is limited to build/cache coherence, HTTP/browser
smoke, and a rollback dry-run. Do not press `Reintentar` until a separate
controlled-recovery authorization is received.

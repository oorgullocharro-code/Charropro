# Production Storage Validation

## Observed failure

- `BACKUP_STAGE=OBJECT_WRITE`
- `BACKUP_ERROR_CODE=404`
- Effective bucket: the configured CharroPro Firebase default bucket.
- Existing failed jobs had no `storageRef`, confirming failure before metadata
  and archive validation.

IAM was not the blocker: the deployed backup worker service account retained
its existing project role. The configured bucket itself was absent because the
Cloud Storage for Firebase API had never been enabled.

## Non-destructive validation

After canonical bucket provisioning, the already deployed backup worker was
triggered with an isolated organization-scoped diagnostic job containing no
tournaments.

- Worker status: `COMPLETED`.
- Attempts: `1`.
- Object size: `1626` bytes.
- Object write: PASS.
- Metadata/read-back: PASS.
- Local SHA-256 equals the archive checksum recorded by the worker: PASS.
- Backup audit operations requested/started/validated/completed: PASS.

The diagnostic object and its isolated control, catalog and audit records were
then removed. Read-back confirmed that all diagnostic records and the object
were absent. Production tournament writes and deletes were zero.

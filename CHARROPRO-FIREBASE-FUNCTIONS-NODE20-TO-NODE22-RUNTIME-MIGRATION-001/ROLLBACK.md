# Rollback

## Runtime

- Rollback runtime: `nodejs20`.
- Known pre-migration commit: `83316cc1d336589e04cf57bfa72a09fdeb7b7049`.
- Revert the migration commit without rewriting history.
- Reinstall from the restored lockfile with Node 20.
- Redeploy the same ten production Functions explicitly.
- Verify all ten remain Gen2, ACTIVE, and report `nodejs20`.

## Client

Use the remote Hostinger backup created immediately before client deployment and
the existing terminal rollback script. Verify the previous build and checksum
after restoration.

No rollback step deploys RTDB Rules or mutates production sports data.

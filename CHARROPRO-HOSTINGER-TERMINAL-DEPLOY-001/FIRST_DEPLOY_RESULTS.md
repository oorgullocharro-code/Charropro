# First Deploy Results

## Result

- SSH/SCP connection: PASS.
- Remote path: `/home/u168671926/domains/orgullocharro.com/public_html/charropro`.
- Initial inventory: 832 files; 676 were outside the immutable client package.
- Package verification: PASS, 156 files.
- Package SHA-256: `8793240b1d986e23fafb9e828907ef2e477726f02fd796776a1ee68b93aba237`.
- Backup: `/home/u168671926/domains/orgullocharro.com/public_html/charropro-backup-20260824-183404-pre-8f977b5.zip`.
- Backup size: 15,392,098 bytes.
- Backup SHA-256: `5afe6c31b4d73610e89b99df61dab262e2076558a325261bce28e0fa5e56ac8e`.
- Remote package SHA-256: PASS.
- Release staging: `/home/u168671926/.charropro-deploy/releases/20260824-cache-buster-single-authority-001-v1-8f977b5-20260824-183404`.
- Overlay deploy without deletion: PASS.
- Remote build: `20260824-cache-buster-single-authority-001-v1`.
- Remote checksum: `343b9b8c4780e5d948c095d07fe3c28859135b2c971e9012b4634ae7cea024be`.
- HTTP build/checksum: PASS.
- Index, Formato Federacion, Portal, Broadcast and Cronometro HTTP smoke: PASS.
- Rollback dry-run against the real backup: PASS.
- Deploy lock cleanup: PASS.
- Headless smoke: not executed because Playwright is not installed locally.

## Controlled retry

The first attempt stopped before `rsync` because the remote shell did not expose `/dev/fd` for process substitution. Production remained unchanged, the lock was released and the configuration stayed valid. Commit `7c2bfcd889dbc9f16ba93376b2e5bac6a43f1ad3` replaced that construct and the controlled retry passed.

## Hosting observation

Before the successful overlay, the inventory increased to 850 files. Read-only verification showed the remote repository at detached HEAD `7c2bfcd889dbc9f16ba93376b2e5bac6a43f1ad3` with clean status, confirming an existing Hostinger Git synchronization after push.

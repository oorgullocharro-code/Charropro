# Backup And Rollback

Every deploy creates a complete ZIP of the active `charropro/` directory in its parent `public_html/` directory. Size and remote SHA-256 are recorded.

`rollback-client.sh` validates that the backup belongs to the expected parent, verifies ZIP integrity, preserves the failed release, extracts to staging and restores the complete snapshot with `rsync --delete`.

Production rollback is automatic only after an unequivocal critical post-replacement failure. A successful deploy is validated with rollback `--dry-run`; no destructive rollback test is performed.

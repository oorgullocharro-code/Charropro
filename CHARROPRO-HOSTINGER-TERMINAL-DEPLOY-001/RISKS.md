# Risks

- The remote directory contains 676 files outside the immutable client package, including historical documentation, tests, tools and `.git` metadata.
- Inventory classification: package paths are `EXPECTED_RUNTIME`; ticket documentation/evidence are `HISTORICAL`; tests/tools/repository metadata are `OLD_RUNTIME` or `UNKNOWN` pending dedicated cleanup; no extra is deleted here.
- The first automated deploy therefore uses overlay mode without deletion.
- Public exposure of repository metadata is a separate security debt and must be addressed through a dedicated cleanup ticket after backup and hosting-rule review.
- Headless browser tooling is not assumed; HTTP smoke remains mandatory.
- A stale remote lock older than four hours is preserved under a timestamped name before a new lock is acquired.

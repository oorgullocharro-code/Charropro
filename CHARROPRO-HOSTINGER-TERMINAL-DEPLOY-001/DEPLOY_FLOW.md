# Deploy Flow

1. Validate package locally.
2. Validate SHA-256, build, checksum, shape and forbidden content.
3. Acquire local and remote deploy locks.
4. Inventory the active remote directory.
5. Create a complete backup outside `charropro/`.
6. Upload the immutable ZIP to `~/.charropro-deploy/uploads/`.
7. Verify remote SHA and extract to a unique release directory.
8. Validate release build, checksum and file count.
9. Overlay release files with `rsync -a` without `--delete`.
10. Validate remote configuration and public HTTP entrypoints.
11. Write ignored local deploy log and manifest.
12. Release locks.

The script never rebuilds the package.

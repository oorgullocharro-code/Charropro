# Deployment decision

Deploy target: client only.

- RTDB Rules deploy: NO.
- Functions deploy: NO.
- Profile or lifecycle deploy: NO.
- Production data write, backfill, Recovery, or reproject: NO.

Publication requires the canonical client build identity, immutable package verification, remote client backup, HTTP/cache/browser smoke, and rollback dry-run. The physical Manganas capture sequence remains a post-deploy validation on a controlled TEST tournament; no official score will be invented for deployment verification.

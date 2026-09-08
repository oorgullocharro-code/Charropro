# Validation

Synthetic incident uses the three known record IDs with a synthetic tournament/charreada/team, three active Pial de Ruedo values of 21, operational PR 21, and frozen legacy public PR 63 / total 235. Canonical source totals derive 193 from 31 + 38 + 68 + 20 + 15 + 21. No production record is seeded or written.

Unit/regression coverage: two and three duplicates; equal scoring; unequal values blocked; missing shared identity; cross-tournament paths/identity; incompatible ledger; missing chronology; active supervisor; judge/operator/reader denial; inactive/auth/access denial; stale source and tampered plan; missing/corrupt/foreign backup; retry conflict; scoped delta guard; preservation of prior historical records, audit, scores, timestamps, frozen Attempt V2 and request evidence; legitimate judge correction after reconciliation; canonical/public/ranking/Portal/Federation numeric parity; stable reload/reprojection; backup storage failure.

Emulator: demo-charropro-local only, Auth + Functions + RTDB + Storage, Node 22.23.2. Exercises authenticated callable, read-only dry-run, backup create/download/verify, post-backup dry-run, stale-state conflict with no writes, concurrent execute requests (one commit, one idempotent receipt), readback, reload, repeated execute and two explicit reprojections. Compares control tournament/private and public signatures, score arrays and full persisted root on stable retries.

Outcome: one current head, two newly historical heads; canonical/internal/public PR 21 and total 193. No new sporting revision; administrative audit distinct from sporting audit. Numeric Federation/Portal adapters are tested; no new browser UI is introduced or separately certified in this tooling ticket.

The full-suite default run skips the explicitly gated new emulator test; that test is run separately against the actual local emulators. Exact runner totals and command output accompany the delivery report.

Production writes: 0. Deploy: NO. Rules and client changes: 0. After explicit authorization, the allowlist was expanded from 10 to 11 and targeted deployment support was certified separately; the reconciliation Emulator was not repeated. See DEPLOYMENT.md.

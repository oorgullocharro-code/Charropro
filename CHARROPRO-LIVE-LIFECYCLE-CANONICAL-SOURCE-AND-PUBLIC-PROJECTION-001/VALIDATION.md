# Validation

Directed lifecycle and Portal V3 regressions passed locally:

```text
53/53 PASS
```

Covered cases include:

- New tournament with no active charreada: `PRE_EVENT`.
- Active program charreada with no score, zero score, or positive score: `LIVE`.
- Results alone and unknown active IDs: never infer `LIVE`.
- Explicit `PAUSED`, `FINALIZED`, and `ARCHIVED` precedence.
- Multi-charreada safety, reload reconstruction, Browser/Functions V3 parity, and Portal V2 presentation-only behavior.

The canonical client build is `20260909-live-lifecycle-canonical-source-001-v1`.

Full suite: `301 PASS`, `1 SKIPPED`, `0 FAIL` across 302 tests.

Static gates: `node --check 332/332`, JSON `57/57`, `git diff --check`, secret scan, debugger scan, and runtime-console addition scan all pass.

No production reads or writes were performed. Deployment is intentionally excluded.

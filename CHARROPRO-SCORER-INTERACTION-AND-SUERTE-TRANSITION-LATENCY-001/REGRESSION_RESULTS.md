# Regression Results

Directed regression coverage includes:

- Duplicate-tap semantics and independent controls.
- Deferred-task coalescing.
- Safe rules-cache reuse and invalidation.
- Scorer integration and Attempt V2.
- Official Score and concurrency.
- FMCH certification and all scorer suertes.
- Official Format HTML/XLSX contracts.
- Portal, Broadcast, Graphics, Timer Authority, Flow Engine, and cache-buster integrity.

Final validation:

- Test suites: `93/93 PASS`.
- Node syntax: `212/212 PASS`.
- JSON parse: `28/28 PASS`.
- `git diff --check`: `PASS`.
- Secret scan: `PASS`.
- Production `debugger` scan: `PASS`.
- Production console scan: `PASS`.
- Historical runtime build scan: `PASS`.
- Protected-file scan: `PASS`.
- Real local browser: `PASS`, one scorer root, no browser errors.
- Firebase Production writes: `0`.

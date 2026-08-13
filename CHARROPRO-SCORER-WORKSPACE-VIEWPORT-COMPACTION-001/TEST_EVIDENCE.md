# Test Evidence

## Local visual validation

The real client was exercised only against the local emulator with synthetic judge credentials and the demo FMCH 2026 tournament. No production project, credentials, scores or Firebase writes were used.

Validated views:

- Piales on a wide viewport: manual concept, points, cancel and add controls occupy a single 64 px form row; the action group remains 44 px high.
- Manganas a Pie wide layout: active operation at left and 345 px vertical Attempt V2 history at right; no horizontal overflow.
- Manganas a Pie state transition: attempt 1 completed, attempt 2 active, attempt 3 pending through existing controls only.
- Manganas a Caballo wide layout: active operation at left and 298 px vertical history at right; no horizontal overflow.
- Narrow viewport: a 487 px effective viewport uses one-column Manganas and stacked manual form with zero horizontal overflow.

The browser capture surface duplicated portions of the rendered bitmap, but DOM snapshots and browser box metrics reported the actual visible nodes, ordering, widths and zero overflow. The visual result was therefore corroborated with semantic DOM and measured layout evidence.

## Automated validation

The ticket-specific test verifies the workspace contract and source boundaries. Existing scorer refinement, hierarchy, rule, attempt, pending, timer and regression suites are re-run before commit.

## Safety checks

`git diff --check`, staged diff checking, JavaScript syntax checking, JSON validation, secret/debugger scans and cache-buster consistency are required before the local commit.

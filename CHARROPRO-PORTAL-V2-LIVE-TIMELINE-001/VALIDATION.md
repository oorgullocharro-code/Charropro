# Validation

## Directed Coverage

- Live Center reads the supplied action and score.
- Current results and standings remain direct V3 values scoped by the supplied current context.
- Timeline shows the public correction `15 → 21` while the resolved current result remains `PR 21` and total `193`.
- Duplicate `eventId` entries render once; unknown types remain safe.
- `PRE_EVENT` has no action or timeline, `PAUSED` retains narrative data, and `FINALIZED` / `ARCHIVED` disable live treatment.
- Stale, duplicate, older revision, and same-revision/different-hash behavior continues through the existing V3 revision guard.
- Source guards confirm no private scoring, ledger, Attempt V2, HTML injection, or sporting recalculation dependencies.

## Presentation

The Live Center uses responsive cards at mobile widths and a two-column desktop composition. The timeline is newest first, has no auto-scroll behavior, and uses no live-region announcements for each individual event. Reduced-motion users retain a static live indicator.

## Boundaries

- Progress tracking by suerte: intentionally unavailable because V3 lacks an explicit public state.
- Rules, Functions, data, profile, scoring, and legacy portal changes: none.
- Production reads/writes: 0/0.

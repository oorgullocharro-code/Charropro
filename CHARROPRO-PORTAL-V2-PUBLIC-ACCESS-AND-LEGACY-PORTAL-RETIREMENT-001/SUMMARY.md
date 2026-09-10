# Portal V2 Public Access And Legacy Retirement

## Scope

The current tournament dashboard and tournament list now construct public URLs through one Portal V2 helper. The general public URL contains only `tournamentId`; it never inherits build, view, operator, scoring, or internal context parameters.

The legacy public entrypoint is retained as a compatibility redirect, not as a second portal implementation.

## Release

- Build authority: `20260910-portal-v2-public-access-and-legacy-portal-retirement-001-v1`.
- Configuration checksum: `f0f055f3cf714888187f0e6bc58c3dfc4c20944f8b0f106b924ac4904fb68107`.
- Legacy links preserve only certified public context (`tournamentId`, optional public competition, optional phase, and a Portal V2 view).
- New general public links and copied links contain only `tournamentId`.

## Non-goals

- No scoring, ranking, Official Score, Canonical Results, or Public Projection V3 changes.
- No Functions, RTDB Rules, recovery, reproject, backfill, or production data writes.
- No physical removal of legacy V1 sources in this ticket.

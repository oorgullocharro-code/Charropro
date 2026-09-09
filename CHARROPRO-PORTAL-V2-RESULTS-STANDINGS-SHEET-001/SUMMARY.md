# CHARROPRO-PORTAL-V2-RESULTS-STANDINGS-SHEET-001

## Scope

Portal V2 now presents Results, Standings, and Sheet from one received Canonical Public Tournament Data V3 snapshot. `torneo-publico.html` remains unchanged and Portal V2 remains a parallel preview.

## Public Data Contract

- `RESULTS_SOURCE=snapshot.results.teams`
- `STANDINGS_SOURCE=snapshot.standings.items`
- `SHEET_SOURCE=snapshot.sheet.competitions`

The presentation model reads resolved columns, subtotal, penalties, totals, status, positions, classifications, and public tie-break labels directly. It does not sum columns, determine standings by score, calculate tie-breaks, select attempts, or read private scoring paths.

## Safety And Lifecycle

- Results, standings, and sheet are checked by result reference and direct values before they render together.
- A mismatch blocks the affected public view instead of choosing an apparent source of truth.
- `0` is displayed as an official zero only when V3 supplies it; an absent column remains unavailable.
- `PRE_EVENT` shows clear empty states; `PAUSED` retains the last resolved data; `FINALIZED` and `ARCHIVED` show a champion only when V3 supplies `position: 1`.
- Multi-competition, charreada, and phase values remain grouped; no cross-group totals are calculated.

## Local Preview

The fixture is local-only and requires both `charroproEnv=local` and a named fixture. It never subscribes to Firebase or writes data.

`http://127.0.0.1:8766/portal-v2.html?tournamentId=portal-v2-local-preview&charroproEnv=local&portalV2Fixture=live`

Available fixture names: `pre-event`, `live`, `paused`, `finalized`, and `archived`.

The LIVE fixture proves `Pial de ruedo = 21` and team total `193` for Rancho Los Laureles.

## Deployment

This ticket prepares a client build only. It does not deploy the client, Functions, Rules, or data, and performs no Firebase production writes.

# Validation

## Directed Coverage

- Results, standings, and sheet show the same direct resolved value for the `PR = 21`, `TOTAL = 193` fixture.
- Supplied standing positions are preserved even when a supplied total changes.
- Official zero differs from an absent, unscored column.
- Multiple competition groups remain distinct.
- `PRE_EVENT`, `LIVE`, `PAUSED`, `FINALIZED`, and `ARCHIVED` preserve their specified public behavior.
- A mismatched sheet/result snapshot fails closed.
- Disabled modules are hidden and a local preview query persists during Portal V2 navigation.
- Static guards reject private scoring dependencies and score-recalculation paths.

## Responsive And Accessible Structure

Results use responsive cards. Standings and Sheet use semantic tables with captions and scoped headers inside controlled horizontal-scroll containers for narrow screens. No values use ellipsis or clipping.

## Boundaries

- Sporting recalculation: no.
- Public score, ledger, and Attempt V2 reads: no.
- Legacy portal change: no.
- Production reads/writes: 0/0.
- Rules, Functions, and Firebase data changes: no.

# Teams, Participants, and Horses Canonical Separation

## Canonical Registries

- `state.teams` stores only team registrations.
- `state.participants` stores individual tournament registrations with
  `participantName`, `horseId`, and an optional future-facing `charroId`.
- `state.horses` stores horse identity with `displayName` and optional registry
  metadata. `AQHA` is accepted but never required.

## References

Team charreadas retain ordered `teamIds`. Coleadero and Caladero retain ordered
`participantIds`; the scorer resolves a participant and then its horse from the
two canonical registries. No participant is read from `state.teams`, and no
individual lot embeds participant or horse objects.

## Public Projection V3

The browser and Functions V3 builders resolve individual program names and horse
labels from `participants` and `horses`. They keep team entries separate and do
not recalculate sporting values.

## Compatibility Decision

Existing tournaments are TEST data. There is no migration and no permanent
legacy adapter from team records or embedded `horseName` values.

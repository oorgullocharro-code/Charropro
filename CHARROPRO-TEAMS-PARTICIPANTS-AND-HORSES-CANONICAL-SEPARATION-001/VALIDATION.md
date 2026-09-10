# Validation

## Directed Coverage

- Team registration remains only in `teams`.
- Coleadero and Caladero resolve ordered `participantIds`.
- One charro may have distinct participant and horse identities.
- Equal horse display names do not deduplicate identities.
- AQHA metadata and no-formal-registry horses both remain valid.
- The scorer resolves the participant and horse from canonical registries.
- Browser and Functions V3 projections preserve the same participant and horse
  program data without an artificial team.
- Tournament state synchronization persists separate `participants` and
  `horses` collections.

## Non-goals

No sporting values, RuleIDs, FieldIDs, scoring, ranking, Official Score,
Recovery, Rules, Functions deployment, migration, or production data changed.

## Regression Gate

- Directed registry, V3 contract, browser/Functions parity, canonical-results,
  and Portal V2 navigation tests pass.
- Full suite: `184/184` pass with the coordinated local Auth, RTDB, Functions,
  and Storage Emulators active.
- Node syntax: `355/355` pass. JSON validation: `98/98` pass.
- Diff, diff-secret, and debugger scans pass.

# Validation

## Directed Tests

- Portal V2 Foundation/Lifecycle
- Results/Standings/Sheet parity
- Live/Timeline behavior
- Navigation, Program, phase, competition, deep-link, and privacy context coverage
- Browser/Function Canonical Public Projection V3 parity

The focused suite verifies 27 assertions including the certified `PR=21`, `TOTAL=193`, absence of stale `63` as current PR, multi-phase presentation from labels supplied by V3, deep-link refresh, invalid phase fail-closed behavior, and no phase inference.

## Acceptance Matrix

- `MAIN_NAVIGATION=PASS`
- `PROGRAM=PASS`
- `PHASE_MODEL_REUSED=YES`
- `NEW_PHASE_AUTHORITY_CREATED=NO`
- `MULTIPHASE_PRESENTATION=PASS when V3 supplies phaseId + phaseName`
- `MULTICOMPETITION_PRESENTATION=PASS when V3 supplies competitionId + name`
- `LIVE_CONTAINS_TIMELINE=YES`
- `TIMELINE_MAIN_NAV_ITEM=NO`
- `RESULTS_CANONICAL=YES`
- `STANDINGS_CANONICAL=YES`
- `SHEET_CANONICAL=YES`
- `SPORTING_RECALCULATION=NO`
- `PRIVATE_DATA_EXPOSURE=0`
- `PORTAL_LEGACY_PRESERVED=YES`

## Known Source Gaps

No authoritative V3 `currentPhase` field exists, so Portal V2 does not highlight an inferred current phase. A live tournament projecting `PRE_EVENT` must be corrected at the `liveCurrent` / tournament lifecycle source. An empty V3 timeline with published scores must be corrected by a public narrative event producer. Neither gap was implemented here.

# Motor Sports Analysis

## Captures
Attempts contain base, adic, infr, punta values, tiempo, applied rules, custom items, team penalties and flags. Coleadero uses nested collections; rosters are separate team data.

## Calculates
calculateAttemptTotal() uses base + adic + puntaPts - infr. Current suerte and charreada totals aggregate collections, penalties and restas. Cala punta is calculated from meters/piquetes.

## Persists
Current scores persist in tournament score nodes. Official publication creates one active transactional record per attempt with historical replacements, revision, actor/device and audit.

## Does not prove
The motor does not own a 239-field FMCH document snapshot, fixed official cells for applied rules, four-row Coleadero, complete roster/header history, signatures or certified closing formulas.

## Capability separation
Calculation exists. Current persistence exists. Per-attempt official history exists. Exact historical FMCH document reproduction is not demonstrated.

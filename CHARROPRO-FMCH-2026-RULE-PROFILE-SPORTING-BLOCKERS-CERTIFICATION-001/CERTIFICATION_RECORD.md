# Certification Record

## Profile

- Profile ID: `FMCH_2026_LIBRE`
- Version: `0.6.0`
- Status before and after: `draft`
- `activationReady` before and after: `false`
- Activation-ready eligibility after certification: `true`
- Catalog rules: `731`
- Suertes: `10`
- Content fingerprint before: `rptp_a9988543eb21259f`
- Content fingerprint after: `rptp_0f90f7a3944a82d7`
- Fingerprint builder: `buildRuleProfileContentFingerprint()` in `js/data/ruleProfileTemporalPolicy.js`

The profile fingerprint changed because certification metadata and FieldID mappings changed. The effective sporting fingerprints for all ten suertes remain unchanged, proving that scores, penalties, bonuses, timers, opportunities, participant counts and sporting values were preserved.

## Source validation

- Official rulebook SHA-256: `1343e2205c7b6599a2ab7e93a809a5a45bd5ab1aadaba2f5a25bf43db8b4af2b`
- Official team sheet SHA-256: `3a14fe3d6add5add76033765b27227c44f04c8e31330ce4aeb3248828701dca7`
- FieldID review: `239/239`
- Confirmed sporting criterion: one canonical Contra mascara identity at 14 points.
- Required P0 gaps resolved: `5/5`

## Blocker result

- Cala `ML/MD/MI`: `RESOLVED_BY_OFFICIAL_SOURCE`. `ML` is the scorer group; `MD` and `MI` map to the existing right and left medio lado rules.
- Cala `CR/PC`: `RESOLVED_BY_OFFICIAL_SOURCE`. `PC` is a printed-sheet alias for the existing cambio de rectangulo rule.
- Cala side bad-points sum: `TECHNICAL_CONTROL_ONLY`, with no scoring effect.
- Coleadero: `RESOLVED_BY_OFFICIAL_SOURCE`. The canonical model remains three active coleadores with three opportunities each; the fourth row and bottom control are non-sporting administrative controls.
- Contra mascara: `RESOLVED_BY_CONFIRMED_SPORTING_CRITERION`. Exactly one RuleID remains at 14 points and simultaneous duplicate selection is prohibited.
- Sporting modifications made by this ticket: `NO`.

## P0 closure

- SCQ-002 Cala: resolved by Art. 94 and the printed team-sheet structure.
- SCQ-004 Coleadero: resolved by Arts. 113-115 and 121; three active coleadores preserved.
- SCQ-006 Terna: resolved by Arts. 149-155 and the official team sheet; three charros and five shared opportunities preserved.
- SCQ-011 Closing: resolved by the official sheet closing controls and section-specific scoring rules. Exact print/export order remains non-blocking.
- SCQ-012 Signatures: resolved by Arts. 11, 14 and 26. Missing captain signature represents conformity under the stated conditions and does not invalidate the sporting result.

## Non-blocking documentation gaps

1. Exact printable formula and presentation order for the Cala side subtotal.
2. Exact administrative purpose of the fourth Coleadero name row.
3. Exact administrative purpose of the fourth Coleadero bottom control.
4. Exact export annotations and ordering for closing/signature controls.

## Verdict

`PASS`

The profile is eligible for a later controlled lifecycle transition, but this record does not activate it. `status` remains `draft`, `activationReady` remains `false`, and no tournament profile is assigned. Lifecycle and assignment authority remain separate future tickets.

# Manganas FMCH time, remate and practical capture

Base: `129d66f84f60d1c3abbbcc19942119f70c737d54`

## Corrected authority

- The time bonus belongs to one complete Manganas faena, never to an individual opportunity.
- One canonical settlement is stored on opportunity 3 and owns the single official timer quantity for the faena.
- Applying the same timer evidence again replaces the same settlement deterministically.
- New Official Score records reject malformed or duplicated time settlements.
- A successful new-schema opportunity requires a structured technical remate identity, even when it adds zero points.
- Documentary floreo detail and the practical manual additional total are separate authorities and are not summed twice.
- The scorer exposes the technical remate as its own visible block. Pie provides quick documentary shortcuts plus an open custom technical capture path; neither path replaces Desden, Contra desden, Encontrada, floreo, manual additions, or time.
- Legacy Attempts remain readable as frozen historical evidence. No backfill, recalculation, Recovery, or reproject was performed.

## Certified example

`10 + 10 + 10 + 3 = 33`, with exactly one time settlement and total time bonus `3`.

The eligibility matrix is `0 successes -> 0`; `1`, `2`, or `3` successes with three complete unused minutes -> `+3` once.

## Minute seven

The existing official timer remains unchanged. The scorer now stores distinct `PLACED` and `DOWN` evidence from that timer. The minute-seven consequence is applied only when both records refer to the same timer, placement occurs from minute 6 through minute 7, the down follows placement, and the opportunity is achieved. A down timestamp alone does not infer placement.

## Scope

Client scoring/domain code and tests only. Public V3, Portal V2, Graphics, ranking, sheets, RTDB Rules, Functions runtime, profiles, fingerprints, lifecycle, and every non-Manganas suerte remain unchanged.

The first physical review found that the technical remate and scoring-effects sections occupied the same classic-layout grid area. The later section visually covered the former. The closeout corrects the layout ownership and adds a regression that requires distinct `technical` and `effects` areas.

The next physical review reached publication but exposed a sparse-draft normalization defect: a not-achieved opportunity may omit optional `applied` and `ruleQuantities` collections, while faena settlement assumed both existed. The owner boundary now normalizes those collections before removing a previous settlement. The exact Rodada + Bigotona + not-achieved flow publishes and advances Pie to Caballo locally; no remate is invented for the not-achieved opportunity.

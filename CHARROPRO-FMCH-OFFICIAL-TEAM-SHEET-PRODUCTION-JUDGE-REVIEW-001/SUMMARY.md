# FMCH Official Team Sheet - Production Judge Review

## Technical status

- Document profile: `FMCH_TEAM_SHEET_2024_2028 1.0.0`.
- Sporting profile: `FMCH_2026_LIBRE 0.6.0` (`ACTIVE`).
- Fingerprint: `rptp_0f90f7a3944a82d7`.
- FieldID: `239/239`.
- Missing source data: `0` for the certification fixtures.
- Semantic mismatch: `0`.
- Sporting blockers: `0`.
- Sporting values modified: `NO`.
- FMCH Rule Profile modified: `NO`.

The exporter follows `Attempt V2 -> Official Score -> Official Format Snapshot -> XLSX -> PDF`. It does not read mutable scorer state or recalculate sporting rules. The technically certified result remains subject to review by a certified judge and must never be described as institutional FMCH approval.

## Certified controls

- Eight `T` fields use their own frozen sporting evidence; `T` is never derived from elapsed time during export.
- `TERMINADO EN` remains chronological evidence and is separate from `T` points.
- Cala exposes `P`, `T` and the documentary bad-point codes `AH`, `D` and `R` without modifying `FMCH_2026_LIBRE`.
- Judge controls preserve `previous + current = new` across the eight official control rows.
- The mandatory `5 + 4 = 9` bad-points control is documentary only and does not discount the score again.
- Toro and Yegua preserve individual additions, bad points, team infractions and their exact `T` values without duplicate mappings.

## Release build

- Build: `20260822-fmch-official-team-sheet-judge-review-001-v1`.
- Product references to the prior build: `0`.
- Product references to the release build: `57`.
- Configuration checksum/fingerprint: `f381ac2068e8f1e46aba8806611d32b09964371946af2fbacc5141dbc745f480`.

## Classification

- Technical: `TECHNICALLY_CERTIFIED` after all automated and visual gates pass.
- Human: `PENDING_CERTIFIED_JUDGE_REVIEW`.
- Institutional: `NOT_CLAIMED`.

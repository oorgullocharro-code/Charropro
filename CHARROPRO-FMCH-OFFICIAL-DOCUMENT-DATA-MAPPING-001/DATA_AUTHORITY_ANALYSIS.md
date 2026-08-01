# Data Authority Analysis

1. Browser/UI state is operational capture, not final authority.
2. Tournament score node is current mutable state.
3. Server callable transaction and officialScoreLedger are authoritative for one official attempt.
4. officialScoreAudit and audit/publishedScores are audit evidence, not signature artifacts.
5. public/live projections are consumers, not FMCH document authority.
6. officialFormat is a present-state formatter, not a canonical historical document source.

The missing authority is an immutable full-team official-document revision that explicitly references approved field sources and rule versions.

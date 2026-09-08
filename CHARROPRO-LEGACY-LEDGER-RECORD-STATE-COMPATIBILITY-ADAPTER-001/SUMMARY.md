# Summary

Ticket: `CHARROPRO-LEGACY-LEDGER-RECORD-STATE-COMPATIBILITY-ADAPTER-001`

Entry commit: `d88cbbbda3ee576d367fe33a8e401fbcf613f574`.

Reconciliation build: `20260908-legacy-ledger-record-state-compatibility-adapter-001-v1`.

The reconciliation authority now uses an explicit fail-closed adapter when a published score and its ledger copy are not byte-identical. Exact matches remain accepted. The only additional accepted representation is the demonstrated historical asymmetry where all sporting, identity, revision, supersession, and unknown metadata are identical, both copies are superseded by the same existing successor, and the ledger authority identifies that successor as the only current record.

The official score writer now persists `status=historical` and `officialStatus=historical` symmetrically in both `publishedScores` and `officialScoreLedger.records` for every superseded record. No historical data is migrated by this change.

The reconciler dry-run exposes `legacyCompatibilityApplied`, `legacyCompatibleRecordIds`, and `compatibilityReason`. It does not make the legacy value current or count it in canonical totals.

Production access, authentication, writes, backup, reconciliation, reprojection, and deploy were not performed.

No client artifact or cache-buster changed because this ticket modifies server-side Functions code, pure fixtures, tests, and documentation only.

Final certification target: `LEGACY_LEDGER_STATE_COMPATIBILITY_ADAPTER_CERTIFIED_PENDING_TARGETED_DEPLOY`.

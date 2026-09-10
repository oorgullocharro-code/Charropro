# Files Changed

## Functional

- `functions/canonicalPublicTimelineEvent.js`: canonical public narrative
  event producer and allowlist normalizer.
- `functions/officialScoreConcurrency.js`: attaches the event only after
  official acceptance and delivers it through the existing fanout multipath
  update.
- `js/public/canonicalPublicProjectionV3.js`: transports stored timeline input
  from the canonical tournament source.
- `js/public/canonicalPublicTournamentData.js`: preserves the allowlisted
  public timeline context.
- `functions/reconciliationShared/`: generated Browser/Functions mirror,
  verified by the canonical packaging tool.
- `tests/public-timeline-canonical-event-producer.test.mjs`: accepted,
  rejected, retry, zero, negative, correction, privacy, and no-backfill
  coverage.
- `tests/public-projection-v3-function-parity.test.mjs`: public timeline
  Browser/Functions parity coverage.

## Mechanical Build Scope

- `functions/configuration.defaults.json`: canonical build identity and
  checksum.
- Client, fixtures, and tests: import cache keys updated only by
  `tools/release/applyClientBuildVersion.mjs`.
- Build assertions: updated to the same canonical build identity.

No Rule, Function deployment manifest, sporting profile, RuleID, FieldID,
Timer, lifecycle, or Production data file was changed.

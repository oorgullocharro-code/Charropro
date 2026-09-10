# CHARROPRO-PUBLIC-TIMELINE-CANONICAL-EVENT-PRODUCER-001

## Scope

This ticket adds the canonical public narrative event producer after an
official score has been accepted. It does not calculate sports results,
select ledger heads, resolve supersession, rank teams, or write to
Production.

## First Loss

The first divergent layer was the missing producer before Canonical Public
Projection V3. Official publication created the accepted score, ledger,
fanout job, audit record, and Projection Outbox intent, but no `publicTimeline`
event existed for V3 to transport.

## Implemented Flow

`publishCharroProOfficialScore` -> `applyOfficialScoreTransaction` -> accepted
official record -> deterministic public event stored on the fanout job ->
idempotent fanout multipath update -> `publicTimeline` -> Canonical Public
Tournament Data V3 -> Portal V2 Live timeline.

The producer is `functions/canonicalPublicTimelineEvent.js`. Its event ID is
`timeline_<officialRecordId>`. The ordering timestamp is the accepted official
record timestamp. A retry uses the same fanout event and RTDB path, so it cannot
add another timeline event.

## Public Contract

The public allowlist contains only event identity, ordering timestamps,
public competition/phase/charreada/team/participant/suerte context, label,
status/type, score, and correction previous score. UID, email, role, request
IDs, ledger, Attempt V2, RuleIDs, FieldIDs, device data, and idempotency data
are excluded.

For corrections, the accepted record supplies the resolved old and new values.
The timeline may narrate `15 -> 21`; canonical results, V3 results, and Portal
results keep only `21` and the certified total `193`.

## Boundaries

- Official Score remains the sporting authority.
- V3 transports and sanitizes the stored event. It does not reconstruct a
  timeline from `publishedScores`.
- Portal V2 renders, sorts, and deduplicates by `eventId`. It does not compute
  scores.
- Existing fanout jobs without a `publicTimelineEvent` remain unchanged. This
  ticket performs no historical backfill, reproject, reconciliation, or data
  migration.
- No RTDB Rules change is required because the server-side fanout already owns
  the target multipath update.

## Capacity Note

`publicTimeline` is append-only for accepted publications. Portal V2 should use
the current bounded visible timeline window. Retention/pagination for unusually
long multiday events is a separate capacity ticket and must not delete
authoritative score data.

## Production Safety

Production reads: 0.
Production writes: 0.
Deploy: no.

Final status: `PUBLIC_TIMELINE_CANONICAL_EVENT_PRODUCER_CERTIFIED_PENDING_TARGETED_DEPLOY`.

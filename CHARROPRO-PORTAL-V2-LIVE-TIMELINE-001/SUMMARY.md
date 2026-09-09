# CHARROPRO-PORTAL-V2-LIVE-TIMELINE-001

## Scope

Portal V2 now provides a Live Center and a minute-by-minute narrative from the received Canonical Public Tournament Data V3 snapshot. The legacy public portal remains unchanged and Portal V2 remains a parallel preview.

## Public Contract

- `LIVE_DATA_SOURCE=snapshot.live`
- `TIMELINE_DATA_SOURCE=snapshot.timeline.items`
- `LIVE_CONTRACT_FIELDS=status,currentCharreada,currentTeam,currentParticipant,currentSuerte,currentScore,updatedAt`
- `TIMELINE_CONTRACT_FIELDS=eventId,sequence,occurredAt,type,charreadaId,teamId,participantId,suerteId,label,score,previousScore,status`

The presentation consumes direct values only. It cannot calculate a score, select an attempt, apply a correction, calculate a standing, or rebuild results from the timeline.

## Behavior

- The Live Center gives priority to current action, team, participant, suerte, direct score, and update time.
- Timeline is newest first by the supplied `sequence`, deduplicated by supplied `eventId`.
- A correction can narrate `15 → 21 pts`; Results remains the authority for the current `PR = 21` and `TOTAL = 193`.
- `PAUSED` retains the context and timeline without an active indicator. `FINALIZED` and `ARCHIVED` are non-live historical presentations.
- A stale connection retains the last valid narrative and uses a discreet updating state.
- Timeline text is rendered as text, never HTML. Unknown event types use a safe generic presentation.

## Intentional Gap

V3 does not provide an authoritative public progress state by suerte. Portal V2 does not infer it from scores or events. The `currentCharreada` identifier is used only to scope already-resolved Results and Standings; an opaque ID is not shown as public display text.

## Local Preview

Use the existing local-only URL with `portalV2Fixture=live`. The fixture contains three teams, eight public narrative events, and the certified correction history without Firebase reads or writes.

## Deployment

This ticket prepares a client build only. It does not deploy the client, Functions, Rules, or data and makes no Firebase production writes.

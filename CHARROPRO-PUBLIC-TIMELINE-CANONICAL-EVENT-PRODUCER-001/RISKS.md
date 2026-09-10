# Risks

## Mitigated

- Duplicate events: deterministic event ID derived from the accepted official
  record and the same RTDB fanout path make retries overwrite the same event.
- Sports drift: the producer consumes accepted record totals and correction
  metadata only. It performs no scoring or ledger resolution.
- Private disclosure: output is normalized through an explicit public
  allowlist.
- Partial public transport: the timeline event is delivered with the existing
  audit and Projection Outbox fanout multipath update.
- Legacy data reinterpretation: old fanout jobs have no event payload and are
  intentionally not converted into a backfill.

## Remaining

- No historical timeline is created for scores published before the future
  targeted deployment. A separately authorized backfill would need dedicated
  retention, observability, and rollback design.
- A long-running multiday tournament can grow `publicTimeline`. The Portal
  should keep a bounded visible window; retention/pagination is not part of
  this ticket.
- Natural Production observation remains pending because this ticket performs
  neither deploy nor Production data writes.

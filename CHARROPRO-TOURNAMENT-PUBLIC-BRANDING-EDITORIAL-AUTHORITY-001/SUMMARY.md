# Tournament Public Branding Editorial Authority

## Canonical authority

- Branding: `charropro/tournaments/{tournamentId}/info/publicBranding`.
- Sponsors: `charropro/tournaments/{tournamentId}/info/publicSponsors/{sponsorId}`.
- The hydrated client calls the record's `info` object `tournament`; it does not create a second root authority.
- The administrative sponsor record is `{ sponsorId, name, logoUrl, enabled, sortOrder, tier, placement }`.

## Publication path

`Portal publico` in `torneo.html` updates the existing tournament state. `publishFirebaseTournamentState()` then invokes the existing canonical `publishPublicTournamentSnapshot()` path. The V3 Browser and Functions builders both read the editorial source, filter `enabled === false`, and order active sponsors by `sortOrder`, then `sponsorId`.

No score, Recovery, Outbox, reconciliation, or manual backfill triggers editorial publication.

## Asset authority

The client does not receive Firebase Storage write capability. It sends a validated JPG, PNG, or WEBP payload to `uploadCharroProTournamentPublicAsset`; the callable verifies an active Supervisor, tournament access, and the existence of the target tournament before Admin Storage writes a versioned object.

Assets are immutable by path and use `public,max-age=31536000,immutable`. Replacing an asset changes its reference, so browser and CDN caches cannot indefinitely retain a prior object.

Deletion removes the editorial reference only. The previous immutable object can remain orphaned; this ticket deliberately does not introduce a garbage collector.

# Security Boundaries

## Storage

Public reads are limited to these immutable editorial namespaces:

- `charropro/tournaments/{tournamentId}/public/branding/cover/*`
- `charropro/tournaments/{tournamentId}/public/branding/logo/*`
- `charropro/tournaments/{tournamentId}/public/sponsors/{sponsorId}/*`

Every client-side Storage write remains denied. MIME, size, image signature, identifier, and path checks occur in the server callable before the Admin SDK writes the object.

## RTDB

`info/publicBranding` and `info/publicSponsors` are explicit Supervisor-only branches. The generic `info/$other` branch excludes both fields. Sponsor records are keyed by their canonical `sponsorId`; fields outside the allowlist are denied.

RTDB Rules can only use literal regular expressions, not a dynamic `tournamentId` inside `matches()`. Therefore Rules constrain references to the configured production bucket and the public editorial namespace, while the callable owns exact tournament-to-object-path construction and authorization.

## Public projection

Only active sponsors are projected. The Portal's Home sponsor band depends on the sanitized public `sponsors` collection, never on a navigation module or inferred sporting data.

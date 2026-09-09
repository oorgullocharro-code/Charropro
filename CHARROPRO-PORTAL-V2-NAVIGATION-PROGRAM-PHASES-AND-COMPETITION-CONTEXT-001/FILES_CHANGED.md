# Files Changed

## Canonical Public Presentation Context

- `js/core/canonicalTournamentResults.js`
- `js/public/canonicalPublicTournamentData.js`
- `js/public/canonicalPublicProjectionV3.js`
- `functions/reconciliationShared/core/canonicalTournamentResults.js`
- `functions/reconciliationShared/public/canonicalPublicProjectionV3.js`

These files carry already-resolved competition, phase, and charreada presentation context across the Canonical Results to V3 adapter boundary. They do not resolve sport values or mutate public data.

## Portal V2

- `js/portalV2/portalV2ContextModel.js`
- `js/portalV2/portalV2Model.js`
- `js/portalV2/portalV2Router.js`
- `js/portalV2/portalV2App.js`
- `js/portalV2/portalV2ResultsModel.js`
- `js/portalV2/portalV2Render.js`
- `css/portal-v2.css`

## Fixtures And Tests

- `fixtures/portalV2PreviewFixtures.js`
- `tests/portal-v2-foundation-lifecycle.test.mjs`
- `tests/portal-v2-navigation-program-phases-context.test.mjs`

## Documentation

This directory records the bounded audit, static source findings, and validation evidence for the ticket.

## Mechanical Build Authority

- `functions/configuration.defaults.json` is the single build authority and receives the derived checksum/fingerprint for `20260909-portal-v2-navigation-program-phases-001-v1`.
- 209 existing runtime, fixture, and test import references are mechanically updated by `tools/release/applyClientBuildVersion.mjs` to that same build identity.
- The mechanical update changes no behavior outside cache identity. No client, Function, Rule, or data deployment is included.

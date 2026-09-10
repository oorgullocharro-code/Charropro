# Files Changed

## Product client

- `js/app.js`
- `js/portalV2/portalV2Router.js`
- `js/portalV2/legacyPortalRedirect.js`
- `torneo-publico.html`

## Deployment tooling and tests

- `scripts/hostinger/deploy-client.sh`
- `scripts/hostinger/smoke-client.sh`
- `tests/portal-v2-public-access-legacy-retirement.test.mjs`
- Updated Portal V1 compatibility and cache-coherence tests.

## Mechanical release propagation

- `functions/configuration.defaults.json` is the single build authority.
- Runtime `js/`, fixture, and test import query versions are updated mechanically by `tools/release/applyClientBuildVersion.mjs`.
- No Functions source, RTDB Rules, production data, sporting profile, scoring, or projection logic changed.

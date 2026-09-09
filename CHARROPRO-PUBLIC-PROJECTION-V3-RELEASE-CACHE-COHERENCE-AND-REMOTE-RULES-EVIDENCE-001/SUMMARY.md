# Public Projection V3 Release Cache Coherence

## Candidate

- Entry commit: `c82067ec11c250048f0eec164d305693c00acc57`.
- Candidate build: `20260909-public-projection-v3-release-cache-coherence-001-v1`.
- Canonical build authority: `functions/configuration.defaults.json` at `values.system.appVersion`.
- Derived consumers: stable `clientBootstrap.js`, CSS and entry URLs, and every non-bootstrap relative JavaScript import under the client graph.

The V3 browser projection, its temporary legacy presentation adapter, portal reader, canonical results module, and Outbox consumer all resolve through the new cache key. The old `20260908` key remains only as a negative assertion in the cache-coherence test.

## Scope

- No sporting calculation was changed or reintroduced.
- The legacy adapter remains presentation-only and consumes V3.
- Rules and Functions source are unchanged by this release-coherence candidate.
- No deployment, Firebase production write, historical reconciliation, reproject, or test-tournament repair occurred.

## Next Deploy

The subsequent authorized cutover must deploy the compatible set in this order: RTDB Rules V3, the single targeted reconciliation Function, then this immutable client package. It must not deploy a client with the previous cache identity against Rules V3.

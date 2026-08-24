# Render Audit

The scorer still uses its established full-surface render contract. This ticket does not introduce a new renderer or a partial-DOM architecture.

The corrected critical path is:

`pointerdown -> immediate tactile state -> click authority -> local draft mutation -> render -> visible paint -> deferred persistence`

Rule/profile resolution is cached only while the charreada, tournament, overrides, IDs, profile/version/fingerprint, and rule timestamps match. Mutable official scores are never stored in that cache.

After optimization, the real local browser reported:

- Touch to visible: 15.8 ms.
- Suerte switch to visible: 16.0 ms.
- Thirty repeated switches: median 16.4 ms, p95 17.8 ms, max 18.3 ms.
- Scorer roots after stress: one.

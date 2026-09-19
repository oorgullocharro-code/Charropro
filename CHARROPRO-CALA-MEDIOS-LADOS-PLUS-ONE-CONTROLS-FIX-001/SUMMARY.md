# Cala medios lados granular identities

Base: `0d76fe50ebb47d1c897dc15f0d4d3088f31bd1cc`

## Certified draft

`FMCH_2026_LIBRE 0.6.2` is a local `DRAFT` derived from `0.6.1`. It adds four independent Cala additional identities:

- `cala_medio_derecho_ida`: `+1`
- `cala_medio_derecho_vuelta`: `+1`
- `cala_medio_izquierdo_ida`: `+1`
- `cala_medio_izquierdo_vuelta`: `+1`

Each identity has maximum quantity `1`; all four may coexist for a maximum combined additional value of `+4`.

Draft facts:

- Rule count: `738`
- Content fingerprint: `rptp_faaf4360de95f84c`
- Status: `draft`
- Activation ready: `false`
- Browser/Functions mirror parity: `PASS`

## Legacy contract

`cala_medio_derecho` and `cala_medio_izquierdo` remain available for historical reads and are disabled for new `0.6.2` capture. Their semantic marker is `LEGACY_AGGREGATE_GRANULARITY_UNKNOWN`.

The existing `ca5`-`ca8` migration continues to preserve only the known aggregate side. No historical ida/vuelta component is inferred. The official format uses granular components when present and otherwise the known legacy aggregate, never both for the same side.

## Preserved authority

`FMCH_2026_LIBRE 0.6.1` remains byte-for-byte equivalent at the exported profile boundary:

- Rule count: `734`
- Fingerprint: `rptp_10e596046446e850`
- Serialized profile SHA-256: `d09d4155e73ff50419a08ff768b931dbe6feda6669051a5d9be4451a12514d5e`
- Source-definition diff: `0`

The local certification itself performed no lifecycle transition or production
write. Subsequent lifecycle and deployment require the separately authorized,
canonical release procedure recorded in `DEPLOYMENT_DECISION.md`.

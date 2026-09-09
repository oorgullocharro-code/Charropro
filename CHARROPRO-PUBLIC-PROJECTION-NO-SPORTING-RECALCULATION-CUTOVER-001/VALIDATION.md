# Validation

## Automated Gates

- Isolated complete suite: `172/172` test files passed.
- Canonical Public Tournament Data V3 contract: passed.
- Client/Function V3 parity, including `contentHash`: passed.
- Historical reconciliation fixture with two and three legacy duplicate heads: passed.
- Portal legacy-presentation adapter and partial standings: passed.
- V3 Outbox: passed.
- RTDB Rules static validation and JSON parsing: passed.
- RTDB Emulator V3 write/read-back: passed.
- `git diff --check`: passed before staging.

## Emulator Rules/Outbox Parity

The local, isolated `demo-charropro-local` Emulator verified:

1. unauthenticated V3 snapshot write is denied;
2. authorized V3 snapshot write is accepted;
3. the stored round-trip snapshot validates as Canonical Public Tournament Data V3;
4. an injected private `operatorId` field is denied;
5. new Outbox intent validation accepts only `public_tournament_v3`.

## Historical Result Parity

`results.teams`, `standings.items`, and `sheet.competitions` reference the same canonical result IDs and preserve total `193` with PR `21`. A malformed prior V3 snapshot with an invalid content hash is reprojection input, not an idempotent previous snapshot.

## Production Boundary

`PRODUCTION_WRITES=0`

`TEST_TOURNAMENT_WRITES=0`

`DEPLOY=NO`

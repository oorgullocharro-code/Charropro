# Evidence

## Environment Boundary

All writes described here were made only to Auth Emulator and RTDB Emulator for
`demo-charropro-local`. No Firebase Production API, user, tournament, score,
or configuration was changed.

## Seed

The local seed completed with:

- `projectId=demo-charropro-local`
- `tournamentId=demo-local-fmch-2026`
- `charreadaId=demo-local-fmch-jornada-1`
- marker `DEMO LOCAL / NO OFICIAL`

Read-back confirmed `FMCH_2026_LIBRE`, version `0.6.1`, and both stored
fingerprints as `rptp_10e596046446e850`. `fieldIdMappings` is absent from the
persisted tournament copy, while the source catalog still contains the
canonical `FMCH.TEAM_SHEET.CALA.MD` mapping.

## Directed Tooling Checks

The following passed after the seed fix:

- `node tests/local-runtime-seed.test.mjs`
- `node tests/terna-rule-catalog-resolution-audit-003.test.mjs`
- `node --check js/core/localRuleProfileDefaults.js`
- `node --check tools/development/localRuntimeSeed.mjs`
- `git diff --check`

## Browser Observations

### Supervisor

- Dashboard: 1 tournament, 1 active charreada, 3 teams.
- Team administration lists Charros Demo del Norte, Rancheros de Ensayo, and
  Tradicion Ficticia.
- Program lists Jornada de validacion local as active and local-juez.
- Console errors: 0.

### Brake Review And Scorer

- E1 authorization selected E2, never Cala.
- E2 authorization selected E3.
- E3 authorization completed the batch and exposed the protocol flow.
- Judges call exposed Cala Ready, then Cala without an automatic start.
- Cala score 20 saved once; Save and Next selected Rancheros de Ensayo.
- Scorer reported remote synchronization complete and console errors: 0.

### Portal

- The local Portal showed the demo tournament as LIVE.
- It showed Cala, 20 points, partial 20, provisional position 1, and one
  Charros Demo del Norte row after reload.
- Console errors: 0.

### Outputs

- `cronometro-pantalla.html`: local context, team, Cala, READY, `02:00.0`.
- `grafico-cronometro.html`: local Cala context, READY, `02:00.0`.
- Program Main and Announcer Monitor did not receive a Program composition;
  both have no console errors but cannot certify active composition delivery.

# CHARROPRO-PRECOMMERCIAL-PHYSICAL-END-TO-END-VALIDATION-001

## Checkpoint

- Base inspected: `75538930e948f1198e3e719a23d8702ed8192327`.
- Environment: `demo-charropro-local` only.
- Fixture: `DEMO LOCAL / NO OFICIAL - Auditoria FMCH`.
- Tournament: `demo-local-fmch-2026`.
- Charreada: `demo-local-fmch-jornada-1`.
- Firebase Production writes: `0`.
- Official historical data modified: `NO`.

## Local Fixture Preparation

`local:seed` originally failed because the local fixture attempted to write
canonical FieldIDs such as `FMCH.TEAM_SHEET.CALA.MD` as RTDB object keys.
Firebase RTDB rejects dots in keys. The local-only seed serializer now keeps
the canonical FieldID catalog in source code and persists only the profile
identity plus a compact isolated profile copy. The write fixture is checked
recursively so it cannot write `.`, `#`, `$`, `/`, `[` or `]` in any RTDB key.

The fixture now resolves the active local copy of `FMCH_2026_LIBRE 0.6.1` with
the certified fingerprint `rptp_10e596046446e850`. This did not modify the
production profile, FieldIDs, Rules, Functions, or production data.

## Physical Results To Date

- Portal Publico populated: PASS in local Emulator desktop and reload.
- Scorer representative E2E: PASS for Pre-Cala Brake Review, protocol, Cala
  READY, Cala score, Save and Next, official publication, and local Portal
  projection.
- Field timer and transmission timer: PASS for loading the same local current
  timer context in READY state without console errors.
- Supervisor navigation: PASS for tournament dashboard, teams, and program.
- Program Main: SUPERSEDED / NOT A COMMERCIAL 1.0 REQUIREMENT. It belongs to
  the Broadcast line that will be replaced by Graphics Editor, Graphics
  Control, and universal HTML Output; it is not a pending commercial gate.
- Announcer Monitor: SUPERSEDED / NOT A COMMERCIAL 1.0 REQUIREMENT. It belongs
  to the same superseded Broadcast line and is not a pending commercial gate.
- `cronometro-pantalla.html` remains the independent Field/Judges Timer, and
  `grafico-cronometro.html` remains the current Transmission Timer until their
  future Graphics System integration or replacement.
- Tablet/mobile responsive: INCONCLUSIVE. The available browser viewport
  override remained at the host's 1600px layout metrics, so it is not evidence
  for a real tablet or phone layout. Physical devices remain required.

## Current Dictamen

`PRECOMMERCIAL_PHYSICAL_VALIDATION_PARTIAL_PASS_PENDING_HARDWARE`

The local fixture is ready for further physical validation. This is not a
commercial-readiness approval and does not claim responsive PASS without
real-device proof.

## Classification

- Cases with local physical PASS: Portal, representative Scorer flow, field
  timer, transmission timer, and scoped Supervisor navigation.
- Cases pending: real tablet/mobile/iPad validation, plus the remaining
  representative sporting flow through the current product's suertes with a
  trained judge.
- New P0 findings: `0`.
- New P1 findings: `0`.
- Historical P1 physical gates remain pending until direct evidence exists; no
  new product regression was demonstrated by this validation.
- Production writes: `0`.

# Summary

Ticket: `CHARROPRO-SCORER-INTERACTION-AND-SUERTE-TRANSITION-LATENCY-001`

The scorer now acknowledges touches immediately, rejects only duplicate semantic actions during a 320 ms safety window, paints draft changes before deferred persistence, and reuses immutable scoring-rule resolution while its source signature remains valid.

The change does not alter Official Score, Attempt V2, FMCH sporting values, Rule Profile data, Firebase schema, RTDB Rules, Functions, Portal, Broadcast, or Official Format contracts.

Build: `20260824-scorer-interaction-latency-001-v1`

Configuration checksum: `6c739f11f2cde710014d8f9869a0016c9939b15830a74861380ac1a0ce2ccf0c`

FMCH fingerprint preserved: `rptp_0f90f7a3944a82d7`

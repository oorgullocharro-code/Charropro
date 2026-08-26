# Temporal Policy Runtime Activation

Runtime activation is exact and fail-closed. It requires all of:

- profile `FMCH_2026_LIBRE`;
- profile version `0.6.0`;
- sporting fingerprint `rptp_0f90f7a3944a82d7`;
- policy `FMCH_2026_LIBRE_OFFICIAL_TEMPORAL_RULES`;
- policy version `1.0.0`;
- temporal fingerprint `fmchtp_7d1e001181026f6d`.

A missing or incompatible identity resolves to
`TEMPORAL_POLICY_UNAVAILABLE`; certified FMCH values are not applied to another
profile or version. Existing legacy timers remain available only through their
explicit compatibility path and never outrank a compatible certified policy.

The runtime maps the ten certified suertes and their phases without changing
sporting score values. Piales mode is selected from the previous canonical
attempt state, not from score. Terna preserves its shared Timer identity when
the phase changes from Cabecero to Pial.

Auto-context is enabled. Auto-start is not enabled.

# Official Timer Orchestration

CharroPro conserva `officialTimers` como registro autoritativo e historico y agrega una unica proyeccion operativa: `currentTimerContext`. Telefono, Scorer, Graphics, Broadcast y Timer Display consumen esa identidad; ningun timer historico compite con el actual.

La maquina separa `INICIAR`/`FINALIZAR` de `PAUSAR`/`REANUDAR`, prepara timers nuevos en `READY`, resuelve Piales por identidad deportiva y ejecuta el handoff Toro a Terna sin auto-start.

- Perfil: `FMCH_2026_LIBRE 0.6.1`.
- Fingerprint deportivo: `rptp_10e596046446e850`.
- Politica temporal: `FMCH_2026_LIBRE_OFFICIAL_TEMPORAL_RULES 1.0.0`.
- Fingerprint temporal: `fmchtp_7d1e001181026f6d`.
- Sporting values modificados: NO.
- RTDB Rules modificadas: NO.
- Functions modificadas: NO.
- Firebase writes por tick: 0.

La certificacion fisica de charreada completa sin refresh queda pendiente despues del deploy cliente.

## Build y validacion

- Build anterior: `20260827-pre-cala-brake-review-timer-authority-context-blocker-003-v1`.
- Build final: `20260827-official-timer-orchestration-state-machine-failsafe-001-v1`.
- Suite completa final: 139/139 PASS.
- Node check: 266/266 PASS.
- JSON: 28/28 PASS.
- Cache/configuration/module identity: PASS.
- Secret scan: PASS.
- Debugger scan: PASS.
- Runtime console agregado: 0.
- `git diff --check`: PASS.

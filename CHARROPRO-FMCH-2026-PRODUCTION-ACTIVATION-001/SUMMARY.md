# FMCH 2026 Production Activation

## Alcance aprobado

- Promover `FMCH_2026_LIBRE 0.6.1` mediante Lifecycle Authority.
- Preservar `FMCH_2026_LIBRE 0.6.0` y todos sus torneos historicos.
- Usar `0.6.1` como default productivo solo para torneos Libre nuevos.
- Mantener la migracion de torneos existentes como operacion explicita.
- Habilitar Brake Review exclusivamente cuando el torneo resuelva `0.6.1` con fingerprint `rptp_10e596046446e850`.

## Estado pre-activacion

- Base Git: `bd0379dcdf218287a50fcd21a6a9e0df68ba97d9`.
- `0.6.0`: ACTIVE y sin modificaciones deportivas.
- `0.6.1`: DRAFT, certificacion PASS, P0 0 y READY-ELIGIBLE.
- Default anterior: `0.6.0`.
- Default preparado: `0.6.1`, policy `fmch-2026-libre-productive-default-v2`.
- Build preparado: `20260826-fmch-2026-061-production-activation-v1`.

## Fronteras

No se modifican RTDB Rules, valores deportivos, FieldIDs, scores, Attempts ni torneos existentes. Las unicas escrituras productivas autorizadas son las dos transiciones lifecycle y, si se requiere para validar el default, la creacion/asignacion de un torneo nuevo sin historial.

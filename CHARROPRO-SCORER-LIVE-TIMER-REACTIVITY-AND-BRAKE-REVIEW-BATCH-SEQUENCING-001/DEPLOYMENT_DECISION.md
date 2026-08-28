# Deployment Decision

## Decision

APROBADO para commit, push normal y deploy exclusivo del cliente Hostinger.

## Targets

- Cliente web: SI.
- RTDB Rules: NO.
- Firebase Functions: NO.
- Lifecycle: NO.
- Rule Profile: NO.

## Procedimiento

Usar paquete inmutable, validacion de manifest/build/checksum/SHA-256, dry-run, backup remoto, deploy overlay, smoke HTTP/browser y rollback dry-run.

## Estado posterior

`DEPLOYED_PENDING_FINAL_ZERO_REFRESH_PHYSICAL_VALIDATION`.

No declarar certificacion operativa final hasta completar una charreada fisica continua sin refresh.

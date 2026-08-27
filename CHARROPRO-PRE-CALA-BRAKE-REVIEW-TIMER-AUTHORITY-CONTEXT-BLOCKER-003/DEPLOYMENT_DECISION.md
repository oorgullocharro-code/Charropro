# Deployment Decision

## Targets necesarios

- Cliente web Hostinger: SI.
- RTDB Rules: NO.
- Firebase Functions: NO.
- Storage Rules: NO.
- Rule Profile/Lifecycle: NO.

El correctivo es cliente/dominio compartido. Las Rules vigentes aceptan las transiciones canonicas y fueron verificadas en Emulator sin modificaciones.

## Produccion

El cliente puede publicarse despues de commit, push normal y paquete inmutable. El smoke test debe limitarse al torneo aislado `torneo_mtauzdsb_r2ambq`, sin scores oficiales.

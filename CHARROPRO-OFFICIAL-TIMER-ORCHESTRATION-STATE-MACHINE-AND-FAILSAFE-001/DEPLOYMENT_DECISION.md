# Deployment Decision

Targets previstos:

- Cliente web Hostinger: SI, despues de suite completa, commit, push y paquete inmutable.
- RTDB Rules: NO; Emulator demuestra compatibilidad con las Rules vigentes.
- Firebase Functions: NO.
- Storage Rules: NO.
- Rule Profile/Lifecycle: NO.

El deploy debe usar el pipeline Terminal existente con validacion de paquete, dry-run, backup completo, staging remoto, overlay sin delete, HTTP smoke y rollback dry-run. La certificacion final queda `DEPLOYED_PENDING_PHYSICAL_TIMER_VALIDATION` hasta completar la prueba real sin refresh.

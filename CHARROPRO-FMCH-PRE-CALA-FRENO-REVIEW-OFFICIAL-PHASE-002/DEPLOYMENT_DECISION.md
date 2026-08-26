# Deployment Decision

El cambio runtime es exclusivamente cliente y permanece protegido por identidad exacta de perfil/version/fingerprint. Los torneos productivos `FMCH_2026_LIBRE 0.6.0` no entran automaticamente a Brake Review.

No se requiere deploy de RTDB Rules ni Functions. No se autoriza activar `0.6.1`, retirar `0.6.0`, migrar torneos ni modificar lifecycle productivo.

El cliente puede empaquetarse y desplegarse solo despues de suite completa verde, commit/push normal y verificacion del paquete inmutable. El estado posterior debe permanecer `PENDING PHYSICAL VALIDATION` hasta probar un torneo aislado explicitamente preparado para `0.6.1`.

Rollback: restaurar el paquete cliente previo. No existe rollback de datos, Rules, Functions ni lifecycle porque este ticket no los modifica.

# Failsafe And Recovery

- Politica certificada ausente: fail closed; no fallback legacy.
- CAS obsoleto: rechazado.
- Doble comando con mismo commandId: idempotente, sin nueva proyeccion.
- Perdida de red: conservar ultima vista y reconciliar al volver.
- Timer historico activo: permanece evidencia, no bloquea el contexto nuevo.
- Cambio rapido de oportunidad/suerte: la identidad nueva gobierna y nace READY.
- Interpolacion: local, sin escrituras Firebase por tick.

No se agrego un Timer Engine paralelo ni una autoridad basada en local/session storage.

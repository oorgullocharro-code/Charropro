# Activation Plan

## Estado de entrega

`FMCH_2026_LIBRE 0.6.1` queda certificado localmente y READY-eligible. La prueba
de Lifecycle demuestra `DRAFT -> READY` con CAS, idempotencia y una sola
auditoria, pero no escribe estado productivo.

## Gates posteriores

1. Implementar `CHARROPRO-FMCH-PRE-CALA-FRENO-REVIEW-OFFICIAL-PHASE-002`.
2. Conectar la fase `freno_review` al Flow sin convertirla en suerte 11.
3. Extender de forma versionada la compatibilidad runtime de la policy temporal
   `1.0.0` para el fingerprint certificado de `0.6.1`.
4. Validar Scorer, Official Score, Attempt V2, Timer y auditoria en Emulator.
5. Solicitar gate separado para lifecycle productivo `DRAFT -> READY`.
6. Solicitar otro gate separado para `READY -> ACTIVE` y asignaciones.

## Prohibiciones vigentes

- No editar ni retirar `0.6.0`.
- No activar `0.6.1` en Produccion.
- No asignar torneos.
- No desplegar Functions, Rules o cliente en este ticket.

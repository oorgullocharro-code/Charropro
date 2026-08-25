# Tournament Creation Profile Flow

## Flujo productivo

1. Validar formulario y derivar politica productiva.
2. Exigir sesion `platformAdmin` si el nuevo torneo Libre requiere asignacion global.
3. Proteger contra solicitudes duplicadas en la misma pestaña.
4. Publicar el torneo mediante la frontera existente.
5. Solicitar `assignCharroProTournamentRuleProfile` por la callable existente.
6. Usar `expectedRevision`, `idempotencyKey`, tenant y organization del torneo.
7. Aplicar el resultado confirmado al estado local.
8. Cerrar modal y navegar solo despues de confirmacion.

Si falla la publicacion, se revierte exclusivamente el borrador local. Si falla la asignacion despues de publicar, el torneo remoto se conserva sin fingir que esta listo y queda disponible el mecanismo explicito de recuperacion.

Local/Emulator conserva su fixture explicito y no invoca autoridad productiva.

# Production Scorer Resolution Trace

1. Firebase Auth produce una Access Session autorizada.
2. Tournament Context selecciona el torneo activo.
3. La suscripcion remota hidrata torneo y charreadas o reporta error explicito.
4. La charreada aporta `competitionType`.
5. Productive Rule Profile Policy confirma si Libre requiere asignacion.
6. `ruleProfileAssignment` aporta identidad, status, revision, source y fingerprint.
7. Rule Profile Engine valida seleccion y lifecycle.
8. State resuelve el catalogo de suertes con cache key contextual.
9. `resolveScorerContextState()` clasifica el contexto.
10. Panel, Programa y Scorer habilitan captura solo en `PROFILE_RESOLVED`.

El flag `?debugScorerContext=1` muestra una proyeccion segura y copiable sin UID, correo, token ni credenciales.

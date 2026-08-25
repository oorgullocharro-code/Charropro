# Access Governance V2 Recommendation

## Modelo propuesto

`IDENTITY + ROLE + SCOPE + PERMISSIONS + POLICY DECISION + AUDIT`.

Roles base sugeridos:

- `PLATFORM_ADMIN`
- `ORGANIZATION_ADMIN`
- `TOURNAMENT_SUPERVISOR`
- `JUDGE_COORDINATOR`
- `JUDGE`
- `TIMER_OPERATOR`
- `PRODUCTION`
- `ANNOUNCER`
- `AUDITOR`

Scopes sugeridos: organization, state, tournament y charreada. Los permisos deben ser acciones positivas como `judges.assign`, `scores.publish`, `timer.operate` y `broadcast.publish`, resueltas server-side y explicables por origen.

## Prioridades

1. Fuente canónica de assignments con revision, CAS, idempotencia y audit.
2. Grants por charreada para Jueces y Cronometristas.
3. Eliminar semantica implicita `tournamentAccess !== selected` en favor de policy positiva.
4. Scope de `history`, `judges` y settings de lectura.
5. Centro de Administracion con identidad, estado, roles, scopes, permisos efectivos, origen, revocacion y diagnostico.
6. Coordinador de Jueces con scopes nacional/estatal/torneo/charreada, sin permiso automatico para calificar.

## No implementado aqui

No se cambia schema, no se crean roles productivos nuevos y no se migran usuarios. La utilidad `diagnoseUserAccessBootstrap()` es una base tecnica segura para un futuro diagnostico administrativo.

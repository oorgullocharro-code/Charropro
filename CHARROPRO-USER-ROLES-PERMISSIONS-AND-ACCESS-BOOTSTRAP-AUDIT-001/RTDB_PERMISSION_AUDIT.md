# RTDB Permission Audit

| Path | Read actual | Write actual | Actores esperados | Gap | Severidad |
|---|---|---|---|---|---|
| `charropro/users` | Supervisor activo | hereda deny; hijos Supervisor | Supervisor | Operador puede leer hijos individuales, no raiz | medium |
| `charropro/users/{uid}` | propio, Supervisor u Operador activo | Supervisor | propio/admin | correcto para bootstrap | low |
| `charropro/userTournamentAccess/{uid}` | propio o Supervisor | Supervisor | propio/admin | correcto | low |
| `charropro/tournamentIndex` | Supervisor o acceso no `selected` | hijos Supervisor/Operador | global users | correcto; el cliente anterior lo usaba mal | low |
| `charropro/tournamentIndex/{id}` | activo + scope/grant | Supervisor/Operador | asignados | correcto | low |
| `charropro/tournaments/{id}` | activo + scope/grant | segmentado por rol/campo | asignados | algunas escrituras legacy son amplias | medium |
| `charropro/live/{id}` | lectura publica | escrituras por rol | Portal/Broadcast y operacion | lectura global publica es contrato legacy | medium |
| `charropro/judges` | cualquier activo | segmentado | operacion de jueces | lectura no scoped por torneo | high futuro |
| `charropro/history` | cualquier activo | Supervisor/Operador | consulta autorizada | lectura global no scoped | high futuro |
| `charropro/audit` | Supervisor/Operador/Organizador | trusted para published | auditoria | correcto por rol, sin scope uniforme | medium |
| `charropro/settings` | cualquier activo | Supervisor/Operador | configuracion runtime | lectura amplia, sin secretos esperados | medium |
| `charropro/ruleProfileLifecycle` | false | false | Functions trusted | correcto | low |

## Incidente

No existe error en la Rule del indice. El cliente violaba el contrato al leer la raiz para un Juez `selected`. El fix no cambia Rules.

## Acceso global

`tournamentAccess !== 'selected'` habilita hoy lectura global del indice a cualquier rol activo. Supervisor tambien obtiene acceso global independientemente del flag. El flag lo administra el flujo de usuarios y debe conservarse por compatibilidad, pero Access V2 debera sustituir la negacion implicita por grants positivos y policy explicita.

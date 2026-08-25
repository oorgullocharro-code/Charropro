# Current Role Inventory

| Role | UI label | Runtime | Authority | Default capabilities | Legacy aliases | Status |
|---|---|---|---|---|---|---|
| Supervisor | Supervisor | `supervisor` | UI + Rules + Functions | read, operate, score, timer, manage, rules, settings, supervise, audit, users, graphics, speaker, sync | admin, administrador | active; aliases requieren normalizacion administrativa |
| Operador | Operador | `operador` | UI + Rules | read, operate, score, timer, manage, rules, settings, audit, graphics, speaker, sync | operator | active; alias no es autoridad RTDB |
| Juez | Juez | `juez` | UI + Rules + trusted publication Functions | read, score, timer, sync | judge | active; alias no es autoridad RTDB |
| Locutor | Locutor | `locutor` | principalmente UI + lecturas RTDB | read, speaker | speaker | active |
| Graficos | Graficos | `graficos` | UI + Rules Broadcast/live | read, graphics | graphics, grafico | active |
| Organizador | Organizador | `organizador` | UI + Rules de lectura/auditoria | read, audit, speaker | organizer | active |
| Lectura | Solo lectura | `lectura` | UI + Rules de lectura compartida | read | readonly, read_only, solo lectura, viewer | active |
| Sin acceso | Sin acceso | `sin_acceso` | cliente fail closed | ninguna | rol vacio/desconocido | internal |

Los aliases existen para compatibilidad de presentacion, pero un perfil RTDB debe contener uno de los siete valores canonicos. El bootstrap falla cerrado ante un alias/legacy porque las Rules no lo reconocen como autoridad equivalente.

`platformAdmin` no es un rol. Es un booleano excepcional preservado solo cuando el perfil server-side contiene `platformAdmin: true`; habilita autoridades globales como lifecycle/assignment mediante Functions. No se hereda por ser Supervisor y no se acepta desde una manipulacion del cliente.

## Flujo de identidad

`Firebase Auth -> auth.uid -> charropro/users/{uid} -> active/role/platformAdmin -> tournamentAccess + userTournamentAccess/{uid} -> makeAccessSession -> capabilities UI -> Rules/Functions como autoridad efectiva`.

Claims custom no son la fuente primaria observada. El perfil RTDB y las validaciones de Functions son la autoridad actual.

# Bootstrap Read Trace

## Flujo anterior

| Paso | Funcion | Ruta | Resultado para Juez `selected` |
|---|---|---|---|
| 1 | `readFirebasePreparationSnapshot` | `charropro/users/{uid}` | ALLOW: perfil propio |
| 2 | `readFirebasePreparationSnapshot` | `charropro/userTournamentAccess/{uid}` | ALLOW: grants propios |
| 3 | `readFirebasePreparationSnapshot` | `charropro/tournamentIndex` | DENY: la raiz exige Supervisor o acceso no `selected` |
| 4 | filtro local | torneos autorizados | No se ejecutaba |

Ruta exacta denegada: `charropro/tournamentIndex`.

Regla exacta relevante: usuario autenticado y activo, y ademas rol `supervisor` o `tournamentAccess !== 'selected'`. Miguel1 es Juez con `selected`, por lo que la denegacion es correcta.

## Flujo nuevo

| Paso | Funcion | Ruta | Scope |
|---|---|---|---|
| 1 | `readFirebasePreparationSnapshot` | `charropro/users/{auth.uid}` | identidad propia |
| 2 | `buildUserAccessBootstrapPlan` | sin red | valida `active` y rol |
| 3 | `readFirebasePreparationSnapshot` | `charropro/userTournamentAccess/{auth.uid}` | grants propios |
| 4a | acceso `selected` | `charropro/tournamentIndex/{tournamentId}` | un hijo por grant |
| 4b | Supervisor/global | `charropro/tournamentIndex` | raiz autorizada actual |
| 5 | bootstrap scoped | `charropro/tournaments/{tournamentId}` | solo IDs visibles |

No se lee `charropro/users`, no se consulta un torneo ajeno y no se requiere acceso global para operar como Juez.

## Estados

- `READY`: al menos un torneo autorizado o lectura global valida.
- `NO_ASSIGNMENTS`: usuario valido sin grants; no se intenta leer el indice.
- `INACTIVE`: `active !== true`; se detiene antes de grants/indice.
- `ROLE_REVIEW_REQUIRED`: rol desconocido; fail closed.
- `ACCESS_ERROR`: lectura autorizada denegada o fallo de sincronizacion, con `deniedPath`.

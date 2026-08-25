# Current Permission Matrix

Leyenda: `A` allow, `D` deny, `C` conditional, `U` no formalizado. La autoridad entre parentesis distingue UI, Rules (`R`) y Function (`F`). `PA` significa `platformAdmin` autenticado y activo.

| Accion | PA | Supervisor | Operador | Juez | Locutor | Graficos | Organizador | Lectura |
|---|---|---|---|---|---|---|---|---|
| Login | A | A | A | A | A | A | A | A |
| Read own profile | A(R) | A(R) | A(R) | A(R) | A(R) | A(R) | A(R) | A(R) |
| Read other users | C(R) | A(R) | A por hijo(R) | D | D | D | D | D |
| Create/edit/deactivate user | C(F/R) | A(F/R) | D | D | D | D | D | D |
| Assign tournament to user | C(F/R) | A(R) | D | D | D | D | D | D |
| Read tournament | C(R) | A(R) | C(scope R) | C(scope R) | C(scope R) | C(scope R) | C(scope R) | C(scope R) |
| Create/edit tournament | C | A/C(R) | C(R) | D | D | D | D | D |
| Delete tournament | C | C(R, sin ledger) | D | D | D | D | D | D |
| Read scorer | C | A(UI/R) | A(UI/R) | C(scope UI/R) | D(UI) | D(UI) | D(UI) | D(UI) |
| Score | C | A(UI/R) | A(UI/R) | C(scope UI/R) | D | D | D | D |
| Publish/correct score | C(F) | C(F) | C(F) | C(F, scope) | D | D | D | D |
| Read timer | C | A | A | C(scope) | C(read) | C(read) | C(read) | C(read) |
| Operate timer | C | A(R) | A(R) | C(scope R) | D | D | D | D |
| Read Formato Federacion | C | A | A | C(scope) | C(read) | C(read) | C(read) | C(read) |
| Export XLSX | C | A(UI) | C(UI) | C(UI/scope) | D | D | C/U | C/U |
| Read Portal | A(public) | A | A | A | A | A | A | A |
| Operate Broadcast | C | A | A | D | D | C | D | D |
| Configure Broadcast | C | A | A/C | D | D | C | D | D |
| Assign FMCH profile | A(F) | D salvo PA | D | D | D | D | D | D |
| Read audit | A(F/R) | A(R) | A(R) | D(R) | D | D | A(R) | D |
| Restore backup | C(F) | C(F) | D | D | D | D | D | D |

## Scopes actuales

- `SYSTEM`: configuracion, lifecycle y administracion global mediante autoridades trusted.
- `TOURNAMENT`: `tournamentAccess`, `tournamentIds` y `userTournamentAccess/{uid}/{id}`.
- `CHARREADA`: existe contexto operativo y assignments de jueces, pero no hay un modelo general de grants por charreada integrado al bootstrap.
- `organization`, `tenant`, `state`: aparecen en subsistemas especializados, no forman una gobernanza uniforme de acceso del cliente principal.

El principal gap es la diferencia entre capacidades de UI y autoridad efectiva distribuida entre Rules y Functions.

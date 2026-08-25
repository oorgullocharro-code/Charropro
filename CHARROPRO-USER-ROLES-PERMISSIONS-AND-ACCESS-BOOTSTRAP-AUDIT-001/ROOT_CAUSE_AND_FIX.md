# Root Cause and Fix

## Causa raiz

`readFirebasePreparationSnapshot()` hacia:

`get(ref(db, "charropro/tournamentIndex"))`

antes de filtrar localmente. Para Miguel1:

- Auth: presente.
- Perfil: activo.
- Rol: `juez`.
- Scope: `selected`.
- Grant: torneo Prueba Miguel.
- Resultado de la raiz: `PERMISSION_DENIED` por diseño.

## Correccion

`js/core/userAccessBootstrap.js` construye un plan determinista y auditable:

- valida `active === true`;
- normaliza roles conocidos y rechaza desconocidos;
- combina IDs del perfil con grants propios cuyo valor sea exactamente `true`;
- usa lectura de raiz solo para Supervisor/acceso global;
- usa lecturas hijas para `selected`;
- no hace lecturas de torneo cuando no hay asignaciones;
- devuelve `deniedPath` y errores diferenciados.

`js/core/firebaseSync.js` ejecuta el plan con el SDK Firebase. `js/app.js` conserva la identidad autenticada, aplica los grants autoritativos y presenta estados claros.

## Seguridad

- No se abrio ninguna lectura global.
- No se confia en un ID de torneo inventado por UI.
- Rules siguen negando cross-tournament.
- Rol invalido falla antes del indice.
- Usuario inactivo falla antes de grants/indice.
- Diagnostico reutilizable no suplanta usuarios ni expone secretos.

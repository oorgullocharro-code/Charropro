# CHARROPRO-USER-ROLES-PERMISSIONS-AND-ACCESS-BOOTSTRAP-AUDIT-001

## Dictamen tecnico

El incidente es client-side. Un Juez activo con acceso `selected` podia leer su perfil, sus grants y cada torneo autorizado, pero `readFirebasePreparationSnapshot()` intentaba leer primero la raiz completa `charropro/tournamentIndex`. Las Rules niegan correctamente esa raiz y permiten sus hijos autorizados.

El bootstrap ahora aplica minimo privilegio:

`Auth UID -> perfil propio -> grants propios -> tournamentIndex/{id} -> tournaments/{id}`.

Supervisor y usuarios con acceso global conservan la lectura de raiz conforme al contrato vigente. Un Juez sin torneos termina en `NO_ASSIGNMENTS`; un usuario inactivo termina en `INACTIVE`; un rol invalido termina en `ROLE_REVIEW_REQUIRED`.

## Limites

- RTDB Rules modificadas: no.
- Functions modificadas o desplegadas: no.
- Firebase Production Writes: 0.
- FMCH_2026_LIBRE 0.6.0: sin cambios.
- Fingerprint deportivo: `rptp_0f90f7a3944a82d7`.
- Access Governance V2: recomendado, no implementado.
- Validacion fisica Miguel1: pendiente despues del deploy.

## Gates

- Suite completa: `111/111 PASS`.
- Node syntax: `232/232 PASS`.
- JSON: `28/28 PASS`.
- Rules Emulator: PASS.
- RTDB Rule change required: NO.

## Build

- Base: `078c9dfe7eaed1a8111aea833da3c33f89b1c411`.
- Build: `20260825-user-access-bootstrap-001-v1`.
- Autoridad: `functions/configuration.defaults.json`.
- Checksum de configuracion: `a03913c5a8b9d4502278f8a5a0b02c5d6e4c81c8c84209ab76867b611ef77293`.

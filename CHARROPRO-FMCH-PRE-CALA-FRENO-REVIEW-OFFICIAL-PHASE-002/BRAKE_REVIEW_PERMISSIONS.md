# Brake Review Permissions

Las mutaciones requieren sesion autenticada y un rol operativo autorizado por la capa existente.

Roles aceptados por el dominio:

- juez autorizado;
- supervisor;
- operador autorizado.

Las operaciones validan identidad de torneo, charreada, equipo, timer y perfil. CAS protege revisiones obsoletas; la autoridad del timer protege ownership; el dominio rechaza RuleID fuera de `freno_review` o de consecuencia incompatible.

No se modificaron RTDB Rules ni Functions. No existe bypass, auto-elevation, acceso global nuevo ni escritura directa a un score paralelo.

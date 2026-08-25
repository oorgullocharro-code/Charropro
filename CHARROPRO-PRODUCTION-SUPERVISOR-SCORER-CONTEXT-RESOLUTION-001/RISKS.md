# Risks

## Pendientes

- La validacion fisica en iPad debe ocurrir despues del deploy.
- Un torneo productivo existente sin assignment, como `Casa loma`, no se repara en este ticket sin autorizacion de escritura.
- La creacion de torneo Libre productivo requiere `platformAdmin` porque el perfil objetivo es global; otros operadores reciben un bloqueo explicito.
- Si la callable falla despues de publicar el torneo, este se conserva para recuperacion y no se borra remotamente.

## Gate de escritura

`PRODUCTION_WRITE_GATE_REQUIRED` para reparar un torneo existente: invocar `assignCharroProTournamentRuleProfile` sobre su tournament path, con revision real y una idempotencyKey unica. No ejecutado.

## Mitigaciones

CAS, idempotencia y validacion server-side permanecen intactos. No hay fallback cruzado ni reinterpretacion historica.

# Cache Analysis

La firma del cache de suertes ya incluia torneo, charreada, competencia, identidad del perfil y datos del assignment. Se agregaron los campos que faltaban para evitar reutilizar una resolucion incompleta:

- status del perfil;
- fingerprint superior;
- revision superior del assignment;
- `ruleProfilePolicyRequired`;
- source del assignment.

La firma conserva tambien status, revision y fingerprint anidados. Un assignment tardio, cambio de perfil, cambio de torneo o cambio de competition type invalida el resultado anterior.

El build se deriva exclusivamente de `functions/configuration.defaults.json`. El bootstrap HTML permanece estable y los imports ES Module comparten una identidad unica.

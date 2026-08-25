# Temporal Profile Versioning Decision

## Decision

La metadata temporal certificada no se inserta dentro de `FMCH_2026_LIBRE@0.6.0`.

Motivo: `buildRuleProfileContentFingerprint()` incluye `suerteMetadata`. Corregir o completar los contratos dentro de ese objeto cambiaria el fingerprint reglamentario `rptp_0f90f7a3944a82d7` de una version ACTIVE e invalidaria la inmutabilidad historica.

## Arquitectura elegida

`timerRules.js` ya es parte de la autoridad oficial del cronometro. Se extendio esa misma autoridad con una politica temporal separada y versionada:

- Policy ID: `FMCH_2026_LIBRE_OFFICIAL_TEMPORAL_RULES`.
- Version: `1.0.0`.
- Fingerprint: `fmchtp_7d1e001181026f6d`.
- Profile binding: `FMCH_2026_LIBRE@0.6.0` + `rptp_0f90f7a3944a82d7`.
- Estado: `CERTIFIED_NOT_ACTIVATED`.

No se creo un segundo Timer Engine ni un registro mutable paralelo. La politica es metadata declarativa dentro del modulo de autoridad existente.

## Impacto lifecycle

- Profile version antes: `0.6.0`.
- Profile version despues: `0.6.0` sin cambios.
- Fingerprint deportivo antes/despues: `rptp_0f90f7a3944a82d7`.
- Nueva activacion de perfil: no requerida.
- Activacion/integracion de politica temporal: requerida en ticket separado.
- Migracion de historicos: no.
- Asignacion de torneos: no.

## Cache y deploy

La API nueva no esta cableada a consumidores productivos. Por ello no se genera build ni cache-buster en este ticket y no se despliega cliente. El ticket de integracion debera actualizar el build canonico cuando conecte la politica al runtime.

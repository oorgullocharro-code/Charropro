# Deployment Decision

## Decisión

APROBADO para deploy exclusivo del cliente web mediante el pipeline Hostinger
Terminal existente con build
`20260828-fmch-terna-federation-format-row-ownership-001-v1`.

## Targets

- Cliente web inmutable para `public_html/charropro`.

## Targets excluidos

- Firebase RTDB Rules.
- Firebase Functions.
- Lifecycle y perfiles.
- Datos productivos.

El deploy debe producir backup remoto, validar SHA-256/build/checksum, ejecutar
smoke HTTP/browser y dejar probado el comando de rollback sin restaurarlo.

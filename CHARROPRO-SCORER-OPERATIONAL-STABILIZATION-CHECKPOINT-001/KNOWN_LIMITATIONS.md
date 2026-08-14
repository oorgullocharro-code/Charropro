# Known Limitations

## Fuera de alcance

- La politica temporal FMCH Toro / Terna no se redefine en este checkpoint.
- La politica de no solapamiento de los timers de Paso queda para el ticket temporal.
- El perfil `FMCH_2026_LIBRE 0.6.0` permanece bloqueado para activacion productiva.
- No existe editor de Rule Profiles ni motor de convocatoria activo.

## Emulator

Las validaciones previas observaron `permission_denied` en Public Projection / Outbox bajo determinados fixtures del Emulator. No se relajaron Firebase Rules. El hallazgo no se confundio con una regresion de score oficial y debe investigarse en un ticket con alcance de Rules si persiste.

## Git remoto

El checkpoint parte de `HEAD = main = 2729ccfa6cd1978653fec7ec7a70525a50f5bbf0`; `origin/main` permanece deliberadamente atrasado porque este cierre prohibe push.

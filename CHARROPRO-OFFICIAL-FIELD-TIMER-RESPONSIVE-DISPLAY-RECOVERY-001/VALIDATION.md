# Validation

## Formato

PASS:

- `14.4`, `05.2`, `0.0`
- `-0.1`, `-14.4`, `-59.9`
- `01:00.1`, `01:14.4`
- `-01:00.1`, `-01:14.4`, `-12:34.5`, `-99:59.9`

## Matriz DOM real

Se midieron 40 combinaciones con el CSS real: ocho valores en cada viewport.

- 1920x1080: PASS
- 1280x720: PASS
- 1024x768: PASS
- 768x1024: PASS
- 390x844: PASS

En todas: reloj dentro del panel, sin scroll horizontal, sin clipping, sin ellipsis y con todos los digitos visibles.

## Estados

- READY: PASS
- RUNNING: PASS
- PAUSED: PASS
- FINISHED: PASS
- Semantica visual de overtime: PRESERVADA

## Automatizacion

- Pruebas dirigidas: PASS
- Suite completa: 156/156 PASS
- Node: 291/291 PASS
- JSON: 49/49 PASS
- `git diff --check`: PASS
- Cache/build authority: PASS
- Secret scan: PASS
- Debugger scan: PASS

## Limite

La prueba fisica con una pantalla de campo y un torneo TEST debe confirmar cruce por cero, overtime, pause, resume y finish. No se realizaron escrituras productivas de scoring.

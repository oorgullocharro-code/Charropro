# Validation

## Cobertura dirigida

- Scorer/Attempt V2 conserva `lazo` y `pial_ruedo`.
- Official Score conserva ambos registros activos.
- Team Total suma ambos componentes una sola vez.
- Snapshot conserva `participantId` y `participantSlot`.
- `ROW_01` permanece propiedad del primer charro aunque su Cabecero falle.
- Cabecero 26 se materializa en `ROW_02`.
- Pial 20 se materializa en `ROW_03`.
- HTML, FieldID y XLSX conservan las mismas filas.
- Orden de publicación y refresh/reconexión no cambian el ownership.
- Formato Federación queda `READY` con total Terna 46.
- Un Pial ausente se reporta como `official-format-required-suerte-missing:pial_ruedo`.
- La proyección pública conserva `LC`, `PR` y el acumulado oficial.

## Gates previos al build

- Suite completa: 142/142 PASS.
- Regresiones dirigidas: PASS.
- Node check: 270/270 PASS.
- JSON: 28/28 PASS.
- `git diff --check`: PASS.
- Secret scan: PASS.
- Debugger scan: PASS.

Los gates de identidad de build, staging, paquete y despliegue se ejecutan por
el flujo canónico de release y Hostinger Terminal.

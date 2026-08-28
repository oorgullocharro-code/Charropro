# Validation

## Cobertura dirigida

- Scorer/Attempt V2 conserva `lazo` y `pial_ruedo`.
- Official Score conserva ambos registros activos.
- Team Total suma ambos componentes una sola vez.
- Formato Federación queda `READY` con los dos componentes.
- Un Pial ausente se reporta como `official-format-required-suerte-missing:pial_ruedo`.
- La proyección pública conserva `LC`, `PR` y el acumulado oficial.

## Gates previos al build

- Suite completa: 142/142 PASS.
- Regresiones dirigidas: PASS.
- Node check del correctivo y su prueba: PASS.
- `git diff --check`: PASS.
- Secret scan: PASS.
- Debugger scan: PASS.

Los gates de identidad de build, staging, paquete y despliegue se ejecutan por
el flujo canónico de release y Hostinger Terminal.

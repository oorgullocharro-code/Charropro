# Resolucion de ambiguedades

## Freno, arreo, riendas y cambio posterior

`cala_desc_freno_arreo_prohibido_cambio` mezclaba dos hechos. En `0.6.1` queda
deshabilitada y preservada para trazabilidad. Se separa en:

- `cala_desc_revision_freno_arreo_prohibido_riendas_disparejas` para la
  presentacion;
- `cala_desc_cambio_freno_caballo` para el cambio posterior.

## Competidor y presentador

`cala_desc_competidor_distinto` queda como identidad canonica, con la excepcion
reglamentaria aplicable documentada por la fuente. El alias
`cala_desc_presentador_diferente` queda deshabilitado y apunta a la identidad
canonica; no puede seleccionarse simultaneamente.

## Personas proximas a rectangulos

`cala_desc_persona_rectangulos` permanece como una sola identidad y declara
alcance compartido entre `freno_review` y `cala_execution`. No se duplica el DQ.

## Resultado

Las cuatro ambiguedades terminan `RESOLVED_CANONICAL`; no queda ninguna
identidad `AMBIGUOUS` certificable.

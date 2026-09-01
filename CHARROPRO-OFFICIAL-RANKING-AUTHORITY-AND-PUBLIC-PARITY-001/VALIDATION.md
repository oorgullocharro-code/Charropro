# Validacion

## Matriz funcional

- Empty state: PASS.
- Un equipo: PASS.
- Tres equipos y dos charreadas: PASS.
- Empate determinista: PASS.
- Draft excluido: PASS.
- Publicacion/retry idempotente: PASS.
- Correccion oficial: PASS.
- Aislamiento entre torneos: PASS.
- Reload/cache: PASS.
- Caladero y Coleadero individual: PASS.
- Supervisor/Public Portal/Output: misma autoridad y comparador.

Fixture agregado principal: Equipo C 55, Equipo B 50, Equipo A 40. Las seis
filas documentales de dos charreadas permanecen en la sabana, mientras el
ranking contiene tres identidades unicas.

## Automatizacion

- Directed/regression suites: 21/21 PASS.
- Full suite: 159 archivos; 158 PASS en la corrida unica y el unico gate
  ambiental paso al ejecutarse dentro de Emulator, resultado consolidado
  159/159 PASS.
- Auth/RTDB Emulator con Node 22: PASS; anonimo DENIED, supervisor autorizado
  PASS, campo privado adicional DENIED.
- Node syntax: 295/295 PASS.
- JSON: 81/81 PASS.
- Post-build gates: 18/18 PASS.
- `git diff --check`: PASS.

## Visual

Fixture real del Portal validado en desktop, tablet y mobile. Resultado:
orden estable, 12 identidades unicas, podio 3 + lista 9, estado vacio valido,
reload identico, cero errores de consola y cero filas duplicadas.

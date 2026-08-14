# Test Evidence

## Prueba nueva

`tests/terna-rule-catalog-resolution-audit-003.test.mjs` valida:

- reproduccion exacta de Denver sin perfil;
- origen `PRODUCT_BASE` y `fallbackUsed: false`;
- IDs genericos `lb1`, `la1`-`la6`, `li1`-`li3`;
- asignacion local FMCH 2026;
- perfil/version/estado/metadata de fixture;
- catalogo FMCH de Lazo;
- no mutacion del torneo, `SUERTES` o perfil canonico;
- referencias explicitas no sustituidas;
- referencia invalida bloqueada;
- fallback explicito controlado;
- seed alineado con el helper;
- uso del helper en creacion de torneo y charreada;
- Cabecero SUCCESS -> Pial;
- Pial SUCCESS -> COMPLETED en 2/5;
- O3 no reservada;
- tres oportunidades `CLOSED_UNUSED`;
- identidad del cronometro compartido preservada.

## Suite completa

Comando:

```bash
node --test tests/*.test.mjs
```

Resultado: 74/74 PASS, 0 fallos, 0 omitidas.

## Node check

Se ejecutó `node --check` sobre todos los `.js` y `.mjs` del repositorio.

Resultado: 177/177 PASS.

## JSON

Se parsearon todos los JSON encontrados por `rg --files -g '*.json'`.

Resultado: 21/21 PASS.

## Validacion dirigida previa

Pasaron:

- nueva prueba del ticket;
- `tests/local-runtime-seed.test.mjs`;
- `tests/rule-profile-engine.test.mjs`;
- `tests/fmch-2026-terna-complete.test.mjs`;
- `tests/operational-validation-corrections-002.test.mjs`;
- `git diff --check`.

## Validacion manual Emulator

Entorno: `LOCAL / EMULATOR`, proyecto `demo-charropro-local`.

| Validacion | Resultado |
| --- | --- |
| Crear Charreada 3 nueva | PASS |
| Perfil FMCH heredado por torneo | PASS |
| Version 0.6.0 | PASS |
| Lazo sin catalogo generico | PASS |
| 4 bases FMCH | PASS |
| adicionales FMCH | PASS |
| infracciones FMCH | PASS |
| descalificaciones FMCH | PASS |
| Cabecero SUCCESS -> Pial | PASS |
| Pial SUCCESS -> completar | PASS |
| cierre 2/5 | PASS |
| O3 no reservada | PASS |
| Flow Engine avanza | PASS |
| publicacion local confirmada por cliente | PASS |
| produccion | NO USADA |

Al volver a la sesion completada, O3/O4/O5 permanecieron deshabilitadas. El estado `CLOSED_UNUSED` se confirma deterministicamente en las pruebas canónicas; no se creo un intento tercero ni aumento `sharedOpportunityUsed`.

## Integridad

- `git diff --check`: PASS.
- `git diff --cached --check`: PASS; staging vacio.
- debugger scan del alcance: 0 hallazgos.
- console debug/log nuevo: 0 hallazgos.
- secret scan de lineas agregadas: 0 hallazgos.
- SHA-256 `fmch2026TernaRules.js`: `66b4fcfad4124dda87a9a36e34a1f78e8bc11118b32d6c00b91ec154c87a714a`.
- SHA-256 `ruleProfiles.js`: `e05eb4b1ab9856e26d34da3cf45cfab57aeed920b32b075a532066a0f7353ab2`.
- SHA-256 `suertes.js`: `2b87ccb46e8c578a5a6b6de59af77ecc6896ddfb80afac265382411eb5090f86`.

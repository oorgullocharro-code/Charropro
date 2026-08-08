# Scoring Attempt V2 Test Evidence

## Prueba dirigida

`tests/scoring-attempt-v2.test.mjs` cubre:

- identidad determinista y oportunidad distinta;
- intento 20 + 3 - 2 = 21;
- puntos buenos, malos individuales y malos de equipo separados;
- DQ no destructivo y retiro de DQ en draft;
- clasificacion dinamica sin perder selection identity;
- adicionales e infracciones manuales con motivo;
- penalizacion individual -3 y de equipo -4 separadas;
- zero/no logrado distinto de DQ;
- Cala, Piales, Coleadero, infracciones, DQ, nota y evidencia legacy;
- participante individual sin `teamId`;
- oportunidad y timer compartidos;
- remate y calculador compacto;
- preservacion de `0`, `false`, cadena vacia y `null`;
- rechazo de function, symbol, BigInt, Date, Map, Set, undefined, ciclos, accessors y claves peligrosas;
- perfil y valor oficial congelados;
- DQ de UI no borra campos;
- `attemptV2` conservado por Firebase;
- autoridad oficial sin recalculo de V2.

## Regresiones dirigidas

- `tests/public-snapshot-cache-coherence.test.mjs`: una sola identidad transitive de modulos.
- `tests/public-live-feed-integration.test.mjs`: publicacion, outbox, recovery, idempotencia y guard remoto 453/local 450.
- `tests/team-penalties-zero.test.mjs`: penalizaciones al equipo y cero legacy.
- `tests/cala-rules.test.mjs`: calculo oficial de Cala sin cambios.

## Resultado final

- `node --check`: 91/91 archivos JavaScript.
- Suite completa: 57/57 archivos `tests/*.test.mjs`.
- JSON: 27/27 archivos validos.
- `git diff --check`: correcto.
- Cache coherence: correcto con token `20260808-scoring-attempt-model-v2-001-v1`.

## Integracion

No se escribio en Firebase de produccion. Las pruebas usan fixtures y adapters locales. No hubo deploy ni push.

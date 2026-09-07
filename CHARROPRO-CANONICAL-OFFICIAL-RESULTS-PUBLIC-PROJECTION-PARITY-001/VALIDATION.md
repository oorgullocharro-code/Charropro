# Validación

## Evidencia runtime dirigida

- Proyecto: `charropro-e8a68`.
- Torneo TEST: `torneo_mtj3fikk_2llw7v`.
- Charreada: `charreada_mtj3g4z6_3ku421`.
- Casa 1: `equipo_mtj3fvo8_7bplqp`.
- `RUNTIME_INCIDENT_MATCHES_REPRO=YES`.
- Lecturas solamente; cero escrituras, republicaciones, borrados o reparaciones productivas.

Los tres registros activos de la misma oportunidad compartida tenían claves terminadas en `__pial_ruedo__3__0`, `__pial_ruedo__3__1` y `__pial_ruedo__3__2`. El registro histórico de 15 quedó superseded, pero los ledgers partidos mantuvieron tres cabezas de 21 y el fanout las entregó. El snapshot público observado estaba en revisión 157.

## Matriz de integridad

- Sporting identity stability: PASS.
- 21→42/63 regression: PASS; PR 21 y total 193 en resultado canónico, público y ranking.
- Official active record: PASS.
- Collection consistency: PASS.
- Ledger consistency: PASS.
- Internal sheet parity: PASS.
- Formato Federación parity: PASS.
- Public Projection parity: PASS.
- Portal parity: PASS mediante el contrato de Public Projection.
- Ranking parity: PASS; el comparador y desempates no cambiaron.
- Penalizaciones individuales/de equipo, adicionales y restas: PASS.
- Correcciones, retry e idempotencia: PASS.
- Multi-equipo, multi-charreada y aislamiento: PASS.
- Reload, cache y compatibilidad legacy unavailable: PASS.
- Timeline histórico separado del resultado vigente: PASS.

## Automatización

- Pruebas dirigidas del contrato canónico: 25/25 PASS.
- Pruebas CAS unitarias: 5/5 PASS.
- Regresiones relacionadas: 38/38 PASS.
- RTDB Emulator, Node 22.23.2: PASS. Dos escritores partieron del mismo ETag; un 412 reintentó y quedaron ambas celdas, dos ledgers y dos resultados.
- Suite completa, corrida única: 191/192; el único fallo fue el archivo que requiere Auth Emulator después de que el servicio ya se había cerrado.
- Gate ambiental aislado con Auth/RTDB/Functions/Storage Emulator y Node 22: 1/1 PASS.
- Resultado consolidado de suite: 192/192 PASS.
- Gates posbuild canónicos/cache/configuración: 37/37 PASS.
- Consumidores con versión explícita: 8/8 PASS.
- `git diff --check`: PASS.

## Build

- Build: `20260907-canonical-official-results-public-projection-parity-001-v1`.
- Checksum de configuración: `3c9387b6c78e2942484214b5d5170b71b8191b24f4bf1d251f8cb432d365d508`.
- 26/26 entrypoints HTML usan el build canónico.
- Cero referencias runtime al build anterior bajo `js/`, `fixtures/` y `tests/`.

## Producción y deploy

- Escrituras productivas: 0.
- Reparación del torneo TEST: no ejecutada; permanece como evidencia.
- Deploy: no ejecutado, pendiente de autorización explícita.

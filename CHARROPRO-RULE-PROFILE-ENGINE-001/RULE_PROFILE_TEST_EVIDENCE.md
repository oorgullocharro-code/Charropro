# Rule Profile Test Evidence

## 1. Cobertura dirigida

`tests/rule-profile-engine.test.mjs` cubre:

1. Product Base sin profile.
2. Override de valor por profile.
3. Precedencia de convocatoria.
4. Disable logico.
5. Regla nueva del profile.
6. Override de RuleID inexistente.
7. Identidad duplicada.
8. Valor dinamico declarativo.
9. Team infraction explicita.
10. DQ explicita.
11. Conflicto de categoria.
12. Seleccion exacta ID/version.
13. Profile desconocido bloqueado.
14. Fallback explicito.
15. Skeleton FMCH no activable.
16. Baseline de diez suertes equivalente.
17. Colision `ttm` diagnosticada.
18. Aislamiento por torneo.
19. No mutacion.
20. Calculo oficial intacto.
21. Score historico desacoplado y sin recalculo.
22. Version exacta sin seleccion silenciosa de la mas reciente.
23. Metadata de timer y opportunities por precedencia.
24. Orden y merge deterministas.
25. Contexto reglamentario en score oficial.
26. Manuales, team penalties y DQ presentes.

## 2. Pruebas de regresion requeridas

Se ejecutan todas las suites `tests/*.test.mjs`, `node --check` sobre JavaScript, validacion JSON y checks Git antes del commit.

## 3. Evidencia final

- `tests/*.test.mjs`: 56/56 suites aprobadas.
- `node --check`: 90/90 archivos JavaScript propios aprobados; se excluyeron dependencias instaladas bajo `node_modules`.
- JSON: 27/27 archivos validos.
- `tests/rule-profile-engine.test.mjs`: PASS.
- `tests/public-snapshot-cache-coherence.test.mjs`: PASS con una identidad transitiva unica.
- `tests/official-score-concurrency.test.mjs`: PASS.
- `tests/public-projection-outbox.test.mjs`: PASS.
- `tests/backup-foundation.test.mjs`: PASS.
- `tests/backup-restore-validation.test.mjs`: PASS.
- `git diff --check`: PASS.

La suite usa fixtures/adapters locales; no se escribio en Firebase de produccion. El SHA del commit se registra en el cierre Git posterior.

# Test Evidence

## Validaciones ejecutadas

| Validacion | Resultado |
| --- | --- |
| Baseline Git | PASS: HEAD, main y origin/main en `954aadee12346ff573829eb9b42fcbc912628910` |
| Working tree inicial | PASS: limpio |
| Staging inicial | PASS: vacio |
| Suites `tests/*.test.mjs` | PASS: 74/74 |
| `node --check` sobre JS/MJS versionados | PASS: 177/177 |
| JSON del repositorio y fixtures locales, sin `node_modules` | PASS: 27/27 |
| Resolver sin perfil | PASS: Product Base valido, `fallbackUsed: false` |
| Resolver con FMCH 0.6.0 draft | PASS: bloquea con `profile-not-available-for-scoring` |
| Resolver con fallback explicito | PASS: Product Base con diagnostico y `fallbackUsed: true` |
| Comparacion de diez catalogos | PASS: determinista, sin mutacion |
| Lectura de torneo productivo | PASS: sin campos de perfil |
| Evidencia de scores Cala | PASS: Product Base y fingerprint consistentes |
| Outbox | PASS: 39 terminales; 0 pendientes |
| Proyeccion publica | PASS: schema 2, revision 49, estado live |
| Reproduccion UI | PASS: botonera Product Base identificada sin publicar |
| Suites dirigidas de readiness | PASS: 16/16 |

## Alcance de la prueba visual

Se reprodujo directamente Pial en el Ruedo. Las otras nueve suertes no se
operaron en Produccion porque el torneo no tiene perfil FMCH y no existe una
asignacion segura. Su diferencia se comprobo mediante el mismo resolver y los
catalogos versionados que consume la UI.

## Controles finales

| Control | Resultado |
| --- | --- |
| `git diff --check` | PASS, sin salida |
| `git diff --cached --check` | PASS, sin salida |
| Whitespace de los nueve documentos nuevos | PASS, 0 hallazgos |
| Secret scan de los documentos nuevos | PASS, 0 hallazgos |
| `debugger` en JS/MJS | PASS, 0 archivos |
| `console.log`/`console.debug` | 69 archivos preexistentes; 0 agregados porque no cambio codigo |
| Cache-buster | PASS, se conserva `20260813-scorer-operational-stabilization-checkpoint-001-v1` |
| Staging final | Vacio |
| Working tree final | Nueve documentos nuevos sin tracking |

No se ejecutaron escrituras de Produccion, commit, push ni deploy.

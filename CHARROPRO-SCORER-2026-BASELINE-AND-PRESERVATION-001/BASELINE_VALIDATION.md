# Baseline Validation

## Identidad

- Base auditada: `fc225a848ef738d56cc9567979333d3ada57ee62`.
- Rama: `main`.
- `origin/main` de entrada: `78a51f23ae1f2b13e48667041048b9624f57d6ae`.
- Produccion, deploy y push: no utilizados.

## Metodo

1. Inspeccion de implementacion actual del scorer y sus dependencias.
2. Reutilizacion de evidencia visual/funcional aprobada en
   `CHARROPRO-FMCH-CURRENT-SCORER-FUNCTIONAL-AUDIT-001`.
3. Reconciliacion de `FIELD_DICTIONARY.json` contra la matriz de capas.
4. Inventario de funciones transversales, footer, DQ, timers, persistencia, publicacion,
   exportacion y responsive.
5. Busqueda explicita de fusiones/fusionales y conceptos relacionados.
6. Suite completa y validaciones estaticas al cierre.

## Evidencia reutilizada

- Diez vistas reales recorridas en cliente `LOCAL / EMULATOR`.
- 236 botones visibles inventariados.
- Cala de 20 puntos confirmada en recarga, Resultados, historial oficial y fanout
  `DELIVERED`.
- Cero conexiones a `charropro-e8a68` durante esa validacion.
- Datos y usuarios exclusivamente sinteticos.

Los documentos antiguos `SUMMARY.md` y `VALIDATION.md` de aquella carpeta conservan el
bloqueo inicial como evidencia historica. Su reanudacion aprobada esta documentada en
`CURRENT_REAL_GAPS.md` y `PREVIOUS_DIAGNOSIS_RECONCILIATION.md`, que son la evidencia
vigente utilizada aqui.

## Reconciliacion de FieldID

- Diccionario: 239 registros, 239 IDs unicos.
- Matriz: 239 registros, 239 IDs unicos.
- Faltantes de diccionario en matriz: 0.
- Extras de matriz: 0.
- Particion: 13 presentes, 177 derivables, 42 ambiguos y 7 faltantes.
- Cobertura: UI 182, estado 195, calculo 184, persistencia 184, official score 184,
  auditoria 184, exportacion 232 y derivables 215.

## Hallazgos dirigidos

| Verificacion | Resultado |
| --- | --- |
| 10 suertes | Inventariadas 10/10. |
| Manual additional | Localizado: `customAdic` y `addCustomScore("adic")`. |
| Manual infringement | Localizado: `customInfr` y `addCustomScore("infr")`. |
| Team infractions | Localizadas: `teamPenalties`, catalogo general/Cala y entrada manual. |
| DQ | Documentado en `applyDescReason()`. Preserva infracciones numericas/manuales, equipo, evidencia y nota. |
| Footer | Documentado. `Deshacer` navega al puntero anterior; no es undo por accion. |
| Timers | Documentados, incluida cuenta regresiva de Coleadero. |
| Punta Cala | Preservada como calculador especializado. |
| Fusiones/fusionales | No localizadas como funcionalidad independiente; Floreo no se declara equivalente. |
| Publicacion oficial | Transaccion, CAS, idempotencia, ledger, historial, audit y fanout documentados. |
| Public snapshot | Outbox, Recovery y guards documentados. |
| FMCH export | Mapeado; brecha de charreada activa permanece P1. |
| Responsive | Baseline y riesgos documentados; sin cambios CSS. |

## Validaciones tecnicas finales

Resultados reproducibles obtenidos antes del commit local:

| Validacion | Resultado |
| --- | --- |
| Suites `tests/*.test.mjs` | 55/55 aprobadas |
| `node --check` JS/MJS versionados | 149/149 correctos |
| JSON parse de archivos versionados | 21/21 validos |
| `git diff --check` | Correcto, sin errores |
| `git diff --cached --check` | Correcto; staging inicialmente vacio |
| Archivos de producto modificados | 0 |
| Escrituras en Produccion | 0 |
| Deploy | No |
| Push | No |

## Criterio

El baseline solo queda aprobado cuando todas las validaciones anteriores pasan, el diff
contiene exclusivamente documentacion y el commit local incluye solo los archivos
declarados en `FILES_CHANGED.md`.

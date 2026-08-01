# Archivos modificados

## Nuevos

| Archivo | Motivo |
| --- | --- |
| `functions/configuration.defaults.json` | Baseline canónico publicado, versionado y firmado. |
| `functions/configurationEngine.js` | Contrato puro, seguridad, checksum, jerarquía, CAS e idempotencia. |
| `functions/configurationService.js` | Punto único de lectura/publicación y adapters Firebase/memoria. |
| `js/core/configurationBootstrap.js` | Carga y verificación del mismo baseline en navegador. |
| `tests/configuration-management.test.mjs` | Pruebas funcionales, seguridad, concurrencia y compatibilidad. |
| `CHARROPRO-CONFIGURATION-MANAGEMENT-001/SUMMARY.md` | Arquitectura y cierre técnico. |
| `CHARROPRO-CONFIGURATION-MANAGEMENT-001/VALIDATION.md` | Evidencia de validación. |
| `CHARROPRO-CONFIGURATION-MANAGEMENT-001/TEST_RESULTS.md` | Resultado reproducible de tests. |
| `CHARROPRO-CONFIGURATION-MANAGEMENT-001/RISKS.md` | Riesgos mitigados y residuales. |
| `CHARROPRO-CONFIGURATION-MANAGEMENT-001/ROLLBACK.md` | Procedimiento de reversión. |
| `CHARROPRO-CONFIGURATION-MANAGEMENT-001/FILES_CHANGED.md` | Inventario de alcance. |

## Modificados

| Archivo | Motivo |
| --- | --- |
| `js/core/firebaseSync.js` | Carga SDK, proyecto, región y rutas desde el baseline y expone wrappers de las dos callables; lógica Firebase restante intacta. |
| `js/core/version.js` | Obtiene la versión vigente del baseline sin cambiar su valor publicado. |
| `functions/index.js` | Consume el baseline, registra dos callables y centraliza opciones del entrypoint. |
| `functions/package.json` | Agrega las dos callables al comando de deploy; sin dependencias nuevas. |
| `firebase-rules-auditoria.json` | Cierra lectura y escritura cliente del namespace nuevo. |

## Fuera de alcance confirmado

- JavaScript deportivo: sin cambios.
- Portal Público: sin cambios.
- Broadcast Studio y Output Routing: sin cambios.
- Backup Engine y Restore Engine: sin cambios.
- Official Score Concurrency: sin cambios.
- Public Projection Recovery: sin cambios.
- HTML/CSS: sin cambios.
- Dependencias y lockfiles: sin cambios.

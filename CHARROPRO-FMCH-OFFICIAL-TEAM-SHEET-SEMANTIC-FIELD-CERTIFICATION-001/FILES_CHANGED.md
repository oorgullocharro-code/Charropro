# Files Changed

## Producto documental

- `js/core/officialFormatSnapshot.js`: snapshot `1.2.0`, evidencia semántica explícita, ocho campos T y controles acumulados.
- `js/core/officialFormat.js`: consume controles, remate, vuelta y tiempo sin heurísticas.

## Evidencia deportiva de Cala

- `js/core/state.js`: campos opcionales explícitos para P/T.
- `js/core/scoring.js`: conserva P/T desde `calculatePuntaBreakdown()` sin cambiar la fórmula.
- `js/core/scoringAttempt.js`: congela `distancePoints`, `timePoints` y `totalPoints` en Attempt V2.
- `js/app.js`: aplica el cálculo autoritativo a la copia que se publica y preserva P/T en Official Score.
- `js/core/officialFormatSnapshot.js`: proyecta únicamente la evidencia congelada y conserva compatibilidad con aliases explícitos.

## Pruebas

- `tests/official-format-authoritative-snapshot.test.mjs`: fixture/golden actualizado al contrato `1.2.0`.
- `tests/official-format-semantic-field-certification.test.mjs`: certificación dirigida y fixtures de primera/segunda vuelta.
- `tests/fmch-2026-cala-scorer.test.mjs`: identidad P+T, límites, invariancia y preservación histórica.
- `tests/cala-rules.test.mjs`: identidad exhaustiva P+T en el rango 0–90 m y tiempos 1–5.

## Documentación y evidencia

- Los doce documentos exigidos por el ticket.
- `evidence/formato-fmch-semantico-paso-primera-vuelta.xlsx` y `.pdf`.
- `evidence/formato-fmch-semantico-paso-segunda-vuelta.xlsx` y `.pdf`.

No se modificaron Rule Profile, valores deportivos, Firebase Rules, lógica de Functions, Flow, Timer Authority, Broadcast ni Portal. `functions/configuration.defaults.json` cambia únicamente en `appVersion` y su checksum/fingerprint derivados para mantener válido el bootstrap del cliente. El scorer y Official Publication solo agregan evidencia; los totales permanecen invariantes.

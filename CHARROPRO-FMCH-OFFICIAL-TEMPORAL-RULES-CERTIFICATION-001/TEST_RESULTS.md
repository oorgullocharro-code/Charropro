# Test Results

## Dirigidas

- `node tests/fmch-official-temporal-rules-certification.test.mjs`: PASS.
- `node --check js/core/timerRules.js`: PASS.
- `node --check tests/fmch-official-temporal-rules-certification.test.mjs`: PASS.
- `git diff --check`: PASS.

## Cobertura nueva

- 10/10 suertes y todas sus fases.
- Duraciones, inicios, fines, pausas, expiracion y efectos.
- Piales 2/3 min y rechazo de metadata condicional ausente.
- Terna compartida y alias `lazo` / `pial_ruedo`.
- Oportunidades consecutivas e identidad.
- Hard refresh determinista.
- Inmutabilidad de politica y resoluciones.
- Rechazo de perfil, suerte y fase no autorizados.
- Fingerprint temporal y preservacion de fingerprint deportivo.

## Gate final

- Suite completa: 113/113 PASS.
- Node check: 235/235 PASS.
- JSON: 28/28 PASS.
- Cache-buster single authority: PASS.
- Configuration integrity/checksum: PASS.
- Module identity: PASS.
- Secret scan: PASS.
- Credential assignment scan: PASS.
- Debugger scan: PASS.
- Runtime console scan: PASS.
- Sporting values diff audit: PASS.
- Fingerprint deportivo: `rptp_0f90f7a3944a82d7` PASS.
- `git diff --check`: PASS.
- `git diff --cached --check`: PASS antes de staging; se repite sobre staging exacto.

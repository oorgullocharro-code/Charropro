# Repository Technical Debt and Dead Code Audit

## Dictamen

APROBADO_PARA_PLAN_DE_LIMPIEZA. No se detectó P0 ni evidencia suficiente para eliminar código productivo.

## Baseline

- Branch: main
- Commit: 1a63b378c86985e6d0db36e5a17e3d0b22c916b8
- Tracked files inventoried: 762
- Root HTML entrypoints: 26
- Test suites mapped: 87
- Exact duplicate groups: 0
- Potential orphan JS modules: 1; HIGH-confidence dead: 0
- Current build: 20260824-fmch-team-sheet-html-print-geometry-001-v1

## Categories

| Category | Files |
|---|---|
| DOCUMENTATION_HISTORICAL | 353 |
| TEST | 87 |
| DOCUMENTATION_CURRENT | 52 |
| FIXTURE | 48 |
| PRODUCTIVE_BROADCAST | 33 |
| PRODUCTIVE_ASSET | 31 |
| TOOLING | 27 |
| PRODUCTIVE_CORE | 26 |
| PRODUCTIVE_VIEW | 21 |
| PRODUCTIVE_ENTRYPOINT | 18 |
| PRODUCTIVE_FIREBASE | 17 |
| PRODUCTIVE_DATA | 17 |
| PRODUCTIVE_SCORER | 14 |
| PRODUCTIVE_CONFIG | 9 |
| PRODUCTIVE_OFFICIAL_FORMAT | 9 |

## Disposition

| Decision | Files |
|---|---|
| KEEP_HISTORICAL | 353 |
| KEEP_PRODUCTIVE | 185 |
| KEEP_CERTIFICATION_EVIDENCE | 135 |
| KEEP_AUTHORITY | 62 |
| KEEP_TOOLING | 27 |

## Physical tree distinction

The physical tree includes ignored functions/node_modules, .local Emulator state/log/PID, database-debug.log and .DS_Store files. They are local/generated material, not tracked removal candidates.

No product, Rule Profile, Official Format, Firebase, scorer, XLSX, assets or sporting values were changed.

# T Field Matrix

`T` means sporting points derived from time under the exact certified rule for each suerte. It never means elapsed duration. `TERMINADO EN` and `TIEMPO EN SALIR` come independently from frozen `timing.officialElapsedMs`.

| FieldID | Suerte | Exact rule/source | Attempt V2 / Official Score | Snapshot | XLSX | Fixture |
| --- | --- | --- | --- | --- | --- | ---: |
| `FMCH.TEAM_SHEET.CALA.T` | Cala | `scoring.calculationDetail.details.timePoints` | `breakdown.attemptV2.scoring.calculationDetail.details.timePoints` | `suertes.cala.attempts[0].documentalEvidence.cala.puntaTimePoints` | `L8` | 3 |
| `FMCH.TEAM_SHEET.JINETEO_TORO.SCORE.T` | Jineteo Toro | `toro_adic_tiempo_ahorrado` | `breakdown.attemptV2.scoring.selections.additional[]` | `suertes.toro.attempts[0].documentalEvidence.timePoints.value` | `AD26` | 2 |
| `FMCH.TEAM_SHEET.TERNA.ROW_01.T` | Terna | `lazo_adic_tiempo_no_usado` + `pial_ruedo_adic_tiempo_no_usado` | frozen additional selections | paired row sum in `suertes.terna.attempts[]` | `AC32` | 3 |
| `FMCH.TEAM_SHEET.TERNA.ROW_02.T` | Terna | same exact Rule IDs | frozen additional selections | paired row sum in `suertes.terna.attempts[]` | `AC33` | blank |
| `FMCH.TEAM_SHEET.TERNA.ROW_03.T` | Terna | same exact Rule IDs | frozen additional selections | paired row sum in `suertes.terna.attempts[]` | `AC34` | blank |
| `FMCH.TEAM_SHEET.JINETEO_YEGUA.SCORE.T` | Jineteo Yegua | `yegua_adic_tiempo_ahorrado` | `breakdown.attemptV2.scoring.selections.additional[]` | `suertes.yegua.attempts[0].documentalEvidence.timePoints.value` | `AD38` | 3 |
| `FMCH.TEAM_SHEET.MANGANAS_PIE.T` | Manganas Pie | `manganas_pie_adic_tiempo_no_usado` | frozen additional selections | section sum in `suertes.manganasPie.attempts[]` | `AD44` | 2 |
| `FMCH.TEAM_SHEET.MANGANAS_CABALLO.T` | Manganas Caballo | `manganas_caballo_adic_tiempo_no_usado` | frozen additional selections | section sum in `suertes.manganasCaballo.attempts[]` | `AD49` | 1 |

No universal `T` formula is introduced. Empty Terna rows remain empty and historical records without granular Rule ID evidence are not inferred.

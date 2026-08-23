# Control Row Matrix

The three cells are documentary controls only: `previousTotal + currentSuerteTotal = newAccumulatedTotal`. `currentSuerteTotal` is the frozen team-adjusted official section total. None of these cells changes Official Score.

| Row | Suerte | Previous cells / FieldID | Current cells / FieldID | New cells / FieldID | Fixture values | Source path |
| ---: | --- | --- | --- | --- | --- | --- |
| 15 | Piales | `V15:Y15` / `PIALES.POST_INFRACTION_CONTROL_01` | `Z15:AB15` / `..._02` | `AC15:AF15` / `..._03` | `26 + 28 = 54` | `documentalControls.accumulatedBySection.piales` |
| 24 | Coleadero | `V24:Y24` / `COLEADERO.POST_INFRACTION_CONTROL_01` | `Z24:AB24` / `..._02` | `AC24:AF24` / `..._03` | `54 + 71 = 125` | `documentalControls.accumulatedBySection.coleadero` |
| 28 | Jineteo Toro | `V28:Y28` / `JINETEO_TORO.POST_INFRACTION_CONTROL_01` | `Z28:AB28` / `..._02` | `AC28:AF28` / `..._03` | `125 + 12 = 137` | `documentalControls.accumulatedBySection.toro` |
| 36 | Terna | `V36:Y36` / `TERNA.AUXILIARY_CONTROL_01` | `Z36:AB36` / `..._02` | `AC36:AF36` / `..._03` | `137 + 22 = 159` | `documentalControls.accumulatedBySection.terna` |
| 40 | Jineteo Yegua | `V40:Y40` / `JINETEO_YEGUA.POST_INFRACTION_CONTROL_01` | `Z40:AB40` / `..._02` | `AC40:AF40` / `..._03` | `159 + 12 = 171` | `documentalControls.accumulatedBySection.yegua` |
| 46 | Manganas Pie | `V46:Y46` / `MANGANAS_PIE.POST_INFRACTION_CONTROL_01` | `Z46:AB46` / `..._02` | `AC46:AF46` / `..._03` | `171 + 21 = 192` | `documentalControls.accumulatedBySection.manganasPie` |
| 51 | Manganas Caballo | `V51:Y51` / `MANGANAS_CABALLO.POST_INFRACTION_CONTROL_01` | `Z51:AB51` / `..._02` | `AC51:AF51` / `..._03` | `192 + 13 = 205` | `documentalControls.accumulatedBySection.manganasCaballo` |
| 56 | Paso | `V56:Y56` / `PASO.POST_INFRACTION_CONTROL_01` | `Z56:AB56` / `..._02` | `AC56:AF56` / `..._03` | `205 + 20 = 225` | `documentalControls.accumulatedBySection.paso` |

The Cala fixture separately proves `5` individual bad points + `4` team infraction = `9` in `FMCH.TEAM_SHEET.CALA.SIDE_BAD_POINTS_SUM_CONTROL`. The control has `affectsScore:false`; final score remains `225`.

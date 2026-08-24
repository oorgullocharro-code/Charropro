# Root Cause

El commit de optimizacion `2525843c41aafd4c5c73311515ddbdcb45a558d1` introdujo un cache por identidad y firma en `getCharreadaScoringSuertes()`.

La primera resolucion podia ocurrir mientras la asignacion productiva aun estaba pendiente. El resultado `[]` se guardaba como definitivo. Despues, la autoridad de asignacion completaba `ruleProfileAssignment` mutando el mismo objeto de torneo, pero la firma no incluia estado, revision ni fingerprint de esa asignacion. La consulta repetida devolvia el vacio anterior.

Tambien se detecto que `competitionId` podia tratarse como tipo aunque fuera una identidad de competencia. La normalizacion ahora solo lo usa cuando representa un tipo valido y centraliza aliases de equipos.

No fue una ausencia del catalogo FMCH ni una falla del Rule Profile. Fue una invalidacion incompleta de cache combinada con una frontera ambigua entre identidad y tipo de competencia.

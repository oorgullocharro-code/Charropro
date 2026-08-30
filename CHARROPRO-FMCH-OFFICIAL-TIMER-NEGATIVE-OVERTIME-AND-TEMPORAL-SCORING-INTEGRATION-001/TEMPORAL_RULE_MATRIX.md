# Temporal Rule Matrix

Authority: `FMCH_2026_LIBRE_OFFICIAL_TEMPORAL_RULES 1.0.0` (`fmchtp_7d1e001181026f6d`).

| Phase | temporalRuleId | Sporting RuleID | Threshold / consequence | Mode | Official format destination | Overtime |
|---|---|---|---|---|---|---|
| Cala brake review | `fmch_2026_cala_freno_review` | `cala_inf_revision_freno_mas_un_minuto`, `cala_inf_revision_freno_mas_dos_minutos`, `cala_desc_revision_freno_mas_tres_minutos` | >1 min bad, >2 min bad, >=3 min DQ | AUTOMATIC | Cala bad slots / `BAD_POINTS_TOTAL` / `TOTAL` | YES |
| Cala partidero | `fmch_2026_cala_partidero_start` | `cala_inf_arrancar_despues_un_minuto`, `cala_desc_dos_minutos` | >1 min bad, >2 min DQ | AUTOMATIC | Cala bad slots / `BAD_POINTS_TOTAL` / `TOTAL` | YES |
| Piales opportunity | `fmch_2026_piales_opportunity_readiness` | `piales_infr_tiempo_excedido_minuto` | 2 bad points per exceeded minute | AUTOMATIC | Attempt `TOTAL` and Piales controls | YES |
| Coleadero release | `fmch_2026_coleadero_partidero_release` | none | 20 s operational window; independent timer per opportunity | FLOW_ONLY | opportunity close only | NO |
| Toro apretalamiento | `fmch_2026_toro_apretalamiento` | `toro_adic_tiempo_ahorrado`, `toro_infr_apretalamiento_minuto_4`, `toro_infr_apretalamiento_minuto_5`, `toro_desc_apretalamiento_mas_5_min` | saved-minute T, minute 4/5 bad, >5 min DQ | AUTOMATIC | `JINETEO_TORO.SCORE.T`, `MALOS`, `TOTAL_02` | YES |
| Terna shared window | `fmch_2026_terna_shared_window` | `lazo_adic_tiempo_no_usado`, `pial_ruedo_adic_tiempo_no_usado` | complete unused minute after both components count | AUTOMATIC | participant row `T` / `TOTAL` | YES |
| Yegua apretalamiento | `fmch_2026_yegua_apretalamiento` | `yegua_adic_tiempo_ahorrado`, `yegua_infr_apretalamiento_minuto_4`, `yegua_infr_apretalamiento_minuto_5`, `yegua_desc_apretalamiento_mas_5_min` | saved-minute T, minute 4/5 bad, >5 min DQ | AUTOMATIC | `JINETEO_YEGUA.SCORE.T`, `MALOS`, `TOTAL_02` | YES |
| Yegua dismount | `fmch_2026_yegua_dismount` | `yegua_infr_desmonte_tardio` | 1 bad point per exceeded minute after 1 min | AUTOMATIC | `JINETEO_YEGUA.SCORE.MALOS` / `TOTAL_02` | YES |
| Manganas a Pie | `fmch_2026_manganas_pie_execution` | `manganas_pie_adic_tiempo_no_usado`, `manganas_pie_infr_minuto_7`, `manganas_pie_desc_tiempo_agotado` | unused-minute T only with a valid mangana and completed sequence; minute 7 bad; >7 min DQ | AUTOMATIC | `MANGANAS_PIE.T`, attempt `TOTAL`, section `TOTAL` | YES |
| Manganas changeover | `fmch_2026_manganas_caballo_changeover` | `manganas_pie_team_mover_yegua_cambio` | movement is an observed sporting fact | ASSISTED | team infraction / accumulated control | YES |
| Manganas a Caballo | `fmch_2026_manganas_caballo_execution` | `manganas_caballo_adic_tiempo_no_usado`, `manganas_caballo_infr_minuto_7`, `manganas_caballo_desc_tiempo_agotado` | unused-minute T only with a valid mangana and completed sequence; minute 7 bad; >7 min DQ | AUTOMATIC | `MANGANAS_CABALLO.T`, attempt `TOTAL`, section `TOTAL` | YES |
| Paso mare exit | `fmch_2026_paso_mare_exit` | `paso_desc_salida_mas_3_min` | >3 min DQ | AUTOMATIC | `PASO.SCORE.TOTAL` | YES |
| Paso dismount | `fmch_2026_paso_dismount` | `paso_infr_desmonte_tardio` | 1 bad point per exceeded minute after 1 min | AUTOMATIC | `PASO.SCORE.MALOS` / `TOTAL` | YES |

`SPORTING_RULE_GAP`: none. No RuleID, FieldID, sporting value, profile, or fingerprint was created or changed.

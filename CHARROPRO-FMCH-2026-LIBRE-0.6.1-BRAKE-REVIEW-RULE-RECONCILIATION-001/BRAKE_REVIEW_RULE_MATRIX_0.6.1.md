# Brake Review Rule Matrix 0.6.1

| # | Concepto | Regla canonica 0.6.1 | Resultado |
|---|---|---|---|
| 1 | Revision mayor a 1 minuto | `cala_inf_revision_freno_mas_un_minuto` | -1 |
| 2 | Revision mayor a 2 minutos | `cala_inf_revision_freno_mas_dos_minutos` | segundo -1 |
| 3 | Revision mayor a 3 minutos | `cala_desc_revision_freno_mas_tres_minutos` | DQ |
| 4 | Resistirse a ser enfrenado | `cala_inf_resistirse_enfrenar` | -1 |
| 5 | Resistirse a dar estribo | `cala_inf_resistirse_estribo` | -1 |
| 6 | Negativa a enfrenar o dar estribo | `cala_desc_negativa_enfrenar_estribar` | DQ |
| 7 | No usar estribo izquierdo o montar por derecha | `cala_desc_revision_montar_sin_estribo_izquierdo_o_por_derecha` | DQ |
| 8 | Freno/arreo prohibido o riendas disparejas | `cala_desc_revision_freno_arreo_prohibido_riendas_disparejas` | DQ |
| 9 | Competidor distinto al presentador | `cala_desc_competidor_distinto` | DQ |
| 10 | Salir del rectangulo durante presentacion | `cala_desc_salirse_rectangulo` | DQ |
| 11 | Caballo presentado por otro equipo | `cala_desc_caballo_otro_equipo_fase` | DQ |
| 12 | No salir por el frente | `cala_desc_salida_incorrecta_revision` | DQ |
| 13 | Cambiar freno o caballo despues de revision | `cala_desc_cambio_freno_caballo` | DQ |
| 14 | Retirarse del ruedo | `cala_desc_retirarse_ruedo_revision` | DQ |
| 15 | Patada con una extremidad | `cala_inf_patada_una_extremidad` | -4 |
| 16 | Patada con ambas extremidades | `cala_desc_patada_doble` | DQ |
| 17 | Personas proximas a rectangulos | `cala_desc_persona_rectangulos` | DQ |
| 18 | Cambio por fuerza mayor autorizado | Sin RuleID | NOT_SCORING |
| 19 | Espera, desfile y llamada de jueces | Sin RuleID | NOT_SCORING |

`MISSING_RULES = 0` y `MISSING_FIELD_IDS = 0`.

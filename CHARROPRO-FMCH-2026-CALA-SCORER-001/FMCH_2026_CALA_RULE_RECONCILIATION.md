# FMCH 2026 Cala Rule Reconciliation

## Reading key

- Source status `CONFIRMED` means the rule/value is present in the approved FMCH 2026 specification.
- `ADIC*` means the existing `LD/LI/MD/MI/PC` FieldID family; its exact `ML/CR` export equivalence remains blocked.
- `BAD*` means `FMCH.TEAM_SHEET.CALA.BAD_POINT_01..08` plus `BAD_POINTS_TOTAL`; dynamic slot export remains a transformation concern.
- `TOTAL/DQ` means the frozen total and DQ state used by the existing official score/export path.
- Dedicated test: `tests/fmch-2026-cala-scorer.test.mjs` unless another suite is named.

## Rules

| RULE ID | LABEL | CATEGORY | LEGACY VALUE | FMCH 2026 VALUE | SOURCE STATUS | FIELDID | CURRENT HANDLER | ACTION | TEST | NOTES |
| --- | --- | --- | ---: | ---: | --- | --- | --- | --- | --- | --- |
| `cala_base_completa` | Cala completa | base | 20 | 20 | CONFIRMED | `BASE` | point summary | CORRECT | dedicated | Label reconciled; one base only |
| `cala_lado_derecho_velocidad` | Lado derecho: seis o mas vueltas con velocidad | adic | 2 | 2 | CONFIRMED | `LD` | toggle rule | CORRECT | dedicated | Value preserved |
| `cala_lado_derecho_pivote` | Lado derecho: pata de apoyo en una marca | adic | 1 | 1 | CONFIRMED | `LD` | toggle rule | CORRECT | dedicated | Value preserved |
| `cala_lado_izquierdo_velocidad` | Lado izquierdo: seis o mas vueltas con velocidad | adic | 2 | 2 | CONFIRMED | `LI` | toggle rule | CORRECT | dedicated | Value preserved |
| `cala_lado_izquierdo_pivote` | Lado izquierdo: pata de apoyo en una marca | adic | 1 | 1 | CONFIRMED | `LI` | toggle rule | CORRECT | dedicated | Value preserved |
| `cala_medio_derecho` | Medio lado derecho de 180 grados | adic | 1 | 1 | CONFIRMED | `ADIC*` | toggle rule | CORRECT | dedicated/override | Mapping blocked, calculation confirmed |
| `cala_medio_izquierdo` | Medio lado izquierdo de 180 grados | adic | 1 | 1 | CONFIRMED | `ADIC*` | toggle rule | CORRECT | dedicated | Mapping blocked, calculation confirmed |
| `cala_cambio_rectangulo_costado` | Cambio de rectangulo de costado o dando pierna | adic | 1 | 1 | CONFIRMED | `ADIC*` | toggle rule | CORRECT | dedicated | Does not assert `PC` meaning |
| `cala_inf_revision_freno_mas_un_minuto` | Revision de freno mayor a un minuto | infr | N/A | -1 | CONFIRMED | `BAD*` | toggle rule | EXTEND | dedicated | Frozen RuleID/value |
| `cala_inf_revision_freno_mas_dos_minutos` | Revision de freno mayor a dos minutos: punto adicional | infr | N/A | -1 | CONFIRMED | `BAD*` | toggle rule | EXTEND | dedicated | Separate identity |
| `cala_inf_resistirse_enfrenar` | Resistirse a enfrenar | infr | N/A | -1 | CONFIRMED | `BAD*` | toggle rule | EXTEND | dedicated | Frozen RuleID/value |
| `cala_inf_resistirse_estribo` | Resistirse a dar estribo | infr | N/A | -1 | CONFIRMED | `BAD*` | toggle rule | EXTEND | dedicated | Frozen RuleID/value |
| `cala_inf_ingreso_lateral_rectangulo` | Ingreso lateral inicial al rectangulo | infr | N/A | -5 | CONFIRMED | `BAD*` | toggle rule | EXTEND | dedicated | Frozen RuleID/value |
| `cala_inf_dar_espalda_movimiento` | Dar espalda o voltear para iniciar movimiento | infr | N/A | -1 | CONFIRMED | `BAD*` | toggle rule | EXTEND | dedicated | Frozen RuleID/value |
| `cala_inf_patada_una_extremidad` | Patada con una extremidad | infr | -4 | -4 | CONFIRMED | `BAD*` | toggle rule | PRESERVE | dedicated | Existing identity/value |
| `cala_inf_no_saludar_inicio` | No saludar al inicio | infr | N/A | -1 | CONFIRMED | `BAD*` | toggle rule | EXTEND | dedicated | Separate from final salute |
| `cala_inf_no_saludar_final` | No saludar al final | infr | N/A | -1 | CONFIRMED | `BAD*` | toggle rule | EXTEND | dedicated | Separate from initial salute |
| `cala_inf_no_correr_recto_ida` | No correr en linea recta de ida | infr | grouped | -1 | CONFIRMED | `BAD*` | toggle rule | EXTEND | dedicated | Replaces grouped legacy identity |
| `cala_inf_no_correr_recto_regreso` | No correr en linea recta de regreso | infr | grouped | -1 | CONFIRMED | `BAD*` | toggle rule | EXTEND | dedicated | Replaces grouped legacy identity |
| `cala_inf_estrellarse_partidero` | Estrellarse en el partidero | infr | N/A | -4 | CONFIRMED | `BAD*` | toggle rule | EXTEND | dedicated | Frozen RuleID/value |
| `cala_inf_alborotarse` | Alborotarse | infr | -1 | -1 | CONFIRMED | `BAD*` | toggle rule | PRESERVE | dedicated | Existing identity/value |
| `cala_inf_no_poner_en_mano` | No poner totalmente en mano | infr | -1 | -1 | CONFIRMED | `BAD*` | toggle rule | PRESERVE | dedicated | Existing identity/value |
| `cala_inf_arrancar_despues_un_minuto` | Arrancar despues de un minuto | infr | N/A | -1 | CONFIRMED | `BAD*` | toggle rule | EXTEND | dedicated | Frozen RuleID/value |
| `cala_inf_no_desarrollar_velocidad` | No desarrollar velocidad | infr | N/A | -4 | CONFIRMED | `BAD*` | toggle rule | EXTEND | dedicated | Frozen RuleID/value |
| `cala_inf_cuartear_medio_cuerpo` | Cuartear de medio cuerpo hacia delante | infr | N/A | -3 | CONFIRMED | `BAD*` | toggle rule | EXTEND | dedicated | Frozen RuleID/value |
| `cala_inf_parar_sobre_manos` | Parar sobre las manos o cargarse en la rienda | infr | N/A | -2 | CONFIRMED | `BAD*` | toggle rule | EXTEND | dedicated | Frozen RuleID/value |
| `cala_inf_rebasar_90_sin_punta` | Rebasar 90 metros sin punta adicional valida | infr | N/A | -1 | CONFIRMED | `BAD*` | toggle rule | EXTEND | dedicated | Does not impose a meter input max |
| `cala_inf_cuestionar_jueces_una_vez` | Cuestionar a los jueces una vez | infr | N/A | -1 | CONFIRMED | `BAD*` | toggle rule | EXTEND | dedicated | Frozen RuleID/value |
| `cala_inf_cejar_borrar_sin_orden` | Cejar o borrar huellas sin orden | infr | N/A | -1 | CONFIRMED | `BAD*` | toggle rule | EXTEND | dedicated | Frozen RuleID/value |
| `cala_inf_abrir_hocico` | Abrir hocico, excepto en punta | infr | -1 | -1 | CONFIRMED | `BAD*` | toggle rule | PRESERVE | dedicated | Existing identity/value |
| `cala_inf_rabear_espiguear` | Rabear o espiguear | infr | -1 | -1 | CONFIRMED | `BAD*` | toggle rule | PRESERVE | dedicated | Existing identity/value |
| `cala_inf_enjetarse` | Enjetarse | infr | -1 | -1 | CONFIRMED | `BAD*` | toggle rule | PRESERVE | dedicated | Existing identity/value |
| `cala_inf_cachetear` | Cachetear | infr | -1 | -1 | CONFIRMED | `BAD*` | toggle rule | PRESERVE | dedicated | Existing identity/value |
| `cala_inf_estrellar_despapar_gorbetear` | Estrellar, despapar o gorbetear | infr | -1 | -1 | CONFIRMED | `BAD*` | toggle rule | PRESERVE | dedicated | Existing identity/value |
| `cala_inf_freno_fuera_lugar` | Freno fuera de lugar | infr | N/A | -2 | CONFIRMED | `BAD*` | toggle rule | EXTEND | dedicated | Frozen RuleID/value |
| `cala_inf_lados_caminando` | Lado caminando o sin apoyo en cuartos traseros | infr | -2 | -2 each | CONFIRMED | `BAD*` | quantity control | CORRECT | dedicated | Repeatable, max 2 sides |
| `cala_inf_espalda_fin_lado` | Dar espalda al terminar el lado | infr | -5 | -5 each | CONFIRMED | `BAD*` | quantity control | EXTEND | dedicated | Repeatable, max 2 sides |
| `cala_inf_medio_incompleto` | Medio lado menor a 180 grados | infr | -1 | -1 each | CONFIRMED | `BAD*` | quantity control | CORRECT | dedicated | Repeatable, max 2 sides |
| `cala_inf_anticiparse` | Anticiparse mas de 90 grados al mando | infr | -5 | -5 each | CONFIRMED | `BAD*` | quantity control | CORRECT | dedicated | Repeatable by occasion; no invented max |
| `cala_inf_cambiar_mano` | Cambiar de mano durante los ejercicios | infr | -1 | -1 | CONFIRMED | `BAD*` | toggle rule | PRESERVE | dedicated | Existing identity/value |
| `cala_inf_cejar_antes_cambio_rectangulo` | Cejar antes del cambio de rectangulo | infr | N/A | -2 | CONFIRMED | `BAD*` | toggle rule | EXTEND | dedicated | Frozen RuleID/value |
| `cala_inf_ceja_fuera_linea` | Ceja fuera de linea o sin tomar el centro | infr | -1 | -1 | CONFIRMED | `BAD*` | toggle rule | PRESERVE | dedicated | Existing identity/value |
| `cala_inf_soltar_estribo` | Soltar el estribo | infr | N/A | -2 | CONFIRMED | `BAD*` | toggle rule | EXTEND | dedicated | Frozen RuleID/value |
| `cala_inf_mondingo_trote` | Andadura de mondingo o trote | infr | N/A | -1 | CONFIRMED | `BAD*` | toggle rule | EXTEND | dedicated | Frozen RuleID/value |
| `cala_inf_arreo_protector_roto` | Arreo o protector roto o desplazado | infr | N/A | -2 | CONFIRMED | `BAD*` | toggle rule | EXTEND | dedicated | Frozen RuleID/value |
| `cala_inf_perder_cuarta` | Perder la cuarta | infr | N/A | -1 | CONFIRMED | `BAD*` | toggle rule | EXTEND | dedicated | Frozen RuleID/value |
| `cala_inf_sangrado` | Sangrado de hocico, ijares o barbada | infr | -2 | -2 | CONFIRMED | `BAD*` | toggle rule | PRESERVE | dedicated | Existing identity/value |
| `cala_inf_disminuir_velocidad_lado` | Titubear o disminuir velocidad en el lado | infr | -4 | -4 each | CONFIRMED | `BAD*` | quantity control | CORRECT | dedicated | Repeatable, max 2 sides |
| `cala_inf_disminuir_velocidad_ceja` | Disminuir velocidad en la ceja | infr | -4 | -4 | CONFIRMED | `BAD*` | toggle rule | CORRECT | dedicated | Label reconciled |
| `cala_inf_sujetarse_descanso` | Sujetarse durante el descanso | infr | N/A | -2 | CONFIRMED | `BAD*` | toggle rule | EXTEND | dedicated | Frozen RuleID/value |
| `cala_inf_descansar_mano_paso` | Descansar la mano durante el paso natural | infr | N/A | -2 | CONFIRMED | `BAD*` | toggle rule | EXTEND | dedicated | Frozen RuleID/value |
| `cala_equipo_revisor_no_compite` | Revisor de punta que no participa en otra faena | team_infr | -5 | -5 | CONFIRMED | `TEAM_INFRACTION` | team penalty | CORRECT | dedicated | Kept separate from individual bad points |
| `cala_equipo_revisor_entra_rectangulo` | Revisor que ingresa al rectangulo | team_infr | -2 | -2 | CONFIRMED | `TEAM_INFRACTION` | team penalty | CORRECT | dedicated | Kept separate from individual bad points |
| `cala_desc_freno_arreo_prohibido_cambio` | Freno o arreo prohibido o cambio | desc | N/A | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | EXTEND | dedicated | Stable RuleID |
| `cala_desc_entrada_salida_incorrecta` | Entrada o salida incorrecta del rectangulo | desc | N/A | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | EXTEND | dedicated | Stable RuleID |
| `cala_desc_alteracion_cola_crin` | Alteraciones de cola o crin | desc | N/A | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | EXTEND | dedicated | Stable RuleID |
| `cala_desc_competidor_distinto` | Competidor distinto | desc | DQ | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | CORRECT | dedicated | Label reconciled |
| `cala_desc_no_ir_galope` | No ir a galope | desc | N/A | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | EXTEND | dedicated | Stable RuleID |
| `cala_desc_vuelta_fuera_lados` | Dar vuelta fuera de los lados | desc | N/A | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | EXTEND | dedicated | Stable RuleID |
| `cala_desc_reparo` | Caballo repara o se levanta de manos | desc | DQ | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | PRESERVE | dedicated | Existing identity |
| `cala_desc_punta_antes_60_parar_antes_70` | Punta antes de 60 metros o parar antes de 70 metros | desc | N/A | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | EXTEND | dedicated | Stable RuleID |
| `cala_desc_negativa_enfrenar_estribar` | Negativa a enfrenar o estribar | desc | N/A | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | EXTEND | dedicated | Stable RuleID |
| `cala_desc_salirse_rectangulo` | Salirse del rectangulo | desc | DQ | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | PRESERVE | dedicated | Existing identity |
| `cala_desc_no_parar_llamado` | No parar al llamado | desc | N/A | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | EXTEND | dedicated | Stable RuleID |
| `cala_desc_no_cambio_rectangulo` | No cambiar de rectangulo | desc | DQ | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | CORRECT | dedicated | Label reconciled |
| `cala_desc_caida_caballo` | Caida del caballo | desc | DQ | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | PRESERVE | dedicated | Existing identity |
| `cala_desc_caida_jinete` | Caida del jinete | desc | DQ | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | PRESERVE | dedicated | Existing identity |
| `cala_desc_apearse` | Apearse el jinete | desc | DQ | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | CORRECT | dedicated | Label reconciled |
| `cala_desc_segunda_discusion` | Segunda discusion | desc | N/A | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | EXTEND | dedicated | Stable RuleID |
| `cala_desc_cuarta_ausente_mal_ubicada` | Cuarta ausente o mal ubicada | desc | N/A | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | EXTEND | dedicated | Stable RuleID |
| `cala_desc_cadenilla_incorrecta` | Cadenilla incorrecta | desc | N/A | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | EXTEND | dedicated | Stable RuleID |
| `cala_desc_abrir_manquear_rienda` | Abrir o manquear la rienda | desc | DQ | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | PRESERVE | dedicated | Existing identity |
| `cala_desc_apoyo_evitar_caida` | Apoyarse para evitar la caida | desc | N/A | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | EXTEND | dedicated | Stable RuleID |
| `cala_desc_faena_incompleta_negativa` | Faena incompleta o negativa a ejecutarla | desc | two legacy IDs | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | CORRECT | dedicated | Official combined identity |
| `cala_desc_romper_secuencia` | Romper la secuencia o repetir un movimiento | desc | DQ | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | CORRECT | dedicated | Label reconciled |
| `cala_desc_dos_manos` | Usar dos manos | desc | DQ | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | PRESERVE | dedicated | Existing identity |
| `cala_desc_caballo_otro_equipo_fase` | Caballo presentado por otro equipo en la misma fase | desc | N/A | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | EXTEND | dedicated | Stable RuleID |
| `cala_desc_dos_minutos` | Rebasar dos minutos sin arrancar | desc | DQ | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | PRESERVE | dedicated | Existing identity |
| `cala_desc_no_cejar_60m` | No cejar hasta la linea de 60 metros | desc | DQ | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | PRESERVE | dedicated | Existing identity |
| `cala_desc_remendar_arreo` | Remendar el arreo | desc | N/A | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | EXTEND | dedicated | Stable RuleID |
| `cala_desc_no_galope_despues_20m` | No ir a galope despues de 20 metros | desc | N/A | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | EXTEND | dedicated | Stable RuleID |
| `cala_desc_adelanto_ceja_mas_90` | Adelantarse mas de 90 grados en la ceja | desc | N/A | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | EXTEND | dedicated | Stable RuleID |
| `cala_desc_persona_rectangulos` | Personas cerca de los rectangulos | desc | DQ | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | CORRECT | dedicated | Label reconciled |
| `cala_desc_no_volver_frente` | No volver de frente | desc | N/A | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | EXTEND | dedicated | Stable RuleID |
| `cala_desc_presentador_diferente` | Presentador diferente | desc | N/A | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | EXTEND | dedicated | Stable RuleID |
| `cala_desc_salida_incorrecta_revision` | Salida incorrecta despues de la revision del freno | desc | N/A | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | EXTEND | dedicated | Stable RuleID |
| `cala_desc_cambio_freno_caballo` | Cambio de freno o cabalgadura | desc | DQ | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | CORRECT | dedicated | Label reconciled |
| `cala_desc_patada_doble` | Patada con ambas extremidades | desc | DQ | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | PRESERVE | dedicated | Existing identity |
| `cala_desc_retirarse_ruedo_revision` | Retirarse del ruedo despues de la revision | desc | N/A | DQ | CONFIRMED | `TOTAL/DQ` | DQ selector | EXTEND | dedicated | Stable RuleID |

## Legacy identities retained but removed from effective FMCH profile

| RULE ID | LABEL | CATEGORY | LEGACY VALUE | FMCH 2026 VALUE | SOURCE STATUS | FIELDID | CURRENT HANDLER | ACTION | TEST | NOTES |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `cala_inf_no_correr_recto` | No correr en linea recta | infr | -1 grouped | disabled | LEGACY_PRESERVED_DISABLED | N/A | profile resolver | REMOVE_FROM_EFFECTIVE_PROFILE | rule-profile | Replaced by ida and regreso identities |
| `cala_desc_faena_incompleta` | No completar la faena | desc | DQ | disabled | LEGACY_PRESERVED_DISABLED | N/A | profile resolver | REMOVE_FROM_EFFECTIVE_PROFILE | rule-profile | Replaced by combined official identity |
| `cala_desc_negarse_movimiento` | Negarse a ejecutar un movimiento | desc | DQ | disabled | LEGACY_PRESERVED_DISABLED | N/A | profile resolver | REMOVE_FROM_EFFECTIVE_PROFILE | rule-profile | Replaced by combined official identity |

## Specialized controls

| RULE ID | LABEL | CATEGORY | LEGACY VALUE | FMCH 2026 VALUE | SOURCE STATUS | FIELDID | CURRENT HANDLER | ACTION | TEST | NOTES |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `cala_punta_metros` | Metros de Punta | calculator input | numeric integer UI | decimal, no max | CONFIRMED | `METERS` | Punta input/quick controls | CORRECT | cala-rules/dedicated | Raw and effective meters frozen |
| `cala_punta_tiempos` | Tiempos de Punta | calculator input | 1..4 controls | 1..4 scoring | CONFIRMED | `TIMES` | Punta quick controls | PRESERVE | cala-rules/dedicated | Existing control preserved |
| `cala_punta_resultado` | Resultado de Punta | calculator | existing specialized formula | 6 m minimum; centimeter threshold; time bonus | CONFIRMED | `P/T/TOTAL` | `calculatePuntaBreakdown` | CORRECT | cala-rules/dedicated | No duplicate formula in profile |
| `manual_adic` | Adicional manual | manual | available | available | PRESERVED_CONTRACT | frozen breakdown | existing manual handler | PRESERVE | scorer/Attempt V2 | Requires value and reason |
| `manual_infr` | Infraccion manual | manual | available | available | PRESERVED_CONTRACT | `BAD*` transformation | existing manual handler | PRESERVE | scorer/Attempt V2 | Requires value and reason |
| `timeEvidence` | Evidencia de tiempo | evidence | available | unchanged | PRESERVED_CONTRACT | official score evidence | existing evidence handler | PRESERVE | responsive/publication | Does not alter points |
| `attempt.note` | Nota del juez | note | available | unchanged | PRESERVED_CONTRACT | official score note | existing note handler | PRESERVE | Attempt V2/publication | Does not alter points |
| `attempt.zeroed` | Marcar 0 | state | available | unchanged | PRESERVED_CONTRACT | official status | `toggleAttemptZero` | PRESERVE | scorer regression | Distinct from DQ |
| `attempt.descRuleId` | Descalificacion | state | label only | stable RuleID plus legacy label | CONFIRMED | `TOTAL/DQ` | DQ selector | CORRECT | dedicated | Reversible in draft |
| `footer.connection` | Estado de conexion | footer | available | unchanged | FROZEN_BASELINE | N/A | scorer footer | PRESERVE | responsive | No function change |
| `footer.adjust` | Ajustar botonera | footer | available | unchanged | FROZEN_BASELINE | N/A | scorer footer | PRESERVE | responsive | No function change |
| `footer.previous` | Deshacer | footer | `previousScore()` | unchanged | FROZEN_BASELINE | N/A | `previousScore` | PRESERVE | responsive | Not redefined as sports undo |
| `footer.zero` | Marcar 0 | footer | available | unchanged | FROZEN_BASELINE | official status | `toggleAttemptZero` | PRESERVE | responsive | Distinct from DQ |
| `footer.next` | Guardar y siguiente | footer | publish then advance | unchanged | FROZEN_BASELINE | official publication | `nextScore` | PRESERVE | publication suites | Does not advance on failure |

## Reconciliation outcome

The confirmed sports catalog is technically complete. Exact exporter equivalence for the blocked printed controls is intentionally absent. That boundary blocks sporting certification and profile activation, not calculation or operational validation.

export const FMCH_2026_MANGANAS_PASO_RULEBOOK_VERSION = "fmch_2026_manganas_paso_0.6.0";
export const FMCH_2026_MANGANAS_PASO_SOURCE = "CHARROPRO-FMCH-2026-SCORING-SPECIFICATION-001";
export const FMCH_2026_MANGANAS_DURATION_MS = 7 * 60 * 1000;
export const FMCH_2026_MANGANAS_OPPORTUNITY_LIMIT = 3;
export const FMCH_2026_PASO_EXIT_DURATION_MS = 3 * 60 * 1000;
export const FMCH_2026_PASO_DISMOUNT_DURATION_MS = 60 * 1000;

const META = Object.freeze({ source: FMCH_2026_MANGANAS_PASO_SOURCE });

export const FMCH_2026_MANGANAS_PIE_BASE_RULES = freezeRules([
  rule("manganas_pie_base_sencilla_pasada", "Sencilla con pasada", 10, { remateFamily: "SENCILLA" }),
  rule("manganas_pie_base_floreada_pasada", "Floreada con pasada", 10, { remateFamily: "FLOREADA" })
]);

export const FMCH_2026_MANGANAS_PIE_REMATE_RULES = freezeRules([
  rule("manganas_pie_adic_remate_desden", "Desdén", 1, { remate: true }),
  rule("manganas_pie_adic_remate_contra_desden", "Contra desdén", 1, { remate: true }),
  rule("manganas_pie_adic_remate_encontrada", "Encontrada", 1, { remate: true })
]);

export const FMCH_2026_MANGANAS_PIE_FLOREO_DETAIL_RULES = freezeRules([
  rule("manganas_pie_floreo_pasadas_2_3", "Dos o tres pasadas", 1),
  rule("manganas_pie_floreo_pasadas_4_mas", "Cuatro o más pasadas", 2),
  rule("manganas_pie_floreo_relampago", "Relámpago o medio efecto", 1),
  rule("manganas_pie_floreo_arracada", "Arracada", 1),
  rule("manganas_pie_floreo_resorte", "Resorte sencillo", 1),
  rule("manganas_pie_floreo_giro_mismo", "Giro al mismo sentido", 2),
  rule("manganas_pie_floreo_giro_contrario", "Giro al sentido contrario", 3),
  rule("manganas_pie_floreo_espejo", "Espejo", 1),
  rule("manganas_pie_floreo_movimiento_especificado", "Movimiento especificado", 1),
  rule("manganas_pie_floreo_movimiento_no_especificado", "Movimiento no especificado", 1),
  rule("manganas_pie_floreo_giro_180", "Giro de 180 grados", 1),
  rule("manganas_pie_floreo_cambio_mano", "Cambio de mano", 1)
]);

export const FMCH_2026_MANGANAS_PIE_ADIC_RULES = freezeRules([
  ...FMCH_2026_MANGANAS_PIE_REMATE_RULES,
  rule("manganas_pie_adic_chorrear_soltando", "Chorrear soltando", 1),
  rule("manganas_pie_adic_girando_sin_soltar", "Girar sin soltar", 2),
  rule("manganas_pie_adic_ahorcado", "Ahorcado", 3),
  rule("manganas_pie_adic_muerte", "Muerte", 3),
  rule("manganas_pie_adic_pie_tobillo_cintura", "Un pie al tobillo y otro desde cintura", 1),
  rule("manganas_pie_adic_tiempo_no_usado", "Minuto completo no utilizado", 1, automatic({ repeatable: true, maxQuantity: 7 }))
]);

export const FMCH_2026_MANGANAS_PIE_INFR_RULES = freezeRules([
  rule("manganas_pie_infr_atuendo_practica", "Componer atuendo o practicar", 2),
  rule("manganas_pie_infr_apisonar", "Apisonar", 2),
  rule("manganas_pie_infr_floreo_defectuoso", "Floreo defectuoso", 1, { repeatable: true }),
  rule("manganas_pie_infr_tiron_flecha", "Tirón de flecha", 1),
  rule("manganas_pie_infr_un_pie_linea", "Un pie cruza la línea de cuatro metros", 4),
  rule("manganas_pie_infr_desplazarse", "Desplazarse más de un paso", 2),
  rule("manganas_pie_infr_no_estirar", "No estirar", 2),
  rule("manganas_pie_infr_seguir_dos_pasos", "Seguir más de dos pasos", 2),
  rule("manganas_pie_infr_estirar_sin_mangana", "Estirar sin mangana", 2),
  rule("manganas_pie_infr_apoyar_mano_rodilla", "Apoyar mano o rodilla", 2),
  rule("manganas_pie_infr_hocico", "Mangana en hocico", 2),
  rule("manganas_pie_infr_sobre_lomo", "Mangana sobre el lomo", 2),
  rule("manganas_pie_infr_hocico_caer", "Hocico al caer", 2),
  rule("manganas_pie_infr_caer_lazador", "Caída del lazador", 3),
  rule("manganas_pie_infr_panza_sentada", "Panza o sentada", 4),
  rule("manganas_pie_infr_segundo_tiron", "Segundo tirón", 2, automatic()),
  rule("manganas_pie_infr_tercer_tiron_total", "Tercer tirón, total acumulado", 4, automatic()),
  rule("manganas_pie_infr_perder_reata", "Perder la reata", 6),
  rule("manganas_pie_infr_gente_pie", "Gente a pie", 2, { repeatable: true }),
  rule("manganas_pie_infr_minuto_7", "Mangana puesta en minuto siete", 3, automatic()),
  rule("manganas_pie_infr_camino", "Derribo en camino", 4),
  rule("manganas_pie_infr_chorreada_cuadril", "Fallar chorreada de cuadril", 2),
  rule("manganas_pie_infr_vuelta_tanteo", "Vuelta de tanteo", 6),
  rule("manganas_pie_infr_ahorcado_descompone", "Ahorcado levanta o descompone", 3)
]);

export const FMCH_2026_MANGANAS_PIE_TEAM_PENALTY_RULES = freezeRules([
  rule("manganas_pie_team_arreadores_practican", "Arreadores practican", 2, { scope: "team" }),
  rule("manganas_pie_team_no_devolver", "No devolver la yegua", 2, { scope: "team" }),
  rule("manganas_pie_team_mover_yegua_cambio", "Mover la yegua durante el cambio", 6, { scope: "team" }),
  rule("manganas_pie_team_personas_puertas_bardas", "Personas en puertas o bardas", 2, { scope: "team", repeatable: true })
]);

export const FMCH_2026_MANGANAS_PIE_DESC_RULES = freezeRules([
  dq("manganas_pie_desc_sin_pasada", "Sin pasada"),
  dq("manganas_pie_desc_dos_pies_linea", "Dos pies cruzan la línea de cuatro metros"),
  dq("manganas_pie_desc_cruzar_barda", "Cruzar hacia la barda"),
  dq("manganas_pie_desc_arreadores_tapan", "Arreadores tapan"),
  dq("manganas_pie_desc_no_rematar_tercera_pasada", "No rematar a la tercera pasada"),
  dq("manganas_pie_desc_repetir_remate", "Repetir remate"),
  dq("manganas_pie_desc_arreadores_derriban", "Arreadores derriban"),
  dq("manganas_pie_desc_rotura", "Rotura"),
  dq("manganas_pie_desc_perder_reata", "Perder la reata", { preservesPenaltyRuleId: "manganas_pie_infr_perder_reata" }),
  dq("manganas_pie_desc_derribo_tercer_tiron", "Derribo después del tercer tirón"),
  dq("manganas_pie_desc_perder_continuidad", "Perder continuidad"),
  dq("manganas_pie_desc_tiempo_agotado", "Tiempo mayor a siete minutos")
]);

export const FMCH_2026_MANGANAS_CABALLO_BASE_RULES = freezeRules([
  ...baseGroup(10, ["Máscara", "Loro", "Gavilán"]),
  ...baseGroup(12, ["Rodada", "Morena", "Bigotona", "Contra loro", "Contra gavilán"]),
  ...baseGroup(13, ["Desdén en rodada", "Desdén en morena", "Desdén en bigotona", "Contra rodada", "Contra morena", "Contra bigotona"]),
  rule("manganas_caballo_base_espalda_yegua", "Espalda a la yegua", 14, { remate: true }),
  rule("manganas_caballo_base_contra_mascara", "Contra máscara", 14, {
    remate: true,
    sourceStatus: "CONFIRMED",
    sourceItem: "USI-003",
    sourceResolution: "SINGLE_CANONICAL_SPORTING_IDENTITY",
    officialSourceArticle: 217,
    officialSourcePage: 89,
    duplicatePrintedIdentityCollapsed: true,
    simultaneousDuplicateSelectionAllowed: false
  }),
  rule("manganas_caballo_base_mascara_ancas_muro", "Máscara con ancas al muro", 14, { remate: true }),
  rule("manganas_caballo_base_contra_desden", "Contra desdén", 16, { remate: true }),
  rule("manganas_caballo_base_desden_contra_mascara", "Desdén en contra máscara", 16, { remate: true }),
  rule("manganas_caballo_base_centenario", "Centenario", 16, { remate: true, blocksFloreo: true })
]);

export const FMCH_2026_MANGANAS_CABALLO_FLOREO_DETAIL_RULES = freezeRules([
  rule("manganas_caballo_floreo_resorte", "Resorte sencillo", 1),
  rule("manganas_caballo_floreo_arracada", "Arracada", 1),
  rule("manganas_caballo_floreo_giro_mismo", "Giro al mismo sentido", 2),
  rule("manganas_caballo_floreo_giro_contrario", "Giro al sentido contrario", 3),
  rule("manganas_caballo_floreo_incluir_cabeza", "Incluir cabeza", 4),
  rule("manganas_caballo_floreo_sostenido_cabeza", "Sostenido incluyendo cabeza", 5, { substitutes: "manganas_caballo_floreo_incluir_cabeza" }),
  rule("manganas_caballo_floreo_espejo", "Espejo", 1),
  rule("manganas_caballo_floreo_no_especificado", "Movimiento no especificado", 1),
  rule("manganas_caballo_floreo_especificado", "Movimiento especificado", 1),
  rule("manganas_caballo_floreo_pararse_pasadas", "Pararse y pasadas", 1),
  rule("manganas_caballo_floreo_cambio_mano", "Cambio de mano", 1)
]);

export const FMCH_2026_MANGANAS_CABALLO_ADIC_RULES = freezeRules([
  rule("manganas_caballo_adic_encontrada", "Encontrada", 1),
  rule("manganas_caballo_adic_tiempo_no_usado", "Minuto completo no utilizado", 1, automatic({ repeatable: true, maxQuantity: 7 }))
]);

export const FMCH_2026_MANGANAS_CABALLO_INFR_RULES = freezeRules([
  rule("manganas_caballo_infr_floreo_defectuoso", "Floreo defectuoso", 1, { repeatable: true }),
  rule("manganas_caballo_infr_gente_pie", "Gente a pie", 2, { repeatable: true }),
  rule("manganas_caballo_infr_vuelta_extra_una", "Una vuelta extra", 1),
  rule("manganas_caballo_infr_vuelta_extra_dos", "Dos o más vueltas extra", 2),
  rule("manganas_caballo_infr_estirar_sin_mangana", "Estirar sin mangana", 2),
  rule("manganas_caballo_infr_no_estirar", "No estirar o remachar", 2),
  rule("manganas_caballo_infr_fallar_vueltas", "Fallar vueltas", 2),
  rule("manganas_caballo_infr_desplazarse", "Desplazarse más de dos pasos", 2),
  rule("manganas_caballo_infr_seguir_yegua", "Seguir la yegua", 4),
  rule("manganas_caballo_infr_sobre_lomo", "Mangana sobre el lomo", 2),
  rule("manganas_caballo_infr_hocico", "Mangana en hocico", 2),
  rule("manganas_caballo_infr_hocico_caida", "Caída de hocico", 2),
  rule("manganas_caballo_infr_panza_sentada", "Panza o sentada", 4),
  rule("manganas_caballo_infr_segundo_tiron", "Segundo tirón", 2, automatic()),
  rule("manganas_caballo_infr_tercer_tiron_total", "Tercer tirón, total acumulado", 4, automatic()),
  rule("manganas_caballo_infr_perder_reata", "Perder la reata", 6),
  rule("manganas_caballo_infr_caballo_espaldas_primer_tiron", "Caballo de espaldas en primer tirón", 6),
  rule("manganas_caballo_infr_caballo_espaldas_otro_tiron", "Caballo de espaldas en segundo o tercer tirón", 2),
  rule("manganas_caballo_infr_vuelta_tanteo", "Vuelta de tanteo", 6),
  rule("manganas_caballo_infr_cabrestear_caballo", "Cabrestear caballo", 2),
  rule("manganas_caballo_infr_un_casco_linea", "Un casco cruza la línea de cuatro metros", 4),
  rule("manganas_caballo_infr_minuto_7", "Mangana puesta en minuto siete", 3, automatic()),
  rule("manganas_caballo_infr_camino", "Derribo en camino", 4)
]);

export const FMCH_2026_MANGANAS_CABALLO_TEAM_PENALTY_RULES = freezeRules([
  rule("manganas_caballo_team_arreadores_practican", "Arreadores practican", 2, { scope: "team" }),
  rule("manganas_caballo_team_no_devolver", "No devolver la yegua", 2, { scope: "team" }),
  rule("manganas_caballo_team_personas_puertas_bardas", "Personas en puertas o bardas", 2, { scope: "team", repeatable: true })
]);

export const FMCH_2026_MANGANAS_CABALLO_DESC_RULES = freezeRules([
  dq("manganas_caballo_desc_cascos_linea", "Más de un casco cruza la línea de cuatro metros"),
  dq("manganas_caballo_desc_cruzar_barda", "Cruzar hacia la barda"),
  dq("manganas_caballo_desc_arreadores_tapan", "Arreadores tapan"),
  dq("manganas_caballo_desc_arreadores_derriban", "Arreadores derriban"),
  dq("manganas_caballo_desc_no_rematar_tercera_pasada", "No rematar a la tercera pasada"),
  dq("manganas_caballo_desc_repetir_remate", "Repetir remate"),
  dq("manganas_caballo_desc_vueltas_entrepierna", "Vueltas en la entrepierna"),
  dq("manganas_caballo_desc_rotura", "Rotura"),
  dq("manganas_caballo_desc_derribo_tercer_tiron", "Derribo después del tercer tirón"),
  dq("manganas_caballo_desc_tiempo_agotado", "Tiempo mayor a siete minutos"),
  dq("manganas_caballo_desc_perder_continuidad", "Perder continuidad"),
  dq("manganas_caballo_desc_perder_reata", "Perder la reata", { preservesPenaltyRuleId: "manganas_caballo_infr_perder_reata" }),
  dq("manganas_caballo_desc_no_remachar", "No remachar"),
  dq("manganas_caballo_desc_no_montado", "No estar montado, salvo Centenario"),
  dq("manganas_caballo_desc_caida_caballo", "Caída del caballo")
]);

export const FMCH_2026_PASO_CLASSIFICATIONS = freezeRules([
  { id: "EXCELENTE", label: "Excelente", value: null, metadata: META },
  { id: "BUENA", label: "Buena", value: null, metadata: META },
  { id: "REGULAR", label: "Regular", value: null, metadata: META },
  { id: "MINIMA", label: "Mínima", value: null, metadata: META }
]);

export const FMCH_2026_PASO_BASE_RULES = freezeRules([
  rule("paso_base_primera_vuelta", "Primera vuelta", 20, { vuelta: 1 }),
  rule("paso_base_segunda_vuelta", "Segunda vuelta", 15, { vuelta: 2 }),
  rule("paso_base_yegua_parada", "Yegua parada, caminando o trotando", 5, { vuelta: 1, noDistance: true, blocksDynamic: true })
]);

const PASO_MATRIX = Object.freeze({
  SIN_ARREO: matrix4(6, 4, 2, 1),
  CON_ARREO: matrix4(2, 2, 0, 0),
  CUARTEAR_SIN_ARREO: matrix4(3, 2, 1, 0),
  CUARTEAR_CON_ARREO: matrix4(2, 1, 0, 0),
  APEARSE_OREJA_PIERNA: matrix4(1, 1, 0, 0),
  LEVANTARSE_SIN_AYUDA: matrix4(2, 1, 0, 0),
  DESCOMPONERSE: matrix4(0, 1, 2, 3)
});

export const FMCH_2026_PASO_ADIC_RULES = freezeRules([
  dynamicRule("paso_adic_sin_arreo", "Sin arreo", PASO_MATRIX.SIN_ARREO, { exclusiveGroup: "paso_arreo" }),
  dynamicRule("paso_adic_con_arreo", "Con arreo", PASO_MATRIX.CON_ARREO, { exclusiveGroup: "paso_arreo" }),
  dynamicRule("paso_adic_cuartear_sin_arreo", "Cuartear sin arreo", PASO_MATRIX.CUARTEAR_SIN_ARREO, { exclusiveGroup: "paso_arreo", requiresTwoCuartazos: true }),
  dynamicRule("paso_adic_cuartear_con_arreo", "Cuartear con arreo", PASO_MATRIX.CUARTEAR_CON_ARREO, { exclusiveGroup: "paso_arreo", requiresTwoCuartazos: true }),
  dynamicRule("paso_adic_apearse_oreja_pierna", "Apearse por oreja o pierna", PASO_MATRIX.APEARSE_OREJA_PIERNA),
  dynamicRule("paso_adic_levantarse_sin_ayuda", "Levantarse sin ayuda", PASO_MATRIX.LEVANTARSE_SIN_AYUDA),
  rule("paso_adic_distancia_primer_cuarto", "Distancia: primer cuarto", 3, allowedFirstVuelta()),
  rule("paso_adic_distancia_segundo_cuarto", "Distancia: segundo cuarto", 2, allowedFirstVuelta()),
  rule("paso_adic_distancia_tercer_cuarto", "Distancia: tercer cuarto", 1, allowedFirstVuelta())
]);

export const FMCH_2026_PASO_INFR_RULES = freezeRules([
  dynamicRule("paso_infr_descomponerse", "Descomponerse", PASO_MATRIX.DESCOMPONERSE),
  rule("paso_infr_arreador_sin_cuarta", "Arreador sin cuarta", 2, { repeatable: true, maxQuantity: 2 }),
  rule("paso_infr_mala_posicion_brinco", "Mala posición del brinco", 2),
  rule("paso_infr_espuelas_verijas", "Espuelas en verijas", 2),
  rule("paso_infr_sangrado", "Sangrado", 2),
  rule("paso_infr_desmonte_tardio", "Desmonte después del primer minuto", 1, automatic({ repeatable: true })),
  rule("paso_infr_no_quedar_pie", "No quedar de pie", 1),
  rule("paso_infr_atuendo", "Atuendo perdido", 1),
  rule("paso_infr_no_brincar", "No brincar o permanecer en el manso", 2),
  rule("paso_infr_puerta_cierra", "La puerta se cierra", 4),
  rule("paso_infr_cuarta_no_mano", "Cuarta no va en la mano", 4),
  rule("paso_infr_arreador_invade", "Arreador invade carril o quita velocidad", 6),
  rule("paso_infr_destroncar_15m", "Destroncar de quince metros al primer cuarto", 6),
  rule("paso_infr_sogueo_golpe", "Sogueo o golpe excesivo", 5),
  rule("paso_infr_no_soltarse", "No soltarse de la rienda o manso dentro de dos trancos", 4),
  rule("paso_infr_no_intentar", "No intentar la faena", 10)
]);

export const FMCH_2026_PASO_TEAM_PENALTY_RULES = freezeRules([
  rule("paso_team_no_devolver", "No devolver la yegua", 2, { scope: "team" })
]);

export const FMCH_2026_PASO_DESC_RULES = freezeRules([
  ...[
    ["destroncar_manosear", "Destroncar o manosear"], ["cuarta_ausente_corta", "Cuarta ausente o corta"],
    ["pegamento", "Uso de pegamento"], ["espuelas_prohibidas", "Espuelas prohibidas"],
    ["no_recibir_puerta", "No recibir a puerta"], ["caida_manso", "Caída del manso"],
    ["sentido_continuidad", "Sentido o continuidad incorrecta"], ["yegua_sale_debajo", "La yegua sale por debajo"],
    ["pechazo_inclinacion", "Pechazo o inclinación indebida"], ["tapar_reparos", "Tapar reparos"],
    ["ayuda_fisica", "Ayuda física"], ["apoyo_ayuda", "Apoyo o ayuda"],
    ["salida_mas_3_min", "Salida completa mayor a tres minutos"], ["tercera_vuelta", "Después de la segunda vuelta"],
    ["encajonar_desmontar", "Encajonar para desmontar"], ["caida_desmonte", "Caída o desmonte"],
    ["irse_lado", "Irse de lado"], ["tanteo_15m", "Tanteo mayor a quince metros"],
    ["cuarta_amarrada", "Cuarta amarrada"], ["cara_atras", "Cara atrás o no estar a horcajadas"],
    ["quitar_reparos", "Quitar reparos"], ["destroncar_despues_cuarto", "Destroncar después del primer cuarto"],
    ["no_pie_primero", "No poner pie primero"], ["yegua_herrada", "Yegua herrada"],
    ["sombrero", "Sombrero no permitido"], ["pasador_chaleco", "Pasador o chaleco no permitido"],
    ["apearse_antes", "Apearse antes"], ["caida_caballo", "Caída del caballo"],
    ["lesion_cabalgadura", "Lesión de cabalgadura después de la salida"]
  ].map(([id, label]) => dq(`paso_desc_${id}`, label))
]);

export const FMCH_2026_MANGANAS_PIE_DISABLED_LEGACY_RULES = freezeDisabled([
  ["base", "mpb1"], ["base", "mpb2"], ["base", "mpb3"], ["base", "mpb4"],
  ["adic", "mpa1"], ["adic", "mpa2"], ["adic", "mpa3"], ["adic", "mpa4"], ["adic", "mpa5"], ["adic", "mpa6"], ["adic", "mpa7"],
  ["infr", "mpi1"], ["infr", "mpi2"], ["infr", "mpi3"], ["desc", "mpd1"]
]);
export const FMCH_2026_MANGANAS_CABALLO_DISABLED_LEGACY_RULES = freezeDisabled([
  ["base", "mcb1"], ["base", "mcb2"], ["base", "mcb3"], ["base", "mcb4"],
  ["adic", "mca1"], ["adic", "mca2"], ["adic", "mca3"], ["adic", "mca4"], ["adic", "mca5"], ["adic", "mca6"], ["adic", "mca7"],
  ["infr", "mci1"], ["infr", "mci2"], ["infr", "mci3"], ["desc", "mcd1"]
]);
export const FMCH_2026_PASO_DISABLED_LEGACY_RULES = freezeDisabled([
  ["base", "pab1"], ["base", "pab2"], ["adic", "paa1"], ["adic", "paa2"], ["adic", "paa3"], ["adic", "paa4"], ["adic", "paa5"],
  ["infr", "pai1"], ["infr", "pai2"], ["desc", "pad1"], ["desc", "pad2"]
]);

export function isFmch2026ManganaSuerte(suerteId) {
  return suerteId === "manganas_pie" || suerteId === "manganas_caballo";
}

export function isFmch2026PasoSuerte(suerteId) {
  return suerteId === "paso";
}

export function getFmch2026ManganaFloreoRules(suerteId) {
  return suerteId === "manganas_pie"
    ? FMCH_2026_MANGANAS_PIE_FLOREO_DETAIL_RULES
    : suerteId === "manganas_caballo" ? FMCH_2026_MANGANAS_CABALLO_FLOREO_DETAIL_RULES : [];
}

export function reconcileFmch2026ManganaAttempt(attempt = {}, suerte = {}) {
  if (!isFmch2026ManganaSuerte(suerte?.id)) return cloneAttempt(attempt);
  const next = cloneAttempt(attempt);
  next.floreoTotal = nonNegative(next.floreoTotal);
  next.floreoDetail = normalizeFloreoDetail(next.floreoDetail, suerte.id);
  next.pullCount = Math.min(3, nonNegativeInteger(next.pullCount));
  next.manganaResult = normalizeResult(next.manganaResult, next);
  next.floreoSource = FMCH_2026_MANGANAS_PASO_SOURCE;
  next.applied = uniqueStrings(next.applied);
  next.ruleQuantities = { ...(next.ruleQuantities || {}) };
  const prefix = suerte.id;
  setRuleQuantity(next, `${prefix}_infr_segundo_tiron`, next.pullCount === 2 ? 1 : 0);
  setRuleQuantity(next, `${prefix}_infr_tercer_tiron_total`, next.pullCount >= 3 ? 1 : 0);
  if (next.pullCount >= 3) setRuleQuantity(next, `${prefix}_infr_segundo_tiron`, 0);
  const selectedBase = (suerte.catalog?.base || []).find((item) => next.applied.includes(item.id));
  const blocksFloreo = selectedBase?.metadata?.blocksFloreo === true;
  next.floreoScoredTotal = blocksFloreo ? 0 : next.floreoTotal;
  next.adic = catalogTotal(next, suerte.catalog?.adic) + next.floreoScoredTotal + manualTotal(next.customAdic);
  next.infr = catalogTotal(next, suerte.catalog?.infr) + manualTotal(next.customInfr);
  return next;
}

export function setFmch2026ManganaFloreoTotal(attempt = {}, suerte = {}, total = 0) {
  const next = cloneAttempt(attempt);
  next.floreoTotal = Math.min(99, nonNegativeInteger(total));
  next.floreoSource = FMCH_2026_MANGANAS_PASO_SOURCE;
  return reconcileFmch2026ManganaAttempt(next, suerte);
}

export function toggleFmch2026ManganaFloreoDetail(attempt = {}, suerte = {}, ruleId = "") {
  const next = cloneAttempt(attempt);
  const ruleItem = getFmch2026ManganaFloreoRules(suerte?.id).find((item) => item.id === ruleId);
  if (!ruleItem) return reconcileFmch2026ManganaAttempt(next, suerte);
  const current = new Set((next.floreoDetail || []).map((item) => item.selectedRuleId || item.ruleId));
  if (current.has(ruleId)) current.delete(ruleId);
  else current.add(ruleId);
  next.floreoDetail = [...current].map((id) => {
    const item = getFmch2026ManganaFloreoRules(suerte.id).find((candidate) => candidate.id === id);
    return { selectedRuleId: id, label: item?.label || id, resolvedValue: Number(item?.pts || 0), source: FMCH_2026_MANGANAS_PASO_SOURCE };
  });
  return reconcileFmch2026ManganaAttempt(next, suerte);
}

export function setFmch2026ManganaResult(attempt = {}, suerte = {}, result = "NOT_ACHIEVED") {
  const next = cloneAttempt(attempt);
  next.manganaResult = result === "ACHIEVED" ? "ACHIEVED" : result === "NOT_ACHIEVED" ? "NOT_ACHIEVED" : "NOT_STARTED";
  next.attempted = next.manganaResult !== "NOT_STARTED";
  next.notAchieved = next.manganaResult === "NOT_ACHIEVED";
  return reconcileFmch2026ManganaAttempt(next, suerte);
}

export function setFmch2026ManganaPullCount(attempt = {}, suerte = {}, pullCount = 0) {
  const next = cloneAttempt(attempt);
  next.pullCount = Math.min(3, nonNegativeInteger(pullCount));
  return reconcileFmch2026ManganaAttempt(next, suerte);
}

export function setFmch2026ManganaRemate(attempt = {}, suerte = {}, remateId = "") {
  const next = cloneAttempt(attempt);
  const pool = suerte.id === "manganas_pie" ? FMCH_2026_MANGANAS_PIE_REMATE_RULES : (suerte.catalog?.base || []);
  const remate = pool.find((item) => item.id === remateId);
  if (!remate) return reconcileFmch2026ManganaAttempt(next, suerte);
  next.remateId = remate.id;
  next.remateLabel = remate.label;
  next.remateMetadata = { source: FMCH_2026_MANGANAS_PASO_SOURCE, rulebookVersion: FMCH_2026_MANGANAS_PASO_RULEBOOK_VERSION };
  if (suerte.id === "manganas_pie") {
    FMCH_2026_MANGANAS_PIE_REMATE_RULES.forEach((item) => setRuleQuantity(next, item.id, item.id === remate.id ? 1 : 0));
  }
  return reconcileFmch2026ManganaAttempt(next, suerte);
}

export function buildFmch2026ManganaRemateHistory(attempts = []) {
  return (Array.isArray(attempts) ? attempts : []).slice(0, FMCH_2026_MANGANAS_OPPORTUNITY_LIMIT).map((attempt, index) => ({
    opportunityNumber: index + 1,
    remateId: attempt?.remateId || null,
    remateLabel: attempt?.remateLabel || null,
    status: attempt?.desc ? "DQ" : attempt?.manganaResult || (attempt?.notAchieved ? "NOT_ACHIEVED" : attempt?.attempted ? "ATTEMPTED" : "NOT_STARTED")
  }));
}

export function shouldDisqualifyRepeatedManganaRemate(attempts = [], activeIndex = 0, remateId = "") {
  const id = String(remateId || "");
  if (!id || activeIndex < 1 || activeIndex >= FMCH_2026_MANGANAS_OPPORTUNITY_LIMIT) return false;
  return attempts.slice(0, activeIndex).some((attempt) => String(attempt?.remateId || "") === id);
}

export function resolveFmch2026ManganaTiming(officialElapsedMs = 0, options = {}) {
  const elapsed = Math.max(0, Number(officialElapsedMs) || 0);
  const hasConsumed = options.hasConsumed === true;
  const sequenceComplete = options.sequenceComplete !== false;
  const remainingMs = FMCH_2026_MANGANAS_DURATION_MS - elapsed;
  return {
    officialElapsedMs: elapsed,
    remainingMs,
    overtimeMs: Math.max(0, -remainingMs),
    completeUnusedMinutes: hasConsumed && sequenceComplete ? Math.max(0, Math.floor(remainingMs / 60000)) : 0,
    minuteSevenPenalty: hasConsumed && options.placedInMinuteSeven === true,
    expired: elapsed >= FMCH_2026_MANGANAS_DURATION_MS,
    disqualified: elapsed > FMCH_2026_MANGANAS_DURATION_MS
  };
}

export function applyFmch2026ManganaTiming(attempt = {}, suerte = {}, timingInput = {}) {
  const next = cloneAttempt(attempt);
  const timing = resolveFmch2026ManganaTiming(timingInput.officialElapsedMs, timingInput);
  const prefix = suerte.id;
  setRuleQuantity(next, `${prefix}_adic_tiempo_no_usado`, timing.completeUnusedMinutes);
  setRuleQuantity(next, `${prefix}_infr_minuto_7`, timing.minuteSevenPenalty ? 1 : 0);
  const dqRuleId = `${prefix}_desc_tiempo_agotado`;
  const dqRule = (suerte.catalog?.desc || []).find((item) => item.id === dqRuleId);
  if (timing.disqualified) {
    next.desc = dqRule?.label || "Tiempo mayor a siete minutos";
    next.descRuleId = dqRuleId;
    next.autoDescRuleId = dqRuleId;
  } else if (next.autoDescRuleId === dqRuleId) {
    next.desc = null;
    next.descRuleId = null;
    next.autoDescRuleId = null;
  }
  next.timing = {
    timerId: timingInput.timerId || `timer_${prefix}`,
    officialElapsedMs: timing.officialElapsedMs,
    elapsedMs: timing.officialElapsedMs,
    remainingMs: timing.remainingMs,
    overtimeMs: timing.overtimeMs,
    alertState: timing.overtimeMs > 0 ? "overtime" : "normal",
    wallElapsedMs: Math.max(0, Number(timingInput.wallElapsedMs) || 0),
    status: timingInput.status || (timing.expired ? "EXPIRED" : "CAPTURED"),
    legacyText: timingInput.legacyText || null,
    adjustments: [
      ...(timing.completeUnusedMinutes ? [{ selectedRuleId: `${prefix}_adic_tiempo_no_usado`, resolvedValue: 1, quantity: timing.completeUnusedMinutes }] : []),
      ...(timing.minuteSevenPenalty ? [{ selectedRuleId: `${prefix}_infr_minuto_7`, resolvedValue: 3, quantity: 1 }] : []),
      ...(timing.disqualified ? [{ selectedRuleId: dqRuleId, resolvedValue: 0, quantity: 1 }] : [])
    ]
  };
  return reconcileFmch2026ManganaAttempt(next, suerte);
}

export function reconcileFmch2026PasoAttempt(attempt = {}, suerte = {}) {
  if (!isFmch2026PasoSuerte(suerte?.id)) return cloneAttempt(attempt);
  const next = cloneAttempt(attempt);
  next.applied = uniqueStrings(next.applied);
  next.ruleQuantities = { ...(next.ruleQuantities || {}) };
  next.resolvedRuleValues = {};
  const classificationId = next.classification?.classificationId || null;
  const selectedBase = (suerte.catalog?.base || []).find((item) => next.applied.includes(item.id)) || null;
  next.pasoVuelta = Number(selectedBase?.metadata?.vuelta || next.pasoVuelta || 1);
  next.pasoResult = normalizePasoResult(next.pasoResult, next);
  const blocksDynamic = selectedBase?.metadata?.blocksDynamic === true;
  const allowsDistance = selectedBase?.id === "paso_base_primera_vuelta";
  if (!allowsDistance) {
    const distanceIds = new Set((suerte.catalog?.adic || []).filter((item) => item.metadata?.distanceRule).map((item) => item.id));
    next.applied = next.applied.filter((id) => !distanceIds.has(id));
    distanceIds.forEach((id) => delete next.ruleQuantities[id]);
  }
  if (blocksDynamic) {
    const dynamicIds = new Set([...(suerte.catalog?.adic || []), ...(suerte.catalog?.infr || [])]
      .filter((item) => item.valueByClassification || item.metadata?.distanceRule)
      .map((item) => item.id));
    next.applied = next.applied.filter((id) => !dynamicIds.has(id));
    dynamicIds.forEach((id) => delete next.ruleQuantities[id]);
  }
  for (const ruleItem of [...(suerte.catalog?.adic || []), ...(suerte.catalog?.infr || [])]) {
    if (!next.applied.includes(ruleItem.id)) continue;
    next.resolvedRuleValues[ruleItem.id] = resolveFmch2026PasoRuleValue(ruleItem, classificationId);
  }
  next.adic = blocksDynamic ? manualTotal(next.customAdic) : catalogTotal(next, suerte.catalog?.adic, classificationId) + manualTotal(next.customAdic);
  next.infr = catalogTotal(next, suerte.catalog?.infr, classificationId) + manualTotal(next.customInfr);
  next.dynamicScoring = {
    contractVersion: "1.0.0",
    classificationId,
    vuelta: next.pasoVuelta,
    selectedRuleIds: Object.keys(next.resolvedRuleValues),
    resolvedRuleValues: { ...next.resolvedRuleValues },
    source: FMCH_2026_MANGANAS_PASO_SOURCE
  };
  return next;
}

export function resolveFmch2026PasoRuleValue(ruleItem = {}, classificationId = "") {
  const dynamic = Number(ruleItem.valueByClassification?.[classificationId]);
  if (ruleItem.valueByClassification && Number.isFinite(dynamic)) return Math.abs(dynamic);
  return Math.abs(Number(ruleItem.resolvedValue ?? ruleItem.pts ?? 0) || 0);
}

export function resolveFmch2026PasoTiming(input = {}) {
  const exitElapsedMs = Math.max(0, Number(input.exitOfficialElapsedMs) || 0);
  const dismountElapsedMs = Math.max(0, Number(input.dismountOfficialElapsedMs) || 0);
  return {
    exitElapsedMs,
    dismountElapsedMs,
    exitRemainingMs: FMCH_2026_PASO_EXIT_DURATION_MS - exitElapsedMs,
    exitOvertimeMs: Math.max(0, exitElapsedMs - FMCH_2026_PASO_EXIT_DURATION_MS),
    dismountRemainingMs: FMCH_2026_PASO_DISMOUNT_DURATION_MS - dismountElapsedMs,
    dismountOvertimeMs: Math.max(0, dismountElapsedMs - FMCH_2026_PASO_DISMOUNT_DURATION_MS),
    exitDisqualified: exitElapsedMs > FMCH_2026_PASO_EXIT_DURATION_MS || input.exitExpired === true,
    dismountPenaltyQuantity: Math.max(0, Math.ceil((dismountElapsedMs - FMCH_2026_PASO_DISMOUNT_DURATION_MS) / 60000))
  };
}

export function applyFmch2026PasoTiming(attempt = {}, suerte = {}, input = {}) {
  const next = cloneAttempt(attempt);
  const timing = resolveFmch2026PasoTiming(input);
  setRuleQuantity(next, "paso_infr_desmonte_tardio", timing.dismountPenaltyQuantity);
  if (timing.exitDisqualified) {
    next.desc = (suerte.catalog?.desc || []).find((item) => item.id === "paso_desc_salida_mas_3_min")?.label || "Salida completa mayor a tres minutos";
    next.descRuleId = "paso_desc_salida_mas_3_min";
    next.autoDescRuleId = "paso_desc_salida_mas_3_min";
  } else if (next.autoDescRuleId === "paso_desc_salida_mas_3_min") {
    next.desc = null;
    next.descRuleId = null;
    next.autoDescRuleId = null;
  }
  next.timing = {
    timerId: input.timerId || "timer_paso_3min",
    officialElapsedMs: timing.exitElapsedMs,
    elapsedMs: timing.exitElapsedMs,
    remainingMs: timing.exitRemainingMs,
    overtimeMs: timing.exitOvertimeMs,
    alertState: timing.exitOvertimeMs > 0 ? "overtime" : "normal",
    status: timing.exitDisqualified ? "EXPIRED" : "CAPTURED",
    secondaryTimers: [{
      timerId: input.dismountTimerId || "timer_paso_1min",
      officialElapsedMs: timing.dismountElapsedMs,
      remainingMs: timing.dismountRemainingMs,
      overtimeMs: timing.dismountOvertimeMs,
      status: timing.dismountPenaltyQuantity ? "EXCEEDED" : "CAPTURED"
    }],
    adjustments: [
      ...(timing.dismountPenaltyQuantity ? [{ selectedRuleId: "paso_infr_desmonte_tardio", resolvedValue: 1, quantity: timing.dismountPenaltyQuantity }] : []),
      ...(timing.exitDisqualified ? [{ selectedRuleId: "paso_desc_salida_mas_3_min", resolvedValue: 0, quantity: 1 }] : [])
    ]
  };
  return reconcileFmch2026PasoAttempt(next, suerte);
}

function baseGroup(points, labels) {
  return labels.map((label) => rule(`manganas_caballo_base_${slug(label)}`, label, points, { remate: true }));
}

function dynamicRule(id, label, valueByClassification, metadata = {}) {
  return { ...rule(id, label, valueByClassification.EXCELENTE, { ...metadata, dynamic: true, requiresClassification: true }), valueByClassification };
}

function allowedFirstVuelta() {
  return { distanceRule: true, exclusiveGroup: "paso_distancia", allowedBaseRuleIds: ["paso_base_primera_vuelta"] };
}

function matrix4(excelente, buena, regular, minima) {
  return Object.freeze({ EXCELENTE: excelente, BUENA: buena, REGULAR: regular, MINIMA: minima });
}

function automatic(metadata = {}) {
  return { ...metadata, automaticOnly: true };
}

function rule(id, label, pts, metadata = {}) {
  return { id, label, pts, metadata: { ...META, ...metadata } };
}

function dq(id, label, metadata = {}) {
  return { id, label, metadata: { ...META, ...metadata } };
}

function cloneAttempt(attempt) {
  const source = attempt && typeof attempt === "object" ? attempt : {};
  return {
    ...source,
    applied: Array.isArray(source.applied) ? [...source.applied] : [],
    ruleQuantities: { ...(source.ruleQuantities || {}) },
    customAdic: Array.isArray(source.customAdic) ? source.customAdic.map((item) => ({ ...item })) : [],
    customInfr: Array.isArray(source.customInfr) ? source.customInfr.map((item) => ({ ...item })) : [],
    teamPenalties: Array.isArray(source.teamPenalties) ? source.teamPenalties.map((item) => ({ ...item })) : [],
    floreoDetail: Array.isArray(source.floreoDetail) ? source.floreoDetail.map((item) => ({ ...item })) : [],
    timeEvidence: Array.isArray(source.timeEvidence) ? source.timeEvidence.map((item) => ({ ...item })) : [],
    classification: source.classification ? { ...source.classification } : null,
    timing: source.timing ? { ...source.timing } : null,
    resolvedRuleValues: { ...(source.resolvedRuleValues || {}) }
  };
}

function normalizeFloreoDetail(value, suerteId) {
  const allowed = new Map(getFmch2026ManganaFloreoRules(suerteId).map((item) => [item.id, item]));
  return (Array.isArray(value) ? value : []).slice(0, 30).map((item) => {
    const id = String(item?.selectedRuleId || item?.ruleId || item?.id || "");
    const ruleItem = allowed.get(id);
    if (!ruleItem) return null;
    return { selectedRuleId: id, label: ruleItem.label, resolvedValue: Number(ruleItem.pts || 0), source: FMCH_2026_MANGANAS_PASO_SOURCE };
  }).filter(Boolean);
}

function normalizeResult(value, attempt) {
  if (["NOT_STARTED", "ACHIEVED", "NOT_ACHIEVED"].includes(value)) return value;
  if (attempt.notAchieved) return "NOT_ACHIEVED";
  if (attempt.attempted || Number(attempt.base || 0) || attempt.desc) return "ACHIEVED";
  return "NOT_STARTED";
}

function normalizePasoResult(value, attempt) {
  if (["NOT_STARTED", "ACHIEVED", "NOT_ACHIEVED"].includes(value)) return value;
  if (attempt.notAchieved) return "NOT_ACHIEVED";
  if (attempt.attempted || Number(attempt.base || 0) || attempt.desc) return "ACHIEVED";
  return "NOT_STARTED";
}

function catalogTotal(attempt, rules = [], classificationId = "") {
  const applied = new Set(attempt.applied || []);
  return (Array.isArray(rules) ? rules : []).reduce((sum, item) => {
    if (!applied.has(item.id)) return sum;
    const quantity = Math.max(1, nonNegativeInteger(attempt.ruleQuantities?.[item.id]) || 1);
    const value = item.valueByClassification
      ? resolveFmch2026PasoRuleValue(item, classificationId)
      : Math.abs(Number(item.pts || 0));
    if (attempt.resolvedRuleValues) attempt.resolvedRuleValues[item.id] = value;
    return sum + value * quantity;
  }, 0);
}

function manualTotal(items) {
  return (Array.isArray(items) ? items : []).reduce((sum, item) => sum + Math.max(0, Number(item?.pts) || 0), 0);
}

function setRuleQuantity(attempt, ruleId, quantity) {
  const value = nonNegativeInteger(quantity);
  attempt.applied = uniqueStrings(attempt.applied);
  attempt.ruleQuantities = { ...(attempt.ruleQuantities || {}) };
  attempt.applied = attempt.applied.filter((id) => id !== ruleId);
  delete attempt.ruleQuantities[ruleId];
  if (!value) return;
  attempt.applied.push(ruleId);
  if (value > 1) attempt.ruleQuantities[ruleId] = value;
}

function uniqueStrings(items) {
  return [...new Set((Array.isArray(items) ? items : []).map(String).filter(Boolean))];
}

function nonNegative(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function nonNegativeInteger(value) {
  return Math.floor(nonNegative(value));
}

function slug(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function freezeRules(rules) {
  return Object.freeze(rules.map((item) => Object.freeze({
    ...item,
    ...(item.valueByClassification ? { valueByClassification: Object.freeze({ ...item.valueByClassification }) } : {}),
    metadata: Object.freeze({ ...(item.metadata || {}) })
  })));
}

function freezeDisabled(items) {
  return Object.freeze(items.map(([category, id]) => Object.freeze({ category, id })));
}

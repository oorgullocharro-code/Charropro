export const FMCH_2026_PIALES_COLEADERO_SOURCE = "CHARROPRO-FMCH-2026-SCORING-SPECIFICATION-001";
export const FMCH_2026_PIALES_RULEBOOK_VERSION = "fmch_2026_piales_0.3.0";
export const FMCH_2026_COLEADERO_RULEBOOK_VERSION = "fmch_2026_coleadero_0.3.0";

export const FMCH_2026_PIALES_DISTANCE_RULE_ID = "piales_adic_distancia_metro";
export const FMCH_2026_PIALES_VERIJAS_RULE_ID = "piales_base_verijas";
export const FMCH_2026_PIALES_REPEATED_REMATE_DQ_RULE_ID = "piales_desc_tercer_remate_repetido";

export const FMCH_2026_PIALES_BASE_RULES = freezeRules([
  rule("piales_base_verijas", "Lazo de verijas", 14, { remate: true, blocksAdditionals: true }),
  rule("piales_base_remolineado_adelante", "Remolineado adelante", 18, { remate: true }),
  rule("piales_base_remolineado_atras", "Remolineado atras", 20, { remate: true }),
  rule("piales_base_piquete_adelante", "Piquete adelante", 22, { remate: true }),
  rule("piales_base_piquete_atras", "Piquete atras", 24, { remate: true }),
  rule("piales_base_rompe_chaqueta_lienzo", "Rompe chaqueta por lado del lienzo", 26, { remate: true }),
  rule("piales_base_floreado_adelante", "Floreado adelante", 28, { remate: true }),
  rule("piales_base_floreado_atras", "Floreado atras", 30, { remate: true })
]);

export const FMCH_2026_PIALES_ADIC_RULES = freezeRules([
  rule(FMCH_2026_PIALES_DISTANCE_RULE_ID, "Cada metro excedente de distancia reglamentaria", 1, {
    repeatable: true,
    specializedInput: "distanceMeters",
    maxQuantity: 90
  }),
  rule("piales_adic_caballo_rectangulo", "Caballo detenido dentro del rectangulo", 1),
  rule("piales_adic_relleno_madera", "Relleno de madera", 2),
  rule("piales_adic_vueltas_mano", "Conservar todas las vueltas en la mano", 1)
]);

export const FMCH_2026_PIALES_INFR_RULES = freezeRules([
  rule("piales_infr_extremidad_linea_4m", "Una extremidad cruza linea de 4 m, siendo de cuenta", 4),
  rule("piales_infr_vueltas_guia", "Fallar vueltas, amarrar tarde o no tomar/soltar guia", 2),
  rule("piales_infr_amarrar_sin_pial", "Amarrar sin pial", 2),
  rule("piales_infr_cabrestear_10_20m", "Cabrestear mas de 10 m y hasta 20 m", 2),
  rule("piales_infr_caballo_atravesado", "Caballo atravesado", 2),
  rule("piales_infr_caballo_contralienzo", "Caballo camina al contralienzo llevando pial", 3),
  rule("piales_infr_tiempo_excedido_minuto", "Cada minuto excedente del tiempo", 2, { repeatable: true }),
  rule("piales_infr_pial_pecho", "Pial no limpio que pega en el pecho", 2),
  rule("piales_infr_sostener_amarrado", "Sostenerse amarrado sin pial", 4),
  rule("piales_infr_media_llevando_pial", "Hacerse media llevando pial", 2),
  rule("piales_infr_lineas_29_32m", "Cruzar lineas de 29/32 m, siendo de cuenta", 4),
  rule("piales_infr_yegua_quita_reata", "Yegua quita la reata", 6, { pairedDisqualification: "piales_desc_yegua_quita_reata" }),
  rule("piales_infr_arrear_caballo_area_tiro", "Cabrestear o arrear caballo del pialador al area de tiro", 2)
]);

export const FMCH_2026_PIALES_TEAM_PENALTY_RULES = freezeRules([
  rule("piales_team_persona_extra", "Persona extra con el pialador", 4, { scope: "team" })
]);

export const FMCH_2026_PIALES_DESC_RULES = freezeRules([
  dq("piales_desc_vueltas_suelo", "Vueltas en el suelo o sentarse"),
  dq("piales_desc_sombra_arreo", "Sombra o arreo"),
  dq("piales_desc_no_detener_90m", "No detener antes de 90 m"),
  dq("piales_desc_rotura_reata", "Rotura de reata, hondilla o nudo"),
  dq("piales_desc_perder_reata", "Perder la reata"),
  dq("piales_desc_extremidades_linea_4m", "Mas de una extremidad cruza linea de 4 m"),
  dq("piales_desc_cabrestear_mas_20m", "Cabrestear mas de 20 m"),
  dq("piales_desc_hacerse_media", "Hacerse media"),
  dq("piales_desc_poder_a_poder", "Amarrar de poder a poder"),
  dq("piales_desc_relleno_prohibido", "Relleno prohibido"),
  dq("piales_desc_tercero_obstruye", "Tercero obstruye la carrera"),
  dq("piales_desc_ahorcado_sin_mano", "Detener ahorcado sin mano"),
  dq("piales_desc_caballo_fuera_rectangulo", "Caballo fuera del rectangulo"),
  dq(FMCH_2026_PIALES_REPEATED_REMATE_DQ_RULE_ID, "Tercer remate no diferente, salvo excepcion reglada", { automaticWhenConfirmed: true }),
  dq("piales_desc_caida_caballo", "Caida del caballo"),
  dq("piales_desc_no_horcajadas", "No estar a horcajadas"),
  dq("piales_desc_yegua_quita_reata", "Yegua quita la reata", { pairedInfraction: "piales_infr_yegua_quita_reata" })
]);

export const FMCH_2026_PIALES_DISABLED_LEGACY_RULES = freezeDisabledRules([
  ["base", "pb1"], ["base", "pb2"], ["base", "pb3"],
  ["adic", "pa1"], ["adic", "pa2"], ["adic", "pa3"], ["adic", "pa4"], ["adic", "pa5"], ["adic", "pa6"],
  ["infr", "pi1"], ["infr", "pi2"], ["infr", "pi3"], ["infr", "pi4"], ["infr", "pi8"],
  ["desc", "pd1"], ["desc", "pd2"], ["desc", "pd4"]
]);

export const FMCH_2026_COLEADERO_BASE_RULES = freezeRules([
  fall("colas_base_redonda_derecha", "Redonda derecha", 12, "redonda_derecha"),
  fall("colas_base_media_derecha", "Media derecha", 10, "media_derecha"),
  fall("colas_base_sobre_lomo_derecha", "Sobre lomo derecha", 10, "sobre_lomo_derecha"),
  fall("colas_base_sobre_lomo_izquierda", "Sobre lomo izquierda", 6, "sobre_lomo_izquierda"),
  fall("colas_base_redonda_contraria", "Redonda contraria", 8, "redonda_contraria"),
  fall("colas_base_media_contraria", "Media contraria", 6, "media_contraria"),
  fall("colas_base_panzazo", "Panzazo", 6, "panzazo"),
  fall("colas_base_senton", "Senton", 6, "senton"),
  fall("colas_base_molinete", "Molinete", 6, "molinete")
]);

export const FMCH_2026_COLEADERO_ADIC_RULES = freezeRules([
  rule("colas_adic_antes_30m", "Antes de 30 m", 3, { exclusiveGroup: "distance" }),
  rule("colas_adic_30_40m", "De 30 a 40 m", 2, { exclusiveGroup: "distance" }),
  rule("colas_adic_40_50m", "De 40 a 50 m", 1, { exclusiveGroup: "distance" }),
  rule("colas_adic_lola", "Lola", 2),
  rule("colas_adic_sin_apretador", "Sin apretador", 1)
]);

export const FMCH_2026_COLEADERO_INFR_RULES = freezeRules([
  rule("colas_infr_no_saludar", "No saludar", 2),
  rule("colas_infr_no_pachonear", "No pachonear", 2),
  rule("colas_infr_no_agarrar_cola", "No agarrar la cola", 2),
  rule("colas_infr_apoyarse_sujetarse", "Apoyarse o sujetarse", 2),
  rule("colas_infr_dos_intentos_arcionar", "Dos o mas intentos de arcionar", 2, { annulsBase: true }),
  rule("colas_infr_auxiliar_apoya", "Auxiliar entra a apoyar", 2),
  rule("colas_infr_perder_arreo_estribo", "Perder o reventar arreo o estribo", 2),
  rule("colas_infr_arcionar_alto", "Arcionar alto", 2),
  rule("colas_infr_arcionar_defectuoso", "Arcionar defectuoso", 2),
  rule("colas_infr_mano_al_frente", "Mano al frente", 2),
  rule("colas_infr_remachar_botin", "Remachar botin", 2),
  rule("colas_infr_pisar_cola", "Pisar la cola", 2),
  rule("colas_infr_encorvarse", "Encorvarse", 2),
  rule("colas_infr_castigar_caballo", "Castigar al caballo", 2),
  rule("colas_infr_arcionar_despues_60m", "Arcionar despues de 60 m", 2),
  rule("colas_infr_no_detener_caballo", "No detener el caballo", 2),
  rule("colas_infr_estrellar_caballo", "Estrellar el caballo", 2),
  rule("colas_infr_descubrirse", "Descubrirse", 2),
  rule("colas_infr_arriba_rodilla", "Amarrar arriba de la rodilla", 4, { annulsBase: true }),
  rule("colas_infr_lastimar_cabalgadura", "Lastimar la cabalgadura", 4),
  rule("colas_infr_toro_despues_70m", "Toro cae despues de 70 m", 4),
  rule("colas_infr_picadero_fuera_turno", "Picadero o puerta fuera de turno, por integrante u ocasion", 2, { repeatable: true }),
  rule("colas_infr_rienda_ramo", "Rienda en ramo", 2)
]);

export const FMCH_2026_COLEADERO_TEAM_PENALTY_RULES = freezeRules([
  rule("colas_team_apretador_lado_sombra", "Apretador por lado incorrecto o sombra entra antes de 5 m", 4, { scope: "team" }),
  rule("colas_team_mas_apachurrador", "Mas de un apachurrador", 4, { scope: "team" })
]);

export const FMCH_2026_COLEADERO_DESC_RULES = freezeRules([
  dq("colas_desc_arrear_caballo", "Arrear caballo del coleador"),
  dq("colas_desc_toro_detras", "Toro sale por detras o contralienzo"),
  dq("colas_desc_toro_zona_5_20m", "Toro entra a zona de 5 a 20 m"),
  dq("colas_desc_arrear_mas_10m", "Arrear o apachurrar mas de 10 m"),
  dq("colas_desc_sombra_mas_20m", "Sombra mas de 20 m"),
  dq("colas_desc_caida_cambio_caballo", "Caida del coleador o cambio de caballo", { preservedBadPoints: 6 }),
  dq("colas_desc_caida_caballo", "Caida del caballo"),
  dq("colas_desc_estribos_amarrados", "Estribos amarrados; pierde tres oportunidades"),
  dq("colas_desc_arriba_rodilla", "Arriba de la rodilla"),
  dq("colas_desc_rumbo_partidero", "Derribo rumbo al partidero"),
  dq("colas_desc_perder_continuidad", "Perder continuidad"),
  dq("colas_desc_brea_sustancia", "Brea o sustancia"),
  dq("colas_desc_guantes", "Uso de guantes"),
  dq("colas_desc_mano_pierna", "Derribo con la mano o solo con la pierna"),
  dq("colas_desc_tercero_pasa_cola", "Tercero pasa la cola")
]);

export const FMCH_2026_COLEADERO_DISABLED_LEGACY_RULES = freezeDisabledRules([
  ["base", "cob1"], ["base", "cob2"], ["base", "cob3"], ["base", "cob4"],
  ["adic", "coa1"], ["adic", "coa2"], ["adic", "coa3"], ["adic", "coa4"],
  ["infr", "coi1"], ["infr", "coi2"], ["infr", "coi3"], ["infr", "coi4"], ["infr", "coi5"], ["infr", "coi6"], ["infr", "coi8"],
  ["desc", "cod1"], ["desc", "cod2"], ["desc", "cod3"], ["desc", "cod4"]
]);

export function calculatePialesDistanceAdditional(distanceMeters, baseRuleId = "") {
  if (String(baseRuleId || "") === FMCH_2026_PIALES_VERIJAS_RULE_ID) return 0;
  const meters = Number(distanceMeters);
  if (!Number.isFinite(meters) || meters <= 0) return 0;
  return Math.min(90, Math.floor(meters));
}

export function buildPialesRemateHistory(attempts = []) {
  return (Array.isArray(attempts) ? attempts : []).slice(0, 3).map((attempt, index) => ({
    id: String(attempt?.remateId || `piales_remate_${index + 1}`),
    label: attempt?.remateLabel || `Oportunidad ${index + 1}: sin remate`,
    value: Number(attempt?.base || 0),
    status: attempt?.desc ? "Descalificacion" : attempt?.remateId ? "Registrado" : "Pendiente"
  }));
}

export function shouldDisqualifyRepeatedThirdPialesRemate(attempts = [], opportunityIndex = 0, remateId = "") {
  if (Number(opportunityIndex) !== 2 || !remateId || !Array.isArray(attempts) || attempts.length < 3) return false;
  const first = attempts[0] || {};
  const second = attempts[1] || {};
  return first.remateId === remateId
    && second.remateId === remateId
    && Number(first.base || 0) > 0
    && Number(second.base || 0) > 0
    && !first.desc
    && !second.desc;
}

export function getSelectedBaseRule(attempt = {}, catalog = {}) {
  const applied = new Set(Array.isArray(attempt.applied) ? attempt.applied : []);
  return (Array.isArray(catalog.base) ? catalog.base : []).find((ruleItem) => applied.has(ruleItem.id)) || null;
}

export function resolveConditionalBasePoints(attempt = {}, catalog = {}) {
  const baseRule = getSelectedBaseRule(attempt, catalog);
  if (!baseRule) return 0;
  const applied = new Set(Array.isArray(attempt.applied) ? attempt.applied : []);
  const annulled = (Array.isArray(catalog.infr) ? catalog.infr : []).some((ruleItem) =>
    ruleItem.metadata?.annulsBase === true && applied.has(ruleItem.id)
  );
  return annulled ? 0 : Number(baseRule.pts || 0);
}

function rule(id, label, pts, metadata = {}) {
  return { id, label, pts, metadata };
}

function dq(id, label, metadata = {}) {
  return { id, label, metadata };
}

function fall(id, label, pts, diagramKey) {
  return rule(id, label, pts, {
    officialDiagramKey: diagramKey,
    officialDiagramAvailable: false,
    suppressGenericIcon: true
  });
}

function freezeRules(rules) {
  return Object.freeze(rules.map((item) => Object.freeze({
    ...item,
    metadata: Object.freeze({ ...(item.metadata || {}) })
  })));
}

function freezeDisabledRules(items) {
  return Object.freeze(items.map(([category, id]) => Object.freeze({ category, id })));
}

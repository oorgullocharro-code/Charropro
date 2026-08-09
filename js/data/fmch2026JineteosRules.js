export const FMCH_2026_JINETEOS_RULEBOOK_VERSION = "fmch_2026_jineteos_0.4.0";
export const FMCH_2026_TORO_RULEBOOK_VERSION = "fmch_2026_toro_0.4.0";
export const FMCH_2026_YEGUA_RULEBOOK_VERSION = "fmch_2026_yegua_0.4.0";
export const FMCH_2026_JINETEOS_SOURCE = "CHARROPRO-FMCH-2026-SCORING-SPECIFICATION-001";

export const FMCH_2026_JINETEO_CLASSIFICATIONS = freezeRules([
  { id: "EXCELENTE", label: "Excelente", value: 20 },
  { id: "BUENA", label: "Buena", value: 16 },
  { id: "REGULAR", label: "Regular", value: 12 },
  { id: "MEDIA_REGULAR", label: "Media Regular", value: 8 },
  { id: "MINIMA", label: "Mínima", value: 6 }
]);

const ROW = Object.freeze({
  PIOCHI_COLA: matrix(3, 2, 1, 0, 0),
  LOLA: matrix(3, 2, 1, 0, 0),
  UNA_MANO: matrix(3, 2, 1, 0, 0),
  GRENA: matrix(3, 2, 1, 0, 0),
  CARA_ATRAS_TORO: matrix(3, 2, 1, 1, 0),
  CARA_ATRAS_YEGUA: matrix(3, 2, 1, 0, 0),
  TENTEMOZO: matrix(4, 4, 3, 1, 0),
  GAZA_DOS_MANOS: matrix(4, 4, 3, 1, 0),
  PIERNAS_TORO: matrix(3, 2, 1, 0, 0),
  PIERNAS_YEGUA: matrix(3, 2, 1, 1, 0),
  QUITAR_VERIJERO_TORO: matrix(2, 2, 1, 0, 0),
  QUITAR_VERIJERO_YEGUA: matrix(2, 2, 1, 1, 0),
  QUITAR_GAZA_TENTEMOZO: matrix(2, 2, 1, 1, 0),
  BAJAR_SIN_LAZO: matrix(1, 1, 1, 0, 0),
  OREJA_CRUZAR_PIERNA: matrix(1, 1, 1, 0, 0),
  LEVANTA_SIN_AYUDA_TORO: matrix(3, 2, 1, 1, 0),
  LEVANTA_SIN_AYUDA_YEGUA: matrix(3, 2, 1, 0, 0),
  LEVANTA_CON_AYUDA: matrix(2, 1, 0, 0, 0),
  DESCOMPONERSE: matrix(1, 2, 3, 4, 5)
});

export const FMCH_2026_TORO_BASE_RULES = classificationRules("toro");
export const FMCH_2026_TORO_ADIC_RULES = freezeRules([
  dynamicRule("toro_adic_piochi_cola", "Piochi o cola", ROW.PIOCHI_COLA),
  dynamicRule("toro_adic_lola", "A la Lola", ROW.LOLA),
  dynamicRule("toro_adic_una_mano", "Una mano", ROW.UNA_MANO),
  dynamicRule("toro_adic_cara_atras", "Cara atrás", ROW.CARA_ATRAS_TORO),
  dynamicRule("toro_adic_tentemozo", "Tentemozo", ROW.TENTEMOZO),
  dynamicRule("toro_adic_pretal_gaza_dos_manos", "Pretal de gaza a dos manos", ROW.GAZA_DOS_MANOS),
  dynamicRule("toro_adic_jugar_piernas", "Jugar las piernas", ROW.PIERNAS_TORO),
  dynamicRule("toro_adic_quitar_verijero", "Quitar verijero", ROW.QUITAR_VERIJERO_TORO),
  dynamicRule("toro_adic_quitar_gaza_tentemozo", "Quitar pretal de gaza o tentemozo", ROW.QUITAR_GAZA_TENTEMOZO),
  dynamicRule("toro_adic_bajar_sin_lazo", "Bajar sin lazo", ROW.BAJAR_SIN_LAZO),
  dynamicRule("toro_adic_levanta_sin_ayuda", "Caer el toro y levantarse sin ayuda", ROW.LEVANTA_SIN_AYUDA_TORO),
  dynamicRule("toro_adic_levanta_con_ayuda", "Caer el toro y levantarse con ayuda", ROW.LEVANTA_CON_AYUDA),
  rule("toro_adic_tiempo_ahorrado", "Tiempo ahorrado", 1, timingMetadata("time_saved", { repeatable: true, maxQuantity: 3 }))
]);
export const FMCH_2026_TORO_INFR_RULES = freezeRules([
  dynamicRule("toro_infr_descomponerse", "Descomponerse", ROW.DESCOMPONERSE, { signedEffect: "negative" }),
  rule("toro_infr_atuendo", "Atuendo perdido, roto o desplazado", 1),
  rule("toro_infr_bajar_sin_cruzar_pierna", "Bajar sin cruzar la pierna", 1),
  rule("toro_infr_no_quedar_pie", "No quedar de pie", 1),
  rule("toro_infr_verijero_caido", "Verijero caído o de lado", 4),
  rule("toro_infr_sangrado", "Sangrado", 2),
  rule("toro_infr_quitar_verijero_reparando", "Quitar verijero mientras repara", 2),
  rule("toro_infr_no_quitar_pretal_presilla", "No quitar pretal con presilla", 4),
  rule("toro_infr_mas_tres_apretaladores", "Más de tres apretaladores, por persona", 2, { repeatable: true }),
  rule("toro_infr_aspavientos_objetos", "Aspavientos u objetos, por persona", 4, { repeatable: true }),
  rule("toro_infr_destroncar_lazado", "Destroncar ya lazado", 4),
  rule("toro_infr_soguear_cuartear_montado", "Soguear o cuartear montado", 4),
  rule("toro_infr_apretalamiento_minuto_4", "Apretalamiento después de 3 minutos", 1, timingMetadata("minute_4")),
  rule("toro_infr_apretalamiento_minuto_5", "Apretalamiento después de 4 minutos", 1, timingMetadata("minute_5"))
]);
export const FMCH_2026_TORO_TEAM_PENALTY_RULES = freezeRules([
  rule("toro_team_fuera_cuadro_sin_orden", "Lazador o integrante sale del cuadro sin orden, por persona", 4, { scope: "team", repeatable: true })
]);
export const FMCH_2026_TORO_DESC_RULES = freezeRules([
  dq("toro_desc_destroncar_ahogar_sustancias", "Destroncar, ahogar o usar sustancias"),
  dq("toro_desc_espuelas_prohibidas", "Espuelas prohibidas"),
  dq("toro_desc_desmontado_cajon", "Desmontado dentro del cajón, salvo excepción"),
  dq("toro_desc_caida_desmonte", "Caída o desmonte, salvo barda o caporal"),
  dq("toro_desc_quitar_reparos", "Quitar reparos"),
  dq("toro_desc_bajar_antes_terminar", "Bajar antes de terminar"),
  dq("toro_desc_lado_y_desmontar", "Irse de lado y desmontar"),
  dq("toro_desc_apoyo_ayuda", "Recibir apoyo o ayuda"),
  dq("toro_desc_choque_companero", "Choque con compañero"),
  dq("toro_desc_quitar_reparos_terceros", "Terceros quitan reparos"),
  dq("toro_desc_quitar_verijero_antes_salida", "Quitar verijero antes de la salida"),
  dq("toro_desc_guantes", "Uso de guantes prohibidos"),
  dq("toro_desc_no_pie_primero", "No poner pie primero"),
  dq("toro_desc_sombrero", "Sombrero no permitido"),
  dq("toro_desc_chaleco", "Chaleco ausente o prohibido"),
  dq("toro_desc_apretalamiento_mas_5_min", "Apretalamiento mayor a 5 minutos", timingMetadata("expired"))
]);

export const FMCH_2026_YEGUA_BASE_RULES = classificationRules("yegua");
export const FMCH_2026_YEGUA_ADIC_RULES = freezeRules([
  dynamicRule("yegua_adic_lola", "A la Lola", ROW.LOLA),
  dynamicRule("yegua_adic_una_mano", "Una mano", ROW.UNA_MANO),
  dynamicRule("yegua_adic_grena", "A la greña", ROW.GRENA),
  dynamicRule("yegua_adic_cara_atras", "Cara atrás", ROW.CARA_ATRAS_YEGUA),
  dynamicRule("yegua_adic_tentemozo", "Tentemozo", ROW.TENTEMOZO),
  dynamicRule("yegua_adic_pretal_gaza_dos_manos", "Pretal de gaza a dos manos", ROW.GAZA_DOS_MANOS),
  dynamicRule("yegua_adic_jugar_piernas", "Jugar las piernas", ROW.PIERNAS_YEGUA),
  dynamicRule("yegua_adic_quitar_verijero", "Quitar verijero", ROW.QUITAR_VERIJERO_YEGUA),
  dynamicRule("yegua_adic_quitar_gaza_tentemozo", "Quitar pretal de gaza o tentemozo", ROW.QUITAR_GAZA_TENTEMOZO),
  dynamicRule("yegua_adic_oreja_cruzar_pierna", "Oreja o cruzar pierna", ROW.OREJA_CRUZAR_PIERNA),
  dynamicRule("yegua_adic_levanta_sin_ayuda", "Caer la yegua y levantarse sin ayuda", ROW.LEVANTA_SIN_AYUDA_YEGUA),
  dynamicRule("yegua_adic_levanta_con_ayuda", "Caer la yegua y levantarse con ayuda", ROW.LEVANTA_CON_AYUDA),
  rule("yegua_adic_tiempo_ahorrado", "Tiempo ahorrado", 1, timingMetadata("time_saved", { repeatable: true, maxQuantity: 3 }))
]);
export const FMCH_2026_YEGUA_INFR_RULES = freezeRules([
  dynamicRule("yegua_infr_descomponerse", "Descomponerse", ROW.DESCOMPONERSE, { signedEffect: "negative" }),
  rule("yegua_infr_no_quedar_pie", "No quedar de pie", 1),
  rule("yegua_infr_atuendo", "Atuendo perdido, roto o desplazado", 1),
  rule("yegua_infr_verijero_caido", "Verijero caído o de lado", 4),
  rule("yegua_infr_desmonte_tardio", "Demora al desmontar después del primer minuto", 1, { repeatable: true }),
  rule("yegua_infr_mas_tres_apretaladores", "Más de tres apretaladores, por persona", 2, { repeatable: true }),
  rule("yegua_infr_sangrado", "Sangrado", 2),
  rule("yegua_infr_soguear_cuartear_montado", "Soguear o cuartear montado", 4),
  rule("yegua_infr_quitar_verijero_reparando", "Quitar verijero mientras repara", 2),
  rule("yegua_infr_no_quitar_pretal_presilla", "No quitar pretal con presilla", 4),
  rule("yegua_infr_apretalamiento_minuto_4", "Apretalamiento después de 3 minutos", 1, timingMetadata("minute_4")),
  rule("yegua_infr_apretalamiento_minuto_5", "Apretalamiento después de 4 minutos", 1, timingMetadata("minute_5"))
]);
export const FMCH_2026_YEGUA_TEAM_PENALTY_RULES = freezeRules([
  rule("yegua_team_no_devolver", "No devolver la yegua", 2, { scope: "team" }),
  rule("yegua_team_fuera_circunferencia", "Arreador o integrante sale de la circunferencia, por persona u ocasión", 4, { scope: "team", repeatable: true }),
  rule("yegua_team_choque_barda", "Choque contra la barda desmonta al jinete", 4, { scope: "team" })
]);
export const FMCH_2026_YEGUA_DESC_RULES = freezeRules([
  dq("yegua_desc_destroncar_ahogar_sustancias", "Destroncar, ahogar o usar sustancias"),
  dq("yegua_desc_apoyo_ayuda", "Recibir apoyo o ayuda"),
  dq("yegua_desc_desmontado_cajon", "Desmontado dentro del cajón, salvo excepción"),
  dq("yegua_desc_caida_desmonte", "Caída o desmonte, salvo excepción"),
  dq("yegua_desc_espuelas_prohibidas", "Espuelas prohibidas"),
  dq("yegua_desc_lado_y_desmontar", "Irse de lado y desmontar"),
  dq("yegua_desc_pegamento", "Uso de pegamento"),
  dq("yegua_desc_encajonar_desmontar", "Encajonar para desmontar"),
  dq("yegua_desc_quitar_reparos", "Quitar reparos"),
  dq("yegua_desc_arreador_desmonta", "Arreador desmonta"),
  dq("yegua_desc_verijero_salida", "Verijero se quita o cae a la salida"),
  dq("yegua_desc_guantes", "Uso de guantes prohibidos"),
  dq("yegua_desc_no_pie_primero", "No poner pie primero"),
  dq("yegua_desc_sombrero", "Sombrero no permitido"),
  dq("yegua_desc_chaleco", "Chaleco ausente o prohibido"),
  dq("yegua_desc_apearse_antes_fin", "Apearse antes del fin de los reparos"),
  dq("yegua_desc_apretalamiento_mas_5_min", "Apretalamiento mayor a 5 minutos", timingMetadata("expired"))
]);

export const FMCH_2026_TORO_DISABLED_LEGACY_RULES = freezeDisabledRules([
  ["base", "tb1"], ["base", "tb2"],
  ["adic", "t1m"], ["adic", "tpi"], ["adic", "ttm"], ["adic", "tvp"], ["adic", "tcl"], ["adic", "tbl"], ["adic", "tta"], ["adic", "tta2"],
  ["infr", "ti1"], ["infr", "ti2"], ["infr", "ti4"], ["infr", "ti6"], ["infr", "ttm"],
  ["desc", "td1"], ["desc", "td2"], ["desc", "td3"]
]);
export const FMCH_2026_YEGUA_DISABLED_LEGACY_RULES = freezeDisabledRules([
  ["base", "yb1"], ["base", "yb2"],
  ["adic", "ya1"], ["adic", "ya2"], ["adic", "ya3"], ["adic", "ya4"], ["adic", "ya5"], ["adic", "ya6"], ["adic", "ya7"], ["adic", "ya8"],
  ["infr", "yi1"], ["infr", "yi2"], ["infr", "yi3"],
  ["desc", "yd1"], ["desc", "yd2"]
]);

export function isFmch2026JineteoSuerte(suerteId) {
  return suerteId === "toro" || suerteId === "yegua";
}

export function resolveJineteoRuleValue(rule = {}, classificationId = "") {
  const table = rule.valueByClassification;
  const dynamicValue = table && Number(table[classificationId]);
  if (table && Number.isFinite(dynamicValue)) return Math.abs(dynamicValue);
  const fallback = Number(rule.resolvedValue ?? rule.value ?? rule.pts ?? 0);
  return Number.isFinite(fallback) ? Math.abs(fallback) : 0;
}

export function reconcileFmch2026JineteoAttempt(attempt = {}, suerte = {}) {
  if (!isFmch2026JineteoSuerte(suerte?.id)) return cloneAttempt(attempt);
  const next = cloneAttempt(attempt);
  const catalog = suerte.catalog || {};
  const classification = getClassification(next.classification);
  const classificationId = next.noRepara ? "MINIMA" : classification.classificationId;
  const option = FMCH_2026_JINETEO_CLASSIFICATIONS.find((item) => item.id === classificationId) || null;
  const baseRules = Array.isArray(catalog.base) ? catalog.base : [];
  const baseRule = baseRules.find((item) => item.metadata?.classificationId === classificationId) || null;

  next.applied = Array.isArray(next.applied) ? [...new Set(next.applied.map(String))] : [];
  next.ruleQuantities = { ...(next.ruleQuantities || {}) };
  next.resolvedRuleValues = {};
  if (option && baseRule) {
    const baseIds = new Set(baseRules.map((item) => item.id));
    next.applied = next.applied.filter((ruleId) => !baseIds.has(ruleId));
    next.applied.push(baseRule.id);
    next.base = option.value;
    next.initializedBase = true;
    next.classification = {
      classificationId: option.id,
      classificationLabel: option.label,
      classificationValue: option.value
    };
    next.resolvedRuleValues[baseRule.id] = option.value;
  } else if (!classificationId) {
    next.base = 0;
    next.initializedBase = false;
  }

  if (next.noRepara) {
    const additionalIds = new Set((catalog.adic || []).map((ruleItem) => ruleItem.id));
    next.applied = next.applied.filter((ruleId) => !additionalIds.has(ruleId));
    additionalIds.forEach((ruleId) => delete next.ruleQuantities[ruleId]);
    next.customAdic = [];
  }

  next.adic = resolveCatalogTotal(next, catalog.adic, classificationId, "customAdic");
  next.infr = resolveCatalogTotal(next, catalog.infr, classificationId, "customInfr");
  next.dynamicScoring = {
    contractVersion: "1.0.0",
    classificationId: option?.id || null,
    classificationLabel: option?.label || null,
    classificationValue: option?.value ?? null,
    resolvedRuleValues: { ...next.resolvedRuleValues },
    noRepara: Boolean(next.noRepara)
  };
  return next;
}

export function setFmch2026JineteoClassification(attempt = {}, suerte = {}, classificationId = "", options = {}) {
  const option = FMCH_2026_JINETEO_CLASSIFICATIONS.find((item) => item.id === classificationId);
  if (!option || !isFmch2026JineteoSuerte(suerte?.id)) return cloneAttempt(attempt);
  const next = cloneAttempt(attempt);
  next.classification = {
    classificationId: option.id,
    classificationLabel: option.label,
    classificationValue: option.value
  };
  next.noRepara = options.noRepara === true;
  next.notAchieved = false;
  return reconcileFmch2026JineteoAttempt(next, suerte);
}

export function resolveFmch2026JineteoTiming(elapsedMs, classificationId, options = {}) {
  const safeElapsedMs = Math.max(0, Number(elapsedMs) || 0);
  const minimum = classificationId === "MINIMA" || options.noRepara === true;
  const timeSavedQuantity = minimum || safeElapsedMs >= 180000
    ? 0
    : Math.min(3, Math.floor((180000 - safeElapsedMs) / 60000));
  return {
    elapsedMs: safeElapsedMs,
    timeSavedQuantity,
    minute4Penalty: safeElapsedMs > 180000,
    minute5Penalty: safeElapsedMs > 240000,
    disqualified: safeElapsedMs > 300000
  };
}

export function applyFmch2026JineteoTiming(attempt = {}, suerte = {}, elapsedMs = 0) {
  if (!isFmch2026JineteoSuerte(suerte?.id)) return cloneAttempt(attempt);
  const next = cloneAttempt(attempt);
  const classificationId = getClassification(next.classification).classificationId;
  const timing = resolveFmch2026JineteoTiming(elapsedMs, classificationId, { noRepara: next.noRepara });
  const catalog = suerte.catalog || {};
  const timeRules = [...(catalog.adic || []), ...(catalog.infr || [])]
    .filter((ruleItem) => ruleItem.metadata?.timingAdjustment);
  const timeRuleIds = new Set(timeRules.map((ruleItem) => ruleItem.id));
  next.applied = (Array.isArray(next.applied) ? next.applied : []).filter((ruleId) => !timeRuleIds.has(ruleId));
  next.ruleQuantities = { ...(next.ruleQuantities || {}) };
  timeRuleIds.forEach((ruleId) => delete next.ruleQuantities[ruleId]);

  const prefix = suerte.id;
  setQuantity(next, `${prefix}_adic_tiempo_ahorrado`, timing.timeSavedQuantity);
  setQuantity(next, `${prefix}_infr_apretalamiento_minuto_4`, timing.minute4Penalty ? 1 : 0);
  setQuantity(next, `${prefix}_infr_apretalamiento_minuto_5`, timing.minute5Penalty ? 1 : 0);

  const dqRuleId = `${prefix}_desc_apretalamiento_mas_5_min`;
  const dqRule = (catalog.desc || []).find((ruleItem) => ruleItem.id === dqRuleId);
  if (timing.disqualified) {
    next.desc = dqRule?.label || "Apretalamiento mayor a 5 minutos";
    next.descRuleId = dqRuleId;
    next.autoDescRuleId = dqRuleId;
  } else if (next.autoDescRuleId === dqRuleId) {
    next.desc = null;
    next.descRuleId = null;
    next.autoDescRuleId = null;
  }

  next.timing = {
    timerId: `${prefix}_apretalamiento`,
    elapsedMs: timing.elapsedMs,
    remainingMs: Math.max(0, 300000 - timing.elapsedMs),
    status: timing.disqualified ? "EXPIRED" : "CAPTURED",
    legacyText: formatElapsed(timing.elapsedMs),
    adjustments: [
      ...(timing.timeSavedQuantity ? [{ ruleId: `${prefix}_adic_tiempo_ahorrado`, category: "additional", resolvedValue: 1, quantity: timing.timeSavedQuantity }] : []),
      ...(timing.minute4Penalty ? [{ ruleId: `${prefix}_infr_apretalamiento_minuto_4`, category: "infraction", resolvedValue: 1, quantity: 1 }] : []),
      ...(timing.minute5Penalty ? [{ ruleId: `${prefix}_infr_apretalamiento_minuto_5`, category: "infraction", resolvedValue: 1, quantity: 1 }] : []),
      ...(timing.disqualified ? [{ ruleId: dqRuleId, category: "disqualification", resolvedValue: 0, quantity: 1 }] : [])
    ]
  };
  return reconcileFmch2026JineteoAttempt(next, suerte);
}

function resolveCatalogTotal(attempt, rules = [], classificationId, customKey) {
  const applied = new Set(attempt.applied || []);
  const catalogTotal = (Array.isArray(rules) ? rules : []).reduce((sum, ruleItem) => {
    if (!applied.has(ruleItem.id)) return sum;
    const quantity = Math.max(1, Math.floor(Number(attempt.ruleQuantities?.[ruleItem.id] || 1)));
    const resolvedValue = resolveJineteoRuleValue(ruleItem, classificationId);
    attempt.resolvedRuleValues[ruleItem.id] = resolvedValue;
    return sum + resolvedValue * quantity;
  }, 0);
  const manualTotal = (Array.isArray(attempt[customKey]) ? attempt[customKey] : [])
    .reduce((sum, item) => sum + Math.max(0, Number(item?.pts) || 0), 0);
  return catalogTotal + manualTotal;
}

function getClassification(value = {}) {
  return {
    classificationId: String(value?.classificationId || value?.id || ""),
    classificationLabel: String(value?.classificationLabel || value?.label || ""),
    classificationValue: value?.classificationValue ?? value?.value ?? null
  };
}

function setQuantity(attempt, ruleId, quantity) {
  const nextQuantity = Math.max(0, Math.floor(Number(quantity) || 0));
  attempt.applied = Array.isArray(attempt.applied) ? attempt.applied : [];
  if (!nextQuantity) return;
  if (!attempt.applied.includes(ruleId)) attempt.applied.push(ruleId);
  if (nextQuantity > 1) attempt.ruleQuantities[ruleId] = nextQuantity;
}

function classificationRules(prefix) {
  return freezeRules(FMCH_2026_JINETEO_CLASSIFICATIONS.map((item) => rule(
    `${prefix}_base_${item.id.toLowerCase()}`,
    item.label,
    item.value,
    { classificationId: item.id, classificationBase: true }
  )));
}

function dynamicRule(id, label, valueByClassification, metadata = {}) {
  return rule(id, label, valueByClassification.EXCELENTE, {
    ...metadata,
    dynamic: true,
    requiresClassification: true
  }, valueByClassification);
}

function rule(id, label, pts, metadata = {}, valueByClassification = null) {
  return {
    id,
    label,
    pts,
    ...(valueByClassification ? { valueByClassification } : {}),
    metadata
  };
}

function dq(id, label, metadata = {}) {
  return { id, label, metadata };
}

function timingMetadata(timingAdjustment, metadata = {}) {
  return { ...metadata, timingAdjustment, automaticOnly: true };
}

function matrix(excelente, buena, regular, mediaRegular, minima) {
  return Object.freeze({
    EXCELENTE: excelente,
    BUENA: buena,
    REGULAR: regular,
    MEDIA_REGULAR: mediaRegular,
    MINIMA: minima
  });
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
    timeEvidence: Array.isArray(source.timeEvidence) ? source.timeEvidence.map((item) => ({ ...item })) : [],
    classification: source.classification ? { ...source.classification } : null,
    timing: source.timing ? { ...source.timing, adjustments: Array.isArray(source.timing.adjustments) ? source.timing.adjustments.map((item) => ({ ...item })) : [] } : null,
    resolvedRuleValues: { ...(source.resolvedRuleValues || {}) }
  };
}

function formatElapsed(elapsedMs) {
  const minutes = Math.floor(elapsedMs / 60000);
  const seconds = Math.floor((elapsedMs % 60000) / 1000);
  const tenths = Math.floor((elapsedMs % 1000) / 100);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

function freezeRules(rules) {
  return Object.freeze(rules.map((item) => Object.freeze({
    ...item,
    ...(item.valueByClassification ? { valueByClassification: Object.freeze({ ...item.valueByClassification }) } : {}),
    metadata: Object.freeze({ ...(item.metadata || {}) })
  })));
}

function freezeDisabledRules(items) {
  return Object.freeze(items.map(([category, id]) => Object.freeze({ category, id })));
}

export const CALA_RULEBOOK_VERSION = "cala_base_reglamento_2026_06";

export const CALA_BASE_RULES = [
  { id: "cala_base_completa", pts: 20, label: "Base Cala" }
];

export const CALA_ADIC_RULES = [
  { id: "cala_lado_derecho_velocidad", pts: 2, label: "Lado derecho: velocidad y 6 vueltas" },
  { id: "cala_lado_derecho_pivote", pts: 1, label: "Lado derecho: pata de apoyo" },
  { id: "cala_lado_izquierdo_velocidad", pts: 2, label: "Lado izquierdo: velocidad y 6 vueltas" },
  { id: "cala_lado_izquierdo_pivote", pts: 1, label: "Lado izquierdo: pata de apoyo" },
  { id: "cala_medio_derecho", pts: 1, label: "Medio lado derecho" },
  { id: "cala_medio_izquierdo", pts: 1, label: "Medio lado izquierdo" },
  { id: "cala_cambio_rectangulo_costado", pts: 1, label: "Cambio de rectangulo de lado o dando pierna" }
];

export const CALA_INFR_RULES = [
  { id: "cala_inf_abrir_hocico", pts: 1, label: "Abrir hocico, excepto en punta" },
  { id: "cala_inf_rabear_espiguear", pts: 1, label: "Rabear o espiguear" },
  { id: "cala_inf_enjetarse", pts: 1, label: "Enjetarse" },
  { id: "cala_inf_cachetear", pts: 1, label: "Cachetear" },
  { id: "cala_inf_estrellar_despapar_gorbetear", pts: 1, label: "Estrellar, despapar o gorbetear" },
  { id: "cala_inf_alborotarse", pts: 1, label: "Alborotarse" },
  { id: "cala_inf_no_correr_recto", pts: 1, label: "No correr en linea recta" },
  { id: "cala_inf_no_poner_en_mano", pts: 1, label: "No poner totalmente en mano" },
  { id: "cala_inf_cambiar_mano", pts: 1, label: "Cambiar de mano durante los ejercicios" },
  { id: "cala_inf_patada_una_extremidad", pts: 4, label: "Patada con una extremidad" },
  { id: "cala_inf_lados_caminando", pts: 2, label: "Lados caminando o sin apoyar en cuartos traseros" },
  { id: "cala_inf_espalda_fin_lado", pts: 5, label: "Dar espalda al terminar el lado" },
  { id: "cala_inf_medio_incompleto", pts: 1, label: "No completar 180 grados en medio lado" },
  { id: "cala_inf_anticiparse", pts: 5, label: "Anticiparse al mando" },
  { id: "cala_inf_ceja_fuera_linea", pts: 1, label: "Ceja fuera de linea o sin tomar el centro" },
  { id: "cala_inf_disminuir_velocidad_lado", pts: 4, label: "Titubear o disminuir velocidad en lado" },
  { id: "cala_inf_disminuir_velocidad_ceja", pts: 4, label: "Disminuir velocidad en ceja" },
  { id: "cala_inf_sangrado", pts: 2, label: "Sangrado de hocico, ijares o barbada" }
];

export const CALA_DESC_RULES = [
  { id: "cala_desc_salirse_rectangulo", label: "Salirse del rectangulo" },
  { id: "cala_desc_caida_jinete", label: "Caida del jinete" },
  { id: "cala_desc_caida_caballo", label: "Caida del caballo" },
  { id: "cala_desc_apearse", label: "Apearse" },
  { id: "cala_desc_reparo", label: "Caballo repara o se levanta de manos" },
  { id: "cala_desc_patada_doble", label: "Patada con ambas extremidades" },
  { id: "cala_desc_dos_manos", label: "Usar dos manos" },
  { id: "cala_desc_abrir_manquear_rienda", label: "Abrir o manquear la rienda" },
  { id: "cala_desc_faena_incompleta", label: "No completar la faena" },
  { id: "cala_desc_negarse_movimiento", label: "Negarse a ejecutar un movimiento" },
  { id: "cala_desc_romper_secuencia", label: "Romper secuencia o continuidad" },
  { id: "cala_desc_competidor_distinto", label: "Competidor distinto al que presento el freno" },
  { id: "cala_desc_cambio_freno_caballo", label: "Cambiar freno o cabalgadura" },
  { id: "cala_desc_no_cambio_rectangulo", label: "No cambiar correctamente de rectangulo" },
  { id: "cala_desc_no_cejar_60m", label: "No cejar hasta la linea de 60 metros" },
  { id: "cala_desc_dos_minutos", label: "Rebasar dos minutos sin arrancar" },
  { id: "cala_desc_persona_rectangulos", label: "Persona no autorizada cerca de los rectangulos" }
];

export const CALA_TEAM_PENALTY_RULES = [
  { id: "cala_equipo_revisor_no_compite", pts: 5, label: "Revisor de punta no participa en faena" },
  { id: "cala_equipo_revisor_entra_rectangulo", pts: 2, label: "Revisor de punta ingresa al rectangulo" }
];

export const CALA_ADIC_SECTIONS = [
  {
    code: "LD",
    label: "Lado derecho",
    ids: ["cala_lado_derecho_velocidad", "cala_lado_derecho_pivote"]
  },
  {
    code: "LI",
    label: "Lado izquierdo",
    ids: ["cala_lado_izquierdo_velocidad", "cala_lado_izquierdo_pivote"]
  },
  {
    code: "ML",
    label: "Medios lados",
    ids: ["cala_medio_derecho", "cala_medio_izquierdo"]
  },
  {
    code: "CR",
    label: "Cambio de rectangulo",
    ids: ["cala_cambio_rectangulo_costado"]
  }
];

const NEW_CALA_IDS = new Set([
  ...CALA_BASE_RULES,
  ...CALA_ADIC_RULES,
  ...CALA_INFR_RULES,
  ...CALA_DESC_RULES
].map((rule) => rule.id));

const LEGACY_CALA_IDS = new Set([
  "cb1", "ca0", "ca1", "ca2", "ca3", "ca4", "ca5", "ca6", "ca7", "ca8", "ca9", "ca10", "ca11",
  "ci1", "ci2", "ci3", "ci4", "ci5", "ci6", "ci7", "ci8", "ci9",
  "cd1", "cd2", "cd3"
]);

const LEGACY_ADIC_MAP = {
  ca0: ["cala_lado_derecho_pivote"],
  ca1: ["cala_lado_derecho_velocidad"],
  ca2: ["cala_lado_derecho_velocidad", "cala_lado_derecho_pivote"],
  ca11: ["cala_lado_izquierdo_pivote"],
  ca3: ["cala_lado_izquierdo_velocidad"],
  ca4: ["cala_lado_izquierdo_velocidad", "cala_lado_izquierdo_pivote"],
  ca5: ["cala_medio_derecho"],
  ca6: ["cala_medio_derecho"],
  ca7: ["cala_medio_izquierdo"],
  ca8: ["cala_medio_izquierdo"],
  ca9: ["cala_cambio_rectangulo_costado"]
};

const LEGACY_INFR_MAP = {
  ci1: ["cala_inf_rabear_espiguear"],
  ci2: ["cala_inf_estrellar_despapar_gorbetear"],
  ci3: ["cala_inf_patada_una_extremidad"],
  ci4: ["cala_inf_abrir_hocico"]
};

const LEGACY_INFR_KEEP_AS_LEGACY = {
  ci5: { label: "Regla anterior: Negarse", pts: 2 },
  ci6: { label: "Regla anterior: Apoyarse", pts: 2 },
  ci7: { label: "Regla anterior: Dar paso", pts: 1 },
  ci8: { label: "Regla anterior: Bailar", pts: 1 },
  ci9: { label: "Regla anterior: Caida", pts: 3 }
};

const LEGACY_ADIC_KEEP_AS_LEGACY = {
  ca10: { label: "Regla anterior: Ceja", pts: 2 }
};

export function calculatePuntaBreakdown(attempt = {}) {
  const metros = Math.max(0, Math.floor(Number(attempt.puntaMetros) || 0));
  const tiempos = Math.max(1, Math.floor(Number(attempt.puntaPiquetes) || 1));
  let puntosDistancia = 0;
  let puntosTiempos = 0;

  if (metros >= 6 && tiempos <= 4) {
    puntosDistancia = Math.max(0, metros - 6);
    if (tiempos === 1) puntosTiempos = 3;
    else if (tiempos === 2) puntosTiempos = 2;
    else if (tiempos === 3) puntosTiempos = 1;
  }

  return {
    metros,
    tiempos,
    puntosDistancia,
    puntosTiempos,
    total: puntosDistancia + puntosTiempos
  };
}

export function sumTeamPenalties(attempt = {}) {
  return (attempt.teamPenalties || []).reduce((sum, penalty) => {
    const quantity = Math.max(1, Number(penalty.quantity || 1));
    const total = penalty.total === undefined || penalty.total === null
      ? Number(penalty.pts || 0) * quantity
      : Number(penalty.total || 0);
    return sum + total;
  }, 0);
}

export function normalizeTeamPenalty(rule = {}) {
  const catalogRule = CALA_TEAM_PENALTY_RULES.find((item) => item.id === rule.id) || rule;
  const quantity = Math.max(1, Number(rule.quantity || 1));
  const pts = Number(catalogRule.pts || rule.pts || 0);
  return {
    id: String(catalogRule.id || rule.id || ""),
    label: String(catalogRule.label || rule.label || "Infraccion al equipo"),
    pts,
    quantity,
    total: pts * quantity
  };
}

export function normalizeCalaRuleOverrideCatalog(catalog = {}) {
  if (!catalog || typeof catalog !== "object") return catalog || {};
  if (!hasLegacyCalaCatalog(catalog)) return catalog;

  return {
    ...catalog,
    base: withCustomRules(CALA_BASE_RULES, catalog.base),
    adic: withCustomRules(CALA_ADIC_RULES, catalog.adic),
    infr: withCustomRules(CALA_INFR_RULES, catalog.infr),
    desc: withCustomRules(CALA_DESC_RULES, catalog.desc)
  };
}

export function hasLegacyCalaCatalog(catalog = {}) {
  return ["base", "adic", "infr", "desc"].some((group) =>
    (catalog[group] || []).some((rule) => LEGACY_CALA_IDS.has(rule?.id))
  );
}

export function migrateCalaAttempt(attempt = {}) {
  if (!attempt || typeof attempt !== "object") return [];
  const changes = [];
  const applied = Array.isArray(attempt.applied) ? attempt.applied : [];
  const nextApplied = new Set();

  applied.forEach((id) => {
    if (id === "cb1") {
      nextApplied.add("cala_base_completa");
      changes.push("cb1 -> cala_base_completa");
      return;
    }

    if (LEGACY_ADIC_MAP[id]) {
      LEGACY_ADIC_MAP[id].forEach((nextId) => nextApplied.add(nextId));
      changes.push(`${id} -> ${LEGACY_ADIC_MAP[id].join("+")}`);
      return;
    }

    if (LEGACY_ADIC_KEEP_AS_LEGACY[id]) {
      addLegacyCustom(attempt, "customAdic", id, LEGACY_ADIC_KEEP_AS_LEGACY[id]);
      changes.push(`${id} -> legacy custom adicional`);
      return;
    }

    if (LEGACY_INFR_MAP[id]) {
      LEGACY_INFR_MAP[id].forEach((nextId) => nextApplied.add(nextId));
      changes.push(`${id} -> ${LEGACY_INFR_MAP[id].join("+")}`);
      return;
    }

    if (LEGACY_INFR_KEEP_AS_LEGACY[id]) {
      addLegacyCustom(attempt, "customInfr", id, LEGACY_INFR_KEEP_AS_LEGACY[id]);
      changes.push(`${id} -> legacy custom infraccion`);
      return;
    }

    if (!LEGACY_CALA_IDS.has(id)) nextApplied.add(id);
  });

  if (String(attempt.desc || "").toLowerCase() === "sangre hocico") {
    attempt.desc = null;
    nextApplied.add("cala_inf_sangrado");
    changes.push("Sangre hocico desc -> cala_inf_sangrado");
  }

  attempt.applied = [...nextApplied];
  attempt.teamPenalties = (attempt.teamPenalties || []).map(normalizeTeamPenalty).filter((item) => item.id);
  recalculateMigratedCalaAttempt(attempt);
  return changes;
}

function withCustomRules(baseRules, storedRules = []) {
  const baseIds = new Set(baseRules.map((rule) => rule.id));
  const customRules = (storedRules || []).filter((rule) =>
    rule &&
    !LEGACY_CALA_IDS.has(rule.id) &&
    !baseIds.has(rule.id) &&
    rule.custom
  );
  return [...baseRules, ...customRules];
}

function addLegacyCustom(attempt, key, legacyId, item) {
  attempt[key] = Array.isArray(attempt[key]) ? attempt[key] : [];
  const id = `legacy_${legacyId}`;
  if (attempt[key].some((entry) => entry.id === id || entry.legacyRuleId === legacyId)) return;
  attempt[key].push({
    id,
    legacyRuleId: legacyId,
    label: item.label,
    pts: item.pts,
    legacyRule: true
  });
}

function recalculateMigratedCalaAttempt(attempt) {
  const applied = new Set(attempt.applied || []);
  const adic = CALA_ADIC_RULES.reduce((sum, rule) => sum + (applied.has(rule.id) ? Number(rule.pts || 0) : 0), 0);
  const infr = CALA_INFR_RULES.reduce((sum, rule) => sum + (applied.has(rule.id) ? Number(rule.pts || 0) : 0), 0);
  const customAdic = (attempt.customAdic || []).reduce((sum, item) => sum + Number(item.pts || 0), 0);
  const customInfr = (attempt.customInfr || []).reduce((sum, item) => sum + Number(item.pts || 0), 0);
  const punta = calculatePuntaBreakdown(attempt);

  attempt.base = applied.has("cala_base_completa") ? 20 : Number(attempt.base || 0);
  attempt.adic = adic + customAdic;
  attempt.infr = infr + customInfr;
  attempt.puntaMetros = punta.metros;
  attempt.puntaPiquetes = punta.tiempos;
  attempt.puntaPts = punta.total;
}

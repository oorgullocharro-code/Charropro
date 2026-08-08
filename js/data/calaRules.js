export const CALA_RULEBOOK_VERSION = "cala_base_reglamento_2026_06";
export const FMCH_2026_CALA_RULEBOOK_VERSION = "fmch_2026_cala_0.2.0";
export const FMCH_2026_CALA_SOURCE = "CHARROPRO-FMCH-2026-SCORING-SPECIFICATION-001";

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

const confirmedRule = (rule, metadata = {}) => ({
  ...rule,
  metadata: {
    sourceStatus: "CONFIRMED",
    source: FMCH_2026_CALA_SOURCE,
    ...metadata
  }
});

export const FMCH_2026_CALA_BASE_RULES = [
  confirmedRule({ id: "cala_base_completa", pts: 20, label: "Cala completa" })
];

export const FMCH_2026_CALA_ADIC_RULES = [
  confirmedRule({ id: "cala_lado_derecho_velocidad", pts: 2, label: "Lado derecho: seis o mas vueltas con velocidad" }),
  confirmedRule({ id: "cala_lado_derecho_pivote", pts: 1, label: "Lado derecho: pata de apoyo en una marca" }),
  confirmedRule({ id: "cala_lado_izquierdo_velocidad", pts: 2, label: "Lado izquierdo: seis o mas vueltas con velocidad" }),
  confirmedRule({ id: "cala_lado_izquierdo_pivote", pts: 1, label: "Lado izquierdo: pata de apoyo en una marca" }),
  confirmedRule({ id: "cala_medio_derecho", pts: 1, label: "Medio lado derecho de 180 grados" }),
  confirmedRule({ id: "cala_medio_izquierdo", pts: 1, label: "Medio lado izquierdo de 180 grados" }),
  confirmedRule({ id: "cala_cambio_rectangulo_costado", pts: 1, label: "Cambio de rectangulo de costado o dando pierna" })
];

export const FMCH_2026_CALA_INFR_RULES = [
  confirmedRule({ id: "cala_inf_revision_freno_mas_un_minuto", pts: 1, label: "Revision de freno mayor a un minuto" }),
  confirmedRule({ id: "cala_inf_revision_freno_mas_dos_minutos", pts: 1, label: "Revision de freno mayor a dos minutos: punto adicional" }),
  confirmedRule({ id: "cala_inf_resistirse_enfrenar", pts: 1, label: "Resistirse a enfrenar" }),
  confirmedRule({ id: "cala_inf_resistirse_estribo", pts: 1, label: "Resistirse a dar estribo" }),
  confirmedRule({ id: "cala_inf_ingreso_lateral_rectangulo", pts: 5, label: "Ingreso lateral inicial al rectangulo" }),
  confirmedRule({ id: "cala_inf_dar_espalda_movimiento", pts: 1, label: "Dar espalda o voltear para iniciar movimiento" }),
  confirmedRule({ id: "cala_inf_patada_una_extremidad", pts: 4, label: "Patada con una extremidad" }),
  confirmedRule({ id: "cala_inf_no_saludar_inicio", pts: 1, label: "No saludar al inicio" }),
  confirmedRule({ id: "cala_inf_no_saludar_final", pts: 1, label: "No saludar al final" }),
  confirmedRule({ id: "cala_inf_no_correr_recto_ida", pts: 1, label: "No correr en linea recta de ida" }),
  confirmedRule({ id: "cala_inf_no_correr_recto_regreso", pts: 1, label: "No correr en linea recta de regreso" }),
  confirmedRule({ id: "cala_inf_estrellarse_partidero", pts: 4, label: "Estrellarse en el partidero" }),
  confirmedRule({ id: "cala_inf_alborotarse", pts: 1, label: "Alborotarse" }),
  confirmedRule({ id: "cala_inf_no_poner_en_mano", pts: 1, label: "No poner totalmente en mano" }),
  confirmedRule({ id: "cala_inf_arrancar_despues_un_minuto", pts: 1, label: "Arrancar despues de un minuto" }),
  confirmedRule({ id: "cala_inf_no_desarrollar_velocidad", pts: 4, label: "No desarrollar velocidad" }),
  confirmedRule({ id: "cala_inf_cuartear_medio_cuerpo", pts: 3, label: "Cuartear de medio cuerpo hacia delante" }),
  confirmedRule({ id: "cala_inf_parar_sobre_manos", pts: 2, label: "Parar sobre las manos o cargarse en la rienda" }),
  confirmedRule({ id: "cala_inf_rebasar_90_sin_punta", pts: 1, label: "Rebasar 90 metros sin punta adicional valida" }),
  confirmedRule({ id: "cala_inf_cuestionar_jueces_una_vez", pts: 1, label: "Cuestionar a los jueces una vez" }),
  confirmedRule({ id: "cala_inf_cejar_borrar_sin_orden", pts: 1, label: "Cejar o borrar huellas sin orden" }),
  confirmedRule({ id: "cala_inf_abrir_hocico", pts: 1, label: "Abrir hocico, excepto en punta" }),
  confirmedRule({ id: "cala_inf_rabear_espiguear", pts: 1, label: "Rabear o espiguear" }),
  confirmedRule({ id: "cala_inf_enjetarse", pts: 1, label: "Enjetarse" }),
  confirmedRule({ id: "cala_inf_cachetear", pts: 1, label: "Cachetear" }),
  confirmedRule({ id: "cala_inf_estrellar_despapar_gorbetear", pts: 1, label: "Estrellar, despapar o gorbetear" }),
  confirmedRule({ id: "cala_inf_freno_fuera_lugar", pts: 2, label: "Freno fuera de lugar" }),
  confirmedRule({ id: "cala_inf_lados_caminando", pts: 2, label: "Lado caminando o sin apoyo en cuartos traseros" }, { repeatable: true, maxQuantity: 2, unit: "lado" }),
  confirmedRule({ id: "cala_inf_espalda_fin_lado", pts: 5, label: "Dar espalda al terminar el lado" }, { repeatable: true, maxQuantity: 2, unit: "lado" }),
  confirmedRule({ id: "cala_inf_medio_incompleto", pts: 1, label: "Medio lado menor a 180 grados" }, { repeatable: true, maxQuantity: 2, unit: "lado" }),
  confirmedRule({ id: "cala_inf_anticiparse", pts: 5, label: "Anticiparse mas de 90 grados al mando" }, { repeatable: true, unit: "ocasion" }),
  confirmedRule({ id: "cala_inf_cambiar_mano", pts: 1, label: "Cambiar de mano durante los ejercicios" }),
  confirmedRule({ id: "cala_inf_cejar_antes_cambio_rectangulo", pts: 2, label: "Cejar antes del cambio de rectangulo" }),
  confirmedRule({ id: "cala_inf_ceja_fuera_linea", pts: 1, label: "Ceja fuera de linea o sin tomar el centro" }),
  confirmedRule({ id: "cala_inf_soltar_estribo", pts: 2, label: "Soltar el estribo" }),
  confirmedRule({ id: "cala_inf_mondingo_trote", pts: 1, label: "Andadura de mondingo o trote" }),
  confirmedRule({ id: "cala_inf_arreo_protector_roto", pts: 2, label: "Arreo o protector roto o desplazado" }),
  confirmedRule({ id: "cala_inf_perder_cuarta", pts: 1, label: "Perder la cuarta" }),
  confirmedRule({ id: "cala_inf_sangrado", pts: 2, label: "Sangrado de hocico, ijares o barbada" }),
  confirmedRule({ id: "cala_inf_disminuir_velocidad_lado", pts: 4, label: "Titubear o disminuir velocidad en el lado" }, { repeatable: true, maxQuantity: 2, unit: "lado" }),
  confirmedRule({ id: "cala_inf_disminuir_velocidad_ceja", pts: 4, label: "Disminuir velocidad en la ceja" }),
  confirmedRule({ id: "cala_inf_sujetarse_descanso", pts: 2, label: "Sujetarse durante el descanso" }),
  confirmedRule({ id: "cala_inf_descansar_mano_paso", pts: 2, label: "Descansar la mano durante el paso natural" })
];

export const FMCH_2026_CALA_TEAM_PENALTY_RULES = [
  confirmedRule({ id: "cala_equipo_revisor_no_compite", pts: 5, label: "Revisor de punta que no participa en otra faena" }, { scope: "team" }),
  confirmedRule({ id: "cala_equipo_revisor_entra_rectangulo", pts: 2, label: "Revisor que ingresa al rectangulo" }, { scope: "team" })
];

export const FMCH_2026_CALA_DESC_RULES = [
  confirmedRule({ id: "cala_desc_freno_arreo_prohibido_cambio", label: "Freno o arreo prohibido o cambio" }),
  confirmedRule({ id: "cala_desc_entrada_salida_incorrecta", label: "Entrada o salida incorrecta del rectangulo" }),
  confirmedRule({ id: "cala_desc_alteracion_cola_crin", label: "Alteraciones de cola o crin" }),
  confirmedRule({ id: "cala_desc_competidor_distinto", label: "Competidor distinto" }),
  confirmedRule({ id: "cala_desc_no_ir_galope", label: "No ir a galope" }),
  confirmedRule({ id: "cala_desc_vuelta_fuera_lados", label: "Dar vuelta fuera de los lados" }),
  confirmedRule({ id: "cala_desc_reparo", label: "Caballo repara o se levanta de manos" }),
  confirmedRule({ id: "cala_desc_punta_antes_60_parar_antes_70", label: "Punta antes de 60 metros o parar antes de 70 metros" }),
  confirmedRule({ id: "cala_desc_negativa_enfrenar_estribar", label: "Negativa a enfrenar o estribar" }),
  confirmedRule({ id: "cala_desc_salirse_rectangulo", label: "Salirse del rectangulo" }),
  confirmedRule({ id: "cala_desc_no_parar_llamado", label: "No parar al llamado" }),
  confirmedRule({ id: "cala_desc_no_cambio_rectangulo", label: "No cambiar de rectangulo" }),
  confirmedRule({ id: "cala_desc_caida_caballo", label: "Caida del caballo" }),
  confirmedRule({ id: "cala_desc_caida_jinete", label: "Caida del jinete" }),
  confirmedRule({ id: "cala_desc_apearse", label: "Apearse el jinete" }),
  confirmedRule({ id: "cala_desc_segunda_discusion", label: "Segunda discusion" }),
  confirmedRule({ id: "cala_desc_cuarta_ausente_mal_ubicada", label: "Cuarta ausente o mal ubicada" }),
  confirmedRule({ id: "cala_desc_cadenilla_incorrecta", label: "Cadenilla incorrecta" }),
  confirmedRule({ id: "cala_desc_abrir_manquear_rienda", label: "Abrir o manquear la rienda" }),
  confirmedRule({ id: "cala_desc_apoyo_evitar_caida", label: "Apoyarse para evitar la caida" }),
  confirmedRule({ id: "cala_desc_faena_incompleta_negativa", label: "Faena incompleta o negativa a ejecutarla" }),
  confirmedRule({ id: "cala_desc_romper_secuencia", label: "Romper la secuencia o repetir un movimiento" }),
  confirmedRule({ id: "cala_desc_dos_manos", label: "Usar dos manos" }),
  confirmedRule({ id: "cala_desc_caballo_otro_equipo_fase", label: "Caballo presentado por otro equipo en la misma fase" }),
  confirmedRule({ id: "cala_desc_dos_minutos", label: "Rebasar dos minutos sin arrancar" }),
  confirmedRule({ id: "cala_desc_no_cejar_60m", label: "No cejar hasta la linea de 60 metros" }),
  confirmedRule({ id: "cala_desc_remendar_arreo", label: "Remendar el arreo" }),
  confirmedRule({ id: "cala_desc_no_galope_despues_20m", label: "No ir a galope despues de 20 metros" }),
  confirmedRule({ id: "cala_desc_adelanto_ceja_mas_90", label: "Adelantarse mas de 90 grados en la ceja" }),
  confirmedRule({ id: "cala_desc_persona_rectangulos", label: "Personas cerca de los rectangulos" }),
  confirmedRule({ id: "cala_desc_no_volver_frente", label: "No volver de frente" }),
  confirmedRule({ id: "cala_desc_presentador_diferente", label: "Presentador diferente" }),
  confirmedRule({ id: "cala_desc_salida_incorrecta_revision", label: "Salida incorrecta despues de la revision del freno" }),
  confirmedRule({ id: "cala_desc_cambio_freno_caballo", label: "Cambio de freno o cabalgadura" }),
  confirmedRule({ id: "cala_desc_patada_doble", label: "Patada con ambas extremidades" }),
  confirmedRule({ id: "cala_desc_retirarse_ruedo_revision", label: "Retirarse del ruedo despues de la revision" })
];

export const FMCH_2026_CALA_DISABLED_LEGACY_RULES = [
  { id: "cala_inf_no_correr_recto", category: "infr", reason: "Sustituida por identidades separadas para ida y regreso" },
  { id: "cala_desc_faena_incompleta", category: "desc", reason: "Sustituida por la causa oficial combinada" },
  { id: "cala_desc_negarse_movimiento", category: "desc", reason: "Sustituida por la causa oficial combinada" }
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
  const rawMetros = Number(attempt.puntaMetros);
  const metros = Math.max(0, Number.isFinite(rawMetros) ? rawMetros : 0);
  const metrosEnteros = Math.floor(metros);
  const centimetros = Math.round((metros - metrosEnteros) * 100);
  const metrosCalificados = centimetros > 51 ? metrosEnteros + 1 : metrosEnteros;
  const tiempos = Math.max(1, Math.floor(Number(attempt.puntaPiquetes) || 1));
  let puntosDistancia = 0;
  let puntosTiempos = 0;

  if (metrosCalificados >= 6 && tiempos <= 4) {
    puntosDistancia = Math.max(0, metrosCalificados - 6);
    if (tiempos === 1) puntosTiempos = 3;
    else if (tiempos === 2) puntosTiempos = 2;
    else if (tiempos === 3) puntosTiempos = 1;
  }

  return {
    metros,
    metrosCalificados,
    centimetros,
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
  const quantityFor = (ruleId) => Math.max(1, Number(attempt.ruleQuantities?.[ruleId] || 1));
  const adic = CALA_ADIC_RULES.reduce((sum, rule) => sum + (applied.has(rule.id) ? Number(rule.pts || 0) * quantityFor(rule.id) : 0), 0);
  const infr = CALA_INFR_RULES.reduce((sum, rule) => sum + (applied.has(rule.id) ? Number(rule.pts || 0) * quantityFor(rule.id) : 0), 0);
  const customAdic = (attempt.customAdic || []).reduce((sum, item) => sum + Number(item.pts || 0), 0);
  const customInfr = (attempt.customInfr || []).reduce((sum, item) => sum + Number(item.pts || 0), 0);
  const punta = calculatePuntaBreakdown(attempt);

  attempt.base = applied.has("cala_base_completa") ? 20 : Number(attempt.base || 0);
  attempt.adic = adic + customAdic;
  attempt.infr = infr + customInfr;
  attempt.puntaMetros = punta.metros;
  attempt.puntaMetrosCalificados = punta.metrosCalificados;
  attempt.puntaCentimetros = punta.centimetros;
  attempt.puntaPiquetes = punta.tiempos;
  attempt.puntaPts = punta.total;
}

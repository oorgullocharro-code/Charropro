export const FMCH_2026_BRAKE_REVIEW_PHASE_ID = "freno_review";
export const FMCH_2026_CALA_EXECUTION_PHASE_ID = "cala_execution";
export const FMCH_2026_BRAKE_REVIEW_SOURCE = "CHARROPRO-FMCH-2026-LIBRE-0.6.1-BRAKE-REVIEW-RULE-RECONCILIATION-001";

const RULEBOOK = Object.freeze({
  name: "Reglamento Oficial General para Competencias de Charros 2024-2028",
  revision: "VF2-2026",
  sha256: "1343e2205c7b6599a2ab7e93a809a5a45bd5ab1aadaba2f5a25bf43db8b4af2b"
});

const BAD_POINTS_FIELDS = Object.freeze({
  family: "FMCH.TEAM_SHEET.CALA.BAD_POINT_01..08",
  total: "FMCH.TEAM_SHEET.CALA.BAD_POINTS_TOTAL",
  partial: "FMCH.TEAM_SHEET.CALA.PARTIAL_POINTS"
});

const DQ_FIELDS = Object.freeze({
  state: "DQ",
  total: "FMCH.TEAM_SHEET.CALA.TOTAL"
});

const EXCLUSIVE_REVIEW_RULE_IDS = new Set([
  "cala_inf_revision_freno_mas_un_minuto",
  "cala_inf_revision_freno_mas_dos_minutos",
  "cala_inf_resistirse_enfrenar",
  "cala_inf_resistirse_estribo",
  "cala_desc_negativa_enfrenar_estribar",
  "cala_desc_competidor_distinto",
  "cala_desc_caballo_otro_equipo_fase",
  "cala_desc_salida_incorrecta_revision",
  "cala_desc_cambio_freno_caballo",
  "cala_desc_retirarse_ruedo_revision"
]);

const CROSS_PHASE_RULE_IDS = new Set([
  "cala_inf_patada_una_extremidad",
  "cala_desc_salirse_rectangulo",
  "cala_desc_persona_rectangulos",
  "cala_desc_patada_doble"
]);

const DISABLED_ALIAS_RESOLUTIONS = Object.freeze({
  cala_desc_freno_arreo_prohibido_cambio: Object.freeze({
    semanticStatus: "SUPERSEDED_AMBIGUOUS_IDENTITY",
    replacedBy: Object.freeze([
      "cala_desc_revision_freno_arreo_prohibido_riendas_disparejas",
      "cala_desc_cambio_freno_caballo"
    ])
  }),
  cala_desc_presentador_diferente: Object.freeze({
    semanticStatus: "DISABLED_SEMANTIC_ALIAS",
    aliasOf: "cala_desc_competidor_distinto"
  })
});

export const FMCH_2026_BRAKE_REVIEW_NEW_RULES = Object.freeze([
  Object.freeze({
    suerteId: "cala",
    category: "desc",
    ruleId: "cala_desc_revision_freno_mas_tres_minutos",
    label: "Revision de freno mayor a tres minutos",
    enabled: true,
    order: 36,
    metadata: Object.freeze({
      phaseId: FMCH_2026_BRAKE_REVIEW_PHASE_ID,
      phaseOwnership: "BRAKE_REVIEW",
      semanticStatus: "RESOLVED_NEW_RULE_ID",
      consequence: "DISQUALIFICATION",
      temporalRuleId: "fmch_2026_cala_freno_review",
      officialFormat: DQ_FIELDS,
      sourceArticle: 77,
      sourcePages: Object.freeze([28]),
      source: FMCH_2026_BRAKE_REVIEW_SOURCE
    })
  }),
  Object.freeze({
    suerteId: "cala",
    category: "desc",
    ruleId: "cala_desc_revision_montar_sin_estribo_izquierdo_o_por_derecha",
    label: "No usar estribo izquierdo o montar por el lado derecho",
    enabled: true,
    order: 37,
    metadata: Object.freeze({
      phaseId: FMCH_2026_BRAKE_REVIEW_PHASE_ID,
      phaseOwnership: "BRAKE_REVIEW",
      semanticStatus: "RESOLVED_NEW_RULE_ID",
      consequence: "DISQUALIFICATION",
      officialFormat: DQ_FIELDS,
      sourceDisqualification: "IX",
      sourcePages: Object.freeze([42]),
      source: FMCH_2026_BRAKE_REVIEW_SOURCE
    })
  }),
  Object.freeze({
    suerteId: "cala",
    category: "desc",
    ruleId: "cala_desc_revision_freno_arreo_prohibido_riendas_disparejas",
    label: "Freno o arreo prohibido o riendas disparejas en la revision",
    enabled: true,
    order: 38,
    metadata: Object.freeze({
      phaseId: FMCH_2026_BRAKE_REVIEW_PHASE_ID,
      phaseOwnership: "BRAKE_REVIEW",
      semanticStatus: "RESOLVED_SPLIT_CANONICAL",
      consequence: "DISQUALIFICATION",
      officialFormat: DQ_FIELDS,
      sourceDisqualification: "I",
      sourcePages: Object.freeze([42]),
      source: FMCH_2026_BRAKE_REVIEW_SOURCE
    })
  })
]);

export const FMCH_2026_BRAKE_REVIEW_CANONICAL_RULE_IDS = Object.freeze([
  "cala_inf_revision_freno_mas_un_minuto",
  "cala_inf_revision_freno_mas_dos_minutos",
  "cala_desc_revision_freno_mas_tres_minutos",
  "cala_inf_resistirse_enfrenar",
  "cala_inf_resistirse_estribo",
  "cala_desc_negativa_enfrenar_estribar",
  "cala_desc_revision_montar_sin_estribo_izquierdo_o_por_derecha",
  "cala_desc_revision_freno_arreo_prohibido_riendas_disparejas",
  "cala_desc_competidor_distinto",
  "cala_desc_salirse_rectangulo",
  "cala_desc_caballo_otro_equipo_fase",
  "cala_desc_salida_incorrecta_revision",
  "cala_desc_cambio_freno_caballo",
  "cala_desc_retirarse_ruedo_revision",
  "cala_inf_patada_una_extremidad",
  "cala_desc_patada_doble",
  "cala_desc_persona_rectangulos"
]);

export const FMCH_2026_BRAKE_REVIEW_RECONCILIATION = Object.freeze([
  ...FMCH_2026_BRAKE_REVIEW_CANONICAL_RULE_IDS.map((ruleId) => Object.freeze({
    ruleId,
    classification: FMCH_2026_BRAKE_REVIEW_NEW_RULES.some((rule) => rule.ruleId === ruleId)
      ? "RESOLVED_NEW_RULE_ID"
      : "RESOLVED_CANONICAL"
  })),
  Object.freeze({ ruleId: null, concept: "FORCE_MAJEURE_APPROVED_CHANGE", classification: "NOT_SCORING" }),
  Object.freeze({ ruleId: null, concept: "WAITING_PARADE_AND_JUDGES_CALL", classification: "NOT_SCORING" })
]);

export function buildFmch2026BrakeReviewProfileRules(sourceRules = []) {
  const reconciled = sourceRules.map((rule) => {
    const aliasResolution = DISABLED_ALIAS_RESOLUTIONS[rule.ruleId];
    if (aliasResolution) {
      return {
        ...rule,
        enabled: false,
        metadata: {
          ...(rule.metadata || {}),
          phaseId: FMCH_2026_BRAKE_REVIEW_PHASE_ID,
          phaseOwnership: "BRAKE_REVIEW",
          ...aliasResolution,
          source: FMCH_2026_BRAKE_REVIEW_SOURCE
        }
      };
    }
    if (!EXCLUSIVE_REVIEW_RULE_IDS.has(rule.ruleId) && !CROSS_PHASE_RULE_IDS.has(rule.ruleId)) return rule;
    const phaseIds = CROSS_PHASE_RULE_IDS.has(rule.ruleId)
      ? [FMCH_2026_BRAKE_REVIEW_PHASE_ID, FMCH_2026_CALA_EXECUTION_PHASE_ID]
      : [FMCH_2026_BRAKE_REVIEW_PHASE_ID];
    const isDq = rule.category === "desc";
    return {
      ...rule,
      metadata: {
        ...(rule.metadata || {}),
        phaseId: FMCH_2026_BRAKE_REVIEW_PHASE_ID,
        phaseIds,
        phaseOwnership: phaseIds.length === 1 ? "BRAKE_REVIEW" : "SHARED_CALA",
        semanticStatus: "RESOLVED_CANONICAL",
        officialFormat: isDq ? DQ_FIELDS : BAD_POINTS_FIELDS,
        source: FMCH_2026_BRAKE_REVIEW_SOURCE,
        rulebook: RULEBOOK
      }
    };
  });
  return [...reconciled, ...FMCH_2026_BRAKE_REVIEW_NEW_RULES];
}

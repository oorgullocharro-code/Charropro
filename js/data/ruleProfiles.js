import {
  FMCH_2026_CALA_ADIC_RULES,
  FMCH_2026_CALA_BASE_RULES,
  FMCH_2026_CALA_DESC_RULES,
  FMCH_2026_CALA_DISABLED_LEGACY_RULES,
  FMCH_2026_CALA_INFR_RULES,
  FMCH_2026_CALA_SOURCE,
  FMCH_2026_CALA_TEAM_PENALTY_RULES
} from "./calaRules.js?v=20260830-supervisor-tournament-deletion-authority-recovery-001-v1";
import {
  FMCH_2026_COLEADERO_ADIC_RULES,
  FMCH_2026_COLEADERO_BASE_RULES,
  FMCH_2026_COLEADERO_DESC_RULES,
  FMCH_2026_COLEADERO_DISABLED_LEGACY_RULES,
  FMCH_2026_COLEADERO_INFR_RULES,
  FMCH_2026_COLEADERO_RULEBOOK_VERSION,
  FMCH_2026_COLEADERO_TEAM_PENALTY_RULES,
  FMCH_2026_PIALES_ADIC_RULES,
  FMCH_2026_PIALES_BASE_RULES,
  FMCH_2026_PIALES_COLEADERO_SOURCE,
  FMCH_2026_PIALES_DESC_RULES,
  FMCH_2026_PIALES_DISABLED_LEGACY_RULES,
  FMCH_2026_PIALES_INFR_RULES,
  FMCH_2026_PIALES_RULEBOOK_VERSION,
  FMCH_2026_PIALES_TEAM_PENALTY_RULES
} from "./fmch2026PialesColeaderoRules.js?v=20260830-supervisor-tournament-deletion-authority-recovery-001-v1";
import {
  FMCH_2026_JINETEO_CLASSIFICATIONS,
  FMCH_2026_JINETEOS_SOURCE,
  FMCH_2026_TORO_ADIC_RULES,
  FMCH_2026_TORO_BASE_RULES,
  FMCH_2026_TORO_DESC_RULES,
  FMCH_2026_TORO_DISABLED_LEGACY_RULES,
  FMCH_2026_TORO_INFR_RULES,
  FMCH_2026_TORO_RULEBOOK_VERSION,
  FMCH_2026_TORO_TEAM_PENALTY_RULES,
  FMCH_2026_YEGUA_ADIC_RULES,
  FMCH_2026_YEGUA_BASE_RULES,
  FMCH_2026_YEGUA_DESC_RULES,
  FMCH_2026_YEGUA_DISABLED_LEGACY_RULES,
  FMCH_2026_YEGUA_INFR_RULES,
  FMCH_2026_YEGUA_RULEBOOK_VERSION,
  FMCH_2026_YEGUA_TEAM_PENALTY_RULES
} from "./fmch2026JineteosRules.js?v=20260830-supervisor-tournament-deletion-authority-recovery-001-v1";
import {
  FMCH_2026_LAZO_ADIC_RULES,
  FMCH_2026_LAZO_BASE_RULES,
  FMCH_2026_LAZO_DESC_RULES,
  FMCH_2026_LAZO_DISABLED_LEGACY_RULES,
  FMCH_2026_LAZO_INFR_RULES,
  FMCH_2026_LAZO_TEAM_PENALTY_RULES,
  FMCH_2026_PIAL_RUEDO_ADIC_RULES,
  FMCH_2026_PIAL_RUEDO_BASE_RULES,
  FMCH_2026_PIAL_RUEDO_DESC_RULES,
  FMCH_2026_PIAL_RUEDO_DISABLED_LEGACY_RULES,
  FMCH_2026_PIAL_RUEDO_INFR_RULES,
  FMCH_2026_PIAL_RUEDO_TEAM_PENALTY_RULES,
  FMCH_2026_TERNA_DURATION_MS,
  FMCH_2026_TERNA_OPPORTUNITY_LIMIT,
  FMCH_2026_TERNA_RULEBOOK_VERSION,
  FMCH_2026_TERNA_SOURCE
} from "./fmch2026TernaRules.js?v=20260830-supervisor-tournament-deletion-authority-recovery-001-v1";
import {
  FMCH_2026_MANGANAS_CABALLO_ADIC_RULES,
  FMCH_2026_MANGANAS_CABALLO_BASE_RULES,
  FMCH_2026_MANGANAS_CABALLO_DESC_RULES,
  FMCH_2026_MANGANAS_CABALLO_DISABLED_LEGACY_RULES,
  FMCH_2026_MANGANAS_CABALLO_INFR_RULES,
  FMCH_2026_MANGANAS_CABALLO_TEAM_PENALTY_RULES,
  FMCH_2026_MANGANAS_DURATION_MS,
  FMCH_2026_MANGANAS_OPPORTUNITY_LIMIT,
  FMCH_2026_MANGANAS_PASO_RULEBOOK_VERSION,
  FMCH_2026_MANGANAS_PASO_SOURCE,
  FMCH_2026_MANGANAS_PIE_ADIC_RULES,
  FMCH_2026_MANGANAS_PIE_BASE_RULES,
  FMCH_2026_MANGANAS_PIE_DESC_RULES,
  FMCH_2026_MANGANAS_PIE_DISABLED_LEGACY_RULES,
  FMCH_2026_MANGANAS_PIE_INFR_RULES,
  FMCH_2026_MANGANAS_PIE_TEAM_PENALTY_RULES,
  FMCH_2026_PASO_ADIC_RULES,
  FMCH_2026_PASO_BASE_RULES,
  FMCH_2026_PASO_CLASSIFICATIONS,
  FMCH_2026_PASO_DESC_RULES,
  FMCH_2026_PASO_DISABLED_LEGACY_RULES,
  FMCH_2026_PASO_DISMOUNT_DURATION_MS,
  FMCH_2026_PASO_EXIT_DURATION_MS,
  FMCH_2026_PASO_INFR_RULES,
  FMCH_2026_PASO_TEAM_PENALTY_RULES
} from "./fmch2026ManganasPasoRules.js?v=20260830-supervisor-tournament-deletion-authority-recovery-001-v1";
import {
  buildRuleProfileContentFingerprint,
  evaluateRuleProfileTemporalValidity
} from "./ruleProfileTemporalPolicy.js?v=20260830-supervisor-tournament-deletion-authority-recovery-001-v1";
import {
  FMCH_2026_BRAKE_REVIEW_CANONICAL_RULE_IDS,
  FMCH_2026_BRAKE_REVIEW_PHASE_ID,
  FMCH_2026_BRAKE_REVIEW_RECONCILIATION,
  FMCH_2026_BRAKE_REVIEW_SOURCE,
  buildFmch2026BrakeReviewProfileRules
} from "./fmch2026BrakeReviewRules.js?v=20260830-supervisor-tournament-deletion-authority-recovery-001-v1";

export const RULE_PROFILE_CONTRACT_VERSION = "1.0.0";

export const RULE_PROFILE_STATUSES = Object.freeze([
  "skeleton",
  "draft",
  "ready",
  "active",
  "retired",
  "deprecated",
  "archived"
]);

export const RULE_CATEGORIES = Object.freeze({
  BASE: "base",
  ADDITIONAL: "adic",
  INDIVIDUAL_INFRACTION: "infr",
  TEAM_INFRACTION: "team_infr",
  DISQUALIFICATION: "desc"
});

export const RULE_SOURCES = Object.freeze({
  PRODUCT_BASE: "PRODUCT_BASE",
  RULE_PROFILE: "RULE_PROFILE",
  TOURNAMENT_OVERRIDE: "TOURNAMENT_OVERRIDE",
  MANUAL: "MANUAL"
});

export const RULE_RENDER_MODES = Object.freeze([
  "button",
  "compact_calculator",
  "specialized_calculator",
  "metadata_only"
]);

const RULE_GROUPS = Object.freeze([
  RULE_CATEGORIES.BASE,
  RULE_CATEGORIES.ADDITIONAL,
  RULE_CATEGORIES.INDIVIDUAL_INFRACTION,
  RULE_CATEGORIES.TEAM_INFRACTION,
  RULE_CATEGORIES.DISQUALIFICATION
]);
const ACTIVE_PROFILE_STATUSES = new Set(["active", "deprecated"]);
const CONDITION_OPERATORS = new Set([
  "eq",
  "neq",
  "in",
  "not_in",
  "gt",
  "gte",
  "lt",
  "lte",
  "exists"
]);
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/;
const MAX_DEPTH = 10;
const MAX_ARRAY = 1000;
const MAX_KEYS = 300;

function buildFmchCalaProfileRule(rule, category, order) {
  return {
    suerteId: "cala",
    category,
    ruleId: rule.id,
    label: rule.label,
    ...(category === RULE_CATEGORIES.DISQUALIFICATION ? {} : { value: Number(rule.pts || 0) }),
    enabled: true,
    order,
    metadata: {
      ...(rule.metadata || {}),
      implementationTicket: "CHARROPRO-FMCH-2026-CALA-SCORER-001"
    }
  };
}

const FMCH_2026_CALA_PROFILE_RULES = [
  ...FMCH_2026_CALA_BASE_RULES.map((rule, index) => buildFmchCalaProfileRule(rule, RULE_CATEGORIES.BASE, index)),
  ...FMCH_2026_CALA_ADIC_RULES.map((rule, index) => buildFmchCalaProfileRule(rule, RULE_CATEGORIES.ADDITIONAL, index)),
  ...FMCH_2026_CALA_INFR_RULES.map((rule, index) => buildFmchCalaProfileRule(rule, RULE_CATEGORIES.INDIVIDUAL_INFRACTION, index)),
  ...FMCH_2026_CALA_TEAM_PENALTY_RULES.map((rule, index) => buildFmchCalaProfileRule(rule, RULE_CATEGORIES.TEAM_INFRACTION, index)),
  ...FMCH_2026_CALA_DESC_RULES.map((rule, index) => buildFmchCalaProfileRule(rule, RULE_CATEGORIES.DISQUALIFICATION, index)),
  ...FMCH_2026_CALA_DISABLED_LEGACY_RULES.map((rule) => ({
    suerteId: "cala",
    category: rule.category,
    ruleId: rule.id,
    enabled: false,
    metadata: {
      sourceStatus: "LEGACY_PRESERVED_DISABLED",
      source: FMCH_2026_CALA_SOURCE,
      reason: rule.reason
    }
  }))
];

function buildFmchProfileRule(suerteId, rule, category, order) {
  return {
    suerteId,
    category,
    ruleId: rule.id,
    label: rule.label,
    ...(category === RULE_CATEGORIES.DISQUALIFICATION ? {} : { value: Number(rule.pts || 0) }),
    enabled: true,
    order,
    metadata: {
      ...(rule.metadata || {}),
      source: FMCH_2026_PIALES_COLEADERO_SOURCE,
      implementationTicket: "CHARROPRO-FMCH-2026-PIALES-COLEADERO-IMPLEMENTATION-001"
    }
  };
}

function buildFmchSuerteProfileRules(suerteId, catalogs, disabledLegacyRules) {
  return [
    ...catalogs.base.map((rule, index) => buildFmchProfileRule(suerteId, rule, RULE_CATEGORIES.BASE, index)),
    ...catalogs.adic.map((rule, index) => buildFmchProfileRule(suerteId, rule, RULE_CATEGORIES.ADDITIONAL, index)),
    ...catalogs.infr.map((rule, index) => buildFmchProfileRule(suerteId, rule, RULE_CATEGORIES.INDIVIDUAL_INFRACTION, index)),
    ...catalogs.team_infr.map((rule, index) => buildFmchProfileRule(suerteId, rule, RULE_CATEGORIES.TEAM_INFRACTION, index)),
    ...catalogs.desc.map((rule, index) => buildFmchProfileRule(suerteId, rule, RULE_CATEGORIES.DISQUALIFICATION, index)),
    ...disabledLegacyRules.map((rule) => ({
      suerteId,
      category: rule.category,
      ruleId: rule.id,
      enabled: false,
      metadata: {
        sourceStatus: "LEGACY_PRESERVED_DISABLED",
        source: FMCH_2026_PIALES_COLEADERO_SOURCE,
        reason: "Reconciliado contra FMCH 2026; se conserva fisicamente para historicos"
      }
    }))
  ];
}

const FMCH_2026_PIALES_PROFILE_RULES = buildFmchSuerteProfileRules("piales", {
  base: FMCH_2026_PIALES_BASE_RULES,
  adic: FMCH_2026_PIALES_ADIC_RULES,
  infr: FMCH_2026_PIALES_INFR_RULES,
  team_infr: FMCH_2026_PIALES_TEAM_PENALTY_RULES,
  desc: FMCH_2026_PIALES_DESC_RULES
}, FMCH_2026_PIALES_DISABLED_LEGACY_RULES);

const FMCH_2026_COLEADERO_PROFILE_RULES = buildFmchSuerteProfileRules("colas", {
  base: FMCH_2026_COLEADERO_BASE_RULES,
  adic: FMCH_2026_COLEADERO_ADIC_RULES,
  infr: FMCH_2026_COLEADERO_INFR_RULES,
  team_infr: FMCH_2026_COLEADERO_TEAM_PENALTY_RULES,
  desc: FMCH_2026_COLEADERO_DESC_RULES
}, FMCH_2026_COLEADERO_DISABLED_LEGACY_RULES);

function buildFmchJineteoProfileRule(suerteId, rule, category, order) {
  return {
    suerteId,
    category,
    ruleId: rule.id,
    label: rule.label,
    ...(category === RULE_CATEGORIES.DISQUALIFICATION ? {} : { value: Number(rule.pts || 0) }),
    ...(rule.valueByClassification ? { valueByClassification: rule.valueByClassification } : {}),
    enabled: true,
    order,
    metadata: {
      ...(rule.metadata || {}),
      source: FMCH_2026_JINETEOS_SOURCE,
      implementationTicket: "CHARROPRO-FMCH-2026-JINETEOS-DYNAMIC-IMPLEMENTATION-001"
    }
  };
}

function buildFmchJineteoProfileRules(suerteId, catalogs, disabledLegacyRules) {
  return [
    ...catalogs.base.map((rule, index) => buildFmchJineteoProfileRule(suerteId, rule, RULE_CATEGORIES.BASE, index)),
    ...catalogs.adic.map((rule, index) => buildFmchJineteoProfileRule(suerteId, rule, RULE_CATEGORIES.ADDITIONAL, index)),
    ...catalogs.infr.map((rule, index) => buildFmchJineteoProfileRule(suerteId, rule, RULE_CATEGORIES.INDIVIDUAL_INFRACTION, index)),
    ...catalogs.team_infr.map((rule, index) => buildFmchJineteoProfileRule(suerteId, rule, RULE_CATEGORIES.TEAM_INFRACTION, index)),
    ...catalogs.desc.map((rule, index) => buildFmchJineteoProfileRule(suerteId, rule, RULE_CATEGORIES.DISQUALIFICATION, index)),
    ...disabledLegacyRules.map((rule) => ({
      suerteId,
      category: rule.category,
      ruleId: rule.id,
      enabled: false,
      metadata: {
        sourceStatus: "LEGACY_PRESERVED_DISABLED",
        source: FMCH_2026_JINETEOS_SOURCE,
        reason: "Reconciliado contra FMCH 2026; se conserva físicamente para históricos"
      }
    }))
  ];
}

const FMCH_2026_TORO_PROFILE_RULES = buildFmchJineteoProfileRules("toro", {
  base: FMCH_2026_TORO_BASE_RULES,
  adic: FMCH_2026_TORO_ADIC_RULES,
  infr: FMCH_2026_TORO_INFR_RULES,
  team_infr: FMCH_2026_TORO_TEAM_PENALTY_RULES,
  desc: FMCH_2026_TORO_DESC_RULES
}, FMCH_2026_TORO_DISABLED_LEGACY_RULES);

const FMCH_2026_YEGUA_PROFILE_RULES = buildFmchJineteoProfileRules("yegua", {
  base: FMCH_2026_YEGUA_BASE_RULES,
  adic: FMCH_2026_YEGUA_ADIC_RULES,
  infr: FMCH_2026_YEGUA_INFR_RULES,
  team_infr: FMCH_2026_YEGUA_TEAM_PENALTY_RULES,
  desc: FMCH_2026_YEGUA_DESC_RULES
}, FMCH_2026_YEGUA_DISABLED_LEGACY_RULES);

function buildFmchTernaProfileRule(suerteId, rule, category, order) {
  return {
    suerteId,
    category,
    ruleId: rule.id,
    label: rule.label,
    ...(category === RULE_CATEGORIES.DISQUALIFICATION ? {} : { value: Number(rule.pts || 0) }),
    enabled: true,
    order,
    metadata: {
      ...(rule.metadata || {}),
      source: FMCH_2026_TERNA_SOURCE,
      implementationTicket: "CHARROPRO-FMCH-2026-TERNA-COMPLETE-IMPLEMENTATION-001"
    }
  };
}

function buildFmchTernaProfileRules(suerteId, catalogs, disabledLegacyRules) {
  return [
    ...catalogs.base.map((rule, index) => buildFmchTernaProfileRule(suerteId, rule, RULE_CATEGORIES.BASE, index)),
    ...catalogs.adic.map((rule, index) => buildFmchTernaProfileRule(suerteId, rule, RULE_CATEGORIES.ADDITIONAL, index)),
    ...catalogs.infr.map((rule, index) => buildFmchTernaProfileRule(suerteId, rule, RULE_CATEGORIES.INDIVIDUAL_INFRACTION, index)),
    ...catalogs.team_infr.map((rule, index) => buildFmchTernaProfileRule(suerteId, rule, RULE_CATEGORIES.TEAM_INFRACTION, index)),
    ...catalogs.desc.map((rule, index) => buildFmchTernaProfileRule(suerteId, rule, RULE_CATEGORIES.DISQUALIFICATION, index)),
    ...disabledLegacyRules.map((rule) => ({
      suerteId,
      category: rule.category,
      ruleId: rule.id,
      enabled: false,
      metadata: {
        sourceStatus: "LEGACY_PRESERVED_DISABLED",
        source: FMCH_2026_TERNA_SOURCE,
        reason: "Reconciliado contra FMCH 2026; se conserva físicamente para históricos"
      }
    }))
  ];
}

const FMCH_2026_LAZO_PROFILE_RULES = buildFmchTernaProfileRules("lazo", {
  base: FMCH_2026_LAZO_BASE_RULES,
  adic: FMCH_2026_LAZO_ADIC_RULES,
  infr: FMCH_2026_LAZO_INFR_RULES,
  team_infr: FMCH_2026_LAZO_TEAM_PENALTY_RULES,
  desc: FMCH_2026_LAZO_DESC_RULES
}, FMCH_2026_LAZO_DISABLED_LEGACY_RULES);

const FMCH_2026_PIAL_RUEDO_PROFILE_RULES = buildFmchTernaProfileRules("pial_ruedo", {
  base: FMCH_2026_PIAL_RUEDO_BASE_RULES,
  adic: FMCH_2026_PIAL_RUEDO_ADIC_RULES,
  infr: FMCH_2026_PIAL_RUEDO_INFR_RULES,
  team_infr: FMCH_2026_PIAL_RUEDO_TEAM_PENALTY_RULES,
  desc: FMCH_2026_PIAL_RUEDO_DESC_RULES
}, FMCH_2026_PIAL_RUEDO_DISABLED_LEGACY_RULES);

function buildFmchManganasPasoProfileRule(suerteId, rule, category, order) {
  return {
    suerteId,
    category,
    ruleId: rule.id,
    label: rule.label,
    ...(category === RULE_CATEGORIES.DISQUALIFICATION ? {} : { value: Number(rule.pts || 0) }),
    ...(rule.valueByClassification ? { valueByClassification: rule.valueByClassification } : {}),
    enabled: true,
    order,
    metadata: {
      ...(rule.metadata || {}),
      source: FMCH_2026_MANGANAS_PASO_SOURCE,
      implementationTicket: "CHARROPRO-FMCH-2026-MANGANAS-PASO-IMPLEMENTATION-001"
    }
  };
}

function buildFmchManganasPasoProfileRules(suerteId, catalogs, disabledLegacyRules) {
  return [
    ...catalogs.base.map((rule, index) => buildFmchManganasPasoProfileRule(suerteId, rule, RULE_CATEGORIES.BASE, index)),
    ...catalogs.adic.map((rule, index) => buildFmchManganasPasoProfileRule(suerteId, rule, RULE_CATEGORIES.ADDITIONAL, index)),
    ...catalogs.infr.map((rule, index) => buildFmchManganasPasoProfileRule(suerteId, rule, RULE_CATEGORIES.INDIVIDUAL_INFRACTION, index)),
    ...catalogs.team_infr.map((rule, index) => buildFmchManganasPasoProfileRule(suerteId, rule, RULE_CATEGORIES.TEAM_INFRACTION, index)),
    ...catalogs.desc.map((rule, index) => buildFmchManganasPasoProfileRule(suerteId, rule, RULE_CATEGORIES.DISQUALIFICATION, index)),
    ...disabledLegacyRules.map((rule) => ({
      suerteId,
      category: rule.category,
      ruleId: rule.id,
      enabled: false,
      metadata: {
        sourceStatus: "LEGACY_PRESERVED_DISABLED",
        source: FMCH_2026_MANGANAS_PASO_SOURCE,
        reason: "Reconciliado contra FMCH 2026; se conserva físicamente para históricos"
      }
    }))
  ];
}

const FMCH_2026_MANGANAS_PIE_PROFILE_RULES = buildFmchManganasPasoProfileRules("manganas_pie", {
  base: FMCH_2026_MANGANAS_PIE_BASE_RULES,
  adic: FMCH_2026_MANGANAS_PIE_ADIC_RULES,
  infr: FMCH_2026_MANGANAS_PIE_INFR_RULES,
  team_infr: FMCH_2026_MANGANAS_PIE_TEAM_PENALTY_RULES,
  desc: FMCH_2026_MANGANAS_PIE_DESC_RULES
}, FMCH_2026_MANGANAS_PIE_DISABLED_LEGACY_RULES);

const FMCH_2026_MANGANAS_CABALLO_PROFILE_RULES = buildFmchManganasPasoProfileRules("manganas_caballo", {
  base: FMCH_2026_MANGANAS_CABALLO_BASE_RULES,
  adic: FMCH_2026_MANGANAS_CABALLO_ADIC_RULES,
  infr: FMCH_2026_MANGANAS_CABALLO_INFR_RULES,
  team_infr: FMCH_2026_MANGANAS_CABALLO_TEAM_PENALTY_RULES,
  desc: FMCH_2026_MANGANAS_CABALLO_DESC_RULES
}, FMCH_2026_MANGANAS_CABALLO_DISABLED_LEGACY_RULES);

const FMCH_2026_PASO_PROFILE_RULES = buildFmchManganasPasoProfileRules("paso", {
  base: FMCH_2026_PASO_BASE_RULES,
  adic: FMCH_2026_PASO_ADIC_RULES,
  infr: FMCH_2026_PASO_INFR_RULES,
  team_infr: FMCH_2026_PASO_TEAM_PENALTY_RULES,
  desc: FMCH_2026_PASO_DESC_RULES
}, FMCH_2026_PASO_DISABLED_LEGACY_RULES);

export const FMCH_2026_LIBRE_PROFILE_0_4_0 = deepFreeze({
  contractVersion: RULE_PROFILE_CONTRACT_VERSION,
  profileId: "FMCH_2026_LIBRE",
  version: "0.4.0",
  name: "FMCH 2026 Libre",
  scope: "competition",
  status: "draft",
  source: "CHARROPRO-FMCH-2026-SCORING-SPECIFICATION-001",
  rules: [
    ...FMCH_2026_CALA_PROFILE_RULES,
    ...FMCH_2026_PIALES_PROFILE_RULES,
    ...FMCH_2026_COLEADERO_PROFILE_RULES,
    ...FMCH_2026_TORO_PROFILE_RULES,
    ...FMCH_2026_YEGUA_PROFILE_RULES
  ],
  suerteMetadata: {
    cala: {
      implementationStatus: "COMPLETE_WITH_BLOCKED_FIELDS",
      fieldIdMappingStatus: "FIELDID_MAPPING_BLOCKED",
      blockedFieldIds: [
        "FMCH.TEAM_SHEET.CALA.SIDE_BAD_POINTS_SUM_CONTROL",
        "FMCH.TEAM_SHEET.CALA.PC"
      ],
      specializedCalculators: [{
        calculatorId: "cala_punta",
        renderMode: "specialized_calculator",
        implementation: "existing_preserved",
        formulaSource: FMCH_2026_CALA_SOURCE
      }]
    },
    piales: {
      implementationStatus: "COMPLETE",
      sportingCertification: "PASS",
      fieldIdMappingStatus: "EXPORT_CONTROLS_BLOCKED",
      blockedFieldIds: [
        "FMCH.TEAM_SHEET.PIALES.SIDE_CONTROL",
        "FMCH.TEAM_SHEET.PIALES.POST_INFRACTION_CONTROL_01",
        "FMCH.TEAM_SHEET.PIALES.POST_INFRACTION_CONTROL_02",
        "FMCH.TEAM_SHEET.PIALES.POST_INFRACTION_CONTROL_03"
      ],
      rulebookVersion: FMCH_2026_PIALES_RULEBOOK_VERSION,
      specializedCalculators: [{
        calculatorId: "piales_distancia",
        renderMode: "specialized_calculator",
        implementation: "numeric_complete_meters",
        formulaSource: FMCH_2026_PIALES_COLEADERO_SOURCE
      }]
    },
    colas: {
      implementationStatus: "COMPLETE_WITH_BLOCKED_FIELDS",
      sportingCertification: "BLOCKED",
      fieldIdMappingStatus: "FIELDID_MAPPING_BLOCKED",
      blockedFieldIds: [
        "FMCH.TEAM_SHEET.COLEADERO.PARTICIPANT_04.NAME",
        "FMCH.TEAM_SHEET.COLEADERO.BOTTOM_CONTROL_04"
      ],
      fourthRowStatus: "SOURCE_CONFIRMATION_REQUIRED",
      activeParticipantCount: 3,
      opportunitiesPerParticipant: 3,
      rulebookVersion: FMCH_2026_COLEADERO_RULEBOOK_VERSION,
      officialFallDiagramSupport: "optional_asset_not_available"
    },
    toro: {
      implementationStatus: "COMPLETE",
      sportingCertification: "PASS",
      fieldIdMappingStatus: "TRANSFORMATION_REQUIRED",
      rulebookVersion: FMCH_2026_TORO_RULEBOOK_VERSION,
      classificationControlsBase: true,
      classificationOptions: FMCH_2026_JINETEO_CLASSIFICATIONS,
      timerContract: {
        timerId: "toro_apretalamiento",
        limitMs: 300000,
        warningThresholdsMs: [180000, 240000],
        derivedAdjustments: true
      }
    },
    yegua: {
      implementationStatus: "COMPLETE",
      sportingCertification: "PASS",
      fieldIdMappingStatus: "TRANSFORMATION_REQUIRED",
      rulebookVersion: FMCH_2026_YEGUA_RULEBOOK_VERSION,
      classificationControlsBase: true,
      classificationOptions: FMCH_2026_JINETEO_CLASSIFICATIONS,
      noReparaClassificationId: "MINIMA",
      timerContract: {
        timerId: "yegua_apretalamiento",
        limitMs: 300000,
        warningThresholdsMs: [180000, 240000],
        derivedAdjustments: true
      }
    }
  },
  metadata: {
    jurisdiction: "FMCH",
    category: "Libre",
    implementationStatus: "cala_piales_coleadero_jineteos_technical_complete_activation_blocked",
    sportsRulesLoaded: true,
    loadedSuerteIds: ["cala", "piales", "colas", "toro", "yegua"],
    activationReady: false,
    activationBlockReason: "Cala ML/CR frente a MD/MI/PC y cuarta fila de Coleadero requieren confirmacion de fuente"
  }
});

export const FMCH_2026_LIBRE_PROFILE_0_5_0 = deepFreeze({
  ...FMCH_2026_LIBRE_PROFILE_0_4_0,
  version: "0.5.0",
  rules: [
    ...FMCH_2026_LIBRE_PROFILE_0_4_0.rules,
    ...FMCH_2026_LAZO_PROFILE_RULES,
    ...FMCH_2026_PIAL_RUEDO_PROFILE_RULES
  ],
  suerteMetadata: {
    ...FMCH_2026_LIBRE_PROFILE_0_4_0.suerteMetadata,
    lazo: {
      implementationStatus: "COMPLETE",
      sportingCertification: "PASS",
      fieldIdMappingStatus: "TRANSFORMATION_REQUIRED",
      rulebookVersion: FMCH_2026_TERNA_RULEBOOK_VERSION,
      sharedDomain: "terna",
      scoringAttempts: FMCH_2026_TERNA_OPPORTUNITY_LIMIT,
      sharedOpportunityLimit: FMCH_2026_TERNA_OPPORTUNITY_LIMIT,
      timerContract: {
        timerId: "terna",
        limitMs: FMCH_2026_TERNA_DURATION_MS,
        mode: "shared_countdown",
        officialPausesExcluded: true
      }
    },
    pial_ruedo: {
      implementationStatus: "COMPLETE",
      sportingCertification: "PASS",
      fieldIdMappingStatus: "TRANSFORMATION_REQUIRED",
      rulebookVersion: FMCH_2026_TERNA_RULEBOOK_VERSION,
      sharedDomain: "terna",
      scoringAttempts: FMCH_2026_TERNA_OPPORTUNITY_LIMIT,
      sharedOpportunityLimit: FMCH_2026_TERNA_OPPORTUNITY_LIMIT,
      timerContract: {
        timerId: "terna",
        limitMs: FMCH_2026_TERNA_DURATION_MS,
        mode: "shared_countdown",
        officialPausesExcluded: true
      }
    }
  },
  metadata: {
    ...FMCH_2026_LIBRE_PROFILE_0_4_0.metadata,
    implementationStatus: "cala_piales_coleadero_jineteos_terna_technical_complete_activation_blocked",
    loadedSuerteIds: ["cala", "piales", "colas", "toro", "lazo", "pial_ruedo", "yegua"],
    activationReady: false,
    activationBlockReason: "Cala ML/CR frente a MD/MI/PC y cuarta fila de Coleadero requieren confirmación de fuente"
  }
});

export const FMCH_2026_LIBRE_PROFILE_0_6_0 = deepFreeze({
  ...FMCH_2026_LIBRE_PROFILE_0_5_0,
  version: "0.6.0",
  rules: [
    ...FMCH_2026_LIBRE_PROFILE_0_5_0.rules,
    ...FMCH_2026_MANGANAS_PIE_PROFILE_RULES,
    ...FMCH_2026_MANGANAS_CABALLO_PROFILE_RULES,
    ...FMCH_2026_PASO_PROFILE_RULES
  ],
  suerteMetadata: {
    ...FMCH_2026_LIBRE_PROFILE_0_5_0.suerteMetadata,
    cala: {
      ...FMCH_2026_LIBRE_PROFILE_0_5_0.suerteMetadata.cala,
      implementationStatus: "COMPLETE",
      sportingCertification: "PASS",
      fieldIdMappingStatus: "CERTIFIED_ALIASES_WITH_NON_SPORTING_CONTROL",
      blockedFieldIds: [],
      fieldIdMappings: {
        "FMCH.TEAM_SHEET.CALA.MD": {
          classification: "PRINTED_FIELD_ALIAS",
          groupId: "ML",
          ruleId: "cala_medio_derecho",
          officialSourceArticle: 94,
          officialSourcePage: 39
        },
        "FMCH.TEAM_SHEET.CALA.MI": {
          classification: "PRINTED_FIELD_ALIAS",
          groupId: "ML",
          ruleId: "cala_medio_izquierdo",
          officialSourceArticle: 94,
          officialSourcePage: 39
        },
        "FMCH.TEAM_SHEET.CALA.PC": {
          classification: "PRINTED_FIELD_ALIAS",
          groupId: "CR",
          ruleId: "cala_cambio_rectangulo_costado",
          officialSourceArticle: 94,
          officialSourcePage: 39
        }
      },
      nonSportingControls: [{
        fieldId: "FMCH.TEAM_SHEET.CALA.SIDE_BAD_POINTS_SUM_CONTROL",
        classification: "CONTROL_SUBTOTAL_VALIDATION",
        scoringEffect: "NONE",
        exactAdministrativePurpose: "NON_BLOCKING_DOCUMENTATION_GAP"
      }]
    },
    colas: {
      ...FMCH_2026_LIBRE_PROFILE_0_5_0.suerteMetadata.colas,
      implementationStatus: "COMPLETE",
      sportingCertification: "PASS",
      fieldIdMappingStatus: "SPORTING_MODEL_CERTIFIED_WITH_NON_SPORTING_CONTROLS",
      blockedFieldIds: [],
      fourthRowStatus: "NON_SPORTING_ADMINISTRATIVE_ROW",
      activeParticipantCount: 3,
      opportunitiesPerParticipant: 3,
      officialSourceArticles: [113, 114, 115, 121],
      officialSourcePages: [50, 51],
      nonSportingControls: [
        {
          fieldId: "FMCH.TEAM_SHEET.COLEADERO.PARTICIPANT_04.NAME",
          classification: "ADMINISTRATIVE_NON_COMPETITOR_ROW",
          scoringEffect: "NONE",
          exactAdministrativePurpose: "NON_BLOCKING_DOCUMENTATION_GAP"
        },
        {
          fieldId: "FMCH.TEAM_SHEET.COLEADERO.BOTTOM_CONTROL_04",
          classification: "ADMINISTRATIVE_CONTROL",
          scoringEffect: "NONE",
          exactAdministrativePurpose: "NON_BLOCKING_DOCUMENTATION_GAP"
        }
      ]
    },
    manganas_pie: {
      implementationStatus: "COMPLETE",
      sportingCertification: "PASS",
      fieldIdMappingStatus: "TRANSFORMATION_REQUIRED",
      scoringAttempts: FMCH_2026_MANGANAS_OPPORTUNITY_LIMIT,
      rulebookVersion: FMCH_2026_MANGANAS_PASO_RULEBOOK_VERSION,
      quickFloreoTotal: true,
      optionalFloreoDetail: true,
      timerContract: {
        timerId: "timer_manganas_pie",
        limitMs: FMCH_2026_MANGANAS_DURATION_MS,
        mode: "independent_countdown",
        officialPausesExcluded: true
      }
    },
    manganas_caballo: {
      implementationStatus: "COMPLETE",
      sportingCertification: "PASS",
      fieldIdMappingStatus: "TRANSFORMATION_REQUIRED",
      scoringAttempts: FMCH_2026_MANGANAS_OPPORTUNITY_LIMIT,
      rulebookVersion: FMCH_2026_MANGANAS_PASO_RULEBOOK_VERSION,
      quickFloreoTotal: true,
      optionalFloreoDetail: true,
      blockedSourceItems: [],
      contraMascaraIdentityStatus: "RESOLVED_SINGLE_CANONICAL_IDENTITY",
      contraMascaraRuleId: "manganas_caballo_base_contra_mascara",
      contraMascaraValue: 14,
      contraMascaraDuplicateRuleCreated: false,
      officialSourceArticle: 217,
      officialSourcePage: 89,
      timerContract: {
        timerId: "timer_manganas_caballo",
        limitMs: FMCH_2026_MANGANAS_DURATION_MS,
        mode: "independent_countdown",
        officialPausesExcluded: true
      }
    },
    paso: {
      implementationStatus: "COMPLETE",
      sportingCertification: "PASS",
      fieldIdMappingStatus: "TRANSFORMATION_REQUIRED",
      rulebookVersion: FMCH_2026_MANGANAS_PASO_RULEBOOK_VERSION,
      classificationControlsBase: false,
      classificationOptions: FMCH_2026_PASO_CLASSIFICATIONS,
      timerContracts: [
        { timerId: "timer_paso_3min", limitMs: FMCH_2026_PASO_EXIT_DURATION_MS, mode: "independent_countdown" },
        { timerId: "timer_paso_1min", limitMs: FMCH_2026_PASO_DISMOUNT_DURATION_MS, mode: "independent_countdown" }
      ]
    }
  },
  metadata: {
    ...FMCH_2026_LIBRE_PROFILE_0_5_0.metadata,
    implementationStatus: "all_ten_suertes_technical_complete_sporting_certified_activation_pending",
    loadedSuerteIds: ["cala", "piales", "colas", "toro", "lazo", "pial_ruedo", "yegua", "manganas_pie", "manganas_caballo", "paso"],
    activationReady: false,
    activationReadyEligibility: true,
    sportingCertification: "PASS",
    certificationTicket: "CHARROPRO-FMCH-2026-RULE-PROFILE-SPORTING-BLOCKERS-RESOLUTION-002",
    officialRulebook: {
      name: "Reglamento Oficial General para Competencias de Charros 2024-2028",
      revision: "VF2-2026",
      sha256: "1343e2205c7b6599a2ab7e93a809a5a45bd5ab1aadaba2f5a25bf43db8b4af2b"
    },
    remainingSportingP0Blockers: 0,
    nonBlockingDocumentationGaps: [
      "FMCH.TEAM_SHEET.CALA.SIDE_BAD_POINTS_SUM_CONTROL administrative usage",
      "FMCH.TEAM_SHEET.COLEADERO.PARTICIPANT_04.NAME administrative usage",
      "FMCH.TEAM_SHEET.COLEADERO.BOTTOM_CONTROL_04 administrative usage",
      "Printed closing-control ordering and signature substitution annotations"
    ],
    activationBlockReason: "Sporting certification complete; lifecycle authority transition required"
  }
});

// The productive alias remains pinned to the active 0.6.0 definition.
export const FMCH_2026_LIBRE_PROFILE = FMCH_2026_LIBRE_PROFILE_0_6_0;

export const FMCH_2026_LIBRE_PROFILE_0_6_1 = deepFreeze({
  ...FMCH_2026_LIBRE_PROFILE_0_6_0,
  version: "0.6.1",
  rules: buildFmch2026BrakeReviewProfileRules(FMCH_2026_LIBRE_PROFILE_0_6_0.rules),
  suerteMetadata: {
    ...FMCH_2026_LIBRE_PROFILE_0_6_0.suerteMetadata,
    cala: {
      ...FMCH_2026_LIBRE_PROFILE_0_6_0.suerteMetadata.cala,
      brakeReview: {
        phaseId: FMCH_2026_BRAKE_REVIEW_PHASE_ID,
        phaseOwnership: "BRAKE_REVIEW",
        implementationStatus: "RULES_CERTIFIED_FLOW_PENDING",
        auditedConcepts: FMCH_2026_BRAKE_REVIEW_RECONCILIATION.length,
        sportingRules: FMCH_2026_BRAKE_REVIEW_CANONICAL_RULE_IDS.length,
        missingRules: 0,
        missingFieldIds: 0,
        canonicalRuleIds: FMCH_2026_BRAKE_REVIEW_CANONICAL_RULE_IDS,
        nonScoringTransitions: [
          "FORCE_MAJEURE_APPROVED_CHANGE",
          "WAITING_PARADE_AND_JUDGES_CALL"
        ],
        temporalCompatibility: {
          status: "CERTIFIED_RULE_COMPATIBLE_RUNTIME_WIRING_DEFERRED",
          policyId: "FMCH_2026_LIBRE_OFFICIAL_TEMPORAL_RULES",
          policyVersion: "1.0.0",
          policyFingerprint: "fmchtp_7d1e001181026f6d",
          sourceProfileVersion: "0.6.0",
          contractRuleId: "fmch_2026_cala_freno_review"
        }
      }
    }
  },
  metadata: {
    ...FMCH_2026_LIBRE_PROFILE_0_6_0.metadata,
    implementationStatus: "all_ten_suertes_certified_brake_review_rules_reconciled_flow_pending",
    activationReady: false,
    activationReadyEligibility: true,
    sportingCertification: "PASS",
    certificationTicket: FMCH_2026_BRAKE_REVIEW_SOURCE,
    derivedFromVersion: "0.6.0",
    remainingSportingP0Blockers: 0,
    activationBlockReason: "Lifecycle transition and Pre-Cala operational phase wiring remain pending"
  }
});

export const RULE_PROFILES = deepFreeze([
  FMCH_2026_LIBRE_PROFILE_0_4_0,
  FMCH_2026_LIBRE_PROFILE_0_5_0,
  FMCH_2026_LIBRE_PROFILE_0_6_0,
  FMCH_2026_LIBRE_PROFILE_0_6_1
]);

export function buildRuleIdentity(suerteId, category, ruleId) {
  const cleanSuerteId = normalizeId(suerteId);
  const cleanCategory = normalizeCategory(category);
  const cleanRuleId = normalizeId(ruleId);
  return cleanSuerteId && cleanCategory && cleanRuleId
    ? `${cleanSuerteId}:${cleanCategory}:${cleanRuleId}`
    : "";
}

export function getRuleProfile(profileId, version, registry = RULE_PROFILES) {
  const cleanProfileId = normalizeId(profileId);
  const cleanVersion = normalizeVersion(version);
  if (!cleanProfileId || !cleanVersion) return null;
  return normalizeRegistry(registry).find((profile) =>
    profile?.profileId === cleanProfileId && profile?.version === cleanVersion
  ) || null;
}

export function getRuleProfileRulesByPhase(profile = {}, phaseId, options = {}) {
  const cleanPhaseId = normalizeId(phaseId);
  if (!cleanPhaseId) return [];
  return (profile.rules || [])
    .filter((rule) => options.includeDisabled === true || rule?.enabled !== false)
    .filter((rule) => {
      const metadata = rule?.metadata || {};
      const phaseIds = Array.isArray(metadata.phaseIds) ? metadata.phaseIds : [];
      return normalizeId(metadata.phaseId) === cleanPhaseId
        || phaseIds.some((candidate) => normalizeId(candidate) === cleanPhaseId);
    })
    .map((rule) => cloneDeclarative(rule, [], "phase-rule"));
}

export function validateRuleProfile(profile = {}) {
  const diagnostics = [];
  const normalized = normalizeRuleProfile(profile, diagnostics);
  if (normalized.contractVersion !== RULE_PROFILE_CONTRACT_VERSION) {
    pushDiagnostic(diagnostics, "error", "profile-contract-version-unsupported", {
      layer: RULE_SOURCES.RULE_PROFILE,
      contractVersion: normalized.contractVersion
    });
  }
  if (!normalized.profileId) pushDiagnostic(diagnostics, "error", "profile-id-invalid", { layer: RULE_SOURCES.RULE_PROFILE });
  if (!normalized.version) pushDiagnostic(diagnostics, "error", "profile-version-invalid", { layer: RULE_SOURCES.RULE_PROFILE });
  if (!normalized.name) pushDiagnostic(diagnostics, "error", "profile-name-required", { layer: RULE_SOURCES.RULE_PROFILE });
  if (!RULE_PROFILE_STATUSES.includes(normalized.status)) {
    pushDiagnostic(diagnostics, "error", "profile-status-invalid", { layer: RULE_SOURCES.RULE_PROFILE });
  }
  validateLayerRuleIdentities(normalized.rules, diagnostics, RULE_SOURCES.RULE_PROFILE);
  return {
    valid: !hasBlockingDiagnostics(diagnostics),
    profile: normalized,
    diagnostics
  };
}

export function resolveRuleProfileSelection(tournament = {}, options = {}) {
  const diagnostics = [];
  const explicitProfile = options.profile || tournament.ruleProfile || null;
  const profileId = normalizeId(
    tournament.ruleProfileId || explicitProfile?.profileId || explicitProfile?.id
  );
  const profileVersion = normalizeVersion(
    tournament.ruleProfileVersion || explicitProfile?.version
  );
  const explicitFallback = tournament.ruleProfileFallback === "product_base";

  if (!profileId && !profileVersion && !explicitProfile) {
    if (tournament.ruleProfilePolicyRequired === true) {
      pushDiagnostic(diagnostics, "error", "profile-productive-default-assignment-required", {
        layer: RULE_SOURCES.RULE_PROFILE,
        category: tournament.category || ""
      });
      return resolveProfileFallback(diagnostics, false);
    }
    return {
      valid: true,
      blocked: false,
      fallbackUsed: false,
      profile: null,
      reference: createProfileReference(null),
      diagnostics
    };
  }

  if (!profileId || !profileVersion) {
    pushDiagnostic(diagnostics, "error", "profile-reference-incomplete", {
      layer: RULE_SOURCES.RULE_PROFILE,
      profileId,
      profileVersion
    });
    return resolveProfileFallback(diagnostics, explicitFallback);
  }

  const catalogCandidate = explicitProfile
    ? normalizeRuleProfile(explicitProfile, diagnostics)
    : getRuleProfile(profileId, profileVersion, options.registry || RULE_PROFILES);
  const candidate = explicitProfile
    ? catalogCandidate
    : applyTournamentRuleProfileAssignment(catalogCandidate, tournament, diagnostics);
  if (!candidate || candidate.profileId !== profileId || candidate.version !== profileVersion) {
    pushDiagnostic(diagnostics, "error", "profile-not-found", {
      layer: RULE_SOURCES.RULE_PROFILE,
      profileId,
      profileVersion
    });
    return resolveProfileFallback(diagnostics, explicitFallback);
  }

  const validation = validateRuleProfile(candidate);
  diagnostics.push(...validation.diagnostics);
  const evaluationAt = options.evaluationAt ?? options.at ?? null;
  const temporalCandidate = explicitProfile || candidate;
  if (temporalCandidate?.temporalPolicyVersion || evaluationAt !== null) {
    const temporal = evaluateRuleProfileTemporalValidity(temporalCandidate, {
      at: evaluationAt,
      exactVersion: true,
      allowLegacyExact: options.allowLegacyExact !== false
    });
    diagnostics.push(...temporal.diagnostics);
  }
  if (!ACTIVE_PROFILE_STATUSES.has(validation.profile.status)) {
    pushDiagnostic(diagnostics, "error", "profile-not-available-for-scoring", {
      layer: RULE_SOURCES.RULE_PROFILE,
      profileId,
      profileVersion,
      status: validation.profile.status
    });
  } else if (validation.profile.status === "deprecated") {
    pushDiagnostic(diagnostics, "warning", "profile-deprecated", {
      layer: RULE_SOURCES.RULE_PROFILE,
      profileId,
      profileVersion
    });
  }

  if (hasBlockingDiagnostics(diagnostics)) return resolveProfileFallback(diagnostics, explicitFallback);
  return {
    valid: true,
    blocked: false,
    fallbackUsed: false,
    profile: validation.profile,
    reference: createProfileReference(validation.profile),
    diagnostics: dedupeDiagnostics(diagnostics)
  };
}

function applyTournamentRuleProfileAssignment(candidate, tournament, diagnostics) {
  if (!candidate) return candidate;
  const assignment = tournament.ruleProfileAssignment;
  if (!assignment) return candidate;
  const validIdentity = assignment.authorityVersion === "1.0.0"
    && assignment.tournamentId === tournament.id
    && assignment.profileId === candidate.profileId
    && assignment.version === candidate.version
    && assignment.status === "active"
    && Number.isSafeInteger(Number(assignment.revision))
    && Number(assignment.revision) > 0;
  if (!validIdentity) {
    pushDiagnostic(diagnostics, "error", "profile-assignment-invalid", {
      layer: RULE_SOURCES.RULE_PROFILE,
      profileId: candidate.profileId,
      profileVersion: candidate.version
    });
    return candidate;
  }
  const fingerprint = buildRuleProfileContentFingerprint(candidate);
  if (assignment.contentFingerprint !== fingerprint) {
    pushDiagnostic(diagnostics, "error", "profile-assignment-fingerprint-mismatch", {
      layer: RULE_SOURCES.RULE_PROFILE,
      expectedFingerprint: fingerprint,
      actualFingerprint: assignment.contentFingerprint || ""
    });
    return candidate;
  }
  return {
    ...candidate,
    status: "active",
    metadata: {
      ...(candidate.metadata || {}),
      lifecycleAuthority: assignment.authorityVersion,
      assignmentRevision: Number(assignment.revision),
      activationReady: true
    }
  };
}

export function resolveEffectiveRules({
  suerte,
  productOverride = null,
  profile = null,
  tournamentOverride = null,
  context = {}
} = {}) {
  const diagnostics = [];
  const sourceSuerte = cloneDeclarative(suerte, diagnostics, "product-base");
  const suerteId = normalizeId(sourceSuerte?.id);
  if (!sourceSuerte || !suerteId || !sourceSuerte.catalog) {
    pushDiagnostic(diagnostics, "error", "product-base-suerte-invalid", {
      layer: RULE_SOURCES.PRODUCT_BASE,
      suerteId
    });
    return blockedResolution(sourceSuerte, profile, diagnostics);
  }

  let catalog = normalizeCatalog(
    sourceSuerte.catalog,
    suerteId,
    RULE_SOURCES.PRODUCT_BASE,
    diagnostics
  );
  catalog = applyCatalogReplacement(
    catalog,
    productOverride?.catalog,
    suerteId,
    RULE_SOURCES.PRODUCT_BASE,
    diagnostics,
    { allowNewRules: true }
  );

  const requestedPhaseId = normalizeId(context.phaseId || context.phase);
  const profileRules = (profile?.rules || [])
    .filter((rule) => normalizeId(rule?.suerteId || rule?.suerte) === suerteId)
    .filter((rule) => ruleAppliesToResolutionPhase(rule, requestedPhaseId));
  catalog = applyRulePatches(catalog, profileRules, suerteId, RULE_SOURCES.RULE_PROFILE, diagnostics, {
    profileId: profile?.profileId || "",
    profileVersion: profile?.version || ""
  });

  if (Array.isArray(tournamentOverride?.rules)) {
    catalog = applyRulePatches(
      catalog,
      tournamentOverride.rules,
      suerteId,
      RULE_SOURCES.TOURNAMENT_OVERRIDE,
      diagnostics
    );
  } else {
    catalog = applyCatalogReplacement(
      catalog,
      tournamentOverride?.catalog,
      suerteId,
      RULE_SOURCES.TOURNAMENT_OVERRIDE,
      diagnostics,
      { allowNewRules: false, allowCustomRules: true }
    );
  }

  detectCrossCategoryCollisions(catalog, suerteId, diagnostics);
  const ruleMetadata = mergeSuerteMetadata(
    diagnostics,
    sourceSuerte.ruleMetadata,
    profile?.suerteMetadata?.[suerteId],
    tournamentOverride?.ruleMetadata
  );
  const blocked = hasBlockingDiagnostics(diagnostics);
  const allRules = cloneCatalog(catalog);
  const activeCatalog = Object.fromEntries(
    RULE_GROUPS.map((group) => [
      group,
      blocked ? [] : sortRules(catalog[group]).filter((rule) => rule.enabled !== false)
    ])
  );
  const ruleOrigins = Object.fromEntries(
    RULE_GROUPS.flatMap((group) => catalog[group] || []).map((rule) => [rule.ruleKey, rule.source])
  );
  const profileReference = createProfileReference(profile);
  const layers = [RULE_SOURCES.PRODUCT_BASE];
  if (profile) layers.push(RULE_SOURCES.RULE_PROFILE);
  if (tournamentOverride?.catalog || tournamentOverride?.rules) layers.push(RULE_SOURCES.TOURNAMENT_OVERRIDE);

  return {
    valid: !blocked,
    blocked,
    suerte: {
      ...sourceSuerte,
      ...(Number.isInteger(Number(ruleMetadata?.scoringAttempts)) && Number(ruleMetadata.scoringAttempts) > 0
        ? { attempts: Number(ruleMetadata.scoringAttempts) }
        : {}),
      catalog: activeCatalog,
      ruleMetadata,
      ruleResolution: {
        contractVersion: RULE_PROFILE_CONTRACT_VERSION,
        profile: profileReference,
        layers,
        ruleOrigins,
        diagnostics: dedupeDiagnostics(diagnostics),
        context: normalizeResolutionContext(context)
      }
    },
    allRules,
    diagnostics: dedupeDiagnostics(diagnostics)
  };
}

function normalizeRuleProfile(profile = {}, diagnostics = []) {
  const source = cloneDeclarative(profile, diagnostics, "profile") || {};
  return {
    contractVersion: source.contractVersion || RULE_PROFILE_CONTRACT_VERSION,
    profileId: normalizeId(source.profileId || source.id),
    version: normalizeVersion(source.version),
    name: normalizeText(source.name, 160),
    scope: normalizeText(source.scope || "competition", 80),
    status: normalizeText(source.status || "draft", 40).toLowerCase(),
    source: normalizeText(source.source, 240),
    ...(source.temporalPolicyVersion ? { temporalPolicyVersion: normalizeText(source.temporalPolicyVersion, 40) } : {}),
    ...(Object.hasOwn(source, "activationReady") ? { activationReady: source.activationReady === true } : {}),
    ...copyTemporalProfileFields(source),
    rules: Array.isArray(source.rules)
      ? source.rules.slice(0, MAX_ARRAY).map((rule, index) => normalizeProfileRule(rule, index, diagnostics))
      : [],
    suerteMetadata: normalizeSuerteMetadata(source.suerteMetadata, diagnostics),
    metadata: source.metadata && typeof source.metadata === "object" ? source.metadata : {}
  };
}

function copyTemporalProfileFields(source) {
  const output = {};
  for (const key of [
    "effectiveFrom",
    "effectiveTo",
    "createdAt",
    "createdBy",
    "updatedAt",
    "updatedBy",
    "activatedAt",
    "activatedBy",
    "retiredAt",
    "retiredBy",
    "revision",
    "lifecycle"
  ]) {
    if (Object.hasOwn(source, key)) output[key] = source[key];
  }
  return output;
}

function normalizeSuerteMetadata(value, diagnostics) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const output = {};
  for (const [suerteId, metadata] of Object.entries(value).slice(0, 50)) {
    const cleanSuerteId = normalizeId(suerteId);
    if (!cleanSuerteId || !metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
      pushDiagnostic(diagnostics, "error", "profile-suerte-metadata-invalid", { suerteId: cleanSuerteId || suerteId });
      continue;
    }
    output[cleanSuerteId] = metadata;
  }
  return output;
}

function normalizeProfileRule(rule = {}, index = 0, diagnostics = []) {
  const source = cloneDeclarative(rule, diagnostics, `profile-rule-${index}`) || {};
  const category = normalizeCategory(source.category || source.group);
  const suerteId = normalizeId(source.suerteId || source.suerte);
  const ruleId = normalizeId(source.ruleId || source.id);
  const normalized = {
    suerteId,
    category,
    ruleId,
    enabled: source.enabled !== false
  };
  if (Object.hasOwn(source, "metadata")) {
    normalized.metadata = source.metadata && typeof source.metadata === "object" ? source.metadata : {};
  }
  copyOptionalRuleFields(normalized, source);
  validateDeclarativeRule(normalized, diagnostics, RULE_SOURCES.RULE_PROFILE);
  return normalized;
}

function normalizeCatalog(catalog = {}, suerteId, source, diagnostics) {
  return Object.fromEntries(RULE_GROUPS.map((group) => [
    group,
    normalizeCatalogGroup(catalog[group], suerteId, group, source, diagnostics)
  ]));
}

function normalizeCatalogGroup(rules, suerteId, category, source, diagnostics) {
  if (!Array.isArray(rules)) return [];
  const normalized = rules.slice(0, MAX_ARRAY).map((rule, index) => {
    const clean = cloneDeclarative(rule, diagnostics, `${source}-${suerteId}-${category}-${index}`) || {};
    const ruleId = normalizeId(clean.ruleId || clean.id);
    const item = {
      ...clean,
      id: ruleId,
      ruleId,
      ruleKey: buildRuleIdentity(suerteId, category, ruleId),
      suerteId,
      category,
      label: normalizeText(clean.label, 240),
      enabled: clean.enabled !== false,
      order: finiteOrder(clean.order, index),
      source,
      origin: source,
      custom: Boolean(clean.custom)
    };
    if (category !== RULE_CATEGORIES.DISQUALIFICATION) {
      item.pts = finiteRuleValue(clean.pts ?? clean.value, 0);
      item.value = item.pts;
    }
    validateDeclarativeRule(item, diagnostics, source);
    return item;
  });
  validateLayerRuleIdentities(normalized, diagnostics, source);
  return normalized;
}

function applyCatalogReplacement(catalog, replacement, suerteId, source, diagnostics, options = {}) {
  if (!replacement || typeof replacement !== "object") return catalog;
  const next = cloneCatalog(catalog);
  for (const group of RULE_GROUPS) {
    if (!Array.isArray(replacement[group])) continue;
    const rules = normalizeCatalogGroup(replacement[group], suerteId, group, source, diagnostics);
    const known = new Set((catalog[group] || []).map((rule) => rule.ruleId));
    if (!options.allowNewRules) {
      for (const rule of rules) {
        if (known.has(rule.ruleId) || (options.allowCustomRules && rule.custom)) continue;
        pushDiagnostic(diagnostics, "error", "override-rule-not-found", {
          layer: source,
          suerteId,
          category: group,
          ruleId: rule.ruleId
        });
      }
    }
    next[group] = rules;
  }
  return next;
}

function applyRulePatches(catalog, patches, suerteId, source, diagnostics, sourceMetadata = {}) {
  if (!Array.isArray(patches) || !patches.length) return catalog;
  const next = cloneCatalog(catalog);
  const normalizedPatches = patches.map((patch, index) => {
    if (source === RULE_SOURCES.RULE_PROFILE && patch?.suerteId) return normalizeProfileRule(patch, index, diagnostics);
    return normalizeProfileRule({ ...patch, suerteId: patch?.suerteId || suerteId }, index, diagnostics);
  });
  validateLayerRuleIdentities(normalizedPatches, diagnostics, source);

  for (const patch of normalizedPatches) {
    if (patch.suerteId !== suerteId) {
      pushDiagnostic(diagnostics, "error", "override-suerte-conflict", {
        layer: source,
        suerteId,
        ruleId: patch.ruleId
      });
      continue;
    }
    if (!patch.category || !patch.ruleId) continue;
    const group = next[patch.category] || [];
    const matchIndex = group.findIndex((rule) => rule.ruleId === patch.ruleId);
    const existsInOtherCategory = RULE_GROUPS.some((category) =>
      category !== patch.category && (next[category] || []).some((rule) => rule.ruleId === patch.ruleId)
    );
    if (matchIndex < 0 && existsInOtherCategory) {
      pushDiagnostic(diagnostics, "error", "rule-category-conflict", {
        layer: source,
        suerteId,
        category: patch.category,
        ruleId: patch.ruleId
      });
      continue;
    }

    if (matchIndex < 0) {
      if (source === RULE_SOURCES.TOURNAMENT_OVERRIDE && patch.custom !== true) {
        pushDiagnostic(diagnostics, "error", "override-rule-not-found", {
          layer: source,
          suerteId,
          category: patch.category,
          ruleId: patch.ruleId
        });
        continue;
      }
      if (!patch.label) {
        pushDiagnostic(diagnostics, "error", "new-rule-label-required", {
          layer: source,
          suerteId,
          category: patch.category,
          ruleId: patch.ruleId
        });
        continue;
      }
      group.push(finalizePatchedRule({
        ...patch,
        id: patch.ruleId,
        order: finiteOrder(patch.order, group.length),
        source,
        origin: source,
        ...sourceMetadata
      }, suerteId, patch.category));
      next[patch.category] = group;
      continue;
    }

    const current = group[matchIndex];
    group[matchIndex] = finalizePatchedRule(mergeRulePatch(current, patch, {
      source,
      origin: source,
      ...sourceMetadata
    }), suerteId, patch.category);
  }
  return next;
}

function mergeRulePatch(current, patch, metadata) {
  const next = { ...current, ...metadata };
  for (const key of [
    "label",
    "enabled",
    "order",
    "condition",
    "valueByClassification",
    "renderMode",
    "scope",
    "metadata",
    "custom"
  ]) {
    if (Object.hasOwn(patch, key)) next[key] = patch[key];
  }
  if (Object.hasOwn(patch, "pts") || Object.hasOwn(patch, "value")) {
    next.pts = finiteRuleValue(patch.pts ?? patch.value, current.pts || 0);
    next.value = next.pts;
  }
  return next;
}

function finalizePatchedRule(rule, suerteId, category) {
  const ruleId = normalizeId(rule.ruleId || rule.id);
  const next = {
    ...rule,
    id: ruleId,
    ruleId,
    ruleKey: buildRuleIdentity(suerteId, category, ruleId),
    suerteId,
    category,
    enabled: rule.enabled !== false,
    order: finiteOrder(rule.order, 0)
  };
  if (category !== RULE_CATEGORIES.DISQUALIFICATION && !Object.hasOwn(next, "pts")) {
    next.pts = finiteRuleValue(next.value, 0);
    next.value = next.pts;
  }
  return next;
}

function copyOptionalRuleFields(target, source) {
  if (Object.hasOwn(source, "label")) target.label = normalizeText(source.label, 240);
  if (Object.hasOwn(source, "pts") || Object.hasOwn(source, "value")) {
    target.pts = finiteRuleValue(source.pts ?? source.value, 0);
    target.value = target.pts;
  }
  if (Object.hasOwn(source, "order")) target.order = finiteOrder(source.order, 0);
  if (Object.hasOwn(source, "condition")) target.condition = source.condition;
  if (Object.hasOwn(source, "valueByClassification")) target.valueByClassification = source.valueByClassification;
  if (Object.hasOwn(source, "renderMode")) target.renderMode = normalizeText(source.renderMode, 80).toLowerCase();
  if (Object.hasOwn(source, "scope")) target.scope = normalizeText(source.scope, 80);
  if (Object.hasOwn(source, "custom")) target.custom = Boolean(source.custom);
}

function validateDeclarativeRule(rule, diagnostics, layer) {
  if (!rule.suerteId) pushDiagnostic(diagnostics, "error", "rule-suerte-id-invalid", { layer, ruleId: rule.ruleId });
  if (!rule.category) pushDiagnostic(diagnostics, "error", "rule-category-invalid", { layer, ruleId: rule.ruleId });
  if (!rule.ruleId) pushDiagnostic(diagnostics, "error", "rule-id-invalid", { layer, suerteId: rule.suerteId });
  if (Object.hasOwn(rule, "label") && !rule.label) {
    pushDiagnostic(diagnostics, "error", "rule-label-invalid", ruleDiagnosticContext(rule, layer));
  }
  if (Object.hasOwn(rule, "renderMode") && !RULE_RENDER_MODES.includes(rule.renderMode)) {
    pushDiagnostic(diagnostics, "error", "rule-render-mode-invalid", ruleDiagnosticContext(rule, layer));
  }
  if (Object.hasOwn(rule, "condition") && !validateCondition(rule.condition)) {
    pushDiagnostic(diagnostics, "error", "rule-condition-invalid", ruleDiagnosticContext(rule, layer));
  }
  if (Object.hasOwn(rule, "valueByClassification") && !validateValueTable(rule.valueByClassification)) {
    pushDiagnostic(diagnostics, "error", "rule-dynamic-value-invalid", ruleDiagnosticContext(rule, layer));
  }
}

function validateLayerRuleIdentities(rules, diagnostics, layer) {
  const identities = new Set();
  for (const rule of rules || []) {
    const identity = buildRuleIdentity(rule.suerteId, rule.category, rule.ruleId);
    if (!identity) continue;
    if (identities.has(identity)) {
      pushDiagnostic(diagnostics, "error", "duplicate-rule-identity", ruleDiagnosticContext(rule, layer));
    }
    identities.add(identity);
  }
}

function detectCrossCategoryCollisions(catalog, suerteId, diagnostics) {
  const categoriesById = new Map();
  for (const category of RULE_GROUPS) {
    for (const rule of catalog[category] || []) {
      const categories = categoriesById.get(rule.ruleId) || new Set();
      categories.add(category);
      categoriesById.set(rule.ruleId, categories);
    }
  }
  for (const [ruleId, categories] of categoriesById.entries()) {
    if (categories.size < 2) continue;
    pushDiagnostic(diagnostics, "warning", "legacy-cross-category-rule-id-collision", {
      layer: RULE_SOURCES.PRODUCT_BASE,
      suerteId,
      ruleId,
      categories: [...categories].sort()
    });
  }
}

function validateCondition(condition, depth = 0) {
  if (condition === null) return true;
  if (!condition || typeof condition !== "object" || Array.isArray(condition) || depth > 5) return false;
  const keys = Object.keys(condition);
  if (!keys.length || keys.some((key) => DANGEROUS_KEYS.has(key))) return false;
  if (Array.isArray(condition.all) || Array.isArray(condition.any)) {
    const list = condition.all || condition.any;
    return list.length <= 20 && list.every((item) => validateCondition(item, depth + 1));
  }
  if (condition.not) return validateCondition(condition.not, depth + 1);
  return typeof condition.field === "string"
    && condition.field.length <= 120
    && CONDITION_OPERATORS.has(condition.operator)
    && isDeclarativeLeaf(condition.value);
}

function validateValueTable(table) {
  if (!table || typeof table !== "object" || Array.isArray(table)) return false;
  const entries = Object.entries(table);
  return entries.length > 0 && entries.length <= 50 && entries.every(([key, value]) =>
    ID_PATTERN.test(key) && typeof value === "number" && Number.isFinite(value)
  );
}

function isDeclarativeLeaf(value) {
  if (value === null || ["string", "boolean"].includes(typeof value)) return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.length <= 50 && value.every(isDeclarativeLeaf);
  return false;
}

function resolveProfileFallback(diagnostics, allowed) {
  if (allowed) {
    pushDiagnostic(diagnostics, "warning", "profile-fallback-product-base", {
      layer: RULE_SOURCES.PRODUCT_BASE
    });
    return {
      valid: true,
      blocked: false,
      fallbackUsed: true,
      profile: null,
      reference: createProfileReference(null, true),
      diagnostics: dedupeDiagnostics(diagnostics)
    };
  }
  return {
    valid: false,
    blocked: true,
    fallbackUsed: false,
    profile: null,
    reference: createProfileReference(null),
    diagnostics: dedupeDiagnostics(diagnostics)
  };
}

function createProfileReference(profile, fallbackUsed = false) {
  return {
    contractVersion: RULE_PROFILE_CONTRACT_VERSION,
    profileId: profile?.profileId || null,
    profileVersion: profile?.version || null,
    status: profile?.status || (fallbackUsed ? "fallback" : "product_base"),
    fallbackUsed: Boolean(fallbackUsed)
  };
}

function blockedResolution(suerte, profile, diagnostics) {
  return {
    valid: false,
    blocked: true,
    suerte: suerte ? {
      ...suerte,
      catalog: { base: [], adic: [], infr: [], team_infr: [], desc: [] },
      ruleResolution: {
        contractVersion: RULE_PROFILE_CONTRACT_VERSION,
        profile: createProfileReference(profile),
        layers: [RULE_SOURCES.PRODUCT_BASE],
        ruleOrigins: {},
        diagnostics: dedupeDiagnostics(diagnostics),
        context: {}
      }
    } : null,
    allRules: emptyCatalog(),
    diagnostics: dedupeDiagnostics(diagnostics)
  };
}

function normalizeResolutionContext(context = {}) {
  return {
    tournamentId: normalizeId(context.tournamentId),
    competitionId: normalizeId(context.competitionId),
    category: normalizeText(context.category, 120),
    phase: normalizeText(context.phase || context.phaseId, 120)
  };
}

function ruleAppliesToResolutionPhase(rule = {}, requestedPhaseId = "") {
  const metadata = rule.metadata || {};
  const primaryPhaseId = normalizeId(metadata.phaseId);
  const phaseIds = Array.isArray(metadata.phaseIds)
    ? metadata.phaseIds.map((value) => normalizeId(value)).filter(Boolean)
    : [];
  const hasPhaseOwnership = Boolean(primaryPhaseId || phaseIds.length);
  if (requestedPhaseId) {
    if (primaryPhaseId === requestedPhaseId || phaseIds.includes(requestedPhaseId)) return true;
    return requestedPhaseId !== "freno_review" && !hasPhaseOwnership;
  }
  if (!hasPhaseOwnership) return true;
  return phaseIds.includes("cala_execution");
}

function mergeSuerteMetadata(diagnostics, ...layers) {
  const output = {};
  for (const layer of layers) {
    if (!layer || typeof layer !== "object" || Array.isArray(layer)) continue;
    for (const [key, value] of Object.entries(layer)) {
      const cloned = cloneDeclarative(value, diagnostics, `rule-metadata.${key}`);
      if (cloned !== undefined) output[key] = cloned;
    }
  }
  return output;
}

function normalizeRegistry(registry) {
  if (Array.isArray(registry)) return registry;
  if (!registry || typeof registry !== "object") return [];
  return Object.values(registry).flatMap((value) => Array.isArray(value) ? value : [value]);
}

function cloneCatalog(catalog) {
  return Object.fromEntries(RULE_GROUPS.map((group) => [
    group,
    (catalog[group] || []).map((rule) => cloneDeclarative(rule, [], "catalog-clone"))
  ]));
}

function emptyCatalog() {
  return Object.fromEntries(RULE_GROUPS.map((group) => [group, []]));
}

function sortRules(rules = []) {
  return [...rules].sort((left, right) =>
    finiteOrder(left.order, 0) - finiteOrder(right.order, 0)
    || String(left.ruleId || "").localeCompare(String(right.ruleId || ""), "es")
  );
}

function normalizeCategory(value) {
  const clean = String(value || "").trim().toLowerCase();
  const aliases = {
    additional: RULE_CATEGORIES.ADDITIONAL,
    adicional: RULE_CATEGORIES.ADDITIONAL,
    individual_infraccion: RULE_CATEGORIES.INDIVIDUAL_INFRACTION,
    individual_infraction: RULE_CATEGORIES.INDIVIDUAL_INFRACTION,
    team_infraction: RULE_CATEGORIES.TEAM_INFRACTION,
    team_infraccion: RULE_CATEGORIES.TEAM_INFRACTION,
    dq: RULE_CATEGORIES.DISQUALIFICATION,
    disqualification: RULE_CATEGORIES.DISQUALIFICATION
  };
  const normalized = aliases[clean] || clean;
  return RULE_GROUPS.includes(normalized) ? normalized : "";
}

function normalizeId(value) {
  const clean = String(value || "").trim();
  return ID_PATTERN.test(clean) ? clean : "";
}

function normalizeVersion(value) {
  const clean = String(value || "").trim();
  return VERSION_PATTERN.test(clean) ? clean : "";
}

function normalizeText(value, maxLength = 240) {
  if (value === null || value === undefined) return "";
  return String(value).slice(0, maxLength);
}

function finiteRuleValue(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function finiteOrder(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function cloneDeclarative(value, diagnostics = [], path = "value", depth = 0, seen = new WeakSet()) {
  if (depth > MAX_DEPTH) {
    pushDiagnostic(diagnostics, "error", "declarative-depth-limit", { path });
    return undefined;
  }
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (Number.isFinite(value)) return value;
    pushDiagnostic(diagnostics, "error", "declarative-number-invalid", { path });
    return undefined;
  }
  if (["function", "symbol", "bigint", "undefined"].includes(typeof value)) {
    pushDiagnostic(diagnostics, "error", "declarative-value-forbidden", { path });
    return undefined;
  }
  if (!value || typeof value !== "object" || seen.has(value)) {
    pushDiagnostic(diagnostics, "error", "declarative-cycle-or-object-invalid", { path });
    return undefined;
  }
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      if (value.length > MAX_ARRAY) {
        pushDiagnostic(diagnostics, "error", "declarative-array-limit", { path });
      }
      return value.slice(0, MAX_ARRAY).map((item, index) =>
        cloneDeclarative(item, diagnostics, `${path}[${index}]`, depth + 1, seen)
      ).filter((item) => item !== undefined);
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      pushDiagnostic(diagnostics, "error", "declarative-prototype-forbidden", { path });
      return undefined;
    }
    const keys = Reflect.ownKeys(value);
    if (keys.length > MAX_KEYS) pushDiagnostic(diagnostics, "error", "declarative-key-limit", { path });
    const output = {};
    for (const key of keys.slice(0, MAX_KEYS)) {
      if (typeof key !== "string" || DANGEROUS_KEYS.has(key)) {
        pushDiagnostic(diagnostics, "error", "declarative-key-forbidden", { path, key: String(key) });
        continue;
      }
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || descriptor.get || descriptor.set) {
        pushDiagnostic(diagnostics, "error", "declarative-accessor-forbidden", { path, key });
        continue;
      }
      const cloned = cloneDeclarative(descriptor.value, diagnostics, `${path}.${key}`, depth + 1, seen);
      if (cloned !== undefined) output[key] = cloned;
    }
    return output;
  } finally {
    seen.delete(value);
  }
}

function ruleDiagnosticContext(rule, layer) {
  return {
    layer,
    suerteId: rule.suerteId || "",
    category: rule.category || "",
    ruleId: rule.ruleId || ""
  };
}

function pushDiagnostic(diagnostics, severity, code, detail = {}) {
  diagnostics.push({ severity, code, ...detail });
}

function hasBlockingDiagnostics(diagnostics) {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error");
}

function dedupeDiagnostics(diagnostics) {
  const seen = new Set();
  return diagnostics.filter((diagnostic) => {
    const key = JSON.stringify(diagnostic);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

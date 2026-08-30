import {
  deriveOfficialTimerLiveDisplay,
  formatOfficialTimerMs
} from "./officialTimerLiveDisplay.js?v=20260829-fmch-official-timer-negative-overtime-temporal-scoring-integration-001-v1";

const DEFAULT_TIMER_RULE = {
  mode: "elapsed",
  label: "Cronometro",
  activeLabel: "Cronometro",
  pausedLabel: "Cronometro pausado",
  expiredLabel: "Tiempo agotado",
  limitMs: 0
};

const LEGACY_COLEADERO_LIMIT_MS = 15 * 1000;

const TIMER_RULES = {
  colas: {
    mode: "countdown",
    label: "Tiempo de salida",
    activeLabel: "Tiempo de salida",
    pausedLabel: "Tiempo de salida pausado",
    expiredLabel: "Tiempo agotado",
    limitMs: LEGACY_COLEADERO_LIMIT_MS
  }
};

export const FMCH_OFFICIAL_TEMPORAL_POLICY_VERSION = "1.0.0";
export const FMCH_OFFICIAL_TEMPORAL_CERTIFICATION_STATUSES = Object.freeze([
  "CERTIFIED",
  "CERTIFIED_NO_TIMER_REQUIRED",
  "UNRESOLVED_REQUIRES_SPORTING_AUTHORITY"
]);

const FMCH_RULEBOOK_SOURCE = deepFreeze({
  sourceId: "FMCH-REGULATION-2026",
  title: "Reglamento Oficial General para Competencias de Charros 2024-2028",
  revision: "VF2-2026",
  sha256: "1343e2205c7b6599a2ab7e93a809a5a45bd5ab1aadaba2f5a25bf43db8b4af2b"
});

const TIMER_IDENTITY_BASE = Object.freeze([
  "tournamentId",
  "competitionId",
  "charreadaId",
  "teamId",
  "suerteId",
  "phaseId"
]);

const NO_PAUSE = deepFreeze({ allowed: false, conditions: [] });
const NO_RESUME = deepFreeze({ allowed: false, condition: "NOT_APPLICABLE" });

const FMCH_OFFICIAL_TEMPORAL_POLICY_DEFINITION = {
  contractVersion: "1.0.0",
  policyId: "FMCH_2026_LIBRE_OFFICIAL_TEMPORAL_RULES",
  version: FMCH_OFFICIAL_TEMPORAL_POLICY_VERSION,
  status: "CERTIFIED_NOT_ACTIVATED",
  appliesTo: {
    profileId: "FMCH_2026_LIBRE",
    profileVersion: "0.6.0",
    profileFingerprint: "rptp_0f90f7a3944a82d7"
  },
  source: FMCH_RULEBOOK_SOURCE,
  auditedSuerteIds: [
    "cala",
    "piales",
    "colas",
    "toro",
    "terna_cabecero",
    "terna_pial",
    "yegua",
    "manganas_pie",
    "manganas_caballo",
    "paso"
  ],
  suertes: {
    cala: {
      certificationStatus: "CERTIFIED",
      contracts: [
        {
          ruleId: "fmch_2026_cala_freno_review",
          suerteId: "cala",
          phaseId: "freno_review",
          mode: "DEADLINE",
          limitMs: 3 * 60 * 1000,
          hardStop: true,
          startCondition: "CALADOR_BOTH_FEET_ON_ARENA",
          finishCondition: "CALADOR_MOUNTED",
          pausePolicy: NO_PAUSE,
          resumePolicy: NO_RESUME,
          warningThresholdsMs: [60 * 1000, 2 * 60 * 1000],
          expirationPolicy: "DISQUALIFY_CALA_REVIEW_AFTER_THREE_MINUTES",
          scoreEffect: "ONE_BAD_POINT_AFTER_ONE_MINUTE; SECOND_BAD_POINT_AFTER_TWO_MINUTES",
          transitionPolicy: "JUDGE_CONTROLLED",
          identityDimensions: [...TIMER_IDENTITY_BASE, "participantId"],
          sourceReferences: [{ articles: [76, 77], pages: [28], section: "CALA DE CABALLO" }],
          certificationStatus: "CERTIFIED"
        },
        {
          ruleId: "fmch_2026_cala_partidero_start",
          suerteId: "cala",
          phaseId: "partidero_start",
          mode: "DEADLINE",
          limitMs: 2 * 60 * 1000,
          hardStop: true,
          startCondition: "HORSE_ARRIVES_AT_PARTIDERO",
          finishCondition: "HORSE_STARTS_FROM_PARTIDERO",
          pausePolicy: NO_PAUSE,
          resumePolicy: NO_RESUME,
          warningThresholdsMs: [60 * 1000],
          expirationPolicy: "DISQUALIFY_CALA_AFTER_TWO_MINUTES",
          scoreEffect: "BAD_POINT_AFTER_ONE_MINUTE",
          transitionPolicy: "JUDGE_CONTROLLED",
          identityDimensions: [...TIMER_IDENTITY_BASE, "participantId"],
          sourceReferences: [{ articles: [77], pages: [28], section: "CALA DE CABALLO" }],
          certificationStatus: "CERTIFIED"
        }
      ]
    },
    piales: {
      certificationStatus: "CERTIFIED",
      contracts: [{
        ruleId: "fmch_2026_piales_opportunity_readiness",
        suerteId: "piales",
        phaseId: "opportunity_readiness",
        mode: "DEADLINE",
        limitMs: null,
        hardStop: false,
        durationPolicy: {
          type: "PREVIOUS_OPPORTUNITY_CONDITIONAL",
          defaultDurationMs: 2 * 60 * 1000,
          extendedDurationMs: 3 * 60 * 1000,
          extensionResolutionCodes: [
            "COUNTED_PIAL",
            "ROPE_BREAK_WITH_PIAL",
            "HONDILLA_BREAK_WITH_PIAL",
            "KNOT_RELEASE_WITH_PIAL"
          ]
        },
        startCondition: "JUDGE_INDICATES_TIME",
        finishCondition: "PIALADOR_REQUESTS_MARE",
        pausePolicy: NO_PAUSE,
        resumePolicy: NO_RESUME,
        warningThresholdsMs: [],
        expirationPolicy: "CONTINUE_WITH_TWO_BAD_POINTS_PER_EXCEEDED_MINUTE",
        scoreEffect: "TWO_BAD_POINTS_PER_MINUTE_AFTER_APPLICABLE_DEADLINE",
        transitionPolicy: "NEW_TIMER_IDENTITY_PER_OPPORTUNITY",
        identityDimensions: [...TIMER_IDENTITY_BASE, "participantId", "opportunityIndex"],
        sourceReferences: [
          { articles: [77], pages: [28], section: "PIALES EN LA MANGA DEL LIENZO" },
          { articles: [96, 101], pages: [45, 46], section: "DE LOS PIALES EN LA MANGA DEL LIENZO" }
        ],
        certificationStatus: "CERTIFIED"
      }]
    },
    colas: {
      certificationStatus: "CERTIFIED",
      contracts: [{
        ruleId: "fmch_2026_coleadero_partidero_release",
        suerteId: "colas",
        phaseId: "partidero_release",
        mode: "COUNTDOWN",
        limitMs: 20 * 1000,
        hardStop: true,
        startCondition: "BULL_IN_PARTIDERO_AND_JUDGE_ORDERS_TIME",
        finishCondition: "PARTIDERO_DOOR_OPENS_FOR_BULL_EXIT",
        pausePolicy: { allowed: true, conditions: ["BULL_CAUGHT_IN_TUBES"] },
        resumePolicy: { allowed: true, condition: "BULL_NO_LONGER_CAUGHT_IN_TUBES" },
        warningThresholdsMs: [],
        expirationPolicy: "JUDGE_ORDERS_BULL_RELEASE_AND_OPPORTUNITY_IS_USED",
        scoreEffect: "NO_DIRECT_SCORE_CHANGE; OPPORTUNITY_COUNTS_AS_USED",
        transitionPolicy: "NEW_TIMER_IDENTITY_PER_COLEADOR_OPPORTUNITY",
        identityDimensions: [...TIMER_IDENTITY_BASE, "participantId", "coleadorIndex", "opportunityIndex"],
        sourceReferences: [
          { articles: [77], pages: [28], section: "COLEADERO" },
          { articles: [112, 118], pages: [50, 51], section: "DEL COLEADERO" }
        ],
        certificationStatus: "CERTIFIED"
      }]
    },
    toro: {
      certificationStatus: "CERTIFIED",
      contracts: [{
        ruleId: "fmch_2026_toro_apretalamiento",
        suerteId: "toro",
        phaseId: "apretalamiento",
        mode: "COUNTDOWN",
        limitMs: 5 * 60 * 1000,
        hardStop: true,
        startCondition: "JUDGE_DETERMINES_BULL_READY_AND_ARENA_CLEAR",
        finishCondition: "DOOR_OPEN_AT_NINETY_DEGREES_OR_BULL_HEAD_EXITS",
        pausePolicy: NO_PAUSE,
        resumePolicy: NO_RESUME,
        warningThresholdsMs: [3 * 60 * 1000, 4 * 60 * 1000],
        expirationPolicy: "LOSE_BULL_RIDE_AND_OPEN_DOOR_TO_BEGIN_TERNA",
        scoreEffect: "ONE_ADDITIONAL_PER_SAVED_MINUTE_BEFORE_THREE; BAD_POINTS_AFTER_THREE",
        transitionPolicy: "START_TERNA_AT_FIRST_OF_BULL_EXIT_OR_APRETALAMIENTO_EXPIRY_UNDER_JUDGE_AUTHORITY",
        identityDimensions: [...TIMER_IDENTITY_BASE, "participantId"],
        sourceReferences: [
          { articles: [77], pages: [28], section: "JINETEO DE TORO" },
          { articles: [134], pages: [57], section: "DEL JINETEO DE TORO" }
        ],
        certificationStatus: "CERTIFIED"
      }]
    },
    terna_cabecero: {
      certificationStatus: "CERTIFIED",
      contracts: [{
        ruleId: "fmch_2026_terna_shared_window",
        suerteId: "terna",
        phaseId: "shared_execution",
        componentPhaseId: "cabecero",
        mode: "SHARED_WINDOW",
        limitMs: 7 * 60 * 1000,
        hardStop: true,
        startCondition: "FIRST_OF_BULL_EXIT_OR_APRETALAMIENTO_EXPIRY_UNDER_JUDGE_AUTHORITY",
        finishCondition: "BULL_DOWN_ON_SIDE_AND_SHOULDER_AND_HEAD_LASSO_CLEARED",
        pausePolicy: {
          allowed: true,
          conditions: ["BULL_JUMPS_OUT_OF_ARENA", "ACCIDENT", "SPORTS_COMMISSION_INDICATION", "BULL_FRACTURE_BEFORE_LASSO"]
        },
        resumePolicy: { allowed: true, condition: "JUDGES_AUTHORIZE_RESUME_AFTER_CAUSE_CLEARS" },
        warningThresholdsMs: [],
        expirationPolicy: "END_COMPLETE_TERNA_WINDOW",
        scoreEffect: "IF_BOTH_LASSOS_COUNT_TWO_POINTS_PER_SAVED_MINUTE_SPLIT_ONE_AND_ONE",
        transitionPolicy: "SHARED_WITH_PIAL; NEVER_RESTART_ON_COMPONENT_CHANGE",
        identityDimensions: [...TIMER_IDENTITY_BASE.filter((key) => key !== "suerteId"), "sharedDomain:terna"],
        sourceReferences: [
          { articles: [77], pages: [29], section: "TERNA EN EL RUEDO" },
          { articles: [154, 155], pages: [64], section: "DE LA TERNA EN EL RUEDO" },
          { authority: "CERTIFIED_JUDGE_OPERATIONAL_INTERPRETATION", record: "CHARROPRO-TERNA-APRETALAMIENTO-TRANSITION-AUTHORITY-001" }
        ],
        certificationStatus: "CERTIFIED"
      }]
    },
    terna_pial: {
      certificationStatus: "CERTIFIED",
      contracts: [{
        ruleId: "fmch_2026_terna_shared_window",
        suerteId: "terna",
        phaseId: "shared_execution",
        componentPhaseId: "pial",
        mode: "SHARED_WINDOW",
        limitMs: 7 * 60 * 1000,
        hardStop: true,
        startCondition: "FIRST_OF_BULL_EXIT_OR_APRETALAMIENTO_EXPIRY_UNDER_JUDGE_AUTHORITY",
        finishCondition: "BULL_DOWN_ON_SIDE_AND_SHOULDER_AND_HEAD_LASSO_CLEARED",
        pausePolicy: {
          allowed: true,
          conditions: ["BULL_JUMPS_OUT_OF_ARENA", "ACCIDENT", "SPORTS_COMMISSION_INDICATION", "BULL_FRACTURE_BEFORE_LASSO"]
        },
        resumePolicy: { allowed: true, condition: "JUDGES_AUTHORIZE_RESUME_AFTER_CAUSE_CLEARS" },
        warningThresholdsMs: [],
        expirationPolicy: "END_COMPLETE_TERNA_WINDOW",
        scoreEffect: "IF_BOTH_LASSOS_COUNT_TWO_POINTS_PER_SAVED_MINUTE_SPLIT_ONE_AND_ONE",
        transitionPolicy: "SHARED_WITH_CABECERO; NEVER_RESTART_ON_COMPONENT_CHANGE",
        identityDimensions: [...TIMER_IDENTITY_BASE.filter((key) => key !== "suerteId"), "sharedDomain:terna"],
        sourceReferences: [
          { articles: [77], pages: [29], section: "TERNA EN EL RUEDO" },
          { articles: [154, 155], pages: [64], section: "DE LA TERNA EN EL RUEDO" },
          { authority: "CERTIFIED_JUDGE_OPERATIONAL_INTERPRETATION", record: "CHARROPRO-TERNA-APRETALAMIENTO-TRANSITION-AUTHORITY-001" }
        ],
        certificationStatus: "CERTIFIED"
      }]
    },
    yegua: {
      certificationStatus: "CERTIFIED",
      contracts: [
        {
          ruleId: "fmch_2026_yegua_apretalamiento",
          suerteId: "yegua",
          phaseId: "apretalamiento",
          mode: "COUNTDOWN",
          limitMs: 5 * 60 * 1000,
          hardStop: true,
          startCondition: "JUDGE_DETERMINES_MARE_READY_AND_ARENA_CLEAR",
          finishCondition: "DOOR_OPEN_AT_NINETY_DEGREES_OR_MARE_EXITS",
          pausePolicy: NO_PAUSE,
          resumePolicy: NO_RESUME,
          warningThresholdsMs: [3 * 60 * 1000, 4 * 60 * 1000],
          expirationPolicy: "LOSE_MARE_RIDE_AND_OPEN_DOOR_TO_BEGIN_MANGANAS_PIE",
          scoreEffect: "ONE_ADDITIONAL_PER_SAVED_MINUTE_BEFORE_THREE; ONE_BAD_POINT_PER_MINUTE_AFTER_THREE",
          transitionPolicy: "MANGANAS_PIE_STARTS_AFTER_RIDER_DISMOUNTS_OR_IS_THROWN_IF_SAME_MARE_IS_USED",
          identityDimensions: [...TIMER_IDENTITY_BASE, "participantId"],
          sourceReferences: [
            { articles: [77], pages: [29], section: "JINETEO DE YEGUA" },
            { articles: [171, 181], pages: [75, 77], section: "DEL JINETEO DE YEGUA" }
          ],
          certificationStatus: "CERTIFIED"
        },
        {
          ruleId: "fmch_2026_yegua_dismount",
          suerteId: "yegua",
          phaseId: "dismount",
          mode: "DEADLINE",
          limitMs: 60 * 1000,
          hardStop: false,
          startCondition: "JUDGES_INDICATE_AFTER_MARE_STOPS_BUCKING",
          finishCondition: "RIDER_DISMOUNTS",
          pausePolicy: NO_PAUSE,
          resumePolicy: NO_RESUME,
          warningThresholdsMs: [],
          expirationPolicy: "CONTINUE_WITH_ONE_BAD_POINT_PER_EXCEEDED_MINUTE",
          scoreEffect: "ONE_BAD_POINT_PER_EXCEEDED_MINUTE",
          transitionPolicy: "JUDGE_CONTROLLED",
          identityDimensions: [...TIMER_IDENTITY_BASE, "participantId"],
          sourceReferences: [{ articles: [77], pages: [29], section: "JINETEO DE YEGUA" }],
          certificationStatus: "CERTIFIED"
        }
      ]
    },
    manganas_pie: {
      certificationStatus: "CERTIFIED",
      contracts: [{
        ruleId: "fmch_2026_manganas_pie_execution",
        suerteId: "manganas_pie",
        phaseId: "execution",
        mode: "COUNTDOWN",
        limitMs: 7 * 60 * 1000,
        hardStop: true,
        startCondition: "JUDGES_INDICATE_START_OR_RIDER_DISMOUNTS_OR_IS_THROWN_WHEN_SAME_MARE_IS_USED",
        finishCondition: "THREE_OPPORTUNITIES_RESOLVED_OR_SEVEN_MINUTES_ELAPSE",
        pausePolicy: { allowed: true, conditions: ["MARE_JUMPS_OUT_OF_ARENA", "ACCIDENT", "SPORTS_COMMISSION_INDICATION"] },
        resumePolicy: { allowed: true, condition: "JUDGES_AUTHORIZE_RESUME_AFTER_CAUSE_CLEARS" },
        warningThresholdsMs: [],
        expirationPolicy: "END_MANGANAS_PIE_AND_SCORE_ONLY_ATTEMPTED_OPPORTUNITIES",
        scoreEffect: "ONE_ADDITIONAL_PER_SAVED_MINUTE_IF_AT_LEAST_ONE_OPPORTUNITY_IS_CONSUMMATED",
        transitionPolicy: "BEGIN_TWO_MINUTE_CHANGEOVER_TO_MANGANAS_CABALLO",
        identityDimensions: [...TIMER_IDENTITY_BASE, "participantId"],
        sourceReferences: [
          { articles: [77], pages: [29], section: "MANGANAS A PIE Y MANGANAS A CABALLO" },
          { articles: [205, 206, 207], pages: [84], section: "DE LAS MANGANAS" }
        ],
        certificationStatus: "CERTIFIED"
      }]
    },
    manganas_caballo: {
      certificationStatus: "CERTIFIED",
      contracts: [
        {
          ruleId: "fmch_2026_manganas_caballo_changeover",
          suerteId: "manganas_caballo",
          phaseId: "changeover",
          mode: "COUNTDOWN",
          limitMs: 2 * 60 * 1000,
          hardStop: true,
          startCondition: "MANGANAS_PIE_FINISHES",
          finishCondition: "TWO_MINUTES_ELAPSE_OR_EVERYTHING_IS_READY",
          pausePolicy: NO_PAUSE,
          resumePolicy: NO_RESUME,
          warningThresholdsMs: [],
          expirationPolicy: "JUDGES_START_MANGANAS_CABALLO_EXECUTION",
          scoreEffect: "SIX_TEAM_BAD_POINTS_IF_ARREADORES_MOVE_MARE_DURING_CHANGEOVER",
          transitionPolicy: "START_EXECUTION_AT_EXPIRY_OR_EARLIER_WHEN_READY",
          identityDimensions: [...TIMER_IDENTITY_BASE, "participantId"],
          sourceReferences: [{ articles: [207], pages: [84], section: "DE LAS MANGANAS" }],
          certificationStatus: "CERTIFIED"
        },
        {
          ruleId: "fmch_2026_manganas_caballo_execution",
          suerteId: "manganas_caballo",
          phaseId: "execution",
          mode: "COUNTDOWN",
          limitMs: 7 * 60 * 1000,
          hardStop: true,
          startCondition: "CHANGEOVER_EXPIRES_OR_JUDGES_START_EARLY_WHEN_READY",
          finishCondition: "THREE_OPPORTUNITIES_RESOLVED_OR_SEVEN_MINUTES_ELAPSE",
          pausePolicy: { allowed: true, conditions: ["MARE_JUMPS_OUT_OF_ARENA", "ACCIDENT", "SPORTS_COMMISSION_INDICATION"] },
          resumePolicy: { allowed: true, condition: "JUDGES_AUTHORIZE_RESUME_AFTER_CAUSE_CLEARS" },
          warningThresholdsMs: [],
          expirationPolicy: "END_MANGANAS_CABALLO_AND_SCORE_ONLY_ATTEMPTED_OPPORTUNITIES",
          scoreEffect: "ONE_ADDITIONAL_PER_SAVED_MINUTE_IF_AT_LEAST_ONE_OPPORTUNITY_IS_CONSUMMATED",
          transitionPolicy: "ADVANCE_TO_PASO_DE_LA_MUERTE",
          identityDimensions: [...TIMER_IDENTITY_BASE, "participantId"],
          sourceReferences: [
            { articles: [77], pages: [29], section: "MANGANAS A PIE Y MANGANAS A CABALLO" },
            { articles: [205, 206, 207], pages: [84], section: "DE LAS MANGANAS" }
          ],
          certificationStatus: "CERTIFIED"
        }
      ]
    },
    paso: {
      certificationStatus: "CERTIFIED",
      contracts: [
        {
          ruleId: "fmch_2026_paso_mare_exit",
          suerteId: "paso",
          phaseId: "mare_exit",
          mode: "COUNTDOWN",
          limitMs: 3 * 60 * 1000,
          hardStop: true,
          startCondition: "JUDGES_DETERMINE_ARENA_CLEAR_AND_MARE_READY",
          finishCondition: "MARE_COMPLETELY_EXITS_BOX",
          pausePolicy: NO_PAUSE,
          resumePolicy: NO_RESUME,
          warningThresholdsMs: [],
          expirationPolicy: "END_PASO_OPPORTUNITY",
          scoreEffect: "DISQUALIFY_WHEN_THREE_MINUTE_EXIT_LIMIT_IS_EXCEEDED",
          transitionPolicy: "CONTINUE_ONLY_AFTER_VALID_MARE_EXIT",
          identityDimensions: [...TIMER_IDENTITY_BASE, "participantId", "opportunityIndex"],
          sourceReferences: [
            { articles: [77], pages: [29, 30], section: "PASO DE LA MUERTE" },
            { articles: [218, 221], pages: [93], section: "DEL PASO DE LA MUERTE" }
          ],
          certificationStatus: "CERTIFIED"
        },
        {
          ruleId: "fmch_2026_paso_dismount",
          suerteId: "paso",
          phaseId: "dismount",
          mode: "DEADLINE",
          limitMs: 60 * 1000,
          hardStop: false,
          startCondition: "JUDGES_INDICATE_AFTER_MARE_STOPS_BUCKING",
          finishCondition: "RIDER_DISMOUNTS",
          pausePolicy: NO_PAUSE,
          resumePolicy: NO_RESUME,
          warningThresholdsMs: [],
          expirationPolicy: "CONTINUE_WITH_ONE_BAD_POINT_PER_EXCEEDED_MINUTE",
          scoreEffect: "ONE_BAD_POINT_PER_EXCEEDED_MINUTE",
          transitionPolicy: "JUDGE_CONTROLLED",
          identityDimensions: [...TIMER_IDENTITY_BASE, "participantId", "opportunityIndex"],
          sourceReferences: [{ articles: [77, 225], pages: [30, 94], section: "PASO DE LA MUERTE" }],
          certificationStatus: "CERTIFIED"
        }
      ]
    }
  }
};

export const FMCH_OFFICIAL_TEMPORAL_POLICY_FINGERPRINT = `fmchtp_${fingerprintTemporalValue(
  FMCH_OFFICIAL_TEMPORAL_POLICY_DEFINITION
)}`;

export const FMCH_OFFICIAL_TEMPORAL_POLICY = deepFreeze({
  ...FMCH_OFFICIAL_TEMPORAL_POLICY_DEFINITION,
  contentFingerprint: FMCH_OFFICIAL_TEMPORAL_POLICY_FINGERPRINT
});

const FMCH_TEMPORAL_SUERTE_ALIASES = Object.freeze({
  lazo: "terna_cabecero",
  pial_ruedo: "terna_pial"
});

const FMCH_TEMPORAL_PROFILE_COMPATIBILITY = Object.freeze({
  "FMCH_2026_LIBRE@0.6.0": "rptp_0f90f7a3944a82d7",
  "FMCH_2026_LIBRE@0.6.1": "rptp_10e596046446e850"
});

export function getFmchOfficialTemporalPolicy() {
  return clonePlain(FMCH_OFFICIAL_TEMPORAL_POLICY);
}

export function validateFmchOfficialTemporalPolicy(policy = FMCH_OFFICIAL_TEMPORAL_POLICY) {
  const errors = [];
  const expectedSuerteIds = FMCH_OFFICIAL_TEMPORAL_POLICY_DEFINITION.auditedSuerteIds;
  const actualSuerteIds = Object.keys(policy?.suertes || {});
  if (policy?.policyId !== FMCH_OFFICIAL_TEMPORAL_POLICY_DEFINITION.policyId) errors.push("official-temporal-policy-id-invalid");
  if (policy?.version !== FMCH_OFFICIAL_TEMPORAL_POLICY_VERSION) errors.push("official-temporal-policy-version-invalid");
  if (policy?.appliesTo?.profileId !== "FMCH_2026_LIBRE" || policy?.appliesTo?.profileVersion !== "0.6.0") {
    errors.push("official-temporal-profile-reference-invalid");
  }
  if (policy?.source?.sha256 !== FMCH_RULEBOOK_SOURCE.sha256) errors.push("official-temporal-source-sha-invalid");
  if (JSON.stringify(actualSuerteIds) !== JSON.stringify(expectedSuerteIds)) errors.push("official-temporal-ten-suertes-required");
  const ruleIds = new Set();
  for (const suerteId of expectedSuerteIds) {
    const suerte = policy?.suertes?.[suerteId];
    if (!FMCH_OFFICIAL_TEMPORAL_CERTIFICATION_STATUSES.includes(suerte?.certificationStatus)) {
      errors.push(`official-temporal-certification-status-invalid:${suerteId}`);
    }
    if (suerte?.certificationStatus === "CERTIFIED" && !suerte?.contracts?.length) {
      errors.push(`official-temporal-contract-required:${suerteId}`);
    }
    for (const contract of suerte?.contracts || []) {
      if (!contract.ruleId || !contract.phaseId || !contract.mode || !contract.startCondition || !contract.finishCondition) {
        errors.push(`official-temporal-contract-incomplete:${suerteId}`);
      }
      if (ruleIds.has(`${contract.ruleId}:${contract.componentPhaseId || ""}`)) {
        errors.push(`official-temporal-rule-duplicate:${contract.ruleId}`);
      }
      ruleIds.add(`${contract.ruleId}:${contract.componentPhaseId || ""}`);
      if (!Array.isArray(contract.sourceReferences) || contract.sourceReferences.length === 0) {
        errors.push(`official-temporal-source-required:${contract.ruleId}`);
      }
    }
  }
  const definition = clonePlain(policy || {});
  delete definition.contentFingerprint;
  if (`fmchtp_${fingerprintTemporalValue(definition)}` !== policy?.contentFingerprint) {
    errors.push("official-temporal-policy-fingerprint-invalid");
  }
  return { valid: errors.length === 0, errors };
}

export function resolveFmchOfficialTemporalContracts(context = {}) {
  const profileId = normalizeTimerId(context.profileId || context.ruleProfileId);
  const profileVersion = String(context.profileVersion || context.ruleProfileVersion || "").trim();
  if (!FMCH_TEMPORAL_PROFILE_COMPATIBILITY[`${profileId}@${profileVersion}`]) {
    return { ok: false, code: "official-temporal-profile-unsupported", contracts: [] };
  }
  const requestedSuerteId = normalizeTimerId(context.suerteId || context.suerte?.id);
  const suerteId = FMCH_TEMPORAL_SUERTE_ALIASES[requestedSuerteId] || requestedSuerteId;
  const suerte = FMCH_OFFICIAL_TEMPORAL_POLICY.suertes[suerteId];
  if (!suerte) return { ok: false, code: "official-temporal-suerte-unsupported", contracts: [] };
  if (suerte.certificationStatus !== "CERTIFIED") {
    return { ok: false, code: "official-temporal-rule-not-certified", contracts: [] };
  }
  const requestedPhaseId = normalizeTimerId(context.phaseId);
  const sourceContracts = requestedPhaseId
    ? suerte.contracts.filter((contract) => contract.phaseId === requestedPhaseId)
    : suerte.contracts;
  if (!sourceContracts.length) return { ok: false, code: "official-temporal-phase-unsupported", contracts: [] };
  const contracts = [];
  for (const sourceContract of sourceContracts) {
    const resolved = resolveFmchTemporalDuration(sourceContract, context);
    if (!resolved.ok) return { ok: false, code: resolved.code, contracts: [] };
    contracts.push(resolved.contract);
  }
  return {
    ok: true,
    code: "official-temporal-rule-resolved",
    policyId: FMCH_OFFICIAL_TEMPORAL_POLICY.policyId,
    policyVersion: FMCH_OFFICIAL_TEMPORAL_POLICY.version,
    policyFingerprint: FMCH_OFFICIAL_TEMPORAL_POLICY.contentFingerprint,
    profileId,
    profileVersion,
    suerteId,
    certificationStatus: suerte.certificationStatus,
    contracts: clonePlain(contracts)
  };
}

export function resolveFmchOfficialTemporalRuntimePolicy(context = {}) {
  const profileId = normalizeTimerId(
    context.profileId || context.ruleProfileId || context.tournament?.ruleProfileId
  );
  const profileVersion = String(
    context.profileVersion || context.ruleProfileVersion || context.tournament?.ruleProfileVersion || ""
  ).trim();
  const profileFingerprint = String(
    context.profileFingerprint
      || context.ruleProfileFingerprint
      || context.tournament?.ruleProfileContentFingerprint
      || context.tournament?.effectiveRulesFingerprint
      || ""
  ).trim();
  const unavailable = (code) => ({
    ok: false,
    code,
    status: "TEMPORAL_POLICY_UNAVAILABLE",
    profileId,
    profileVersion,
    profileFingerprint,
    policyId: null,
    policyVersion: null,
    policyFingerprint: null
  });

  if (profileId !== FMCH_OFFICIAL_TEMPORAL_POLICY.appliesTo.profileId) {
    return unavailable("official-temporal-runtime-profile-unsupported");
  }
  const compatibleFingerprint = FMCH_TEMPORAL_PROFILE_COMPATIBILITY[`${profileId}@${profileVersion}`];
  if (!compatibleFingerprint) {
    return unavailable("official-temporal-runtime-version-unsupported");
  }
  if (profileFingerprint !== compatibleFingerprint) {
    return unavailable("official-temporal-runtime-profile-fingerprint-mismatch");
  }
  const explicitPolicyId = String(context.temporalPolicyId || "").trim();
  const explicitPolicyVersion = String(context.temporalPolicyVersion || "").trim();
  const explicitPolicyFingerprint = String(context.temporalFingerprint || context.temporalPolicyFingerprint || "").trim();
  if (explicitPolicyId && explicitPolicyId !== FMCH_OFFICIAL_TEMPORAL_POLICY.policyId) {
    return unavailable("official-temporal-runtime-policy-mismatch");
  }
  if (explicitPolicyVersion && explicitPolicyVersion !== FMCH_OFFICIAL_TEMPORAL_POLICY.version) {
    return unavailable("official-temporal-runtime-policy-version-mismatch");
  }
  if (explicitPolicyFingerprint && explicitPolicyFingerprint !== FMCH_OFFICIAL_TEMPORAL_POLICY.contentFingerprint) {
    return unavailable("official-temporal-runtime-policy-fingerprint-mismatch");
  }
  const validation = validateFmchOfficialTemporalPolicy();
  if (!validation.valid) return unavailable("official-temporal-runtime-certification-invalid");

  return {
    ok: true,
    code: "official-temporal-runtime-active",
    status: "ACTIVE",
    profileId,
    profileVersion,
    profileFingerprint,
    policyId: FMCH_OFFICIAL_TEMPORAL_POLICY.policyId,
    policyVersion: FMCH_OFFICIAL_TEMPORAL_POLICY.version,
    policyFingerprint: FMCH_OFFICIAL_TEMPORAL_POLICY.contentFingerprint
  };
}

function resolveFmchTemporalDuration(contract, context) {
  const next = clonePlain(contract);
  if (!contract.durationPolicy) return { ok: true, contract: next };
  if (contract.durationPolicy.type !== "PREVIOUS_OPPORTUNITY_CONDITIONAL") {
    return { ok: false, code: "official-temporal-duration-policy-unsupported" };
  }
  const resolution = normalizeTimerId(context.previousOpportunityResolution).toUpperCase();
  const validResolutions = ["NO_EXTENSION", ...contract.durationPolicy.extensionResolutionCodes];
  if (!validResolutions.includes(resolution)) {
    return { ok: false, code: "official-temporal-previous-opportunity-resolution-required" };
  }
  next.limitMs = contract.durationPolicy.extensionResolutionCodes.includes(resolution)
    ? contract.durationPolicy.extendedDurationMs
    : contract.durationPolicy.defaultDurationMs;
  next.resolvedDurationReason = resolution;
  return { ok: true, contract: next };
}

export const OFFICIAL_TIMER_CONTEXT_VERSION = "1.0.0";
export const OFFICIAL_TIMER_STATUSES = Object.freeze([
  "READY",
  "RUNNING",
  "PAUSED",
  "FINISHED"
]);
export const OFFICIAL_TIMER_COMMANDS = Object.freeze([
  "START",
  "PAUSE",
  "RESUME",
  "FINISH"
]);
export const OFFICIAL_TIMER_CONTROL_OPERATIONS = Object.freeze([
  "CLAIM_CONTROL",
  "TAKEOVER_CONTROL",
  "HANDOFF_CONTROL",
  "UPDATE_PAUSE_REASON"
]);
export const OFFICIAL_TIMER_CONTROLLER_TYPES = Object.freeze([
  "field_remote",
  "scorer_backup",
  "supervisor_backup",
  "system",
  "web_remote",
  "smartwatch",
  "hardware_remote"
]);
export const OFFICIAL_TIMER_LEASE_MS = 45 * 1000;

export function getTimerRuleForSource(source = {}) {
  const suerte = source?.turn?.suerte || source?.suerte || source;
  const suerteId = suerte?.id || source?.suerteId || "";
  return normalizeTimerRule(TIMER_RULES[suerteId] || DEFAULT_TIMER_RULE);
}

export function getTimerScopeKey(source = {}) {
  const turn = source?.turn || source;
  const charreadaId = source?.charreada?.id || source?.charreadaId || "";
  const teamId = turn?.team?.id || source?.team?.id || "";
  const suerteId = turn?.suerte?.id || source?.suerte?.id || source?.suerteId || "";
  const attemptIndex = Number(turn?.attemptIndex ?? source?.attemptIndex ?? 0);
  const coleadorIndex = Number(turn?.coleadorIndex ?? source?.coleadorIndex ?? 0);
  return [charreadaId, teamId, suerteId, attemptIndex, coleadorIndex].join("__");
}

export function getTimerView(timer = {}, source = {}) {
  const hasSourceRule = Boolean(source?.turn?.suerte || source?.suerte || source?.suerteId);
  const rule = hasSourceRule ? getTimerRuleForSource(source) : getTimerRuleFromTimer(timer);
  const elapsedMs = getTimerElapsedMs(timer);
  const countdown = rule.mode === "countdown" && rule.limitMs > 0;
  const remainingMs = countdown ? Math.max(0, rule.limitMs - elapsedMs) : null;
  const displayMs = countdown ? remainingMs : elapsedMs;
  const expired = countdown && elapsedMs >= rule.limitMs;

  return {
    rule,
    scopeKey: getTimerScopeKey(source),
    elapsedMs,
    displayMs,
    remainingMs,
    expired,
    formatted: formatTimerMs(displayMs),
    stateLabel: getTimerStateLabel(timer, rule, expired),
    limitText: rule.limitMs ? `${Math.round(rule.limitMs / 1000)} seg` : ""
  };
}

export function getTimerElapsedMs(timer = {}) {
  const base = Number(timer.elapsedMs || 0);
  if (!timer.running || !timer.startedAt) return base;
  return base + Math.max(0, Date.now() - Number(timer.startedAt));
}

export function formatTimerMs(elapsedMs) {
  return formatOfficialTimerMs(elapsedMs);
}

export function createOfficialTimerContext(definition = {}, options = {}) {
  const timerId = normalizeTimerId(definition.timerId || definition.id);
  if (!timerId) throw new Error("official-timer-id-required");
  const durationMs = Math.max(0, finiteNumber(definition.durationMs ?? definition.limitMs));
  const createdAt = toIso(options.now ?? Date.now());
  return {
    contractVersion: OFFICIAL_TIMER_CONTEXT_VERSION,
    timerId,
    contextType: normalizeTimerId(definition.contextType || "official"),
    status: "READY",
    durationMs,
    officialElapsedMs: 0,
    runningSince: null,
    wallStartedAt: null,
    wallFinishedAt: null,
    pausedAt: null,
    pauseReason: null,
    pauses: [],
    revision: 0,
    controllerId: null,
    controllerUid: null,
    controllerRole: null,
    controllerSessionId: null,
    controllerType: null,
    controllerClaimedAt: null,
    controllerLeaseExpiresAtMs: 0,
    previousController: null,
    lastCommandId: null,
    commandIds: [],
    authorityAudit: [],
    lastOperation: null,
    source: normalizeTimerText(definition.source || options.source || "scorer", 120),
    suerteLabel: nullableTimerText(definition.suerteLabel, 160),
    phaseId: normalizeTimerId(definition.phaseId),
    phaseLabel: nullableTimerText(definition.phaseLabel, 160),
    teamName: nullableTimerText(definition.teamName, 200),
    participantName: nullableTimerText(definition.participantName, 200),
    horseId: nullableTimerId(definition.horseId),
    horseName: nullableTimerText(definition.horseName, 200),
    attemptId: nullableTimerId(definition.attemptId),
    attemptIndex: Math.max(0, Math.trunc(finiteNumber(definition.attemptIndex))),
    opportunityIndex: Math.max(0, Math.trunc(finiteNumber(definition.opportunityIndex ?? definition.attemptIndex))),
    coleadorIndex: Math.max(0, Math.trunc(finiteNumber(definition.coleadorIndex))),
    mode: normalizeTimerId(definition.mode || (durationMs ? "countdown" : "countup")),
    timerRuleId: nullableTimerId(definition.timerRuleId),
    temporalPolicyStatus: nullableTimerText(definition.temporalPolicyStatus, 80),
    temporalPolicyCode: nullableTimerText(definition.temporalPolicyCode, 160),
    temporalPolicyId: nullableTimerId(definition.temporalPolicyId),
    temporalPolicyVersion: nullableTimerText(definition.temporalPolicyVersion, 80),
    temporalFingerprint: nullableTimerText(definition.temporalFingerprint, 120),
    ruleProfileId: nullableTimerId(definition.ruleProfileId),
    ruleProfileVersion: nullableTimerText(definition.ruleProfileVersion, 80),
    ruleProfileFingerprint: nullableTimerText(definition.ruleProfileFingerprint, 120),
    commandSource: null,
    actor: null,
    authorityAcceptedAt: null,
    createdAt,
    updatedAt: createdAt
  };
}

export function normalizeOfficialTimerContext(timer = {}, definition = {}) {
  const timerId = normalizeTimerId(timer?.timerId || definition?.timerId || definition?.id);
  if (!timerId) throw new Error("official-timer-id-required");
  const status = OFFICIAL_TIMER_STATUSES.includes(timer.status) ? timer.status : "READY";
  const durationMs = Math.max(0, finiteNumber(timer.durationMs ?? definition.durationMs ?? definition.limitMs));
  return {
    ...createOfficialTimerContext({ ...definition, ...timer, timerId, durationMs }, { now: timer.createdAt || Date.now() }),
    ...clonePlain(timer),
    contractVersion: OFFICIAL_TIMER_CONTEXT_VERSION,
    timerId,
    contextType: normalizeTimerId(timer.contextType || definition.contextType || "official"),
    status,
    durationMs,
    officialElapsedMs: Math.max(0, finiteNumber(timer.officialElapsedMs)),
    runningSince: normalizeIso(timer.runningSince),
    wallStartedAt: normalizeIso(timer.wallStartedAt),
    wallFinishedAt: normalizeIso(timer.wallFinishedAt),
    pausedAt: normalizeIso(timer.pausedAt),
    pauseReason: timer.pauseReason === null || timer.pauseReason === undefined
      ? null
      : normalizeTimerText(timer.pauseReason, 240),
    pauses: (Array.isArray(timer.pauses) ? timer.pauses : []).slice(0, 100).map((item) => ({
      pausedAt: normalizeIso(item?.pausedAt),
      resumedAt: normalizeIso(item?.resumedAt),
      reason: normalizeTimerText(item?.reason, 240),
      officialElapsedAtPause: Math.max(0, finiteNumber(item?.officialElapsedAtPause)),
      wallPauseMs: item?.wallPauseMs === null || item?.wallPauseMs === undefined
        ? null
        : Math.max(0, finiteNumber(item.wallPauseMs))
    })),
    revision: Math.max(0, Math.trunc(finiteNumber(timer.revision))),
    tournamentId: normalizeTimerId(timer.tournamentId || definition.tournamentId),
    competitionId: normalizeTimerId(timer.competitionId || definition.competitionId),
    charreadaId: normalizeTimerId(timer.charreadaId || definition.charreadaId),
    teamId: normalizeTimerId(timer.teamId || definition.teamId),
    participantId: normalizeTimerId(timer.participantId || definition.participantId),
    suerteId: normalizeTimerId(timer.suerteId || definition.suerteId),
    label: normalizeTimerText(timer.label || definition.label || timer.contextType || "Cronometro oficial", 160),
    suerteLabel: nullableTimerText(timer.suerteLabel || definition.suerteLabel, 160),
    phaseId: normalizeTimerId(timer.phaseId || definition.phaseId),
    phaseLabel: nullableTimerText(timer.phaseLabel || definition.phaseLabel, 160),
    teamName: nullableTimerText(timer.teamName || definition.teamName, 200),
    participantName: nullableTimerText(timer.participantName || definition.participantName, 200),
    horseId: nullableTimerId(timer.horseId || definition.horseId),
    horseName: nullableTimerText(timer.horseName || definition.horseName, 200),
    attemptId: nullableTimerId(timer.attemptId || definition.attemptId),
    attemptIndex: Math.max(0, Math.trunc(finiteNumber(timer.attemptIndex ?? definition.attemptIndex))),
    opportunityIndex: Math.max(0, Math.trunc(finiteNumber(timer.opportunityIndex ?? definition.opportunityIndex ?? timer.attemptIndex))),
    coleadorIndex: Math.max(0, Math.trunc(finiteNumber(timer.coleadorIndex ?? definition.coleadorIndex))),
    mode: normalizeTimerId(timer.mode || definition.mode || (durationMs ? "countdown" : "countup")),
    timerRuleId: nullableTimerId(timer.timerRuleId || definition.timerRuleId),
    temporalPolicyStatus: nullableTimerText(timer.temporalPolicyStatus || definition.temporalPolicyStatus, 80),
    temporalPolicyCode: nullableTimerText(timer.temporalPolicyCode || definition.temporalPolicyCode, 160),
    temporalPolicyId: nullableTimerId(timer.temporalPolicyId || definition.temporalPolicyId),
    temporalPolicyVersion: nullableTimerText(timer.temporalPolicyVersion || definition.temporalPolicyVersion, 80),
    temporalFingerprint: nullableTimerText(timer.temporalFingerprint || definition.temporalFingerprint, 120),
    ruleProfileId: nullableTimerId(timer.ruleProfileId || definition.ruleProfileId),
    ruleProfileVersion: nullableTimerText(timer.ruleProfileVersion || definition.ruleProfileVersion, 80),
    ruleProfileFingerprint: nullableTimerText(timer.ruleProfileFingerprint || definition.ruleProfileFingerprint, 120),
    controllerId: nullableTimerId(timer.controllerId),
    controllerUid: nullableTimerId(timer.controllerUid),
    controllerRole: nullableTimerText(timer.controllerRole, 120),
    controllerSessionId: nullableTimerId(timer.controllerSessionId),
    controllerType: normalizeControllerType(timer.controllerType),
    controllerClaimedAt: normalizeIso(timer.controllerClaimedAt),
    controllerLeaseExpiresAtMs: Math.max(0, Math.trunc(finiteNumber(timer.controllerLeaseExpiresAtMs))),
    previousController: normalizeOfficialTimerController(timer.previousController),
    lastCommandId: nullableTimerId(timer.lastCommandId),
    commandIds: normalizeCommandIds(timer.commandIds),
    authorityAudit: normalizeAuthorityAudit(timer.authorityAudit),
    lastOperation: nullableTimerText(timer.lastOperation, 80),
    source: normalizeTimerText(timer.source || definition.source || "scorer", 120),
    commandSource: timer.commandSource ? normalizeTimerText(timer.commandSource, 120) : null,
    actor: normalizeTimerActor(timer.actor),
    authorityAcceptedAt: normalizeIso(timer.authorityAcceptedAt),
    createdAt: normalizeIso(timer.createdAt) || new Date().toISOString(),
    updatedAt: normalizeIso(timer.updatedAt) || new Date().toISOString()
  };
}

export function applyOfficialTimerCommand(timer = {}, command = {}, options = {}) {
  const current = normalizeOfficialTimerContext(timer, options.definition || {});
  const type = String(command?.type || command || "").trim().toUpperCase();
  if (!OFFICIAL_TIMER_COMMANDS.includes(type)) {
    return { ok: false, reason: "official-timer-command-invalid", timer: current };
  }
  const commandId = nullableTimerId(command?.commandId || options.commandId);
  if (commandId && current.commandIds.includes(commandId)) {
    return { ok: true, idempotent: true, reason: "official-timer-command-replayed", timer: current };
  }
  if (options.requireCommandId === true && !commandId) {
    return { ok: false, reason: "official-timer-command-id-required", timer: current };
  }
  const nowMs = resolveNowMs(options.now ?? command?.acceptedAt ?? Date.now());
  const now = new Date(nowMs).toISOString();
  const expectedRevision = options.expectedRevision ?? command?.expectedRevision;
  if (expectedRevision !== undefined && Number(expectedRevision) !== current.revision) {
    return { ok: false, reason: "official-timer-revision-conflict", timer: current };
  }

  const next = clonePlain(current);
  const actor = normalizeTimerActor(command?.actor || options.actor);
  const controller = normalizeOfficialTimerController(command?.controller || options.controller, actor);
  const enforceOwnership = options.enforceOwnership === true;
  if (enforceOwnership) {
    if (!controller?.controllerId || !controller.controllerUid) {
      return { ok: false, reason: "official-timer-controller-required", timer: current };
    }
    if (
      current.controllerId && current.controllerId !== controller.controllerId ||
      current.controllerUid && current.controllerUid !== controller.controllerUid
    ) {
      return { ok: false, reason: "official-timer-controller-conflict", timer: current };
    }
    if (!current.controllerId) {
      if (options.autoClaim !== true || !canAutoClaimOfficialTimer(controller, current, options.definition)) {
        return { ok: false, reason: "official-timer-control-not-claimed", timer: current };
      }
      assignOfficialTimerController(next, controller, nowMs, options.leaseMs);
    } else {
      extendOfficialTimerLease(next, nowMs, options.leaseMs);
    }
  }
  if (type === "START") {
    if (current.status === "RUNNING") return { ok: true, idempotent: true, timer: current };
    if (current.status !== "READY") return { ok: false, reason: "official-timer-start-invalid-state", timer: current };
    next.status = "RUNNING";
    next.wallStartedAt = now;
    next.runningSince = now;
  }
  if (type === "PAUSE") {
    if (current.status === "PAUSED") return { ok: true, idempotent: true, timer: current };
    if (current.status !== "RUNNING") return { ok: false, reason: "official-timer-pause-invalid-state", timer: current };
    next.officialElapsedMs = resolveOfficialElapsedMs(current, nowMs);
    next.status = "PAUSED";
    next.runningSince = null;
    next.pausedAt = now;
    next.pauseReason = normalizeTimerText(command?.reason || options.pauseReason || "Pausa autorizada", 240);
    next.pauses = [...current.pauses, {
      pausedAt: now,
      resumedAt: null,
      reason: next.pauseReason,
      officialElapsedAtPause: next.officialElapsedMs,
      wallPauseMs: null
    }];
  }
  if (type === "RESUME") {
    if (current.status === "RUNNING") return { ok: true, idempotent: true, timer: current };
    if (current.status !== "PAUSED") return { ok: false, reason: "official-timer-resume-invalid-state", timer: current };
    const pauses = current.pauses.map((item, index) => {
      if (index !== current.pauses.length - 1 || item.resumedAt) return item;
      const pausedAtMs = Date.parse(item.pausedAt || "");
      return {
        ...item,
        resumedAt: now,
        wallPauseMs: Number.isFinite(pausedAtMs) ? Math.max(0, nowMs - pausedAtMs) : null
      };
    });
    next.status = "RUNNING";
    next.runningSince = now;
    next.pausedAt = null;
    next.pauseReason = null;
    next.pauses = pauses;
  }
  if (type === "FINISH") {
    if (current.status === "FINISHED") return { ok: true, idempotent: true, timer: current };
    next.officialElapsedMs = current.status === "RUNNING"
      ? resolveOfficialElapsedMs(current, nowMs)
      : current.officialElapsedMs;
    next.status = "FINISHED";
    next.runningSince = null;
    next.wallFinishedAt = now;
  }

  next.officialElapsedMs = Math.max(0, next.officialElapsedMs);
  next.commandSource = normalizeTimerText(command?.source || options.source || current.source || "scorer", 120);
  next.actor = actor;
  next.lastCommandId = commandId;
  next.commandIds = appendCommandId(current.commandIds, commandId);
  next.lastOperation = type;
  next.updatedAt = now;
  next.revision = current.revision + 1;
  next.authorityAudit = appendAuthorityAudit(current.authorityAudit, {
    commandId,
    operation: type,
    controllerId: next.controllerId,
    controllerType: next.controllerType,
    actorId: next.actor?.id || null,
    issuedAt: normalizeIso(command?.issuedAt) || now,
    acceptedAt: now,
    fromRevision: current.revision,
    toRevision: next.revision,
    result: "accepted"
  });
  return { ok: true, idempotent: false, timer: normalizeOfficialTimerContext(next) };
}

export function applyOfficialTimerControlOperation(timer = {}, request = {}, options = {}) {
  const current = normalizeOfficialTimerContext(timer, options.definition || {});
  const operation = String(request?.operation || request?.type || "").trim().toUpperCase();
  if (!OFFICIAL_TIMER_CONTROL_OPERATIONS.includes(operation)) {
    return { ok: false, reason: "official-timer-control-operation-invalid", timer: current };
  }
  const commandId = nullableTimerId(request.commandId || options.commandId);
  if (commandId && current.commandIds.includes(commandId)) {
    return { ok: true, idempotent: true, reason: "official-timer-command-replayed", timer: current };
  }
  if (options.requireCommandId === true && !commandId) {
    return { ok: false, reason: "official-timer-command-id-required", timer: current };
  }
  const expectedRevision = options.expectedRevision ?? request.expectedRevision;
  if (expectedRevision !== undefined && Number(expectedRevision) !== current.revision) {
    return { ok: false, reason: "official-timer-revision-conflict", timer: current };
  }

  const nowMs = resolveNowMs(options.now ?? request.acceptedAt ?? Date.now());
  const now = new Date(nowMs).toISOString();
  const actor = normalizeTimerActor(request.actor || options.actor);
  const controller = normalizeOfficialTimerController(request.controller || options.controller, actor);
  const next = clonePlain(current);

  if (operation === "CLAIM_CONTROL") {
    if (!controller?.controllerId || !controller.controllerUid) return { ok: false, reason: "official-timer-controller-required", timer: current };
    const sameController = current.controllerId === controller.controllerId && current.controllerUid === controller.controllerUid;
    const occupied = Boolean(current.controllerId && !sameController);
    if (occupied && !isOfficialTimerLeaseExpired(current, nowMs)) {
      return { ok: false, reason: "official-timer-controller-conflict", timer: current };
    }
    if (sameController && !isOfficialTimerLeaseExpired(current, nowMs)) {
      return { ok: true, idempotent: true, reason: "official-timer-control-already-owned", timer: current };
    }
    if (occupied) next.previousController = snapshotOfficialTimerController(current);
    assignOfficialTimerController(next, controller, nowMs, options.leaseMs);
  }

  if (operation === "TAKEOVER_CONTROL") {
    if (!controller?.controllerId || !controller.controllerUid) return { ok: false, reason: "official-timer-controller-required", timer: current };
    if (current.controllerId === controller.controllerId && current.controllerUid === controller.controllerUid) {
      return { ok: true, idempotent: true, reason: "official-timer-control-already-owned", timer: current };
    }
    if (!isAuthorizedTakeoverController(controller)) {
      return { ok: false, reason: "official-timer-takeover-not-authorized", timer: current };
    }
    const explicitReason = normalizeTimerText(request.reason || options.reason, 240);
    if (!explicitReason) return { ok: false, reason: "official-timer-takeover-reason-required", timer: current };
    if (current.controllerId) next.previousController = snapshotOfficialTimerController(current);
    assignOfficialTimerController(next, controller, nowMs, options.leaseMs);
  }

  if (operation === "HANDOFF_CONTROL") {
    if (
      !controller?.controllerId ||
      current.controllerId !== controller.controllerId ||
      current.controllerUid !== controller.controllerUid
    ) {
      return { ok: false, reason: "official-timer-controller-conflict", timer: current };
    }
    const targetController = normalizeOfficialTimerController(request.targetController || options.targetController || current.previousController);
    if (!targetController?.controllerId) {
      return { ok: false, reason: "official-timer-handoff-target-required", timer: current };
    }
    next.previousController = snapshotOfficialTimerController(current);
    assignOfficialTimerController(next, targetController, nowMs, options.leaseMs);
  }

  if (operation === "UPDATE_PAUSE_REASON") {
    if (
      !controller?.controllerId ||
      current.controllerId !== controller.controllerId ||
      current.controllerUid !== controller.controllerUid
    ) {
      return { ok: false, reason: "official-timer-controller-conflict", timer: current };
    }
    if (current.status !== "PAUSED") {
      return { ok: false, reason: "official-timer-pause-reason-invalid-state", timer: current };
    }
    const reason = normalizeTimerText(request.reason || options.reason, 240);
    if (!reason) return { ok: false, reason: "official-timer-pause-reason-required", timer: current };
    next.pauseReason = reason;
    next.pauses = current.pauses.map((item, index) => index === current.pauses.length - 1 ? { ...item, reason } : item);
    extendOfficialTimerLease(next, nowMs, options.leaseMs);
  }

  next.actor = actor;
  next.commandSource = normalizeTimerText(request.source || options.source || current.source || "timer-authority", 120);
  next.lastCommandId = commandId;
  next.commandIds = appendCommandId(current.commandIds, commandId);
  next.lastOperation = operation;
  next.updatedAt = now;
  next.revision = current.revision + 1;
  next.authorityAudit = appendAuthorityAudit(current.authorityAudit, {
    commandId,
    operation,
    controllerId: next.controllerId,
    controllerType: next.controllerType,
    actorId: actor?.id || null,
    issuedAt: normalizeIso(request.issuedAt) || now,
    acceptedAt: now,
    fromRevision: current.revision,
    toRevision: next.revision,
    result: "accepted",
    reason: normalizeTimerText(request.reason || options.reason, 240) || null
  });
  return { ok: true, idempotent: false, timer: normalizeOfficialTimerContext(next) };
}

export function getOfficialTimerControlView(timer = {}, controller = {}, options = {}) {
  const current = normalizeOfficialTimerContext(timer, options.definition || {});
  const candidate = normalizeOfficialTimerController(controller);
  const nowMs = resolveNowMs(options.now ?? Date.now());
  const hasController = Boolean(current.controllerId);
  const isOwner = Boolean(
    hasController &&
    candidate?.controllerId === current.controllerId &&
    candidate?.controllerUid === current.controllerUid
  );
  const leaseExpired = hasController ? isOfficialTimerLeaseExpired(current, nowMs) : true;
  return {
    hasController,
    isOwner,
    leaseExpired,
    canClaim: !hasController || isOwner || leaseExpired,
    canTakeover: !isOwner && isAuthorizedTakeoverController(candidate),
    canHandback: isOwner && Boolean(current.previousController?.controllerId),
    controllerId: current.controllerId,
    controllerUid: current.controllerUid,
    controllerRole: current.controllerRole,
    controllerSessionId: current.controllerSessionId,
    controllerType: current.controllerType,
    controllerLabel: getOfficialTimerControllerLabel(current.controllerType),
    previousController: current.previousController ? clonePlain(current.previousController) : null,
    leaseExpiresAtMs: current.controllerLeaseExpiresAtMs
  };
}

export function buildOfficialTimerProjection(timer = {}, options = {}) {
  const current = normalizeOfficialTimerContext(timer, options.definition || {});
  const view = getOfficialTimerContextView(current, options);
  const generatedAt = toIso(options.now ?? Date.now());
  return {
    official: true,
    timerId: current.timerId,
    id: current.timerId,
    contextType: current.contextType,
    label: current.label,
    status: current.status.toLowerCase(),
    officialStatus: current.status,
    running: view.running,
    paused: view.paused,
    runningSince: current.runningSince,
    startedAt: current.wallStartedAt,
    pausedAt: current.pausedAt,
    stoppedAt: current.wallFinishedAt,
    elapsedMs: current.officialElapsedMs,
    officialElapsedMs: current.officialElapsedMs,
    elapsedLiveMs: view.officialElapsedMs,
    displayMs: view.remainingMs ?? view.officialElapsedMs,
    remainingMs: view.remainingMs,
    overtimeMs: view.overtimeMs,
    formatted: view.formattedRemaining,
    formattedTime: view.formattedRemaining,
    display: view.formattedRemaining,
    timeText: view.formattedRemaining,
    limitMs: current.durationMs,
    durationMs: current.durationMs,
    mode: current.mode || (current.durationMs ? "countdown" : "elapsed"),
    expired: view.expired,
    overtime: view.overtime,
    alertState: view.alertState,
    revision: current.revision,
    sourceRevision: current.revision,
    generatedAt,
    updatedAt: current.updatedAt,
    updatedAtMs: Date.parse(current.updatedAt || "") || 0,
    contextRef: {
      tournamentId: current.tournamentId || null,
      competitionId: current.competitionId || null,
      charreadaId: current.charreadaId || null,
      teamId: current.teamId || null,
      participantId: current.participantId || null,
      suerteId: current.suerteId || null,
      phaseId: current.phaseId || null,
      attemptIndex: current.attemptIndex,
      opportunityIndex: current.opportunityIndex,
      coleadorIndex: current.coleadorIndex
    },
    suerteLabel: current.suerteLabel,
    phaseId: current.phaseId,
    phaseLabel: current.phaseLabel,
    teamName: current.teamName,
    participantName: current.participantName,
    horseName: current.horseName,
    opportunityIndex: current.opportunityIndex,
    timerRuleId: current.timerRuleId,
    temporalPolicyStatus: current.temporalPolicyStatus,
    temporalPolicyId: current.temporalPolicyId,
    temporalPolicyVersion: current.temporalPolicyVersion,
    temporalFingerprint: current.temporalFingerprint,
    ruleProfileId: current.ruleProfileId,
    ruleProfileVersion: current.ruleProfileVersion,
    ruleProfileFingerprint: current.ruleProfileFingerprint,
    controllerType: current.controllerType,
    pauseReason: current.pauseReason,
    stateLabel: officialTimerStatusLabel(current.status)
  };
}

export function buildOfficialTimerDefinitionsFromContext(source = {}) {
  const context = source?.turn ? source : { turn: source };
  const turn = context.turn || {};
  const suerte = turn.suerte || context.suerte || {};
  const tournamentId = normalizeTimerId(context.tournament?.id || context.tournamentId);
  const competitionId = normalizeTimerId(turn.competition?.competitionId || turn.competition?.id || context.charreada?.competitionId || context.competitionId || "equipos_completo");
  const charreadaId = normalizeTimerId(context.charreada?.id || context.charreadaId);
  const teamId = normalizeTimerId(turn.team?.id || context.team?.id || context.teamId);
  const participantId = normalizeTimerId(turn.participant?.id || context.participant?.id || context.participantId);
  const suerteId = normalizeTimerId(suerte.id || context.suerteId);
  const attemptIndex = Math.max(0, Math.trunc(finiteNumber(turn.attemptIndex ?? context.attemptIndex)));
  const coleadorIndex = Math.max(0, Math.trunc(finiteNumber(turn.coleadorIndex ?? context.coleadorIndex)));
  const participantScopeId = teamId || participantId;
  if (!tournamentId || !charreadaId || !participantScopeId || !suerteId) return [];
  const identity = {
    tournamentId,
    competitionId,
    charreadaId,
    teamId,
    participantId,
    suerteId,
    suerteLabel: normalizeTimerText(suerte.fullName || suerte.name || suerte.label || suerteId, 160),
    teamName: nullableTimerText(turn.team?.name || context.team?.name, 200),
    participantName: nullableTimerText(turn.participant?.name || context.participant?.name || turn.team?.participantName, 200),
    horseId: normalizeTimerId(turn.participant?.horseId || context.participant?.horseId || turn.team?.horseId || context.team?.horseId),
    horseName: nullableTimerText(turn.participant?.horseName || context.participant?.horseName || turn.team?.horseName || context.team?.horseName, 200),
    attemptId: normalizeTimerId(turn.attempt?.attemptId || turn.attempt?.id || context.attemptId),
    attemptIndex,
    opportunityIndex: attemptIndex,
    coleadorIndex
  };
  const profileReference = suerte.ruleResolution?.profile || {};
  const runtimePolicy = resolveFmchOfficialTemporalRuntimePolicy({
    tournament: context.tournament,
    profileId: profileReference.profileId || context.tournament?.ruleProfileId,
    profileVersion: profileReference.profileVersion || context.tournament?.ruleProfileVersion,
    profileFingerprint: context.tournament?.ruleProfileContentFingerprint || context.tournament?.effectiveRulesFingerprint,
    temporalPolicyId: context.tournament?.temporalPolicyId,
    temporalPolicyVersion: context.tournament?.temporalPolicyVersion,
    temporalFingerprint: context.tournament?.temporalFingerprint
  });
  if (runtimePolicy.ok) {
    const previousOpportunityResolution = normalizeTimerId(
      turn.previousOpportunityResolution
        || context.previousOpportunityResolution
        || (attemptIndex === 0 ? "NO_EXTENSION" : "")
    ).toUpperCase();
    const resolved = resolveFmchOfficialTemporalContracts({
      profileId: runtimePolicy.profileId,
      profileVersion: runtimePolicy.profileVersion,
      suerteId,
      previousOpportunityResolution
    });
    if (!resolved.ok) return [buildUnavailableTemporalDefinition(identity, runtimePolicy, resolved.code)];
    return resolved.contracts.map((contract) => buildCertifiedTemporalDefinition({
      identity,
      contract,
      runtimePolicy,
      attemptIndex,
      coleadorIndex
    }));
  }
  const fmchProfileRequested = (profileReference.profileId || context.tournament?.ruleProfileId) === "FMCH_2026_LIBRE";
  if (fmchProfileRequested) return [buildUnavailableTemporalDefinition(identity, runtimePolicy, runtimePolicy.code)];

  const temporalMetadata = suerte.ruleMetadata || suerte.ruleResolution?.ruleMetadata || {};
  const temporalContracts = Array.isArray(temporalMetadata.timerContracts)
    ? temporalMetadata.timerContracts
    : temporalMetadata.timerContract ? [temporalMetadata.timerContract] : [];
  const withTemporalAuthority = (definition, contractId = definition.contextType) => {
    const contract = temporalContracts.find((item) => (
      normalizeTimerId(item?.timerId) === normalizeTimerId(contractId) ||
      normalizeTimerId(item?.timerId) === normalizeTimerId(definition.contextType)
    )) || null;
    const durationMs = contract ? Math.max(0, finiteNumber(contract.limitMs)) : definition.durationMs;
    return {
      ...definition,
      durationMs,
      configuredDurationMs: durationMs,
      mode: contract?.mode || (durationMs ? "countdown" : "manual"),
      timerRuleId: contract?.timerId || null,
      temporalRuleStatus: contract ? "CERTIFIED" : "TEMPORAL_RULE_MISSING",
      temporalRuleSource: contract ? "rule_profile" : "legacy_compatibility",
      ruleProfileId: profileReference.profileId || context.tournament?.ruleProfileId || null,
      ruleProfileVersion: profileReference.profileVersion || context.tournament?.ruleProfileVersion || null,
      ruleProfileFingerprint: context.tournament?.effectiveRulesFingerprint || context.tournament?.ruleProfileContentFingerprint || null
    };
  };
  const baseScope = `${charreadaId}:${participantScopeId}`;
  const scope = suerteId === "piales" || suerteId === "colas"
    ? `${baseScope}:attempt-${attemptIndex}:participant-${coleadorIndex}`
    : baseScope;
  if (suerteId === "toro" || suerteId === "yegua") {
    return [withTemporalAuthority({
      ...identity,
      timerId: `timer_${suerteId}_apretalamiento:${scope}`,
      contextType: `${suerteId}_apretalamiento`,
      durationMs: 300000,
      label: suerteId === "toro" ? "Apretalamiento de Toro" : "Apretalamiento de Yegua"
    }, `${suerteId}_apretalamiento`)];
  }
  if (suerteId === "lazo" || suerteId === "pial_ruedo" || suerteId === "terna") {
    return [withTemporalAuthority({
      ...identity,
      suerteId: "terna",
      timerId: `terna:${tournamentId}:${competitionId}:${charreadaId}:${participantScopeId}:timer`,
      contextType: "terna",
      durationMs: 420000,
      label: "Terna"
    }, "terna")];
  }
  if (suerteId === "manganas_pie" || suerteId === "manganas_caballo") {
    return [withTemporalAuthority({
      ...identity,
      timerId: `timer_${suerteId}:${scope}`,
      contextType: `timer_${suerteId}`,
      durationMs: 420000,
      label: suerteId === "manganas_pie" ? "Manganas a Pie" : "Manganas a Caballo"
    }, `timer_${suerteId}`)];
  }
  if (suerteId === "paso") {
    return [
      withTemporalAuthority({ ...identity, timerId: `timer_paso_3min:${scope}`, contextType: "timer_paso_3min", durationMs: 180000, label: "Paso: salida 3 min" }, "timer_paso_3min"),
      withTemporalAuthority({ ...identity, timerId: `timer_paso_1min:${scope}`, contextType: "timer_paso_1min", durationMs: 60000, label: "Paso: desmonte 1 min" }, "timer_paso_1min")
    ];
  }
  const legacyRule = getTimerRuleForSource({ suerteId });
  if (suerteId === "cala") return [];
  return [withTemporalAuthority({
    ...identity,
    timerId: `timer_${suerteId}:${scope}`,
    contextType: suerteId,
    durationMs: legacyRule.mode === "countdown" ? legacyRule.limitMs : 0,
    label: legacyRule.label || `Cronometro ${suerteId}`
  })];
}

function buildCertifiedTemporalDefinition({ identity, contract, runtimePolicy, attemptIndex, coleadorIndex }) {
  const sharedTerna = contract.ruleId === "fmch_2026_terna_shared_window";
  const contextSuerteId = sharedTerna ? "terna" : identity.suerteId;
  const participantScopeId = identity.teamId || identity.participantId;
  const baseScope = `${identity.charreadaId}:${participantScopeId}`;
  const opportunityScope = contract.identityDimensions?.includes("opportunityIndex")
    ? `:opportunity-${attemptIndex}`
    : "";
  const coleadorScope = contract.identityDimensions?.includes("coleadorIndex")
    ? `:participant-${coleadorIndex}`
    : "";
  const timerId = sharedTerna
    ? `terna:${identity.tournamentId}:${identity.competitionId}:${identity.charreadaId}:${participantScopeId}:timer`
    : `${certifiedTimerPrefix(contract)}:${baseScope}${opportunityScope}${coleadorScope}`;
  const durationMs = Math.max(0, finiteNumber(contract.limitMs));
  return {
    ...identity,
    suerteId: contextSuerteId,
    timerId,
    contextType: sharedTerna ? "terna" : certifiedTimerPrefix(contract),
    phaseId: contract.phaseId,
    phaseLabel: temporalPhaseLabel(contract.phaseId, contract.componentPhaseId),
    durationMs,
    configuredDurationMs: durationMs,
    mode: contract.mode,
    label: temporalTimerLabel(identity.suerteLabel, contract.phaseId, contract.componentPhaseId),
    timerRuleId: contract.ruleId,
    temporalRuleStatus: "CERTIFIED",
    temporalRuleSource: "certified_temporal_policy",
    temporalPolicyStatus: runtimePolicy.status,
    temporalPolicyCode: runtimePolicy.code,
    temporalPolicyId: runtimePolicy.policyId,
    temporalPolicyVersion: runtimePolicy.policyVersion,
    temporalFingerprint: runtimePolicy.policyFingerprint,
    ruleProfileId: runtimePolicy.profileId,
    ruleProfileVersion: runtimePolicy.profileVersion,
    ruleProfileFingerprint: runtimePolicy.profileFingerprint,
    source: "certified-temporal-policy"
  };
}

function buildUnavailableTemporalDefinition(identity, runtimePolicy, code) {
  return {
    ...identity,
    timerId: `timer_unavailable:${identity.charreadaId}:${identity.teamId || identity.participantId}:${identity.suerteId}`,
    contextType: "temporal_policy_unavailable",
    phaseId: "unavailable",
    phaseLabel: "Politica temporal no disponible",
    durationMs: 0,
    configuredDurationMs: 0,
    mode: "unavailable",
    label: `${identity.suerteLabel || identity.suerteId} · tiempo no disponible`,
    temporalRuleStatus: "TEMPORAL_POLICY_UNAVAILABLE",
    temporalRuleSource: "fail_closed",
    temporalPolicyStatus: "TEMPORAL_POLICY_UNAVAILABLE",
    temporalPolicyCode: code,
    temporalPolicyId: runtimePolicy.policyId,
    temporalPolicyVersion: runtimePolicy.policyVersion,
    temporalFingerprint: runtimePolicy.policyFingerprint,
    ruleProfileId: runtimePolicy.profileId,
    ruleProfileVersion: runtimePolicy.profileVersion,
    ruleProfileFingerprint: runtimePolicy.profileFingerprint,
    source: "temporal-policy-fail-closed"
  };
}

function certifiedTimerPrefix(contract) {
  const mapping = {
    fmch_2026_cala_freno_review: "timer_cala_freno_review",
    fmch_2026_cala_partidero_start: "timer_cala_partidero_start",
    fmch_2026_piales_opportunity_readiness: "timer_piales",
    fmch_2026_coleadero_partidero_release: "timer_colas",
    fmch_2026_toro_apretalamiento: "timer_toro_apretalamiento",
    fmch_2026_yegua_apretalamiento: "timer_yegua_apretalamiento",
    fmch_2026_yegua_dismount: "timer_yegua_dismount",
    fmch_2026_manganas_pie_execution: "timer_manganas_pie",
    fmch_2026_manganas_caballo_changeover: "timer_manganas_caballo_changeover",
    fmch_2026_manganas_caballo_execution: "timer_manganas_caballo",
    fmch_2026_paso_mare_exit: "timer_paso_3min",
    fmch_2026_paso_dismount: "timer_paso_1min"
  };
  return mapping[contract.ruleId] || `timer_${normalizeTimerId(contract.ruleId || contract.phaseId)}`;
}

function temporalPhaseLabel(phaseId, componentPhaseId = "") {
  if (componentPhaseId === "cabecero") return "Cabecero";
  if (componentPhaseId === "pial") return "Pial en el ruedo";
  const labels = {
    freno_review: "Revision de freno",
    partidero_start: "Salida del partidero",
    opportunity_readiness: "Preparacion de oportunidad",
    partidero_release: "Salida del partidero",
    apretalamiento: "Apretalamiento",
    shared_execution: "Ejecucion compartida",
    dismount: "Desmonte",
    changeover: "Cambio de charro",
    execution: "Ventana de ejecucion",
    mare_exit: "Salida de la yegua"
  };
  return labels[phaseId] || normalizeTimerText(phaseId || "Tiempo oficial", 160);
}

function temporalTimerLabel(suerteLabel, phaseId, componentPhaseId = "") {
  return [suerteLabel, temporalPhaseLabel(phaseId, componentPhaseId)].filter(Boolean).join(" · ");
}

export function selectOfficialTimerForContext(registry = {}, source = {}) {
  const definitions = buildOfficialTimerDefinitionsFromContext(source);
  const values = Array.isArray(registry) ? registry : Object.values(registry || {});
  for (const definition of definitions) {
    const timer = values.find((item) => item?.timerId === definition.timerId);
    if (timer) return normalizeOfficialTimerContext(timer, definition);
  }
  return null;
}

export function resolveOfficialTimerSelection(input = {}) {
  const definitions = Array.isArray(input.definitions) ? input.definitions.filter((item) => item?.timerId) : [];
  const currentIds = new Set(definitions.map((item) => item.timerId));
  const selectedTimerId = normalizeTimerId(input.selectedTimerId);
  if (selectedTimerId && currentIds.has(selectedTimerId)) {
    return {
      timerId: selectedTimerId,
      contextChanged: false,
      blockedByActiveTimer: false,
      previousTimerId: null
    };
  }

  const nextTimerId = definitions[0]?.timerId || "";
  return {
    timerId: nextTimerId,
    contextChanged: nextTimerId !== selectedTimerId,
    blockedByActiveTimer: false,
    previousTimerId: selectedTimerId || null
  };
}

export function getOfficialTimerContextView(timer = {}, options = {}) {
  const current = normalizeOfficialTimerContext(timer, options.definition || {});
  const nowMs = resolveNowMs(options.now ?? Date.now());
  const liveDisplay = deriveOfficialTimerLiveDisplay(current, nowMs);
  const officialElapsedMs = liveDisplay.elapsedMs;
  const remainingMs = liveDisplay.remainingMs;
  const wallStartedAtMs = Date.parse(current.wallStartedAt || "");
  const wallFinishedAtMs = Date.parse(current.wallFinishedAt || "");
  const wallElapsedMs = Number.isFinite(wallStartedAtMs)
    ? Math.max(0, (Number.isFinite(wallFinishedAtMs) ? wallFinishedAtMs : nowMs) - wallStartedAtMs)
    : 0;
  return {
    timerId: current.timerId,
    status: current.status,
    running: current.status === "RUNNING",
    paused: current.status === "PAUSED",
    finished: current.status === "FINISHED",
    durationMs: current.durationMs,
    officialElapsedMs,
    remainingMs,
    overtimeMs: liveDisplay.overtimeMs,
    wallElapsedMs,
    pauseReason: current.pauseReason,
    revision: current.revision,
    formattedElapsed: liveDisplay.formattedElapsed,
    formattedRemaining: liveDisplay.formattedRemaining,
    expired: liveDisplay.expired,
    overtime: liveDisplay.overtime,
    alertState: liveDisplay.alertState
  };
}

export function validateOfficialTimerContext(timer = {}) {
  const errors = [];
  let normalized = null;
  if (timer?.status !== undefined && !OFFICIAL_TIMER_STATUSES.includes(timer.status)) {
    errors.push("official-timer-status-invalid");
  }
  try {
    normalized = normalizeOfficialTimerContext(timer);
  } catch (error) {
    errors.push(error?.message || "official-timer-invalid");
  }
  if (normalized) {
    if (normalized.status === "RUNNING" && !normalized.runningSince) errors.push("official-timer-running-since-required");
    if (normalized.status !== "RUNNING" && normalized.runningSince) errors.push("official-timer-running-since-unexpected");
  }
  return { valid: errors.length === 0, errors, timer: normalized };
}

function getTimerRuleFromTimer(timer = {}) {
  const sourceRule = timer.rule || {
    mode: timer.mode,
    label: timer.limitLabel || timer.label,
    activeLabel: timer.activeLabel,
    pausedLabel: timer.pausedLabel,
    expiredLabel: timer.expiredLabel,
    limitMs: timer.limitMs ?? timer.durationMs
  };
  return normalizeTimerRule(sourceRule);
}

function normalizeTimerRule(rule = {}) {
  const merged = { ...DEFAULT_TIMER_RULE, ...(rule || {}) };
  const limitMs = Number(merged.limitMs || merged.durationMs || 0);
  return {
    mode: merged.mode === "countdown" && limitMs > 0 ? "countdown" : "elapsed",
    label: merged.label || DEFAULT_TIMER_RULE.label,
    activeLabel: merged.activeLabel || merged.label || DEFAULT_TIMER_RULE.activeLabel,
    pausedLabel: merged.pausedLabel || `${merged.label || DEFAULT_TIMER_RULE.label} pausado`,
    expiredLabel: merged.expiredLabel || DEFAULT_TIMER_RULE.expiredLabel,
    limitMs
  };
}

function getTimerStateLabel(timer = {}, rule, expired) {
  if (expired) return rule.expiredLabel;
  return timer.running ? rule.activeLabel : rule.pausedLabel;
}

function resolveOfficialElapsedMs(timer, nowMs) {
  const base = Math.max(0, finiteNumber(timer.officialElapsedMs));
  if (timer.status !== "RUNNING" || !timer.runningSince) return base;
  const startedMs = Date.parse(timer.runningSince);
  if (!Number.isFinite(startedMs)) return base;
  return base + Math.max(0, nowMs - startedMs);
}

function resolveNowMs(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function assignOfficialTimerController(timer, controller, nowMs, leaseMs) {
  timer.controllerId = controller.controllerId;
  timer.controllerUid = controller.controllerUid;
  timer.controllerRole = controller.controllerRole;
  timer.controllerSessionId = controller.controllerSessionId;
  timer.controllerType = controller.controllerType;
  timer.controllerClaimedAt = new Date(nowMs).toISOString();
  timer.controllerLeaseExpiresAtMs = nowMs + normalizeLeaseMs(leaseMs);
}

function extendOfficialTimerLease(timer, nowMs, leaseMs) {
  timer.controllerLeaseExpiresAtMs = nowMs + normalizeLeaseMs(leaseMs);
}

function normalizeLeaseMs(value) {
  const parsed = Math.trunc(finiteNumber(value));
  return parsed > 0 ? Math.min(parsed, 5 * 60 * 1000) : OFFICIAL_TIMER_LEASE_MS;
}

function isOfficialTimerLeaseExpired(timer, nowMs) {
  return !timer.controllerLeaseExpiresAtMs || timer.controllerLeaseExpiresAtMs <= nowMs;
}

function normalizeOfficialTimerController(value = {}, actor = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const controller = {
    controllerId: nullableTimerId(value.controllerId || value.id || value.clientId),
    controllerUid: nullableTimerId(value.controllerUid || value.uid || actor?.uid || actor?.id),
    controllerRole: nullableTimerText(value.controllerRole || value.role, 120),
    controllerSessionId: nullableTimerId(value.controllerSessionId || value.sessionId || value.tabSessionId),
    controllerType: normalizeControllerType(value.controllerType || value.type)
  };
  return controller.controllerId ? controller : null;
}

function normalizeControllerType(value) {
  const type = String(value || "").trim().toLowerCase();
  return OFFICIAL_TIMER_CONTROLLER_TYPES.includes(type) ? type : null;
}

function isPrimaryTimerController(controller) {
  return ["field_remote", "web_remote"].includes(controller?.controllerType);
}

function canAutoClaimOfficialTimer(controller, timer = {}, definition = {}) {
  if (isPrimaryTimerController(controller)) return true;
  const phaseId = normalizeTimerId(definition.phaseId || timer.phaseId);
  return phaseId === "freno_review"
    && ["scorer_backup", "supervisor_backup"].includes(controller?.controllerType);
}

function isAuthorizedTakeoverController(controller) {
  return ["field_remote", "web_remote", "scorer_backup", "supervisor_backup", "system"].includes(controller?.controllerType);
}

function snapshotOfficialTimerController(timer = {}) {
  return normalizeOfficialTimerController({
    controllerId: timer.controllerId,
    controllerUid: timer.controllerUid,
    controllerRole: timer.controllerRole,
    controllerSessionId: timer.controllerSessionId,
    controllerType: timer.controllerType
  });
}

function getOfficialTimerControllerLabel(type) {
  if (["field_remote", "web_remote"].includes(type)) return "Juez de campo";
  if (type === "scorer_backup") return "Calificador de respaldo";
  if (type === "supervisor_backup") return "Supervisor de respaldo";
  if (type === "system") return "Sistema";
  if (type === "smartwatch") return "Smartwatch";
  if (type === "hardware_remote") return "Control fisico";
  return "Sin controlador";
}

function officialTimerStatusLabel(status) {
  if (status === "RUNNING") return "Tiempo en curso";
  if (status === "PAUSED") return "Tiempo pausado";
  if (status === "FINISHED") return "Tiempo finalizado";
  return "Listo para iniciar";
}

function normalizeCommandIds(value) {
  return Array.from(new Set((Array.isArray(value) ? value : [])
    .map((item) => nullableTimerId(item))
    .filter(Boolean)))
    .slice(-50);
}

function appendCommandId(commandIds, commandId) {
  if (!commandId) return normalizeCommandIds(commandIds);
  return normalizeCommandIds([...(commandIds || []), commandId]);
}

function normalizeAuthorityAudit(value) {
  return (Array.isArray(value) ? value : []).slice(-100).map((item) => ({
    commandId: nullableTimerId(item?.commandId),
    operation: nullableTimerText(item?.operation, 80),
    controllerId: nullableTimerId(item?.controllerId),
    controllerType: normalizeControllerType(item?.controllerType),
    actorId: nullableTimerId(item?.actorId),
    issuedAt: normalizeIso(item?.issuedAt),
    acceptedAt: normalizeIso(item?.acceptedAt),
    fromRevision: Math.max(0, Math.trunc(finiteNumber(item?.fromRevision))),
    toRevision: Math.max(0, Math.trunc(finiteNumber(item?.toRevision))),
    result: nullableTimerText(item?.result, 80),
    reason: item?.reason === null || item?.reason === undefined ? null : normalizeTimerText(item.reason, 240)
  }));
}

function appendAuthorityAudit(audit, entry) {
  return normalizeAuthorityAudit([...(audit || []), entry]);
}

function normalizeTimerId(value) {
  return String(value || "").trim().replace(/[^A-Za-z0-9._:@/-]/g, "_").slice(0, 240);
}

function nullableTimerId(value) {
  const normalized = normalizeTimerId(value);
  return normalized || null;
}

function normalizeTimerText(value, maxLength = 500) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, maxLength);
}

function nullableTimerText(value, maxLength = 500) {
  if (value === null || value === undefined) return null;
  const normalized = normalizeTimerText(value, maxLength);
  return normalized || null;
}

function normalizeTimerActor(value = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const actor = {
    id: normalizeTimerId(value.id || value.uid),
    name: normalizeTimerText(value.name || value.displayName, 240),
    role: normalizeTimerText(value.role, 120)
  };
  return actor.id || actor.name || actor.role ? actor : null;
}

function normalizeIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toIso(value) {
  const date = new Date(resolveNowMs(value));
  return date.toISOString();
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function fingerprintTemporalValue(value) {
  const text = stableTemporalStringify(value);
  let left = 0x811c9dc5;
  let right = 0x9e3779b9;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    left = Math.imul(left ^ code, 0x01000193) >>> 0;
    right = Math.imul(right ^ code, 0x85ebca6b) >>> 0;
  }
  return `${left.toString(16).padStart(8, "0")}${right.toString(16).padStart(8, "0")}`;
}

function stableTemporalStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableTemporalStringify).join(",")}]`;
  return `{${Object.keys(value).sort()
    .map((key) => `${JSON.stringify(key)}:${stableTemporalStringify(value[key])}`).join(",")}}`;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const item of Object.values(value)) deepFreeze(item);
  return value;
}

function clonePlain(value) {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

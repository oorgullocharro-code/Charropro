import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  FMCH_2026_LIBRE_PROFILE,
  RULE_CATEGORIES,
  RULE_PROFILE_CONTRACT_VERSION,
  RULE_SOURCES,
  buildRuleIdentity,
  resolveEffectiveRules,
  resolveRuleProfileSelection,
  validateRuleProfile
} from "../js/data/ruleProfiles.js?v=20260831-official-ranking-authority-public-parity-compatibility-001-v1";
import {
  SUERTES,
  getTournamentSuertes,
  resolveTournamentRules
} from "../js/data/suertes.js?v=20260831-official-ranking-authority-public-parity-compatibility-001-v1";
import { calculateAttemptTotal } from "../js/core/scoring.js?v=20260831-official-ranking-authority-public-parity-compatibility-001-v1";

function profile(rules = [], overrides = {}) {
  return {
    contractVersion: RULE_PROFILE_CONTRACT_VERSION,
    profileId: "FMCH_TEST",
    version: "1.0.0",
    name: "FMCH Test",
    scope: "competition",
    status: "active",
    source: "fixture",
    rules,
    metadata: {},
    ...overrides
  };
}

function suerte(overrides = {}) {
  return {
    id: "test_suerte",
    name: "Test",
    fullName: "Suerte Test",
    attempts: 1,
    catalog: {
      base: [{ id: "A", pts: 10, label: "Base A" }],
      adic: [],
      infr: [],
      desc: [],
      ...overrides
    }
  };
}

function resolve(input = {}) {
  return resolveEffectiveRules({ suerte: suerte(), ...input });
}

// Caso 1: Product Base permanece sin profile.
const baseOnly = resolve();
assert.equal(baseOnly.valid, true);
assert.equal(baseOnly.suerte.catalog.base[0].pts, 10);
assert.equal(baseOnly.suerte.catalog.base[0].source, RULE_SOURCES.PRODUCT_BASE);

// Caso 2: el profile sustituye solo la regla declarada.
const profileOverride = resolve({
  profile: profile([{ suerteId: "test_suerte", category: "base", ruleId: "A", value: 12 }])
});
assert.equal(profileOverride.valid, true);
assert.equal(profileOverride.suerte.catalog.base[0].pts, 12);
assert.equal(profileOverride.suerte.catalog.base[0].source, RULE_SOURCES.RULE_PROFILE);

// Caso 3: la convocatoria conserva la precedencia vigente sobre el profile.
const tournamentOverride = resolve({
  profile: profile([{ suerteId: "test_suerte", category: "base", ruleId: "A", value: 12 }]),
  tournamentOverride: {
    catalog: { base: [{ id: "A", pts: 14, label: "Base convocatoria" }] }
  }
});
assert.equal(tournamentOverride.valid, true);
assert.equal(tournamentOverride.suerte.catalog.base[0].pts, 14);
assert.equal(tournamentOverride.suerte.catalog.base[0].source, RULE_SOURCES.TOURNAMENT_OVERRIDE);

// Caso 4: disable es lógico; desaparece del scorer pero permanece diagnosticable.
const disabled = resolve({
  profile: profile([{ suerteId: "test_suerte", category: "base", ruleId: "A", enabled: false }])
});
assert.equal(disabled.valid, true);
assert.equal(disabled.suerte.catalog.base.length, 0);
assert.equal(disabled.allRules.base[0].enabled, false);

// Caso 5: el profile puede incorporar una regla nueva sin tocar Product Base.
const newProfileRule = resolve({
  profile: profile([{
    suerteId: "test_suerte",
    category: "adic",
    ruleId: "B",
    label: "Adicional B",
    value: 2,
    enabled: true
  }])
});
assert.equal(newProfileRule.valid, true);
assert.equal(newProfileRule.suerte.catalog.adic[0].ruleKey, "test_suerte:adic:B");
assert.equal(newProfileRule.suerte.catalog.adic[0].source, RULE_SOURCES.RULE_PROFILE);

// Caso 6: un override de torneo no puede inventar RuleID salvo custom explícito.
const unknownTournamentRule = resolve({
  tournamentOverride: {
    rules: [{ suerteId: "test_suerte", category: "base", ruleId: "MISSING", value: 14 }]
  }
});
assert.equal(unknownTournamentRule.valid, false);
assert.ok(unknownTournamentRule.diagnostics.some((item) => item.code === "override-rule-not-found"));

const customTournamentRule = resolve({
  tournamentOverride: {
    rules: [{
      suerteId: "test_suerte",
      category: "adic",
      ruleId: "CUSTOM",
      label: "Convocatoria",
      value: 3,
      custom: true
    }]
  }
});
assert.equal(customTournamentRule.valid, true);
assert.equal(customTournamentRule.suerte.catalog.adic[0].source, RULE_SOURCES.TOURNAMENT_OVERRIDE);

// Caso 7: identidades duplicadas dentro de una capa son conflicto explícito.
const duplicateProfile = validateRuleProfile(profile([
  { suerteId: "test_suerte", category: "base", ruleId: "A", value: 12 },
  { suerteId: "test_suerte", category: "base", ruleId: "A", value: 13 }
]));
assert.equal(duplicateProfile.valid, false);
assert.ok(duplicateProfile.diagnostics.some((item) => item.code === "duplicate-rule-identity"));

// Caso 8: valores dinámicos se conservan como datos declarativos, sin evaluarlos.
const dynamicRule = resolve({
  profile: profile([{
    suerteId: "test_suerte",
    category: "adic",
    ruleId: "DYNAMIC",
    label: "Dinámica",
    valueByClassification: { excelente: 5, regular: 2, minima: 0 },
    condition: { field: "classification", operator: "in", value: ["excelente", "regular", "minima"] },
    renderMode: "compact_calculator"
  }])
});
assert.equal(dynamicRule.valid, true);
assert.deepEqual(dynamicRule.suerte.catalog.adic[0].valueByClassification, {
  excelente: 5,
  regular: 2,
  minima: 0
});

const arbitraryCode = validateRuleProfile(profile([{
  suerteId: "test_suerte",
  category: "adic",
  ruleId: "UNSAFE",
  label: "Unsafe",
  condition: () => true
}]));
assert.equal(arbitraryCode.valid, false);
assert.ok(arbitraryCode.diagnostics.some((item) => item.code === "declarative-value-forbidden"));

// Caso 9: TEAM_INFRACTION tiene canal e identidad distintos de infracción individual.
const teamInfraction = resolve({
  profile: profile([{
    suerteId: "test_suerte",
    category: "team_infraction",
    ruleId: "TEAM_1",
    label: "Equipo",
    value: 1
  }])
});
assert.equal(teamInfraction.valid, true);
assert.equal(teamInfraction.suerte.catalog.team_infr[0].category, RULE_CATEGORIES.TEAM_INFRACTION);
assert.notEqual(
  buildRuleIdentity("test_suerte", "team_infr", "TEAM_1"),
  buildRuleIdentity("test_suerte", "infr", "TEAM_1")
);

// Caso 10: DQ conserva categoría explícita y no se infiere por signo.
const disqualification = resolve({
  profile: profile([{
    suerteId: "test_suerte",
    category: "desc",
    ruleId: "DQ_1",
    label: "Descalificación"
  }])
});
assert.equal(disqualification.valid, true);
assert.equal(disqualification.suerte.catalog.desc[0].category, RULE_CATEGORIES.DISQUALIFICATION);

// Colisión de categoría no puede convertirse en regla nueva silenciosamente.
const categoryConflict = resolve({
  profile: profile([{ suerteId: "test_suerte", category: "adic", ruleId: "A", value: 2 }])
});
assert.equal(categoryConflict.valid, false);
assert.ok(categoryConflict.diagnostics.some((item) => item.code === "rule-category-conflict"));

// Selección exacta y fallback controlado.
const selected = resolveRuleProfileSelection({
  ruleProfileId: "FMCH_TEST",
  ruleProfileVersion: "1.0.0"
}, { profile: profile() });
assert.equal(selected.valid, true);
assert.equal(selected.reference.profileId, "FMCH_TEST");

const exactVersionSelection = resolveRuleProfileSelection({
  ruleProfileId: "FMCH_TEST",
  ruleProfileVersion: "1.0.0"
}, {
  registry: [
    profile([], { version: "1.0.0" }),
    profile([], { version: "1.1.0" })
  ]
});
assert.equal(exactVersionSelection.reference.profileVersion, "1.0.0");

const unavailableVersion = resolveRuleProfileSelection({
  ruleProfileId: "FMCH_TEST",
  ruleProfileVersion: "2.0.0"
}, {
  registry: [profile([], { version: "1.0.0" })]
});
assert.equal(unavailableVersion.blocked, true);

const integratedProfile = getTournamentSuertes({
  type: "pialadero",
  ruleProfileId: "FMCH_TEST",
  ruleProfileVersion: "1.0.0"
}, null, {
  profile: profile([{ suerteId: "piales", category: "base", ruleId: "pb1", value: 31 }])
});
assert.equal(integratedProfile[0].catalog.base.find((rule) => rule.id === "pb1").pts, 31);
assert.equal(integratedProfile[0].ruleResolution.profile.profileId, "FMCH_TEST");

const unknownProfile = resolveTournamentRules({
  type: "completo",
  ruleProfileId: "UNKNOWN",
  ruleProfileVersion: "1.0.0"
});
assert.equal(unknownProfile.blocked, true);
assert.equal(unknownProfile.suertes.length, 0);

const explicitFallback = resolveTournamentRules({
  type: "completo",
  ruleProfileId: "UNKNOWN",
  ruleProfileVersion: "1.0.0",
  ruleProfileFallback: "product_base"
});
assert.equal(explicitFallback.valid, true);
assert.equal(explicitFallback.suertes.length, SUERTES.length);
assert.equal(explicitFallback.profile.fallbackUsed, true);

const fmchDraftSelection = resolveRuleProfileSelection({
  ruleProfileId: FMCH_2026_LIBRE_PROFILE.profileId,
  ruleProfileVersion: FMCH_2026_LIBRE_PROFILE.version
});
assert.equal(fmchDraftSelection.blocked, true, "the FMCH profile is not selectable in production while source fields remain blocked");
assert.ok(fmchDraftSelection.diagnostics.some((item) => item.code === "profile-not-available-for-scoring"));
assert.equal(FMCH_2026_LIBRE_PROFILE.status, "draft");
assert.equal(FMCH_2026_LIBRE_PROFILE.version, "0.6.0");
assert.equal(
  FMCH_2026_LIBRE_PROFILE.suerteMetadata.cala.specializedCalculators[0].renderMode,
  "specialized_calculator"
);

const fmchCala = resolveEffectiveRules({
  suerte: SUERTES.find((item) => item.id === "cala"),
  profile: FMCH_2026_LIBRE_PROFILE
});
assert.equal(fmchCala.valid, true);
assert.equal(fmchCala.suerte.catalog.base.length, 1);
assert.equal(fmchCala.suerte.catalog.base[0].pts, 20);
assert.equal(fmchCala.suerte.catalog.adic.length, 7);
assert.equal(fmchCala.suerte.catalog.infr.length, 43);
assert.equal(fmchCala.suerte.catalog.team_infr.length, 2);
assert.equal(fmchCala.suerte.catalog.desc.length, 36);
assert.equal(fmchCala.suerte.ruleMetadata.fieldIdMappingStatus, "CERTIFIED_ALIASES_WITH_NON_SPORTING_CONTROL");
assert.ok(fmchCala.allRules.infr.some((rule) => rule.id === "cala_inf_no_correr_recto" && rule.enabled === false));
assert.ok(fmchCala.allRules.desc.some((rule) => rule.id === "cala_desc_faena_incompleta" && rule.enabled === false));

const profileMetadata = resolve({
  profile: profile([], {
    suerteMetadata: {
      test_suerte: {
        timer: { durationSeconds: 420 },
        opportunities: 3
      }
    }
  }),
  tournamentOverride: {
    ruleMetadata: { opportunities: 2 }
  }
});
assert.deepEqual(profileMetadata.suerte.ruleMetadata.timer, { durationSeconds: 420 });
assert.equal(profileMetadata.suerte.ruleMetadata.opportunities, 2);

const deterministicInput = profile([
  { suerteId: "test_suerte", category: "adic", ruleId: "Z", label: "Z", value: 1, order: 20 },
  { suerteId: "test_suerte", category: "adic", ruleId: "B", label: "B", value: 2, order: 10 }
]);
assert.deepEqual(
  resolve({ profile: deterministicInput }).suerte.catalog.adic,
  resolve({ profile: structuredClone(deterministicInput) }).suerte.catalog.adic
);
assert.deepEqual(
  resolve({ profile: deterministicInput }).suerte.catalog.adic.map((rule) => rule.ruleId),
  ["B", "Z"]
);

// Compatibilidad: sin profile se conserva catálogo, puntos y orden del baseline.
const baseline = getTournamentSuertes({ type: "completo" });
assert.equal(baseline.length, SUERTES.length);
for (const sourceSuerte of SUERTES) {
  const effective = baseline.find((item) => item.id === sourceSuerte.id);
  assert.ok(effective, `Suerte baseline ${sourceSuerte.id}`);
  for (const group of ["base", "adic", "infr", "desc"]) {
    assert.deepEqual(
      effective.catalog[group].map(({ id, label, pts }) => ({ id, label, pts })),
      (sourceSuerte.catalog[group] || []).map(({ id, label, pts }) => ({ id, label, pts }))
    );
  }
}

// La colisión legacy ttm se diagnostica sin renombrar ni bloquear el baseline.
const baselineResolution = resolveTournamentRules({ type: "completo" });
const ttmDiagnostic = baselineResolution.diagnostics.find((item) =>
  item.code === "legacy-cross-category-rule-id-collision" && item.ruleId === "ttm"
);
assert.ok(ttmDiagnostic);
assert.deepEqual(ttmDiagnostic.categories, ["adic", "infr"]);
const toro = baselineResolution.suertes.find((item) => item.id === "toro");
assert.ok(toro.catalog.adic.some((rule) => rule.id === "ttm"));
assert.ok(toro.catalog.infr.some((rule) => rule.id === "ttm"));

// Aislamiento: el override solo afecta al torneo que lo declara.
const pialesBase = SUERTES.find((item) => item.id === "piales");
const tournamentA = getTournamentSuertes({
  id: "A",
  type: "pialadero",
  ruleOverrides: {
    piales: {
      catalog: {
        base: pialesBase.catalog.base.map((rule) => rule.id === "pb1" ? { ...rule, pts: 99 } : rule)
      }
    }
  }
});
const tournamentB = getTournamentSuertes({ id: "B", type: "pialadero" });
assert.equal(tournamentA[0].catalog.base.find((rule) => rule.id === "pb1").pts, 99);
assert.equal(tournamentB[0].catalog.base.find((rule) => rule.id === "pb1").pts, 18);

// No mutación y cálculo oficial intacto.
const frozenSuerte = structuredClone(suerte());
const frozenProfile = profile([{ suerteId: "test_suerte", category: "base", ruleId: "A", value: 12 }]);
const sourceSuerteSnapshot = structuredClone(frozenSuerte);
const sourceProfileSnapshot = structuredClone(frozenProfile);
resolveEffectiveRules({ suerte: frozenSuerte, profile: frozenProfile });
assert.deepEqual(frozenSuerte, sourceSuerteSnapshot);
assert.deepEqual(frozenProfile, sourceProfileSnapshot);
assert.equal(calculateAttemptTotal({ base: 10, adic: 5, infr: 3, puntaPts: 0, desc: null }), 12);
assert.equal(calculateAttemptTotal({ base: 10, adic: 5, infr: 3, puntaPts: 0, desc: "DQ" }), -3);

const historicalScore = {
  id: "official-before-profile",
  total: 27,
  breakdown: { base: 20, adic: 10, infr: 3, rulebook: null }
};
const historicalSnapshot = structuredClone(historicalScore);
resolve({ profile: profile([{ suerteId: "test_suerte", category: "base", ruleId: "A", value: 99 }]) });
assert.deepEqual(historicalScore, historicalSnapshot);

// El score oficial conserva contexto reglamentario en el rulebook sin cambiar el total.
const appSource = await readFile(new URL("../js/app.js", import.meta.url), "utf8");
assert.match(appSource, /resolutionContractVersion:\s*resolution\.contractVersion/);
assert.match(appSource, /ruleProfileId:\s*profile\.profileId/);
assert.match(appSource, /ruleProfileVersion:\s*profile\.profileVersion/);
assert.match(appSource, /customAdic/);
assert.match(appSource, /customInfr/);
assert.match(appSource, /teamPenalties/);
assert.match(appSource, /function applyDescReason/);

console.log("Rule profile engine tests passed");

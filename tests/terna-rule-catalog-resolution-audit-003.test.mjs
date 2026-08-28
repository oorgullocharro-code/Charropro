import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  applyLocalFmch2026RuleProfileDefault,
  buildLocalFmch2026RuleProfileAssignment,
  hasExplicitRuleProfileSelection
} from "../js/core/localRuleProfileDefaults.js?v=20260827-scorer-global-timer-reactivity-recovery-001-v1";
import {
  FMCH_2026_LIBRE_PROFILE,
  resolveRuleProfileSelection
} from "../js/data/ruleProfiles.js?v=20260827-scorer-global-timer-reactivity-recovery-001-v1";
import { resolveTournamentRules, SUERTES } from "../js/data/suertes.js?v=20260827-scorer-global-timer-reactivity-recovery-001-v1";
import {
  buildFmch2026TernaOpportunityDraft,
  commitFmch2026TernaOpportunity,
  createFmch2026TernaSession,
  reserveFmch2026TernaOpportunity,
  resolveFmch2026TernaNextSuerteId
} from "../js/data/fmch2026TernaRules.js?v=20260827-scorer-global-timer-reactivity-recovery-001-v1";
import { createLocalRuntimeSeedFixture } from "../tools/development/localRuntimeSeed.mjs";

const productFingerprint = JSON.stringify(SUERTES);
const profileFingerprint = JSON.stringify(FMCH_2026_LIBRE_PROFILE);

const denverBefore = {
  id: "torneo_mssamn82_w5hmly",
  name: "Denver",
  type: "completo"
};
const beforeResolution = resolveTournamentRules(denverBefore);
const beforeLazo = beforeResolution.suertes.find((suerte) => suerte.id === "lazo");
assert.equal(beforeResolution.profile.status, "product_base");
assert.equal(beforeResolution.profile.fallbackUsed, false, "missing profile selects Product Base without explicit fallback");
assert.deepEqual(beforeLazo.ruleResolution.layers, ["PRODUCT_BASE"]);
assert.deepEqual(beforeLazo.catalog.base.map(({ id, pts }) => [id, pts]), [["lb1", 10]]);
assert.deepEqual(beforeLazo.catalog.adic.map(({ id, pts }) => [id, pts]), [
  ["la1", 12], ["la2", 14], ["la3", 16], ["la4", 1], ["la5", 2], ["la6", 1]
]);
assert.deepEqual(beforeLazo.catalog.infr.map(({ id, pts }) => [id, pts]), [["li1", 1], ["li2", 2], ["li3", 1]]);

const localTournament = applyLocalFmch2026RuleProfileDefault(denverBefore, { environment: "local", local: true });
assert.notEqual(localTournament, denverBefore);
assert.equal(denverBefore.ruleProfileId, undefined, "local default never mutates the source tournament");
assert.equal(localTournament.ruleProfileId, "FMCH_2026_LIBRE");
assert.equal(localTournament.ruleProfileVersion, "0.6.0");
assert.equal(localTournament.ruleProfile.status, "active");
assert.equal(localTournament.ruleProfile.metadata.fixtureOnly, true);
assert.equal(localTournament.ruleProfile.metadata.activationReady, false);
assert.equal(localTournament.ruleProfile.metadata.environment, "local-emulator");

const afterResolution = resolveTournamentRules(localTournament);
const afterLazo = afterResolution.suertes.find((suerte) => suerte.id === "lazo");
assert.equal(afterResolution.profile.profileId, "FMCH_2026_LIBRE");
assert.equal(afterResolution.profile.profileVersion, "0.6.0");
assert.equal(afterResolution.profile.status, "active");
assert.equal(afterResolution.profile.fallbackUsed, false);
assert.deepEqual(afterLazo.ruleResolution.layers, ["PRODUCT_BASE", "RULE_PROFILE"]);
assert.deepEqual(afterLazo.catalog.base.map(({ id, pts }) => [id, pts]), [
  ["lazo_base_sencillo", 5],
  ["lazo_base_toro_echado", 5],
  ["lazo_base_efecto", 8],
  ["lazo_base_floreado", 10]
]);
assert.equal(afterLazo.catalog.adic.length, 20);
assert.equal(afterLazo.catalog.infr.length, 19);
assert.equal(afterLazo.catalog.desc.length, 15);
assert.equal(afterLazo.catalog.adic.every((rule) => rule.source === "RULE_PROFILE"), true);

const productionTournament = applyLocalFmch2026RuleProfileDefault(denverBefore, { environment: "production", local: false });
assert.equal(productionTournament, denverBefore, "production never activates the local fixture profile");
const explicitProductBase = { ...denverBefore, ruleProfileFallback: "product_base" };
assert.equal(hasExplicitRuleProfileSelection(explicitProductBase), true);
assert.equal(applyLocalFmch2026RuleProfileDefault(explicitProductBase, { local: true }), explicitProductBase);
const incompleteReference = { ...denverBefore, ruleProfileId: "FMCH_2026_LIBRE" };
assert.equal(applyLocalFmch2026RuleProfileDefault(incompleteReference, { local: true }), incompleteReference,
  "an invalid explicit reference remains visible instead of being silently replaced");
assert.equal(resolveRuleProfileSelection(incompleteReference).blocked, true);

const invalidProfile = resolveTournamentRules({
  ...denverBefore,
  ruleProfileId: "UNKNOWN",
  ruleProfileVersion: "1.0.0"
});
assert.equal(invalidProfile.blocked, true);
const controlledFallback = resolveTournamentRules({
  ...denverBefore,
  ruleProfileId: "UNKNOWN",
  ruleProfileVersion: "1.0.0",
  ruleProfileFallback: "product_base"
});
assert.equal(controlledFallback.valid, true);
assert.equal(controlledFallback.profile.fallbackUsed, true);

const assignmentA = buildLocalFmch2026RuleProfileAssignment();
const assignmentB = buildLocalFmch2026RuleProfileAssignment();
assignmentA.ruleProfile.metadata.environment = "changed-by-test";
assert.equal(assignmentB.ruleProfile.metadata.environment, "local-emulator", "local assignments do not share mutable profile references");
assert.equal(FMCH_2026_LIBRE_PROFILE.status, "draft", "the canonical production profile remains blocked");
assert.equal(FMCH_2026_LIBRE_PROFILE.metadata.activationReady, false);
assert.equal(JSON.stringify(SUERTES), productFingerprint, "Product Base catalogs remain unchanged");
assert.equal(JSON.stringify(FMCH_2026_LIBRE_PROFILE), profileFingerprint, "FMCH sporting values remain unchanged");

const seed = createLocalRuntimeSeedFixture();
const seededTournament = seed.database["charropro/tournaments"][seed.tournamentId].info;
assert.equal(seededTournament.ruleProfileId, "FMCH_2026_LIBRE");
assert.equal(seededTournament.ruleProfileVersion, "0.6.0");
assert.equal(seededTournament.ruleProfile.status, "active");

const appSource = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
assert.match(appSource, /const tournament = applyProductiveRuleProfilePolicy\(applyLocalFmch2026RuleProfileDefault\(\{/,
  "new tournaments preserve the local fixture default before applying productive policy");
assert.match(appSource, /state\.tournaments\.push\(tournament\)/,
  "the policy-resolved tournament is the record inserted into local state");
assert.match(appSource, /if \(!liveConfigured\) \{[\s\S]*?return;[\s\S]*?assignRuleProfileToTournament\(tournament, \{[\s\S]*?source: "productive-default"/,
  "productive creation routes the canonical default through the shared assignment boundary only when Firebase live is configured");
assert.match(appSource, /async function assignRuleProfileToTournament\([\s\S]*?assignFirebaseTournamentRuleProfile\(\{/,
  "the shared assignment boundary delegates to the trusted server authority");
assert.match(appSource, /if \(!existing\) ensureLocalRuleProfileForNewCharreada\(\)/,
  "a new charreada repairs a profileless local parent before scoring resolution");
assert.match(appSource, /Object\.assign\(tournament, \{[\s\S]*?ruleProfileId:[\s\S]*?ruleProfileVersion:[\s\S]*?ruleProfile:/);

let session = createFmch2026TernaSession({
  tournamentId: "denver-local",
  competitionId: "equipos_completo",
  charreadaId: "charreada-new",
  teamId: "team-2"
});
const sharedTimerId = session.sharedTimerId;
session = consume(session, "HEAD", true);
assert.equal(resolveFmch2026TernaNextSuerteId(session), "pial_ruedo");
session = consume(session, "PIAL", true);
assert.equal(session.status, "COMPLETED");
assert.equal(session.currentOpportunity, null);
assert.equal(session.history.length, 2);
assert.equal(session.opportunities.filter((item) => item.status === "CLOSED_UNUSED").length, 3);
assert.equal(session.sharedTimerId, sharedTimerId);
assert.equal(buildFmch2026TernaOpportunityDraft(session, { type: "PIAL" }).ok, false, "O3 is not reserved after completion");

process.stdout.write("terna rule catalog resolution audit 003 tests passed\n");

function consume(session, type, countsForTerna) {
  const draft = buildFmch2026TernaOpportunityDraft(session, {
    type,
    participantId: `${type.toLowerCase()}-participant`,
    result: countsForTerna ? "VALID" : "ZERO",
    countsForTerna
  });
  assert.equal(draft.ok, true);
  const reserved = reserveFmch2026TernaOpportunity(session, draft.opportunity);
  assert.equal(reserved.ok, true);
  const committed = commitFmch2026TernaOpportunity(reserved.session, draft.opportunity, {
    scoreId: `score-${draft.opportunity.sharedSequenceNumber}`,
    publishedScoreId: `published-${draft.opportunity.sharedSequenceNumber}`
  });
  assert.equal(committed.ok, true);
  return committed.session;
}

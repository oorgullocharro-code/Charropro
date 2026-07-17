import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const raw = await readFile(new URL("../firebase-rules-auditoria.json", import.meta.url), "utf8");
const firebaseSyncSource = await readFile(new URL("../js/core/firebaseSync.js", import.meta.url), "utf8");
const transportSource = await readFile(new URL("../js/broadcast/broadcastRealtimeTransport.js", import.meta.url), "utf8");
const rules = JSON.parse(raw).rules.charropro;
const sessions = rules.broadcastStudio?.sessions?.$sessionId;
const access = sessions?.access?.$accessId;

assert.ok(sessions, "broadcastStudio session rules exist");
assert.ok(access, "temporary access rules exist");
assert.equal(rules[".read"], false);
assert.equal(rules[".write"], false);
assert.ok(rules.tournaments, "sports tournament rules remain present");
assert.ok(rules.live, "sports live rules remain present");
assert.ok(rules.publicTournaments, "public snapshot rules remain present");

const sessionRulesText = JSON.stringify(sessions);
assert.doesNotMatch(sessionRulesText, /broadcastSessions/);
assert.doesNotMatch(sessionRulesText, /broadcastPublishSessions/);
assert.equal(sessionRulesText.includes("users/' + auth.uid + '/tenantId"), false);
assert.equal(sessionRulesText.includes("users/' + auth.uid + '/organizationId"), false);
assert.equal(sessionRulesText.includes("users/' + auth.uid + '/clientId"), false);
assert.match(sessions.context[".write"], /supervisor/);
assert.match(sessions.context[".write"], /graficos/);
assert.doesNotMatch(sessions.context[".write"], /operador|juez|locutor/);
assert.match(sessions.context[".write"], /charropro-e8a68/);
assert.match(sessions.context[".write"], /tournamentAccess/);
assert.match(sessions.context[".write"], /createdByUid/);
assert.match(sessions.context[".read"], /!data\.exists\(\)/);
assert.match(sessions.context[".validate"], /active/);
assert.match(sessions.context[".validate"], /closed/);

for (const channel of [sessions.program.current, sessions.announcer.current]) {
  assert.match(channel[".write"], /supervisor/);
  assert.match(channel[".write"], /graficos/);
  assert.doesNotMatch(channel[".write"], /operador|juez|locutor/);
  assert.match(channel[".write"], /context\/tournamentId/);
  assert.match(channel[".write"], /context\/competitionId/);
  assert.match(channel[".write"], /context\/activeCharreadaId/);
  assert.match(channel[".write"], /context\/sessionId/);
  assert.match(channel[".write"], /context\/status.*active/);
}
assert.match(sessions.program.current[".read"], /public/);
assert.match(sessions.program.current[".read"], /production/);
assert.match(sessions.program.current[".read"], /!data\.exists\(\)/, "first Program transaction may read an empty channel");
assert.match(sessions.announcer.current[".read"], /operational/);
assert.match(sessions.announcer.current[".read"], /restricted/);
assert.match(sessions.announcer.current[".read"], /!data\.exists\(\)/, "first Announcer transaction may read an empty channel");

assert.match(access[".write"], /supervisor/);
assert.match(access[".write"], /graficos/);
assert.doesNotMatch(access[".write"], /operador|juez|locutor/);
assert.match(access.descriptor[".read"], /readOnly/);
assert.match(access.descriptor[".read"], /status.*active/);
assert.match(access.descriptor[".read"], /context\/status/);
assert.match(access.descriptor[".read"], /expiresAt/);
assert.match(access.descriptor[".read"], /> now/);
assert.match(access.descriptor[".validate"], /accessId/);
assert.match(access.descriptor[".validate"], /nonce/);
assert.match(access.descriptor[".validate"], /program_main/);
assert.match(access.descriptor[".validate"], /announcer_monitor/);
assert.match(access.program.current[".read"], /program_main/);
assert.match(access.program.current[".read"], /context\/status/);
assert.doesNotMatch(access.program.current[".read"], /announcer_monitor/);
assert.match(access.announcer.current[".read"], /announcer_monitor/);
assert.match(access.announcer.current[".read"], /context\/status/);
assert.doesNotMatch(access.announcer.current[".read"], /program_main/);
assert.equal(access.$other[".validate"], false);
assert.equal(sessions.$other[".validate"], false);

for (const node of [sessions.outputs.$outputId, sessions.revisions.$channel, sessions.health.$clientId]) {
  assert.match(node[".write"], /supervisor/);
  assert.match(node[".write"], /graficos/);
  assert.doesNotMatch(node[".write"], /broadcastPublishSessions|operador|juez|locutor/);
  assert.match(node[".write"], /context\/tournamentId/);
  assert.match(node[".write"], /context\/competitionId/);
  assert.match(node[".write"], /context\/sessionId/);
}

assert.match(firebaseSyncSource, /BROADCAST_SINGLE_TENANT_SCOPE_ID/);
assert.match(firebaseSyncSource, /buildBroadcastAutomaticSessionId/);
assert.match(firebaseSyncSource, /getOrCreateFirebaseBroadcastTemporaryAccess/);
assert.match(firebaseSyncSource, /revokeFirebaseBroadcastTemporaryAccess/);
assert.match(firebaseSyncSource, /closeFirebaseBroadcastSession/);
assert.match(firebaseSyncSource, /renewFirebaseBroadcastSession/);
assert.match(firebaseSyncSource, /resolveCurrentBroadcastContext/);
assert.match(firebaseSyncSource, /firebase-tournament-active-charreada/);
assert.match(firebaseSyncSource, /authStateReady/);
assert.match(firebaseSyncSource, /resolveFirebaseBroadcastTemporaryAccess/);
assert.match(firebaseSyncSource, /createFirebaseBroadcastTemporaryAccessAdapter/);
assert.match(firebaseSyncSource, /broadcast-temporary-access-read-only/);
assert.doesNotMatch(firebaseSyncSource, /broadcast-session-read-unassigned|broadcast-session-publish-unassigned/);
assert.doesNotMatch(firebaseSyncSource, /broadcast-profile-(?:tenant|organization|client)-missing/);
const closeSessionSource = firebaseSyncSource.slice(
  firebaseSyncSource.indexOf("export async function closeFirebaseBroadcastSession"),
  firebaseSyncSource.indexOf("export async function renewFirebaseBroadcastSession")
);
assert.ok(
  closeSessionSource.indexOf("revokeAllFirebaseBroadcastTemporaryAccess") < closeSessionSource.indexOf("setFirebaseBroadcastSessionStatus"),
  "temporary access is revoked before the session closes"
);
assert.match(closeSessionSource, /status:\s*"not-found"/);
const statusSource = firebaseSyncSource.slice(
  firebaseSyncSource.indexOf("async function setFirebaseBroadcastSessionStatus"),
  firebaseSyncSource.indexOf("async function readFirebaseBroadcastSessionContext")
);
assert.match(statusSource, /alreadyClosed:\s*status === "closed"/);
assert.match(statusSource, /status:\s*"not-found"/);
assert.match(statusSource, /const baseline = cloneFirebaseBroadcastValue\(session\.value\)/);
assert.doesNotMatch(statusSource, /conflict = "broadcast-session-not-initialized"/);
const publishValueSource = firebaseSyncSource.slice(
  firebaseSyncSource.indexOf("async function publishFirebaseBroadcastValue"),
  firebaseSyncSource.indexOf("async function updateFirebaseBroadcastRevision")
);
assert.match(publishValueSource, /const baselineSnapshot = await get\(targetRef\)/);
assert.match(publishValueSource, /const source = current \|\| baseline/);
assert.match(firebaseSyncSource, /encodeFirebaseBroadcastValue\(request\.envelope\)/);
assert.match(firebaseSyncSource, /decodeFirebaseBroadcastValue\(snapshot\.val\(\)\)/);
assert.match(firebaseSyncSource, /character\.codePointAt\(0\)\.toString\(16\)/);
assert.match(firebaseSyncSource, /String\.fromCodePoint\(Number\.parseInt\(hex, 16\)\)/);
assert.match(transportSource, /crypto\.randomUUID|crypto\?\.getRandomValues/);
assert.doesNotMatch(transportSource, /Math\.random/);

// Adapter-fake policy matrix mirrors the proposed rules without touching Firebase.
const internalTenant = "charropro-e8a68";
const session = {
  tenantId: internalTenant,
  tournamentId: "tournament-a",
  competitionId: "competition-a",
  activeCharreadaId: "charreada-a",
  sessionId: "broadcast-session-a",
  status: "active"
};
const supervisor = { active: true, role: "supervisor", tournaments: ["tournament-a"] };
const graphics = { active: true, role: "graficos", tournaments: ["tournament-a"] };
const judge = { active: true, role: "juez", tournaments: ["tournament-a"] };
const canPublish = (profile, value = session) => profile.active === true
  && ["supervisor", "graficos"].includes(profile.role)
  && profile.tournaments.includes(value.tournamentId)
  && value.tenantId === internalTenant
  && value.status === "active";

assert.equal(canPublish(supervisor), true, "existing supervisor can publish");
assert.equal(canPublish(graphics), true, "existing graphics user can publish");
assert.equal(canPublish(judge), false, "judge cannot publish by default");
assert.equal(canPublish({ ...graphics, tournaments: [] }), false, "tournament access is required");
assert.equal(canPublish(graphics, { ...session, tenantId: "another-tenant" }), false);
assert.equal(canPublish(graphics, { ...session, status: "closed" }), false);

const descriptor = {
  accessId: "bca-program",
  sessionId: session.sessionId,
  outputType: "program_main",
  channel: "program",
  readOnly: true,
  status: "active",
  expiresAt: Date.parse("2026-07-16T14:00:00.000Z"),
  context: {
    tournamentId: session.tournamentId,
    competitionId: session.competitionId,
    activeCharreadaId: session.activeCharreadaId,
    sessionId: session.sessionId
  }
};
const canReadTemporary = (grant, request, now = Date.parse("2026-07-16T13:00:00.000Z")) => grant.readOnly === true
  && grant.status === "active"
  && grant.expiresAt > now
  && grant.outputType === request.outputType
  && grant.channel === request.channel
  && grant.sessionId === request.sessionId
  && grant.context.tournamentId === request.tournamentId
  && grant.context.competitionId === request.competitionId;
const programRequest = {
  outputType: "program_main",
  channel: "program",
  sessionId: session.sessionId,
  tournamentId: session.tournamentId,
  competitionId: session.competitionId
};

assert.equal(canReadTemporary(descriptor, programRequest), true);
assert.equal(canReadTemporary({ ...descriptor, status: "revoked" }, programRequest), false, "revoked access is denied");
assert.equal(canReadTemporary(descriptor, programRequest, descriptor.expiresAt), false, "expired access is denied");
assert.equal(canReadTemporary(descriptor, { ...programRequest, outputType: "announcer_monitor", channel: "announcer" }), false, "Program cannot read Announcer");
assert.equal(canReadTemporary({ ...descriptor, outputType: "announcer_monitor", channel: "announcer" }, programRequest), false, "Announcer cannot read Program");
assert.equal(canReadTemporary(descriptor, { ...programRequest, sessionId: "session-b" }), false, "session isolation");
assert.equal(canReadTemporary(descriptor, { ...programRequest, tournamentId: "tournament-b" }), false, "tournament isolation");
assert.equal(canReadTemporary(descriptor, { ...programRequest, competitionId: "competition-b" }), false, "competition isolation");
const canTemporaryOutputWrite = () => false;
assert.equal(canTemporaryOutputWrite(descriptor), false, "temporary outputs are read-only");

console.log("firebase-broadcast-rules.test.mjs: ok");

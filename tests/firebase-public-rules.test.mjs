import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const raw = await readFile(new URL("../firebase-rules-auditoria.json", import.meta.url), "utf8");
const rules = JSON.parse(raw).rules.charropro;
const publicRules = rules.publicTournaments?.$tournamentId;
const liveRules = rules.live?.$tournamentId;

assert.equal(rules[".read"], false, "private root remains closed");
assert.notEqual(rules.tournaments?.$tournamentId?.[".read"], true, "private tournament data is not public");
assert.equal(
  rules.tournaments?.$tournamentId?.publishedScores?.[".read"],
  undefined,
  "private published scores do not gain a public read rule"
);
assert.ok(publicRules);
assert.equal(publicRules[".read"], true, "public projection remains readable");
assert.match(publicRules[".write"], /auth != null/);
assert.match(publicRules[".write"], /supervisor/);
assert.match(publicRules[".write"], /operador/);
assert.match(publicRules[".write"], /juez/);
assert.match(publicRules[".write"], /schemaVersion/);
assert.match(publicRules[".write"], /projectionRevision/);
assert.match(publicRules[".write"], /> data\.child\('projectionRevision'\)/);
assert.match(publicRules[".write"], /liveFeed\/revision/);
assert.match(publicRules[".write"], />= data\.child\('liveFeed\/revision'\)/);
assert.match(publicRules[".write"], /tournamentAccess/);
assert.match(publicRules[".validate"], /metadata/);
assert.match(publicRules[".validate"], /overview/);
assert.match(publicRules[".validate"], /program/);
assert.match(publicRules[".validate"], /live/);
assert.match(publicRules[".validate"], /liveFeed/);
assert.match(publicRules[".validate"], /competitions/);
assert.match(publicRules[".validate"], /results/);
assert.match(publicRules[".validate"], /rankings/);
assert.match(publicRules[".validate"], /statistics/);
assert.match(publicRules[".validate"], /search/);
assert.equal(publicRules.$other[".validate"], false, "unknown top-level fields are rejected");
assert.equal(publicRules.metadata.$other[".validate"].includes("ownerEmail"), false);
assert.equal(publicRules.live.$other[".validate"].includes("notes"), false);
assert.equal(publicRules.live.$other[".validate"].includes("pendingNote"), false);
assert.equal(publicRules.live.$other[".validate"].includes("broadcastState"), false);
assert.equal(publicRules.program.items.$itemId.$other[".validate"].includes("notes"), false);
assert.equal(publicRules.program.items.$itemId.$other[".validate"].includes("publicNotes"), true);
assert.equal(publicRules.program.items.$itemId.$other[".validate"].includes("venueName"), true);
assert.equal(publicRules.program.items.$itemId.$other[".validate"].includes("liveAvailable"), true);
assert.equal(publicRules.program.items.$itemId.$other[".validate"].includes("internalNotes"), false);
assert.equal(publicRules.program.items.$itemId.participants.$participantId.$other[".validate"].includes("phone"), false);
assert.equal(publicRules.program.items.$itemId.participants.$participantId.$other[".validate"].includes("email"), false);
assert.equal(publicRules.competitions.items.$itemId.$other[".validate"].includes("ownerEmail"), false);
assert.equal(publicRules.results.items.$itemId.$other[".validate"].includes("judge"), false);
assert.equal(publicRules.results.scopes.$scopeId.$other[".validate"].includes("private"), false);
assert.equal(publicRules.live.turn.$other[".validate"].includes("pendingNote"), false);
assert.equal(publicRules.live.currentResult.$other[".validate"].includes("notes"), false);
assert.equal(publicRules.live.standings.$itemId.$other[".validate"].includes("operatorId"), false);
assert.match(publicRules.liveFeed.items.$eventId[".validate"], /score_published/);
assert.match(publicRules.liveFeed.items.$eventId[".validate"], /sequence/);
assert.match(publicRules.liveFeed.items.$eventId[".validate"], /revision/);
assert.equal(publicRules.liveFeed.items.$eventId.$other[".validate"].includes("judge"), false);
assert.equal(publicRules.liveFeed.items.$eventId.$other[".validate"].includes("html"), false);

assert.equal(liveRules[".read"], true, "operational live read remains unchanged from deployed rules");

// Static policy mirror. Automated tests do not use the production RTDB.
const canReadProjection = () => true;
const canWriteProjection = (profile, currentRevision, next) => Boolean(
  profile?.authenticated &&
  profile?.active &&
  ["supervisor", "operador", "juez"].includes(profile.role) &&
  profile.tournaments.includes(next.metadata.tournamentId) &&
  next.schemaVersion === 2 &&
  Number.isSafeInteger(next.projectionRevision) &&
  next.projectionRevision > currentRevision &&
  Number.isSafeInteger(next.liveFeed.revision) &&
  next.liveFeed.revision >= profile.currentLiveFeedRevision
);
const validProjection = {
  schemaVersion: 2,
  projectionRevision: 2,
  metadata: { tournamentId: "tournament-a" },
  liveFeed: { revision: 2 }
};
const supervisor = {
  authenticated: true,
  active: true,
  role: "supervisor",
  tournaments: ["tournament-a"],
  currentLiveFeedRevision: 1
};
assert.equal(canReadProjection(null), true);
assert.equal(canWriteProjection(null, 1, validProjection), false, "public browser cannot write");
assert.equal(canWriteProjection(supervisor, 1, validProjection), true);
assert.equal(canWriteProjection({ ...supervisor, role: "locutor" }, 1, validProjection), false);
assert.equal(canWriteProjection(supervisor, 2, validProjection), false, "equal revision is rejected");
assert.equal(canWriteProjection(supervisor, 3, validProjection), false, "regressive revision is rejected");
assert.equal(canWriteProjection(supervisor, 1, { ...validProjection, schemaVersion: 3 }), false);
assert.equal(
  canWriteProjection(supervisor, 1, { ...validProjection, liveFeed: { revision: 0 } }),
  false,
  "regressive live feed revision is rejected"
);

console.log("firebase-public-rules.test.mjs: ok");

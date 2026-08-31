import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { makeAccessSession } from "../js/core/roles.js?v=20260831-firebase-functions-node22-runtime-migration-001-v1";

const user = Object.freeze({ uid: "user-1", email: "user@example.test", displayName: "User" });

assert.equal(makeAccessSession(null).platformAdmin, false);
assert.equal(makeAccessSession(user, { role: "supervisor", active: true, platformAdmin: true }).platformAdmin, true);
assert.equal(makeAccessSession(user, { role: "supervisor", active: true, platformAdmin: false }).platformAdmin, false);
assert.equal(makeAccessSession(user, { role: "supervisor", active: true }).platformAdmin, false);
assert.equal(
  makeAccessSession(user, { role: "supervisor", active: true, platformAdmin: "true" }).platformAdmin,
  false,
  "truthy client data cannot elevate authority"
);
assert.equal(
  makeAccessSession(user, { role: "juez", active: true, platformAdmin: true }).platformAdmin,
  true,
  "the session preserves explicit canonical metadata without inferring authority from role"
);

const firebaseSource = await readFile(new URL("../js/core/firebaseSync.js", import.meta.url), "utf8");
assert.match(firebaseSource, /export async function getFirebaseRuleProfileLifecycle/);
assert.match(firebaseSource, /httpsCallable\(getFirebaseFunctions\(\), "getCharroProRuleProfileLifecycle"\)/);
assert.match(firebaseSource, /export async function transitionFirebaseRuleProfileLifecycle/);
assert.match(firebaseSource, /httpsCallable\(getFirebaseFunctions\(\), "transitionCharroProRuleProfileLifecycle"\)/);
assert.match(firebaseSource, /export async function assignFirebaseTournamentRuleProfile/);
assert.match(firebaseSource, /httpsCallable\(getFirebaseFunctions\(\), "assignCharroProTournamentRuleProfile"\)/);
assert.doesNotMatch(firebaseSource, /ref\([^\n]*ruleProfileLifecycle/);

console.log("access-session-platform-admin.test.mjs: ok");

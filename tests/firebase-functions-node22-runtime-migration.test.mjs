import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const functionsPackage = JSON.parse(readFileSync(new URL("../functions/package.json", import.meta.url), "utf8"));
const functionsLock = JSON.parse(readFileSync(new URL("../functions/package-lock.json", import.meta.url), "utf8"));
const firebaseConfig = JSON.parse(readFileSync(new URL("../firebase.json", import.meta.url), "utf8"));
const functionsSource = readFileSync(new URL("../functions/index.js", import.meta.url), "utf8");

assert.equal(functionsPackage.engines?.node, "22");
assert.equal(functionsLock.packages?.[""]?.engines?.node, "22");

const functionsConfigs = Array.isArray(firebaseConfig.functions)
  ? firebaseConfig.functions
  : [firebaseConfig.functions];
assert.equal(functionsConfigs.some((entry) => entry?.runtime), false);

const expectedExports = [
  "upsertCharroProUser",
  "publishCharroProOfficialScore",
  "deliverCharroProOfficialScoreFanout",
  "requestCharroProBackup",
  "cancelCharroProBackup",
  "executeCharroProBackup",
  "scheduleCharroProBackups",
  "validateCharroProRestore",
  "requestCharroProRestore",
  "cancelCharroProRestore",
  "executeCharroProRestore",
  "getCharroProConfiguration",
  "publishCharroProConfiguration",
  "transitionCharroProRuleProfileLifecycle",
  "getCharroProRuleProfileLifecycle",
  "assignCharroProTournamentRuleProfile",
  "deleteCharroProTournament"
];

const actualExports = [...functionsSource.matchAll(/^exports\.([A-Za-z0-9_]+)\s*=/gm)]
  .map((match) => match[1]);
assert.deepEqual(actualExports, expectedExports);
assert.equal(functionsSource.includes("firebase-functions/v1"), false);

process.stdout.write("firebase functions Node 22 runtime migration tests passed\n");

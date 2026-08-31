import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [syncSource, appSource, functionSource] = await Promise.all([
  readFile(new URL("../js/core/firebaseSync.js", import.meta.url), "utf8"),
  readFile(new URL("../js/app.js", import.meta.url), "utf8"),
  readFile(new URL("../functions/index.js", import.meta.url), "utf8")
]);

const adapter = syncSource.slice(syncSource.indexOf("export async function deleteFirebaseTournament"), syncSource.indexOf("export async function publishFirebaseTurn"));
assert.match(adapter, /httpsCallable\(getFirebaseFunctions\(\), "deleteCharroProTournament"\)/);
assert.match(adapter, /buildTournamentDeletionCallablePayload\(cleanTournamentId, actor\)/);
assert.match(adapter, /backupDiagnostic/);
assert.doesNotMatch(adapter, /expectedRevision: Number\(actor\.expectedRevision\)/);
assert.doesNotMatch(adapter, /update\(ref\(getFirebaseDatabase\(\), "charropro"\)/, "client must not delete RTDB paths directly");

const deletionUi = appSource.slice(appSource.indexOf("async function confirmDeleteTournament"), appSource.indexOf("async function freezeTournament"));
assert.match(deletionUi, /operation: "preflight"/);
assert.match(deletionUi, /data-revision=/);
assert.match(deletionUi, /idempotencyKey: `tournament-delete:/);
assert.match(deletionUi, /Torneo eliminado correctamente/);
assert.match(deletionUi, /Torneo de prueba — eliminacion definitiva permitida/);
assert.match(appSource, /tournament-delete-backup-create-failed/);
assert.match(appSource, /tournament-delete-backup-validation-failed/);
assert.match(appSource, /Codigo de diagnostico/);
assert.match(deletionUi, /solo archivarse|Congelar\/Archivar/);
assert.doesNotMatch(deletionUi, /Despliega las reglas nuevas/);

assert.match(functionSource, /exports\.deleteCharroProTournament = onCall/);
assert.match(functionSource, /backupRuntime\.executeBackup/);
assert.match(functionSource, /buildTournamentDeletionPlan/);
assert.match(functionSource, /tournament-delete-stale-revision/);
assert.match(functionSource, /readGlobalReleaseAuthority/);
assert.match(functionSource, /bucketName: FIREBASE_CLIENT_CONFIG\.storageBucket/);
assert.match(functionSource, /failureStage: job\.failureStage/);
console.log("tournament delete client adapter tests passed");

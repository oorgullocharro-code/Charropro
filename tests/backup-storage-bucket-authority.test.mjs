import assert from "node:assert/strict";
import backupService from "../functions/backupService.js?v=20260830-precommercial-tournament-test-mode-deletion-001-v1";

const bucketNames = [];
const files = new Map();
const admin = {
  database() {
    return {};
  },
  storage() {
    return {
      bucket(name) {
        bucketNames.push(name);
        return {
          name,
          file(path) {
            return {
              async save(buffer) { files.set(path, Buffer.from(buffer)); },
              async getMetadata() {
                return [{ generation: "1", size: String(files.get(path)?.length || 0), metadata: { archiveChecksum: "checksum" } }];
              },
              async download() { return [files.get(path)]; },
              async delete() { files.delete(path); }
            };
          }
        };
      }
    };
  }
};

const bucketName = "charropro-e8a68.firebasestorage.app";
const adapter = backupService.createFirebaseBackupAdapter(admin, { bucketName });
const saved = await adapter.saveArchive("legacy/test.json", "{\"legacy\":true}", { archiveChecksum: "checksum" });
assert.equal(saved.storageRef, `gs://${bucketName}/legacy/test.json`);
assert.equal(await adapter.readArchive("legacy/test.json"), "{\"legacy\":true}");
assert.deepEqual(bucketNames, [bucketName, bucketName]);
const restored = await adapter.readArchive("legacy/test.json");
assert.doesNotThrow(() => JSON.parse(restored));
assert.equal(bucketNames.at(-1), bucketName);

console.log("backup storage bucket authority tests passed");

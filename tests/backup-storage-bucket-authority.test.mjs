import assert from "node:assert/strict";
import backupService from "../functions/backupService.js?v=20260831-firebase-functions-node22-runtime-migration-001-v1";

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

const missingBucketAdapter = backupService.createFirebaseBackupAdapter(storageFailureAdmin({
  save: Object.assign(new Error("bucket missing"), { code: 404 })
}), { bucketName });
await assert.rejects(
  () => missingBucketAdapter.saveArchive("diagnostics/write.json", "{}"),
  (error) => error.code === "backup-storage-bucket-not-found"
    && error.details.backupStage === "OBJECT_WRITE"
    && error.details.storageCode === "404"
    && error.details.bucket === bucketName
    && error.details.objectPath === "diagnostics/write.json"
);

const metadataFailureAdapter = backupService.createFirebaseBackupAdapter(storageFailureAdmin({
  metadata: Object.assign(new Error("metadata unavailable"), { code: 503 })
}), { bucketName });
await assert.rejects(
  () => metadataFailureAdapter.saveArchive("diagnostics/metadata.json", "{}"),
  (error) => error.code === "backup-storage-object-metadata-failed"
    && error.details.backupStage === "OBJECT_METADATA"
    && error.details.storageCode === "503"
);

const readFailureAdapter = backupService.createFirebaseBackupAdapter(storageFailureAdmin({
  download: Object.assign(new Error("object missing"), { code: 404 })
}), { bucketName });
await assert.rejects(
  () => readFailureAdapter.readArchive("diagnostics/read.json"),
  (error) => error.code === "backup-storage-object-not-found"
    && error.details.backupStage === "OBJECT_READ"
    && error.details.objectPath === "diagnostics/read.json"
);

console.log("backup storage bucket authority tests passed");

function storageFailureAdmin(failures = {}) {
  return {
    database() { return {}; },
    storage() {
      return {
        bucket(name) {
          return {
            name,
            file() {
              return {
                async save() { if (failures.save) throw failures.save; },
                async getMetadata() {
                  if (failures.metadata) throw failures.metadata;
                  return [{ generation: "1", size: "2", metadata: {} }];
                },
                async download() {
                  if (failures.download) throw failures.download;
                  return [Buffer.from("{}")];
                },
                async delete() {}
              };
            }
          };
        }
      };
    }
  };
}

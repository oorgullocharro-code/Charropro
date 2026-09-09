import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const scripts = new URL("../scripts/hostinger/", import.meta.url);
const temp = mkdtempSync(join(tmpdir(), "charropro-hostinger-test-"));
const build = "TEST_BUILD_1";
const checksum = "a".repeat(64);

for (const name of ["verify-package.sh", "deploy-client.sh", "rollback-client.sh", "smoke-client.sh", "lib.sh"]) {
  const source = readFileSync(new URL(name, scripts), "utf8");
  assert.match(source, /set -euo pipefail/);
  if (name === "deploy-client.sh") assert.doesNotMatch(source, /< <\(/, "remote deploy does not depend on /dev/fd process substitution");
}

const validPackage = makePackage("valid", {
  "index.html": '<script type="module" src="./js/core/clientBootstrap.js" data-charropro-entry="./js/app.js"></script>',
  "functions/configuration.defaults.json": JSON.stringify({ values: { system: { appVersion: build } }, checksum }),
  "assets/asset.txt": "asset",
  "js/app.js": "export const ok = true;"
}, { explicitDirectories: true });
const validSha = sha(validPackage);
const validVerification = run("verify-package.sh", ["--package", validPackage, "--expected-build", build, "--expected-sha256", validSha, "--expected-checksum", checksum]);
assert.equal(validVerification.status, 0, validVerification.stderr);
assert.match(validVerification.stdout, /ZIP_TOTAL_ENTRIES=7/);
assert.match(validVerification.stdout, /ZIP_FILE_COUNT=4/);
assert.match(validVerification.stdout, /ZIP_DIRECTORY_COUNT=3/);
assert.match(validVerification.stdout, /ZIP_FILE_INVENTORY_SHA256=[a-f0-9]{64}/);
assert.match(validVerification.stdout, /PACKAGE_FILES=4/);
assert.equal(run("verify-package.sh", ["--package", validPackage, "--expected-build", build, "--expected-sha256", validSha, "--expected-checksum", checksum]).stdout, validVerification.stdout, "repeated verification is deterministic");
assert.notEqual(run("verify-package.sh", ["--package", validPackage, "--expected-build", build, "--expected-sha256", "b".repeat(64)]).status, 0, "SHA mismatch is rejected");
assert.notEqual(run("verify-package.sh", ["--package", validPackage, "--expected-build", "OTHER_BUILD", "--expected-sha256", validSha]).status, 0, "build mismatch is rejected");

const missingIndex = makePackage("missing-index", {
  "functions/configuration.defaults.json": JSON.stringify({ values: { system: { appVersion: build } }, checksum }),
  "assets/asset.txt": "asset",
  "js/app.js": "export {};"
});
assert.notEqual(run("verify-package.sh", ["--package", missingIndex, "--expected-build", build, "--expected-sha256", sha(missingIndex)]).status, 0, "missing index is rejected");

const forbidden = makePackage("forbidden", {
  "index.html": "index",
  "functions/configuration.defaults.json": JSON.stringify({ values: { system: { appVersion: build } }, checksum }),
  "assets/asset.txt": "asset",
  "js/app.js": "export {};",
  "tests/secret.test.js": "forbidden"
});
assert.notEqual(run("verify-package.sh", ["--package", forbidden, "--expected-build", build, "--expected-sha256", sha(forbidden)]).status, 0, "forbidden content is rejected");

const traversal = makePackage("traversal", {
  "index.html": "index",
  "functions/configuration.defaults.json": JSON.stringify({ values: { system: { appVersion: build } }, checksum }),
  "assets/asset.txt": "asset",
  "js/app.js": "export {};",
  "notes/rename-me.txt": "unsafe"
});
execFileSync("python3", ["-c", "import sys, zipfile\nwith zipfile.ZipFile(sys.argv[1], 'a', zipfile.ZIP_DEFLATED) as archive:\n    archive.writestr('../escape.txt', 'unsafe')", traversal]);
const traversalVerification = run("verify-package.sh", ["--package", traversal, "--expected-build", build, "--expected-sha256", sha(traversal)]);
assert.notEqual(traversalVerification.status, 0, "path traversal is rejected");
assert.match(traversalVerification.stderr, /package-path-traversal-forbidden/);

const duplicate = makePackage("duplicate", {
  "index.html": "index",
  "functions/configuration.defaults.json": JSON.stringify({ values: { system: { appVersion: build } }, checksum }),
  "assets/asset.txt": "asset",
  "js/app.js": "export {};"
});
execFileSync("python3", ["-c", "import sys, zipfile\nwith zipfile.ZipFile(sys.argv[1], 'a', zipfile.ZIP_DEFLATED) as archive:\n    archive.writestr('js/app.js', 'duplicate')", duplicate]);
const duplicateVerification = run("verify-package.sh", ["--package", duplicate, "--expected-build", build, "--expected-sha256", sha(duplicate)]);
assert.notEqual(duplicateVerification.status, 0, "duplicate file path is rejected");
assert.match(duplicateVerification.stderr, /package-duplicate-file-path/);

const extracted = join(temp, "extracted");
mkdirSync(extracted, { recursive: true });
execFileSync("unzip", ["-q", validPackage, "-d", extracted]);
const extractedVerification = run("verify-package.sh", ["--package", validPackage, "--expected-build", build, "--expected-sha256", validSha, "--expected-checksum", checksum, "--extracted-dir", extracted]);
assert.equal(extractedVerification.status, 0, extractedVerification.stderr);
assert.match(extractedVerification.stdout, /EXTRACTED_FILE_COUNT=4/);
assert.match(extractedVerification.stdout, /ZIP_FILE_INVENTORY=PASS/);

rmSync(join(extracted, "js", "app.js"));
assert.notEqual(run("verify-package.sh", ["--package", validPackage, "--expected-build", build, "--expected-sha256", validSha, "--extracted-dir", extracted]).status, 0, "missing extracted file is rejected");
writeFileSync(join(extracted, "js", "replacement.js"), "export const replacement = true;");
assert.notEqual(run("verify-package.sh", ["--package", validPackage, "--expected-build", build, "--expected-sha256", validSha, "--extracted-dir", extracted]).status, 0, "same count with a different path is rejected");
writeFileSync(join(extracted, "js", "app.js"), "export const ok = true;");
writeFileSync(join(extracted, "extra.js"), "export const extra = true;");
assert.notEqual(run("verify-package.sh", ["--package", validPackage, "--expected-build", build, "--expected-sha256", validSha, "--extracted-dir", extracted]).status, 0, "extra extracted file is rejected");
rmSync(join(extracted, "extra.js"));
symlinkSync(join(extracted, "index.html"), join(extracted, "linked-index.html"));
assert.notEqual(run("verify-package.sh", ["--package", validPackage, "--expected-build", build, "--expected-sha256", validSha, "--extracted-dir", extracted]).status, 0, "symlink extraction is rejected");

const env = {
  ...process.env,
  HOSTINGER_HOST: "host.example",
  HOSTINGER_PORT: "65002",
  HOSTINGER_USER: "test-user",
  HOSTINGER_REMOTE_DIR: "/home/test-user/domains/example.com/public_html/charropro",
  HOSTINGER_KEY: join(temp, "test-key"),
  HOSTINGER_KNOWN_HOSTS: join(temp, "known-hosts")
};
writeFileSync(env.HOSTINGER_KEY, "test key fixture\n", { mode: 0o600 });
const dryRun = run("deploy-client.sh", ["--package", validPackage, "--expected-build", build, "--expected-sha256", validSha, "--expected-checksum", checksum, "--dry-run"], env);
assert.equal(dryRun.status, 0, dryRun.stderr);
assert.match(dryRun.stdout, /DRY_RUN=PASS/);
assert.match(dryRun.stdout, /REMOTE_TEMP_PATH=\/home\/test-user\/\.charropro-deploy\/uploads\//);
assert.doesNotMatch(dryRun.stdout, /ssh .*host\.example/);

const rollbackDryRun = run("rollback-client.sh", ["--backup", "/home/test-user/domains/example.com/public_html/charropro-backup-20260824-120000-pre-abcdef0.zip", "--dry-run"], env);
assert.equal(rollbackDryRun.status, 0, rollbackDryRun.stderr);
assert.match(rollbackDryRun.stdout, /ROLLBACK_DRY_RUN=PASS/);

const lockProbe = spawnSync("bash", ["-c", `source '${new URL("lib.sh", scripts).pathname}'; lock='${temp}/lock'; mkdir "$lock"; if mkdir "$lock" 2>/dev/null; then exit 1; fi`], { encoding: "utf8" });
assert.equal(lockProbe.status, 0, "an existing deploy lock blocks a second acquisition");

const gitignore = readFileSync(new URL("../.gitignore", import.meta.url), "utf8");
assert.match(gitignore, /scripts\/hostinger\/hostinger-deploy\.env/);
assert.match(gitignore, /deploy-logs\/\*/);
process.stdout.write("Hostinger terminal deploy pipeline tests passed.\n");

function makePackage(name, files, { explicitDirectories = false } = {}) {
  const directory = join(temp, name);
  mkdirSync(directory, { recursive: true });
  for (const [relative, content] of Object.entries(files)) {
    const target = join(directory, relative);
    mkdirSync(join(target, ".."), { recursive: true });
    writeFileSync(target, content);
  }
  const packagePath = join(temp, `${name}-abcdef0.zip`);
  const entries = explicitDirectories ? ["index.html", "functions", "assets", "js"] : Object.keys(files);
  execFileSync("zip", ["-X", "-q", "-r", packagePath, ...entries], { cwd: directory });
  return packagePath;
}

function sha(file) {
  return execFileSync("shasum", ["-a", "256", file], { encoding: "utf8" }).split(/\s+/)[0];
}

function run(name, args, env = process.env) {
  return spawnSync(fileURLToPath(new URL(name, scripts)), args, { encoding: "utf8", env });
}

import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RELEASE_ID = "20260822-scorer-save-next-latency-audit-001-v1";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TARGET = path.join(ROOT, "js/core/firebaseSync.js");

const files = await listRuntimeFiles(ROOT);
const fileSet = new Set(files);
const edges = [];

for (const file of files) {
  const source = await readFile(file, "utf8");
  for (const specifier of listRelativeDependencies(source, file)) {
    const target = resolveDependency(file, specifier);
    if (fileSet.has(target)) edges.push({ from: file, to: target, specifier });
  }
}

const tournamentApp = path.join(ROOT, "js/tournamentApp.js");
const tournamentSource = await readFile(tournamentApp, "utf8");
assert.match(tournamentSource, /new URL\("\.\/app\.js", import\.meta\.url\)/);
assert.match(
  tournamentSource,
  new RegExp(`appModuleUrl\\.searchParams\\.set\\("v", "${RELEASE_ID}"\\)`)
);
edges.push({
  from: tournamentApp,
  to: path.join(ROOT, "js/app.js"),
  specifier: `./app.js?v=${RELEASE_ID}`
});

const ancestors = collectAncestors(edges, TARGET);
const protectedEdges = edges.filter(({ from, to }) => ancestors.has(from) && ancestors.has(to));

for (const edge of protectedEdges) {
  assert.equal(
    readVersion(edge.specifier),
    RELEASE_ID,
    `${relative(edge.from)} must invalidate ${edge.specifier} with the current release identity`
  );
}

for (const requiredSurface of [
  "index.html",
  "torneo.html",
  "supervision.html",
  "torneo-publico.html",
  "broadcast-studio.html",
  "production-console.html",
  "program-main-output.html",
  "announcer-monitor.html",
  "jueces.html",
  "locutores.html",
  "obs.html"
]) {
  assert.equal(ancestors.has(path.join(ROOT, requiredSurface)), true, `${requiredSurface} is covered`);
}

const firebaseIdentities = new Set(
  edges
    .filter(({ to }) => to === TARGET)
    .map(({ specifier }) => readVersion(specifier))
);
assert.deepEqual([...firebaseIdentities], [RELEASE_ID], "firebaseSync has one effective identity");

const currentRequests = new Set(protectedEdges.map(buildRequestKey));
const priorCacheScenarios = {
  clean: [],
  previousRuleProfileRelease: [
    "/js/app.js?v=20260808-rule-profile-engine-001-v1",
    "/js/core/scoring.js?v=20260808-rule-profile-engine-001-v1",
    "/js/core/firebaseSync.js?v=20260808-rule-profile-engine-001-v1"
  ],
  previousRelease: [
    "/js/app.js?v=20260808-public-snapshot-critical-recovery-001-v3",
    "/js/core/firebaseSync.js?v=20260808-public-snapshot-critical-recovery-001-v3"
  ],
  previousApp: ["/js/app.js?v=20260807-public-snapshot-critical-recovery-001-v1"],
  previousSync: ["/js/core/sync.js?v=20260727-public-portal-program-ux-001-program-phase-pm-v1"],
  previousFirebase: [
    "/js/core/firebaseSync.js?v=20260727-public-portal-program-ux-001-program-phase-pm-v1",
    "/js/core/firebaseSync.js?v=20260807-public-snapshot-critical-recovery-001-v1"
  ],
  olderRelease: [
    "/js/app.js?v=20260807-public-snapshot-critical-recovery-001-v1",
    "/js/core/sync.js?v=20260727-public-portal-program-ux-001-program-phase-pm-v1",
    "/js/core/firebaseSync.js?v=20260807-public-snapshot-critical-recovery-001-v1"
  ]
};

for (const [name, cachedRequests] of Object.entries(priorCacheScenarios)) {
  const cache = new Set(cachedRequests);
  const reused = [...currentRequests].filter((request) => cache.has(request));
  assert.deepEqual(reused, [], `${name} cannot reuse a protected module from an earlier release`);
}

assert.equal(
  currentRequests.has(`/js/core/firebaseSync.js?v=${RELEASE_ID}`),
  true,
  "normal reload requests the current firebaseSync identity"
);
assert.equal(
  [...currentRequests].filter((request) => request.includes("/firebaseSync.js?")).length,
  1,
  "hard refresh and normal reload converge on one firebaseSync URL"
);

console.log("public-snapshot-cache-coherence.test.mjs: ok");

async function listRuntimeFiles(root) {
  const result = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if ([".git", "node_modules", "tests", "tools", "functions"].includes(entry.name)) continue;
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      result.push(...await listRuntimeFiles(fullPath));
    } else if (entry.name.endsWith(".js") || (entry.name.endsWith(".html") && path.dirname(fullPath) === root)) {
      result.push(fullPath);
    }
  }
  return result;
}

function listRelativeDependencies(source, file) {
  const dependencies = [];
  const patterns = file.endsWith(".html")
    ? [/<script\b[^>]*\bsrc=["']([^"']+)["']/gi]
    : [
        /\b(?:import|export)\s+(?:[^"'()]*?\s+from\s*)?["']([^"']+)["']/g,
        /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g
      ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      if (match[1].startsWith(".")) dependencies.push(match[1]);
    }
  }
  return dependencies;
}

function resolveDependency(from, specifier) {
  return path.normalize(path.resolve(path.dirname(from), specifier.split(/[?#]/)[0]));
}

function collectAncestors(graphEdges, target) {
  const result = new Set([target]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const edge of graphEdges) {
      if (result.has(edge.to) && !result.has(edge.from)) {
        result.add(edge.from);
        changed = true;
      }
    }
  }
  return result;
}

function readVersion(specifier) {
  return new URL(specifier, "https://charropro.test/").searchParams.get("v");
}

function buildRequestKey(edge) {
  const version = readVersion(edge.specifier);
  return `/${relative(edge.to)}${version ? `?v=${version}` : ""}`;
}

function relative(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

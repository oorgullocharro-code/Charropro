import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const OLD_BUILD = "20260920-public-sabana-phase-title-ux-deploy-001-v1";
const configuration = JSON.parse(await readFile(new URL("../functions/configuration.defaults.json", import.meta.url), "utf8"));
const BUILD = String(configuration?.values?.system?.appVersion || "");

assert.match(BUILD, /^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/);
assert.notEqual(BUILD, OLD_BUILD, "the cache recovery release advances the canonical client identity");

const modules = await loadProductModules(new URL("../js/", import.meta.url));
assertGraphIsCurrent(modules, BUILD);

const app = findModule(modules, "/js/app.js");
const roles = findModule(modules, "/js/core/roles.js");
assert.ok(app, "app entrypoint is present");
assert.ok(roles, "roles module is present");
assert.match(roles, /export const TOURNAMENT_ACCESS\s*=/, "roles exposes the access contract required by app.js");
assert.match(app, new RegExp(`from ["']\\./core/roles\\.js\\?v=${escapeRegExp(BUILD)}["']`), "app and roles use the same cache identity");

assertGraphRejected({
  "/js/entry.js": `import "./app.js?v=${OLD_BUILD}";`
}, BUILD, "entrypoint-new-import-old");
assertGraphRejected({
  "/js/app.js": `import { TOURNAMENT_ACCESS } from "./core/roles.js?v=${OLD_BUILD}";`,
  "/js/core/roles.js": "export const TOURNAMENT_ACCESS = {};"
}, BUILD, "app-new-roles-old");
assertGraphRejected({
  "/js/views/cronometro-control.js": `import "../core/firebaseSync.js?v=${BUILD}";`,
  "/js/core/firebaseSync.js": `import "./timerRules.js?v=${OLD_BUILD}";`,
  "/js/core/timerRules.js": "export const timerRules = true;"
}, BUILD, "stale-transitive-import");
assertGraphRejected({
  "/js/app.js": `import "./core/roles.js?v=${OLD_BUILD}";`,
  "/js/core/roles.js": "export const TOURNAMENT_ACCESS = {};"
}, BUILD, "build-identity-not-advanced");
assertGraphRejected({
  "/js/app.js": `import "./core/roles.js?v=${BUILD}"; import "./core/firebaseSync.js?v=${OLD_BUILD}";`,
  "/js/core/roles.js": "export const TOURNAMENT_ACCESS = {};",
  "/js/core/firebaseSync.js": "export const firebaseSync = true;"
}, BUILD, "mixed-build-graph");

const previousCache = new Map([[`/js/core/roles.js?v=${OLD_BUILD}`, "historic roles module"]]);
const recoveredUrl = `/js/core/roles.js?v=${BUILD}`;
assert.equal(previousCache.has(recoveredUrl), false, "the new versioned URL cannot reuse a prior cached roles module");
assert.notEqual(recoveredUrl, `/js/core/roles.js?v=${OLD_BUILD}`);

console.log("CLIENT_CACHE_VERSION_RECOVERY: current graph, stale graph rejection, roles compatibility, and cache URL recovery passed.");

function assertGraphRejected(graph, build, scenario) {
  assert.throws(
    () => assertGraphIsCurrent(new Map(Object.entries(graph)), build),
    /stale-or-mixed-build-import/,
    scenario
  );
}

function assertGraphIsCurrent(graph, build) {
  const violations = [];
  for (const [modulePath, source] of graph) {
    for (const specifier of listRelativeModuleSpecifiers(source)) {
      const [pathname, query = ""] = specifier.split("?", 2);
      if (!pathname.endsWith(".js") || pathname.endsWith("/configurationBootstrap.js")) continue;
      const version = new URLSearchParams(query).get("v");
      if (version !== build) violations.push(`${modulePath}:${specifier}`);
    }
  }
  assert.deepEqual(violations, [], `stale-or-mixed-build-import:${violations.join(",")}`);
}

function listRelativeModuleSpecifiers(source) {
  const specifiers = [];
  for (const pattern of [
    /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g,
    /import\s*\(\s*["']([^"']+)["']\s*\)/g
  ]) {
    for (const match of source.matchAll(pattern)) {
      if (match[1].startsWith(".")) specifiers.push(match[1]);
    }
  }
  return specifiers;
}

async function loadProductModules(directory) {
  const modules = new Map();
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const url = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
    if (entry.isDirectory()) {
      for (const [path, source] of await loadProductModules(url)) modules.set(path, source);
    } else if (entry.name.endsWith(".js")) {
      modules.set(url.pathname, await readFile(url, "utf8"));
    }
  }
  return modules;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findModule(modules, suffix) {
  return [...modules].find(([path]) => path.endsWith(suffix))?.[1];
}

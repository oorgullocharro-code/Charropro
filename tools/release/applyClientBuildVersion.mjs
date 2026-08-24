import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const STABLE_BOOTSTRAP_MODULES = Object.freeze([
  "configurationBootstrap.js"
]);

export function readCanonicalBuild(root) {
  const configuration = JSON.parse(fs.readFileSync(path.join(root, "functions/configuration.defaults.json"), "utf8"));
  const build = String(configuration?.values?.system?.appVersion || "");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/.test(build)) throw new Error("canonical-build-invalid");
  return build;
}

export function applyCanonicalBuildToSource(source, build) {
  return source.replace(/((?:import|export)\s+(?:[^"']*?\s+from\s+)?["']|import\s*\(\s*["'])(\.{1,2}\/[^"']+\.js)(?:\?v=[A-Za-z0-9._-]+)?(["'])/g, (match, prefix, specifier, suffix) => {
    if (STABLE_BOOTSTRAP_MODULES.some((name) => specifier.endsWith(`/${name}`) || specifier.endsWith(name))) {
      return `${prefix}${specifier}${suffix}`;
    }
    return `${prefix}${specifier}?v=${build}${suffix}`;
  });
}

export function applyCanonicalBuild(root, options = {}) {
  const build = options.build || readCanonicalBuild(root);
  const files = collectFiles(root, ["js", "fixtures", "tests"]);
  const changed = [];
  for (const file of files) {
    const before = fs.readFileSync(file, "utf8");
    const after = applyCanonicalBuildToSource(before, build);
    if (before === after) continue;
    fs.writeFileSync(file, after);
    changed.push(path.relative(root, file));
  }
  return Object.freeze({ build, changed: Object.freeze(changed) });
}

function collectFiles(root, directories) {
  const output = [];
  const visit = (directory) => {
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (/\.(?:js|mjs)$/.test(entry.name)) output.push(full);
    }
  };
  directories.forEach((directory) => visit(path.join(root, directory)));
  return output.sort();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(process.argv[2] || ".");
  const result = applyCanonicalBuild(root);
  console.log(JSON.stringify(result, null, 2));
}

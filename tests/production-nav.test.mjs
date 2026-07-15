import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ROLES, roleCan } from "../js/core/roles.js?v=20260708-recovery-001b-panel-status1";
import { CHARROPRO_APP_VERSION } from "../js/core/version.js";

const appSource = await readFile(new URL("../js/app.js", import.meta.url), "utf8");
const cssSource = await readFile(new URL("../css/styles.css", import.meta.url), "utf8");
const indexSource = await readFile(new URL("../index.html", import.meta.url), "utf8");
const documentation = await readFile(new URL("../PRODUCTION_NAV_V1.md", import.meta.url), "utf8");
const version = "20260715-program-engine-001-official-program-v1";

assert.equal(CHARROPRO_APP_VERSION, version);
assert.match(appSource, /const PRODUCTION_NAV_VERSION = CHARROPRO_APP_VERSION/);
assert.match(indexSource, new RegExp(`styles\\.css\\?v=${version}`));
assert.match(indexSource, new RegExp(`app\\.js\\?v=${version}`));

// Navigation uses the existing view system and the single delegated click listener.
assert.match(appSource, /const PRODUCTION_NAV_VIEW = "production"/);
assert.match(appSource, /production: \["Producción", "Centro de producción y gráficos en vivo\."\]/);
assert.equal((appSource.match(/\[PRODUCTION_NAV_VIEW, "Producción", "monitor"\]/g) || []).length, 2);
assert.match(appSource, /const generalItems = IS_TOURNAMENT_APP \? \[\] : getVisibleGeneralNavItems\(\)/);
assert.match(appSource, /const tournamentItems = IS_TOURNAMENT_APP \? getVisibleTournamentNavItems\(labels\) : \[\]/);
assert.match(appSource, /if \(state\.view === PRODUCTION_NAV_VIEW\) return renderProductionNav\(\)/);
assert.match(appSource, /data-view="\$\{PRODUCTION_NAV_VIEW\}"/);
assert.equal((appSource.match(/document\.addEventListener\("click"/g) || []).length, 1);

// Role visibility reuses the central capability and covers the existing admin alias.
assert.match(appSource, /function canAccessProductionRole[\s\S]*?roleCan\(role, "graphics"\)/);
for (const role of [ROLES.SUPERVISOR, ROLES.OPERADOR, ROLES.GRAFICOS, "admin", "administrador"]) {
  assert.equal(roleCan(role, "graphics"), true, `${role} should access production`);
}
for (const role of [ROLES.JUEZ, ROLES.LOCUTOR, ROLES.LECTURA, ROLES.ORGANIZADOR, ROLES.SIN_ACCESO]) {
  assert.equal(roleCan(role, "graphics"), false, `${role} should not access production`);
}
for (const role of ["operador_lectura", "administrador_demo", "graficos_demo", "unknown", "", null, undefined]) {
  assert.equal(roleCan(role, "graphics"), false, `${String(role)} must not match a role partially`);
}
assert.match(appSource, /if \(view === PRODUCTION_NAV_VIEW\) return canAccessProductionRole\(role\)/);
assert.match(appSource, /if \(state\.view === PRODUCTION_NAV_VIEW\) return canAccessProductionRole\(role\)/);
assert.match(appSource, /function renderCurrentView\(\) \{\s*if \(!canAccessCurrentView\(\)\) return renderRoleAccessHome\(\)/);
assert.match(appSource, /function renderProductionNav\(\) \{\s*if \(!canAccessProductionRole\(\)\) return renderRoleAccessHome\(\)/);
assert.match(appSource, /function renderProductionQuickLinks\(\) \{\s*if \(!canAccessProductionRole\(\)\) return ""/);

const roleGuardSource = appSource.slice(
  appSource.indexOf("function canAccessProductionRole"),
  appSource.indexOf("function renderUiIcon")
);
const productionRoleGuard = new Function(
  "firebaseAccess",
  "roleCan",
  `${roleGuardSource}; return canAccessProductionRole;`
)({ role: ROLES.SIN_ACCESO }, roleCan);
for (const role of [ROLES.SUPERVISOR, ROLES.OPERADOR, ROLES.GRAFICOS, "admin", "administrador"]) {
  assert.equal(productionRoleGuard(role), true);
}
for (const role of [ROLES.JUEZ, ROLES.LOCUTOR, ROLES.LECTURA, ROLES.ORGANIZADOR, "unknown", "", null]) {
  assert.equal(productionRoleGuard(role), false);
}

// Only allowlisted same-origin HTML routes are resolved.
assert.match(appSource, /route: "production-console\.html"/);
assert.match(appSource, /route: "broadcast-playground\.html"/);
assert.match(appSource, /!\/\^\[a-z0-9-\]\+\\\.html\$\/\.test\(target\.route\)/);
assert.match(appSource, /!\["http:", "https:"\]\.includes\(url\.protocol\)/);
assert.match(appSource, /url\.origin !== window\.location\.origin/);
assert.doesNotMatch(appSource.slice(appSource.indexOf("function getProductionTargetUrl"), appSource.indexOf("function renderGraphicsAccess")), /localhost|127\.0\.0\.1|javascript:|file:\/\//);

const resolverSource = appSource.slice(
  appSource.indexOf("function getProductionTargetUrl"),
  appSource.indexOf("function openProductionTarget")
);
const makeProductionResolver = (targets, href = "https://charropro.test/charropro/index.html") => new Function(
  "PRODUCTION_NAV_TARGETS",
  "PRODUCTION_NAV_VERSION",
  "window",
  `${resolverSource}; return getProductionTargetUrl;`
)(targets, version, { location: new URL(href) });
const safeResolver = makeProductionResolver({
  console: { route: "production-console.html" },
  playground: { route: "broadcast-playground.html" }
});
assert.equal(safeResolver("console").href, `https://charropro.test/charropro/production-console.html?v=${version}`);
assert.equal(safeResolver("playground").href, `https://charropro.test/charropro/broadcast-playground.html?v=${version}`);
assert.equal(safeResolver("unknown"), null);

for (const unsafeRoute of [
  "javascript:alert(1)",
  "file:///tmp/test",
  "data:text/html,<h1>bad</h1>",
  "https://dominio-externo.com",
  "//dominio-externo.com",
  "../production-console.html"
]) {
  const unsafeResolver = makeProductionResolver({ candidate: { route: unsafeRoute } });
  assert.equal(unsafeResolver("candidate"), null, `${unsafeRoute} must be rejected`);
}
const fileOriginResolver = makeProductionResolver(
  { console: { route: "production-console.html" } },
  "file:///tmp/index.html"
);
assert.equal(fileOriginResolver("console"), null);

// Opening and copy behavior remains explicit and safe.
assert.match(appSource, /window\.location\.assign\(url\.href\)/);
assert.match(appSource, /window\.open\(url\.href, "_blank", "noopener,noreferrer"\)/);
assert.match(appSource, /navigator\.clipboard\?\.writeText/);
assert.match(appSource, /input\.focus\(\)/);
assert.match(appSource, /input\.select\(\)/);
assert.match(appSource, /Enlace seleccionado\. Cópialo manualmente\./);
assert.doesNotMatch(productionSectionFor("copyProductionTargetUrl"), /innerHTML|insertAdjacentHTML|document\.write/);

// Cards, Connection shortcuts and declarative status are present without polling.
for (const label of [
  "Broadcast Studio",
  "Consola de Producción",
  "Playground de Broadcast",
  "V2 en desarrollo",
  "Sin conexión real a OBS ni persistencia definitiva de Program.",
  "Arquitectura maestra",
  "Data Contract",
  "Broadcast State",
  "Output Engine",
  "Asset Manager",
  "Production Console"
]) {
  assert.ok(appSource.includes(label), `Missing production label: ${label}`);
}
for (const moduleVersion of ["1.0.0", "V1"]) assert.ok(appSource.includes(`version: "${moduleVersion}"`));
assert.match(appSource, /\$\{renderProductionQuickLinks\(\)\}/);
assert.match(appSource, /data-production-target="console"/);
assert.match(appSource, /data-production-target="playground"/);

const productionSection = appSource.slice(appSource.indexOf("function renderProductionNav"), appSource.indexOf("function renderGraphicsAccess"));
assert.doesNotMatch(productionSection, /\bfetch\s*\(|setInterval\s*\(|EventSource|WebSocket/);
assert.doesNotMatch(productionSection, /tenantId|sessionId|operatorId|password|token|secret/i);
assert.equal((productionSection.match(/class="production-card"/g) || []).length, 1);
assert.match(productionSection, /Object\.values\(PRODUCTION_NAV_TARGETS\)\.map\(renderProductionCard\)/);
assert.match(appSource, /\$\{renderPublicPageLinksCard\(\)\}/);
assert.match(appSource, /\$\{liveScreenGroups\.map\(renderLiveScreenGroup\)\.join\(""\)\}/);
assert.match(appSource, /function renderGraphicsAccess\(\)/);

// Scoped CSS is responsive and does not alter global components.
for (const className of [
  "production-nav",
  "production-card",
  "production-status",
  "production-module-list",
  "production-quick-links"
]) {
  assert.match(cssSource, new RegExp(`\\.${className}\\b`));
}
assert.match(cssSource, /\.production-nav-grid[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/);
assert.match(cssSource, /@media \(max-width: 980px\)[\s\S]*?\.production-nav-grid[\s\S]*?grid-template-columns: 1fr/);
assert.match(cssSource, /@media \(max-width: 640px\)[\s\S]*?\.production-card-actions[\s\S]*?grid-template-columns: 1fr/);

// Documentation describes actual routes, permissions and current limitations.
assert.match(documentation, /index\.html\?view=production/);
assert.match(documentation, /production-console\.html/);
assert.match(documentation, /broadcast-playground\.html/);
assert.match(documentation, /no controla OBS/i);
assert.match(documentation, /No existe persistencia definitiva de Program/i);

console.log("production-nav.test.mjs: ok");

function productionSectionFor(functionName) {
  const start = appSource.indexOf(`function ${functionName}`);
  const next = appSource.indexOf("\nfunction ", start + 10);
  return appSource.slice(start, next < 0 ? undefined : next);
}

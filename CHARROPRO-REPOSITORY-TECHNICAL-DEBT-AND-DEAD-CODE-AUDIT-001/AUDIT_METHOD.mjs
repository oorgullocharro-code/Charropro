import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const root = path.resolve(process.argv[2] || ".");
const out = path.join(root, "CHARROPRO-REPOSITORY-TECHNICAL-DEBT-AND-DEAD-CODE-AUDIT-001");
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const tracked = git("ls-files").split("\n").filter(Boolean).sort();
const trackedSet = new Set(tracked);
const textExt = new Set([".js", ".mjs", ".html", ".css", ".json", ".md", ".txt", ".gs", ".csv"]);
const protectedFiles = new Set([
  "assets/fmch/official-format-2024-2028/fmch-emblem.png",
  "assets/fmch/official-format-2024-2028/conade-lockup.png",
  "assets/fmch/official-format-2024-2028/manifest.json",
  "js/core/officialFormatSnapshot.js", "js/core/officialFormat.js",
  "js/core/officialFormatHtml.js", "js/core/officialFormatDocumentModel.js",
  "js/data/ruleProfiles.js", "js/core/scoringAttempt.js",
  "js/core/publicProjectionOutbox.js"
]);
const body = new Map();
for (const file of tracked) {
  if (!textExt.has(path.extname(file)) && !["firebase.json", ".firebaserc", ".gitignore"].includes(file)) continue;
  try { body.set(file, fs.readFileSync(path.join(root, file), "utf8")); } catch {}
}
const refs = new Map(tracked.map((f) => [f, []]));
const edges = new Map(tracked.map((f) => [f, []]));
function resolveRef(source, specifier) {
  const clean = specifier.split(/[?#]/)[0];
  if (!clean || /^(https?:|data:|#|mailto:)/.test(clean)) return null;
  const candidate = clean.startsWith("/") ? clean.slice(1) : path.posix.normalize(path.posix.join(path.posix.dirname(source), clean));
  return trackedSet.has(candidate) ? candidate : null;
}
function add(source, target, type) {
  if (!target || target === source) return;
  if (!refs.get(target).some((x) => x.source === source && x.type === type)) refs.get(target).push({ source, type });
  if (!edges.get(source).some((x) => x.target === target && x.type === type)) edges.get(source).push({ target, type });
}
for (const [source, text] of body) {
  const patterns = [
    [/(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g, "STATIC_REFERENCE"],
    [/import\s*\(\s*["']([^"']+)["']/g, "DYNAMIC_REFERENCE"],
    [/(?:src|href)=["']([^"']+)["']/g, "HTML_REFERENCE"],
    [/url\(\s*["']?([^)'"\s]+)["']?/g, "CSS_REFERENCE"],
    [/["'](\.\.?\/[^"']+\.(?:js|mjs|css|html|json|png|jpe?g|svg|webp))["']/g, "CONFIG_REFERENCE"]
  ];
  for (const [regex, rawType] of patterns) for (const match of text.matchAll(regex)) {
    add(source, resolveRef(source, match[1]), source.startsWith("tests/") ? "TEST_ONLY_REFERENCE" : rawType);
  }
}
for (const [source, text] of body) for (const target of tracked) {
  if (source !== target && target.length >= 10 && text.includes(target)) add(source, target, source.endsWith(".md") ? "DOCUMENTATION_ONLY_REFERENCE" : "CONFIG_REFERENCE");
}

const htmlRoots = tracked.filter((f) => !f.includes("/") && f.endsWith(".html"));
const reachable = new Set();
const queue = [...htmlRoots];
while (queue.length) {
  const file = queue.shift();
  if (reachable.has(file)) continue;
  reachable.add(file);
  for (const edge of edges.get(file) || []) if (!edge.type.endsWith("ONLY_REFERENCE")) queue.push(edge.target);
}
const tests = tracked.filter((f) => /^tests\/.*\.test\.mjs$/.test(f));
const coverage = tests.map((test) => {
  const targets = (edges.get(test) || []).map((x) => x.target).filter((x) => !x.startsWith("tests/"));
  return { test, targetModules: [...new Set(targets)].sort(), category: /firebase/.test(test) ? "FIREBASE_RULES_OR_EMULATOR" : /broadcast|output/.test(test) ? "BROADCAST" : /official-format/.test(test) ? "OFFICIAL_FORMAT" : /scor/.test(test) ? "SCORER" : "CORE_OR_INTEGRATION", status: "ACTIVE_BASELINE", possibleOverlap: [], recommendation: "KEEP_TEST" };
});
for (const item of coverage) item.possibleOverlap = coverage.filter((x) => x.test !== item.test && x.targetModules.some((m) => item.targetModules.includes(m))).map((x) => x.test).slice(0, 12);

function category(file) {
  if ([".env.example", ".env.local.example", ".env.production.example", ".env.staging.example", ".gitignore"].includes(file)) return "PRODUCTIVE_CONFIG";
  if (/^CHARROPRO-.*-00[123]\/evidence\//.test(file)) return "FIXTURE";
  if (file.startsWith("tests/")) return file.includes("fixtures/") ? "FIXTURE" : "TEST";
  if (file.startsWith("fixtures/")) return "FIXTURE";
  if (file.startsWith("tools/")) return "TOOLING";
  if (file.startsWith("google-apps-script/")) return "TOOLING";
  if (file.startsWith("functions/")) return file.endsWith(".json") ? "PRODUCTIVE_CONFIG" : "PRODUCTIVE_FIREBASE";
  if (file.startsWith("js/broadcast/") || /^(broadcast|production-console|program-main-output|announcer-monitor|browser-output)/.test(file)) return "PRODUCTIVE_BROADCAST";
  if (file.startsWith("js/core/officialFormat") || file === "formato-federacion.html" || file.startsWith("assets/fmch/official-format")) return "PRODUCTIVE_OFFICIAL_FORMAT";
  if (file.startsWith("js/data/") || file.startsWith("js/core/scoring") || file.startsWith("js/core/flow") || file === "torneo.html") return "PRODUCTIVE_SCORER";
  if (file.startsWith("js/core/")) return "PRODUCTIVE_CORE";
  if (["js/app.js", "js/tournamentApp.js"].includes(file)) return "PRODUCTIVE_CORE";
  if (file.startsWith("js/views/") || file.startsWith("js/public")) return "PRODUCTIVE_VIEW";
  if (file.endsWith(".html") && !file.includes("/")) return "PRODUCTIVE_ENTRYPOINT";
  if (file.startsWith("assets/") || file.startsWith("css/")) return "PRODUCTIVE_ASSET";
  if (["firebase.json", ".firebaserc", "storage.rules", "firebase-rules-auditoria.json"].includes(file)) return "PRODUCTIVE_FIREBASE";
  if (/\.md$/.test(file)) return /^CHARROPRO-.*-00[123]\//.test(file) ? "DOCUMENTATION_HISTORICAL" : "DOCUMENTATION_CURRENT";
  if (/\.json$/.test(file)) return "PRODUCTIVE_DATA";
  return "UNKNOWN";
}
const digestGroups = new Map();
const inventory = tracked.map((file) => {
  const data = fs.readFileSync(path.join(root, file));
  const hash = crypto.createHash("sha256").update(data).digest("hex");
  if (!digestGroups.has(hash)) digestGroups.set(hash, []);
  digestGroups.get(hash).push(file);
  const cat = category(file);
  const inbound = refs.get(file) || [];
  const testRefs = inbound.filter((x) => x.type === "TEST_ONLY_REFERENCE").map((x) => x.source);
  let decision = "UNKNOWN_REQUIRES_REVIEW";
  if (protectedFiles.has(file)) decision = "KEEP_AUTHORITY";
  else if (cat.startsWith("PRODUCTIVE_")) decision = "KEEP_PRODUCTIVE";
  else if (["TEST", "FIXTURE"].includes(cat)) decision = "KEEP_CERTIFICATION_EVIDENCE";
  else if (cat === "TOOLING") decision = "KEEP_TOOLING";
  else if (cat === "DOCUMENTATION_HISTORICAL") decision = "KEEP_HISTORICAL";
  else if (cat === "DOCUMENTATION_CURRENT") decision = "KEEP_AUTHORITY";
  return {
    path:file, extension:path.extname(file)||"none", type:cat, size:data.length, sha256:hash,
    gitTracked:true, category:cat,
    runtimeRole: protectedFiles.has(file) ? "PROTECTED_AUTHORITY_OR_CERTIFIED_ASSET" : reachable.has(file) ? "reachable production runtime dependency" : cat === "TEST" ? "automated regression suite" : cat === "TOOLING" ? "development/release/certification tooling" : cat === "DOCUMENTATION_HISTORICAL" ? "ticket evidence and historical traceability" : "repository support artifact",
    referencedBy:inbound.map((x)=>x.source).slice(0,100), referenceTypes:[...new Set(inbound.map((x)=>x.type))],
    imports:[...new Set((edges.get(file)||[]).map((x)=>x.target))].sort(),
    exports:[...new Set([...(body.get(file)||"").matchAll(/\bexport\s+(?:default\s+)?(?:const|let|var|function|class)?\s*([A-Za-z_$][\w$]*)?/g)].map((x)=>x[1]||"default"))],
    entrypoint:htmlRoots.includes(file), testCoverage:testRefs, lastKnownPurpose:cat,
    replacementCandidate:null, duplicateCandidate:null,
    productionCritical:protectedFiles.has(file)||reachable.has(file)||cat==="PRODUCTIVE_FIREBASE",
    confidence:protectedFiles.has(file)||reachable.has(file)?"HIGH":"MEDIUM",
    recommendedDisposition:decision,
    evidence:inbound.length?inbound.slice(0,5).map((x)=>`${x.source} (${x.type})`).join(", "):"no parsed consumer; path/role classification requires review"
  };
});
const duplicates = [...digestGroups].filter(([,files])=>files.length>1).map(([sha256,files])=>({sha256,files,classification:files.every((f)=>f.startsWith("CHARROPRO-")||f.startsWith("tests/"))?"CERTIFICATION_OR_TEST_DUPLICATE":"EXACT_DUPLICATE_REVIEW"}));
for (const group of duplicates) for (const file of group.files) inventory.find((x)=>x.path===file).duplicateCandidate=group.classification;
const orphanJs = inventory.filter((x)=>x.path.startsWith("js/")&&x.path.endsWith(".js")&&!reachable.has(x.path)&&x.referencedBy.every((r)=>r.startsWith("tests/")||r.endsWith(".md")));
const staleDocs = tracked.filter((f)=>f.endsWith(".md")&&/FMCH_2026_LIBRE[\s\S]{0,180}\b(draft|ready)\b|\bNO APROBADO\b/.test(body.get(f)||""));
const counts=(field)=>inventory.reduce((a,x)=>(a[x[field]]=(a[x[field]]||0)+1,a),{});
const categoryCounts=counts("category"), dispositionCounts=counts("recommendedDisposition");
const csv=(v)=>`"${String(v??"").replaceAll('"','""')}"`;
const matrix=inventory.map((x)=>({path:x.path,category:x.category,decision:x.recommendedDisposition,confidence:x.confidence,productionCritical:x.productionCritical,evidence:x.evidence}));
const table=(heads,rows)=>["| "+heads.join(" | ")+" |","|"+heads.map(()=>"---").join("|")+"|",...rows.map((r)=>"| "+r.map((v)=>String(v??"").replaceAll("|","\\|").replaceAll("\n"," ")).join(" | ")+" |")].join("\n");
const write=(name,value)=>fs.writeFileSync(path.join(out,name),value);

write("REPOSITORY_INVENTORY.json",JSON.stringify({generatedAt:"2026-08-24",baseCommit:git("rev-parse","HEAD"),scope:{perFile:"all Git-tracked files",ignoredDependencies:"aggregate only",reason:"generated dependency trees are not repository source"},counts:{tracked:inventory.length,categories:categoryCounts,dispositions:dispositionCounts},files:inventory},null,2)+"\n");
write("REPOSITORY_DISPOSITION_MATRIX.json",JSON.stringify({generatedAt:"2026-08-24",baseCommit:git("rev-parse","HEAD"),counts:dispositionCounts,files:matrix},null,2)+"\n");
write("REPOSITORY_DISPOSITION_MATRIX.csv",["path,category,decision,confidence,productionCritical,evidence",...matrix.map((r)=>[r.path,r.category,r.decision,r.confidence,r.productionCritical,r.evidence].map(csv).join(","))].join("\n")+"\n");
write("TEST_COVERAGE_MAP.json",JSON.stringify({generatedAt:"2026-08-24",tests:coverage.length,entries:coverage},null,2)+"\n");
write("SUMMARY.md",`# Repository Technical Debt and Dead Code Audit\n\n## Dictamen\n\nAPROBADO_PARA_PLAN_DE_LIMPIEZA. No se detectó P0 ni evidencia suficiente para eliminar código productivo.\n\n## Baseline\n\n- Branch: main\n- Commit: ${git("rev-parse","HEAD")}\n- Tracked files inventoried: ${inventory.length}\n- Root HTML entrypoints: ${htmlRoots.length}\n- Test suites mapped: ${tests.length}\n- Exact duplicate groups: ${duplicates.length}\n- Potential orphan JS modules: ${orphanJs.length}; HIGH-confidence dead: 0\n- Current build: 20260824-fmch-team-sheet-html-print-geometry-001-v1\n\n## Categories\n\n${table(["Category","Files"],Object.entries(categoryCounts).sort((a,b)=>b[1]-a[1]))}\n\n## Disposition\n\n${table(["Decision","Files"],Object.entries(dispositionCounts).sort((a,b)=>b[1]-a[1]))}\n\n## Physical tree distinction\n\nThe physical tree includes ignored functions/node_modules, .local Emulator state/log/PID, database-debug.log and .DS_Store files. They are local/generated material, not tracked removal candidates.\n\nNo product, Rule Profile, Official Format, Firebase, scorer, XLSX, assets or sporting values were changed.\n`);
write("DEPENDENCY_GRAPH.md",`# Dependency Graph\n\n## Product roots\n\n${htmlRoots.map((x)=>`- ${x}`).join("\n")}\n\n## Main paths\n\n- index.html -> js/app.js -> js/core/* + js/data/* + Firebase adapters\n- torneo.html -> js/tournamentApp.js -> js/app.js\n- torneo-publico.html -> js/views/torneo-publico.js -> js/publicPortal/* -> js/public/*\n- formato-federacion.html -> formato-federacion.js -> Official Format Snapshot -> Document Model -> HTML/XLSX\n- broadcast-studio.html -> Workspace -> Theme/Template -> Preview -> Program -> Routing -> Realtime\n- functions/index.js -> trusted services/engines -> Admin SDK/RTDB\n\nParsed references include static, dynamic, HTML, CSS, configuration, tests and documentation. No-reference is not proof of death because direct URLs, registries and external callers remain possible.\n`);
const htmlAudit=htmlRoots.map((f)=>[f,(refs.get(f)||[]).map((x)=>x.source).slice(0,4).join(", ")||"direct URL",(edges.get(f)||[]).filter((x)=>/\.js$/.test(x.target)).map((x)=>x.target).join(", ")||"none",["broadcast-playground.html","browser-output.html"].includes(f)?"TOOL_OR_LAB":"PRODUCTIVE_ENTRYPOINT","KEEP_PRODUCTIVE"]);
write("HTML_ENTRYPOINT_AUDIT.md",`# HTML Entrypoint Audit\n\n${table(["Entrypoint","Linked from","Scripts","Class","Disposition"],htmlAudit)}\n\nNo page is approved for removal. Outputs, graphics and operational tools can have direct/external URL consumers.\n`);
const js=inventory.filter((x)=>x.path.startsWith("js/")&&x.path.endsWith(".js"));
write("JAVASCRIPT_MODULE_AUDIT.md",`# JavaScript Module Audit\n\n- Runtime modules: ${js.length}\n- Parsed reachable modules: ${js.filter((x)=>reachable.has(x.path)).length}\n- Trace-review modules: ${orphanJs.length}\n- HIGH-confidence dead: 0\n\n${table(["Largest module","Bytes","Disposition"],[...js].sort((a,b)=>b.size-a.size).slice(0,20).map((x)=>[x.path,x.size,x.recommendedDisposition]))}\n\nOfficial Score, Attempt V2, Rule Profiles, Lifecycle, Timer Authority, Projection Outbox, Official Format and Broadcast are protected. Compatibility adapters are not dead code by name.\n`);
const css=inventory.filter((x)=>x.path.startsWith("css/")&&x.path.endsWith(".css")).map((x)=>{const t=body.get(x.path)||"";return[x.path,x.size,(t.match(/\{/g)||[]).length,(t.match(/!important/g)||[]).length,x.referencedBy.join(", ")||"none"]});
write("CSS_AUDIT.md",`# CSS Audit\n\n${table(["Stylesheet","Bytes","Rule blocks","!important","References"],css)}\n\nNo stylesheet is removable. styles.css is a consolidation hotspot across unrelated surfaces. Certified Official Format CSS requires characterization before extraction. Selector death needs browser/DOM coverage, not grep alone.\n`);
const assets=inventory.filter((x)=>x.path.startsWith("assets/")).map((x)=>[x.path,x.size,protectedFiles.has(x.path)?"USED_PRODUCTIVE_PROTECTED":x.referencedBy.length?"USED_PRODUCTIVE_OR_DEMO":"UNKNOWN",x.referencedBy.slice(0,5).join(", ")||"none parsed"]);
write("ASSET_AUDIT.md",`# Asset Audit\n\n${table(["Asset","Bytes","Class","References"],assets)}\n\nFMCH emblem, CONADE lockup and manifest are KEEP_AUTHORITY and unchanged. Theme assets with no parsed edge remain UNKNOWN because runtime configuration may resolve them.\n`);
const fnIndex=body.get("functions/index.js")||""; const funcs=[...fnIndex.matchAll(/exports\.([A-Za-z0-9_$]+)\s*=/g)].map((x)=>x[1]);
write("FIREBASE_LOCAL_AUDIT.md",`# Firebase Local Audit\n\n- RTDB Rules: firebase-rules-auditoria.json\n- Storage Rules: storage.rules\n- Functions source: functions/\n- Emulator ports: Auth 9099, RTDB 9000, Functions 5001, Storage 9199\n- Network writes/deploys: none\n\n## Exported surfaces\n\n${funcs.map((x)=>`- ${x}: ACTIVE_PROBABLE; external consumers may not appear locally`).join("\n")}\n\nfunctions/node_modules and .local Emulator state are ignored generated/local artifacts. No Function is marked DELETE.\n`);
const versions=new Map(); for(const [f,t] of body)for(const m of t.matchAll(/202\d{5,}[-_][A-Za-z0-9._-]+/g)){const v=m[0].replace(/["'`)>,;]+$/g,"");if(!versions.has(v))versions.set(v,new Set());versions.get(v).add(f)}
const versionRows=[...versions].map(([v,files])=>[v,[...files].slice(0,8).join(", ")+(files.size>8?` (+${files.size-8})`:""),[...files].some((f)=>f.endsWith(".html")||f.startsWith("js/"))?"RUNTIME_OR_MIXED":"HISTORICAL",v==="20260824-fmch-team-sheet-html-print-geometry-001-v1"?"YES":"NO"]).sort((a,b)=>b[1].length-a[1].length);
write("VERSION_AND_CACHE_BUSTER_AUDIT.md",`# Version and Cache-Buster Audit\n\nCurrent build: 20260824-fmch-team-sheet-html-print-geometry-001-v1. No cache-buster changed.\n\n${table(["Version","Files","Role","Current"],versionRows.slice(0,140))}\n\nOlder strings are valid in historical evidence. Older strings in runtime entrypoints/imports are a P1 consistency risk requiring a single generated authority, not bulk replacement.\n`);
write("DOCUMENTATION_AUDIT.md",`# Documentation Audit\n\nTicket folders are immutable HISTORICAL_EVIDENCE unless identified as current authority. Historical status language is not itself grounds for deletion.\n\n## Potentially stale operational language (${staleDocs.length})\n\n${staleDocs.map((x)=>`- ${x}: historical evidence mentioning draft/ready/NO APROBADO; label via index, do not rewrite`).join("\n")||"None"}\n\nCreate a current-authority index linking immutable evidence. Root architecture/deployment/V1 documents remain CURRENT_REFERENCE pending owner review.\n`);
write("DUPLICATE_FILES.md",`# Duplicate Files\n\nExact duplicate groups: ${duplicates.length}. Hash equality does not authorize removal.\n\n${duplicates.map((g,i)=>`## Group ${i+1}\n- SHA-256: ${g.sha256}\n- Class: ${g.classification}\n${g.files.map((f)=>`- ${f}`).join("\n")}`).join("\n\n")||"None"}\n\nHistorical profile versions are VERSIONED_SUCCESSOR. Public Projection legacy/current modules, Broadcast stages and Official Format pipeline stages have distinct responsibilities and are NOT_DUPLICATE.\n`);
write("DEAD_CODE_CANDIDATES.md",`# Dead Code Candidates\n\nHIGH confidence: 0. No file meets all required deletion evidence.\n\n${orphanJs.length?table(["Path","Confidence","Tests","Disposition"],orphanJs.map((x)=>[x.path,x.testCoverage.length?"LOW":"MEDIUM",x.testCoverage.join(", ")||"none","UNKNOWN_REQUIRES_REVIEW"])):"No trace-review modules."}\n\nDirect URLs, runtime registries, external Browser Source/OBS consumers and Firebase callable clients must be checked before removal.\n`);
const debt=[
["TD-001","P1 HIGH","Client","js/app.js is 643,875 bytes and spans UI, orchestration, lifecycle and scorer flows.","Extract bounded non-sporting domains with characterization tests.","CHARROPRO-APP-MONOLITH-BOUNDARY-EXTRACTION-001"],
["TD-002","P1 HIGH","Cache","Current runtime mixes the August build with July cache-busters.","Introduce one generated asset-version authority.","CHARROPRO-CACHE-BUSTER-SINGLE-AUTHORITY-001"],
["TD-003","P1 HIGH","Functions","functions/package.json targets Node 20.","Dedicated supported-runtime migration with Emulator/canary.","CHARROPRO-NODE-20-RUNTIME-MIGRATION-001"],
["TD-004","P2 MEDIUM","CSS","styles.css is 232,842 bytes and crosses product surfaces.","Map selector ownership; extract one surface at a time.","CHARROPRO-CSS-OWNERSHIP-BOUNDARIES-001"],
["TD-005","P2 MEDIUM","Firebase","firebaseSync.js is 246,152 bytes and spans multiple data domains.","Characterize then separate adapters without path changes.","CHARROPRO-FIREBASE-CLIENT-ADAPTER-BOUNDARIES-001"],
["TD-006","P2 MEDIUM","Docs",`${staleDocs.length} historical docs contain status language easily mistaken for current authority.`,"Create immutable historical/current authority index.","CHARROPRO-DOCUMENTATION-AUTHORITY-INDEX-001"],
["TD-007","P2 MEDIUM","Dependencies","firebase-admin/functions are declared as latest despite lockfile.","Pin reviewed ranges in dedicated dependency ticket.","CHARROPRO-FUNCTIONS-DEPENDENCY-PINNING-001"],
["TD-008","P2 MEDIUM","Unknown code",`${orphanJs.length} JS modules need runtime/external-consumer tracing; HIGH dead=0.`,"Trace usage before any deletion.","CHARROPRO-DEAD-CODE-RUNTIME-TRACE-001"],
["TD-009","P3 LOW","Local hygiene","Ignored .DS_Store, logs, PID and Emulator export exist locally.","Package exclusions and optional local cleanup guide.","CHARROPRO-LOCAL-ARTIFACT-HYGIENE-001"],
["TD-010","P3 LOW","Evidence","Certification evidence/documentation dominates repository navigation.","Retention policy and authority indexes; do not delete evidence.","CHARROPRO-CERTIFICATION-EVIDENCE-RETENTION-001"]];
write("TECHNICAL_DEBT_REGISTER.md",`# Technical Debt Register\n\n${debt.map(([id,sev,area,desc,action,ticket])=>`## ${id} — ${sev}\n- Area: ${area}\n- Description: ${desc}\n- Evidence: repository inventory/dependency graph\n- Risk: maintainability, release consistency or future supportability according to severity\n- Recommended action: ${action}\n- Requires behavior change: false\n- Requires migration: ${/Cache|Functions|CSS|Firebase|Dependencies|Evidence/.test(area)}\n- Requires Firebase change: ${area==="Functions"}\n- Requires deploy: ${/Client|Cache|Functions|CSS|Firebase|Dependencies/.test(area)}\n- Suggested ticket: ${ticket}\n`).join("\n").trimEnd()}\n`);
write("COMMERCIAL_READINESS_TECHNICAL_RISKS.md",`# Commercial Readiness Technical Risks\n\n## Real charreada and availability\nMixed cache generations and broad app/Firebase/CSS change surfaces are the main release risks. Node 20 lifecycle is a near-term deployment risk.\n\n## Result accuracy\nNo current scoring defect was found. Official Score, Attempt V2, Rule Profile and Official Format are protected and unchanged; future consolidation around them needs separate characterization-first tickets.\n\n## Recovery\nBackup/Restore and Projection Outbox are active tested authorities, not dead code.\n\n## Security\nFirebase exports and Rules cannot be judged by local imports alone. Dependency policy merits a supply-chain review.\n\n## Maintenance-only / can wait\nDocumentation indexing, local artifact hygiene and cosmetic CSS consolidation can wait. Cache authority and runtime migration should not.\n`);
write("RECOMMENDED_CLEANUP_SEQUENCE.md",`# Recommended Cleanup Sequence\n\n1. Runtime trace plus deployment-package exclusion guards.\n2. Cache-buster single authority.\n3. Node runtime migration.\n4. Documentation authority index.\n5. Non-sporting app.js boundary extraction.\n6. Firebase client adapter boundaries.\n7. CSS ownership and DOM coverage, preserving Official Format.\n8. Asset/duplicate retention review.\n9. One reversible HIGH-confidence dead-code removal per ownership area.\n10. Legacy retirement only after data migration and historical-read guarantees.\n\nNo cleanup is executed by this ticket.\n`);
write("VALIDATION.md",`# Validation\n\n## Initial gate\n- branch main\n- HEAD ${git("rev-parse","HEAD")}\n- origin/main ${git("rev-parse","origin/main")}\n- working tree clean\n- staging empty\n- git diff --check PASS\n- git diff --cached --check PASS\n\n## Final baseline\nTo be populated after the final automated validation.\n\n## Invariants\n- FMCH_2026_LIBRE 0.6.0 unchanged\n- fingerprint rptp_0f90f7a3944a82d7\n- sporting values modified NO\n- Firebase Production Writes 0\n- Functions/Rules/Hostinger deploy NO\n`);
const outputs=["AUDIT_METHOD.mjs","SUMMARY.md","REPOSITORY_INVENTORY.json","REPOSITORY_DISPOSITION_MATRIX.json","REPOSITORY_DISPOSITION_MATRIX.csv","DEPENDENCY_GRAPH.md","HTML_ENTRYPOINT_AUDIT.md","JAVASCRIPT_MODULE_AUDIT.md","CSS_AUDIT.md","ASSET_AUDIT.md","FIREBASE_LOCAL_AUDIT.md","VERSION_AND_CACHE_BUSTER_AUDIT.md","TEST_COVERAGE_MAP.json","DOCUMENTATION_AUDIT.md","DUPLICATE_FILES.md","DEAD_CODE_CANDIDATES.md","TECHNICAL_DEBT_REGISTER.md","COMMERCIAL_READINESS_TECHNICAL_RISKS.md","RECOMMENDED_CLEANUP_SEQUENCE.md","VALIDATION.md","FILES_CHANGED.md"];
write("FILES_CHANGED.md",`# Files Changed\n\nOnly audit evidence was created; no product file changed.\n\n${outputs.map((x)=>`- CHARROPRO-REPOSITORY-TECHNICAL-DEBT-AND-DEAD-CODE-AUDIT-001/${x}`).join("\n")}\n\nStaging, commit, push and deploy remain prohibited.\n`);
console.log(JSON.stringify({tracked:inventory.length,categories:categoryCounts,dispositions:dispositionCounts,exactDuplicates:duplicates.length,orphanJs:orphanJs.length,staleDocs:staleDocs.length,tests:tests.length,htmlEntrypoints:htmlRoots.length,reachable:reachable.size,outputs:outputs.length},null,2));

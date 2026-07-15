import assert from "node:assert/strict";
import * as routingApi from "../js/broadcast/outputRouting.js";
import {
  OUTPUT_ROUTING_VERSION,
  OUTPUT_ROUTE_ERROR_CODES,
  OUTPUT_ROUTE_STATES,
  OUTPUT_ROUTE_TYPES,
  OUTPUT_ROUTE_VISIBILITIES,
  BroadcastOutputRoutingError,
  buildOutputRoutingSnapshot,
  clearOutputRoute,
  cloneOutputRoutingResult,
  createOutputRoute,
  createOutputRoutingEngine,
  destroyOutputRoutingEngine,
  disableOutputRoute,
  enableOutputRoute,
  getOutputRoute,
  getOutputRoutingErrors,
  getOutputRoutingStatus,
  getOutputRoutingWarnings,
  listOutputRoutes,
  removeOutputRoute,
  resolveOutputRoute,
  routeAnnouncerMonitor,
  routeProgramToOutput,
  routeTimerDisplay,
  updateOutputRoute,
  validateOutputRoute,
  validateOutputRoutingSnapshot
} from "../js/broadcast/outputRouting.js";

const T0 = "2026-07-15T18:00:00.000Z";
const T1 = "2026-07-15T18:00:01.000Z";
const T2 = "2026-07-15T18:00:02.000Z";
const T3 = "2026-07-15T18:01:00.000Z";

function routeDefinition(routeType, overrides = {}) {
  const definitions = {
    program_main: {
      routeId: "route-program-main",
      outputId: "program-main",
      sourceType: "program_snapshot",
      visibility: "public"
    },
    announcer_monitor: {
      routeId: "route-announcer-monitor",
      outputId: "announcer-monitor",
      sourceType: "announcer_projection",
      visibility: "operational"
    },
    timer_display: {
      routeId: "route-timer-display",
      outputId: "timer-display",
      sourceType: "timer_projection",
      visibility: "public"
    }
  };
  return {
    ...definitions[routeType],
    routeType,
    tenantId: "tenant_a",
    tournamentId: "tournament_a",
    competitionId: "competition_a",
    staleAfterMs: 15000,
    ...overrides
  };
}

function validProgramSnapshot(overrides = {}) {
  const program = {
    programId: "program_official_1",
    createdAt: T0,
    updatedAt: T1,
    revision: 3,
    status: "program",
    visibility: "public",
    output: {
      outputId: "program_1080",
      type: "program",
      orientation: "landscape",
      resolution: { width: 1920, height: 1080 },
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 }
    },
    previewId: "preview_official_1",
    themeRenderId: "theme_render_1",
    templateRenderId: "template_render_1",
    templateId: "template_scoreboard",
    themeId: "theme_default",
    templateInstanceId: "template_instance_1",
    transitionMode: "take",
    components: [{ componentId: "scoreboard_1", visible: true, value: 0 }],
    warnings: [],
    errors: [],
    ...(overrides.program || {})
  };
  return {
    snapshotVersion: "1.0.0",
    generatedAt: T1,
    state: "program",
    revision: 4,
    visibility: "public",
    program,
    warnings: [],
    errors: [],
    tenantId: "tenant_a",
    tournamentId: "tournament_a",
    competitionId: "competition_a",
    ...overrides,
    program: Object.prototype.hasOwnProperty.call(overrides, "program")
      ? (overrides.program === null ? null : { ...program, ...overrides.program })
      : program
  };
}

function announcerSources(overrides = {}) {
  return {
    sourceRevision: 8,
    visibility: "operational",
    tenantId: "tenant_a",
    tournamentId: "tournament_a",
    competitionId: "competition_a",
    contract: {
      revision: 8,
      visibility: "operational",
      tournament: { id: "tournament_a", name: "Campeonato CharroPro", status: "live", venue: "Lienzo Central" },
      competition: { id: "competition_a", type: "equipos_completo", name: "Competencia por equipos", scope: "team", phase: "Final" },
      charreada: { id: "charreada_1", name: "Charreada Final", status: "live", date: "2026-07-15", startTime: "18:00" },
      suerte: { id: "colas", name: "Colas", status: "active", attempt: 2, maxAttempts: 3 },
      team: { id: "team_1", name: "Rancho El Laurel", total: 312, position: 1 },
      participant: { id: "participant_1", name: "Juan Pérez", association: "Jalisco", position: 1 },
      horse: { id: "horse_1", name: "Lucero", owner: "Privado" },
      score: { id: "score_1", total: 36, status: "published", published: true },
      ranking: { currentPosition: 1, entries: [{ id: "team_1", name: "Rancho El Laurel", position: 1, total: 312 }] },
      timer: { id: "timer_1", display: "00:42.18", status: "running", revision: 7 },
      sponsor: { active: { id: "sponsor_1", name: "Patrocinador Principal" } }
    },
    next: { team: { id: "team_2", name: "Tres Regalos" }, participant: { id: "participant_2", name: "Pedro López" } },
    notes: ["Mencionar campeonato nacional"],
    privateNotes: ["Nota privada de producción"],
    alerts: ["Preparar siguiente participante"],
    judge: { id: "judge_private", name: "No publicar" },
    token: "secret-token",
    ...overrides
  };
}

function timerState(status = "running", revision = 7, overrides = {}) {
  return {
    timerId: "timer_official_1",
    status,
    formattedTime: "00:42.18",
    elapsedMs: 42180,
    remainingMs: null,
    startedAt: T0,
    pausedAt: status === "paused" ? T1 : null,
    stoppedAt: new Set(["stopped", "finished"]).has(status) ? T1 : null,
    sourceRevision: revision,
    contextRef: {
      tournamentId: "tournament_a",
      competitionId: "competition_a",
      charreadaId: "charreada_1",
      teamId: "team_1",
      participantId: "participant_1",
      suerteId: "colas"
    },
    generatedAt: T1,
    alertState: status === "finished" ? "limit" : null,
    visibility: "public",
    tenantId: "tenant_a",
    ...overrides
  };
}

const requiredExports = [
  "OUTPUT_ROUTING_VERSION", "OUTPUT_ROUTE_TYPES", "OUTPUT_ROUTE_STATES", "OUTPUT_ROUTE_VISIBILITIES",
  "OUTPUT_ROUTE_ERROR_CODES", "BroadcastOutputRoutingError", "createOutputRoutingEngine",
  "destroyOutputRoutingEngine", "createOutputRoute", "updateOutputRoute", "removeOutputRoute",
  "enableOutputRoute", "disableOutputRoute", "resolveOutputRoute", "validateOutputRoute",
  "routeProgramToOutput", "routeAnnouncerMonitor", "routeTimerDisplay", "getOutputRoute",
  "listOutputRoutes", "getOutputRoutingStatus", "getOutputRoutingWarnings", "getOutputRoutingErrors",
  "buildOutputRoutingSnapshot", "validateOutputRoutingSnapshot", "cloneOutputRoutingResult"
];
requiredExports.forEach((name) => assert.equal(typeof routingApi[name] === "function" || name.startsWith("OUTPUT_"), true, `${name} missing`));
assert.equal(OUTPUT_ROUTING_VERSION, "1.0.0");
assert.deepEqual(OUTPUT_ROUTE_TYPES, ["program_main", "announcer_monitor", "timer_display"]);
assert.equal(OUTPUT_ROUTE_STATES.includes("destroyed"), true);
assert.equal(OUTPUT_ROUTE_VISIBILITIES.includes("restricted"), true);
assert.equal(OUTPUT_ROUTE_ERROR_CODES.includes("output-route-revision-conflict"), true);
assert.equal(BroadcastOutputRoutingError.prototype instanceof Error, true);

// Lifecycle, exact routes and idempotent creation.
const engine = createOutputRoutingEngine({ engineId: "routing_engine_test", now: T0 });
assert.deepEqual(getOutputRoutingStatus(engine, { now: T0 }), {
  engineId: "routing_engine_test", state: "ready", revision: 0, routes: 0, enabled: 0, routed: 0, stale: 0, updatedAt: T0
});
const programRoute = createOutputRoute(engine, routeDefinition("program_main"), { now: T0, idempotencyKey: "create_program" });
const sameProgramRoute = createOutputRoute(engine, routeDefinition("program_main"), { now: T1, idempotencyKey: "create_program" });
assert.deepEqual(sameProgramRoute, programRoute);
assert.equal(listOutputRoutes(engine).length, 1);
assert.throws(
  () => createOutputRoute(engine, routeDefinition("timer_display"), { idempotencyKey: "create_program" }),
  (error) => error.code === "output-route-idempotency-conflict"
);
createOutputRoute(engine, routeDefinition("announcer_monitor"), { now: T0 });
createOutputRoute(engine, routeDefinition("timer_display"), { now: T0 });
assert.equal(listOutputRoutes(engine).length, 3);
assert.deepEqual(listOutputRoutes(engine).map((route) => route.outputId), ["announcer-monitor", "program-main", "timer-display"]);

// Route definition validation and compatibility are strict.
assert.equal(validateOutputRoute(programRoute).valid, true);
assert.throws(
  () => createOutputRoute(createOutputRoutingEngine(), routeDefinition("program_main", { sourceType: "timer_projection" })),
  (error) => error.code === "output-route-invalid"
);
assert.throws(
  () => createOutputRoute(createOutputRoutingEngine(), routeDefinition("announcer_monitor", { visibility: "public" })),
  (error) => error.code === "output-route-invalid"
);
assert.throws(
  () => createOutputRoute(createOutputRoutingEngine(), routeDefinition("program_main", { metadata: { url: "javascript:alert(1)" } })),
  (error) => error.code === "output-route-unsafe"
);

// Program Main reads only a validated official Program snapshot and never mutates it.
const sourceProgram = validProgramSnapshot();
const sourceProgramClone = structuredClone(sourceProgram);
let programResult = routeProgramToOutput(engine, "route-program-main", sourceProgram, {
  now: T2,
  context: { tenantId: "tenant_a", tournamentId: "tournament_a", competitionId: "competition_a" }
});
assert.equal(programResult.status, "routed");
assert.equal(programResult.projection.kind, "program-main");
assert.equal(programResult.projection.programId, "program_official_1");
assert.equal(programResult.projection.themeId, "theme_default");
assert.equal(programResult.projection.templateId, "template_scoreboard");
assert.equal(programResult.projection.components[0].value, 0);
assert.equal(JSON.stringify(programResult).includes("runtime"), false);
assert.equal(JSON.stringify(programResult).includes("tenantId"), false);
assert.deepEqual(sourceProgram, sourceProgramClone);

const emptyProgram = validProgramSnapshot({ program: null, state: "ready" });
const emptyResult = routeProgramToOutput(engine, "route-program-main", emptyProgram, {
  now: T2,
  context: { tenantId: "tenant_a", tournamentId: "tournament_a", competitionId: "competition_a" }
});
assert.equal(emptyResult.status, "controlled-empty");
assert.equal(emptyResult.projection.program, null);
assert.throws(
  () => routeProgramToOutput(engine, "route-program-main", { snapshotVersion: "1.0.0", generatedAt: T1, program: { invalid: true } }),
  (error) => error.code === "output-route-program-snapshot-invalid"
);

// Explicit stale evaluation keeps the last projection and reports why it is behind.
programResult = routeProgramToOutput(engine, "route-program-main", validProgramSnapshot(), {
  now: T3,
  currentSourceRevision: 9,
  context: { tenantId: "tenant_a", tournamentId: "tournament_a", competitionId: "competition_a" }
});
assert.equal(programResult.status, "stale");
assert.equal(programResult.warnings.includes("output-route-source-revision-behind"), true);
assert.equal(getOutputRoute(engine, "route-program-main", { now: T3 }).projection.programId, "program_official_1");

// Announcer Monitor is operational/restricted, declarative and read-only.
const announcerInput = announcerSources({ notes: ["<script>alert(1)</script>", "Mensaje seguro"] });
const announcerClone = structuredClone(announcerInput);
const announcerResult = routeAnnouncerMonitor(engine, "route-announcer-monitor", announcerInput, {
  now: T2,
  visibility: "operational",
  context: { tenantId: "tenant_a", tournamentId: "tournament_a", competitionId: "competition_a" }
});
assert.equal(announcerResult.visibility, "operational");
assert.equal(announcerResult.projection.current.team.name, "Rancho El Laurel");
assert.equal(announcerResult.projection.current.participant.name, "Juan Pérez");
assert.equal(announcerResult.projection.current.horse.name, "Lucero");
assert.equal(announcerResult.projection.current.score.total, 36);
assert.equal(announcerResult.projection.next.team.name, "Tres Regalos");
assert.equal(announcerResult.projection.timer.display, "00:42.18");
assert.equal(announcerResult.projection.sponsorMention.name, "Patrocinador Principal");
assert.equal(announcerResult.projection.notes[0].includes("&lt;script"), true);
assert.equal("privateNotes" in announcerResult.projection, false);
for (const forbidden of ["judge_private", "token", "secret-token", "controls", "Program", "Preview"]) {
  assert.equal(JSON.stringify(announcerResult).includes(forbidden), false, `${forbidden} leaked`);
}
assert.deepEqual(announcerInput, announcerClone);
const restrictedAnnouncer = routeAnnouncerMonitor(engine, "route-announcer-monitor", announcerSources({ sourceRevision: 9 }), {
  now: T2,
  visibility: "restricted",
  context: { tenantId: "tenant_a", tournamentId: "tournament_a", competitionId: "competition_a" }
});
assert.equal(restrictedAnnouncer.visibility, "restricted");
assert.deepEqual(restrictedAnnouncer.projection.privateNotes, ["Nota privada de producción"]);
const noRanking = routeAnnouncerMonitor(engine, "route-announcer-monitor", announcerSources({ sourceRevision: 10, standings: [], contract: { ...announcerSources().contract, ranking: {} } }), {
  now: T2,
  context: { tenantId: "tenant_a", tournamentId: "tournament_a", competitionId: "competition_a" }
});
assert.equal(noRanking.warnings.includes("output-route-announcer-ranking-unavailable"), true);

// Timer Display preserves official time and revision; it never creates controls or a second clock.
let timerRevision = 20;
for (const status of ["ready", "running", "paused", "stopped", "finished", "unavailable", "stale", "offline"]) {
  const input = timerState(status, timerRevision++);
  const inputClone = structuredClone(input);
  const result = routeTimerDisplay(engine, "route-timer-display", input, {
    now: T2,
    context: { tenantId: "tenant_a", tournamentId: "tournament_a", competitionId: "competition_a" }
  });
  assert.equal(result.projection.status, status);
  assert.equal(result.projection.formattedTime, "00:42.18");
  assert.equal(result.projection.elapsedMs, 42180);
  assert.equal(result.projection.sourceRevision, input.sourceRevision);
  assert.equal("controls" in result.projection, false);
  assert.equal("interval" in result.projection, false);
  assert.deepEqual(input, inputClone);
}

// Expected revision failures are atomic.
const beforeConflict = getOutputRoute(engine, "route-timer-display", { now: T2 });
assert.throws(
  () => disableOutputRoute(engine, "route-timer-display", { expectedRevision: beforeConflict.revision - 1, now: T3 }),
  (error) => error.code === "output-route-revision-conflict"
);
assert.deepEqual(getOutputRoute(engine, "route-timer-display", { now: T2 }), beforeConflict);

// Disable/enable/clear are isolated by route.
const programBeforeTimerDisable = getOutputRoute(engine, "route-program-main", { now: T2 });
let timerRoute = disableOutputRoute(engine, "route-timer-display", { expectedRevision: beforeConflict.revision, now: T2 });
assert.equal(timerRoute.status, "disabled");
assert.throws(() => routeTimerDisplay(engine, "route-timer-display", timerState("running", 40)), (error) => error.code === "output-route-disabled");
assert.deepEqual(getOutputRoute(engine, "route-program-main", { now: T2 }), programBeforeTimerDisable);
timerRoute = enableOutputRoute(engine, "route-timer-display", { expectedRevision: timerRoute.revision, now: T2 });
assert.equal(timerRoute.enabled, true);
const announcerBeforeClear = getOutputRoute(engine, "route-announcer-monitor", { now: T2 });
const clearedProgram = clearOutputRoute(engine, "route-program-main", { now: T2 });
assert.equal(clearedProgram.status, "cleared");
assert.equal(clearedProgram.projection, null);
assert.deepEqual(getOutputRoute(engine, "route-announcer-monitor", { now: T2 }), announcerBeforeClear);

// Idempotent update/resolve do not duplicate revisions, while changed intent conflicts.
const routeBeforeIdempotentUpdate = getOutputRoute(engine, "route-program-main", { now: T2 });
const updatedOnce = updateOutputRoute(engine, "route-program-main", { name: "Main Program Route" }, {
  expectedRevision: routeBeforeIdempotentUpdate.revision,
  idempotencyKey: "update_program_name",
  now: T2
});
const updatedTwice = updateOutputRoute(engine, "route-program-main", { name: "Main Program Route" }, {
  expectedRevision: routeBeforeIdempotentUpdate.revision,
  idempotencyKey: "update_program_name",
  now: T3
});
assert.deepEqual(updatedTwice, updatedOnce);
assert.equal(getOutputRoute(engine, "route-program-main", { now: T2 }).revision, updatedOnce.revision);
assert.throws(
  () => updateOutputRoute(engine, "route-program-main", { name: "Different" }, { idempotencyKey: "update_program_name" }),
  (error) => error.code === "output-route-idempotency-conflict"
);

const resolveKeyProgram = validProgramSnapshot({ program: { revision: 50, updatedAt: T2 } });
const resolvedOnce = routeProgramToOutput(engine, "route-program-main", resolveKeyProgram, {
  now: T2,
  idempotencyKey: "resolve_program_50",
  context: { tenantId: "tenant_a", tournamentId: "tournament_a", competitionId: "competition_a" }
});
const resolvedTwice = routeProgramToOutput(engine, "route-program-main", resolveKeyProgram, {
  now: T3,
  idempotencyKey: "resolve_program_50",
  context: { tenantId: "tenant_a", tournamentId: "tournament_a", competitionId: "competition_a" }
});
assert.deepEqual(resolvedTwice, resolvedOnce);

// Multi-tenant and global/private boundaries never fall back across scopes.
assert.throws(
  () => routeProgramToOutput(engine, "route-program-main", { ...validProgramSnapshot(), tenantId: "tenant_b" }, {
    context: { tenantId: "tenant_b", tournamentId: "tournament_a", competitionId: "competition_a" }
  }),
  (error) => error.code === "output-route-tenant-conflict"
);
assert.throws(
  () => routeAnnouncerMonitor(engine, "route-announcer-monitor", announcerSources({ tenantId: "tenant_b" }), {
    context: { tenantId: "tenant_b", tournamentId: "tournament_a", competitionId: "competition_a" }
  }),
  (error) => error.code === "output-route-tenant-conflict"
);
assert.throws(
  () => routeTimerDisplay(engine, "route-timer-display", timerState("running", 51, { tenantId: "tenant_b" }), {
    context: { tenantId: "tenant_b", tournamentId: "tournament_a", competitionId: "competition_a" }
  }),
  (error) => error.code === "output-route-tenant-conflict"
);
const globalEngine = createOutputRoutingEngine({ now: T0 });
createOutputRoute(globalEngine, routeDefinition("announcer_monitor", {
  tenantId: null, tournamentId: null, competitionId: null, scope: "global"
}), { now: T0 });
assert.throws(
  () => routeAnnouncerMonitor(globalEngine, "route-announcer-monitor", announcerSources(), { now: T1 }),
  (error) => error.code === "output-route-scope-conflict"
);

// Security cloning avoids getters, cycles, executable values and prototype pollution.
let getterExecuted = false;
const hostileSource = announcerSources({
  sourceRevision: 60,
  notes: ["<img src=x onerror=alert(1)>", "javascript:alert(1)", "data:text/html,<iframe></iframe>"],
  fn: () => "unsafe",
  symbol: Symbol("unsafe"),
  big: 1n
});
Object.defineProperty(hostileSource, "computed", { enumerable: true, get: () => { getterExecuted = true; return "unsafe"; } });
Object.defineProperty(hostileSource, "__proto__", { enumerable: true, value: { polluted: true } });
hostileSource.loop = hostileSource;
const hostileResult = routeAnnouncerMonitor(engine, "route-announcer-monitor", hostileSource, {
  now: T2,
  context: { tenantId: "tenant_a", tournamentId: "tournament_a", competitionId: "competition_a" }
});
assert.equal(getterExecuted, false);
assert.equal(Object.prototype.polluted, undefined);
assert.equal(JSON.stringify(hostileResult).includes("onerror="), true);
assert.equal(JSON.stringify(hostileResult).includes("<img"), false);
assert.equal(JSON.stringify(hostileResult).includes("javascript:"), false);
assert.doesNotThrow(() => JSON.stringify(hostileResult));

// Snapshot is serializable, detached and visibility-aware.
const publicSnapshot = buildOutputRoutingSnapshot(engine, { visibility: "public", now: T2 });
assert.equal(validateOutputRoutingSnapshot(publicSnapshot).valid, true);
assert.doesNotThrow(() => JSON.stringify(publicSnapshot));
for (const forbidden of ["runtime", "renderer", "listener", "actor", "tenantId", "signedUrl", "secret", "programId"]) {
  assert.equal(JSON.stringify(publicSnapshot).includes(forbidden), false, `${forbidden} leaked in public snapshot`);
}
publicSnapshot.routes[0].name = "mutated";
assert.notEqual(getOutputRoute(engine, publicSnapshot.routes[0].routeId).name, "mutated");
const restrictedSnapshot = buildOutputRoutingSnapshot(engine, { visibility: "restricted", now: T2 });
assert.equal(restrictedSnapshot.routes.some((route) => route.tenantId === "tenant_a"), true);
assert.equal(getOutputRoutingWarnings(engine, { now: T2 }).every((entry) => typeof entry === "string"), true);
assert.deepEqual(getOutputRoutingErrors(engine), []);
assert.deepEqual(cloneOutputRoutingResult({ zero: 0, no: false, empty: "", nullable: null }), { zero: 0, no: false, empty: "", nullable: null });

// Remove is controlled and destroy is terminal.
const removalEngine = createOutputRoutingEngine({ now: T0 });
const removable = createOutputRoute(removalEngine, routeDefinition("timer_display"), { now: T0 });
const removed = removeOutputRoute(removalEngine, removable.routeId, {
  expectedRevision: removable.revision,
  idempotencyKey: "remove_timer",
  now: T1
});
assert.equal(removed.routeId, removable.routeId);
assert.equal(getOutputRoute(removalEngine, removable.routeId), null);
const removedAgain = removeOutputRoute(removalEngine, removable.routeId, {
  expectedRevision: removable.revision,
  idempotencyKey: "remove_timer",
  now: T2
});
assert.deepEqual(removedAgain, removed);

destroyOutputRoutingEngine(engine, { now: T3 });
assert.equal(engine.state, "destroyed");
for (const operation of [
  () => createOutputRoute(engine, routeDefinition("program_main")),
  () => updateOutputRoute(engine, "route-program-main", { name: "x" }),
  () => removeOutputRoute(engine, "route-program-main"),
  () => enableOutputRoute(engine, "route-program-main"),
  () => disableOutputRoute(engine, "route-program-main"),
  () => clearOutputRoute(engine, "route-program-main"),
  () => resolveOutputRoute(engine, "route-program-main", {}),
  () => getOutputRoute(engine, "route-program-main"),
  () => listOutputRoutes(engine),
  () => getOutputRoutingStatus(engine),
  () => buildOutputRoutingSnapshot(engine)
]) {
  assert.throws(operation, (error) => error.code === "output-routing-destroyed");
}

console.log("broadcast-output-routing.test.mjs: ok");

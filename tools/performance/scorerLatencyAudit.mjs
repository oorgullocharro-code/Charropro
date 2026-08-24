#!/usr/bin/env node
import { performance } from "node:perf_hooks";
import { createLocalRuntimeSeedFixture } from "../development/localRuntimeSeed.mjs";
import { createAfterPaintTaskQueue, createScorerDuplicateActionGuard } from "../../js/core/scorerInteractionLatency.js";

const ITERATIONS = 120;
const fixture = structuredClone(createLocalRuntimeSeedFixture());
const sampleState = {
  ...fixture,
  scores: Object.fromEntries(Array.from({ length: 120 }, (_, index) => [`score-${index}`, Array.from({ length: 5 }, () => ({
    base: 20,
    adic: 8,
    infr: 3,
    applied: ["base", "adic-a", "infr-a"],
    ruleQuantities: { "adic-a": 2, "infr-a": 1 }
  }))]))
};
const buttonModels = Array.from({ length: 110 }, (_, index) => ({ id: `rule-${index}`, active: index % 7 === 0, value: index % 20 }));

const baselineInteraction = measure(ITERATIONS, () => {
  buttonModels[0].active = !buttonModels[0].active;
  JSON.stringify(sampleState);
  renderSyntheticScorer(buttonModels);
});

const immediateFeedback = measure(ITERATIONS, () => {
  buttonModels[0].pressed = true;
});

const baselineTransition = measure(ITERATIONS, () => {
  JSON.stringify({ running: false, elapsedMs: 0, revision: 1 });
  JSON.stringify(sampleState);
  renderSyntheticScorer(buttonModels);
});

const optimizedTransition = measure(ITERATIONS, () => {
  renderSyntheticScorer(buttonModels);
});

const frames = [];
const tasks = [];
const deferred = [];
const queue = createAfterPaintTaskQueue({
  scheduleFrame: (callback) => frames.push(callback),
  scheduleTask: (callback) => tasks.push(callback)
});
queue.schedule("draft", () => deferred.push("first"));
queue.schedule("draft", () => deferred.push("latest"));
frames.shift()();
tasks.shift()();

let now = 0;
const guard = createScorerDuplicateActionGuard({ now: () => now });
const firstTap = guard.accept("toggle-rule", { type: "adic", id: "rule-1" });
now = 100;
const duplicateTap = guard.accept("toggle-rule", { type: "adic", id: "rule-1" });
const separateTap = guard.accept("toggle-rule", { type: "adic", id: "rule-2" });

process.stdout.write(`${JSON.stringify({
  metricScope: "NODE_SYNTHETIC",
  iterations: ITERATIONS,
  stateBytes: Buffer.byteLength(JSON.stringify(sampleState)),
  interaction: { baselineMs: summarize(baselineInteraction), immediateFeedbackMs: summarize(immediateFeedback) },
  suerteTransition: { baselineMs: summarize(baselineTransition), optimizedCriticalPathMs: summarize(optimizedTransition) },
  afterPaintCoalescing: { callbacks: deferred, pass: deferred.length === 1 && deferred[0] === "latest" },
  duplicateTap: { firstAccepted: firstTap.accepted, duplicateRejected: !duplicateTap.accepted, differentControlAccepted: separateTap.accepted }
}, null, 2)}\n`);

function renderSyntheticScorer(buttons) {
  return `<main>${buttons.map((button) => `<button class="${button.active ? "active" : ""}">${button.id}:${button.value}</button>`).join("")}</main>`;
}

function measure(iterations, callback) {
  const samples = [];
  for (let index = 0; index < iterations; index += 1) {
    const startedAt = performance.now();
    callback();
    samples.push(performance.now() - startedAt);
  }
  return samples;
}

function summarize(samples) {
  const ordered = [...samples].sort((left, right) => left - right);
  const percentile = (ratio) => ordered[Math.max(0, Math.ceil(ordered.length * ratio) - 1)];
  return {
    p50: round(percentile(0.5)),
    p95: round(percentile(0.95)),
    max: round(ordered[ordered.length - 1])
  };
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

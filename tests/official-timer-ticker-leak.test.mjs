import assert from "node:assert/strict";
import { createOfficialTimerTicker } from "../js/core/officialTimerLiveDisplay.js?v=20260831-official-field-timer-responsive-display-recovery-001-v1";

let nextId = 0;
const pending = new Map();
const ticker = createOfficialTimerTicker({
  cadenceMs: 100,
  now: () => 1000,
  setTimeout(callback) {
    const id = ++nextId;
    pending.set(id, callback);
    return id;
  },
  clearTimeout(id) {
    pending.delete(id);
  }
});

for (let index = 0; index < 100; index += 1) {
  const subscription = ticker.subscribe(() => {}, { active: true });
  assert.equal(ticker.diagnostics().subscribers, 1);
  assert.equal(ticker.diagnostics().activeSubscribers, 1);
  assert.equal(pending.size, 1, "only one shared scheduled tick is allowed");
  subscription.unsubscribe();
  assert.equal(ticker.diagnostics().subscribers, 0);
  assert.equal(pending.size, 0);
}

const a = ticker.subscribe(() => {}, { active: true });
const b = ticker.subscribe(() => {}, { active: true });
assert.equal(ticker.diagnostics().activeSubscribers, 2);
assert.equal(pending.size, 1, "multiple consumers still share one scheduler");
a.unsubscribe();
b.unsubscribe();
ticker.destroy();
assert.deepEqual(ticker.diagnostics(), { subscribers: 0, activeSubscribers: 0, scheduled: false, ticks: 0, cadenceMs: 100 });

console.log("official-timer-ticker-leak.test.mjs: ok");

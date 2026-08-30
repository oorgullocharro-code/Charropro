import assert from "node:assert/strict";

const nodes = [];
const scheduled = [];
const root = { appendChild(node) { node.isConnected = true; nodes.push(node); } };
globalThis.document = {
  getElementById(id) { return id === "toast-root" ? root : null; },
  createElement() {
    return {
      isConnected: false,
      remove() { this.isConnected = false; }
    };
  }
};
globalThis.window = { setTimeout(callback) { scheduled.push(callback); return scheduled.length; } };

const { showToast } = await import("../js/core/dom.js?v=20260829-official-timer-overtime-rtdb-rules-compatibility-001-v1");
const message = "No se pudo registrar la decision de Revision de Freno.";
const first = showToast(message);
const duplicate = showToast(message);
assert.equal(first, duplicate);
assert.equal(nodes.length, 1, "one logical error creates one visible toast");
showToast("Otro error independiente");
assert.equal(nodes.length, 2);

console.log("brake-review-error-toast-dedup.test.mjs: ok");

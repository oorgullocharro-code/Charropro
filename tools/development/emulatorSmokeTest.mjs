import assert from "node:assert/strict";
import http from "node:http";

const projectId = process.env.FIREBASE_PROJECT_ID || "demo-charropro-local";

function request(port, pathname) {
  return new Promise((resolve, reject) => {
    const requestHandle = http.request({ host: "127.0.0.1", port, path: pathname, method: "GET", timeout: 5000 }, (response) => {
      response.resume();
      response.once("end", () => resolve({ port, statusCode: response.statusCode || 0 }));
    });
    requestHandle.once("timeout", () => requestHandle.destroy(new Error(`timeout:${port}`)));
    requestHandle.once("error", reject);
    requestHandle.end();
  });
}

const checks = await Promise.all([
  request(9000, `/.json?ns=${encodeURIComponent(`${projectId}-default-rtdb`)}`),
  request(9099, `/emulator/v1/projects/${encodeURIComponent(projectId)}/accounts`),
  request(9199, `/v0/b/${encodeURIComponent(`${projectId}.appspot.com`)}/o`),
  request(5001, `/${encodeURIComponent(projectId)}/us-central1/infrastructureHealth`)
]);

for (const check of checks) {
  assert.ok(check.statusCode >= 200 && check.statusCode < 500, `emulator did not provide an HTTP response on port ${check.port}`);
}

process.stdout.write(`${JSON.stringify({ projectId, endpoints: checks, writes: 0 }, null, 2)}\n`);

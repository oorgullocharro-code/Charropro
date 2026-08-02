#!/usr/bin/env node
import http from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIRECTORY = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const host = "127.0.0.1";
const port = Number(process.env.CHARROPRO_LOCAL_WEB_PORT || process.argv[2] || 8765);
const CONTENT_TYPES = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
});

if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("local-web-server-port-invalid");

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url || "/", `http://${host}:${port}`).pathname);
  const requested = pathname === "/" ? "/index.html" : pathname;
  const filePath = resolve(ROOT_DIRECTORY, `.${requested}`);
  if (!filePath.startsWith(`${ROOT_DIRECTORY}/`) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type": CONTENT_TYPES[extname(filePath).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store",
    "X-CharroPro-Environment": "LOCAL / EMULATOR"
  });
  response.end(readFileSync(filePath));
});

server.listen(port, host, () => {
  process.stdout.write(`CharroPro Local available at http://${host}:${port}/index.html\n`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => server.close(() => process.exit(0)));
}

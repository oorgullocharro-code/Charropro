import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { sha256, sha256Fallback } from "../js/core/configurationBootstrap.js?v=20260831-official-ranking-authority-public-parity-compatibility-001-v1";

assert.equal(sha256Fallback("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
assert.equal(sha256Fallback("CharroPro LAN local"), await sha256("CharroPro LAN local"));

const bootstrap = JSON.parse(readFileSync(new URL("../functions/configuration.defaults.json", import.meta.url), "utf8"));
const payload = structuredClone(bootstrap);
delete payload.checksum;
delete payload.fingerprint;
const canonicalize = (value) => Array.isArray(value)
  ? `[${value.map(canonicalize).join(",")}]`
  : value && typeof value === "object"
    ? `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`
    : JSON.stringify(value);
assert.equal(sha256Fallback(canonicalize(payload)), bootstrap.checksum);

process.stdout.write("configuration bootstrap LAN fallback tests passed\n");

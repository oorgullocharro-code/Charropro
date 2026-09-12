"use strict";

const crypto = require("node:crypto");

const MIME_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"]
]);
const LIMITS = Object.freeze({ cover: 5 * 1024 * 1024, liveCover: 5 * 1024 * 1024, logo: 2 * 1024 * 1024, sponsor: 2 * 1024 * 1024 });
const ID_PATTERN = /^[A-Za-z0-9_-]{1,180}$/;

class TournamentPublicBrandingAssetError extends Error {
  constructor(code) { super(code); this.code = code; }
}

function prepareTournamentPublicBrandingAssetUpload(input = {}, options = {}) {
  const tournamentId = cleanId(input.tournamentId);
  const requestedKind = String(input.kind || "").trim().toLowerCase();
  const kind = requestedKind === "livecover" || requestedKind === "live-cover" ? "liveCover" : requestedKind;
  const sponsorId = kind === "sponsor" ? cleanId(input.sponsorId) : "";
  const mimeType = String(input.mimeType || "").trim().toLowerCase();
  if (!tournamentId || !LIMITS[kind] || (kind === "sponsor" && !sponsorId) || !MIME_TYPES.has(mimeType)) {
    throw new TournamentPublicBrandingAssetError("public-branding-asset-request-invalid");
  }
  const content = decodeBase64(input.contentBase64);
  if (!content.length || content.length > LIMITS[kind] || !isImageSignature(content, mimeType)) {
    throw new TournamentPublicBrandingAssetError("public-branding-asset-content-invalid");
  }
  const version = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
  const folder = kind === "sponsor" ? `sponsors/${sponsorId}` : `branding/${kind === "liveCover" ? "live-cover" : kind}`;
  const objectPath = `charropro/tournaments/${tournamentId}/public/${folder}/${version}.${MIME_TYPES.get(mimeType)}`;
  return Object.freeze({ tournamentId, kind, sponsorId, mimeType, content, objectPath });
}

function buildTournamentPublicBrandingAssetUrl(bucketName, objectPath) {
  const bucket = String(bucketName || "").trim();
  if (!bucket || !String(objectPath || "").startsWith("charropro/tournaments/")) {
    throw new TournamentPublicBrandingAssetError("public-branding-asset-path-invalid");
  }
  return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(objectPath)}?alt=media`;
}

function cleanId(value) {
  const id = String(value || "").trim();
  return ID_PATTERN.test(id) ? id : "";
}

function decodeBase64(value) {
  const raw = String(value || "").replace(/^data:[^;]+;base64,/i, "").replace(/\s/g, "");
  if (!raw || !/^[A-Za-z0-9+/]*={0,2}$/.test(raw) || raw.length % 4 !== 0) {
    throw new TournamentPublicBrandingAssetError("public-branding-asset-base64-invalid");
  }
  const buffer = Buffer.from(raw, "base64");
  if (buffer.toString("base64") !== raw) throw new TournamentPublicBrandingAssetError("public-branding-asset-base64-invalid");
  return buffer;
}

function isImageSignature(buffer, mimeType) {
  if (mimeType === "image/jpeg") return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/png") return buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === "image/webp") return buffer.length > 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
}

module.exports = { LIMITS, MIME_TYPES, TournamentPublicBrandingAssetError, prepareTournamentPublicBrandingAssetUpload, buildTournamentPublicBrandingAssetUrl };

export const TOURNAMENT_PUBLIC_ASSET_MIME_TYPES = Object.freeze([
  "image/jpeg", "image/png", "image/webp"
]);

export const TOURNAMENT_PUBLIC_ASSET_LIMITS = Object.freeze({
  cover: 5 * 1024 * 1024,
  logo: 2 * 1024 * 1024,
  sponsor: 2 * 1024 * 1024
});

const ID_PATTERN = /^[A-Za-z0-9_-]{1,180}$/;
const URL_PATTERN = /^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\/charropro%2Ftournaments%2F[A-Za-z0-9_-]+%2Fpublic%2F/i;
const TIERS = new Set(["principal", "presentador", "oro", "plata", "colaborador"]);
const PLACEMENTS = new Set(["hero", "header", "results", "timeline", "footer"]);

export function normalizeTournamentPublicBranding(value = {}) {
  return compact({
    logoUrl: publicAssetUrl(value.logoUrl),
    coverImageUrl: publicAssetUrl(value.coverImageUrl)
  });
}

export function normalizeTournamentPublicSponsors(value = []) {
  const entries = Array.isArray(value) ? value : Object.values(value || {});
  return entries
    .map((entry) => normalizeTournamentPublicSponsor(entry))
    .filter(Boolean)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.sponsorId.localeCompare(right.sponsorId));
}

export function tournamentPublicSponsorsRecord(value = []) {
  return Object.fromEntries(normalizeTournamentPublicSponsors(value)
    .map((sponsor) => [sponsor.sponsorId, { ...sponsor }]));
}

export function normalizeTournamentPublicSponsor(value = {}) {
  const sponsorId = id(value.sponsorId || value.id);
  const name = text(value.name, 120);
  if (!sponsorId || !name) return null;
  return Object.freeze({
    sponsorId,
    name,
    logoUrl: publicAssetUrl(value.logoUrl),
    enabled: value.enabled !== false,
    sortOrder: nonNegativeInteger(value.sortOrder ?? value.order),
    tier: TIERS.has(value.tier) ? value.tier : "colaborador",
    placement: PLACEMENTS.has(value.placement) ? value.placement : "hero"
  });
}

export function createTournamentPublicSponsor(input = {}, options = {}) {
  const sponsorId = id(input.sponsorId) || id(options.sponsorId);
  return normalizeTournamentPublicSponsor({
    sponsorId,
    name: input.name,
    logoUrl: input.logoUrl,
    enabled: input.enabled,
    sortOrder: input.sortOrder ?? options.sortOrder,
    tier: input.tier,
    placement: input.placement
  });
}

export function toPublicProjectionSponsors(value = []) {
  return normalizeTournamentPublicSponsors(value)
    .filter((sponsor) => sponsor.enabled)
    .map((sponsor) => Object.freeze({
      id: sponsor.sponsorId,
      name: sponsor.name,
      logoUrl: sponsor.logoUrl,
      tier: sponsor.tier,
      placement: sponsor.placement,
      order: sponsor.sortOrder
    }));
}

export function validateTournamentPublicAssetFile(file, kind = "cover") {
  const mimeType = String(file?.type || "").toLowerCase();
  const size = Number(file?.size || 0);
  const maxBytes = TOURNAMENT_PUBLIC_ASSET_LIMITS[kind];
  if (!maxBytes) return { ok: false, reason: "public-asset-kind-invalid" };
  if (!TOURNAMENT_PUBLIC_ASSET_MIME_TYPES.includes(mimeType)) return { ok: false, reason: "public-asset-mime-invalid" };
  if (!Number.isFinite(size) || size <= 0 || size > maxBytes) return { ok: false, reason: "public-asset-size-invalid" };
  return { ok: true, mimeType, size, maxBytes };
}

function publicAssetUrl(value) {
  const url = String(value || "").trim();
  return URL_PATTERN.test(url) ? url : "";
}

function id(value) {
  const normalized = String(value || "").trim();
  return ID_PATTERN.test(normalized) ? normalized : "";
}

function text(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function nonNegativeInteger(value) {
  const numeric = Number(value);
  return Number.isSafeInteger(numeric) && numeric >= 0 ? numeric : 0;
}

function compact(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item));
}

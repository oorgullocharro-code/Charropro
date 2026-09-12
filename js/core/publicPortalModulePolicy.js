import {
  PUBLIC_TOURNAMENT_MODULE_TYPES
} from "../public/canonicalPublicTournamentData.js?v=20260912-portal-v2-home-visual-adjustments-003-v1";
import {
  getBootstrapConfigurationValue,
  loadConfigurationBootstrap
} from "./configurationBootstrap.js";

export const PUBLIC_PORTAL_DEFAULT_MODULE_POLICY_VERSION = "1.0.0";

const configuration = await loadConfigurationBootstrap();
const policy = getBootstrapConfigurationValue(configuration, "publicPortal.defaultModules", null);

export function resolveDefaultPublicPortalModules() {
  if (!policy || policy.policyVersion !== PUBLIC_PORTAL_DEFAULT_MODULE_POLICY_VERSION || !Array.isArray(policy.modules)) {
    throw new Error("public-portal-default-modules-policy-invalid");
  }

  const seenTypes = new Set();
  const seenOrders = new Set();
  const modules = policy.modules.map((module) => normalizeModule(module)).filter(Boolean);
  if (modules.length !== policy.modules.length || modules.length === 0) {
    throw new Error("public-portal-default-modules-policy-invalid");
  }
  for (const module of modules) {
    if (seenTypes.has(module.type) || seenOrders.has(module.order)) {
      throw new Error("public-portal-default-modules-policy-invalid");
    }
    seenTypes.add(module.type);
    seenOrders.add(module.order);
  }
  return Object.freeze(modules.map((module) => Object.freeze({ ...module })));
}

export function applyDefaultPublicPortalModules(tournament = {}) {
  if (hasExplicitPublicModules(tournament)) return tournament;
  return {
    ...tournament,
    publicModules: resolveDefaultPublicPortalModules().map((module) => ({ ...module }))
  };
}

export function hasExplicitPublicModules(tournament = {}) {
  return Array.isArray(tournament?.publicModules) || Array.isArray(tournament?.info?.publicModules);
}

function normalizeModule(input = {}) {
  const type = String(input?.type || "").trim().toLowerCase();
  const order = Number(input?.order);
  if (!PUBLIC_TOURNAMENT_MODULE_TYPES.includes(type)
    || input?.enabled !== true
    || !Number.isSafeInteger(order)
    || order < 1) {
    return null;
  }
  return { type, enabled: true, order };
}

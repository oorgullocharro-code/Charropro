import { applyPublicPortalSnapshot } from "../public/publicPortalClient.js?v=20260911-portal-v2-premium-public-design-foundation-and-home-001-v1";
import { isCanonicalPublicV3 } from "./portalV2Model.js?v=20260911-portal-v2-premium-public-design-foundation-and-home-001-v1";

export function applyPortalV2Snapshot(state, snapshot, options = {}) {
  if (!isCanonicalPublicV3(snapshot)) {
    return Object.freeze({ state, accepted: false, duplicate: false, reason: "portal-v2-schema-required" });
  }
  return applyPublicPortalSnapshot(state, snapshot, options);
}

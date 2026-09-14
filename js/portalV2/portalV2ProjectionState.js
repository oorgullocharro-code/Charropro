import { applyPublicPortalSnapshot } from "../public/publicPortalClient.js?v=20260913-manganas-fmch-time-remate-practical-capture-fix-001-v3";
import { isCanonicalPublicV3 } from "./portalV2Model.js?v=20260913-manganas-fmch-time-remate-practical-capture-fix-001-v3";

export function applyPortalV2Snapshot(state, snapshot, options = {}) {
  if (!isCanonicalPublicV3(snapshot)) {
    return Object.freeze({ state, accepted: false, duplicate: false, reason: "portal-v2-schema-required" });
  }
  return applyPublicPortalSnapshot(state, snapshot, options);
}

import { applyPublicPortalSnapshot } from "../public/publicPortalClient.js?v=20260919-cala-medios-lados-plus-one-controls-fix-001-v1";
import { isCanonicalPublicV3 } from "./portalV2Model.js?v=20260919-cala-medios-lados-plus-one-controls-fix-001-v1";

export function applyPortalV2Snapshot(state, snapshot, options = {}) {
  if (!isCanonicalPublicV3(snapshot)) {
    return Object.freeze({ state, accepted: false, duplicate: false, reason: "portal-v2-schema-required" });
  }
  return applyPublicPortalSnapshot(state, snapshot, options);
}

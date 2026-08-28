import assert from "node:assert/strict";
import fs from "node:fs";
import {
  FMCH_2026_LIBRE_PROFILE_0_6_0,
  FMCH_2026_LIBRE_PROFILE_0_6_1
} from "../js/data/ruleProfiles.js?v=20260828-fmch-terna-federation-format-row-ownership-001-v1";
import { buildRuleProfileContentFingerprint } from "../js/data/ruleProfileTemporalPolicy.js?v=20260828-fmch-terna-federation-format-row-ownership-001-v1";

const snapshot = fs.readFileSync(new URL("../js/core/officialFormatSnapshot.js", import.meta.url), "utf8");
const xlsx = fs.readFileSync(new URL("../js/core/officialFormat.js", import.meta.url), "utf8");
assert.equal(buildRuleProfileContentFingerprint(FMCH_2026_LIBRE_PROFILE_0_6_0), "rptp_0f90f7a3944a82d7");
assert.equal(buildRuleProfileContentFingerprint(FMCH_2026_LIBRE_PROFILE_0_6_1), "rptp_10e596046446e850");
assert.doesNotMatch(snapshot, /brakeReviewPhase/);
assert.doesNotMatch(xlsx, /brakeReviewPhase/);
assert.equal(fs.readFileSync(new URL("../firebase-rules-auditoria.json", import.meta.url), "utf8").includes("brakeReviews"), false);
console.log("brake-review-federation-format-regression.test.mjs: ok");

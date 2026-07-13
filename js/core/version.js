export const CHARROPRO_APP_VERSION = "20260712-broadcast-data-001-contract-v1";

let versionLogged = false;

export function logCharroProVersion(scope = "app") {
  if (versionLogged) return;
  versionLogged = true;
  console.info("[core-infra-001] app version", {
    version: CHARROPRO_APP_VERSION,
    scope
  });
}

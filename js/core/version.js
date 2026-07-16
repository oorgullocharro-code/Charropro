export const CHARROPRO_APP_VERSION = "20260715-broadcast-access-and-sync-001-local-output-sync-v1";

let versionLogged = false;

export function logCharroProVersion(scope = "app") {
  if (versionLogged) return;
  versionLogged = true;
  console.info("[core-infra-001] app version", {
    version: CHARROPRO_APP_VERSION,
    scope
  });
}

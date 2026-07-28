export const CHARROPRO_APP_VERSION = "20260727-public-portal-ux-001-live-feed-v1";

let versionLogged = false;

export function logCharroProVersion(scope = "app") {
  if (versionLogged) return;
  versionLogged = true;
  console.info("[core-infra-001] app version", {
    version: CHARROPRO_APP_VERSION,
    scope
  });
}

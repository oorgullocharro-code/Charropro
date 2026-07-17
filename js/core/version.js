export const CHARROPRO_APP_VERSION = "20260716-broadcast-workspace-context-bridge-001-auto-context-v1";

let versionLogged = false;

export function logCharroProVersion(scope = "app") {
  if (versionLogged) return;
  versionLogged = true;
  console.info("[core-infra-001] app version", {
    version: CHARROPRO_APP_VERSION,
    scope
  });
}

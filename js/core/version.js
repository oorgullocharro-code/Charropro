import {
  getBootstrapConfigurationValue,
  loadConfigurationBootstrap
} from "./configurationBootstrap.js?v=20260801-configuration-management-001-v1";

const configurationBootstrap = await loadConfigurationBootstrap();

export const CHARROPRO_APP_VERSION = getBootstrapConfigurationValue(
  configurationBootstrap,
  "system.appVersion",
  ""
);

if (!CHARROPRO_APP_VERSION) throw new Error("configuration-bootstrap-required:system.appVersion");

let versionLogged = false;

export function logCharroProVersion(scope = "app") {
  if (versionLogged) return;
  versionLogged = true;
  console.info("[core-infra-001] app version", {
    version: CHARROPRO_APP_VERSION,
    scope
  });
}

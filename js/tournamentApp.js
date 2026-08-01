import { CHARROPRO_APP_VERSION } from "./core/version.js?v=20260729-public-projection-recovery-001-v1";

window.CHARROPRO_APP_MODE = "tournament";

const appModuleUrl = new URL("./app.js", import.meta.url);
appModuleUrl.searchParams.set("v", CHARROPRO_APP_VERSION);

await import(appModuleUrl.href);

import { CHARROPRO_APP_VERSION } from "./core/version.js?v=20260727-broadcast-live-graphics-001-live-data-geometry-v1e";

window.CHARROPRO_APP_MODE = "tournament";

const appModuleUrl = new URL("./app.js", import.meta.url);
appModuleUrl.searchParams.set("v", CHARROPRO_APP_VERSION);

await import(appModuleUrl.href);

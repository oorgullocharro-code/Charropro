window.CHARROPRO_APP_MODE = "tournament";

const appModuleUrl = new URL("./app.js", import.meta.url);
appModuleUrl.searchParams.set("v", "20260801-web-client-emulator-runtime-integration-001-v2");

await import(appModuleUrl.href);

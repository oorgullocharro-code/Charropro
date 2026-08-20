window.CHARROPRO_APP_MODE = "tournament";

const appModuleUrl = new URL("./app.js", import.meta.url);
appModuleUrl.searchParams.set("v", "20260820-production-release-candidate-001-v1");

await import(appModuleUrl.href);

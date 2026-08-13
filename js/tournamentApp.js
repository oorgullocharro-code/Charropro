window.CHARROPRO_APP_MODE = "tournament";

const appModuleUrl = new URL("./app.js", import.meta.url);
appModuleUrl.searchParams.set("v", "20260813-operational-flow-public-portal-corrections-001-v1");

await import(appModuleUrl.href);

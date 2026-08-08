window.CHARROPRO_APP_MODE = "tournament";

const appModuleUrl = new URL("./app.js", import.meta.url);
appModuleUrl.searchParams.set("v", "20260808-public-snapshot-critical-recovery-001-v3");

await import(appModuleUrl.href);

window.CHARROPRO_APP_MODE = "tournament";

const appModuleUrl = new URL("./app.js", import.meta.url);
appModuleUrl.searchParams.set("v", "20260811-official-timer-authority-sync-001-v1");

await import(appModuleUrl.href);

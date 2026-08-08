window.CHARROPRO_APP_MODE = "tournament";

const appModuleUrl = new URL("./app.js", import.meta.url);
appModuleUrl.searchParams.set("v", "20260808-fmch-2026-cala-scorer-001-v1");

await import(appModuleUrl.href);

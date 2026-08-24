import {
  getBootstrapConfigurationValue,
  loadConfigurationBootstrap
} from "./configurationBootstrap.js";

const BUILD_ATTRIBUTE = "data-charropro-build-href";
const ENTRY_ATTRIBUTE = "data-charropro-entry";

export async function bootstrapCharroProClient(options = {}) {
  const configuration = await loadConfigurationBootstrap(options.configuration || {});
  const appVersion = getBootstrapConfigurationValue(configuration, "system.appVersion", "");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/.test(appVersion)) {
    throw new Error("client-bootstrap-app-version-invalid");
  }

  const documentRef = options.document || globalThis.document;
  const baseUrl = options.baseUrl || documentRef?.baseURI || import.meta.url;
  const script = options.script || findBootstrapScript(documentRef);
  const entry = options.entry || script?.getAttribute(ENTRY_ATTRIBUTE) || "";
  if (!/^\.\/?[A-Za-z0-9_./-]+\.js$/.test(entry)) {
    throw new Error("client-bootstrap-entry-invalid");
  }

  const runtime = Object.freeze({
    appVersion,
    checksum: configuration.checksum,
    entry: buildVersionedUrl(entry, baseUrl, appVersion)
  });
  globalThis.__CHARROPRO_BUILD__ = runtime;

  await Promise.all(applyBuildStyles(documentRef, baseUrl, appVersion));
  const importModule = options.importModule || ((url) => import(url));
  await importModule(runtime.entry);
  return runtime;
}

export function buildVersionedUrl(resource, baseUrl, appVersion) {
  const url = new URL(resource, baseUrl);
  url.searchParams.set("v", appVersion);
  return url.href;
}

export function applyBuildStyles(documentRef, baseUrl, appVersion) {
  if (!documentRef?.querySelectorAll) return [];
  return [...documentRef.querySelectorAll(`link[${BUILD_ATTRIBUTE}]`)].map((link) => new Promise((resolve, reject) => {
    const resource = link.getAttribute(BUILD_ATTRIBUTE) || "";
    if (!/^\.\/?[A-Za-z0-9_./-]+\.css$/.test(resource)) {
      reject(new Error("client-bootstrap-stylesheet-invalid"));
      return;
    }
    link.addEventListener("load", resolve, { once: true });
    link.addEventListener("error", () => reject(new Error("client-bootstrap-stylesheet-load-failed")), { once: true });
    link.href = buildVersionedUrl(resource, baseUrl, appVersion);
  }));
}

function findBootstrapScript(documentRef) {
  return documentRef?.querySelector?.(`script[type="module"][${ENTRY_ATTRIBUTE}]`) || null;
}

if (typeof document !== "undefined") {
  bootstrapCharroProClient().catch((error) => {
    console.error("[client-bootstrap] startup failed", error);
    globalThis.dispatchEvent?.(new CustomEvent("charropro:bootstrap-error", {
      detail: { code: String(error?.message || "client-bootstrap-failed") }
    }));
  });
}

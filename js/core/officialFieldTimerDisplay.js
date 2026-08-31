export function formatOfficialFieldTimerMs(value) {
  const numeric = Number(value);
  const safeMs = Number.isFinite(numeric) ? Math.trunc(numeric) : 0;
  const negative = safeMs < 0;
  const absoluteMs = Math.abs(safeMs);
  const minutes = Math.floor(absoluteMs / 60000);
  const seconds = Math.floor((absoluteMs % 60000) / 1000);
  const decimals = Math.floor((absoluteMs % 1000) / 100);
  const sign = negative ? "-" : "";

  if (minutes === 0) {
    const secondsLabel = seconds === 0 ? "0" : String(seconds).padStart(2, "0");
    return `${sign}${secondsLabel}.${decimals}`;
  }

  return `${sign}${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${decimals}`;
}

export function getOfficialFieldTimerFormat(value) {
  const numeric = Number(value);
  const safeMs = Number.isFinite(numeric) ? Math.abs(Math.trunc(numeric)) : 0;
  return safeMs >= 60000 ? "minutes" : "seconds";
}

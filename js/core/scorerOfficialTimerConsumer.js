import { reconcileOfficialTimerConsumerState } from "./officialTimerOrchestration.js?v=20260831-official-ranking-authority-public-parity-compatibility-001-v1";

export function createScorerOfficialTimerConsumer(options = {}) {
  const readState = typeof options.readState === "function" ? options.readState : () => ({});
  const commitState = typeof options.commitState === "function" ? options.commitState : () => {};
  const invalidate = typeof options.invalidate === "function" ? options.invalidate : () => {};
  const refreshDisplay = typeof options.refreshDisplay === "function" ? options.refreshDisplay : () => {};
  const diagnostics = {
    events: 0,
    stateUpdates: 0,
    consumerInvalidations: 0,
    displayRefreshes: 0,
    timerReplacements: 0
  };

  function consume(input = {}) {
    diagnostics.events += 1;
    const current = readState() || {};
    const reconciled = reconcileOfficialTimerConsumerState({
      registry: input.registry || current.registry,
      incomingRegistry: input.incomingRegistry,
      currentTimerContext: current.currentTimerContext,
      incomingCurrentTimerContext: input.incomingCurrentTimerContext,
      now: input.now ?? Date.now()
    });
    commitState(reconciled);
    diagnostics.stateUpdates += 1;

    if (reconciled.changed) {
      if (reconciled.timerIdChanged) diagnostics.timerReplacements += 1;
      invalidate(reconciled);
      diagnostics.consumerInvalidations += 1;
    } else {
      refreshDisplay(reconciled);
      diagnostics.displayRefreshes += 1;
    }
    return reconciled;
  }

  return Object.freeze({
    consume,
    diagnostics: () => Object.freeze({ ...diagnostics })
  });
}

export function subscribeScorerOfficialTimerCurrent(options = {}) {
  const subscribe = typeof options.subscribe === "function" ? options.subscribe : null;
  const onCurrent = typeof options.onCurrent === "function" ? options.onCurrent : () => {};
  const liveChannel = String(options.liveChannel || "").trim();
  if (!subscribe || !liveChannel) return () => {};

  let active = true;
  const unsubscribe = subscribe(liveChannel, (payload, error) => {
    if (!active || error || !payload) return;
    onCurrent(payload);
  });

  return () => {
    if (!active) return;
    active = false;
    if (typeof unsubscribe === "function") unsubscribe();
  };
}

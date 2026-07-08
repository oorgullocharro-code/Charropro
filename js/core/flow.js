import { getTournamentSuertes } from "../data/suertes.js?v=20260708-tournament-types-001-pialadero1";
import { getActiveCharreada, getActiveTournament, saveState, state } from "./state.js?v=20260708-tournament-types-001-pialadero1";

export function resetScoringPointer() {
  state.scoringSuerteIdx = 0;
  state.scoringTeamIdx = 0;
  state.scoringAttemptIdx = 0;
  state.scoringColeadorIdx = 0;
}

export function advanceScoringPointer() {
  const charreada = getActiveCharreada();
  if (!charreada) return { finished: true };

  const suertes = getActiveTournamentSuertes();
  if (state.scoringSuerteIdx >= suertes.length) state.scoringSuerteIdx = 0;
  const suerte = suertes[state.scoringSuerteIdx];
  if (!suerte) return { finished: true };
  const teamCount = charreada.teamIds.length;

  if (suerte.id === "colas") {
    const coleadorCount = getColeadorCount();
    if (state.scoringColeadorIdx < coleadorCount - 1) {
      state.scoringColeadorIdx += 1;
    } else {
      state.scoringColeadorIdx = 0;
      if (state.scoringTeamIdx < teamCount - 1) {
        state.scoringTeamIdx += 1;
      } else {
        state.scoringTeamIdx = 0;
        if (state.scoringAttemptIdx < suerte.attempts - 1) {
          state.scoringAttemptIdx += 1;
        } else {
          state.scoringAttemptIdx = 0;
          advanceSuerte();
        }
      }
    }
  } else if (["toro", "lazo", "pial_ruedo"].includes(suerte.id)) {
    advanceTerna(teamCount, suerte.id);
  } else if (["yegua", "manganas_pie", "manganas_caballo"].includes(suerte.id)) {
    advanceManganas(teamCount, suerte.id);
  } else if (suerte.attempts > 1) {
    advanceByTeamThenAttempt(teamCount, suerte.attempts);
  } else {
    advanceByTeamThenSuerte(teamCount);
  }

  saveState({ silent: true });
  return { finished: state.view !== "scoring" };
}

export function previousScoringPointer() {
  const sequence = buildScoringSequence();
  if (!sequence.length) return { moved: false, atStart: true };

  const currentIndex = findCurrentSequenceIndex(sequence);
  if (currentIndex <= 0) {
    applyScoringPosition(sequence[0]);
    saveState({ silent: true });
    return { moved: false, atStart: true };
  }

  applyScoringPosition(sequence[currentIndex - 1]);
  saveState({ silent: true });
  return { moved: true, atStart: false };
}

function advanceTerna(teamCount, suerteId) {
  if (suerteId === "toro") {
    setSuerteById("lazo");
    state.scoringAttemptIdx = 0;
    return;
  }

  if (suerteId === "lazo") {
    setSuerteById("pial_ruedo");
    state.scoringAttemptIdx = 0;
    return;
  }

  if (state.scoringTeamIdx < teamCount - 1) {
    state.scoringTeamIdx += 1;
    setSuerteById("toro");
  } else {
    state.scoringTeamIdx = 0;
    advanceSuerte();
  }
}

function advanceManganas(teamCount, suerteId) {
  if (suerteId === "yegua") {
    setSuerteById("manganas_pie");
    state.scoringAttemptIdx = 0;
    return;
  }

  if (suerteId === "manganas_pie") {
    if (state.scoringAttemptIdx < 2) {
      state.scoringAttemptIdx += 1;
    } else {
      state.scoringAttemptIdx = 0;
      setSuerteById("manganas_caballo");
    }
    return;
  }

  if (state.scoringAttemptIdx < 2) {
    state.scoringAttemptIdx += 1;
  } else if (state.scoringTeamIdx < teamCount - 1) {
    state.scoringAttemptIdx = 0;
    state.scoringTeamIdx += 1;
    setSuerteById("yegua");
  } else {
    state.scoringAttemptIdx = 0;
    state.scoringTeamIdx = 0;
    advanceSuerte();
  }
}

function advanceByTeamThenAttempt(teamCount, attempts) {
  if (state.scoringTeamIdx < teamCount - 1) {
    state.scoringTeamIdx += 1;
  } else {
    state.scoringTeamIdx = 0;
    if (state.scoringAttemptIdx < attempts - 1) {
      state.scoringAttemptIdx += 1;
    } else {
      state.scoringAttemptIdx = 0;
      advanceSuerte();
    }
  }
}

function advanceByTeamThenSuerte(teamCount) {
  if (state.scoringTeamIdx < teamCount - 1) {
    state.scoringTeamIdx += 1;
  } else {
    state.scoringTeamIdx = 0;
    advanceSuerte();
  }
}

export function advanceSuerte() {
  const suertes = getActiveTournamentSuertes();
  if (state.scoringSuerteIdx < suertes.length - 1) {
    state.scoringSuerteIdx += 1;
  } else {
    state.view = "results";
  }
}

function getActiveTournamentSuertes() {
  return getTournamentSuertes(getActiveTournament(), state.settings.globalRuleOverrides);
}

function getColeadorCount() {
  return getActiveTournament()?.type === "coleadero" ? 1 : 3;
}

function setSuerteById(suerteId) {
  const index = getActiveTournamentSuertes().findIndex((suerte) => suerte.id === suerteId);
  if (index >= 0) {
    state.scoringSuerteIdx = index;
  } else {
    advanceSuerte();
  }
}

function buildScoringSequence() {
  const charreada = getActiveCharreada();
  if (!charreada) return [];

  const suertes = getActiveTournamentSuertes();
  const teamCount = charreada.teamIds.length;
  const sequence = [];

  for (let suerteIdx = 0; suerteIdx < suertes.length; suerteIdx += 1) {
    const suerte = suertes[suerteIdx];
    if (!suerte || teamCount <= 0) continue;

    if (suerte.id === "toro") {
      const group = getSuerteGroup(suertes, ["toro", "lazo", "pial_ruedo"]);
      addGroupedTeamSequence(sequence, group, teamCount);
      suerteIdx = Math.max(suerteIdx, ...group.map((item) => item.index));
      continue;
    }

    if (["lazo", "pial_ruedo"].includes(suerte.id)) continue;

    if (suerte.id === "yegua") {
      const group = getSuerteGroup(suertes, ["yegua", "manganas_pie", "manganas_caballo"]);
      addGroupedTeamSequence(sequence, group, teamCount);
      suerteIdx = Math.max(suerteIdx, ...group.map((item) => item.index));
      continue;
    }

    if (["manganas_pie", "manganas_caballo"].includes(suerte.id)) continue;

    if (suerte.id === "colas") {
      const attempts = Math.max(1, Number(suerte.attempts || 1));
      const coleadorCount = getColeadorCount();
      for (let attemptIdx = 0; attemptIdx < attempts; attemptIdx += 1) {
        for (let teamIdx = 0; teamIdx < teamCount; teamIdx += 1) {
          for (let coleadorIdx = 0; coleadorIdx < coleadorCount; coleadorIdx += 1) {
            sequence.push({ suerteIdx, teamIdx, attemptIdx, coleadorIdx });
          }
        }
      }
      continue;
    }

    const attempts = Math.max(1, Number(suerte.attempts || 1));
    if (attempts > 1) {
      for (let attemptIdx = 0; attemptIdx < attempts; attemptIdx += 1) {
        for (let teamIdx = 0; teamIdx < teamCount; teamIdx += 1) {
          sequence.push({ suerteIdx, teamIdx, attemptIdx, coleadorIdx: 0 });
        }
      }
    } else {
      for (let teamIdx = 0; teamIdx < teamCount; teamIdx += 1) {
        sequence.push({ suerteIdx, teamIdx, attemptIdx: 0, coleadorIdx: 0 });
      }
    }
  }

  return sequence;
}

function getSuerteGroup(suertes, suerteIds) {
  return suerteIds
    .map((suerteId) => {
      const index = suertes.findIndex((suerte) => suerte.id === suerteId);
      return index >= 0 ? { index, suerte: suertes[index] } : null;
    })
    .filter(Boolean);
}

function addGroupedTeamSequence(sequence, group, teamCount) {
  for (let teamIdx = 0; teamIdx < teamCount; teamIdx += 1) {
    group.forEach(({ index, suerte }) => {
      const attempts = Math.max(1, Number(suerte.attempts || 1));
      for (let attemptIdx = 0; attemptIdx < attempts; attemptIdx += 1) {
        sequence.push({ suerteIdx: index, teamIdx, attemptIdx, coleadorIdx: 0 });
      }
    });
  }
}

function findCurrentSequenceIndex(sequence) {
  const suertes = getActiveTournamentSuertes();
  const currentSuerte = suertes[state.scoringSuerteIdx];
  const coleadorIdx = currentSuerte?.id === "colas" ? Number(state.scoringColeadorIdx || 0) : 0;

  return sequence.findIndex((position) =>
    position.suerteIdx === Number(state.scoringSuerteIdx || 0) &&
    position.teamIdx === Number(state.scoringTeamIdx || 0) &&
    position.attemptIdx === Number(state.scoringAttemptIdx || 0) &&
    position.coleadorIdx === coleadorIdx
  );
}

function applyScoringPosition(position) {
  state.scoringSuerteIdx = position.suerteIdx;
  state.scoringTeamIdx = position.teamIdx;
  state.scoringAttemptIdx = position.attemptIdx;
  state.scoringColeadorIdx = position.coleadorIdx;
}

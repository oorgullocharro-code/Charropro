import {
  getActiveCharreada,
  getActiveTournament,
  getCharreadaCompetitionContext,
  getCharreadaScoringEntries,
  getCharreadaScoringSuertes,
  saveState,
  state
} from "./state.js?v=20260709-competitions-003-scoring-by-competition1";

export function resetScoringPointer() {
  state.scoringSuerteIdx = 0;
  state.scoringTeamIdx = 0;
  state.scoringAttemptIdx = 0;
  state.scoringColeadorIdx = 0;
}

export function advanceScoringPointer() {
  const sequence = buildScoringSequence();
  if (!sequence.length) return { finished: true };

  const currentIndex = findCurrentSequenceIndex(sequence);
  const nextIndex = currentIndex >= 0 ? currentIndex + 1 : 0;
  if (nextIndex >= sequence.length) {
    state.view = "results";
  } else {
    applyScoringPosition(sequence[nextIndex]);
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
  return getCharreadaScoringSuertes(getActiveCharreada(), getActiveTournament(), state.settings.globalRuleOverrides);
}

function getColeadorCount() {
  const charreada = getActiveCharreada();
  const context = getCharreadaCompetitionContext(charreada, getActiveTournament());
  return getActiveTournament()?.type === "coleadero" || context.isIndividualCompetition ? 1 : 3;
}

function getActiveScoringEntryCount() {
  return getCharreadaScoringEntries(getActiveCharreada()).length;
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
  const teamCount = getActiveScoringEntryCount();
  const sequence = [];

  for (let suerteIdx = 0; suerteIdx < suertes.length; suerteIdx += 1) {
    const suerte = suertes[suerteIdx];
    if (!suerte || teamCount <= 0) continue;

    if (["toro", "lazo", "pial_ruedo"].includes(suerte.id)) {
      const group = getSuerteGroup(suertes, ["toro", "lazo", "pial_ruedo"]);
      if (group[0]?.index === suerteIdx) {
        addGroupedTeamSequence(sequence, group, teamCount);
        suerteIdx = Math.max(suerteIdx, ...group.map((item) => item.index));
      }
      continue;
    }

    if (["yegua", "manganas_pie", "manganas_caballo"].includes(suerte.id)) {
      const group = getSuerteGroup(suertes, ["yegua", "manganas_pie", "manganas_caballo"]);
      if (group[0]?.index === suerteIdx) {
        addGroupedTeamSequence(sequence, group, teamCount);
        suerteIdx = Math.max(suerteIdx, ...group.map((item) => item.index));
      }
      continue;
    }

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

const OFFICIAL_TYPES = new Set([
  "score_published",
  "penalty_published",
  "score_corrected",
  "official_total_updated",
  "official_position_changed",
  "team_turn_finished",
  "participant_finished",
  "suerte_finished",
  "attempt_finished",
  "competition_finished"
]);

export function buildPublicLiveFeedMessage(event = {}, labels = {}) {
  const subject = cleanText(labels.participantName || labels.teamName) || "Participante";
  const team = cleanText(labels.teamName);
  const suerte = cleanText(labels.suerteName) || "la suerte";
  const score = numberText(event.score);
  const penalty = numberText(event.penalty);
  const total = numberText(event.officialTotal);
  const position = positionText(event.officialPosition);
  const messages = {
    competition_started: ["Comenzó la competencia", "La competencia inició oficialmente."],
    competition_finished: ["Terminó la competencia", "La competencia concluyó."],
    team_turn_started: ["Cambio de turno", `Inicia la participación de ${team || subject}.`],
    team_turn_finished: ["Participación terminada", total
      ? `${team || subject} terminó con ${total} puntos oficiales.`
      : `Terminó la participación de ${team || subject}.`],
    participant_started: ["Participante en turno", `Inicia la participación de ${subject}.`],
    participant_finished: ["Participación terminada", `Terminó la participación de ${subject}.`],
    suerte_started: [`${suerte} en curso`, `${subject} inició ${suerte}.`],
    suerte_finished: [`${suerte} terminada`, `${subject} terminó ${suerte}.`],
    attempt_started: ["Intento en curso", attemptDescription(event, subject, suerte, "inició")],
    attempt_finished: ["Intento terminado", attemptDescription(event, subject, suerte, "terminó")],
    score_published: [`${suerte} calificada`, score
      ? `${subject} sumó ${score} puntos en ${suerte}.`
      : `Se publicó la calificación oficial de ${subject} en ${suerte}.`],
    penalty_published: ["Incidencia publicada", penalty
      ? `Se publicó una infracción de ${penalty} puntos para ${team || subject}.`
      : `Se publicó una incidencia para ${team || subject}.`],
    score_corrected: ["Calificación oficial actualizada", score
      ? `La calificación oficial de ${subject} en ${suerte} se actualizó a ${score} puntos.`
      : `Se actualizó la calificación oficial de ${subject} en ${suerte}.`],
    official_total_updated: ["Total oficial actualizado", total
      ? `El total oficial de ${team || subject} se actualizó a ${total} puntos.`
      : `Se actualizó el total oficial de ${team || subject}.`],
    official_position_changed: ["Posición oficial actualizada", position
      ? `${team || subject} pasó a la posición ${position}.`
      : `Se actualizó la posición oficial de ${team || subject}.`],
    timer_started: ["Cronómetro iniciado", "El cronómetro oficial está en marcha."],
    timer_paused: ["Cronómetro pausado", "El cronómetro oficial está en pausa."],
    timer_resumed: ["Cronómetro reanudado", "El cronómetro oficial se reanudó."],
    timer_finished: ["Cronómetro finalizado", "El cronómetro oficial terminó."],
    competition_paused: ["Competencia en pausa", "La competencia se encuentra en pausa."],
    competition_resumed: ["Competencia reanudada", "La competencia se reanudó."],
    live_status_changed: ["Estado en vivo actualizado", "Se actualizó el estado oficial de la competencia."]
  };
  const message = messages[event.eventType];
  if (!message) return null;
  const details = [];
  if (total && !message[1].includes(`${total} puntos`)) details.push(`Total oficial: ${total} puntos.`);
  if (position && event.eventType !== "official_position_changed") details.push(`Posición oficial: ${position}.`);
  return {
    title: message[0],
    description: message[1],
    detail: details.join(" "),
    label: OFFICIAL_TYPES.has(event.eventType) ? "OFICIAL" : "EN CURSO",
    official: OFFICIAL_TYPES.has(event.eventType)
  };
}

export function isOfficialPublicLiveFeedEvent(eventType) {
  return OFFICIAL_TYPES.has(String(eventType || ""));
}

function attemptDescription(event, subject, suerte, verb) {
  const attempt = Number.isSafeInteger(event.attemptNumber) ? ` ${event.attemptNumber}` : "";
  return `${subject} ${verb} el intento${attempt} de ${suerte}.`;
}

function numberText(value) {
  if (value === null || value === undefined || value === "") return "";
  const number = Number(value);
  return Number.isFinite(number)
    ? new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 }).format(number)
    : "";
}

function positionText(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? `${number}.º` : "";
}

function cleanText(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[<>]/g, "").slice(0, 180);
}

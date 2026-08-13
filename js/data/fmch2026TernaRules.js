export const FMCH_2026_TERNA_RULEBOOK_VERSION = "fmch_2026_terna_0.5.0";
export const FMCH_2026_TERNA_SOURCE = "CHARROPRO-FMCH-2026-SCORING-SPECIFICATION-001";
export const FMCH_2026_TERNA_SESSION_VERSION = "1.0.0";
export const FMCH_2026_TERNA_OPPORTUNITY_LIMIT = 5;
export const FMCH_2026_TERNA_DURATION_MS = 7 * 60 * 1000;
export const FMCH_2026_TERNA_SUERTE_IDS = Object.freeze(["lazo", "pial_ruedo"]);
export const FMCH_2026_TERNA_CLOSED_UNUSED_STATUS = "CLOSED_UNUSED";

export const FMCH_2026_LAZO_BASE_RULES = freezeRules([
  rule("lazo_base_sencillo", "Sencillo", 5, remateMetadata("sencillo")),
  rule("lazo_base_toro_echado", "Sencillo o floreado con toro echado", 5, remateMetadata("toro_echado")),
  rule("lazo_base_efecto", "De efecto", 8, remateMetadata("efecto")),
  rule("lazo_base_floreado", "Floreado", 10, remateMetadata("floreado"))
]);

export const FMCH_2026_LAZO_ADIC_RULES = freezeRules([
  ...floreoRules("lazo"),
  rule("lazo_adic_remate_atras", "Remate atrás", 2),
  rule("lazo_adic_toro_parado", "Toro parado", 1),
  rule("lazo_adic_primera_oportunidad", "Primera oportunidad", 1, { firstOpportunityOnly: true }),
  rule("lazo_adic_solo_cuernos", "Lazo únicamente en los cuernos", 2),
  rule("lazo_adic_bozal_primera", "Bozal en primera oportunidad", 1, { firstOpportunityOnly: true }),
  rule("lazo_adic_sin_ayuda", "Consumado sin ayuda", 1),
  rule("lazo_adic_tiempo_no_usado", "Tiempo oficial no utilizado", 1, timeAdditionalMetadata())
]);

export const FMCH_2026_LAZO_INFR_RULES = freezeRules([
  rule("lazo_infr_destroncar", "Destroncar", 4),
  rule("lazo_infr_fuera_cuadro_sin_florear", "Salir del cuadro sin florear", 4),
  rule("lazo_infr_floreo_defectuoso", "Floreo defectuoso", 1, repeatable()),
  rule("lazo_infr_perder_reata", "Perder la reata", 6, { alsoDisqualification: true }),
  rule("lazo_infr_media_cabeza", "Media cabeza", 2),
  rule("lazo_infr_agarrar_lazada", "Agarrar la lazada", 2),
  rule("lazo_infr_fallar_vueltas", "Fallar vueltas", 2),
  rule("lazo_infr_bajar_mano_fuste", "Bajar la mano al fuste", 2),
  rule("lazo_infr_encuartarse", "Encuartarse", 1),
  rule("lazo_infr_no_encuartar_aviso", "No encuartar después del aviso", 1),
  rule("lazo_infr_lastimar_ojos", "Lastimar los ojos", 2),
  rule("lazo_infr_estirar_joroba", "Estirar de la joroba", 1),
  rule("lazo_infr_estirar_toro_caido_sin_pial", "Seguir estirando toro caído sin pial", 6),
  rule("lazo_infr_salto_barrera", "Permitir salto de barrera", 4, { alsoDisqualification: true }),
  rule("lazo_infr_caer_al_pararse", "Caer al pararse", 6, { alsoDisqualification: true }),
  rule("lazo_infr_no_intentar", "No intentar la cabeza", 2),
  rule("lazo_infr_no_lazar_movimiento", "No lazar en el movimiento solicitado", 4),
  rule("lazo_infr_retirar_pretal_antes", "Retirar pretal o verijero antes de la cabeza", 4),
  rule("lazo_infr_arrear_caballo", "Arrear el caballo al estirar", 4)
]);

export const FMCH_2026_LAZO_TEAM_PENALTY_RULES = freezeRules([]);

export const FMCH_2026_LAZO_DESC_RULES = freezeRules([
  dq("lazo_desc_caida_lazador", "Caída del lazador con el lazo", { linkedInfractionPoints: 6 }),
  dq("lazo_desc_caida_caballo", "Caída del caballo"),
  dq("lazo_desc_perder_continuidad", "Perder continuidad"),
  dq("lazo_desc_toro_no_limpio", "Toro no limpio"),
  dq("lazo_desc_estirar_defectuoso", "Estirar un lazo defectuoso"),
  dq("lazo_desc_perder_reata", "Perder la reata"),
  dq("lazo_desc_rotura", "Rotura"),
  dq("lazo_desc_salto_barrera", "Salto de barrera"),
  dq("lazo_desc_derribar_sin_remachar", "Derribar sin remachar"),
  dq("lazo_desc_vueltas_entrepierna", "Vueltas en la entrepierna"),
  dq("lazo_desc_ayuda_rotura_montura", "Ayuda por rotura de montura"),
  dq("lazo_desc_sujetar_toro_objeto", "Sujetar al toro o arrojar un objeto"),
  dq("lazo_desc_siguiente_lazador", "El siguiente lazador inicia antes de concluir"),
  dq("lazo_desc_lazar_sin_rematar", "Lazar sin rematar durante el floreo"),
  dq("lazo_desc_fractura_muerte", "Fractura o muerte del toro ya lazado; termina la Terna", { terminatesTerna: true })
]);

export const FMCH_2026_PIAL_RUEDO_BASE_RULES = freezeRules([
  rule("pial_ruedo_base_sencillo", "Sencillo", 5, remateMetadata("sencillo")),
  rule("pial_ruedo_base_efecto", "De efecto", 8, remateMetadata("efecto")),
  rule("pial_ruedo_base_floreado", "Floreado", 10, remateMetadata("floreado")),
  rule("pial_ruedo_base_corvero_derecho", "Corvero derecho", 10, remateMetadata("corvero_derecho")),
  rule("pial_ruedo_base_corvero_izquierdo", "Corvero izquierdo", 10, remateMetadata("corvero_izquierdo")),
  rule("pial_ruedo_base_contracorvero_derecho", "Contracorvero derecho", 11, remateMetadata("contracorvero_derecho")),
  rule("pial_ruedo_base_contracorvero_izquierdo", "Contracorvero izquierdo", 11, remateMetadata("contracorvero_izquierdo")),
  rule("pial_ruedo_base_cuadrilero_derecho", "Cuadrilero o verijero derecho", 11, remateMetadata("cuadrilero_derecho")),
  rule("pial_ruedo_base_cuadrilero_izquierdo", "Cuadrilero o verijero izquierdo", 11, remateMetadata("cuadrilero_izquierdo")),
  rule("pial_ruedo_base_contra_derecho", "Contracuadrilero o contraverijero derecho", 12, remateMetadata("contra_derecho")),
  rule("pial_ruedo_base_contra_izquierdo", "Contracuadrilero o contraverijero izquierdo", 12, remateMetadata("contra_izquierdo")),
  rule("pial_ruedo_base_viento_derecho", "Viento derecho", 13, remateMetadata("viento_derecho")),
  rule("pial_ruedo_base_viento_izquierdo", "Viento izquierdo", 14, remateMetadata("viento_izquierdo")),
  rule("pial_ruedo_base_contraviento_derecho", "Contraviento derecho", 15, remateMetadata("contraviento_derecho")),
  rule("pial_ruedo_base_contraviento_izquierdo", "Contraviento izquierdo", 16, remateMetadata("contraviento_izquierdo"))
]);

export const FMCH_2026_PIAL_RUEDO_ADIC_RULES = freezeRules([
  ...floreoRules("pial_ruedo"),
  rule("pial_ruedo_adic_cuadrilero", "Remate cuadrilero o verijero", 2, remateAdditional("cuadrilero")),
  rule("pial_ruedo_adic_contra", "Remate contracuadrilero o contraverijero", 2, remateAdditional("contra")),
  rule("pial_ruedo_adic_viento", "Remate de viento", 3, remateAdditional("viento")),
  rule("pial_ruedo_adic_viento_espalda_izq", "Viento de espalda por el lado izquierdo", 3, remateAdditional("viento_espalda_izq")),
  rule("pial_ruedo_adic_cuadrilero_espalda_izq", "Cuadrilero o verijero de espalda por el lado izquierdo", 3, remateAdditional("cuadrilero_espalda_izq")),
  rule("pial_ruedo_adic_contraviento", "Remate de contraviento", 4, remateAdditional("contraviento")),
  rule("pial_ruedo_adic_primera_oportunidad", "Primera oportunidad", 1, { firstOpportunityOnly: true }),
  rule("pial_ruedo_adic_corriendo_ambos", "Pial floreado corriendo ambos", 2),
  rule("pial_ruedo_adic_giro_caballo_opuesto", "Giro del caballo en sentido opuesto, mínimo 180 grados", 1),
  rule("pial_ruedo_adic_tiempo_no_usado", "Tiempo oficial no utilizado", 1, timeAdditionalMetadata())
]);

export const FMCH_2026_PIAL_RUEDO_INFR_RULES = freezeRules([
  rule("pial_ruedo_infr_floreo_defectuoso", "Floreo defectuoso", 1, repeatable()),
  rule("pial_ruedo_infr_especial_cae_antes_dos_patas", "Pial especial cae antes de tomar dos patas", 2),
  rule("pial_ruedo_infr_bajar_con_mano", "Bajar el pial con la mano", 2),
  rule("pial_ruedo_infr_agarrar_lazada", "Agarrar la lazada", 2),
  rule("pial_ruedo_infr_fallar_vueltas", "Fallar vueltas", 2),
  rule("pial_ruedo_infr_bajar_mano_fuste", "Bajar la mano al fuste", 2),
  rule("pial_ruedo_infr_estirar_sin_pial", "Estirar sin pial o con una sola pata", 2),
  rule("pial_ruedo_infr_mismo_lado_cabecero", "Estirar del mismo lado que el cabecero", 2),
  rule("pial_ruedo_infr_perder_reata", "Perder la reata", 6, { alsoDisqualification: true }),
  rule("pial_ruedo_infr_roza_manos_cobijado", "Rozar las manos y quedar cobijado", 2),
  rule("pial_ruedo_infr_caer_al_pararse", "Caer al pararse", 6, { alsoDisqualification: true }),
  rule("pial_ruedo_infr_ayuda_si_cuenta", "Ayuda para lograr el pial cuando cuenta", 2),
  rule("pial_ruedo_infr_no_intentar", "No intentar el pial", 2),
  rule("pial_ruedo_infr_arrear_caballo", "Arrear el caballo al estirar", 4),
  rule("pial_ruedo_infr_pata_camina_atras", "Una pata entra caminando hacia atrás", 2),
  rule("pial_ruedo_infr_estirar_apezunado", "Estirar apezuñado", 2),
  rule("pial_ruedo_infr_completa_despues_tres_pasos", "Completar después de tres pasos u ondeadas", 2)
]);

export const FMCH_2026_PIAL_RUEDO_TEAM_PENALTY_RULES = freezeRules([
  rule("pial_ruedo_team_mas_tres_limpian", "Más de tres integrantes limpian al toro", 4, { scope: "team" }),
  rule("pial_ruedo_team_no_devolver_toro", "No devolver el toro", 2, { scope: "team" }),
  rule("pial_ruedo_team_ayuda_sin_cuenta", "Ayuda para lograr el pial cuando no cuenta", 2, { scope: "team" })
]);

export const FMCH_2026_PIAL_RUEDO_DESC_RULES = freezeRules([
  dq("pial_ruedo_desc_caida_lazador", "Caída del lazador con el pial", { linkedInfractionPoints: 6 }),
  dq("pial_ruedo_desc_caida_caballo", "Caída del caballo"),
  dq("pial_ruedo_desc_repetir_remate", "Repetir remate"),
  dq("pial_ruedo_desc_perder_continuidad", "Perder continuidad"),
  dq("pial_ruedo_desc_manos_sin_cobijar", "Pegar en las manos sin cobijar"),
  dq("pial_ruedo_desc_remendar", "Remendar"),
  dq("pial_ruedo_desc_perder_cobijo", "Perder el cobijo"),
  dq("pial_ruedo_desc_dos_patas_atras", "Dos patas entran caminando hacia atrás"),
  dq("pial_ruedo_desc_toro_no_limpio", "Toro no limpio"),
  dq("pial_ruedo_desc_rotura", "Rotura"),
  dq("pial_ruedo_desc_pisar_lazada", "Caballo o toro pisa la lazada"),
  dq("pial_ruedo_desc_perder_reata", "Perder la reata"),
  dq("pial_ruedo_desc_derribar_sin_remachar", "Derribar sin remachar"),
  dq("pial_ruedo_desc_vueltas_entrepierna", "Vueltas en la entrepierna"),
  dq("pial_ruedo_desc_ayuda_rotura_montura", "Ayuda por rotura de montura"),
  dq("pial_ruedo_desc_ayuda_directa", "Ayuda directa para rendir al toro"),
  dq("pial_ruedo_desc_auxiliar_toma_reata", "Un auxiliar toma la reata"),
  dq("pial_ruedo_desc_contacto_levantar", "Contacto al levantar"),
  dq("pial_ruedo_desc_siguiente_lazador", "El siguiente lazador inicia antes de concluir"),
  dq("pial_ruedo_desc_no_horcajadas", "No estar a horcajadas al rematar"),
  dq("pial_ruedo_desc_lesion_cabalgadura", "Lesión de la cabalgadura durante la rutina o el lazo")
]);

export const FMCH_2026_LAZO_DISABLED_LEGACY_RULES = freezeDisabled([
  ["base", "lb1"],
  ...["la1", "la2", "la3", "la4", "la5", "la6"].map((id) => ["adic", id]),
  ...["li1", "li2", "li3"].map((id) => ["infr", id]),
  ...["ld1", "ld2"].map((id) => ["desc", id])
]);

export const FMCH_2026_PIAL_RUEDO_DISABLED_LEGACY_RULES = freezeDisabled([
  ["base", "prb1"],
  ...["pra1", "pra2", "pra3", "pra4", "pra5", "pra6"].map((id) => ["adic", id]),
  ...["pri1", "pri2", "pri3"].map((id) => ["infr", id]),
  ...["prd1", "prd2"].map((id) => ["desc", id])
]);

export function isFmch2026TernaSuerte(suerteId) {
  return FMCH_2026_TERNA_SUERTE_IDS.includes(String(suerteId || ""));
}

export function buildFmch2026TernaSessionId(identity = {}) {
  const parts = [
    identity.tournamentId,
    identity.competitionId || "equipos_completo",
    identity.charreadaId,
    identity.teamId
  ].map(normalizeId);
  return parts.every(Boolean) ? `terna:${parts.join(":")}` : "";
}

export function createFmch2026TernaSession(identity = {}, options = {}) {
  const ternaSessionId = buildFmch2026TernaSessionId(identity);
  if (!ternaSessionId) throw new Error("terna-session-identity-incomplete");
  const createdAt = toIso(options.now ?? Date.now());
  const sharedTimerId = `${ternaSessionId}:timer`;
  return {
    contractVersion: FMCH_2026_TERNA_SESSION_VERSION,
    ternaSessionId,
    tournamentId: normalizeId(identity.tournamentId),
    competitionId: normalizeId(identity.competitionId || "equipos_completo"),
    charreadaId: normalizeId(identity.charreadaId),
    teamId: normalizeId(identity.teamId),
    status: "READY",
    sharedTimerId,
    opportunityLimit: FMCH_2026_TERNA_OPPORTUNITY_LIMIT,
    opportunities: Array.from({ length: FMCH_2026_TERNA_OPPORTUNITY_LIMIT }, (_, index) => ({
      sharedOpportunityId: `${ternaSessionId}:op:${index + 1}`,
      sharedSequenceNumber: index + 1,
      status: "AVAILABLE"
    })),
    currentOpportunity: 1,
    activeOpportunity: null,
    history: [],
    remateHistory: { HEAD: [], PIAL: [] },
    headCounted: false,
    pialCounted: false,
    timeAdditional: {
      eligible: false,
      completeUnusedMinutes: 0,
      pointsPerLazador: 0,
      totalPoints: 0,
      applied: false,
      appliedAt: null,
      publicationStatus: "NOT_REQUIRED",
      publishedAt: null,
      publications: [],
      failures: []
    },
    startedAt: null,
    finishedAt: null,
    revision: 0,
    createdAt,
    updatedAt: createdAt
  };
}

export function normalizeFmch2026TernaSession(value = {}, identity = {}) {
  const base = value?.ternaSessionId
    ? clone(value)
    : createFmch2026TernaSession(identity, { now: value?.createdAt || Date.now() });
  const expectedId = buildFmch2026TernaSessionId({ ...identity, ...base });
  if (!expectedId || base.ternaSessionId !== expectedId) throw new Error("terna-session-identity-conflict");
  const history = reconcileCountedHistory(
    Array.isArray(base.history)
      ? base.history.slice(0, FMCH_2026_TERNA_OPPORTUNITY_LIMIT).map(normalizeHistoryEntry)
      : []
  );
  const usedIds = new Set(history.map((item) => item.sharedOpportunityId));
  const closure = normalizeTernaClosure(base.closure);
  const closedEarly = closure?.type === "EARLY_FINISH";
  const opportunities = Array.from({ length: FMCH_2026_TERNA_OPPORTUNITY_LIMIT }, (_, index) => {
    const sharedOpportunityId = `${expectedId}:op:${index + 1}`;
    const historyEntry = history.find((item) => item.sharedOpportunityId === sharedOpportunityId);
    return historyEntry
      ? { ...historyEntry, status: "CONSUMED" }
      : {
        sharedOpportunityId,
        sharedSequenceNumber: index + 1,
        status: closedEarly ? FMCH_2026_TERNA_CLOSED_UNUSED_STATUS : "AVAILABLE"
      };
  });
  const used = Math.min(FMCH_2026_TERNA_OPPORTUNITY_LIMIT, usedIds.size);
  const complete = used >= FMCH_2026_TERNA_OPPORTUNITY_LIMIT;
  return {
    ...createFmch2026TernaSession(base, { now: base.createdAt || Date.now() }),
    ...base,
    contractVersion: FMCH_2026_TERNA_SESSION_VERSION,
    ternaSessionId: expectedId,
    sharedTimerId: normalizeId(base.sharedTimerId) || `${expectedId}:timer`,
    opportunityLimit: FMCH_2026_TERNA_OPPORTUNITY_LIMIT,
    opportunities,
    currentOpportunity: complete || closedEarly ? null : used + 1,
    history,
    remateHistory: buildFmch2026TernaRemateHistory(history),
    headCounted: history.some((item) => item.type === "HEAD" && item.countsForTerna),
    pialCounted: history.some((item) => item.type === "PIAL" && item.countsForTerna),
    status: complete
      ? "COMPLETED"
      : base.status === "FINISHED"
        ? "FINISHED"
        : used || base.status === "IN_PROGRESS"
          ? "IN_PROGRESS"
          : "READY",
    activeOpportunity: closedEarly ? null : base.activeOpportunity ? normalizeOpportunity(base.activeOpportunity) : null,
    closure,
    revision: nonNegativeInteger(base.revision),
    timeAdditional: normalizeTimeAdditional(base.timeAdditional),
    createdAt: normalizeIso(base.createdAt),
    updatedAt: normalizeIso(base.updatedAt)
  };
}

export function resolveFmch2026TernaNextSuerteId(session = {}) {
  const current = normalizeFmch2026TernaSession(session, session);
  if (!current.currentOpportunity || current.status === "COMPLETED" || current.closure?.type === "EARLY_FINISH") {
    return null;
  }
  const previous = current.history[current.history.length - 1] || null;
  if (!previous) return "lazo";
  return previous.type === "HEAD" ? "pial_ruedo" : "lazo";
}

export function canFinishFmch2026TernaSession(session = {}) {
  const current = normalizeFmch2026TernaSession(session, session);
  return current.history.length > 0 &&
    current.history.length < FMCH_2026_TERNA_OPPORTUNITY_LIMIT &&
    Boolean(current.currentOpportunity) &&
    !current.activeOpportunity &&
    current.closure?.type !== "EARLY_FINISH";
}

export function finishFmch2026TernaSession(session = {}, options = {}) {
  const current = normalizeFmch2026TernaSession(session, session);
  if (!canFinishFmch2026TernaSession(current)) {
    return { ok: false, reason: "terna-early-finish-not-available", session: current };
  }
  const now = toIso(options.now ?? Date.now());
  const closedOpportunityIds = current.opportunities
    .filter((opportunity) => opportunity.status !== "CONSUMED")
    .map((opportunity) => opportunity.sharedOpportunityId);
  const next = normalizeFmch2026TernaSession({
    ...current,
    status: "FINISHED",
    activeOpportunity: null,
    currentOpportunity: null,
    finishedAt: now,
    updatedAt: now,
    revision: current.revision + 1,
    closure: {
      type: "EARLY_FINISH",
      reason: String(options.reason || "operator-finished-terna").slice(0, 160),
      closedAt: now,
      closedBy: normalizeId(options.closedBy),
      source: String(options.source || "scorer").slice(0, 80),
      closedOpportunityIds
    }
  }, current);
  return { ok: true, idempotent: false, session: next, closedOpportunityIds };
}

export function validateFmch2026TernaSession(session = {}) {
  const errors = [];
  let normalized = null;
  if (Array.isArray(session?.history) && session.history.length > FMCH_2026_TERNA_OPPORTUNITY_LIMIT) {
    errors.push("terna-opportunity-limit-exceeded");
  }
  try {
    normalized = normalizeFmch2026TernaSession(session, session);
  } catch (error) {
    errors.push(error?.message || "terna-session-invalid");
  }
  if (normalized) {
    if (normalized.history.length > FMCH_2026_TERNA_OPPORTUNITY_LIMIT) errors.push("terna-opportunity-limit-exceeded");
    const sequences = normalized.history.map((item) => item.sharedSequenceNumber);
    if (new Set(sequences).size !== sequences.length) errors.push("terna-sequence-duplicate");
    if (sequences.some((value, index) => value !== index + 1)) errors.push("terna-sequence-gap");
  }
  return { valid: errors.length === 0, errors, session: normalized };
}

export function buildFmch2026TernaOpportunityDraft(session = {}, input = {}) {
  const current = normalizeFmch2026TernaSession(session, session);
  if (!current.currentOpportunity) return { ok: false, reason: "terna-opportunity-limit-reached", session: current };
  const type = normalizeTernaType(input.type || input.suerteId);
  if (!type) return { ok: false, reason: "terna-opportunity-type-invalid", session: current };
  const sequence = current.currentOpportunity;
  const opportunity = normalizeOpportunity({
    sharedOpportunityId: `${current.ternaSessionId}:op:${sequence}`,
    sharedSequenceNumber: sequence,
    type,
    suerteId: type === "HEAD" ? "lazo" : "pial_ruedo",
    participantId: input.participantId,
    participantName: input.participantName,
    attemptIndex: input.attemptIndex ?? sequence - 1,
    status: "PENDING_PUBLICATION",
    result: input.result || "ATTEMPTED",
    countsForTerna: input.countsForTerna,
    remateId: input.remateId,
    remateLabel: input.remateLabel,
    officialElapsedMs: input.officialElapsedMs,
    remainingMs: input.remainingMs,
    createdAt: input.createdAt || new Date().toISOString()
  });
  const sequenceValidation = validateFmch2026TernaSequence(current, opportunity);
  if (!sequenceValidation.valid) return { ok: false, reason: sequenceValidation.reason, session: current };
  return { ok: true, opportunity, session: current };
}

export function buildFmch2026TernaOfficialAttempt(attempt = {}, opportunity = {}) {
  const currentAttempt = clone(attempt && typeof attempt === "object" ? attempt : {});
  const currentOpportunity = normalizeOpportunity(opportunity);
  return {
    ...currentAttempt,
    sharedOpportunityId: currentOpportunity.sharedOpportunityId || currentAttempt.sharedOpportunityId || null,
    sharedSequenceNumber: currentOpportunity.sharedSequenceNumber || currentAttempt.sharedSequenceNumber || null,
    opportunityType: currentOpportunity.type || currentAttempt.opportunityType || null,
    opportunityStatus: "CONSUMED"
  };
}

export function validateFmch2026TernaSequence(session = {}, opportunity = {}) {
  const current = normalizeFmch2026TernaSession(session, session);
  const candidate = normalizeOpportunity(opportunity);
  if (!current.currentOpportunity) return { valid: false, reason: "terna-opportunity-limit-reached" };
  if (candidate.sharedSequenceNumber !== current.currentOpportunity) {
    return { valid: false, reason: "terna-shared-sequence-mismatch" };
  }
  if (current.activeOpportunity && current.activeOpportunity.sharedOpportunityId !== candidate.sharedOpportunityId) {
    return { valid: false, reason: "terna-simultaneous-lazador-blocked" };
  }
  return { valid: true, reason: null };
}

export function reserveFmch2026TernaOpportunity(session = {}, opportunity = {}, options = {}) {
  const current = normalizeFmch2026TernaSession(session, session);
  const candidate = normalizeOpportunity(opportunity);
  const validation = validateFmch2026TernaSequence(current, candidate);
  if (!validation.valid) return { ok: false, reason: validation.reason, session: current };
  if (current.activeOpportunity?.sharedOpportunityId === candidate.sharedOpportunityId) {
    return { ok: true, idempotent: true, session: current };
  }
  const now = toIso(options.now ?? Date.now());
  return {
    ok: true,
    idempotent: false,
    session: {
      ...current,
      status: "IN_PROGRESS",
      activeOpportunity: { ...candidate, status: "ACTIVE", startedAt: now },
      startedAt: current.startedAt || now,
      updatedAt: now,
      revision: current.revision + 1
    }
  };
}

export function commitFmch2026TernaOpportunity(session = {}, opportunity = {}, publication = {}, options = {}) {
  const current = normalizeFmch2026TernaSession(session, session);
  const candidate = normalizeOpportunity({ ...opportunity, scoreId: publication.scoreId || opportunity.scoreId });
  const existing = current.history.find((item) => item.sharedOpportunityId === candidate.sharedOpportunityId);
  if (existing) {
    const now = toIso(options.now ?? Date.now());
    const replacement = normalizeHistoryEntry({
      ...existing,
      ...candidate,
      status: "CONSUMED",
      qualifiesForTerna: candidate.qualifiesForTerna,
      scoreId: publication.scoreId || candidate.scoreId || existing.scoreId,
      publishedScoreId: publication.publishedScoreId || publication.id || existing.publishedScoreId,
      consumedAt: existing.consumedAt || now
    });
    const unchanged = stableOpportunityValue(existing) === stableOpportunityValue(replacement);
    if (unchanged) return { ok: true, idempotent: true, correction: true, entry: existing, session: current };
    const history = current.history.map((item) =>
      item.sharedOpportunityId === replacement.sharedOpportunityId ? replacement : item
    );
    const next = normalizeFmch2026TernaSession({
      ...current,
      history,
      updatedAt: now,
      revision: current.revision + 1
    }, current);
    const entry = next.history.find((item) => item.sharedOpportunityId === replacement.sharedOpportunityId);
    return { ok: true, idempotent: false, correction: true, entry, session: next };
  }
  const validation = validateFmch2026TernaSequence(current, candidate);
  if (!validation.valid) return { ok: false, reason: validation.reason, session: current };
  const now = toIso(options.now ?? Date.now());
  const alreadyCounted = candidate.type === "HEAD" ? current.headCounted : current.pialCounted;
  const entry = {
    ...candidate,
    status: "CONSUMED",
    qualifiesForTerna: Boolean(candidate.qualifiesForTerna || candidate.countsForTerna),
    countsForTerna: Boolean(candidate.qualifiesForTerna || candidate.countsForTerna) && !alreadyCounted,
    scoreId: normalizeId(publication.scoreId || candidate.scoreId),
    publishedScoreId: normalizeId(publication.publishedScoreId || publication.id),
    consumedAt: now
  };
  const history = [...current.history, entry];
  const complete = history.length >= FMCH_2026_TERNA_OPPORTUNITY_LIMIT;
  const next = normalizeFmch2026TernaSession({
    ...current,
    status: complete ? "COMPLETED" : "IN_PROGRESS",
    history,
    activeOpportunity: null,
    startedAt: current.startedAt || entry.createdAt || now,
    finishedAt: complete ? now : current.finishedAt,
    updatedAt: now,
    revision: current.revision + 1
  }, current);
  return { ok: true, idempotent: false, entry, session: next };
}

export function buildFmch2026TernaRemateHistory(history = []) {
  const output = { HEAD: [], PIAL: [] };
  (Array.isArray(history) ? history : []).forEach((entry) => {
    const type = normalizeTernaType(entry?.type || entry?.suerteId);
    if (!type || !entry?.remateId) return;
    output[type].push({
      sharedOpportunityId: normalizeId(entry.sharedOpportunityId),
      sharedSequenceNumber: positiveInteger(entry.sharedSequenceNumber, 1),
      remateId: normalizeId(entry.remateId),
      remateLabel: String(entry.remateLabel || "").slice(0, 240),
      participantId: normalizeId(entry.participantId),
      participantName: String(entry.participantName || "").slice(0, 240)
    });
  });
  return output;
}

export function shouldDisqualifyRepeatedFmch2026TernaRemate(session = {}, input = {}) {
  const normalized = normalizeFmch2026TernaSession(session, session);
  const type = normalizeTernaType(input.type || input.suerteId);
  const remateId = normalizeId(input.remateId);
  if (type !== "PIAL" || !remateId) return false;
  const participantId = normalizeId(input.participantId);
  const participantName = normalizeName(input.participantName);
  const currentOpportunityId = normalizeId(input.sharedOpportunityId);
  return normalized.history.some((entry) => {
    if (entry.type !== "PIAL" || entry.remateId !== remateId) return false;
    if (currentOpportunityId && entry.sharedOpportunityId === currentOpportunityId) return false;
    if (participantId && entry.participantId) return participantId === entry.participantId;
    return Boolean(participantName && participantName === normalizeName(entry.participantName));
  });
}

export function resolveFmch2026TernaTimeAdditional(timerView = {}, session = {}) {
  const normalized = normalizeFmch2026TernaSession(session, session);
  const remainingMs = Math.max(0, Number(timerView.remainingMs || 0));
  const completeUnusedMinutes = Math.min(7, Math.floor(remainingMs / 60000));
  const eligible = Boolean(normalized.headCounted && normalized.pialCounted);
  const pointsPerLazador = eligible ? completeUnusedMinutes : 0;
  return {
    eligible,
    completeUnusedMinutes,
    pointsPerLazador,
    totalPoints: pointsPerLazador * 2
  };
}

export function applyFmch2026TernaTimeAdditional(attempt = {}, suerte = {}, quantity = 0) {
  const next = clone(attempt || {});
  const suerteId = String(suerte?.id || suerte || "");
  if (!isFmch2026TernaSuerte(suerteId)) return next;
  const ruleId = suerteId === "lazo"
    ? "lazo_adic_tiempo_no_usado"
    : "pial_ruedo_adic_tiempo_no_usado";
  const safeQuantity = Math.max(0, Math.min(7, nonNegativeInteger(quantity)));
  next.applied = Array.isArray(next.applied) ? [...new Set(next.applied.map(String))] : [];
  next.ruleQuantities = { ...(next.ruleQuantities || {}) };
  if (safeQuantity) {
    if (!next.applied.includes(ruleId)) next.applied.push(ruleId);
    next.ruleQuantities[ruleId] = safeQuantity;
  } else {
    next.applied = next.applied.filter((id) => id !== ruleId);
    delete next.ruleQuantities[ruleId];
  }
  const catalog = suerte?.catalog || {};
  const catalogTotal = (catalog.adic || []).reduce((sum, item) => {
    const itemQuantity = Number(next.ruleQuantities?.[item.id] || (next.applied.includes(item.id) ? 1 : 0));
    return sum + Number(item.pts || 0) * itemQuantity;
  }, 0);
  const manualTotal = (next.customAdic || []).reduce((sum, item) => sum + Number(item.pts || 0), 0);
  next.adic = catalogTotal + manualTotal;
  return next;
}

function floreoRules(prefix) {
  return [
    rule(`${prefix}_adic_arracadas`, "Arracadas", 1),
    rule(`${prefix}_adic_espejos`, "Espejos", 1),
    rule(`${prefix}_adic_resorte_sencillo`, "Resorte sencillo", 1, { exclusiveGroup: `${prefix}_resorte` }),
    rule(`${prefix}_adic_resorte_sostenido`, "Resorte sostenido", 2, { exclusiveGroup: `${prefix}_resorte`, supersedes: [`${prefix}_adic_resorte_sencillo`] }),
    rule(`${prefix}_adic_resorte_corvejones`, "Resorte sostenido a los corvejones", 4, { exclusiveGroup: `${prefix}_resorte`, supersedes: [`${prefix}_adic_resorte_sencillo`, `${prefix}_adic_resorte_sostenido`] }),
    rule(`${prefix}_adic_giro_mismo_sentido`, "Giro en el mismo sentido", 2, { exclusiveGroup: `${prefix}_giro` }),
    rule(`${prefix}_adic_giro_contrario`, "Giro en sentido contrario", 3, { exclusiveGroup: `${prefix}_giro`, supersedes: [`${prefix}_adic_giro_mismo_sentido`] }),
    rule(`${prefix}_adic_resorte_cabeza`, "Resorte incluyendo la cabeza", 3, { exclusiveGroup: `${prefix}_resorte_cabeza` }),
    rule(`${prefix}_adic_resorte_sostenido_cabeza`, "Resorte sostenido incluyendo la cabeza", 4, { exclusiveGroup: `${prefix}_resorte_cabeza`, supersedes: [`${prefix}_adic_resorte_cabeza`] }),
    rule(`${prefix}_adic_movimiento_especificado`, "Movimiento especificado", 1),
    rule(`${prefix}_adic_movimiento_no_especificado`, "Movimiento no especificado", 1),
    rule(`${prefix}_adic_pararse_pasada`, "Pararse y hacer pasada", 2, { exclusiveGroup: `${prefix}_pasada` }),
    rule(`${prefix}_adic_pasada_caballo`, "Pasada con todo y caballo", 6, { exclusiveGroup: `${prefix}_pasada`, supersedes: [`${prefix}_adic_pararse_pasada`] })
  ];
}

function normalizeHistoryEntry(value = {}) {
  return {
    ...normalizeOpportunity(value),
    scoreId: normalizeId(value.scoreId),
    publishedScoreId: normalizeId(value.publishedScoreId),
    timeAdditionalPublishedScoreId: normalizeId(value.timeAdditionalPublishedScoreId),
    consumedAt: normalizeIso(value.consumedAt)
  };
}

function normalizeOpportunity(value = {}) {
  return {
    sharedOpportunityId: normalizeId(value.sharedOpportunityId),
    sharedSequenceNumber: positiveInteger(value.sharedSequenceNumber, 1),
    type: normalizeTernaType(value.type || value.suerteId),
    suerteId: normalizeTernaType(value.type || value.suerteId) === "HEAD" ? "lazo" : "pial_ruedo",
    participantId: normalizeId(value.participantId),
    participantName: String(value.participantName || "").slice(0, 240),
    attemptIndex: nonNegativeInteger(value.attemptIndex),
    status: String(value.status || "AVAILABLE").slice(0, 80),
    result: String(value.result || "ATTEMPTED").slice(0, 80),
    qualifiesForTerna: Boolean(value.qualifiesForTerna ?? value.countsForTerna),
    countsForTerna: Boolean(value.countsForTerna),
    remateId: normalizeId(value.remateId),
    remateLabel: String(value.remateLabel || "").slice(0, 240),
    officialElapsedMs: nullableNonNegativeNumber(value.officialElapsedMs),
    remainingMs: nullableNonNegativeNumber(value.remainingMs),
    createdAt: normalizeIso(value.createdAt),
    startedAt: normalizeIso(value.startedAt),
    scoreId: normalizeId(value.scoreId)
  };
}

function reconcileCountedHistory(history = []) {
  const counted = { HEAD: false, PIAL: false };
  return history.map((entry) => {
    const type = normalizeTernaType(entry.type || entry.suerteId);
    const qualifiesForTerna = Boolean(entry.qualifiesForTerna ?? entry.countsForTerna);
    const countsForTerna = Boolean(type && qualifiesForTerna && !counted[type]);
    if (countsForTerna) counted[type] = true;
    return { ...entry, qualifiesForTerna, countsForTerna };
  });
}

function stableOpportunityValue(value = {}) {
  const source = { ...value };
  delete source.consumedAt;
  return JSON.stringify(source);
}

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .slice(0, 240);
}

function normalizeTimeAdditional(value = {}) {
  return {
    eligible: Boolean(value?.eligible),
    completeUnusedMinutes: nonNegativeInteger(value?.completeUnusedMinutes),
    pointsPerLazador: nonNegativeInteger(value?.pointsPerLazador),
    totalPoints: nonNegativeInteger(value?.totalPoints),
    applied: Boolean(value?.applied),
    appliedAt: normalizeIso(value?.appliedAt),
    publicationStatus: ["NOT_REQUIRED", "PENDING", "PUBLISHED", "PARTIAL", "FAILED"].includes(value?.publicationStatus)
      ? value.publicationStatus
      : "NOT_REQUIRED",
    publishedAt: normalizeIso(value?.publishedAt),
    publications: (Array.isArray(value?.publications) ? value.publications : []).slice(0, 10).map((entry) => ({
      scoreRef: normalizeId(entry?.scoreRef),
      sharedOpportunityId: normalizeId(entry?.sharedOpportunityId),
      quantity: nonNegativeInteger(entry?.quantity),
      scoreId: normalizeId(entry?.scoreId),
      publishedScoreId: normalizeId(entry?.publishedScoreId),
      publishedAt: normalizeIso(entry?.publishedAt)
    })),
    failures: (Array.isArray(value?.failures) ? value.failures : []).slice(0, 10).map((entry) => ({
      scoreRef: normalizeId(entry?.scoreRef),
      sharedOpportunityId: normalizeId(entry?.sharedOpportunityId),
      reason: String(entry?.reason || "official-publication-failed").slice(0, 240)
    }))
  };
}

function normalizeTernaClosure(value) {
  if (!value || value.type !== "EARLY_FINISH") return null;
  return {
    type: "EARLY_FINISH",
    reason: String(value.reason || "operator-finished-terna").slice(0, 160),
    closedAt: normalizeIso(value.closedAt),
    closedBy: normalizeId(value.closedBy),
    source: String(value.source || "scorer").slice(0, 80),
    closedOpportunityIds: (Array.isArray(value.closedOpportunityIds) ? value.closedOpportunityIds : [])
      .slice(0, FMCH_2026_TERNA_OPPORTUNITY_LIMIT)
      .map(normalizeId)
      .filter(Boolean)
  };
}

function normalizeTernaType(value) {
  const clean = String(value || "").trim().toUpperCase();
  if (["HEAD", "CABECERO", "LAZO"].includes(clean)) return "HEAD";
  if (["PIAL", "PIAL_RUEDO"].includes(clean)) return "PIAL";
  return "";
}

function remateMetadata(remateType) {
  return { remate: true, remateType, source: FMCH_2026_TERNA_SOURCE };
}

function remateAdditional(remateType) {
  return { remateAdditional: true, remateType, exclusiveGroup: "pial_ruedo_remate" };
}

function timeAdditionalMetadata() {
  return { timingAdjustment: "unused_official_minutes", repeatable: true, maxQuantity: 7, automaticOnly: true };
}

function repeatable(maxQuantity = 20) {
  return { repeatable: true, maxQuantity };
}

function rule(id, label, pts, metadata = {}) {
  return { id, label, pts, metadata: { ...metadata, source: metadata.source || FMCH_2026_TERNA_SOURCE } };
}

function dq(id, label, metadata = {}) {
  return { id, label, metadata: { ...metadata, source: FMCH_2026_TERNA_SOURCE } };
}

function freezeRules(rules) {
  return Object.freeze(rules.map((item) => Object.freeze({
    ...item,
    metadata: Object.freeze({ ...(item.metadata || {}) })
  })));
}

function freezeDisabled(entries) {
  return Object.freeze(entries.map(([category, id]) => Object.freeze({ category, id })));
}

function clone(value) {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function normalizeId(value) {
  return String(value || "").trim().replace(/[^A-Za-z0-9._:@/-]/g, "_").slice(0, 240);
}

function positiveInteger(value, fallback = 1) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function nonNegativeInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
}

function nullableNonNegativeNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function toIso(value) {
  const date = typeof value === "string" ? new Date(value) : new Date(Number(value));
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function normalizeIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

import { getPortalViewDependencies } from "./portalSelectors.js?v=20260727-public-portal-core-001-v1";

const VIEW_LABELS = Object.freeze({
  inicio: "Inicio",
  "en-vivo": "En Vivo",
  programa: "Programa",
  competencias: "Competencias",
  resultados: "Resultados",
  sabana: "Sábana"
});

const CONNECTION_LABELS = Object.freeze({
  connecting: "Conectando…",
  online: "En vivo",
  stale: "Información atrasada",
  offline: "Sin conexión",
  reconnecting: "Reconectando…",
  error: "Error de actualización"
});

const CONNECTION_MESSAGES = Object.freeze({
  connecting: "Esperando información pública.",
  online: "Información pública actualizada.",
  stale: "Los datos mostrados pueden no ser recientes.",
  offline: "Se conserva la última información disponible.",
  reconnecting: "Restableciendo la actualización en tiempo real.",
  error: "No fue posible actualizar la información."
});

export function createPublicPortalShell(root, options = {}) {
  if (!root) throw new Error("public-portal-root-required");
  root.replaceChildren();
  root.className = "public-portal-shell";

  const skipLink = element("a", "public-portal-skip", "Saltar al contenido");
  skipLink.href = "#public-portal-content";

  const header = element("header", "public-portal-header");
  const masthead = element("div", "public-portal-masthead");
  const brand = element("div", "public-portal-brand");
  const logo = element("img", "public-portal-logo");
  logo.src = options.logoUrl || "./assets/obs/logo-och-original.png";
  logo.alt = "Orgullo Charro";
  logo.width = 68;
  logo.height = 68;
  const brandCopy = element("div", "public-portal-brand-copy");
  const brandName = element("span", "public-portal-brand-name", "CharroPro");
  const eventName = element("h1", "public-portal-event-name", "Portal Público");
  brandCopy.append(brandName, eventName);
  brand.append(logo, brandCopy);

  const statusArea = element("div", "public-portal-status-area");
  const eventStatus = element("span", "public-portal-event-status", "Próximamente");
  const connection = element("span", "public-portal-connection", CONNECTION_LABELS.connecting);
  connection.dataset.portalConnection = "";
  connection.dataset.state = "connecting";
  statusArea.append(eventStatus, connection);
  masthead.append(brand, statusArea);

  const eventMeta = element("div", "public-portal-event-meta");
  const eventLocation = element("p", "public-portal-event-location");
  const eventContext = element("p", "public-portal-event-context");
  const eventUpdated = element("time", "public-portal-event-updated");
  eventMeta.append(eventLocation, eventContext, eventUpdated);
  header.append(masthead, eventMeta);

  const navigationBand = element("div", "public-portal-navigation-band");
  const navigation = element("nav", "public-portal-navigation");
  navigation.setAttribute("aria-label", "Secciones del Portal Público");
  const navButtons = new Map();
  for (const [view, label] of Object.entries(VIEW_LABELS)) {
    const button = buttonElement(label, "public-portal-nav-button");
    button.dataset.portalView = view;
    button.dataset.portalFocusKey = `nav-${view}`;
    navButtons.set(view, button);
    navigation.append(button);
  }
  const selectorWrap = element("div", "public-portal-competition-control");
  const selectorLabel = element("label", "", "Competencia");
  selectorLabel.htmlFor = "public-portal-competition";
  const selector = element("select", "public-portal-competition-select");
  selector.id = "public-portal-competition";
  selector.dataset.portalCompetition = "";
  selector.dataset.portalFocusKey = "competition-selector";
  selectorWrap.append(selectorLabel, selector);
  navigationBand.append(navigation, selectorWrap);

  const connectionNotice = element("div", "public-portal-connection-notice");
  connectionNotice.dataset.portalConnectionNotice = "";
  connectionNotice.hidden = true;

  const main = element("main", "public-portal-main");
  main.id = "public-portal-content";
  main.tabIndex = -1;
  const announcements = element("div", "public-portal-sr-only");
  announcements.setAttribute("aria-live", "polite");
  announcements.setAttribute("aria-atomic", "true");
  announcements.dataset.portalAnnouncements = "";

  const footer = element("footer", "public-portal-footer");
  const footerBrand = element("span", "", "CharroPro");
  const footerStatus = element("span", "", "Datos deportivos públicos");
  footer.append(footerBrand, footerStatus);

  root.append(skipLink, header, navigationBand, connectionNotice, main, announcements, footer);
  return {
    root,
    header,
    eventName,
    eventStatus,
    eventLocation,
    eventContext,
    eventUpdated,
    connection,
    connectionNotice,
    navigation,
    navButtons,
    selectorWrap,
    selector,
    main,
    announcements,
    footerStatus,
    competitionSignature: "",
    currentView: "",
    lastAnnouncementSignature: ""
  };
}

export function renderPublicPortal(shell, model, uiState = {}, options = {}) {
  renderPortalChrome(shell, model, uiState);
  const view = VIEW_LABELS[uiState.view] ? uiState.view : "inicio";
  const changedSections = Array.isArray(options.changedSections) ? options.changedSections : [];
  const dependencies = getPortalViewDependencies(view);
  const affectsView = !changedSections.length || changedSections.some((section) => dependencies.includes(section));
  if (options.forceView || shell.currentView !== view || affectsView) {
    renderPortalView(shell, model, { ...uiState, view }, options);
    shell.currentView = view;
  }
  return {
    view,
    nodeCount: shell.root.querySelectorAll("*").length
  };
}

export function renderPublicPortalConnection(shell, connection = "connecting") {
  const state = CONNECTION_LABELS[connection] ? connection : "connecting";
  shell.connection.textContent = CONNECTION_LABELS[state];
  shell.connection.dataset.state = state;
  const showNotice = !["online", "connecting"].includes(state);
  shell.connectionNotice.hidden = !showNotice;
  shell.connectionNotice.dataset.state = state;
  shell.connectionNotice.textContent = showNotice ? CONNECTION_MESSAGES[state] : "";
}

export function announcePublicPortalChange(shell, model, connection = "connecting") {
  const turn = model.live?.turn || {};
  const signature = [
    connection,
    turn.team?.id,
    turn.participant?.id,
    turn.suerteId,
    model.live?.status
  ].join("|");
  if (!signature || signature === shell.lastAnnouncementSignature) return;
  shell.lastAnnouncementSignature = signature;
  const subject = turn.participant?.name || turn.team?.name || "";
  const message = [
    connection !== "online" ? CONNECTION_LABELS[connection] : "",
    subject ? `En turno: ${subject}` : "",
    turn.suerteName ? `Suerte: ${turn.suerteName}` : ""
  ].filter(Boolean).join(". ");
  shell.announcements.textContent = message;
}

function renderPortalChrome(shell, model, uiState) {
  shell.eventName.textContent = model.event?.name || "Portal Público";
  shell.eventStatus.textContent = eventStatusLabel(model.event?.status, model.live?.status);
  shell.eventStatus.dataset.state = eventStatusState(model.event?.status, model.live?.status);
  shell.eventLocation.textContent = formatEventLocation(model.event);
  shell.eventLocation.hidden = !shell.eventLocation.textContent;
  shell.eventContext.textContent = [
    model.overview?.activeCompetitionName,
    model.overview?.activeCharreadaName
  ].filter(Boolean).join(" · ");
  shell.eventContext.hidden = !shell.eventContext.textContent;
  const updated = formatDateTime(model.event?.sourceUpdatedAt || model.event?.generatedAt);
  shell.eventUpdated.textContent = updated ? `Actualizado ${updated}` : "";
  shell.eventUpdated.dateTime = model.event?.sourceUpdatedAt || model.event?.generatedAt || "";
  shell.eventUpdated.hidden = !updated;
  renderPublicPortalConnection(shell, uiState.connection);
  renderNavigation(shell, uiState.view);
  renderCompetitionSelector(shell, model);
  shell.footerStatus.textContent = model.legacy
    ? "Información pública compatible"
    : `Proyección pública V${model.schemaVersion || 2}`;
}

function renderNavigation(shell, activeView) {
  for (const [view, button] of shell.navButtons) {
    const active = view === activeView;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
    if (view === "en-vivo") button.classList.toggle("is-live", shell.eventStatus.dataset.state === "live");
  }
}

function renderCompetitionSelector(shell, model) {
  const competitions = model.competitions || [];
  const signature = competitions.map((item) => `${item.competitionId}:${item.displayName}`).join("|");
  if (signature !== shell.competitionSignature) {
    const fragment = document.createDocumentFragment();
    if (!competitions.length) {
      const option = element("option", "", "Sin competencias disponibles");
      option.value = "";
      fragment.append(option);
    } else {
      for (const competition of competitions) {
        const option = element("option", "", competition.displayName || competition.name);
        option.value = competition.competitionId;
        fragment.append(option);
      }
    }
    shell.selector.replaceChildren(fragment);
    shell.competitionSignature = signature;
  }
  shell.selector.disabled = competitions.length < 2;
  shell.selectorWrap.hidden = !competitions.length;
  shell.selector.value = model.selectedCompetitionId || "";
}

function renderPortalView(shell, model, uiState, options) {
  const focusKey = document.activeElement?.dataset?.portalFocusKey || "";
  const scrollLeft = shell.main.querySelector(".public-portal-table-wrap")?.scrollLeft || 0;
  const viewNode = renderAvailability(model, uiState) || renderView(model, uiState, options);
  shell.main.replaceChildren(viewNode);
  const tableWrap = shell.main.querySelector(".public-portal-table-wrap");
  if (tableWrap) tableWrap.scrollLeft = scrollLeft;
  if (focusKey) {
    const focusTarget = [...shell.root.querySelectorAll("[data-portal-focus-key]")]
      .find((node) => node.dataset.portalFocusKey === focusKey);
    focusTarget?.focus({ preventScroll: true });
  }
}

function renderAvailability(model, uiState) {
  if (model.availability === "ready") return null;
  const messages = {
    loading: ["Cargando evento", "Esperando la primera actualización pública."],
    "not-found": ["Evento no encontrado", "Verifica el enlace público del torneo."],
    "not-public": ["Evento no disponible", "Este evento no está publicado."],
    unavailable: ["Información no disponible", "El evento todavía no tiene información pública."],
    unsupported: ["Versión no compatible", "Este portal requiere una proyección pública compatible."],
    error: ["Actualización temporalmente no disponible", "Conservaremos la última información válida cuando exista."],
    "missing-tournament": ["Falta el torneo", "Abre el enlace público proporcionado por el organizador."]
  };
  const [title, description] = messages[model.availability] || messages.error;
  const section = element("section", "public-portal-state");
  section.setAttribute("aria-labelledby", "public-portal-state-title");
  const eyebrow = element("span", "public-portal-kicker", "CharroPro");
  const heading = element("h2", "", title);
  heading.id = "public-portal-state-title";
  const copy = element("p", "", description);
  section.append(eyebrow, heading, copy);
  if (uiState.connection === "offline") {
    section.append(element("p", "public-portal-state-note", CONNECTION_MESSAGES.offline));
  }
  return section;
}

function renderView(model, uiState, options) {
  switch (uiState.view) {
    case "en-vivo":
      return renderLiveView(model);
    case "programa":
      return renderProgramView(model);
    case "competencias":
      return renderCompetitionsView(model);
    case "resultados":
      return renderResultsView(model, uiState, options);
    case "sabana":
      return renderSheetView(model, uiState, options);
    default:
      return renderHomeView(model);
  }
}

function renderHomeView(model) {
  const fragment = document.createDocumentFragment();
  const intro = element("section", "public-portal-intro");
  const copy = element("div");
  copy.append(
    element("span", "public-portal-kicker", "Estado del evento"),
    element("h2", "", homeHeadline(model)),
    element("p", "", homeContext(model))
  );
  const quickLive = buttonElement("Ver En Vivo", "public-portal-primary-action");
  quickLive.dataset.portalView = "en-vivo";
  quickLive.dataset.portalFocusKey = "home-live";
  intro.append(copy, quickLive);
  fragment.append(intro);

  const metrics = element("section", "public-portal-metrics");
  metrics.setAttribute("aria-label", "Resumen del evento");
  metrics.append(
    metric("Competencias", formatNumber(model.home.competitionsCount)),
    metric("Jornadas", formatNumber(model.home.programCount || model.program.length)),
    metric("Resultados publicados", formatNumber(model.home.resultsCount)),
    metric("Actualización", formatTime(model.event.sourceUpdatedAt) || "Pendiente")
  );
  fragment.append(metrics);

  const overview = element("div", "public-portal-home-grid");
  overview.append(renderLiveSummary(model), renderNextProgram(model), renderCompetitionSummary(model));
  fragment.append(overview);
  return fragment;
}

function renderLiveSummary(model) {
  const section = sectionPanel("En Vivo", model.live.competitionName || "Actividad oficial");
  const turn = model.live.turn || {};
  const grid = element("dl", "public-portal-detail-grid");
  addDetail(grid, "En turno", turn.participant?.name || turn.team?.name || "Sin turno");
  addDetail(grid, "Suerte", turn.suerteName || "No disponible");
  addDetail(grid, "Charreada", model.live.charreadaName || "No disponible");
  addDetail(grid, "Tiempo", formatTimer(model.live.timer));
  section.append(grid);
  return section;
}

function renderNextProgram(model) {
  const item = model.home.nextProgramItem;
  const section = sectionPanel("Siguiente en programa", item?.scheduledTime || "Por confirmar");
  if (!item) {
    section.append(emptyMessage("No hay una siguiente actividad publicada."));
    return section;
  }
  const title = element("h3", "public-portal-feature-title", item.name);
  const meta = element("p", "public-portal-feature-meta", [
    displayDate(item.scheduledDate),
    item.phaseName,
    participantCountLabel(item)
  ].filter(Boolean).join(" · "));
  section.append(title, meta);
  return section;
}

function renderCompetitionSummary(model) {
  const section = sectionPanel("Competencias", `${model.competitions.length} publicadas`);
  const list = element("div", "public-portal-compact-list");
  for (const competition of model.competitions.slice(0, 4)) {
    const row = element("button", "public-portal-compact-row");
    row.type = "button";
    row.dataset.portalCompetitionChoice = competition.competitionId;
    row.dataset.portalViewTarget = "competencias";
    const name = element("strong", "", competition.displayName);
    const count = element("span", "", `${competition.charreadasCount} jornadas`);
    row.append(name, count);
    list.append(row);
  }
  section.append(list.children.length ? list : emptyMessage("No hay competencias publicadas."));
  return section;
}

function renderLiveView(model) {
  const fragment = document.createDocumentFragment();
  const heading = viewHeading(
    "En Vivo",
    [model.live.competitionName, model.live.categoryName, model.live.phaseName].filter(Boolean).join(" · "),
    model.live.status
  );
  fragment.append(heading);

  const turn = model.live.turn || {};
  const main = element("section", "public-portal-live-stage");
  const identity = element("div", "public-portal-live-identity");
  identity.append(
    element("span", "public-portal-kicker", turn.participant?.name ? "Participante en turno" : "Equipo en turno"),
    element("h3", "", turn.participant?.name || turn.team?.name || "Sin turno oficial")
  );
  const association = turn.participant?.association || turn.team?.association;
  if (association) identity.append(element("p", "", association));
  const suerte = element("div", "public-portal-live-suerte");
  suerte.append(
    element("span", "", "Suerte"),
    element("strong", "", turn.suerteName || "No disponible")
  );
  main.append(identity, suerte);
  fragment.append(main);

  const detail = element("dl", "public-portal-detail-grid public-portal-detail-grid-wide");
  addDetail(detail, "Charreada", model.live.charreadaName || "No disponible");
  addDetail(detail, "Caballo", turn.horse?.name || "No disponible");
  addDetail(detail, "Tiempo oficial", formatTimer(model.live.timer));
  addDetail(detail, "Estado", liveStatusLabel(model.live.status));
  fragment.append(detail);

  const standings = sectionPanel("Marcador publicado", model.selectedCompetition?.displayName || "");
  standings.append(renderStandingsTable(model.live.standings));
  fragment.append(standings);
  return fragment;
}

function renderProgramView(model) {
  const fragment = document.createDocumentFragment();
  fragment.append(viewHeading("Programa", `${model.program.length} actividades publicadas`));
  if (!model.program.length) {
    fragment.append(emptyState("Sin programa", "El programa todavía no está disponible."));
    return fragment;
  }
  const groups = groupProgramByDate(model.program);
  for (const [date, items] of groups) {
    const section = element("section", "public-portal-program-day");
    const header = element("div", "public-portal-section-heading");
    header.append(element("h3", "", date), element("span", "", `${items.length} actividades`));
    const list = element("div", "public-portal-program-list");
    for (const item of items) {
      const active = item.charreadaId && item.charreadaId === model.overview.activeCharreadaId;
      const article = element("article", "public-portal-program-item");
      article.classList.toggle("is-active", active);
      if (active) article.setAttribute("aria-current", "true");
      const time = element("time", "public-portal-program-time", item.scheduledTime || "Por confirmar");
      const content = element("div", "public-portal-program-content");
      content.append(
        element("h4", "", item.name),
        element("p", "", programItemContext(item, model.competitions))
      );
      const state = element("span", "public-portal-program-status", active ? "En curso" : programStatusLabel(item.status));
      article.append(time, content, state);
      list.append(article);
    }
    section.append(header, list);
    fragment.append(section);
  }
  return fragment;
}

function renderCompetitionsView(model) {
  const fragment = document.createDocumentFragment();
  fragment.append(viewHeading("Competencias", `${model.competitions.length} disponibles`));
  if (!model.competitions.length) {
    fragment.append(emptyState("Sin competencias", "Aún no hay competencias publicadas."));
    return fragment;
  }
  const grid = element("section", "public-portal-competition-grid");
  grid.setAttribute("aria-label", "Competencias disponibles");
  for (const competition of model.competitions) {
    const article = element("article", "public-portal-competition-card");
    article.classList.toggle("is-selected", competition.competitionId === model.selectedCompetitionId);
    const type = element("span", "public-portal-kicker", competitionTypeLabel(competition.competitionType));
    const name = element("h3", "", competition.displayName);
    const meta = element("p", "", [
      competition.competitionScope === "individual" ? "Individual" : "Por equipos",
      competition.categoryName,
      competition.phaseName
    ].filter(Boolean).join(" · "));
    const stats = element("dl", "public-portal-competition-stats");
    addDetail(stats, "Jornadas", formatNumber(competition.charreadasCount));
    addDetail(stats, "Resultados", formatNumber(competition.resultsCount));
    const suertes = element("p", "public-portal-competition-suertes", competition.suerteIds
      .map(suerteLabel)
      .join(" · ") || "Modalidad sin suertes publicadas");
    const actions = element("div", "public-portal-card-actions");
    const results = buttonElement("Ver resultados", "public-portal-secondary-action");
    results.dataset.portalCompetitionChoice = competition.competitionId;
    results.dataset.portalViewTarget = "resultados";
    actions.append(results);
    article.append(type, name, meta, stats, suertes, actions);
    grid.append(article);
  }
  fragment.append(grid);
  return fragment;
}

function renderResultsView(model, uiState, options) {
  const fragment = document.createDocumentFragment();
  fragment.append(viewHeading(
    "Resultados",
    model.selectedCompetition?.displayName || "Competencia no seleccionada"
  ));
  fragment.append(renderResultFilters(model, uiState));
  const section = sectionPanel("Resultados oficiales publicados", `${model.results.length} registros`);
  if (!model.results.length) {
    section.append(emptyMessage("No hay resultados publicados para esta selección."));
  } else {
    const table = createTable(["Posición oficial", resultEntityLabel(model), "Asociación", "Categoría", "Total oficial", "Estado"]);
    for (const row of model.results) {
      const tr = element("tr");
      if (options.updatedResultIds?.has(row.resultId)) tr.classList.add("is-updated");
      tr.dataset.resultId = row.resultId;
      appendCell(tr, formatOfficialPosition(row.officialPosition), { header: true });
      appendCell(tr, row.displayName);
      appendCell(tr, row.association || "—");
      appendCell(tr, row.categoryName || "—");
      appendScoreCell(tr, row.officialTotal, row.subtotal);
      appendCell(tr, resultStatusLabel(row));
      table.tbody.append(tr);
    }
    section.append(wrapTable(table.table));
  }
  fragment.append(section);
  return fragment;
}

function renderSheetView(model, uiState, options) {
  const fragment = document.createDocumentFragment();
  fragment.append(viewHeading(
    "Sábana",
    model.selectedCompetition?.displayName || "Competencia no seleccionada"
  ));
  fragment.append(renderResultFilters(model, uiState));
  const section = sectionPanel("Detalle oficial", `${model.sheet.rows.length} registros`);
  if (!model.sheet.rows.length) {
    section.append(emptyMessage("No hay resultados publicados para construir la sábana."));
    fragment.append(section);
    return fragment;
  }
  const table = element("table", "public-portal-table public-portal-sheet");
  const thead = element("thead");
  const groupRow = element("tr");
  const participantGroup = element("th", "", "Participante");
  participantGroup.colSpan = 2;
  participantGroup.scope = "colgroup";
  groupRow.append(participantGroup);
  if (model.sheet.columns.length) {
    const scoresGroup = element("th", "", "Suertes");
    scoresGroup.colSpan = model.sheet.columns.length;
    scoresGroup.scope = "colgroup";
    groupRow.append(scoresGroup);
  }
  const resultColumnCount = 2 + (model.sheet.showPenalty ? 1 : 0);
  const resultGroup = element("th", "", "Resultado");
  resultGroup.colSpan = resultColumnCount;
  resultGroup.scope = "colgroup";
  groupRow.append(resultGroup);
  const headerRow = element("tr");
  for (const label of [model.sheet.participantLabel, "Asociación"]) {
    const th = element("th", "", label);
    th.scope = "col";
    headerRow.append(th);
  }
  for (const column of model.sheet.columns) {
    const th = element("th", "", column.label);
    th.scope = "col";
    headerRow.append(th);
  }
  if (model.sheet.showPenalty) {
    const th = element("th", "", "Penalizaciones");
    th.scope = "col";
    headerRow.append(th);
  }
  for (const label of ["Total oficial", "Posición oficial"]) {
    const th = element("th", "", label);
    th.scope = "col";
    headerRow.append(th);
  }
  thead.append(groupRow, headerRow);
  const tbody = element("tbody");
  for (const row of model.sheet.rows) {
    const tr = element("tr");
    if (options.updatedResultIds?.has(row.resultId)) tr.classList.add("is-updated");
    appendCell(tr, row.name, { header: true, sticky: true });
    appendCell(tr, row.association || "—");
    for (const column of model.sheet.columns) appendCell(tr, formatScore(row.scores[column.id]), { numeric: true });
    if (model.sheet.showPenalty) appendCell(tr, formatScore(row.teamPenaltyTotal), { numeric: true });
    appendCell(tr, formatScore(row.officialTotal), { numeric: true, strong: true });
    appendCell(tr, formatOfficialPosition(row.officialPosition), { numeric: true });
    tbody.append(tr);
  }
  table.append(thead, tbody);
  section.append(wrapTable(table));
  fragment.append(section);
  return fragment;
}

function renderResultFilters(model, uiState) {
  const filters = element("section", "public-portal-filters");
  filters.setAttribute("aria-label", "Filtros de resultados");
  const definitions = [
    ["categoryId", "Categoría", model.resultFilters.categories],
    ["phaseId", "Fase", model.resultFilters.phases],
    ["charreadaId", "Charreada", model.resultFilters.charreadas]
  ];
  for (const [key, labelText, options] of definitions) {
    if (!options.length) continue;
    const field = element("div", "public-portal-filter");
    const label = element("label", "", labelText);
    const select = element("select");
    select.dataset.portalFilter = key;
    select.dataset.portalFocusKey = `filter-${key}`;
    label.htmlFor = `public-portal-filter-${key}`;
    select.id = label.htmlFor;
    const all = element("option", "", "Todas");
    all.value = "";
    select.append(all);
    for (const optionDefinition of options) {
      const option = element("option", "", optionDefinition.label);
      option.value = optionDefinition.value;
      select.append(option);
    }
    select.value = uiState[key] || "";
    field.append(label, select);
    filters.append(field);
  }
  filters.hidden = !filters.children.length;
  return filters;
}

function renderStandingsTable(rows = []) {
  if (!rows.length) return emptyMessage("No hay marcador publicado para esta charreada.");
  const table = createTable(["Posición oficial", "Participante", "Total publicado"]);
  for (const row of rows) {
    const tr = element("tr");
    tr.classList.toggle("is-active", row.active);
    appendCell(tr, formatOfficialPosition(row.officialPosition), { header: true });
    appendCell(tr, row.name || "No registrado");
    appendCell(tr, formatScore(row.total), { numeric: true, strong: true });
    table.tbody.append(tr);
  }
  return wrapTable(table.table);
}

function createTable(headers) {
  const table = element("table", "public-portal-table");
  const thead = element("thead");
  const headerRow = element("tr");
  for (const label of headers) {
    const th = element("th", "", label);
    th.scope = "col";
    headerRow.append(th);
  }
  const tbody = element("tbody");
  thead.append(headerRow);
  table.append(thead, tbody);
  return { table, tbody };
}

function wrapTable(table) {
  const wrap = element("div", "public-portal-table-wrap");
  wrap.tabIndex = 0;
  wrap.setAttribute("aria-label", "Tabla desplazable");
  wrap.append(table);
  return wrap;
}

function appendCell(row, value, options = {}) {
  const cell = element(options.header ? "th" : "td", "", value);
  if (options.header) cell.scope = "row";
  if (options.numeric) cell.classList.add("is-numeric");
  if (options.strong) cell.classList.add("is-strong");
  if (options.sticky) cell.classList.add("is-sticky");
  row.append(cell);
  return cell;
}

function appendScoreCell(row, officialTotal, subtotal) {
  const cell = element("td", "is-numeric");
  if (officialTotal !== null && officialTotal !== undefined) {
    cell.append(element("strong", "", formatScore(officialTotal)));
  } else {
    cell.append(element("span", "", "—"));
    if (subtotal !== null && subtotal !== undefined) {
      cell.append(element("small", "", `Subtotal publicado: ${formatScore(subtotal)}`));
    }
  }
  row.append(cell);
}

function sectionPanel(title, meta = "") {
  const section = element("section", "public-portal-section");
  const heading = element("div", "public-portal-section-heading");
  heading.append(element("h2", "", title));
  if (meta) heading.append(element("span", "", meta));
  section.append(heading);
  return section;
}

function viewHeading(title, context = "", status = "") {
  const header = element("header", "public-portal-view-heading");
  const copy = element("div");
  copy.append(element("span", "public-portal-kicker", "Portal Público"), element("h2", "", title));
  if (context) copy.append(element("p", "", context));
  header.append(copy);
  if (status) header.append(element("span", "public-portal-view-status", liveStatusLabel(status)));
  return header;
}

function emptyState(title, description) {
  const section = element("section", "public-portal-state public-portal-state-inline");
  section.append(element("h3", "", title), element("p", "", description));
  return section;
}

function emptyMessage(message) {
  return element("p", "public-portal-empty-message", message);
}

function metric(label, value) {
  const article = element("article", "public-portal-metric");
  article.append(element("span", "", label), element("strong", "", value));
  return article;
}

function addDetail(list, label, value) {
  const group = element("div");
  group.append(element("dt", "", label), element("dd", "", value));
  list.append(group);
}

function buttonElement(label, className = "") {
  const button = element("button", className, label);
  button.type = "button";
  return button;
}

function element(tagName, className = "", textContent = null) {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (textContent !== null && textContent !== undefined) node.textContent = String(textContent);
  return node;
}

function formatEventLocation(event) {
  return [event?.venue, formatDateRange(event?.startDate, event?.endDate)].filter(Boolean).join(" · ");
}

function formatDateRange(start, end) {
  const startLabel = displayDate(start);
  const endLabel = displayDate(end);
  if (!startLabel) return endLabel;
  if (!endLabel || startLabel === endLabel) return startLabel;
  return `${startLabel} al ${endLabel}`;
}

function displayDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatTimer(timer = {}) {
  if (timer.status !== "available") return "No disponible";
  if (timer.timeText) return timer.timeText;
  if (timer.timeMs === null || timer.timeMs === undefined) return "No disponible";
  const totalSeconds = Math.max(0, Math.floor(timer.timeMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatScore(value) {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 }).format(number);
}

function formatNumber(value) {
  const number = Number(value);
  return new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(Number.isFinite(number) ? number : 0);
}

function formatOfficialPosition(value) {
  const position = Number(value);
  return Number.isSafeInteger(position) && position > 0 ? String(position) : "—";
}

function groupProgramByDate(program) {
  const groups = new Map();
  for (const item of program) {
    const label = displayDate(item.scheduledDate) || "Fecha por confirmar";
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(item);
  }
  return groups;
}

function programItemContext(item, competitions) {
  const competition = competitions.find((entry) => entry.competitionId === item.competitionId);
  return [
    competition?.displayName,
    item.categoryName,
    item.phaseName,
    participantCountLabel(item)
  ].filter(Boolean).join(" · ");
}

function participantCountLabel(item) {
  const count = item.participants?.length || 0;
  return `${count} ${count === 1 ? "participante" : "participantes"}`;
}

function resultEntityLabel(model) {
  return model.selectedCompetition?.competitionScope === "individual" ? "Participante" : "Equipo";
}

function resultStatusLabel(row) {
  if (row.officialPosition !== null) return "Oficial";
  if (row.officialTotal !== null) return "Total publicado";
  return "Subtotal publicado";
}

function homeHeadline(model) {
  const turn = model.live?.turn || {};
  if (turn.participant?.name || turn.team?.name) return "La actividad oficial está en curso";
  if (model.event?.status === "finished") return "El evento ha finalizado";
  return "Consulta la información oficial del evento";
}

function homeContext(model) {
  return [
    model.live?.competitionName || model.overview?.activeCompetitionName,
    model.live?.charreadaName || model.overview?.activeCharreadaName,
    model.live?.turn?.suerteName
  ].filter(Boolean).join(" · ") || "Programa, competencias y resultados publicados.";
}

function eventStatusState(eventStatus, liveStatus) {
  const normalized = String(liveStatus || eventStatus || "").toLowerCase();
  if (["live", "en vivo", "active"].includes(normalized)) return "live";
  if (["finished", "completed", "terminado", "terminada"].includes(normalized)) return "finished";
  return "ready";
}

function eventStatusLabel(eventStatus, liveStatus) {
  const state = eventStatusState(eventStatus, liveStatus);
  if (state === "live") return "En Vivo";
  if (state === "finished") return "Finalizado";
  return "Programado";
}

function liveStatusLabel(status) {
  const labels = {
    live: "En Vivo",
    prepared: "Preparado",
    paused: "Pausado",
    unavailable: "No disponible",
    stale: "Información atrasada",
    offline: "Sin conexión"
  };
  return labels[String(status || "").toLowerCase()] || "Publicado";
}

function programStatusLabel(status) {
  const labels = {
    upcoming: "Próxima",
    programada: "Programada",
    active: "En curso",
    "en vivo": "En curso",
    completed: "Finalizada",
    terminada: "Finalizada",
    unavailable: "No disponible",
    legacy: "Publicada"
  };
  return labels[String(status || "").toLowerCase()] || String(status || "Publicada");
}

function competitionTypeLabel(type) {
  const labels = {
    equipos_completo: "Competencia por equipos",
    charro_completo: "Charro Completo",
    caladero: "Caladero",
    coleadero: "Coleadero",
    pialadero: "Pialadero",
    exhibicion: "Exhibición"
  };
  return labels[type] || "Competencia";
}

function suerteLabel(suerteId) {
  const labels = {
    cala: "Cala",
    piales: "Piales",
    colas: "Colas",
    toro: "Jineteo de toro",
    terna: "Terna",
    yegua: "Jineteo de yegua",
    manganas_pie: "Manganas a pie",
    manganas_caballo: "Manganas a caballo",
    paso: "Paso de la muerte"
  };
  return labels[suerteId] || suerteId;
}

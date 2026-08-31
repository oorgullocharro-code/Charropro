import { getPortalViewDependencies } from "./portalSelectors.js?v=20260831-precommercial-tournament-delete-production-backup-validation-recovery-002-v1";

const VIEW_LABELS = Object.freeze({
  inicio: "Inicio",
  "en-vivo": "En Vivo",
  programa: "Programa",
  competencias: "Rankings",
  resultados: "Resultados",
  sabana: "Sábana"
});

const VIEW_ICONS = Object.freeze({
  inicio: "home",
  "en-vivo": "broadcast",
  programa: "calendar",
  competencias: "trophy",
  resultados: "score",
  sabana: "sheet"
});

const ICON_PATHS = Object.freeze({
  home: ["M3 10.5 12 3l9 7.5", "M5.5 9.5V21h13V9.5", "M9.5 21v-7h5v7"],
  broadcast: ["M8.5 8.5a5 5 0 0 0 0 7", "M5.5 5.5a9 9 0 0 0 0 13", "M12 12h.01"],
  calendar: ["M6 3v3", "M18 3v3", "M4 8h16", "M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z"],
  trophy: ["M8 4h8v4a4 4 0 0 1-8 0V4Z", "M8 6H4v1a4 4 0 0 0 4 4", "M16 6h4v1a4 4 0 0 1-4 4", "M12 12v5", "M8 21h8", "M9 17h6v4"],
  score: ["M4 5h16v14H4Z", "M8 9h3", "M8 13h8", "M8 16h6", "M16 8v2"],
  sheet: ["M5 3h14v18H5Z", "M5 8h14", "M9 8v13", "M14 8v13", "M5 13h14", "M5 17h14"],
  location: ["M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z", "M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 7v5l3 2"],
  users: ["M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z", "M3.5 20a5.5 5.5 0 0 1 11 0", "M16 8a2.5 2.5 0 0 1 0 5", "M16 15a4.5 4.5 0 0 1 4.5 4.5"],
  status: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 8v4", "M12 16h.01"],
  offline: ["M3 3l18 18", "M8.5 8.5A7 7 0 0 0 5 11", "M15.5 8.5A7 7 0 0 1 19 11", "M8 15a6 6 0 0 1 8 0", "M12 19h.01"],
  arrow: ["M5 12h14", "M15 8l4 4-4 4"],
  medal: ["M8 3h8l-1 7-3 2-3-2Z", "M12 12a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z"],
  empty: ["M5 7h14v12H5Z", "M8 4h8v3", "M9 12h6"],
  correction: ["M4 12a8 8 0 0 1 14-5", "M18 3v4h-4", "M20 12a8 8 0 0 1-14 5", "M6 21v-4h4"],
  penalty: ["M12 3 3 20h18Z", "M12 9v4", "M12 17h.01"]
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
  const brandName = element("span", "public-portal-brand-name", "CharroPro Deportes");
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
    const button = iconButton(VIEW_ICONS[view], label, "public-portal-nav-button");
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

export function renderPublicPortalConnection(shell, connection = "connecting", model = null) {
  const state = CONNECTION_LABELS[connection] ? connection : "connecting";
  shell.connection.textContent = CONNECTION_LABELS[state];
  shell.connection.dataset.state = state;
  const showNotice = !["online", "connecting"].includes(state);
  shell.connectionNotice.hidden = !showNotice;
  shell.connectionNotice.dataset.state = state;
  shell.connectionNotice.replaceChildren();
  if (showNotice) {
    shell.connectionNotice.append(
      publicIcon(state === "offline" || state === "error" ? "offline" : "status"),
      element("span", "", CONNECTION_MESSAGES[state])
    );
  }
  const nowCard = shell.main?.querySelector(".public-portal-now");
  const nowLabel = nowCard?.querySelector(".public-portal-now-label");
  if (nowCard && nowLabel) {
    const cardState = connectionCardState(state) || liveCardState(model?.live?.status);
    nowCard.dataset.state = cardState;
    const labelText = nowLabel.querySelector("span");
    if (labelText) labelText.textContent = nowStatusLabel(cardState);
    else nowLabel.lastChild.textContent = nowStatusLabel(cardState);
  }
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
  renderPublicPortalConnection(shell, uiState.connection, model);
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
  if (model.availability === "loading") return renderPortalSkeleton(uiState.view);
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
  section.dataset.state = model.availability;
  const icon = publicIcon(stateIcon(model.availability), "public-portal-state-icon");
  const eyebrow = element("span", "public-portal-kicker", "CharroPro");
  const heading = element("h2", "", title);
  heading.id = "public-portal-state-title";
  const copy = element("p", "", description);
  section.append(icon, eyebrow, heading, copy);
  if (uiState.connection === "offline") {
    section.append(element("p", "public-portal-state-note", CONNECTION_MESSAGES.offline));
  }
  return section;
}

function renderView(model, uiState, options) {
  switch (uiState.view) {
    case "en-vivo":
      return renderLiveView(model, uiState);
    case "programa":
      return renderProgramView(model, uiState);
    case "competencias":
      return renderCompetitionsView(model);
    case "resultados":
      return renderResultsView(model, uiState, options);
    case "sabana":
      return renderSheetView(model, uiState, options);
    default:
      return renderHomeView(model, uiState);
  }
}

function renderHomeView(model, uiState) {
  const fragment = document.createDocumentFragment();
  const intro = element("section", "public-portal-intro public-portal-hero");
  intro.setAttribute("aria-labelledby", "public-portal-home-title");
  const copy = element("div", "public-portal-hero-copy");
  const state = eventStatusState(model.event?.status, model.live?.status);
  const status = element("span", "public-portal-hero-status", eventStatusLabel(model.event?.status, model.live?.status));
  status.dataset.state = state;
  const title = element("h2", "", model.event?.name || "CharroPro");
  title.id = "public-portal-home-title";
  copy.append(
    element("span", "public-portal-kicker", "Competencia oficial"),
    title,
    element("p", "public-portal-hero-headline", homeHeadline(model)),
    element("p", "public-portal-hero-context", homeContext(model))
  );
  const actions = element("div", "public-portal-hero-actions");
  const quickLive = iconButton("broadcast", "Ver En Vivo", "public-portal-primary-action");
  quickLive.dataset.portalView = "en-vivo";
  quickLive.dataset.portalFocusKey = "home-live";
  const quickProgram = iconButton("calendar", "Ver programa", "public-portal-secondary-action");
  quickProgram.dataset.portalView = "programa";
  const quickResults = iconButton("score", "Ver resultados", "public-portal-secondary-action");
  quickResults.dataset.portalView = "resultados";
  actions.append(quickLive, quickProgram, quickResults);
  const identity = element("div", "public-portal-hero-identity");
  identity.append(
    status,
    iconMeta("location", formatEventLocation(model.event) || "Sede y fecha por confirmar"),
    iconMeta("trophy", model.overview?.activeCompetitionName || "Competencia por confirmar")
  );
  intro.append(copy, actions, identity);
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
  overview.append(
    renderNowCard(model, { compact: true, connection: uiState.connection }),
    renderNextProgram(model),
    renderHomeLeaders(model),
    renderCompetitionSummary(model)
  );
  fragment.append(overview);
  return fragment;
}

function renderNextProgram(model) {
  const item = model.home.nextProgramItem;
  const section = sectionPanel("Siguiente en programa", item?.scheduledTime || "Por confirmar", "calendar");
  section.classList.add("public-portal-next-card");
  if (!item) {
    section.append(emptyMessage("No hay una siguiente actividad publicada.", "calendar"));
    return section;
  }
  const title = element("h3", "public-portal-feature-title", item.name);
  const meta = element("p", "public-portal-feature-meta", [
    displayDate(item.scheduledDate),
    item.phaseName,
    participantCountLabel(item)
  ].filter(Boolean).join(" · "));
  const action = buttonElement("Ver programa", "public-portal-text-action");
  action.dataset.portalView = "programa";
  section.append(title, meta, action);
  return section;
}

function renderCompetitionSummary(model) {
  const section = sectionPanel("Competencias", `${model.competitions.length} publicadas`, "trophy");
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
  section.append(list.children.length ? list : emptyMessage("No hay competencias publicadas.", "trophy"));
  return section;
}

function renderLiveView(model, uiState) {
  const fragment = document.createDocumentFragment();
  const turn = model.live.turn || {};
  const heading = viewHeading(
    "En Vivo",
    [model.live.competitionName, model.live.categoryName, model.live.phaseName].filter(Boolean).join(" · "),
    model.live.status
  );
  fragment.append(heading);
  fragment.append(renderNowCard(model, { connection: uiState.connection }));

  const detail = element("dl", "public-portal-detail-grid public-portal-detail-grid-wide");
  addDetail(detail, "Charreada", model.live.charreadaName || "No disponible");
  addDetail(detail, "Caballo", turn.horse?.name || "No disponible");
  addDetail(detail, "Tiempo oficial", formatTimer(model.live.timer));
  addDetail(detail, "Estado", liveStatusLabel(model.live.status));
  fragment.append(detail);

  const standings = sectionPanel("Marcador publicado", model.selectedCompetition?.displayName || "");
  standings.append(renderStandingsTable(model.live.standings));
  fragment.append(standings);
  fragment.append(renderLiveFeed(model, uiState));
  return fragment;
}

function renderLiveFeed(model, uiState) {
  const section = element("section", "public-portal-feed");
  section.setAttribute("aria-labelledby", "public-portal-feed-title");
  const header = element("div", "public-portal-feed-heading");
  const headingCopy = element("div");
  const kicker = element("span", "public-portal-kicker", "Seguimiento oficial");
  const title = element("h3", "", "Minuto a minuto");
  title.id = "public-portal-feed-title";
  headingCopy.append(kicker, title);
  const summary = element("span", "public-portal-feed-summary", `${model.liveFeed.totalCount} eventos recientes`);
  header.append(headingCopy, summary);
  section.append(header, renderLiveFeedFilters(model.liveFeed.filter || uiState.feed));

  if (model.liveFeed.pendingCount > 0) {
    const updates = buttonElement(
      `${model.liveFeed.pendingCount} ${model.liveFeed.pendingCount === 1 ? "actualización nueva" : "actualizaciones nuevas"}`,
      "public-portal-feed-updates"
    );
    updates.dataset.portalFeedShowNew = "";
    updates.dataset.portalFocusKey = "feed-new-updates";
    section.append(updates);
  }

  const freshness = renderFeedFreshness(model.liveFeed);
  if (freshness) section.append(freshness);
  if (!model.liveFeed.items.length) {
    section.append(emptyMessage(feedEmptyMessage(model.liveFeed)));
    return section;
  }

  const list = element("ol", "public-portal-feed-list");
  list.dataset.portalFeedList = "";
  for (const item of model.liveFeed.items) list.append(renderLiveFeedItem(item));
  section.append(list);
  return section;
}

function renderLiveFeedFilters(activeFilter) {
  const filters = element("div", "public-portal-feed-filters");
  filters.setAttribute("aria-label", "Filtrar minuto a minuto");
  const definitions = [
    ["all", "Todos"],
    ["score", "Calificaciones"],
    ["turn", "Cambios de turno"],
    ["penalty", "Incidencias"],
    ["timer", "Cronómetro"]
  ];
  for (const [value, label] of definitions) {
    const button = buttonElement(label, "public-portal-feed-filter");
    button.dataset.portalFeedFilter = value;
    button.dataset.portalFocusKey = `feed-${value}`;
    button.classList.toggle("is-active", value === (activeFilter || "all"));
    button.setAttribute("aria-pressed", String(value === (activeFilter || "all")));
    filters.append(button);
  }
  return filters;
}

function renderLiveFeedItem(item) {
  const row = element("li", "public-portal-feed-item");
  row.dataset.eventId = item.eventId;
  row.dataset.eventType = item.eventType || "informational";
  const marker = element("span", "public-portal-feed-marker");
  marker.append(publicIcon(liveFeedIcon(item.eventType)));
  const content = element("article", "public-portal-feed-content");
  const meta = element("div", "public-portal-feed-meta");
  const time = element("time", "", formatEventTime(item.publishedAt || item.occurredAt));
  time.dateTime = dateTimeValue(item.publishedAt || item.occurredAt);
  const state = element("span", "public-portal-feed-state", item.label);
  state.dataset.kind = item.official ? "official" : "running";
  meta.append(time, state);
  content.append(meta, element("h4", "", item.title), element("p", "", item.description));
  if (item.detail) content.append(element("p", "public-portal-feed-detail", item.detail));
  row.append(marker, content);
  return row;
}

function renderProgramView(model, uiState) {
  const fragment = document.createDocumentFragment();
  const total = model.programAll?.length || model.program.length;
  fragment.append(viewHeading("Programa", `${model.program.length} de ${total} actividades publicadas`));
  const filters = renderProgramFilters(model, uiState);
  if (filters) fragment.append(filters);
  if (model.programFeatured) fragment.append(renderFeaturedProgram(model.programFeatured, model));
  if (model.programDetail) fragment.append(renderProgramDetail(model.programDetail, model));
  if (!model.program.length) {
    fragment.append(emptyState(
      total ? "Sin coincidencias" : "Sin programa",
      total
        ? "No hay actividades para el día y la fase seleccionados."
        : "El programa todavía no está disponible."
    ));
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
      const schedule = element("div", "public-portal-program-schedule");
      const time = element("time", "public-portal-program-time", item.scheduledTime || "Por confirmar");
      time.dateTime = programDateTime(item);
      schedule.append(time);
      if (item.endTime) schedule.append(element("span", "", `a ${item.endTime}`));
      const content = element("div", "public-portal-program-content");
      const identity = element("div", "public-portal-program-identity");
      identity.append(
        element("span", "public-portal-kicker", programSequenceLabel(item)),
        element("h4", "", item.name)
      );
      const context = element("p", "public-portal-program-context", programItemContext(item, model.competitions));
      content.append(identity, context);
      if (item.venueName) content.append(element("p", "public-portal-program-venue", item.venueName));
      content.append(renderProgramParticipants(item));
      const aside = element("div", "public-portal-program-aside");
      const state = element(
        "span",
        "public-portal-program-status",
        active ? "En vivo" : programStatusLabel(item.status)
      );
      state.dataset.state = active ? "live" : item.status;
      aside.append(state, renderProgramActions(item));
      article.append(schedule, content, aside);
      list.append(article);
    }
    section.append(header, list);
    fragment.append(section);
  }
  return fragment;
}

function renderProgramFilters(model, uiState) {
  const days = model.programFilters?.days || [];
  const phases = model.programFilters?.phases || [];
  if (days.length < 2 && phases.length < 2) return null;
  const section = element("section", "public-portal-program-filters");
  section.setAttribute("aria-label", "Filtros del programa");
  if (days.length >= 2) {
    section.append(renderProgramFilterGroup(
      "Día",
      [{ value: "", label: "Todos los días" }, ...days.map((day) => ({
        value: day.value,
        label: compactDate(day.value)
      }))],
      model.activeProgramFilters?.day || uiState.programDay || "",
      "portalProgramDay"
    ));
  }
  if (phases.length >= 2) {
    section.append(renderProgramFilterGroup(
      "Fase",
      [{ value: "", label: "Todas" }, ...phases],
      model.activeProgramFilters?.phaseId || uiState.programPhaseId || "",
      "portalProgramPhase"
    ));
  }
  return section;
}

function renderProgramFilterGroup(label, options, activeValue, datasetKey) {
  const group = element("div", "public-portal-program-filter-group");
  group.append(element("span", "public-portal-program-filter-label", label));
  const controls = element("div", "public-portal-program-filter-options");
  for (const option of options) {
    const button = buttonElement(option.label, "public-portal-program-filter-button");
    button.dataset[datasetKey] = option.value;
    const active = option.value === activeValue;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
    if (active) button.setAttribute("aria-current", "page");
    controls.append(button);
  }
  group.append(controls);
  return group;
}

function renderFeaturedProgram(item, model) {
  const active = item.charreadaId && item.charreadaId === model.overview.activeCharreadaId;
  const section = element("section", "public-portal-program-featured");
  const copy = element("div");
  copy.append(
    element("span", "public-portal-kicker", active ? "Ahora en el programa" : "Sigue"),
    element("h3", "", item.name),
    element("p", "", [
      displayDate(item.scheduledDate),
      item.scheduledTime,
      item.categoryName,
      item.phaseName,
      participantCountLabel(item)
    ].filter(Boolean).join(" · "))
  );
  const action = buttonElement("Ver detalle", "public-portal-secondary-action");
  action.dataset.portalProgramDetail = item.charreadaId;
  action.dataset.portalFocusKey = `program-feature-${item.charreadaId}`;
  section.append(copy, action);
  return section;
}

function renderProgramDetail(item, model) {
  const section = element("section", "public-portal-program-detail");
  section.setAttribute("aria-labelledby", "public-portal-program-detail-title");
  const heading = element("div", "public-portal-section-heading");
  const copy = element("div");
  copy.append(
    element("span", "public-portal-kicker", "Detalle de competencia"),
    element("h3", "", item.name)
  );
  copy.querySelector("h3").id = "public-portal-program-detail-title";
  const close = buttonElement("Cerrar detalle", "public-portal-secondary-action");
  close.dataset.portalProgramDetail = "";
  heading.append(copy, close);
  const details = element("dl", "public-portal-detail-grid public-portal-detail-grid-wide");
  addDetail(details, "Fecha", displayDate(item.scheduledDate) || "Por confirmar");
  addDetail(details, "Horario", programTimeRange(item));
  addDetail(details, "Modalidad", programCompetitionLabel(item, model.competitions));
  addDetail(details, "Categoría", item.categoryName || "Sin categoría publicada");
  addDetail(details, "Fase", item.phaseName || "Sin fase publicada");
  addDetail(details, "Sede", item.venueName || "Sin sede publicada");
  addDetail(details, "Participantes", participantCountLabel(item));
  addDetail(details, "Estado", programStatusLabel(item.status));
  section.append(heading, details);
  const participants = element("div", "public-portal-program-detail-participants");
  participants.append(element("h4", "", "Orden de participación"), renderProgramParticipants(item, true));
  section.append(participants);
  if (item.publicNotes) {
    section.append(element("p", "public-portal-program-public-notes", item.publicNotes));
  }
  section.append(renderProgramActions(item, true));
  return section;
}

function renderProgramParticipants(item, expanded = false) {
  const wrap = element("div", expanded
    ? "public-portal-program-participants is-expanded"
    : "public-portal-program-participants");
  if (!item.participants?.length) {
    wrap.append(element("p", "", "Participantes por confirmar"));
    return wrap;
  }
  const list = element("ol", "public-portal-program-participant-list");
  const visible = expanded ? item.participants : item.participants.slice(0, 6);
  for (const participant of visible) {
    const row = element("li", "public-portal-program-participant");
    const order = element("span", "public-portal-program-participant-order", String(participant.order));
    const identity = element("span", "public-portal-program-participant-name");
    if (participant.logoUrl) {
      const logo = element("img", "public-portal-program-participant-logo");
      logo.src = participant.logoUrl;
      logo.alt = "";
      logo.width = 28;
      logo.height = 28;
      identity.append(logo);
    }
    identity.append(element("span", "", participant.name || "Participante no registrado"));
    row.append(order, identity);
    if (participant.region) row.append(element("span", "public-portal-program-participant-region", participant.region));
    list.append(row);
  }
  wrap.append(list);
  if (!expanded && item.participants.length > visible.length) {
    wrap.append(element("p", "public-portal-program-participant-more", `y ${item.participants.length - visible.length} más`));
  }
  return wrap;
}

function renderProgramActions(item, expanded = false) {
  const actions = element("div", "public-portal-program-actions");
  if (!expanded) {
    const detail = buttonElement("Ver detalle", "public-portal-secondary-action");
    detail.dataset.portalProgramDetail = item.charreadaId;
    actions.append(detail);
  }
  if (item.liveAvailable) {
    const live = buttonElement("Ver En Vivo", "public-portal-secondary-action");
    live.dataset.portalProgramLive = item.charreadaId;
    live.dataset.portalCompetitionChoice = item.competitionId;
    actions.append(live);
  }
  if (item.resultsAvailable) {
    const results = buttonElement("Ver resultados", "public-portal-secondary-action");
    results.dataset.portalProgramResults = item.charreadaId;
    results.dataset.portalCompetitionChoice = item.competitionId;
    actions.append(results);
  }
  return actions;
}

function renderCompetitionsView(model) {
  const fragment = document.createDocumentFragment();
  fragment.append(viewHeading("Rankings", `${model.competitions.length} competencias disponibles`));
  if (!model.competitions.length) {
    fragment.append(emptyState("Sin rankings", "Los rankings aparecerán cuando existan competencias publicadas.", "trophy"));
    return fragment;
  }
  const selectedResults = model.rankedResults || model.results || [];
  if (selectedResults.length) {
    const ranking = element("section", "public-portal-ranking-feature");
    ranking.append(
      sectionHeading(
        selectedResults.some((row) => row.totalStatus === "partial") ? "Ranking provisional" : "Ranking oficial",
        model.selectedCompetition?.displayName || "Competencia seleccionada",
        "trophy"
      ),
      renderPodium(selectedResults),
      renderRankingList(selectedResults.slice(3), model)
    );
    fragment.append(ranking);
  } else {
    fragment.append(emptyState(
      "Ranking pendiente",
      "La competencia seleccionada todavía no tiene puntuaciones oficiales publicadas.",
      "trophy"
    ));
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
    const results = buttonElement("Abrir ranking", "public-portal-secondary-action");
    results.dataset.portalCompetitionChoice = competition.competitionId;
    results.dataset.portalViewTarget = "competencias";
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
  const section = sectionPanel("Resultados oficiales publicados", `${model.results.length} registros`, "score");
  if (!model.results.length) {
    section.append(emptyMessage("No hay resultados publicados para esta selección.", "score"));
  } else {
    section.append(renderPodium(model.results));
    const cards = element("div", "public-portal-result-cards");
    for (const row of model.results) cards.append(renderScoreCard(row, model, options));
    section.append(cards);
    const tableHeading = element("h3", "public-portal-secondary-table-title", "Tabla accesible");
    section.append(tableHeading);
    const table = createTable(["Posición", resultEntityLabel(model), "Categoría", "Acumulado / total", "Estado"]);
    for (const row of model.results) {
      const tr = element("tr");
      if (options.updatedResultIds?.has(row.resultId)) tr.classList.add("is-updated");
      tr.dataset.resultId = row.resultId;
      appendCell(tr, formatOfficialPosition(row.displayPosition), { header: true });
      appendCell(tr, row.displayName);
      appendCell(tr, row.categoryName || "—");
      appendScoreCell(tr, row.displayTotal, row.totalStatus);
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
  const section = sectionPanel("Detalle oficial", `${model.sheet.rows.length} registros`, "sheet");
  if (!model.sheet.rows.length) {
    section.append(emptyMessage("No hay resultados publicados para construir la sábana.", "sheet"));
    fragment.append(section);
    return fragment;
  }
  const table = element("table", "public-portal-table public-portal-sheet");
  const thead = element("thead");
  const groupRow = element("tr");
  const participantGroup = element("th", "", "Participante");
  participantGroup.colSpan = 1;
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
  const participantHeader = element("th", "", model.sheet.participantLabel);
  participantHeader.scope = "col";
  headerRow.append(participantHeader);
  for (const column of model.sheet.columns) {
    const th = element("th");
    th.scope = "col";
    th.append(abbreviation(column.id, column.label));
    headerRow.append(th);
  }
  if (model.sheet.showPenalty) {
    const th = element("th");
    th.scope = "col";
    th.append(abbreviation("PEN", "Penalizaciones"));
    headerRow.append(th);
  }
  for (const [shortLabel, label] of [["TOTAL", "Acumulado o total oficial"], ["POS", "Posición oficial o provisional"]]) {
    const th = element("th");
    th.scope = "col";
    th.append(abbreviation(shortLabel, label));
    headerRow.append(th);
  }
  thead.append(groupRow, headerRow);
  const tbody = element("tbody");
  for (const row of model.sheet.rows) {
    const tr = element("tr");
    if (options.updatedResultIds?.has(row.resultId)) tr.classList.add("is-updated");
    appendCell(tr, row.name, { header: true, sticky: true });
    for (const column of model.sheet.columns) appendCell(tr, formatScore(row.scores[column.id]), { numeric: true });
    if (model.sheet.showPenalty) appendCell(tr, formatScore(row.teamPenaltyTotal), { numeric: true });
    appendCell(tr, formatScore(row.displayTotal), { numeric: true, strong: true });
    appendCell(tr, formatOfficialPosition(row.displayPosition), { numeric: true });
    tbody.append(tr);
  }
  table.append(thead, tbody);
  const scrollHint = element("p", "public-portal-table-hint");
  scrollHint.append(publicIcon("arrow"), element("span", "", "Desliza horizontalmente para ver todas las suertes."));
  section.append(scrollHint, wrapTable(table));
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
  const hasProvisionalPositions = rows.some((row) => (
    row.displayPosition && row.positionStatus !== "official"
  ));
  const table = createTable([
    hasProvisionalPositions ? "Posición provisional" : "Posición oficial",
    "Participante",
    "Acumulado / total"
  ]);
  for (const row of rows) {
    const tr = element("tr");
    tr.classList.toggle("is-active", row.active);
    appendCell(tr, formatOfficialPosition(row.displayPosition), { header: true });
    appendCell(tr, row.name || "No registrado");
    appendCell(tr, formatScore(row.total), { numeric: true, strong: true });
    table.tbody.append(tr);
  }
  return wrapTable(table.table);
}

function renderNowCard(model, options = {}) {
  const turn = model.live.turn || {};
  const state = connectionCardState(options.connection) || liveCardState(model.live.status);
  const section = element("section", options.compact
    ? "public-portal-live-stage public-portal-now is-compact"
    : "public-portal-live-stage public-portal-now");
  section.setAttribute("aria-labelledby", options.compact
    ? "public-portal-home-now-title"
    : "public-portal-now-title");
  section.dataset.state = state;

  const identity = element("div", "public-portal-live-identity");
  const label = element("span", "public-portal-now-label", nowStatusLabel(state));
  label.id = options.compact ? "public-portal-home-now-title" : "public-portal-now-title";
  label.prepend(publicIcon(state === "live" ? "broadcast" : "status"));
  identity.append(
    label,
    element("span", "public-portal-now-context", nowContext(model)),
    element("h3", "", turn.participant?.name || turn.team?.name || nowEmptyMessage(model))
  );

  const detail = element("div", "public-portal-live-suerte");
  detail.append(
    element("span", "", turn.participant?.name ? "Suerte oficial" : "Actividad"),
    element("strong", "", turn.suerteName || model.live.charreadaName || nowEmptyMessage(model)),
    renderNowResult(model)
  );
  if (!options.compact) {
    detail.append(iconMeta(
      "clock",
      `Actualizado ${formatTime(model.live.updatedAt || model.event.sourceUpdatedAt) || "pendiente"}`
    ));
  }
  section.append(identity, detail);
  return section;
}

function renderHomeLeaders(model) {
  const rows = model.rankedResults || model.results || model.allResults || [];
  const section = sectionPanel(
    "Líderes publicados",
    rows.length ? rows.some((row) => row.totalStatus === "partial") ? "Acumulado oficial" : "Top oficial" : "Pendiente",
    "medal"
  );
  section.classList.add("public-portal-home-leaders");
  if (!rows.length) {
    section.append(emptyMessage("Los líderes aparecerán con los primeros resultados oficiales.", "medal"));
    return section;
  }
  section.append(renderRankingList(rows.slice(0, 3), model, { compact: true }));
  const action = buttonElement("Ver rankings", "public-portal-text-action");
  action.dataset.portalView = "competencias";
  section.append(action);
  return section;
}

function renderPodium(rows = []) {
  const podiumRows = rows.filter((row) => {
    const position = Number(row.displayPosition);
    return Number.isSafeInteger(position) && position >= 1 && position <= 3;
  });
  if (!podiumRows.length) return element("div", "public-portal-podium is-empty");
  const podium = element("div", "public-portal-podium");
  podium.setAttribute("aria-label", "Podio oficial");
  for (const row of podiumRows) {
    const position = Number(row.displayPosition);
    const card = element("article", "public-portal-podium-card");
    card.dataset.position = String(position);
    card.append(
      element("span", "public-portal-podium-position", positionLabel(position)),
      publicIcon("medal", "public-portal-podium-icon"),
      element("h3", "", row.displayName || "No registrado"),
      element("strong", "public-portal-podium-score", scoreWithUnit(row.displayTotal)),
      element("span", "public-portal-podium-context", [row.categoryName, row.phaseName].filter(Boolean).join(" · ") || "Resultado oficial")
    );
    podium.append(card);
  }
  return podium;
}

function renderRankingList(rows, model, options = {}) {
  const list = element("ol", options.compact
    ? "public-portal-ranking-list is-compact"
    : "public-portal-ranking-list");
  for (const row of rows) {
    const item = element("li", "public-portal-ranking-row");
    const position = element("span", "public-portal-ranking-position", formatOfficialPosition(row.displayPosition));
    const identity = element("span", "public-portal-ranking-identity");
    identity.append(
      element("strong", "", row.displayName || "No registrado"),
      element("small", "", [row.categoryName, row.phaseName].filter(Boolean).join(" · ") || resultEntityLabel(model))
    );
    item.append(position, identity, element("strong", "public-portal-ranking-score", scoreWithUnit(row.displayTotal)));
    list.append(item);
  }
  return list;
}

function renderScoreCard(row, model, options = {}) {
  const card = element("article", "public-portal-score-card");
  if (options.updatedResultIds?.has(row.resultId)) card.classList.add("is-updated");
  card.dataset.resultId = row.resultId;
  const position = element("span", "public-portal-score-position", positionLabel(row.displayPosition));
  const copy = element("div", "public-portal-score-identity");
  copy.append(
    element("h3", "", row.displayName),
    element("p", "", [row.categoryName, row.phaseName, resultStatusLabel(row)].filter(Boolean).join(" · "))
  );
  const score = element("div", "public-portal-score-value");
  score.append(
    element("strong", "", formatScore(row.displayTotal)),
    element("span", "", row.displayTotal === null || row.displayTotal === undefined
      ? "Sin puntuación publicada"
      : row.totalStatus === "final" ? "puntos · total oficial" : "puntos · acumulado parcial")
  );
  card.append(position, copy, score);
  return card;
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

function appendScoreCell(row, displayTotal, totalStatus) {
  const cell = element("td", "is-numeric");
  if (displayTotal !== null && displayTotal !== undefined) {
    cell.append(
      element("strong", "", formatScore(displayTotal)),
      element("small", "", totalStatus === "final" ? "Total oficial" : "Acumulado parcial")
    );
  } else {
    cell.append(element("span", "", "—"));
  }
  row.append(cell);
}

function renderNowResult(model) {
  const result = model.live.currentResult;
  const container = element("div", "public-portal-now-result");
  if (!result) {
    container.append(element("span", "", "Marcador oficial"), element("strong", "", "Sin publicación reciente"));
    return container;
  }
  container.append(
    element("span", "", "Marcador oficial reciente"),
    element("strong", "", result.score === null ? "Publicado" : `${formatScore(result.score)} puntos`)
  );
  const standing = model.live.standings.find((row) => row.active) || null;
  if (standing?.total !== null && standing?.total !== undefined) {
    container.append(element("small", "", `${standing.totalStatus === "final" ? "Total oficial" : "Acumulado parcial"}: ${formatScore(standing.total)} puntos`));
  }
  if (standing?.displayPosition) {
    container.append(element("small", "", `${standing.positionStatus === "official" ? "Posición oficial" : "Posición provisional"}: ${standing.displayPosition}.º`));
  }
  return container;
}

function nowContext(model) {
  return [
    liveStatusLabel(model.live.status),
    model.live.competitionName,
    model.live.charreadaName
  ].filter(Boolean).join(" · ");
}

function nowEmptyMessage(model) {
  const status = String(model.live.status || "").toLowerCase();
  if (["finished", "completed"].includes(status)) return "La competencia terminó";
  if (["ready", "scheduled", "programada"].includes(status)) return "La competencia está programada";
  if (status === "paused") return "La competencia está en pausa";
  return "No hay una competencia en vivo";
}

function renderFeedFreshness(feed) {
  const messages = {
    stale: "Esperando actualización oficial.",
    "stale-important": "Los datos pueden estar desactualizados.",
    offline: "Sin conexión. Se conserva la última información oficial disponible."
  };
  const message = messages[feed.freshness];
  return message ? element("p", "public-portal-feed-freshness", message) : null;
}

function feedEmptyMessage(feed) {
  if (feed.filter !== "all" && feed.totalCount) return "No hay eventos de este tipo en el historial reciente.";
  if (feed.status === "finished") return "La competencia terminó. Consulta los resultados oficiales.";
  if (feed.status === "ready") return "La competencia está programada y todavía no ha comenzado.";
  return "El seguimiento minuto a minuto comenzará cuando se publique la primera actividad.";
}

function renderPortalSkeleton(view = "inicio") {
  const section = element("section", "public-portal-live-skeleton");
  section.setAttribute("aria-label", `Cargando ${VIEW_LABELS[view] || "portal público"}`);
  const now = element("div", "public-portal-skeleton-card");
  now.append(skeletonLine("wide"), skeletonLine("medium"), skeletonLine("short"));
  const feed = element("div", "public-portal-skeleton-feed");
  const rowCount = view === "sabana" ? 8 : 4;
  for (let index = 0; index < rowCount; index += 1) {
    const row = element("div", "public-portal-skeleton-row");
    row.append(skeletonLine("short"), skeletonLine("wide"), skeletonLine("medium"));
    feed.append(row);
  }
  section.append(now, feed);
  return section;
}

function skeletonLine(size) {
  const line = element("span", `public-portal-skeleton-line is-${size}`);
  line.setAttribute("aria-hidden", "true");
  return line;
}

function abbreviation(shortLabel, fullLabel) {
  const node = element("abbr", "public-portal-column-abbr", shortLabel);
  node.title = fullLabel;
  node.setAttribute("aria-label", fullLabel);
  return node;
}

function sectionPanel(title, meta = "", iconName = "") {
  const section = element("section", "public-portal-section");
  section.append(sectionHeading(title, meta, iconName));
  return section;
}

function sectionHeading(title, meta = "", iconName = "") {
  const heading = element("div", "public-portal-section-heading");
  const titleWrap = element("div", "public-portal-section-title");
  if (iconName) titleWrap.append(publicIcon(iconName));
  titleWrap.append(element("h2", "", title));
  heading.append(titleWrap);
  if (meta) heading.append(element("span", "", meta));
  return heading;
}

function viewHeading(title, context = "", status = "") {
  const header = element("header", "public-portal-view-heading");
  const copy = element("div");
  copy.append(element("span", "public-portal-kicker", "CharroPro Deportes"), element("h2", "", title));
  if (context) copy.append(element("p", "", context));
  header.append(copy);
  if (status) header.append(element("span", "public-portal-view-status", liveStatusLabel(status)));
  return header;
}

function emptyState(title, description, iconName = "empty") {
  const section = element("section", "public-portal-state public-portal-state-inline");
  section.append(
    publicIcon(iconName, "public-portal-state-icon"),
    element("h3", "", title),
    element("p", "", description)
  );
  return section;
}

function emptyMessage(message, iconName = "") {
  if (!iconName) return element("p", "public-portal-empty-message", message);
  const wrap = element("div", "public-portal-empty-message public-portal-empty-message-with-icon");
  wrap.append(publicIcon(iconName), element("p", "", message));
  return wrap;
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

function iconButton(iconName, label, className = "") {
  const button = buttonElement("", className);
  button.setAttribute("aria-label", label);
  button.append(publicIcon(iconName), element("span", "", label));
  return button;
}

function iconMeta(iconName, text) {
  const node = element("span", "public-portal-icon-meta");
  node.append(publicIcon(iconName), element("span", "", text));
  return node;
}

function publicIcon(iconName, className = "") {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("public-portal-icon");
  if (className) svg.classList.add(...className.split(/\s+/).filter(Boolean));
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.8");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  for (const pathValue of ICON_PATHS[iconName] || ICON_PATHS.status) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathValue);
    svg.append(path);
  }
  return svg;
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
  const clean = String(value);
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(clean) ? `${clean}T12:00:00` : clean);
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

function formatEventTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Hora no disponible";
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function dateTimeValue(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
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

function positionLabel(value) {
  const position = Number(value);
  return Number.isSafeInteger(position) && position > 0 ? `${position}.º` : "—";
}

function scoreWithUnit(value) {
  const formatted = formatScore(value);
  return formatted === "—" ? formatted : `${formatted} pts`;
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

function compactDate(value) {
  if (!value) return "Fecha";
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short"
  }).format(date);
}

function programDateTime(item) {
  const day = String(item.scheduledDate || "").slice(0, 10);
  if (!day || !item.scheduledTime) return day;
  return `${day}T${item.scheduledTime}`;
}

function programTimeRange(item) {
  if (!item.scheduledTime) return "Por confirmar";
  return item.endTime ? `${item.scheduledTime} a ${item.endTime}` : item.scheduledTime;
}

function programSequenceLabel(item) {
  const sequence = Number(item.sequence);
  const prefix = item.competitionScope === "individual" ? "Jornada" : "Charreada";
  return Number.isSafeInteger(sequence) && sequence > 0 ? `${prefix} ${sequence}` : prefix;
}

function programCompetitionLabel(item, competitions) {
  const competition = competitions.find((entry) => entry.competitionId === item.competitionId);
  return item.competitionName ||
    competition?.displayName ||
    competitionTypeLabel(item.competitionType);
}

function programItemContext(item, competitions) {
  return [
    programCompetitionLabel(item, competitions),
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
  if (row.totalStatus === "final") return "Total oficial";
  return "Parcial";
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

function liveCardState(status) {
  const normalized = String(status || "").toLowerCase();
  if (["live", "active", "en vivo"].includes(normalized)) return "live";
  if (["scheduled", "ready", "programada", "prepared"].includes(normalized)) return "scheduled";
  if (["paused", "pausada"].includes(normalized)) return "paused";
  if (["finished", "completed", "terminada"].includes(normalized)) return "finished";
  if (["stale", "offline"].includes(normalized)) return normalized;
  return "unavailable";
}

function connectionCardState(connection) {
  const normalized = String(connection || "").toLowerCase();
  if (["offline", "error", "reconnecting"].includes(normalized)) return "offline";
  if (normalized === "stale") return "stale";
  return "";
}

function nowStatusLabel(state) {
  const labels = {
    live: "En Vivo",
    scheduled: "Programado",
    paused: "Pausado",
    finished: "Finalizado",
    stale: "Información atrasada",
    offline: "Sin conexión",
    unavailable: "Sin actividad en vivo"
  };
  return labels[state] || labels.unavailable;
}

function stateIcon(state) {
  if (["offline", "error"].includes(state)) return "offline";
  if (state === "loading") return "broadcast";
  return "status";
}

function liveFeedIcon(type) {
  const normalized = String(type || "").toLowerCase();
  if (normalized.includes("correct")) return "correction";
  if (normalized.includes("penalty") || normalized.includes("incident")) return "penalty";
  if (normalized.includes("score")) return "score";
  if (normalized.includes("timer")) return "clock";
  if (normalized.includes("turn") || normalized.includes("participant")) return "users";
  if (normalized.includes("competition")) return "trophy";
  return "status";
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
    scheduled: "Programada",
    programada: "Programada",
    active: "En vivo",
    live: "En vivo",
    "en vivo": "En vivo",
    completed: "Finalizada",
    terminada: "Finalizada",
    postponed: "Pospuesta",
    cancelled: "Cancelada",
    unavailable: "Sin información",
    legacy: "Publicada"
  };
  return labels[String(status || "").toLowerCase()] || "Sin información";
}

function competitionTypeLabel(type) {
  const labels = {
    equipos_completo: "Competencia por equipos",
    charro_completo: "Charro Completo",
    caladero: "Caladero",
    coleadero: "Coleadero",
    pialadero: "Pialadero",
    exhibicion: "Exhibición",
    individual: "Competencia individual",
    escaramuza: "Escaramuza",
    ceremonia: "Ceremonia",
    descanso: "Descanso",
    semifinal: "Semifinal",
    final: "Final"
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

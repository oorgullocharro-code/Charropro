export function createPortalV2Shell(root) {
  const shell = element("div", "portal-v2-shell");
  const liveRegion = element("p", "portal-v2-announcer");
  liveRegion.setAttribute("aria-live", "polite");
  liveRegion.setAttribute("aria-atomic", "true");
  root.replaceChildren(shell, liveRegion);
  return { root, shell, liveRegion };
}

export function renderPortalV2(shell, model, options = {}) {
  shell.shell.replaceChildren(
    renderHero(model),
    renderNavigation(model),
    renderConnection(model),
    renderContent(model),
    renderSponsors(model),
    renderFooter(model)
  );
  applyBranding(shell.root, model.branding);
  shell.liveRegion.textContent = announcement(model, options);
}

function renderHero(model) {
  const hero = element("header", "portal-v2-hero");
  const identity = element("div", "portal-v2-hero__identity");
  if (model.branding.logoUrl) {
    const logo = element("img", "portal-v2-hero__logo");
    logo.src = model.branding.logoUrl;
    logo.alt = model.tournament.shortName || model.tournament.name;
    identity.append(logo);
  }
  const lifecycle = element("p", "portal-v2-eyebrow");
  lifecycle.textContent = model.lifecycle.label;
  const title = element("h1", "portal-v2-title");
  title.textContent = model.tournament.name;
  const detail = element("p", "portal-v2-hero__detail");
  detail.textContent = [
    model.tournament.shortName,
    model.tournament.edition,
    model.tournament.startDate,
    model.tournament.venue,
    model.tournament.city,
    model.tournament.state,
    model.tournament.organization
  ].filter(Boolean).join(" · ") || model.lifecycle.detail;
  identity.append(lifecycle, title, detail);
  hero.append(identity);
  if (model.branding.heroImageUrl || model.branding.coverImageUrl) {
    const image = element("img", "portal-v2-hero__image");
    image.src = model.branding.heroImageUrl || model.branding.coverImageUrl;
    image.alt = "";
    image.loading = "eager";
    hero.append(image);
  }
  return hero;
}

function renderNavigation(model) {
  const nav = element("nav", "portal-v2-nav");
  nav.setAttribute("aria-label", "Secciones del portal");
  for (const item of model.navigation) {
    const button = element("button", "portal-v2-nav__item");
    button.type = "button";
    button.dataset.portalV2View = item.view;
    button.textContent = item.label;
    if (item.view === model.view) button.setAttribute("aria-current", "page");
    nav.append(button);
  }
  return nav;
}

function renderConnection(model) {
  const strip = element("section", "portal-v2-live-strip");
  strip.setAttribute("aria-label", "Estado del evento");
  const state = element("strong", "portal-v2-live-strip__state");
  state.textContent = model.lifecycle.label;
  const detail = element("span", "portal-v2-live-strip__detail");
  detail.textContent = model.availability === "ready"
    ? model.connection === "stale" ? "Mostrando la última publicación oficial mientras se actualiza la conexión." : model.lifecycle.detail
    : availabilityCopy(model.availability);
  strip.append(state, detail);
  return strip;
}

function renderContent(model) {
  const main = element("main", "portal-v2-main");
  main.id = "portal-v2-main";
  if (model.availability !== "ready") {
    const state = element("section", "portal-v2-state");
    state.setAttribute("role", model.availability === "error" || model.availability === "unsupported" ? "alert" : "status");
    const title = element("h2");
    title.textContent = availabilityTitle(model.availability);
    const detail = element("p");
    detail.textContent = availabilityCopy(model.availability);
    state.append(title, detail);
    main.append(state);
    return main;
  }
  const heading = element("h2", "portal-v2-section-title");
  heading.textContent = navigationLabel(model);
  main.append(heading, renderView(model));
  return main;
}

function renderView(model) {
  const section = element("section", "portal-v2-view");
  if (model.publicData.status !== "ready" && ["resultados", "posiciones", "sabana"].includes(model.view)) {
    section.append(renderDataState("inconsistent-snapshot"));
    return section;
  }
  if (model.view === "en-vivo") {
    section.append(renderLiveContext(model), renderResolvedHighlight(model));
    return section;
  }
  if (model.view === "resultados") {
    section.append(renderResults(model));
    return section;
  }
  if (model.view === "posiciones") {
    section.append(renderStandings(model));
    return section;
  }
  if (model.view === "sabana") {
    section.append(renderSheet(model));
    return section;
  }
  const copy = element("p", "portal-v2-view__copy");
  copy.textContent = viewCopy(model.view, model.lifecycle.status);
  section.append(copy);
  if (["resultados", "posiciones", "sabana"].includes(model.view)) section.append(renderResolvedHighlight(model));
  return section;
}

function renderResults(model) {
  if (model.publicData.resultState !== "ready") return renderDataState(model.publicData.resultState);
  const container = element("div", "portal-v2-results");
  for (const group of model.publicData.resultGroups) {
    const section = element("section", "portal-v2-result-group");
    const title = element("h3", "portal-v2-group-title");
    title.textContent = group.title;
    section.append(title);
    if (group.phase && group.phase !== group.title) {
      const phase = element("p", "portal-v2-group-detail");
      phase.textContent = group.phase;
      section.append(phase);
    }
    const grid = element("div", "portal-v2-results-grid");
    for (const result of group.items) grid.append(renderResultCard(result));
    section.append(grid);
    container.append(section);
  }
  return container;
}

function renderResultCard(result) {
  const article = element("article", "portal-v2-result-card");
  const header = element("header", "portal-v2-result-card__header");
  const team = element("h4");
  team.textContent = result.teamName;
  const status = element("span", "portal-v2-status");
  status.textContent = result.status.label;
  header.append(team, status);
  const total = element("strong", "portal-v2-result-card__total");
  total.textContent = `${formatNumber(result.total)} pts`;
  total.setAttribute("aria-label", `Total ${formatNumber(result.total)} puntos`);
  article.append(header, total);
  if (result.position !== null) {
    const position = element("p", "portal-v2-result-card__position");
    position.textContent = `Posición publicada: ${result.position}°`;
    article.append(position);
  }
  const summary = element("dl", "portal-v2-result-card__summary");
  appendDefinition(summary, "Subtotal", formatNumber(result.subtotal));
  appendDefinition(summary, "Penalizaciones", formatNumber(result.penalties));
  article.append(summary, renderColumns(result.columns));
  return article;
}

function renderColumns(columns) {
  const list = element("dl", "portal-v2-columns");
  for (const column of columns) appendDefinition(list, column.label, formatNumber(column.value));
  return list;
}

function renderStandings(model) {
  if (model.publicData.standingsState !== "ready") return renderDataState(model.publicData.standingsState);
  const container = element("div", "portal-v2-standings");
  if (model.publicData.champion) {
    const champion = element("section", "portal-v2-champion");
    const label = element("p", "portal-v2-eyebrow");
    label.textContent = "Campeón publicado";
    const name = element("h3");
    name.textContent = model.publicData.champion.teamName;
    const total = element("strong");
    total.textContent = `${formatNumber(model.publicData.champion.total)} pts`;
    champion.append(label, name, total);
    container.append(champion);
  }
  for (const group of model.publicData.standingGroups) {
    const section = element("section", "portal-v2-standing-group");
    const title = element("h3", "portal-v2-group-title");
    title.textContent = group.title;
    section.append(title);
    if (group.podium.length) section.append(renderPodium(group.podium));
    section.append(renderStandingsTable(group.items, group.title));
    container.append(section);
  }
  return container;
}

function renderPodium(items) {
  const list = element("ol", "portal-v2-podium");
  list.setAttribute("aria-label", "Podio publicado");
  for (const item of items) {
    const entry = element("li", "portal-v2-podium__item");
    const position = element("strong");
    position.textContent = `${item.position}°`;
    const team = element("span");
    team.textContent = item.teamName;
    const total = element("span");
    total.textContent = `${formatNumber(item.total)} pts`;
    entry.append(position, team, total);
    list.append(entry);
  }
  return list;
}

function renderStandingsTable(items, title) {
  const wrapper = element("div", "portal-v2-table-scroll");
  const table = element("table", "portal-v2-table");
  const caption = element("caption", "portal-v2-table__caption");
  caption.textContent = `${title}: posiciones publicadas`;
  const head = element("thead");
  const headRow = element("tr");
  for (const label of ["Pos.", "Equipo", "Total", "Estado"]) {
    const cell = element("th");
    cell.scope = "col";
    cell.textContent = label;
    headRow.append(cell);
  }
  head.append(headRow);
  const body = element("tbody");
  for (const item of items) {
    const row = element("tr");
    const position = element("th");
    position.scope = "row";
    position.textContent = `${item.position}°`;
    const team = element("td");
    team.textContent = item.teamName;
    const total = element("td");
    total.textContent = `${formatNumber(item.total)} pts`;
    const state = element("td");
    state.textContent = [item.classification, item.status.label, item.tieBreakLabel].filter(Boolean).join(" · ") || "Publicado";
    row.append(position, team, total, state);
    body.append(row);
  }
  table.append(caption, head, body);
  wrapper.append(table);
  return wrapper;
}

function renderSheet(model) {
  if (model.publicData.sheetState !== "ready") return renderDataState(model.publicData.sheetState);
  const container = element("div", "portal-v2-sheet");
  for (const competition of model.publicData.sheet) {
    if (!competition.rows.length) continue;
    const section = element("section", "portal-v2-sheet__competition");
    const title = element("h3", "portal-v2-group-title");
    title.textContent = competition.name;
    section.append(title, renderSheetTable(competition));
    container.append(section);
  }
  return container;
}

function renderSheetTable(competition) {
  const wrapper = element("div", "portal-v2-table-scroll");
  const table = element("table", "portal-v2-table portal-v2-sheet-table");
  const caption = element("caption", "portal-v2-table__caption");
  caption.textContent = `${competition.name}: puntuaciones publicadas por equipo`;
  const head = element("thead");
  const headRow = element("tr");
  for (const label of ["Equipo", ...competition.columns.map((column) => column.label), "Total"]) {
    const cell = element("th");
    cell.scope = "col";
    cell.textContent = label;
    headRow.append(cell);
  }
  head.append(headRow);
  const body = element("tbody");
  for (const item of competition.rows) {
    const row = element("tr");
    const team = element("th");
    team.scope = "row";
    team.textContent = item.teamName;
    row.append(team);
    const values = new Map(item.columns.map((column) => [column.key, column.value]));
    for (const column of competition.columns) {
      const cell = element("td");
      cell.textContent = values.has(column.key) ? formatNumber(values.get(column.key)) : "—";
      row.append(cell);
    }
    const total = element("td");
    total.textContent = formatNumber(item.total);
    row.append(total);
    body.append(row);
  }
  table.append(caption, head, body);
  wrapper.append(table);
  return wrapper;
}

function renderDataState(state) {
  const section = element("section", "portal-v2-data-state");
  section.setAttribute("role", state === "inconsistent-snapshot" ? "alert" : "status");
  const title = element("h3");
  const detail = element("p");
  const messages = {
    "no-results-yet": ["Resultados aún no disponibles", "Los resultados publicados aparecerán cuando exista información pública del torneo."],
    "no-standings-yet": ["Posiciones aún no disponibles", "Las posiciones oficiales aparecerán cuando la publicación las incluya."],
    "no-sheet-yet": ["Sábana aún no disponible", "La sábana pública aparecerá cuando exista una publicación válida."],
    "inconsistent-snapshot": ["Datos temporalmente no disponibles", "La publicación recibida no permite mostrar una paridad segura entre resultados, posiciones y sábana."]
  };
  [title.textContent, detail.textContent] = messages[state] || messages["inconsistent-snapshot"];
  section.append(title, detail);
  return section;
}

function appendDefinition(list, label, value) {
  const term = element("dt");
  term.textContent = label;
  const definition = element("dd");
  definition.textContent = value;
  list.append(term, definition);
}

function renderLiveContext(model) {
  const panel = element("section", "portal-v2-live-context");
  const label = element("p", "portal-v2-eyebrow");
  label.textContent = "Contexto oficial";
  const title = element("h3");
  title.textContent = model.live.currentSuerte || model.lifecycle.detail;
  const detail = element("p");
  detail.textContent = [model.live.currentCharreada, model.live.currentTeam, model.live.currentParticipant].filter(Boolean).join(" · ") || "Sin turno público activo.";
  panel.append(label, title, detail);
  if (model.live.currentScore !== "") {
    const score = element("strong", "portal-v2-live-context__score");
    score.textContent = formatNumber(model.live.currentScore);
    score.setAttribute("aria-label", `Puntuación actual ${formatNumber(model.live.currentScore)}`);
    panel.append(score);
  }
  return panel;
}

function renderResolvedHighlight(model) {
  const panel = element("section", "portal-v2-resolved-highlight");
  const source = model.leader || model.primaryResult;
  const label = element("p", "portal-v2-eyebrow");
  label.textContent = model.leader ? "Posición oficial" : "Resultado publicado";
  const title = element("h3");
  title.textContent = source?.teamName || "Sin resultado publicado";
  const total = element("strong", "portal-v2-resolved-highlight__total");
  total.textContent = source?.total !== "" && source?.total !== undefined ? `${formatNumber(source.total)} pts` : "—";
  panel.append(label, title, total);
  if (model.primaryResult?.pr !== "") {
    const pr = element("span", "portal-v2-resolved-highlight__detail");
    pr.textContent = `PR ${formatNumber(model.primaryResult.pr)}`;
    panel.append(pr);
  }
  return panel;
}

function renderSponsors(model) {
  if (!model.sponsors.length) return element("div", "portal-v2-sponsors portal-v2-sponsors--empty");
  const section = element("section", "portal-v2-sponsors");
  const title = element("p", "portal-v2-eyebrow");
  title.textContent = "Patrocinadores";
  section.append(title);
  const list = element("div", "portal-v2-sponsors__list");
  for (const sponsor of model.sponsors) {
    const item = sponsor.url ? element("a", "portal-v2-sponsor") : element("span", "portal-v2-sponsor");
    if (sponsor.url) {
      item.href = sponsor.url;
      item.target = "_blank";
      item.rel = "noopener noreferrer";
    }
    if (sponsor.logoUrl) {
      const image = element("img");
      image.src = sponsor.logoUrl;
      image.alt = sponsor.name;
      item.append(image);
    } else item.textContent = sponsor.name;
    list.append(item);
  }
  section.append(list);
  return section;
}

function renderFooter(model) {
  const footer = element("footer", "portal-v2-footer");
  footer.textContent = model.availability === "ready"
    ? `Datos públicos oficiales · revisión ${model.projectionRevision}`
    : "Portal Público CharroPro";
  return footer;
}

function applyBranding(root, branding) {
  for (const [key, value] of Object.entries(branding || {})) {
    if (key.endsWith("Color")) root.style.setProperty(`--portal-v2-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`, value);
  }
}

function navigationLabel(model) {
  return model.navigation.find((item) => item.view === model.view)?.label || "Portal Público";
}

function availabilityTitle(availability) {
  return {
    "missing-tournament": "Falta el torneo público",
    "not-found": "Torneo no disponible",
    unsupported: "La publicación requiere actualización",
    error: "No fue posible actualizar el portal",
    loading: "Cargando portal público"
  }[availability] || "Portal Público";
}

function availabilityCopy(availability) {
  return {
    "missing-tournament": "Abre el portal con un identificador de torneo válido.",
    "not-found": "Este torneo no tiene una publicación pública disponible.",
    unsupported: "La fuente pública no cumple el contrato vigente de este portal.",
    error: "Conserva esta pantalla abierta e inténtalo de nuevo en unos momentos.",
    loading: "Consultando la publicación oficial del torneo."
  }[availability] || "Estado de conexión pendiente.";
}

function viewCopy(view, lifecycle) {
  if (lifecycle === "PRE_EVENT") return "La programación y la publicación oficial aparecerán aquí al iniciar el evento.";
  if (lifecycle === "ARCHIVED") return "Consulta la información pública preservada de este evento.";
  return {
    programa: "Programa oficial publicado para este torneo.",
    resultados: "Resultados resueltos y publicados por la autoridad oficial.",
    posiciones: "Posiciones oficiales disponibles para consulta pública.",
    sabana: "Sábana pública disponible para consulta.",
    estadisticas: "Estadísticas públicas disponibles para consulta."
  }[view] || "Contexto oficial del evento.";
}

function announcement(model, options) {
  if (model.availability !== "ready") return availabilityTitle(model.availability);
  if (options.changed) return `${model.lifecycle.label}. Revisión pública ${model.projectionRevision}.`;
  return "";
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(value);
}

function element(tagName, className = "") {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  return node;
}

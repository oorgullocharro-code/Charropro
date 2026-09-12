export function createPortalV2Shell(root) {
  const shell = element("div", "portal-v2-shell");
  const liveRegion = element("p", "portal-v2-announcer");
  liveRegion.setAttribute("aria-live", "polite");
  liveRegion.setAttribute("aria-atomic", "true");
  root.replaceChildren(shell, liveRegion);
  return { root, shell, liveRegion };
}

export function renderPortalV2(shell, model, options = {}) {
  const sections = [
    renderPortalHeader(model),
    model.view === "inicio" ? renderHero(model) : renderSectionContext(model),
    model.view === "inicio" ? renderSponsors(model) : null,
    model.view === "inicio" ? null : renderConnection(model),
    renderContent(model),
    renderFooter(model)
  ].filter(Boolean);
  shell.shell.replaceChildren(...sections);
  applyBranding(shell.root, model.branding);
  shell.liveRegion.textContent = announcement(model, options);
}

function renderPortalHeader(model) {
  const header = element("header", "portal-v2-header");
  const content = element("div", "portal-v2-header__content");
  const brand = element("div", "portal-v2-header__brand");
  const name = element("strong");
  name.textContent = "CharroPro";
  const byline = element("span");
  byline.textContent = "Orgullo Charro";
  brand.append(name, byline);

  const nav = element("nav", "portal-v2-nav");
  nav.setAttribute("aria-label", "Secciones del portal");
  for (const item of model.navigation) {
    nav.append(navigationButton(item, model, "portal-v2-nav__item"));
  }

  const actions = element("div", "portal-v2-header__actions");
  const state = element("span", `portal-v2-header__state portal-v2-header__state--${model.lifecycle.status.toLowerCase()}`);
  state.textContent = model.lifecycle.label;
  actions.append(state, renderMobileNavigation(model));
  content.append(brand, nav, actions);
  header.append(content);
  return header;
}

function renderHero(model) {
  const hero = element("header", "portal-v2-hero");
  if (model.branding.heroImageUrl || model.branding.coverImageUrl) {
    const image = element("img", "portal-v2-hero__image");
    image.src = model.branding.heroImageUrl || model.branding.coverImageUrl;
    image.alt = "";
    image.loading = "eager";
    hero.append(image);
  }
  const editorial = element("div", "portal-v2-hero__editorial");
  if (model.branding.logoUrl) {
    const logo = element("img", "portal-v2-hero__logo");
    logo.src = model.branding.logoUrl;
    logo.alt = model.tournament.shortName || model.tournament.name;
    editorial.append(logo);
  }
  const title = element("h1", "portal-v2-title");
  title.textContent = model.tournament.name;
  editorial.append(title);
  const facts = renderHeroFacts(model.tournament);
  if (facts) editorial.append(facts);
  if (model.lifecycle.status === "LIVE") {
    const status = element("span", "portal-v2-hero__status portal-v2-hero__status--live");
    status.textContent = model.lifecycle.label;
    editorial.append(status);
  }
  const action = heroAction(model);
  if (action) editorial.append(action);
  hero.append(editorial);
  return hero;
}

function renderHeroFacts(tournament) {
  const facts = [];
  const date = formatHeroDateRange(tournament.startDate, tournament.endDate);
  const venue = [tournament.venue, tournament.city, tournament.state].filter(Boolean).join(", ");
  if (date) facts.push(["Fecha", date]);
  if (venue) facts.push(["Sede", venue]);
  if (!facts.length) return null;
  const list = element("dl", "portal-v2-hero__facts");
  for (const [label, value] of facts) {
    const row = element("div", "portal-v2-hero__fact");
    const term = element("dt");
    term.textContent = label;
    const detail = element("dd");
    detail.textContent = value;
    row.append(term, detail);
    list.append(row);
  }
  return list;
}

function renderSectionContext(model) {
  const context = element("header", "portal-v2-section-context");
  const content = element("div", "portal-v2-section-context__content");
  const label = element("p", "portal-v2-eyebrow");
  label.textContent = model.lifecycle.status === "LIVE" ? "Seguimiento oficial" : model.lifecycle.label;
  const title = element("h1");
  title.textContent = navigationLabel(model);
  const detail = element("p");
  detail.textContent = viewCopy(model.view, model.lifecycle.status);
  content.append(label, title, detail);
  context.append(content);
  return context;
}

function renderMobileNavigation(model) {
  const menu = element("details", "portal-v2-mobile-nav");
  const summary = element("summary", "portal-v2-mobile-nav__toggle");
  summary.textContent = "☰";
  summary.setAttribute("aria-label", "Abrir navegación del portal");
  const list = element("div", "portal-v2-mobile-nav__menu");
  list.setAttribute("aria-label", "Navegación del portal");
  for (const item of model.navigation) list.append(navigationButton(item, model, "portal-v2-mobile-nav__item"));
  menu.append(summary, list);
  return menu;
}

function navigationButton(item, model, className) {
  const button = element("button", className);
  button.type = "button";
  button.dataset.portalV2View = item.view;
  button.textContent = item.label;
  if (item.view === model.view) button.setAttribute("aria-current", "page");
  return button;
}

function heroAction(model) {
  const targetView = {
    PRE_EVENT: "programa",
    LIVE: "en-vivo",
    PAUSED: "en-vivo",
    FINALIZED: "resultados",
    ARCHIVED: "resultados"
  }[model.lifecycle.status];
  const item = model.navigation.find((candidate) => candidate.view === targetView);
  if (!item) return null;
  const button = navigationButton(item, model, "portal-v2-hero__action");
  button.textContent = model.lifecycle.status === "LIVE" ? "Ver en vivo" : item.label;
  return button;
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
  main.append(renderContextFilters(model), renderView(model));
  return main;
}

function renderView(model) {
  const section = element("section", "portal-v2-view");
  if (model.publicData.status !== "ready" && ["resultados", "posiciones", "sabana"].includes(model.view)) {
    section.append(renderDataState("inconsistent-snapshot"));
    return section;
  }
  if (model.view === "en-vivo") {
    section.append(renderLiveExperience(model));
    return section;
  }
  if (model.view === "inicio") {
    section.append(renderHome(model));
    return section;
  }
  if (model.view === "programa") {
    section.append(renderProgram(model));
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
  section.append(renderResolvedHighlight(model));
  return section;
}

function renderHome(model) {
  const home = element("div", "portal-v2-home");
  const dashboard = element("div", "portal-v2-home__dashboard");
  dashboard.append(renderHomeLivePanel(model), renderHomeStandings(model));
  home.append(dashboard);

  const previews = element("div", "portal-v2-home__previews");
  if (model.context.program.length) {
    const preview = element("section", "portal-v2-home__program");
    const title = element("h3", "portal-v2-group-title");
    title.textContent = "Programa publicado";
    preview.append(title, renderProgramList(model.context.program.slice(0, 3)), homeLink(model, "programa", "Ver programa"));
    previews.append(preview);
  } else {
    previews.append(renderHomeEmpty("Programa", "El programa oficial aparecerá cuando sea publicado."));
  }
  previews.append(renderHomeResults(model));
  home.append(previews);
  return home;
}

function renderHomeLivePanel(model) {
  const panel = element("section", "portal-v2-home__live");
  const content = element("div", "portal-v2-home__live-content");
  content.append(renderLiveCenter(model));
  const link = homeLink(model, "en-vivo", "Abrir seguimiento en vivo");
  if (link) content.append(link);
  panel.append(content);
  if (model.branding.liveCoverImageUrl) {
    const image = element("img", "portal-v2-home__live-cover");
    image.src = model.branding.liveCoverImageUrl;
    image.alt = `Portada En Vivo de ${model.tournament.shortName || model.tournament.name}`;
    image.loading = "lazy";
    panel.append(image);
  }
  return panel;
}

function renderHomeStandings(model) {
  const panel = element("section", "portal-v2-home__standings");
  const title = element("h3", "portal-v2-group-title");
  title.textContent = "Posiciones";
  panel.append(title);
  if (!model.context.standings.length) {
    const detail = element("p", "portal-v2-group-detail");
    detail.textContent = "Las posiciones oficiales aparecerán cuando estén disponibles.";
    panel.append(detail);
  } else {
    const list = element("ol", "portal-v2-home-ranking");
    for (const standing of model.context.standings.slice(0, 5)) {
      const row = element("li");
      const position = element("span", "portal-v2-home-ranking__position");
      position.textContent = `${formatNumber(standing.position)}°`;
      const name = element("span", "portal-v2-home-ranking__name");
      name.textContent = standing.displayName;
      const total = element("strong");
      total.textContent = `${formatNumber(standing.total)} pts`;
      row.append(position, name, total);
      list.append(row);
    }
    panel.append(list);
  }
  const link = homeLink(model, "posiciones", "Ver posiciones");
  if (link) panel.append(link);
  return panel;
}

function renderHomeResults(model) {
  const panel = element("section", "portal-v2-home__results");
  const title = element("h3", "portal-v2-group-title");
  title.textContent = "Resultados recientes";
  panel.append(title);
  if (!model.context.results.length) {
    const detail = element("p", "portal-v2-group-detail");
    detail.textContent = "Los resultados oficiales aparecerán cuando sean publicados.";
    panel.append(detail);
  } else {
    const list = element("ul", "portal-v2-home-results");
    for (const result of model.context.results.slice(0, 3)) {
      const row = element("li");
      const name = element("span");
      name.textContent = result.participantScope === "individual" && result.horseName
        ? `${result.displayName} · Caballo: ${result.horseName}`
        : result.displayName;
      const total = element("strong");
      total.textContent = `${formatNumber(result.total)} pts`;
      row.append(name, total);
      list.append(row);
    }
    panel.append(list);
  }
  const link = homeLink(model, "resultados", "Ver resultados");
  if (link) panel.append(link);
  return panel;
}

function renderHomeEmpty(titleText, detailText) {
  const panel = element("section", "portal-v2-home__program");
  const title = element("h3", "portal-v2-group-title");
  title.textContent = titleText;
  const detail = element("p", "portal-v2-group-detail");
  detail.textContent = detailText;
  panel.append(title, detail);
  return panel;
}

function homeLink(model, view, label) {
  const item = model.navigation.find((candidate) => candidate.view === view);
  return item ? navigationButton(item, model, "portal-v2-home__action") : null;
}

function renderContextFilters(model) {
  if (model.context.hasInvalidSelection) {
    const state = element("section", "portal-v2-context-state");
    state.setAttribute("role", "status");
    state.textContent = "El filtro solicitado no está disponible en esta publicación oficial.";
    return state;
  }
  if (model.context.competitions.length < 2 && model.context.phases.length < 2) return element("div", "portal-v2-context-filters portal-v2-context-filters--empty");
  const section = element("section", "portal-v2-context-filters");
  section.setAttribute("aria-label", "Filtros de contexto publicado");
  if (model.context.competitions.length > 1) section.append(renderContextFilter("Competencia", model.context.competitions, model.context.selectedCompetitionId, "portalV2Competition"));
  if (model.context.phases.length > 1) section.append(renderContextFilter("Fase", model.context.phases, model.context.selectedPhaseId, "portalV2Phase"));
  return section;
}

function renderContextFilter(label, items, selectedId, datasetKey) {
  const group = element("div", "portal-v2-context-filter");
  const heading = element("p");
  heading.textContent = label;
  const choices = element("div", "portal-v2-context-filter__choices");
  const all = element("button", "portal-v2-context-filter__choice");
  all.type = "button";
  all.dataset[datasetKey] = "";
  all.textContent = "Todas";
  if (!selectedId) all.setAttribute("aria-pressed", "true");
  choices.append(all);
  for (const item of items) {
    const button = element("button", "portal-v2-context-filter__choice");
    button.type = "button";
    button.dataset[datasetKey] = item.id;
    button.textContent = item.name;
    if (item.id === selectedId) button.setAttribute("aria-pressed", "true");
    choices.append(button);
  }
  group.append(heading, choices);
  return group;
}

function renderProgram(model) {
  if (!model.context.program.length) return renderProgramState(model.context.programState);
  const container = element("div", "portal-v2-program");
  for (const [date, items] of groupProgramByDate(model.context.program)) {
    const section = element("section", "portal-v2-program__day");
    const heading = element("h3", "portal-v2-group-title");
    heading.textContent = formatProgramDate(date);
    section.append(heading, renderProgramList(items));
    container.append(section);
  }
  return container;
}

function renderProgramList(items) {
  const list = element("ol", "portal-v2-program__list");
  for (const item of items) {
    const row = element("li", "portal-v2-program__item");
    const time = element("time", "portal-v2-program__time");
    time.textContent = item.scheduledTime || "Por confirmar";
    const detail = element("div", "portal-v2-program__detail");
    const title = element("h4");
    title.textContent = item.name;
    const context = [item.phaseName, item.competitionName, item.status].filter(Boolean).join(" · ");
    if (context) {
      const contextText = element("p");
      contextText.textContent = context;
      detail.append(contextText);
    }
    detail.prepend(title);
    const participants = item.participantScope === "individual" ? item.participantNames : item.teamNames;
    if (participants.length) {
      const roster = element("p", "portal-v2-program__participants");
      roster.textContent = item.participantScope === "individual"
        ? participants.map((name, index) => identityLine("Participante", name, item.horseNames[index])).join(" · ")
        : participants.join(" · ");
      detail.append(roster);
    }
    row.append(time, detail);
    list.append(row);
  }
  return list;
}

function renderProgramState(state) {
  const section = element("section", "portal-v2-data-state");
  section.setAttribute("role", "status");
  const title = element("h3");
  title.textContent = "Programa aún no disponible";
  const detail = element("p");
  detail.textContent = state === "no-program-yet"
    ? "La programación pública aparecerá cuando CharroPro la publique."
    : "No hay actividades publicadas para este contexto.";
  section.append(title, detail);
  return section;
}

function renderLiveExperience(model) {
  const experience = element("div", "portal-v2-live-experience");
  const main = element("div", "portal-v2-live-experience__main");
  main.append(renderLiveCenter(model), renderTimeline(model));
  const aside = element("aside", "portal-v2-live-experience__aside");
  aside.setAttribute("aria-label", "Resumen publicado en vivo");
  aside.append(renderLiveResults(model), renderLiveStandings(model));
  experience.append(main, aside);
  return experience;
}

function renderLiveCenter(model) {
  const live = model.liveTimeline.live;
  const panel = element("section", "portal-v2-live-center");
  const label = element("p", "portal-v2-eyebrow");
  label.textContent = live.isLive ? "En vivo" : model.lifecycle.label;
  const status = element("span", `portal-v2-live-indicator${live.isLive ? " portal-v2-live-indicator--active" : ""}`);
  status.textContent = live.isLive ? "En vivo" : model.lifecycle.label;
  const header = element("header", "portal-v2-live-center__header");
  header.append(label, status);
  const title = element("h3");
  title.textContent = (live.currentSuerte || live.hasCurrentAction) ? live.currentSuerte || "Acción en curso" : "Sin acción pública activa";
  panel.append(header, title);
  if (live.hasCurrentAction) {
    const context = element("dl", "portal-v2-live-center__context");
    appendDefinitionIfPresent(context, "Charreada", live.currentCharreada);
    if (live.participantScope === "individual") {
      appendDefinitionIfPresent(context, "Participante", live.currentParticipant);
      appendDefinitionIfPresent(context, "Caballo", live.currentHorseName);
    } else {
      appendDefinitionIfPresent(context, "Equipo", live.currentTeam);
      appendDefinitionIfPresent(context, "Participante", live.currentParticipant);
    }
    panel.append(context);
  }
  if (live.currentScore !== null) {
    const score = element("strong", "portal-v2-live-center__score");
    score.textContent = `${formatNumber(live.currentScore)} pts`;
    score.setAttribute("aria-label", `Puntuación actual ${formatNumber(live.currentScore)} puntos`);
    panel.append(score);
  }
  if (live.updatedAt) {
    const updated = element("time", "portal-v2-live-center__updated");
    updated.dateTime = live.updatedAt;
    updated.textContent = `Actualizado ${formatPublicTime(live.updatedAt)}`;
    panel.append(updated);
  }
  return panel;
}

function renderLiveResults(model) {
  const section = element("section", "portal-v2-live-summary");
  const title = element("h3", "portal-v2-group-title");
  title.textContent = "Resultados publicados";
  section.append(title);
  if (!model.liveTimeline.currentResults.length) {
    const detail = element("p", "portal-v2-group-detail");
    detail.textContent = "Los resultados de esta charreada aún no están disponibles.";
    section.append(detail);
    return section;
  }
  const list = element("ul", "portal-v2-live-summary__list");
  for (const result of model.liveTimeline.currentResults) {
    const item = element("li");
    const team = element("span");
    team.textContent = result.displayName;
    const total = element("strong");
    total.textContent = `${formatNumber(result.total)} pts`;
    item.append(team);
    appendIdentityMeta(item, result);
    item.append(total);
    list.append(item);
  }
  section.append(list);
  return section;
}

function renderLiveStandings(model) {
  const section = element("section", "portal-v2-live-summary");
  const title = element("h3", "portal-v2-group-title");
  title.textContent = "Posiciones publicadas";
  section.append(title);
  if (!model.liveTimeline.currentStandings.length) {
    const detail = element("p", "portal-v2-group-detail");
    detail.textContent = "Las posiciones de esta charreada aún no están disponibles.";
    section.append(detail);
    return section;
  }
  const list = element("ol", "portal-v2-live-summary__list");
  for (const standing of model.liveTimeline.currentStandings) {
    const item = element("li");
    const team = element("span");
    team.textContent = `${standing.position}° ${standing.displayName}`;
    const total = element("strong");
    total.textContent = `${formatNumber(standing.total)} pts`;
    item.append(team);
    appendIdentityMeta(item, standing);
    item.append(total);
    list.append(item);
  }
  section.append(list);
  return section;
}

function renderTimeline(model) {
  const section = element("section", "portal-v2-timeline");
  const header = element("header", "portal-v2-timeline__header");
  const title = element("h3");
  title.textContent = "Minuto a minuto";
  header.append(title);
  if (model.liveTimeline.timelineState === "timeline-stale") {
    const stale = element("span", "portal-v2-timeline__state");
    stale.textContent = "Actualizando información";
    header.append(stale);
  }
  section.append(header);
  if (!model.liveTimeline.timeline.length) {
    const empty = element("p", "portal-v2-group-detail");
    empty.textContent = "Aún no hay eventos públicos para esta charreada.";
    section.append(empty);
    return section;
  }
  const list = element("ol", "portal-v2-timeline__list");
  list.setAttribute("aria-label", "Eventos públicos, más recientes primero");
  for (const event of model.liveTimeline.timeline) list.append(renderTimelineEvent(event));
  section.append(list);
  return section;
}

function renderTimelineEvent(event) {
  const item = element("li", "portal-v2-timeline__event");
  const type = element("span", `portal-v2-timeline__type portal-v2-timeline__type--${event.tone}`);
  type.textContent = event.typeLabel;
  const label = element("p", "portal-v2-timeline__label");
  label.textContent = event.label;
  item.append(type, label);
  if (event.correction) {
    const correction = element("strong", "portal-v2-timeline__correction");
    correction.textContent = `${formatNumber(event.correction.previousScore)} → ${formatNumber(event.correction.score)} pts`;
    item.append(correction);
  } else if (event.score !== null) {
    const score = element("strong", "portal-v2-timeline__score");
    score.textContent = `${formatNumber(event.score)} pts`;
    item.append(score);
  }
  if (event.status) {
    const status = element("span", "portal-v2-timeline__status");
    status.textContent = event.status;
    item.append(status);
  }
  if (event.occurredAt) {
    const timestamp = element("time", "portal-v2-timeline__time");
    timestamp.dateTime = event.occurredAt;
    timestamp.textContent = formatPublicTime(event.occurredAt);
    item.append(timestamp);
  }
  return item;
}

function renderResults(model) {
  if (model.context.resultState !== "ready") return renderDataState(model.context.resultState);
  const container = element("div", "portal-v2-results");
  for (const group of model.context.resultGroups) {
    const section = element("section", "portal-v2-result-group");
    const title = element("h3", "portal-v2-group-title");
    title.textContent = group.title;
    section.append(title);
    if (group.detail && group.detail !== group.title) {
      const phase = element("p", "portal-v2-group-detail");
      phase.textContent = group.detail;
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
  team.textContent = result.displayName;
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
  appendIdentityDefinitions(summary, result);
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
  if (model.context.standingsState !== "ready") return renderDataState(model.context.standingsState);
  const container = element("div", "portal-v2-standings");
  if (model.context.champion) {
    const champion = element("section", "portal-v2-champion");
    const label = element("p", "portal-v2-eyebrow");
    label.textContent = "Campeón publicado";
    const name = element("h3");
    name.textContent = model.context.champion.displayName;
    const total = element("strong");
    total.textContent = `${formatNumber(model.context.champion.total)} pts`;
    champion.append(label, name, total);
    container.append(champion);
  }
  for (const group of model.context.standingGroups) {
    const section = element("section", "portal-v2-standing-group");
    const title = element("h3", "portal-v2-group-title");
    title.textContent = group.title;
    section.append(title);
    if (group.detail && group.detail !== group.title) {
      const detail = element("p", "portal-v2-group-detail");
      detail.textContent = group.detail;
      section.append(detail);
    }
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
    team.textContent = item.displayName;
    const total = element("span");
    total.textContent = `${formatNumber(item.total)} pts`;
    entry.append(position, team);
    appendIdentityMeta(entry, item);
    entry.append(total);
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
  const allIndividual = items.length > 0 && items.every((item) => item.participantScope === "individual");
  const showHorse = items.some((item) => item.participantScope === "individual");
  for (const label of ["Pos.", allIndividual ? "Participante" : "Equipo", ...(showHorse ? ["Caballo"] : []), "Total", "Estado"]) {
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
    team.textContent = item.displayName;
    row.append(position, team);
    if (showHorse) {
      const horse = element("td");
      horse.textContent = item.participantScope === "individual" ? item.horseName || "—" : "—";
      row.append(horse);
    }
    const total = element("td");
    total.textContent = `${formatNumber(item.total)} pts`;
    const state = element("td");
    state.textContent = [item.classification, item.status.label, item.tieBreakLabel].filter(Boolean).join(" · ") || "Publicado";
    row.append(total, state);
    body.append(row);
  }
  table.append(caption, head, body);
  wrapper.append(table);
  return wrapper;
}

function renderSheet(model) {
  if (model.context.sheetState !== "ready") return renderDataState(model.context.sheetState);
  const container = element("div", "portal-v2-sheet");
  for (const competition of model.context.sheet) {
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
  if (competition.isColeaderoOpportunitySheet) return renderColeaderoOpportunitySheetTable(competition);
  const wrapper = element("div", "portal-v2-table-scroll");
  const table = element("table", "portal-v2-table portal-v2-sheet-table");
  const caption = element("caption", "portal-v2-table__caption");
  const allIndividual = competition.rows.length > 0 && competition.rows.every((item) => item.participantScope === "individual");
  const showHorse = competition.rows.some((item) => item.participantScope === "individual");
  caption.textContent = `${competition.name}: puntuaciones publicadas por ${allIndividual ? "participante" : "equipo"}`;
  const head = element("thead");
  const headRow = element("tr");
  for (const label of [allIndividual ? "Participante" : "Equipo", ...(showHorse ? ["Caballo"] : []), ...competition.columns.map((column) => column.label), "Total"]) {
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
    team.textContent = item.displayName;
    row.append(team);
    if (showHorse) {
      const horse = element("td");
      horse.textContent = item.participantScope === "individual" ? item.horseName || "—" : "—";
      row.append(horse);
    }
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

function renderColeaderoOpportunitySheetTable(competition) {
  const wrapper = element("div", "portal-v2-table-scroll");
  const table = element("table", "portal-v2-table portal-v2-sheet-table portal-v2-sheet-table--coleadero");
  const caption = element("caption", "portal-v2-table__caption");
  caption.textContent = `${competition.name}: oportunidades oficiales por participante`;
  const head = element("thead");
  const headRow = element("tr");
  for (const label of ["Participante", "Caballo", ...Array.from({ length: competition.opportunitiesPerParticipant }, (_, index) => `${index + 1}ª`), "Total"]) {
    const cell = element("th");
    cell.scope = "col";
    cell.textContent = label;
    headRow.append(cell);
  }
  head.append(headRow);
  const body = element("tbody");
  for (const item of competition.rows) {
    const row = element("tr");
    const participant = element("th");
    participant.scope = "row";
    participant.textContent = item.displayName;
    const horse = element("td");
    horse.textContent = item.horseName || "—";
    row.append(participant, horse);
    const opportunities = new Map(item.opportunities.map((opportunity) => [opportunity.opportunityNumber, opportunity]));
    for (let opportunityNumber = 1; opportunityNumber <= competition.opportunitiesPerParticipant; opportunityNumber += 1) {
      const cell = element("td");
      const opportunity = opportunities.get(opportunityNumber);
      cell.textContent = opportunity ? formatNumber(opportunity.officialPoints) : "—";
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

function appendDefinitionIfPresent(list, label, value) {
  if (!value) return;
  appendDefinition(list, label, value);
}

function appendIdentityDefinitions(list, item) {
  if (item.participantScope !== "individual") return;
  appendDefinitionIfPresent(list, "Participante", item.participantName);
  appendDefinitionIfPresent(list, "Caballo", item.horseName);
}

function appendIdentityMeta(parent, item) {
  if (item.participantScope !== "individual" || !item.horseName) return;
  const meta = element("span", "portal-v2-identity-meta");
  meta.textContent = `Caballo: ${item.horseName}`;
  parent.append(meta);
}

function identityLine(label, name, horseName) {
  return [label, name, horseName ? `Caballo: ${horseName}` : ""].filter(Boolean).join(" · ");
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
  title.textContent = source?.displayName || "Sin resultado publicado";
  const total = element("strong", "portal-v2-resolved-highlight__total");
  total.textContent = source?.total !== "" && source?.total !== undefined ? `${formatNumber(source.total)} pts` : "—";
  panel.append(label, title, total);
  if (source?.participantScope === "individual" && source.horseName) {
    const horse = element("span", "portal-v2-identity-meta");
    horse.textContent = `Caballo: ${source.horseName}`;
    panel.append(horse);
  }
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
  section.setAttribute("aria-label", "Patrocinadores");
  const viewport = element("div", "portal-v2-sponsors__viewport");
  const list = element("div", "portal-v2-sponsors__list");
  list.style.setProperty("--portal-v2-sponsor-loop-duration", `${Math.max(30, model.sponsors.length * 12)}s`);
  appendSponsorTrack(list, model.sponsors);
  appendSponsorTrack(list, model.sponsors, { decorative: true });
  viewport.append(list);
  section.append(viewport);
  return section;
}

function appendSponsorTrack(list, sponsors, options = {}) {
  const track = element("div", "portal-v2-sponsors__track");
  if (options.decorative) track.setAttribute("aria-hidden", "true");
  for (const sponsor of sponsors) {
    const item = !options.decorative && sponsor.url ? element("a", "portal-v2-sponsor") : element("span", "portal-v2-sponsor");
    if (!options.decorative && sponsor.url) {
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
    track.append(item);
  }
  list.append(track);
}

function renderFooter(model) {
  const footer = element("footer", "portal-v2-footer");
  const brand = element("strong");
  brand.textContent = "CharroPro · Orgullo Charro";
  const detail = element("span");
  detail.textContent = model.availability === "ready"
    ? `Datos públicos oficiales · revisión ${model.projectionRevision}`
    : "Portal Público CharroPro";
  footer.append(brand, detail);
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

function formatPublicTime(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function groupProgramByDate(items) {
  const groups = new Map();
  for (const item of items) {
    const key = item.scheduledDate || "Sin fecha publicada";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right));
}

function formatProgramDate(value) {
  if (!value || value === "Sin fecha publicada") return "Sin fecha publicada";
  const date = new Date(`${value}T12:00:00`);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long" }).format(date);
}

function formatHeroDateRange(startDate, endDate) {
  const start = formatHeroDate(startDate);
  const end = formatHeroDate(endDate);
  if (!start) return end;
  return end && end !== start ? `${start} - ${end}` : start;
}

function formatHeroDate(value) {
  if (!value) return "";
  const source = String(value);
  const date = new Date(source.includes("T") ? source : `${source}T12:00:00`);
  if (!Number.isFinite(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function element(tagName, className = "") {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  return node;
}

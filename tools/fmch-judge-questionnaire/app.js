(function () {
  'use strict';

  const data = window.FMCHJudgeQuestionnaireData;
  const STORAGE_KEY = 'charropro.fmch.judge-questionnaire.interviews.v1';
  const MAX_IMPORT_BYTES = 1024 * 1024;
  const MAX_TEXT_LENGTH = 12000;
  let interviewSequence = 0;
  const SAFE_RESPONSE_STATUSES = new Set([
    'PENDING_REVIEW',
    'NEEDS_CONFIRMATION',
    'CONFLICTING',
    'APPROVED_DECISION',
    'REJECTED'
  ]);

  if (!data || !Array.isArray(data.sections)) {
    return;
  }

  const questions = data.sections.flatMap((section) => section.questions.map((question) => ({ ...question, sectionId: section.id })));
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const sectionById = new Map(data.sections.map((section) => [section.id, section]));
  const hasDocument = typeof document !== 'undefined';
  const root = hasDocument ? document.getElementById('app') : null;
  const importInput = hasDocument ? document.getElementById('import-file') : null;

  const state = {
    screen: 'welcome',
    activeInterviewId: null,
    activeSectionIndex: 0,
    showFullSheet: false,
    zoom: 1,
    technicalMode: false,
    draftProfile: defaultProfile(),
    consent: false,
    recordingConsent: false,
    toastTimer: null
  };

  function localDate() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }

  function defaultProfile() {
    return {
      respondentName: '',
      role: '',
      judgeCategory: '',
      organization: '',
      experienceYears: '',
      phone: '',
      email: '',
      interviewDate: localDate(),
      interviewerName: '',
      location: '',
      openingNotes: ''
    };
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function safeText(value, maxLength = MAX_TEXT_LENGTH) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, maxLength);
  }

  function newId(prefix) {
    const bytes = new Uint8Array(8);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
    }
    interviewSequence += 1;
    return `${prefix}_${Date.now().toString(36)}_${interviewSequence.toString(36)}_${Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')}`;
  }

  function cloneValue(value, depth = 0) {
    if (depth > 12) return null;
    if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
    if (Array.isArray(value)) return value.slice(0, 300).map((item) => cloneValue(item, depth + 1));
    if (typeof value !== 'object' || Object.prototype.toString.call(value) !== '[object Object]') return null;
    const copy = {};
    Object.entries(Object.getOwnPropertyDescriptors(value)).forEach(([key, descriptor]) => {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') return;
      if (!Object.prototype.hasOwnProperty.call(descriptor, 'value')) return;
      copy[key] = cloneValue(descriptor.value, depth + 1);
    });
    return copy;
  }

  function defaultAnswer() {
    return {
      selection: '',
      selections: [],
      narrative: '',
      example: '',
      evidenceSources: [],
      confidence: '',
      interviewerNotes: '',
      responseStatus: data.defaultResponseStatus,
      updatedAt: nowIso()
    };
  }

  function createInterview(profile = defaultProfile(), options = {}) {
    const createdAt = nowIso();
    return {
      schemaVersion: '1.0.0',
      questionnaireVersion: data.questionnaireVersion,
      interviewId: newId('fmch_int'),
      interviewStatus: 'DRAFT',
      createdAt,
      updatedAt: createdAt,
      demo: Boolean(options.demo),
      importedFrom: options.importedFrom || null,
      profile: normalizeProfile(profile),
      consent: {
        registerResponses: Boolean(options.registerResponses),
        recordMedia: Boolean(options.recordMedia)
      },
      answers: {}
    };
  }

  function normalizeProfile(profile) {
    const value = profile && typeof profile === 'object' ? profile : {};
    const normalized = {};
    data.interviewerProfileFields.forEach((field) => {
      normalized[field.id] = safeText(value[field.id], field.id === 'openingNotes' ? MAX_TEXT_LENGTH : 500);
    });
    normalized.openingNotes = safeText(value.openingNotes);
    return normalized;
  }

  function normalizeAnswer(value) {
    const raw = value && typeof value === 'object' ? value : {};
    return {
      selection: safeText(raw.selection, 500),
      selections: Array.isArray(raw.selections) ? [...new Set(raw.selections.map((item) => safeText(item, 500)).filter(Boolean))].slice(0, 20) : [],
      narrative: safeText(raw.narrative),
      example: safeText(raw.example),
      evidenceSources: Array.isArray(raw.evidenceSources) ? [...new Set(raw.evidenceSources.map((item) => safeText(item, 200)).filter(Boolean))].slice(0, 20) : [],
      confidence: safeText(raw.confidence, 100),
      interviewerNotes: safeText(raw.interviewerNotes),
      responseStatus: SAFE_RESPONSE_STATUSES.has(raw.responseStatus) ? raw.responseStatus : data.defaultResponseStatus,
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : nowIso()
    };
  }

  function normalizeInterview(value, options = {}) {
    if (!value || typeof value !== 'object') return null;
    if (value.schemaVersion !== '1.0.0' || value.questionnaireVersion !== data.questionnaireVersion) return null;
    if (!value.interviewId || typeof value.interviewId !== 'string') return null;
    const answers = {};
    const rawAnswers = value.answers && typeof value.answers === 'object' ? value.answers : {};
    Object.entries(rawAnswers).forEach(([questionId, answer]) => {
      if (!questionById.has(questionId)) return;
      answers[questionId] = normalizeAnswer(answer);
    });
    const record = {
      schemaVersion: '1.0.0',
      questionnaireVersion: data.questionnaireVersion,
      interviewId: safeText(value.interviewId, 120),
      interviewStatus: ['DRAFT', 'COMPLETED', 'EXPORTED', 'REVIEWED'].includes(value.interviewStatus) ? value.interviewStatus : 'DRAFT',
      createdAt: typeof value.createdAt === 'string' ? value.createdAt : nowIso(),
      updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : nowIso(),
      demo: Boolean(value.demo),
      importedFrom: safeText(value.importedFrom, 160) || null,
      profile: normalizeProfile(value.profile),
      consent: {
        registerResponses: Boolean(value.consent && value.consent.registerResponses),
        recordMedia: Boolean(value.consent && value.consent.recordMedia)
      },
      answers
    };
    if (options.newId) {
      record.importedFrom = record.interviewId;
      record.interviewId = newId('fmch_import');
      record.createdAt = nowIso();
      record.updatedAt = record.createdAt;
      record.interviewStatus = 'DRAFT';
    }
    return record;
  }

  function validateImportPayload(payload) {
    if (!payload || typeof payload !== 'object' || payload.format !== 'charropro-fmch-judge-interview') {
      return { valid: false, reason: 'El archivo no corresponde a una entrevista de esta herramienta.' };
    }
    const record = normalizeInterview(payload.interview);
    if (!record) return { valid: false, reason: 'El archivo no tiene una estructura o versión compatible.' };
    return { valid: true, record };
  }

  function createStorageAdapter(storage) {
    return {
      list() {
        try {
          const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
          if (!Array.isArray(parsed)) return [];
          return parsed.map((record) => normalizeInterview(record)).filter(Boolean).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
        } catch (_error) {
          return [];
        }
      },
      save(record) {
        const normalized = normalizeInterview(record);
        if (!normalized) throw new Error('No se pudo guardar una entrevista con estructura inválida.');
        const records = this.list().filter((item) => item.interviewId !== normalized.interviewId);
        records.push(normalized);
        storage.setItem(STORAGE_KEY, JSON.stringify(records));
        return normalized;
      },
      remove(interviewId) {
        storage.setItem(STORAGE_KEY, JSON.stringify(this.list().filter((record) => record.interviewId !== interviewId)));
      }
    };
  }

  const store = createStorageAdapter(window.localStorage);

  function activeInterview() {
    if (!state.activeInterviewId) return null;
    return store.list().find((record) => record.interviewId === state.activeInterviewId) || null;
  }

  function persist(record, message) {
    record.updatedAt = nowIso();
    const saved = store.save(record);
    state.activeInterviewId = saved.interviewId;
    if (message) showToast(message);
    return saved;
  }

  function writeAnswer(questionId, patch) {
    const record = activeInterview();
    if (!record) return;
    const current = normalizeAnswer(record.answers[questionId] || defaultAnswer());
    record.answers[questionId] = normalizeAnswer({ ...current, ...patch, updatedAt: nowIso(), responseStatus: current.responseStatus || data.defaultResponseStatus });
    persist(record);
  }

  function isAnswered(answer) {
    if (!answer) return false;
    return Boolean(answer.selection || answer.selections.length || answer.narrative.trim() || answer.example.trim() || answer.evidenceSources.length || answer.confidence || answer.interviewerNotes.trim());
  }

  function answeredCount(record, sectionId) {
    const section = sectionById.get(sectionId);
    if (!record || !section) return 0;
    return section.questions.filter((question) => isAnswered(normalizeAnswer(record.answers[question.id]))).length;
  }

  function totalAnswered(record) {
    return questions.filter((question) => isAnswered(normalizeAnswer(record.answers[question.id]))).length;
  }

  function escapeCsv(value) {
    return `"${safeText(value).replaceAll('"', '""').replaceAll('\r', ' ').replaceAll('\n', ' ')}"`;
  }

  function buildCsv(record) {
    const rows = [[
      'interviewId', 'interviewStatus', 'respondentName', 'role', 'interviewDate', 'section', 'questionId', 'question',
      'selection', 'selections', 'narrative', 'example', 'evidenceSources', 'confidence', 'interviewerNotes', 'responseStatus', 'updatedAt'
    ]];
    questions.forEach((question) => {
      const answer = normalizeAnswer(record.answers[question.id]);
      rows.push([
        record.interviewId, record.interviewStatus, record.profile.respondentName, record.profile.role, record.profile.interviewDate,
        sectionById.get(question.sectionId).title, question.id, question.prompt, answer.selection, answer.selections.join('; '),
        answer.narrative, answer.example, answer.evidenceSources.join('; '), answer.confidence, answer.interviewerNotes,
        answer.responseStatus, answer.updatedAt
      ]);
    });
    return rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
  }

  function buildExportPayload(record) {
    return {
      format: 'charropro-fmch-judge-interview',
      schemaVersion: '1.0.0',
      questionnaireVersion: data.questionnaireVersion,
      exportedAt: nowIso(),
      interview: cloneValue(record)
    };
  }

  function compareInterviews(records) {
    const conflicts = [];
    questions.forEach((question) => {
      const statements = new Map();
      records.forEach((record) => {
        const answer = normalizeAnswer(record.answers[question.id]);
        const response = answer.narrative.trim() || answer.selection.trim();
        if (!response) return;
        const normalized = response.toLocaleLowerCase('es-MX').replace(/\s+/g, ' ').trim();
        if (!statements.has(normalized)) statements.set(normalized, { response, people: [] });
        statements.get(normalized).people.push(record.profile.respondentName || 'Entrevista sin nombre');
      });
      if (statements.size > 1) {
        conflicts.push({ questionId: question.id, prompt: question.prompt, responses: [...statements.values()] });
      }
    });
    return conflicts;
  }

  function download(filename, content, type) {
    const blob = new Blob([content], { type });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }

  function showToast(message, kind = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = node('div', `toast${kind === 'error' ? ' error' : ''}`, message);
    toast.setAttribute('role', 'status');
    document.body.append(toast);
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => toast.remove(), 3600);
  }

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function button(text, className, handler) {
    const element = node('button', className || 'button', text);
    element.type = 'button';
    element.addEventListener('click', handler);
    return element;
  }

  function labeledInput(field, value, onChange, options = {}) {
    const wrapper = node('div', `field${options.full ? ' full' : ''}`);
    const label = node('label', '', field.label);
    const id = `${options.prefix || 'field'}-${field.id}`;
    label.htmlFor = id;
    const input = document.createElement(options.multiline ? 'textarea' : 'input');
    input.id = id;
    input.name = field.id;
    if (!options.multiline) input.type = field.type || 'text';
    input.value = value || '';
    if (field.required) input.required = true;
    if (field.type === 'number') {
      input.min = '0';
      input.max = '99';
    }
    input.addEventListener('input', () => onChange(input.value));
    wrapper.append(label, input);
    return wrapper;
  }

  function header() {
    const headerElement = node('header', 'app-header');
    const title = node('div');
    title.append(node('h1', '', 'Validación de Hoja Oficial FMCH'), node('p', '', 'Herramienta de entrevista local. No es documento oficial FMCH.'));
    const actions = node('div', 'app-header-actions');
    actions.append(
      button('Entrevistas guardadas', 'button secondary small', () => { state.screen = 'list'; render(); }),
      button('Importar JSON', 'button secondary small', () => importInput.click()),
      button(state.technicalMode ? 'Ocultar datos técnicos' : 'Modo técnico', 'button secondary small', () => { state.technicalMode = !state.technicalMode; render(); }),
      button('Nueva entrevista', 'button secondary small', () => { resetWelcome(); render(); })
    );
    headerElement.append(title, actions);
    return headerElement;
  }

  function resetWelcome() {
    state.screen = 'welcome';
    state.activeInterviewId = null;
    state.activeSectionIndex = 0;
    state.showFullSheet = false;
    state.zoom = 1;
    state.draftProfile = defaultProfile();
    state.consent = false;
    state.recordingConsent = false;
  }

  function renderWelcome(page) {
    const layout = node('div', 'welcome-layout');
    const hero = node('section', 'panel hero-panel');
    hero.append(
      node('p', 'eyebrow', 'Herramienta de entrevista'),
      node('h2', '', '¿Cómo se llena correctamente esta hoja?'),
      node('p', '', 'Esta entrevista ayuda a conservar la explicación de jueces y calificadores sobre la Hoja Oficial de Calificación por Equipo. Sus respuestas se guardan solo en este dispositivo hasta que usted las exporta.'),
      node('div', 'notice important', 'Las respuestas no cambian reglas, calificaciones ni datos de CharroPro. Primero se revisan con la autoridad deportiva.'),
      (() => { const row = node('div', 'button-row'); row.append(button('Usar entrevista de ejemplo', 'button quiet', startDemo), button('Ver entrevistas guardadas', 'button quiet', () => { state.screen = 'list'; render(); })); return row; })()
    );
    const profilePanel = node('section', 'panel');
    profilePanel.append(node('h2', 'panel-heading', 'Datos de la entrevista'));
    const body = node('div', 'panel-body');
    const grid = node('div', 'profile-grid');
    data.interviewerProfileFields.forEach((field) => {
      grid.append(labeledInput(field, state.draftProfile[field.id], (value) => { state.draftProfile[field.id] = value; }, { prefix: 'profile', full: ['respondentName', 'role'].includes(field.id) }));
    });
    grid.append(labeledInput({ id: 'openingNotes', label: 'Observaciones iniciales' }, state.draftProfile.openingNotes, (value) => { state.draftProfile.openingNotes = value; }, { prefix: 'profile', multiline: true, full: true }));
    const consent = checkbox('consent-register', 'Autorizo registrar mis respuestas en este dispositivo para revisión posterior.', state.consent, (checked) => { state.consent = checked; });
    const recording = checkbox('consent-recording', 'Autorizo registrar una referencia a audio o video, si se toma por separado.', state.recordingConsent, (checked) => { state.recordingConsent = checked; });
    const start = button('Comenzar entrevista', 'button', beginInterview);
    body.append(grid, consent, recording, node('p', 'hint', 'Teléfono y correo son opcionales. La versión inicial no permite adjuntos ni envía información a internet.'), start);
    profilePanel.append(body);
    layout.append(hero, profilePanel);
    page.append(layout);
  }

  function checkbox(id, text, checked, onChange) {
    const row = node('label', 'consent-row');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = id;
    input.checked = checked;
    input.addEventListener('change', () => onChange(input.checked));
    row.append(input, node('span', '', text));
    return row;
  }

  function beginInterview() {
    const missing = data.interviewerProfileFields.filter((field) => field.required && !safeText(state.draftProfile[field.id]).trim());
    if (missing.length) {
      showToast(`Complete: ${missing.map((field) => field.label).join(', ')}.`, 'error');
      return;
    }
    if (!state.consent) {
      showToast('Se requiere autorización para registrar las respuestas en este dispositivo.', 'error');
      return;
    }
    const record = createInterview(state.draftProfile, { registerResponses: state.consent, recordMedia: state.recordingConsent });
    persist(record);
    state.screen = 'instructions';
    render();
  }

  function startDemo() {
    const record = createInterview({
      ...defaultProfile(),
      respondentName: 'Juez Ejemplo',
      role: 'Juez de demostración',
      organization: 'Asociación Ejemplo',
      interviewDate: localDate(),
      interviewerName: 'Entrevistador Ejemplo',
      location: 'Lugar de demostración'
    }, { demo: true, registerResponses: true, recordMedia: false });
    record.answers['GEN-01'] = normalizeAnswer({
      narrative: 'Respuesta de demostración. Debe revisarse antes de utilizarse.',
      evidenceSources: ['Experiencia práctica'],
      confidence: 'Requiere confirmación',
      responseStatus: 'PENDING_REVIEW'
    });
    record.answers['CALA-01'] = normalizeAnswer({
      narrative: 'Ejemplo de captura ficticia. No representa una decisión deportiva.',
      evidenceSources: ['Otro'],
      confidence: 'No estoy seguro',
      responseStatus: 'PENDING_REVIEW'
    });
    persist(record);
    state.screen = 'instructions';
    render();
  }

  function renderInstructions(page) {
    const box = node('section', 'panel instructions');
    box.append(node('h2', 'panel-heading', 'Antes de comenzar'));
    const body = node('div', 'panel-body');
    body.append(node('p', '', 'No es un examen. Queremos registrar cómo se llena la hoja en la práctica y qué significado tiene cada parte.'));
    const list = node('ul', 'instruction-list');
    [
      'Puede dejar una pregunta pendiente o indicar que no está seguro.',
      'Puede explicar con sus palabras y aportar ejemplos de llenado.',
      'Puede señalar contradicciones o casos especiales.',
      'Puede volver atrás y corregir una respuesta antes de cerrar.',
      'La entrevista se guarda automáticamente en este dispositivo.',
      'Sus respuestas no se convierten automáticamente en reglas oficiales.'
    ].forEach((item) => list.append(node('li', '', item)));
    body.append(list);
    const row = node('div', 'button-row');
    row.append(button('Continuar', 'button', () => { state.screen = 'interview'; render(); }), button('Salir y continuar después', 'button quiet', () => { resetWelcome(); render(); }));
    body.append(row);
    box.append(body);
    page.append(box);
  }

  function renderInterview(page) {
    const record = activeInterview();
    if (!record) {
      resetWelcome();
      render();
      return;
    }
    const layout = node('div', 'interview-layout');
    layout.append(renderSectionNav(record), renderInterviewMain(record));
    page.append(layout);
  }

  function renderSectionNav(record) {
    const aside = node('aside', 'panel section-nav');
    aside.append(node('h2', '', 'Secciones de entrevista'));
    const total = questions.length;
    const complete = totalAnswered(record);
    aside.append(node('p', 'progress-label', `${complete} respondidas de ${total}`));
    const track = node('div', 'progress-track');
    const fill = node('span');
    fill.style.width = `${Math.round((complete / total) * 100)}%`;
    track.append(fill);
    aside.append(track);
    data.sections.forEach((section, index) => {
      const count = answeredCount(record, section.id);
      const label = node('span', '', section.title);
      const countLabel = node('span', 'section-count', `${count}/${section.questions.length} respondidas`);
      const link = button('', `section-link${index === state.activeSectionIndex ? ' active' : ''}`, () => {
        state.activeSectionIndex = index;
        state.showFullSheet = false;
        state.zoom = 1;
        render();
      });
      link.setAttribute('aria-current', index === state.activeSectionIndex ? 'step' : 'false');
      link.append(label, countLabel);
      aside.append(link);
    });
    return aside;
  }

  function renderInterviewMain(record) {
    const main = node('main', 'interview-main');
    const topbar = node('div', 'panel interview-topbar');
    const info = node('div');
    info.append(node('strong', '', record.profile.respondentName || 'Entrevista sin nombre'), node('p', 'hint', `${record.interviewStatus} - guardado localmente`));
    const actions = node('div', 'button-row');
    actions.append(
      node('span', `status-pill${record.demo ? ' warning' : ''}`, record.demo ? 'DEMONSTRACIÓN' : 'PENDIENTE DE REVISIÓN'),
      button('Guardar ahora', 'button quiet small', () => { persist(record, 'Entrevista guardada en este dispositivo.'); }),
      button('Exportar', 'button secondary small', () => exportJson(record))
    );
    topbar.append(info, actions);
    const section = data.sections[state.activeSectionIndex];
    const sectionPanel = node('section', 'panel');
    const heading = node('div', 'section-header');
    heading.append(node('h2', '', section.title), node('p', '', section.introduction));
    sectionPanel.append(heading, renderWorkspace(record, section), renderNavigationFooter(record));
    main.append(topbar, sectionPanel);
    return main;
  }

  function renderWorkspace(record, section) {
    const workspace = node('div', 'section-workspace');
    const viewer = node('div', 'sheet-viewer');
    const toolbar = node('div', 'viewer-toolbar');
    toolbar.append(
      button('Acercar', 'plain-button small', () => { state.zoom = Math.min(1.8, state.zoom + 0.15); render(); }),
      button('Alejar', 'plain-button small', () => { state.zoom = Math.max(0.7, state.zoom - 0.15); render(); }),
      button(state.showFullSheet ? 'Volver al recorte' : 'Ver hoja completa', 'plain-button small', () => { state.showFullSheet = !state.showFullSheet; state.zoom = 1; render(); })
    );
    const frame = node('div', 'viewer-frame');
    const image = document.createElement('img');
    image.src = state.showFullSheet ? 'assets/official-sheet-full.png' : section.image;
    image.alt = state.showFullSheet ? 'Hoja Oficial de Calificación por Equipo FMCH completa.' : `Recorte original de la Hoja Oficial FMCH: ${section.title}.`;
    image.style.transform = `scale(${state.zoom})`;
    frame.append(image);
    viewer.append(toolbar, frame, node('p', 'viewer-caption', 'Recorte tomado directamente de la hoja oficial y usado solo como apoyo para la entrevista.'));
    const questionList = node('div', 'questions');
    section.questions.forEach((question) => questionList.append(renderQuestion(record, question)));
    workspace.append(viewer, questionList);
    return workspace;
  }

  function renderQuestion(record, question) {
    const answer = normalizeAnswer(record.answers[question.id] || defaultAnswer());
    const card = node('article', 'question-card');
    card.append(node('h3', '', question.prompt), node('p', 'help', question.help));
    const choices = question.options.length
      ? question.options
      : question.type === 'yesNoDepends'
        ? ['Sí', 'No', 'Depende del caso', 'No estoy seguro']
        : [];
    if (choices.length) {
      const list = node('div', 'option-list');
      choices.forEach((option, optionIndex) => {
        const optionLabel = node('label', 'option');
        const input = document.createElement('input');
        const isMultiple = question.type === 'multiple';
        input.type = isMultiple ? 'checkbox' : 'radio';
        input.name = question.id;
        input.value = option;
        input.checked = isMultiple ? answer.selections.includes(option) : answer.selection === option;
        input.addEventListener('change', () => {
          if (isMultiple) {
            const selections = new Set(answer.selections);
            if (input.checked) selections.add(option); else selections.delete(option);
            writeAnswer(question.id, { selections: [...selections] });
          } else {
            writeAnswer(question.id, { selection: option });
          }
          if (!isMultiple) render();
        });
        input.id = `${question.id}-option-${optionIndex}`;
        optionLabel.htmlFor = input.id;
        optionLabel.append(input, node('span', '', option));
        list.append(optionLabel);
      });
      card.append(list);
    }
    const grid = node('div', 'answer-grid');
    grid.append(
      answerField('Explique con sus palabras', 'narrative', answer.narrative, true, (value) => writeAnswer(question.id, { narrative: value })),
      answerField('Ejemplo de llenado o caso especial', 'example', answer.example, true, (value) => writeAnswer(question.id, { example: value })),
      sourceField(answer, (sources) => writeAnswer(question.id, { evidenceSources: sources })),
      confidenceField(answer.confidence, (confidence) => writeAnswer(question.id, { confidence })),
      answerField('Notas del entrevistador', 'interviewerNotes', answer.interviewerNotes, true, (value) => writeAnswer(question.id, { interviewerNotes: value }))
    );
    card.append(grid, node('p', 'response-status', `Estado de la respuesta: ${answer.responseStatus.replaceAll('_', ' ')}. Se requiere revisión antes de usarla.`));
    if (state.technicalMode) {
      const meta = node('div', 'question-meta');
      meta.append(
        node('strong', '', 'Datos técnicos de trazabilidad'),
        node('div', '', `Pregunta fuente: ${question.sourceQuestionIds.join(', ')}`),
        node('div', '', `GAP relacionado: ${question.relatedGapIds.join(', ') || 'Sin GAP'}`),
        node('div', '', `FieldID vinculados (${question.relatedFieldIds.length}): ${question.relatedFieldIds.join(', ')}`)
      );
      card.append(meta);
    }
    return card;
  }

  function answerField(labelText, id, value, multiline, onChange) {
    const field = node('div', 'field');
    const label = node('label', '', labelText);
    const control = document.createElement(multiline ? 'textarea' : 'input');
    control.value = value || '';
    control.id = `${id}-${Math.random().toString(36).slice(2)}`;
    label.htmlFor = control.id;
    control.addEventListener('input', () => onChange(control.value));
    field.append(label, control);
    return field;
  }

  function sourceField(answer, onChange) {
    const field = node('fieldset', 'field');
    field.append(node('legend', '', '¿De dónde proviene esta explicación?'));
    const list = node('div', 'option-list');
    data.evidenceSources.forEach((source, index) => {
      const label = node('label', 'option');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = answer.evidenceSources.includes(source);
      input.id = `evidence-${index}-${Math.random().toString(36).slice(2)}`;
      input.addEventListener('change', () => {
        const sources = new Set(answer.evidenceSources);
        if (input.checked) sources.add(source); else sources.delete(source);
        onChange([...sources]);
      });
      label.htmlFor = input.id;
      label.append(input, node('span', '', source));
      list.append(label);
    });
    field.append(list);
    return field;
  }

  function confidenceField(value, onChange) {
    const field = node('div', 'field');
    const label = node('label', '', 'Nivel de certeza');
    const select = document.createElement('select');
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Seleccione una opción';
    select.append(placeholder);
    data.confidenceLevels.forEach((level) => {
      const option = document.createElement('option');
      option.value = level;
      option.textContent = level;
      option.selected = value === level;
      select.append(option);
    });
    select.addEventListener('change', () => onChange(select.value));
    field.append(label, select);
    return field;
  }

  function renderNavigationFooter(record) {
    const footer = node('div', 'navigation-footer');
    const left = node('div', 'button-row');
    const right = node('div', 'button-row');
    if (state.activeSectionIndex > 0) left.append(button('Anterior', 'button quiet', () => { state.activeSectionIndex -= 1; state.showFullSheet = false; state.zoom = 1; render(); }));
    left.append(button('Salir y continuar después', 'button quiet', () => { persist(record, 'La entrevista quedó guardada para continuar después.'); resetWelcome(); render(); }));
    if (state.activeSectionIndex < data.sections.length - 1) {
      right.append(button('Siguiente', 'button', () => { state.activeSectionIndex += 1; state.showFullSheet = false; state.zoom = 1; render(); }));
    } else {
      right.append(button('Marcar entrevista como terminada', 'button', () => {
        if (!window.confirm('¿Marcar la entrevista como terminada? Las respuestas seguirán pendientes de revisión.')) return;
        record.interviewStatus = 'COMPLETED';
        persist(record, 'Entrevista marcada como terminada y pendiente de revisión.');
        state.screen = 'list';
        render();
      }));
    }
    footer.append(left, right);
    return footer;
  }

  function renderList(page) {
    const records = store.list();
    const panel = node('section', 'panel');
    panel.append(node('h2', 'panel-heading', 'Entrevistas guardadas en este dispositivo'));
    const body = node('div', 'panel-body');
    body.append(node('p', 'hint', 'Cada entrevista se conserva por separado. Importar un archivo con un identificador existente crea una copia para no sobrescribir el original.'));
    const list = node('div', 'list-grid');
    if (!records.length) {
      list.append(node('div', 'empty-state', 'Aún no hay entrevistas guardadas en este dispositivo.'));
    } else {
      records.forEach((record) => list.append(renderInterviewItem(record)));
    }
    body.append(list, renderComparison(records));
    const actions = node('div', 'button-row');
    actions.append(button('Nueva entrevista', 'button', () => { resetWelcome(); render(); }), button('Importar JSON', 'button quiet', () => importInput.click()));
    body.append(actions);
    panel.append(body);
    page.append(panel);
  }

  function renderInterviewItem(record) {
    const item = node('article', 'interview-item');
    const info = node('div');
    const name = record.profile.respondentName || 'Entrevista sin nombre';
    info.append(node('h3', '', name), node('p', '', `${record.profile.role || 'Sin cargo'} - ${record.profile.interviewDate || 'Sin fecha'} - ${totalAnswered(record)}/${questions.length} respondidas`));
    const actions = node('div', 'button-row');
    actions.append(
      button('Continuar', 'button secondary small', () => { state.activeInterviewId = record.interviewId; state.screen = 'interview'; state.activeSectionIndex = 0; render(); }),
      button('JSON', 'button quiet small', () => exportJson(record)),
      button('CSV', 'button quiet small', () => exportCsv(record)),
      button('Imprimir', 'button quiet small', () => { state.activeInterviewId = record.interviewId; state.screen = 'interview'; render(); window.setTimeout(() => window.print(), 50); }),
      button('Borrar', 'button danger small', () => {
        if (!window.confirm(`¿Borrar la entrevista de ${name}? Esta acción solo afecta este dispositivo.`)) return;
        store.remove(record.interviewId);
        if (state.activeInterviewId === record.interviewId) state.activeInterviewId = null;
        showToast('Entrevista eliminada de este dispositivo.');
        render();
      })
    );
    item.append(info, actions);
    return item;
  }

  function renderComparison(records) {
    const wrap = node('section');
    wrap.append(node('h2', '', 'Respuestas que requieren comparación'));
    const conflicts = compareInterviews(records);
    const list = node('div', 'comparison-list');
    if (!conflicts.length) {
      list.append(node('p', 'hint', 'No se detectaron respuestas distintas para la misma pregunta entre las entrevistas guardadas. Esto no equivale a aprobación deportiva.'));
    } else {
      conflicts.slice(0, 12).forEach((conflict) => {
        const item = node('article', 'comparison-item');
        item.append(node('h3', '', conflict.prompt), node('p', '', `${conflict.responses.length} respuestas distintas. Revise con la autoridad deportiva; la herramienta no decide cuál es correcta.`));
        list.append(item);
      });
    }
    wrap.append(list);
    return wrap;
  }

  function exportJson(record) {
    const payload = buildExportPayload(record);
    download(`entrevista-fmch-${record.interviewId}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
    record.interviewStatus = record.interviewStatus === 'COMPLETED' ? 'EXPORTED' : record.interviewStatus;
    persist(record, 'Archivo JSON preparado sin enviar datos a internet.');
  }

  function exportCsv(record) {
    download(`entrevista-fmch-${record.interviewId}.csv`, buildCsv(record), 'text/csv;charset=utf-8');
    showToast('Archivo CSV preparado sin enviar datos a internet.');
  }

  function handleImport(file) {
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      showToast('El archivo es demasiado grande para una entrevista local.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      try {
        const payload = JSON.parse(String(reader.result));
        const validation = validateImportPayload(payload);
        if (!validation.valid) throw new Error(validation.reason);
        const existing = store.list().some((record) => record.interviewId === validation.record.interviewId);
        const record = normalizeInterview(validation.record, { newId: existing });
        persist(record, existing ? 'Se importó una copia para conservar la entrevista original.' : 'Entrevista importada para continuar o revisar.');
        state.screen = 'interview';
        state.activeSectionIndex = 0;
        render();
      } catch (error) {
        showToast(error.message || 'No fue posible importar el archivo.', 'error');
      }
    });
    reader.readAsText(file, 'utf-8');
  }

  function render() {
    root.replaceChildren();
    root.append(header());
    const page = node('div', 'page');
    root.append(page);
    if (state.screen === 'welcome') renderWelcome(page);
    else if (state.screen === 'instructions') renderInstructions(page);
    else if (state.screen === 'interview') renderInterview(page);
    else if (state.screen === 'list') renderList(page);
    else resetWelcome();
  }

  window.FMCHJudgeQuestionnaire = Object.freeze({
    STORAGE_KEY,
    createInterview,
    normalizeInterview,
    validateImportPayload,
    createStorageAdapter,
    buildCsv,
    buildExportPayload,
    compareInterviews,
    questions: cloneValue(questions),
    sections: cloneValue(data.sections)
  });

  if (importInput) {
    importInput.addEventListener('change', () => {
      const [file] = importInput.files;
      handleImport(file);
      importInput.value = '';
    });
  }

  if (hasDocument && root) {
    window.addEventListener('beforeunload', (event) => {
      if (activeInterview()) {
        event.preventDefault();
        event.returnValue = '';
      }
    });
    render();
  }
})();

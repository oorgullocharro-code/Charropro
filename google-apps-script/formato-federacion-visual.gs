// ============================================================
//  CharroPro -> Federacion Mexicana de Charreria
//  Hoja de Calificacion Visual por Equipo
// ============================================================

const COLOR = {
  headerBg: '#ffffff',
  headerFg: '#38761d',
  suerteBg: '#dddddd',
  suerteFg: '#000000',
  subHeaderBg: '#eeeeee',
  subHeaderFg: '#000000',
  malosCol: '#f4cccc',
  totalCol: '#fce5cd',
  baseFg: '#000000',
  altRow: '#f9f9f9',
  firmaBg: '#efefef',
  green: '#38761d',
  calaGray: '#dddddd',
  highlight: '#fff200'
};

const COL_WIDTHS = [160, 40, 35, 35, 35, 35, 35, 35, 35, 50, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 60, 85];
const SCRIPT_VERSION = '20260528-quick-teams1';
const SPREADSHEET_ID = '';
const LIVE_PAYLOAD_KEY = 'charropro_live_payload';
const GRAPHICS_CONFIG_KEY = 'charropro_graphics_config';

function doPost(e) {
  let raw = '';
  let data = null;
  try {
    raw = e && e.postData ? e.postData.contents : '';
    data = JSON.parse(raw);
    if (data.action === 'update_graphics_theme') {
      _storeGraphicsConfig(data.graphicsConfig || data.theme || {});
      return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
    }
    _storeLivePayload(data);
    const ss = _getSpreadsheet();
    const equipos = data.detalles || [];
    const meta = {
      status: 'OK',
      sheetNames: [],
      errors: []
    };

    if (!equipos.length) {
      meta.status = 'SIN DETALLES';
      meta.errors.push('No llego data.detalles desde CharroPro.');
      _writeObsData(ss, data, meta);
      return ContentService.createTextOutput('ERROR: No llego data.detalles desde CharroPro.').setMimeType(ContentService.MimeType.TEXT);
    }

    equipos.forEach(equipo => {
      try {
        const sheetName = _getScoreSheetName(data, equipo);
        let sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

        _prepareScoreSheet(sheet);
        _setupColumns(sheet);
        _drawSkeleton(sheet, data, equipo);
        _fillData(sheet, equipo);
        _finishSheet(sheet, equipo);
        meta.sheetNames.push(sheetName);
      } catch (teamErr) {
        meta.errors.push((equipo && equipo.name ? equipo.name : 'Equipo') + ': ' + teamErr.message);
      }
    });

    if (meta.errors.length) meta.status = 'ERROR EN HOJAS';
    _writeObsData(ss, data, meta);

    return ContentService
      .createTextOutput(meta.errors.length ? 'ERROR: ' + meta.errors.join(' | ') : 'OK')
      .setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    try {
      const ss = _getSpreadsheet();
      _writeObsData(ss, data || {}, {
        status: 'ERROR GENERAL',
        sheetNames: [],
        errors: [err.message],
        rawPreview: raw ? raw.slice(0, 500) : ''
      });
    } catch (logErr) {
      // Si ni siquiera hay Spreadsheet disponible, el error se devuelve como texto.
    }
    return ContentService.createTextOutput('ERROR: ' + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}

function doGet(e) {
  try {
    const live = _getStoredLivePayload();
    return _liveResponse(e, live || { ok: false, error: 'Sin estado vivo guardado.' });
  } catch (err) {
    return _liveResponse(e, { ok: false, error: err.message });
  }
}

function _storeLivePayload(payload) {
  const graphicsConfig = _getGraphicsConfig() || payload.graphicsConfig;
  const compactPayload = _buildCompactLivePayload(payload, graphicsConfig);
  const livePayload = {
    ok: true,
    scriptVersion: SCRIPT_VERSION,
    graphicsConfig: graphicsConfig,
    updatedAt: new Date().toISOString(),
    payload: compactPayload
  };
  const raw = JSON.stringify(livePayload);
  CacheService.getScriptCache().put(LIVE_PAYLOAD_KEY, raw, 21600);
  PropertiesService.getScriptProperties().setProperty(LIVE_PAYLOAD_KEY, raw);
}

function _buildCompactLivePayload(payload, graphicsConfig) {
  const turn = payload.turn || null;
  return {
    action: payload.action || 'update_live_graphics',
    timestamp: payload.timestamp || new Date().toISOString(),
    tournament: _compactTournament(payload.tournament),
    charreada: _compactCharreada(payload.charreada),
    turn: _compactTurn(turn),
    timer: _compactTimer(payload.timer),
    graphicsConfig: graphicsConfig,
    leaderboard: (payload.leaderboard || []).map(_compactLeaderboardItem),
    teamStandings: _compactTeamStandings(payload.teamStandings),
    detalles: (payload.detalles || []).map(equipo => ({
      id: equipo.id || '',
      name: equipo.name || ''
    }))
  };
}

function _compactTournament(tournament) {
  if (!tournament) return null;
  return {
    id: tournament.id || '',
    name: tournament.name || '',
    date: tournament.date || '',
    venue: tournament.venue || '',
    status: tournament.status || ''
  };
}

function _compactCharreada(charreada) {
  if (!charreada) return null;
  return {
    id: charreada.id || '',
    name: charreada.name || '',
    date: charreada.date || '',
    startTime: charreada.startTime || '',
    status: charreada.status || '',
    teamIds: charreada.teamIds || []
  };
}

function _compactTurn(turn) {
  if (!turn) return null;
  const suerte = turn.suerte || {};
  return {
    team: _compactTeam(turn.team),
    suerte: {
      id: suerte.id || '',
      name: suerte.name || '',
      fullName: suerte.fullName || suerte.name || '',
      type: suerte.type || '',
      attempts: suerte.attempts || 1
    },
    attemptIndex: Number(turn.attemptIndex || 0),
    coleadorIndex: Number(turn.coleadorIndex || 0),
    attempt: _compactAttempt(turn.attempt),
    charro: turn.charro || ''
  };
}

function _compactTeam(team) {
  if (!team) return null;
  return {
    id: team.id || '',
    name: team.name || '',
    captain: team.captain || '',
    association: team.association || ''
  };
}

function _compactAttempt(att) {
  if (!att) return null;
  return {
    base: Number(att.base || 0),
    adic: Number(att.adic || 0),
    infr: Number(att.infr || 0),
    puntaPts: Number(att.puntaPts || 0),
    puntaMetros: Number(att.puntaMetros || 0),
    puntaPiquetes: Number(att.puntaPiquetes || 0),
    tiempo: att.tiempo || '',
    desc: att.desc || null,
    note: att.note || ''
  };
}

function _compactTimer(timer) {
  timer = timer || {};
  return {
    running: Boolean(timer.running),
    startedAt: timer.startedAt || null,
    elapsedMs: Number(timer.elapsedMs || 0),
    formatted: timer.formatted || '00:00.0',
    updatedAt: timer.updatedAt || null
  };
}

function _compactLeaderboardItem(item) {
  item = item || {};
  return {
    team: _compactTeam(item.team),
    total: Number(item.total || 0),
    infr: Number(item.infr || 0)
  };
}

function _compactTeamStandings(table) {
  table = table || {};
  const charreadas = (table.charreadas || []).map((charreada, index) => ({
    id: charreada.id || '',
    name: charreada.name || ('Charreada ' + (index + 1)),
    date: charreada.date || '',
    startTime: charreada.startTime || '',
    status: charreada.status || ''
  }));

  const rows = (table.rows || []).map(row => ({
    team: _compactTeam(row.team),
    results: (row.results || []).map(result => ({
      charreada: {
        id: result.charreada ? (result.charreada.id || '') : '',
        name: result.charreada ? (result.charreada.name || '') : ''
      },
      participated: Boolean(result.participated),
      total: result.total === null || result.total === undefined ? null : Number(result.total || 0),
      infr: Number(result.infr || 0)
    })),
    total: Number(row.total || 0),
    average: Number(row.average || 0),
    charreadasCount: Number(row.charreadasCount || 0),
    infr: Number(row.infr || 0)
  }));

  return { charreadas: charreadas, rows: rows };
}

function _getStoredLivePayload() {
  const raw = CacheService.getScriptCache().get(LIVE_PAYLOAD_KEY) ||
    PropertiesService.getScriptProperties().getProperty(LIVE_PAYLOAD_KEY);
  if (!raw) return null;
  const live = JSON.parse(raw);
  const graphicsConfig = _getGraphicsConfig() || live.graphicsConfig || (live.payload ? live.payload.graphicsConfig : null);
  if (!_hasLivePayload(live.payload || live)) {
    return {
      ok: true,
      scriptVersion: SCRIPT_VERSION,
      graphicsConfig: graphicsConfig,
      updatedAt: live.updatedAt || new Date().toISOString(),
      payload: { graphicsConfig: graphicsConfig }
    };
  }
  if (graphicsConfig) {
    live.graphicsConfig = graphicsConfig;
    if (live.payload) live.payload.graphicsConfig = graphicsConfig;
  }
  return live;
}

function _hasLivePayload(payload) {
  if (!payload || typeof payload !== 'object') return false;
  if (payload.action === 'update_graphics_theme') return false;
  if (payload.turn && payload.turn.team) return true;
  if (payload.leaderboard && payload.leaderboard.length) return true;
  if (payload.teamStandings && payload.teamStandings.rows && payload.teamStandings.rows.length) return true;
  if (payload.detalles && payload.detalles.length) return true;
  return Boolean(payload.timer && (payload.timer.running || payload.timer.startedAt || Number(payload.timer.elapsedMs || 0)));
}

function _storeGraphicsConfig(config) {
  const raw = JSON.stringify(config || {});
  CacheService.getScriptCache().put(GRAPHICS_CONFIG_KEY, raw, 21600);
  PropertiesService.getScriptProperties().setProperty(GRAPHICS_CONFIG_KEY, raw);
}

function _getGraphicsConfig() {
  const raw = CacheService.getScriptCache().get(GRAPHICS_CONFIG_KEY) ||
    PropertiesService.getScriptProperties().getProperty(GRAPHICS_CONFIG_KEY);
  return raw ? JSON.parse(raw) : null;
}

function _liveResponse(e, data) {
  const callback = e && e.parameter ? e.parameter.callback : '';
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
    return ContentService
      .createTextOutput(callback + '(' + JSON.stringify(data) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function _getSpreadsheet() {
  const spreadsheetId = String(SPREADSHEET_ID || '').trim();
  if (spreadsheetId) return SpreadsheetApp.openById(spreadsheetId);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('No hay hoja activa. Si este Apps Script no esta ligado al Google Sheet, pega el ID del archivo en SPREADSHEET_ID.');
  }
  return ss;
}

function _writeObsData(ss, payload, meta) {
  meta = meta || {};
  const sheet = ss.getSheetByName('Data_OBS') || ss.insertSheet('Data_OBS');
  const turn = payload.turn || {};
  const timer = payload.timer || {};
  const leaderboard = payload.leaderboard || [];
  const teamStandings = payload.teamStandings || {};
  const detalles = payload.detalles || [];
  const rows = [
    ['Actualizado', new Date()],
    ['Script version', SCRIPT_VERSION],
    ['Estado recepcion', meta.status || 'OK'],
    ['Hojas escritas', (meta.sheetNames || []).join(' | ')],
    ['Ultimo error', (meta.errors || []).join(' | ')],
    ['Payload muestra', meta.rawPreview || ''],
    ['Diseno graficos', payload.graphicsConfig ? 'SI' : 'NO'],
    ['Charreada', payload.charreada ? payload.charreada.name : ''],
    ['Equipo en turno', turn.team ? turn.team.name : ''],
    ['Suerte', turn.suerte ? turn.suerte.fullName : ''],
    ['Charro', turn.charro || ''],
    ['Oportunidad', Number(turn.attemptIndex || 0) + 1],
    ['Pasada', turn.attempt ? _attemptTotal(turn.attempt) : 0],
    ['Cronometro activo', timer.running ? 'SI' : 'NO'],
    ['Cronometro inicio', timer.startedAt || ''],
    ['Cronometro base ms', Number(timer.elapsedMs || 0)],
    ['Cronometro texto', timer.formatted || '00:00.0'],
    ['Hojas recibidas', detalles.map(equipo => equipo.name).join(' | ')],
    [],
    ['#', 'Equipo', 'Puntos', 'Malos', 'En turno']
  ];

  leaderboard.forEach((item, index) => {
    rows.push([
      index + 1,
      item.team ? item.team.name : '',
      Number(item.total || 0),
      Number(item.infr || 0),
      turn.team && item.team && item.team.id === turn.team.id ? 'SI' : ''
    ]);
  });

  if (teamStandings.rows && teamStandings.rows.length) {
    const standingsCharreadas = teamStandings.charreadas || [];
    rows.push([]);
    rows.push(['Tabla general por equipos']);
    rows.push(['#', 'Equipo'].concat(
      standingsCharreadas.map((charreada, index) => 'CH' + (index + 1)),
      ['Prom.', 'Total']
    ));
    teamStandings.rows.forEach((row, index) => {
      rows.push([index + 1, row.team ? row.team.name : ''].concat(
        standingsCharreadas.map(charreada => {
          const result = (row.results || []).find(item => item.charreada && item.charreada.id === charreada.id);
          return result && result.participated ? Number(result.total || 0) : '';
        }),
        [Number(row.average || 0), Number(row.total || 0)]
      ));
    });
  }

  const columnCount = Math.max.apply(null, rows.map(row => row.length));
  const headerRow = rows.findIndex(row => row[0] === '#') + 1;
  sheet.clear();
  sheet.getRange(1, 1, rows.length, columnCount).setValues(rows.map(row => {
    while (row.length < columnCount) row.push('');
    return row;
  }));
  sheet.getRange(1, 1, 1, columnCount).setFontWeight('bold');
  if (headerRow > 0) sheet.getRange(headerRow, 1, 1, columnCount).setFontWeight('bold').setBackground('#dddddd');
  sheet.autoResizeColumns(1, columnCount);
}

function _attemptTotal(att) {
  if (!att) return 0;
  const teamPenalty = _teamPenaltyTotal(att);
  if (att.desc) return -teamPenalty;
  return (Number(att.base) || 0) + (Number(att.adic) || 0) + (Number(att.puntaPts) || 0) - (Number(att.infr) || 0) - teamPenalty;
}

function _teamPenaltyTotal(att) {
  return (att && att.teamPenalties ? att.teamPenalties : []).reduce((sum, item) => {
    const quantity = Math.max(1, Number(item.quantity || 1));
    const total = item.total === undefined || item.total === null
      ? Number(item.pts || 0) * quantity
      : Number(item.total || 0);
    return sum + total;
  }, 0);
}

function _setupColumns(sheet) {
  _ensureSheetSize(sheet, 220, COL_WIDTHS.length);
  COL_WIDTHS.forEach((w, i) => sheet.setColumnWidth(i + 1, w));
  sheet.setFrozenRows(3);
}

function _prepareScoreSheet(sheet) {
  _ensureSheetSize(sheet, 220, COL_WIDTHS.length);
  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).breakApart();
  sheet.clear();
  sheet.clearFormats();
}

function _ensureSheetSize(sheet, minRows, minCols) {
  const maxRows = sheet.getMaxRows();
  const maxCols = sheet.getMaxColumns();
  if (maxRows < minRows) sheet.insertRowsAfter(maxRows, minRows - maxRows);
  if (maxCols < minCols) sheet.insertColumnsAfter(maxCols, minCols - maxCols);
}

function _mergeWrite(sheet, r, c, numR, numC, val, bg, fg, bold, size, hAlign) {
  const range = sheet.getRange(r, c, numR, numC);
  if (numR > 1 || numC > 1) range.merge();
  range.setValue(val);
  range
    .setBackground(bg || null)
    .setFontColor(fg || COLOR.baseFg)
    .setFontWeight(bold ? 'bold' : 'normal')
    .setHorizontalAlignment(hAlign || 'center')
    .setVerticalAlignment('middle')
    .setWrap(true)
    .setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
  if (size) range.setFontSize(size);
  return range;
}

function _valOrBlank(val) {
  return (val === undefined || val === null || val === 0 || val === '0' || val === '') ? '' : val;
}

function _drawSkeleton(sheet, data, equipo) {
  let row = 1;
  const eventoName = data.tournament ? data.tournament.name : (data.charreada ? data.charreada.name : 'Evento');
  const fecha = data.charreada ? (data.charreada.date || '') : (data.timestamp ? data.timestamp.substring(0, 10) : '');
  const hora = data.charreada ? (data.charreada.startTime || '') : '';

  _mergeWrite(sheet, row, 1, 1, 15, 'FEDERACION MEXICANA DE CHARRERIA, A.C.', COLOR.headerBg, COLOR.headerFg, true, 14);
  _mergeWrite(sheet, row, 16, 1, 7, 'HOJA DE CALIFICACION', COLOR.headerBg, COLOR.headerFg, true, 11);
  row++;
  _mergeWrite(sheet, row, 1, 1, 22, 'SECRETARIA DEL DEPORTE 2024 - 2028', '#ffffff', '#cc0000', false, 8);
  row++;
  _mergeWrite(sheet, row, 1, 1, 8, 'EVENTO: ' + eventoName, null, null, false, 9, 'left');
  _mergeWrite(sheet, row, 9, 1, 4, 'FECHA: ' + fecha, null, null, false, 9, 'left');
  _mergeWrite(sheet, row, 13, 1, 4, 'HORA: ' + hora, null, null, false, 9, 'left');
  _mergeWrite(sheet, row, 17, 1, 6, 'EQUIPO: ' + equipo.name, null, null, true, 11, 'left');
  row++;

  equipo._rowMap = {};
  equipo._controlRowMap = {};
  const suertes = equipo.suertes || [];
  suertes.forEach(suerte => {
    equipo._rowMap[suerte.suerteName] = row;
    if (suerte.suerteName === 'Cala de Caballo') row = _drawCalaSkeleton(sheet, row);
    else if (suerte.suerteName === 'Piales en el Lienzo' || suerte.suerteName === 'Coleadero') row = _drawHorizontalSkeleton(sheet, row, suerte.suerteName);
    else if (suerte.suerteName === 'Jineteo de Toro' || suerte.suerteName === 'Jineteo de Yegua') row = _drawJineteoSkeleton(sheet, row, suerte.suerteName);
    else if (suerte.suerteName === 'Manganas a Pie' || suerte.suerteName === 'Manganas a Caballo') row = _drawHorizontalSkeleton(sheet, row, suerte.suerteName);
    else row = _drawGenericSkeleton(sheet, row, suerte.suerteName);
    equipo._controlRowMap[suerte.suerteName] = row;
    row = _drawScoreControlRow(sheet, row);
  });

  _mergeWrite(sheet, row, 1, 1, 19, 'TOTAL PUNTOS EQUIPO ->', COLOR.headerBg, COLOR.headerFg, true, 10, 'right');
  sheet.getRange(row, 20, 1, 3).merge().setBackground(COLOR.totalCol).setFontWeight('bold').setFontSize(14).setHorizontalAlignment('center');
  equipo._totalRow = row;
  row += 2;

  _mergeWrite(sheet, row, 1, 1, 5, 'JUEZ', COLOR.firmaBg, '#000', true, 10);
  _mergeWrite(sheet, row, 7, 1, 5, 'JUEZ', COLOR.firmaBg, '#000', true, 10);
  _mergeWrite(sheet, row, 13, 1, 5, 'JUEZ', COLOR.firmaBg, '#000', true, 10);
  _mergeWrite(sheet, row, 19, 1, 4, 'CAPITAN', COLOR.firmaBg, '#000', true, 10);
}

function _drawCalaSkeleton(sheet, row) {
  const startRow = row;
  _mergeWrite(sheet, row, 1, 2, 1, 'CALA DE CABALLO', COLOR.calaGray, '#000', true, 12);
  _mergeWrite(sheet, row, 2, 1, 9, '____ METROS EN ____ TIEMPOS', null, '#000', true, 9);
  _mergeWrite(sheet, row, 11, 1, 10, 'MALOS', null, '#ff0000', true, 10);
  _mergeWrite(sheet, row, 21, 1, 1, 'TOTAL\nMALOS', COLOR.calaGray, '#000', true, 8);
  _mergeWrite(sheet, row, 22, 1, 1, 'PUNTOS', COLOR.calaGray, '#000', true, 9);
  row++;
  ['BASE', 'P', 'T', 'L D', 'LI', 'MD', 'MI', 'CR', 'TOTAL'].forEach((h, i) => _mergeWrite(sheet, row, 2 + i, 1, 1, h, null, '#000', true, 8));
  for (let i = 0; i < 10; i++) _mergeWrite(sheet, row, 11 + i, 1, 1, '', null);
  _mergeWrite(sheet, row, 21, 1, 1, '', COLOR.calaGray);
  _mergeWrite(sheet, row, 22, 1, 1, 'PARCIALES', COLOR.calaGray, '#000', true, 8);
  row++;
  _mergeWrite(sheet, row, 1, 1, 1, '', null);
  _mergeWrite(sheet, row, 2, 1, 1, '20', null, '#ff0000', true, 14);
  for (let i = 3; i <= 22; i++) _mergeWrite(sheet, row, i, 1, 1, '', null);
  row++;
  _mergeWrite(sheet, row, 1, 1, 1, 'SUPLENTE', null, '#000', true, 8, 'left');
  _mergeWrite(sheet, row, 2, 1, 12, '', null).setBorder(false, false, false, false, false, false);
  _mergeWrite(sheet, row, 14, 1, 7, 'INFRACCION AL EQUIPO', null, '#000', true, 9, 'right').setBorder(false, false, false, false, false, false);
  _mergeWrite(sheet, row, 21, 1, 2, '', null, '#ff0000', true, 10);
  sheet.getRange(startRow, 1, 4, 22).setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
  return row + 1;
}

function _drawHorizontalSkeleton(sheet, row, title) {
  _mergeWrite(sheet, row, 1, 1, 1, title, COLOR.suerteBg, COLOR.suerteFg, true, 9);
  _mergeWrite(sheet, row, 2, 1, 6, '1a OPORTUNIDAD', COLOR.subHeaderBg, '#000', true, 8);
  _mergeWrite(sheet, row, 8, 1, 6, '2a OPORTUNIDAD', COLOR.subHeaderBg, '#000', true, 8);
  _mergeWrite(sheet, row, 14, 1, 6, '3a OPORTUNIDAD', COLOR.subHeaderBg, '#000', true, 8);
  _mergeWrite(sheet, row, 20, 1, 3, 'TOTAL', COLOR.totalCol, '#000', true, 9);
  row++;
  _mergeWrite(sheet, row, 1, 1, 1, 'CHARRO', COLOR.calaGray, '#000', true, 7);
  for (let i = 0; i < 3; i++) {
    let off = i * 6 + 2;
    _mergeWrite(sheet, row, off, 1, 2, 'B', null, '#000', true, 8);
    _mergeWrite(sheet, row, off + 2, 1, 2, 'A', null, '#000', true, 8);
    _mergeWrite(sheet, row, off + 4, 1, 1, 'M', COLOR.malosCol, '#cc0000', true, 8);
    _mergeWrite(sheet, row, off + 5, 1, 1, 'T', COLOR.calaGray, '#000', true, 8);
  }
  _mergeWrite(sheet, row, 20, 1, 3, '', COLOR.totalCol);
  row++;
  for (let c = 0; c < 3; c++) {
    _mergeWrite(sheet, row, 1, 1, 1, '', null);
    for (let i = 0; i < 3; i++) {
      let off = i * 6 + 2;
      _mergeWrite(sheet, row, off, 1, 2, '', null);
      _mergeWrite(sheet, row, off + 2, 1, 2, '', null);
      _mergeWrite(sheet, row, off + 4, 1, 1, '', COLOR.malosCol);
      _mergeWrite(sheet, row, off + 5, 1, 1, '', null);
    }
    _mergeWrite(sheet, row, 20, 1, 3, '', COLOR.totalCol);
    row++;
  }
  _mergeWrite(sheet, row, 1, 1, 1, 'SUPLENTE', null, '#000', true, 8, 'left');
  _mergeWrite(sheet, row, 14, 1, 7, 'INFRACCION AL EQUIPO', null, '#000', true, 9, 'right').setBorder(false, false, false, false, false, false);
  _mergeWrite(sheet, row, 21, 1, 2, '', null, '#ff0000', true, 10);
  return row + 1;
}

function _drawJineteoSkeleton(sheet, row, title) {
  _mergeWrite(sheet, row, 1, 1, 1, title || 'JINETEO', COLOR.suerteBg, COLOR.suerteFg, true, 9);
  ['B-14', 'B-18', 'T.AHO', '1M', 'TENT', 'PIER', 'ADOR', 'CAER', 'BAJA', 'BAJA'].forEach((h, i) => _mergeWrite(sheet, row, 2 + i, 1, 1, h, COLOR.calaGray, '#000', true, 5));
  _mergeWrite(sheet, row, 12, 1, 3, 'ADIC', COLOR.subHeaderBg);
  _mergeWrite(sheet, row, 15, 1, 2, 'MALOS', COLOR.malosCol, '#cc0000', true, 8);
  _mergeWrite(sheet, row, 17, 1, 3, 'TIEMPO', COLOR.calaGray);
  _mergeWrite(sheet, row, 20, 1, 3, 'TOTAL', COLOR.totalCol);
  row++;
  _mergeWrite(sheet, row, 1, 1, 1, '', null);
  for (let i = 2; i <= 11; i++) _mergeWrite(sheet, row, i, 1, 1, '', null);
  _mergeWrite(sheet, row, 12, 1, 3, '', null);
  _mergeWrite(sheet, row, 15, 1, 2, '', COLOR.malosCol);
  _mergeWrite(sheet, row, 17, 1, 3, '', null);
  _mergeWrite(sheet, row, 20, 1, 3, '', COLOR.totalCol);
  row++;
  _mergeWrite(sheet, row, 1, 1, 1, 'SUPLENTE', null, '#000', true, 8, 'left');
  _mergeWrite(sheet, row, 14, 1, 7, 'INFRACCION AL EQUIPO', null, '#000', true, 9, 'right').setBorder(false, false, false, false, false, false);
  _mergeWrite(sheet, row, 21, 1, 2, '', null, '#ff0000', true, 10);
  return row + 1;
}

function _drawGenericSkeleton(sheet, row, title) {
  _mergeWrite(sheet, row, 1, 1, 1, title, COLOR.suerteBg, COLOR.suerteFg, true, 9);
  _mergeWrite(sheet, row, 2, 1, 17, 'ADICIONALES / BASE', COLOR.subHeaderBg);
  _mergeWrite(sheet, row, 19, 1, 1, 'M', COLOR.malosCol, '#cc0000', true, 8);
  _mergeWrite(sheet, row, 20, 1, 3, 'TOTAL', COLOR.totalCol);
  row++;
  for (let c = 0; c < 3; c++) {
    _mergeWrite(sheet, row, 1, 1, 1, '', null);
    _mergeWrite(sheet, row, 2, 1, 17, '', null);
    _mergeWrite(sheet, row, 19, 1, 1, '', COLOR.malosCol);
    _mergeWrite(sheet, row, 20, 1, 3, '', COLOR.totalCol);
    row++;
  }
  _mergeWrite(sheet, row, 1, 1, 1, 'SUPLENTE', null, '#000', true, 8, 'left');
  _mergeWrite(sheet, row, 14, 1, 7, 'INFRACCION AL EQUIPO', null, '#000', true, 9, 'right').setBorder(false, false, false, false, false, false);
  _mergeWrite(sheet, row, 21, 1, 2, '', null, '#ff0000', true, 10);
  return row + 1;
}

function _drawScoreControlRow(sheet, row) {
  _mergeWrite(sheet, row, 13, 1, 2, 'ACUM. ANTERIOR', COLOR.calaGray, '#000', true, 8);
  _mergeWrite(sheet, row, 15, 1, 2, '', COLOR.highlight, '#000', true, 10);
  _mergeWrite(sheet, row, 17, 1, 2, 'PUNTOS SUERTE', COLOR.calaGray, '#000', true, 8);
  _mergeWrite(sheet, row, 19, 1, 2, '', COLOR.highlight, '#000', true, 10);
  _mergeWrite(sheet, row, 21, 1, 1, 'TOTAL', COLOR.calaGray, '#000', true, 8);
  _mergeWrite(sheet, row, 22, 1, 1, '', COLOR.highlight, '#000', true, 10);
  return row + 1;
}

function _writeScoreControl(sheet, row, previous, sectionTotal, runningTotal) {
  sheet.getRange(row, 15).setValue(previous).setFontWeight('bold');
  sheet.getRange(row, 19).setValue(sectionTotal).setFontWeight('bold');
  sheet.getRange(row, 22).setValue(runningTotal).setFontWeight('bold');
}

function _fillData(sheet, equipo) {
  let gTotal = 0;
  (equipo.suertes || []).forEach(suerte => {
    const r = equipo._rowMap[suerte.suerteName];
    if (!r || !suerte.attempts) return;
    let sectionTotal = 0;

    if (suerte.suerteName === 'Cala de Caballo') {
      const att = suerte.attempts[0];
      if (!att) return;
      const base = Number(att.base) || 0;
      const adic = Number(att.adic) || 0;
      const infr = Number(att.infr) || 0;
      const teamPenalty = _teamPenaltyTotal(att);
      const total = (att.desc ? 0 : (base + adic + (Number(att.puntaPts) || 0) - infr)) - teamPenalty;
      const adicGrid = _buildCalaAdicGrid(att);
      const dRow = r + 2;
      sheet.getRange(dRow, 1).setValue(att.charro || '');
      sheet.getRange(r, 2).setValue(`__${_valOrBlank(att.puntaMetros)}__ METROS EN __${_valOrBlank(att.puntaPiquetes)}__ TIEMPOS`);
      sheet.getRange(dRow, 2).setValue(base).setFontColor('#ff0000').setFontWeight('bold');
      sheet.getRange(dRow, 3).setValue(_valOrBlank(att.puntaPts));
      sheet.getRange(dRow, 4).setValue(_valOrBlank(att.puntaPiquetes));
      sheet.getRange(dRow, 5).setValue(_valOrBlank(adicGrid.ld));
      sheet.getRange(dRow, 6).setValue(_valOrBlank(adicGrid.li));
      sheet.getRange(dRow, 7).setValue(_valOrBlank(adicGrid.md));
      sheet.getRange(dRow, 8).setValue(_valOrBlank(adicGrid.mi));
      sheet.getRange(dRow, 9).setValue(_valOrBlank(adicGrid.pc));
      sheet.getRange(dRow, 10).setValue(base + adic + (Number(att.puntaPts) || 0)).setBackground(COLOR.calaGray).setFontWeight('bold');
      _writeCalaMalosGrid(sheet, r + 1, dRow, att);
      sheet.getRange(dRow, 21).setValue(infr + teamPenalty > 0 ? '-' + (infr + teamPenalty) : '').setFontColor('#ff0000').setFontWeight('bold');
      sheet.getRange(dRow, 22).setValue(att.desc ? 'DESC' : total).setFontWeight('bold');
      sheet.getRange(r + 3, 21).setValue(teamPenalty > 0 ? '-' + teamPenalty : '').setFontColor('#ff0000').setFontWeight('bold');
      sectionTotal += total;
    } else if (suerte.suerteName === 'Coleadero') {
      suerte.attempts.forEach((coleador, idx) => {
        if (idx > 2) return;
        const dRow = r + 2 + idx;
        sheet.getRange(dRow, 1).setValue(coleador.coleadorName || `Coleador ${idx + 1}`);
        let rowSum = 0;
        (coleador.attempts || []).forEach((att, t) => {
          if (t > 2) return;
          const off = t * 6 + 2;
          const pts = att.desc ? 0 : ((Number(att.base) || 0) + (Number(att.adic) || 0) - (Number(att.infr) || 0));
          sheet.getRange(dRow, off).setValue(_valOrBlank(att.base));
          sheet.getRange(dRow, off + 2).setValue(_valOrBlank(att.adic));
          sheet.getRange(dRow, off + 4).setValue(att.infr ? '-' + att.infr : '').setFontColor('#cc0000');
          sheet.getRange(dRow, off + 5).setValue(att.desc ? 'DESC' : _valOrBlank(pts)).setFontWeight('bold');
          rowSum += pts;
        });
        sheet.getRange(dRow, 20).setValue(rowSum).setFontWeight('bold');
        sectionTotal += rowSum;
      });
    } else if (suerte.suerteName === 'Piales en el Lienzo' || suerte.suerteName === 'Manganas a Pie' || suerte.suerteName === 'Manganas a Caballo') {
      const dRow = r + 2;
      sheet.getRange(dRow, 1).setValue((suerte.attempts[0] && suerte.attempts[0].charro) || '');
      let rowSum = 0;
      suerte.attempts.forEach((att, t) => {
        if (t > 2) return;
        const off = t * 6 + 2;
        const pts = att.desc ? 0 : ((Number(att.base) || 0) + (Number(att.adic) || 0) - (Number(att.infr) || 0));
        sheet.getRange(dRow, off).setValue(_valOrBlank(att.base));
        sheet.getRange(dRow, off + 2).setValue(_valOrBlank(att.adic));
        sheet.getRange(dRow, off + 4).setValue(att.infr ? '-' + att.infr : '').setFontColor('#cc0000');
        sheet.getRange(dRow, off + 5).setValue(att.desc ? 'DESC' : _valOrBlank(pts)).setFontWeight('bold');
        rowSum += pts;
      });
      sheet.getRange(dRow, 20).setValue(rowSum).setFontWeight('bold');
      sectionTotal += rowSum;
    } else if (suerte.suerteName === 'Jineteo de Toro' || suerte.suerteName === 'Jineteo de Yegua') {
      const att = suerte.attempts[0];
      if (!att) return;
      const dRow = r + 1;
      const pts = att.desc ? 0 : ((Number(att.base) || 0) + (Number(att.adic) || 0) - (Number(att.infr) || 0));
      sheet.getRange(dRow, 1).setValue(att.charro || '').setFontWeight('bold');
      const b = Number(att.base);
      if (b === 14) sheet.getRange(dRow, 2).setValue(14);
      else if (b === 18 || b === 20 || b === 24) sheet.getRange(dRow, 3).setValue(b);
      sheet.getRange(dRow, 12).setValue(_valOrBlank(att.adic));
      sheet.getRange(dRow, 15).setValue(att.infr ? '-' + att.infr : '').setFontColor('#cc0000');
      sheet.getRange(dRow, 17).setValue(_valOrBlank(att.tiempoTendido || att.tiempo));
      sheet.getRange(dRow, 20).setValue(att.desc ? 'DESC' : _valOrBlank(pts)).setFontWeight('bold');
      sectionTotal += pts;
    } else {
      suerte.attempts.forEach((att, i) => {
        if (i > 2) return;
        const dRow = r + 1 + i;
        const pts = att.desc ? 0 : ((Number(att.base) || 0) + (Number(att.adic) || 0) - (Number(att.infr) || 0));
        sheet.getRange(dRow, 1).setValue(att.charro || '');
        const desc = _valOrBlank(att.base) ? `Base: ${att.base} Adic: ${att.adic || 0}` : (_valOrBlank(att.adic) ? `Adic: ${att.adic}` : '');
        sheet.getRange(dRow, 2).setValue(desc);
        sheet.getRange(dRow, 19).setValue(att.infr ? '-' + att.infr : '').setFontColor('#cc0000');
        sheet.getRange(dRow, 20).setValue(att.desc ? 'DESC' : _valOrBlank(pts)).setFontWeight('bold');
        sectionTotal += pts;
      });
    }
    if (equipo._controlRowMap && equipo._controlRowMap[suerte.suerteName]) {
      _writeScoreControl(sheet, equipo._controlRowMap[suerte.suerteName], gTotal, sectionTotal, gTotal + sectionTotal);
    }
    gTotal += sectionTotal;
  });
  sheet.getRange(equipo._totalRow, 20).setValue(gTotal);
}

function _writeCalaMalosGrid(sheet, labelRow, valueRow, att) {
  const grid = _buildCalaMalosGrid(att, 10);
  sheet.getRange(labelRow, 11, 1, 10)
    .setValues([grid.labels])
    .setFontColor('#cc0000')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  sheet.getRange(valueRow, 11, 1, 10)
    .setValues([grid.values])
    .setFontColor('#cc0000')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
}

function _buildCalaAdicGrid(att) {
  return {
    ld: _sumCalaAdic(att, ['cala_lado_derecho_velocidad', 'cala_lado_derecho_pivote']),
    li: _sumCalaAdic(att, ['cala_lado_izquierdo_velocidad', 'cala_lado_izquierdo_pivote']),
    md: _sumCalaAdic(att, ['cala_medio_derecho']),
    mi: _sumCalaAdic(att, ['cala_medio_izquierdo']),
    pc: _sumCalaAdic(att, ['cala_cambio_rectangulo_costado'])
  };
}

function _sumCalaAdic(att, ids) {
  const applied = att.applied || [];
  let used = false;
  const total = ids.reduce((sum, id) => {
    if (!applied.includes(id)) return sum;
    used = true;
    return sum + (CALA_ADIC_MAP[id] || 0);
  }, 0);

  if (used) return total;

  const itemTotal = (att.adicItems || []).reduce((sum, item) => {
    if (ids.indexOf(item.id) === -1) return sum;
    return sum + (Number(item.pts) || 0);
  }, 0);

  return itemTotal || '';
}

const CALA_ADIC_MAP = {
  cala_lado_derecho_velocidad: 2,
  cala_lado_derecho_pivote: 1,
  cala_lado_izquierdo_velocidad: 2,
  cala_lado_izquierdo_pivote: 1,
  cala_medio_derecho: 1,
  cala_medio_izquierdo: 1,
  cala_cambio_rectangulo_costado: 1
};

function _buildCalaMalosGrid(att, size) {
  const items = [];
  (att.infrItems || []).forEach(item => {
    items.push({
      label: item.abbr || _abbr(item.label),
      pts: Number(item.pts) || 0
    });
  });

  if (!items.length) {
    (att.applied || []).forEach(id => {
      const item = CALA_INFR_MAP[id];
      if (item) items.push(item);
    });
  }

  (att.customInfr || []).forEach(item => {
    items.push({
      label: _abbr(item.label),
      pts: Number(item.pts) || 0
    });
  });

  (att.teamPenalties || []).forEach(item => {
    items.push({
      label: 'EQ',
      pts: item.total === undefined || item.total === null ? Number(item.pts || 0) : Number(item.total || 0)
    });
  });

  if (!items.length && Number(att.infr || 0) > 0) {
    items.push({ label: 'M', pts: Number(att.infr) || 0 });
  }

  const labels = items.slice(0, size).map(item => item.label);
  const values = items.slice(0, size).map(item => item.pts ? '-' + item.pts : '');
  while (labels.length < size) labels.push('');
  while (values.length < size) values.push('');
  return { labels, values };
}

const CALA_INFR_MAP = {
  cala_inf_abrir_hocico: { label: 'AH', pts: 1 },
  cala_inf_rabear_espiguear: { label: 'RE', pts: 1 },
  cala_inf_enjetarse: { label: 'ENJ', pts: 1 },
  cala_inf_cachetear: { label: 'CAC', pts: 1 },
  cala_inf_estrellar_despapar_gorbetear: { label: 'EDG', pts: 1 },
  cala_inf_alborotarse: { label: 'ALB', pts: 1 },
  cala_inf_no_correr_recto: { label: 'NCR', pts: 1 },
  cala_inf_no_poner_en_mano: { label: 'NPM', pts: 1 },
  cala_inf_cambiar_mano: { label: 'CM', pts: 1 },
  cala_inf_patada_una_extremidad: { label: 'PAT', pts: 4 },
  cala_inf_lados_caminando: { label: 'LC', pts: 2 },
  cala_inf_espalda_fin_lado: { label: 'EFL', pts: 5 },
  cala_inf_medio_incompleto: { label: 'MI', pts: 1 },
  cala_inf_anticiparse: { label: 'ANT', pts: 5 },
  cala_inf_ceja_fuera_linea: { label: 'CFL', pts: 1 },
  cala_inf_disminuir_velocidad_lado: { label: 'DVL', pts: 4 },
  cala_inf_disminuir_velocidad_ceja: { label: 'DVC', pts: 4 },
  cala_inf_sangrado: { label: 'SAN', pts: 2 }
};

function _abbr(label) {
  const clean = String(label || '')
    .replace(/\([^)]*\)/g, '')
    .replace(/[-+]\d+/g, '')
    .trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (!words.length) return 'M';
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map(word => word[0]).join('').slice(0, 3).toUpperCase();
}

function _finishSheet(sheet) {
  const maxRows = sheet.getLastRow();
  sheet.getRange(1, 1, maxRows, 22).setFontFamily('Arial').setFontSize(9).setVerticalAlignment('middle');
  sheet.autoResizeRows(1, maxRows);
}

function _getScoreSheetName(data, equipo) {
  const charreada = data.charreada || {};
  const tournament = data.tournament || {};
  const charreadaName = charreada.name || tournament.name || 'Charreada';
  const baseName = _cleanSheetName(charreadaName + ' - ' + (equipo.name || 'Equipo'));
  const suffix = _shortId(charreada.id || data.charreadaId || '');
  return _fitSheetName(baseName, suffix);
}

function _fitSheetName(baseName, suffix) {
  const cleanBase = _cleanSheetName(baseName);
  if (!suffix) return cleanBase.substring(0, 100);
  const tag = ' [' + suffix + ']';
  return cleanBase.substring(0, 100 - tag.length) + tag;
}

function _shortId(value) {
  const clean = String(value || '').replace(/[^A-Za-z0-9]/g, '');
  return clean ? clean.slice(-6) : '';
}

function _cleanSheetName(name) {
  return String(name || 'Equipo').replace(/[\\/?*[\]:]/g, ' ').substring(0, 100).trim() || 'Equipo';
}

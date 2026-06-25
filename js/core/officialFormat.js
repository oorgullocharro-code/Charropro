import { SUERTES } from "../data/suertes.js?v=20260622-prepare-gate1";
import {
  calculateAttemptTotal,
  getAttemptTeamPenaltyTotal,
  getTeamCharreadaResta,
  getTeamCharreadaTotal,
  getTeamSuerteTotal
} from "./scoring.js?v=20260622-prepare-gate1";
import { getTeam, scoreKey, state } from "./state.js?v=20260622-prepare-gate1";
import { createXlsxBlob } from "./xlsx.js?v=20260622-prepare-gate1";

export const OFFICIAL_FORMAT_NAME = "HOJA-CALIFICACION-EQUIPO-CHARROS-2024-2028";

export function buildOfficialPackage(charreadaId = state.activeCharreadaId) {
  const charreada = state.charreadas.find((item) => item.id === charreadaId);
  if (!charreada) {
    return {
      format: OFFICIAL_FORMAT_NAME,
      generatedAt: new Date().toISOString(),
      sheets: []
    };
  }

  const tournament = state.tournaments.find((item) => item.id === charreada.tournamentId) || null;
  const sheets = charreada.teamIds
    .map((teamId) => getTeam(teamId))
    .filter(Boolean)
    .map((team) => buildOfficialTeamSheet({ tournament, charreada, team }));

  return {
    format: OFFICIAL_FORMAT_NAME,
    generatedAt: new Date().toISOString(),
    tournament: tournament
      ? {
          id: tournament.id,
          name: tournament.name,
          date: tournament.date,
          venue: tournament.venue
        }
      : null,
    charreada: {
      id: charreada.id,
      name: charreada.name,
      date: charreada.date,
      startTime: charreada.startTime,
      status: charreada.status
    },
    sheets
  };
}

export function buildOfficialTeamSheet({ tournament, charreada, team }) {
  const totalMalos = getTotalMalos(charreada.id, team.id);
  const puntuacionFinal = getTeamCharreadaTotal(charreada.id, team.id);
  const header = {
    evento: tournament?.name || "",
    hora: charreada.startTime || "",
    equipo: team.name || "",
    fecha: charreada.date || tournament?.date || "",
    capitan: team.captain || "",
    lugar: tournament?.venue || ""
  };

  const rows = [
    ["FEDERACION MEXICANA DE CHARRERIA, A.C."],
    ["FORMATO", OFFICIAL_FORMAT_NAME],
    ["EVENTO", header.evento, "HORA", header.hora],
    ["EQUIPO", header.equipo, "FECHA", header.fecha],
    ["CAPITAN", header.capitan, "LUGAR", header.lugar],
    [],
    ...buildCalaRows(charreada, team),
    [],
    ...buildPialesRows(charreada, team),
    [],
    ...buildColeaderoRows(charreada, team),
    [],
    ...buildJineteoRows(charreada, team, "toro", "JINETEO DE TORO"),
    [],
    ...buildTernaRows(charreada, team),
    [],
    ...buildJineteoRows(charreada, team, "yegua", "JINETEO DE YEGUA"),
    [],
    ...buildThreeShotRows(charreada, team, "manganas_pie", "MANGANAS A PIE"),
    [],
    ...buildThreeShotRows(charreada, team, "manganas_caballo", "MANGANAS A CABALLO"),
    [],
    ...buildPasoRows(charreada, team),
    [],
    ["TOTAL, PUNTOS MALOS", totalMalos],
    ["PUNTUACION FINAL", puntuacionFinal],
    [],
    ["JUEZ", "", "JUEZ", "", "JUEZ", "", "CAPITAN", header.capitan]
  ];
  const visual = buildOfficialVisualLayout({ charreada, team, header, totalMalos, puntuacionFinal });

  return {
    sheetName: safeSheetName(team.name),
    teamId: team.id,
    teamName: team.name,
    header,
    totalMalos,
    puntuacionFinal,
    rows,
    visualRows: visual.rows,
    visualMerges: visual.merges,
    visualWidths: visual.widths,
    visualRowHeights: visual.rowHeights
  };
}

export function downloadOfficialFormatXlsx(charreadaId = state.activeCharreadaId) {
  const official = buildOfficialPackage(charreadaId);
  const blob = createXlsxBlob({
    sheets: official.sheets.map((sheet) => ({
      name: sheet.sheetName,
      rows: sheet.visualRows || sheet.rows,
      merges: sheet.visualMerges,
      widths: sheet.visualWidths,
      rowHeights: sheet.visualRowHeights
    }))
  });

  const filename = `${slug(official.charreada?.name || "charreada")}-formato-federacion.xlsx`;
  downloadBlob(filename, blob);
}

export const downloadOfficialFormatCsv = downloadOfficialFormatXlsx;

function buildOfficialVisualLayout({ charreada, team, header, totalMalos, puntuacionFinal }) {
  const rows = [];
  const merges = [];
  const rowHeights = [];
  const widths = [5, 22, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 16];
  const columnCount = widths.length;
  const row = (...cells) => pad(cells, columnCount);
  const add = (cells, height = 21) => {
    rows.push(row(...cells));
    rowHeights.push(height);
    return rows.length;
  };
  const addBlank = (height = 8) => add([], height);
  const addSection = (title, sectionRows) => {
    const start = rows.length + 1;
    sectionRows.forEach((sectionRow, index) => {
      add([index === 0 ? C(title, "verticalSection") : "", ...sectionRow], index === 0 ? 27 : 23);
    });
    const end = rows.length;
    if (end > start) merges.push(`A${start}:A${end}`);
  };
  let runningTotal = 0;
  const addScoreControl = (title, suerteTotal) => {
    const previous = runningTotal;
    const sectionTotal = Number(suerteTotal) || 0;
    runningTotal += sectionTotal;
    add([
      "", "", "", "", "", "", "", "", "", "", "", "",
      C(`${title} ACUMULADO`, "whiteHeader"),
      C("ANTERIOR", "subheader"),
      C(previous, "highlight"),
      C("SUERTE", "subheader"),
      C(sectionTotal, "highlight"),
      C("TOTAL", "subheader"),
      C(runningTotal, "highlight")
    ], 24);
  };

  const cala = getAttempt(charreada.id, team.id, "cala", 0);
  const piales = getAttempts(charreada.id, team.id, "piales");
  const colas = getCollection(charreada.id, team.id, "colas") || [];
  const toro = getAttempt(charreada.id, team.id, "toro", 0);
  const lazo = getAttempts(charreada.id, team.id, "lazo");
  const pialRuedo = getAttempts(charreada.id, team.id, "pial_ruedo");
  const yegua = getAttempt(charreada.id, team.id, "yegua", 0);
  const manganasPie = getAttempts(charreada.id, team.id, "manganas_pie");
  const manganasCaballo = getAttempts(charreada.id, team.id, "manganas_caballo");
  const paso = getAttempt(charreada.id, team.id, "paso", 0);
  const ternaRoster = getTernaRosterParts(team.roster);
  const calaAdic = buildCalaAdicGrid(cala);
  const calaMalos = buildInfrGrid(cala, getSuerte("cala"), 10);

  add([C("FEDERACION MEXICANA DE CHARRERIA, A.C.", "greenTitle")], 30);
  merges.push("A1:X1");
  add(["EVENTO:", header.evento, "", "HORA:", header.hora, "", "EQUIPO:", header.equipo, "", "FECHA:", header.fecha], 23);
  add(["CAPITAN:", header.capitan, "", "LUGAR:", header.lugar], 23);
  addBlank();

  addSection("CALA DE CABALLO", [
    [
      C("CHARRO", "header"), C("BASE", "header"), C("P", "header"), C("T", "header"), C("LD", "header"),
      C("LI", "header"), C("MD", "header"), C("MI", "header"), C("CR", "header"), C("TOTAL", "header"),
      ...Array.from({ length: 10 }, (_, index) => C(index === 0 ? "MALOS" : "", "redHeader")),
      C("TOTAL MALOS", "header"), C("PUNTOS PARCIALES", "header"), C("DETALLE", "header")
    ],
    [
      team.roster?.cala || "", cala.base || 0, cala.puntaPts || 0, cala.puntaPiquetes || 1,
      calaAdic.ld, calaAdic.li, calaAdic.md, calaAdic.mi, calaAdic.cr, goodPoints(cala),
      ...calaMalos.labels.map((label) => C(label, "redHeader")), "", "", ""
    ],
    [
      "", "", "", "", "", "", "", "", "", "",
      ...calaMalos.values.map((value) => C(value, "red")),
      cala.infr || 0, calculateAttemptTotal(cala), describeAttempt(cala, getSuerte("cala"))
    ],
    [C("SUPLENTE", "whiteHeader"), team.roster?.suplenteCala || ""],
    [C("INFRACCION AL EQUIPO", "whiteHeader"), getTeamLevelPenalty(charreada.id, team.id, "cala")]
  ]);
  addScoreControl("CALA", getTeamSuerteTotal(charreada.id, team.id, "cala"));
  addBlank();

  addSection("PIALES EN EL LIENZO", [
    [
      C("CHARRO", "header"), C("1er TIRO BUENO", "header"), C("MALOS", "redHeader"), C("TOTAL", "header"),
      C("2do TIRO BUENO", "header"), C("MALOS", "redHeader"), C("TOTAL", "header"),
      C("3er TIRO BUENO", "header"), C("MALOS", "redHeader"), C("TOTAL", "header"), C("TOTAL", "header"), C("DETALLE", "header")
    ],
    [
      team.roster?.piales || "",
      ...attemptTriplet(piales[0]), ...attemptTriplet(piales[1]), ...attemptTriplet(piales[2]),
      getTeamSuerteTotal(charreada.id, team.id, "piales"),
      piales.map((attempt, index) => `T${index + 1}: ${describeAttempt(attempt, getSuerte("piales"))}`).join(" | ")
    ],
    [C("SUPLENTE", "whiteHeader"), team.roster?.suplentePiales || ""],
    [C("INFRACCION AL EQUIPO", "whiteHeader"), getTeamLevelPenalty(charreada.id, team.id, "piales")]
  ]);
  addScoreControl("PIALES", getTeamSuerteTotal(charreada.id, team.id, "piales"));
  addBlank();

  addSection("COLEADERO", [
    [
      C("COLEADOR", "header"), C("1a PASADA BUENOS", "header"), C("MALOS", "redHeader"), C("TOTAL", "header"),
      C("2a PASADA BUENOS", "header"), C("MALOS", "redHeader"), C("TOTAL", "header"),
      C("3a PASADA BUENOS", "header"), C("MALOS", "redHeader"), C("TOTAL", "header"), C("TOTAL", "header"), C("DETALLE", "header")
    ],
    ...[0, 1, 2].map((index) => {
      const attempts = colas[index] || [];
      return [
        team.roster?.colas?.[index] || `Coleador ${index + 1}`,
        ...attemptTriplet(attempts[0]), ...attemptTriplet(attempts[1]), ...attemptTriplet(attempts[2]),
        attempts.reduce((sum, attempt) => sum + calculateAttemptTotal(attempt), 0),
        attempts.map((attempt, attemptIndex) => `P${attemptIndex + 1}: ${describeAttempt(attempt, getSuerte("colas"))}`).join(" | ")
      ];
    }),
    [C("SUPLENTE", "whiteHeader"), team.roster?.suplenteColas || ""],
    [C("INFRACCION AL EQUIPO", "whiteHeader"), getTeamLevelPenalty(charreada.id, team.id, "colas")]
  ]);
  addScoreControl("COLEADERO", getTeamSuerteTotal(charreada.id, team.id, "colas"));
  addBlank();

  addSection("JINETEO DE TORO", buildJineteoVisualRows(team.roster?.toro || "", toro, getSuerte("toro"), "BAJARSE SIN SER LAZADO", getTeamLevelPenalty(charreada.id, team.id, "toro")));
  addScoreControl("JINETEO TORO", getTeamSuerteTotal(charreada.id, team.id, "toro"));
  addBlank();

  addSection("TERNA EN EL RUEDO", [
    [C("OPORT.", "header"), C("SUERTE", "header"), C("CHARRO", "header"), C("BASE/ADICIONALES", "header"), C("REMATE", "header"), C("MALOS", "redHeader"), C("T", "header"), C("TOTAL", "header"), C("DETALLE", "header")],
    ...[
      ...lazo.map((attempt, index) => [index + 1, "LAZO A LA CABEZA", ternaRoster[0], goodPoints(attempt), appliedPoints(attempt, getSuerte("lazo"), ["Remate"]), attempt.infr || 0, attempt.tiempo || "", calculateAttemptTotal(attempt), describeAttempt(attempt, getSuerte("lazo"))]),
      ...pialRuedo.map((attempt, index) => [index + 1, "PIAL EN EL RUEDO", ternaRoster[1], goodPoints(attempt), appliedPoints(attempt, getSuerte("pial_ruedo"), ["Remate"]), attempt.infr || 0, attempt.tiempo || "", calculateAttemptTotal(attempt), describeAttempt(attempt, getSuerte("pial_ruedo"))]),
      ["", "TERCER PARTICIPANTE", ternaRoster[2] || "", "", "", "", "", "", ""]
    ],
    [C("TERMINADO EN", "whiteHeader"), "", C("MIN.", "whiteHeader"), "", "", "", "", getTeamSuerteTotal(charreada.id, team.id, "lazo") + getTeamSuerteTotal(charreada.id, team.id, "pial_ruedo")],
    [C("INFRACCION AL EQUIPO", "whiteHeader"), getTernaTeamLevelPenalty(charreada.id, team.id)]
  ]);
  addScoreControl("TERNA", getTeamSuerteTotal(charreada.id, team.id, "lazo") + getTeamSuerteTotal(charreada.id, team.id, "pial_ruedo"));
  addBlank();

  addSection("JINETEO DE YEGUA", buildJineteoVisualRows(team.roster?.yegua || "", yegua, getSuerte("yegua"), "BAJAR OREJA C/P", getTeamLevelPenalty(charreada.id, team.id, "yegua")));
  addScoreControl("JINETEO YEGUA", getTeamSuerteTotal(charreada.id, team.id, "yegua"));
  addBlank();

  addSection("MANGANAS A PIE", buildManganasVisualRows(team.roster?.manganas_pie || "", manganasPie, "manganas_pie", getTeamLevelPenalty(charreada.id, team.id, "manganas_pie")));
  addScoreControl("MANGANAS PIE", getTeamSuerteTotal(charreada.id, team.id, "manganas_pie"));
  addBlank();

  addSection("MANGANAS A CABALLO", buildManganasVisualRows(team.roster?.manganas_caballo || "", manganasCaballo, "manganas_caballo", getTeamLevelPenalty(charreada.id, team.id, "manganas_caballo")));
  addScoreControl("MANGANAS CABALLO", getTeamSuerteTotal(charreada.id, team.id, "manganas_caballo"));
  addBlank();

  addSection("PASO DE LA MUERTE", [
    [C("CHARRO", "header"), C("1ra VUELTA BASE", "header"), C("2da VUELTA BASE", "header"), C("DISTANCIA", "header"), C("CUARTA", "header"), C("REPAROS", "header"), C("OREJA C/P", "header"), C("MALOS", "redHeader"), C("TOTAL", "header"), C("DETALLE", "header")],
    [team.roster?.paso || "", appliedPoints(paso, getSuerte("paso"), ["1ra"]), appliedPoints(paso, getSuerte("paso"), ["2da"]), appliedPoints(paso, getSuerte("paso"), ["Distancia"]), appliedPoints(paso, getSuerte("paso"), ["Cuarta"]), appliedPoints(paso, getSuerte("paso"), ["Reparos"]), appliedPoints(paso, getSuerte("paso"), ["Oreja"]), paso.infr || 0, calculateAttemptTotal(paso), describeAttempt(paso, getSuerte("paso"))],
    [C("SUPLENTE", "whiteHeader"), team.roster?.suplentePaso || ""],
    [C("TIEMPO EN SALIR", "whiteHeader"), paso.tiempo || "", C("MIN.", "whiteHeader"), "", C("INFRACCION AL EQUIPO", "whiteHeader"), getTeamLevelPenalty(charreada.id, team.id, "paso")]
  ]);
  addScoreControl("PASO", getTeamSuerteTotal(charreada.id, team.id, "paso"));
  addBlank();

  add([
    C("TOTAL, PUNTOS MALOS", "red"), totalMalos, "", "", "", "", "", "", "", "", "", "",
    C("PUNTUACION FINAL", "subheader"), C(puntuacionFinal, "number")
  ], 28);
  addBlank(12);
  add([C("JUEZ", "signature"), "", "", C("JUEZ", "signature"), "", "", C("JUEZ", "signature"), "", "", C("CAPITAN", "signature"), header.capitan], 30);

  return { rows, merges, widths, rowHeights };
}

function buildJineteoVisualRows(charro, attempt, suerte, bajarLabel, teamPenalty = 0) {
  return [
    [C("CHARRO", "header"), C("BASE", "header"), C("PRETAL DE GASA", "header"), C("1 MANO", "header"), C("PIERNAS", "header"), C("TENTEMOSO", "header"), C("VERIJERO", "header"), C("PRETAL", "header"), C("CAERSE Y LEV.", "header"), C(bajarLabel, "header"), C("TOTAL", "header"), C("MALOS", "redHeader"), C("T", "header"), C("TOTAL FINAL", "header"), C("DETALLE", "header")],
    [charro, attempt.base || 0, appliedPoints(attempt, suerte, ["Gasa"]), appliedPoints(attempt, suerte, ["1 Mano"]), appliedPoints(attempt, suerte, ["Piernas"]), appliedPoints(attempt, suerte, ["Tentemozo"]), appliedPoints(attempt, suerte, ["Verijero"]), appliedPoints(attempt, suerte, ["Pretal"]), appliedPoints(attempt, suerte, ["Caer"]), appliedPoints(attempt, suerte, ["Bajar"]), goodPoints(attempt), attempt.infr || 0, attempt.tiempo || "", calculateAttemptTotal(attempt), describeAttempt(attempt, suerte)],
    [C("SUPLENTE", "whiteHeader"), ""],
    [C("INFRACCION AL EQUIPO", "whiteHeader"), teamPenalty]
  ];
}

function buildManganasVisualRows(charro, attempts, suerteId, teamPenalty = 0) {
  const suerte = getSuerte(suerteId);
  return [
    [C("CHARRO", "header"), C("1er TIRO BUENOS", "header"), C("MALOS", "redHeader"), C("TOTAL", "header"), C("2do TIRO BUENOS", "header"), C("MALOS", "redHeader"), C("TOTAL", "header"), C("3er TIRO BUENOS", "header"), C("MALOS", "redHeader"), C("TOTAL", "header"), C("T", "header"), C("TOTAL", "header"), C("DETALLE", "header")],
    [charro, ...attemptTriplet(attempts[0]), ...attemptTriplet(attempts[1]), ...attemptTriplet(attempts[2]), attempts.map((attempt) => attempt?.tiempo).filter(Boolean).join(" | "), attempts.reduce((sum, attempt) => sum + calculateAttemptTotal(attempt), 0), attempts.map((attempt, index) => `T${index + 1}: ${describeAttempt(attempt, suerte)}`).join(" | ")],
    [C("SUPLENTE", "whiteHeader"), ""],
    [C("TERMINADO EN", "whiteHeader"), "", C("MIN.", "whiteHeader"), "", C("INFRACCION AL EQUIPO", "whiteHeader"), teamPenalty]
  ];
}

function C(value, style) {
  return { value, style };
}

function pad(cells, length) {
  const output = cells.flat();
  while (output.length < length) output.push("");
  return output.slice(0, length);
}

function buildCalaRows(charreada, team) {
  const suerte = getSuerte("cala");
  const attempt = getAttempt(charreada.id, team.id, "cala", 0);
  const teamPenalty = getTeamLevelPenalty(charreada.id, team.id, "cala");

  return [
    [
      "CALA DE CABALLO",
      "BASE",
      "PUNTA",
      "METROS",
      "TIEMPOS",
      "ADICIONALES",
      "MALOS",
      "TOTAL MALOS",
      "PUNTOS PARCIALES",
      "DETALLE"
    ],
    [
      team.roster?.cala || "",
      attempt.base || 0,
      attempt.puntaPts || 0,
      attempt.puntaMetros || 0,
      attempt.puntaPiquetes || 1,
      attempt.adic || 0,
      attempt.infr || 0,
      attempt.infr || 0,
      calculateAttemptTotal(attempt),
      describeAttempt(attempt, suerte)
    ],
    ["SUPLENTE", team.roster?.suplenteCala || ""],
    ["INFRACCION AL EQUIPO", teamPenalty]
  ];
}

function buildPialesRows(charreada, team) {
  const suerte = getSuerte("piales");
  const attempts = getAttempts(charreada.id, team.id, "piales");
  return [
    [
      "PIALES EN EL LIENZO",
      "1er TIRO BUENO",
      "1er TIRO MALOS",
      "1er TIRO TOTAL",
      "2do TIRO BUENO",
      "2do TIRO MALOS",
      "2do TIRO TOTAL",
      "3er TIRO BUENO",
      "3er TIRO MALOS",
      "3er TIRO TOTAL",
      "TOTAL",
      "DETALLE"
    ],
    [
      team.roster?.piales || "",
      ...attemptTriplet(attempts[0]),
      ...attemptTriplet(attempts[1]),
      ...attemptTriplet(attempts[2]),
      getTeamSuerteTotal(charreada.id, team.id, "piales"),
      attempts.map((attempt, index) => `T${index + 1}: ${describeAttempt(attempt, suerte)}`).join(" | ")
    ],
    ["SUPLENTE", team.roster?.suplentePiales || ""],
    ["INFRACCION AL EQUIPO", getTeamLevelPenalty(charreada.id, team.id, "piales")]
  ];
}

function buildColeaderoRows(charreada, team) {
  const suerte = getSuerte("colas");
  const collection = getCollection(charreada.id, team.id, "colas") || [];
  const rows = [
    [
      "COLEADERO",
      "COLEADOR",
      "1a PASADA BUENOS",
      "1a PASADA MALOS",
      "1a PASADA TOTAL",
      "2a PASADA BUENOS",
      "2a PASADA MALOS",
      "2a PASADA TOTAL",
      "3a PASADA BUENOS",
      "3a PASADA MALOS",
      "3a PASADA TOTAL",
      "TOTAL",
      "DETALLE"
    ]
  ];

  for (let index = 0; index < 3; index += 1) {
    const attempts = collection[index] || [];
    rows.push([
      "",
      team.roster?.colas?.[index] || `Coleador ${index + 1}`,
      ...attemptTriplet(attempts[0]),
      ...attemptTriplet(attempts[1]),
      ...attemptTriplet(attempts[2]),
      attempts.reduce((sum, attempt) => sum + calculateAttemptTotal(attempt), 0),
      attempts.map((attempt, attemptIndex) => `P${attemptIndex + 1}: ${describeAttempt(attempt, suerte)}`).join(" | ")
    ]);
  }

  rows.push(["SUPLENTE", team.roster?.suplenteColas || ""]);
  rows.push(["INFRACCION AL EQUIPO", getTeamLevelPenalty(charreada.id, team.id, "colas")]);
  return rows;
}

function buildJineteoRows(charreada, team, suerteId, title) {
  const suerte = getSuerte(suerteId);
  const attempt = getAttempt(charreada.id, team.id, suerteId, 0);
  return [
    [
      title,
      "BASE",
      "PRETAL DE GASA",
      "1 MANO",
      "PIERNAS",
      "TENTEMOSO",
      "VERIJERO",
      "PRETAL",
      "CAERSE Y LEVANTARSE",
      suerteId === "toro" ? "BAJARSE SIN SER LAZADO" : "BAJAR OREJA C/PIERN",
      "TOTAL",
      "MALOS",
      "T",
      "TOTAL FINAL",
      "DETALLE"
    ],
    [
      team.roster?.[suerteId] || "",
      attempt.base || 0,
      appliedPoints(attempt, suerte, ["Gasa"]),
      appliedPoints(attempt, suerte, ["1 Mano"]),
      appliedPoints(attempt, suerte, ["Piernas"]),
      appliedPoints(attempt, suerte, ["Tentemozo"]),
      appliedPoints(attempt, suerte, ["Verijero"]),
      appliedPoints(attempt, suerte, ["Pretal"]),
      appliedPoints(attempt, suerte, ["Caer"]),
      appliedPoints(attempt, suerte, suerteId === "toro" ? ["Bajar sin lazo"] : ["Bajar Oreja"]),
      goodPoints(attempt),
      attempt.infr || 0,
      attempt.tiempo || "",
      calculateAttemptTotal(attempt),
      describeAttempt(attempt, suerte)
    ],
    ["SUPLENTE", team.roster?.[`suplente_${suerteId}`] || ""],
    ["INFRACCION AL EQUIPO", getTeamLevelPenalty(charreada.id, team.id, suerteId)]
  ];
}

function buildTernaRows(charreada, team) {
  const lazo = getSuerte("lazo");
  const pial = getSuerte("pial_ruedo");
  const lazoAttempts = getAttempts(charreada.id, team.id, "lazo");
  const pialAttempts = getAttempts(charreada.id, team.id, "pial_ruedo");
  const ternaRoster = getTernaRosterParts(team.roster);

  const rows = [
    [
      "TERNA EN EL RUEDO",
      "OPORTUNIDAD",
      "SUERTE",
      "CHARRO",
      "BASE/ADICIONALES",
      "REMATE",
      "MALOS",
      "T",
      "TOTAL",
      "DETALLE"
    ]
  ];

  lazoAttempts.forEach((attempt, index) => {
    rows.push([
      "",
      index + 1,
      "LAZO A LA CABEZA",
      ternaRoster[0],
      goodPoints(attempt),
      appliedPoints(attempt, lazo, ["Remate"]),
      attempt.infr || 0,
      attempt.tiempo || "",
      calculateAttemptTotal(attempt),
      describeAttempt(attempt, lazo)
    ]);
  });

  pialAttempts.forEach((attempt, index) => {
    rows.push([
      "",
      index + 1,
      "PIAL EN EL RUEDO",
      ternaRoster[1],
      goodPoints(attempt),
      appliedPoints(attempt, pial, ["Remate"]),
      attempt.infr || 0,
      attempt.tiempo || "",
      calculateAttemptTotal(attempt),
      describeAttempt(attempt, pial)
    ]);
  });

  rows.push(["", "", "TERCER PARTICIPANTE", ternaRoster[2] || "", "", "", "", "", "", ""]);
  rows.push(["TOTAL TERNA", "", "", "", "", "", "", "", getTeamSuerteTotal(charreada.id, team.id, "lazo") + getTeamSuerteTotal(charreada.id, team.id, "pial_ruedo")]);
  rows.push(["INFRACCION AL EQUIPO", getTernaTeamLevelPenalty(charreada.id, team.id)]);
  return rows;
}

function buildThreeShotRows(charreada, team, suerteId, title) {
  const suerte = getSuerte(suerteId);
  const attempts = getAttempts(charreada.id, team.id, suerteId);
  return [
    [
      title,
      "1er TIRO BUENOS",
      "1er TIRO MALOS",
      "1er TIRO TOTAL",
      "2do TIRO BUENOS",
      "2do TIRO MALOS",
      "2do TIRO TOTAL",
      "3er TIRO BUENOS",
      "3er TIRO MALOS",
      "3er TIRO TOTAL",
      "T",
      "TOTAL",
      "DETALLE"
    ],
    [
      team.roster?.[suerteId] || "",
      ...attemptTriplet(attempts[0]),
      ...attemptTriplet(attempts[1]),
      ...attemptTriplet(attempts[2]),
      attempts.map((attempt) => attempt?.tiempo).filter(Boolean).join(" | "),
      getTeamSuerteTotal(charreada.id, team.id, suerteId),
      attempts.map((attempt, index) => `T${index + 1}: ${describeAttempt(attempt, suerte)}`).join(" | ")
    ],
    ["SUPLENTE", team.roster?.[`suplente_${suerteId}`] || ""],
    ["INFRACCION AL EQUIPO", getTeamLevelPenalty(charreada.id, team.id, suerteId)]
  ];
}

function buildPasoRows(charreada, team) {
  const suerte = getSuerte("paso");
  const attempt = getAttempt(charreada.id, team.id, "paso", 0);
  return [
    [
      "PASO DE LA MUERTE",
      "1ra VUELTA BASE",
      "2da VUELTA BASE",
      "DISTANCIA",
      "CUARTA",
      "REPAROS",
      "OREJA C/P",
      "MALOS",
      "TOTAL",
      "DETALLE"
    ],
    [
      team.roster?.paso || "",
      appliedPoints(attempt, suerte, ["1ra"]),
      appliedPoints(attempt, suerte, ["2da"]),
      appliedPoints(attempt, suerte, ["Distancia"]),
      appliedPoints(attempt, suerte, ["Cuarta"]),
      appliedPoints(attempt, suerte, ["Reparos"]),
      appliedPoints(attempt, suerte, ["Oreja"]),
      attempt.infr || 0,
      calculateAttemptTotal(attempt),
      describeAttempt(attempt, suerte)
    ],
    ["SUPLENTE", team.roster?.suplentePaso || ""],
    ["TIEMPO EN SALIR", attempt.tiempo || ""],
    ["INFRACCION AL EQUIPO", getTeamLevelPenalty(charreada.id, team.id, "paso")]
  ];
}

function getSuerte(id) {
  return SUERTES.find((suerte) => suerte.id === id);
}

function getCollection(charreadaId, teamId, suerteId) {
  return state.scores[scoreKey(charreadaId, teamId, suerteId)];
}

function getAttempts(charreadaId, teamId, suerteId) {
  const collection = getCollection(charreadaId, teamId, suerteId);
  return Array.isArray(collection) ? collection : [];
}

function getAttempt(charreadaId, teamId, suerteId, attemptIndex) {
  const collection = getCollection(charreadaId, teamId, suerteId);
  return collection?.[attemptIndex] || {};
}

function attemptTriplet(attempt = {}) {
  return [goodPoints(attempt), attempt.infr || 0, calculateAttemptTotal(attempt)];
}

function goodPoints(attempt = {}) {
  if (attempt.desc) return 0;
  return (Number(attempt.base) || 0) + (Number(attempt.adic) || 0) + (Number(attempt.puntaPts) || 0);
}

function getTotalMalos(charreadaId, teamId) {
  const attemptMalos = SUERTES.reduce((sum, suerte) => {
    const collection = getCollection(charreadaId, teamId, suerte.id);
    if (!collection) return sum;
    const attempts = suerte.type === "coleadero" ? collection.flat() : collection;
    return sum + attempts.reduce((subtotal, attempt) =>
      subtotal + (Number(attempt.infr) || 0) + getAttemptTeamPenaltyTotal(attempt), 0);
  }, 0);
  const resta = getTeamCharreadaResta(charreadaId, teamId);
  return attemptMalos + (resta < 0 ? Math.abs(resta) : 0);
}

function getTeamLevelPenalty(charreadaId, teamId, suerteId) {
  const collection = getCollection(charreadaId, teamId, suerteId);
  if (!collection) return 0;
  const attempts = Array.isArray(collection[0]) ? collection.flat() : collection;
  return attempts.reduce((sum, attempt) => sum + getAttemptTeamPenaltyTotal(attempt), 0);
}

function getTernaTeamLevelPenalty(charreadaId, teamId) {
  return getTeamLevelPenalty(charreadaId, teamId, "lazo") + getTeamLevelPenalty(charreadaId, teamId, "pial_ruedo");
}

function getTernaRosterParts(roster = {}) {
  const terna = Array.isArray(roster.terna) ? roster.terna : [];
  return [
    terna[0] || roster.lazo || "",
    terna[1] || roster.pial_ruedo || "",
    terna[2] || roster.terna_auxiliar || ""
  ];
}

function buildCalaAdicGrid(attempt = {}) {
  return {
    ld: sumAppliedRules(attempt, ["cala_lado_derecho_velocidad", "cala_lado_derecho_pivote"]),
    li: sumAppliedRules(attempt, ["cala_lado_izquierdo_velocidad", "cala_lado_izquierdo_pivote"]),
    md: sumAppliedRules(attempt, ["cala_medio_derecho"]),
    mi: sumAppliedRules(attempt, ["cala_medio_izquierdo"]),
    cr: sumAppliedRules(attempt, ["cala_cambio_rectangulo_costado"])
  };
}

function sumAppliedRules(attempt = {}, ids = []) {
  const applied = attempt.applied || [];
  const suerte = getSuerte("cala");
  const catalog = [
    ...(suerte?.catalog?.base || []),
    ...(suerte?.catalog?.adic || []),
    ...(suerte?.catalog?.infr || [])
  ];

  let used = false;
  const total = ids.reduce((sum, id) => {
    if (!applied.includes(id)) return sum;
    used = true;
    const rule = catalog.find((item) => item.id === id);
    return sum + (Number(rule?.pts) || 0);
  }, 0);
  return used ? total : "";
}

function buildInfrGrid(attempt = {}, suerte, size = 10) {
  const catalogInfr = suerte?.catalog?.infr || [];
  const items = [];

  (attempt.applied || []).forEach((id) => {
    const rule = catalogInfr.find((item) => item.id === id);
    if (rule) {
      items.push({
        label: abbreviateRule(rule),
        pts: rule.pts
      });
    }
  });

  (attempt.customInfr || []).forEach((item) => {
    items.push({
      label: abbreviateCustom(item.label),
      pts: Number(item.pts) || 0
    });
  });

  if (!items.length && Number(attempt.infr || 0) > 0) {
    items.push({ label: "M", pts: Number(attempt.infr) || 0 });
  }

  const labels = items.slice(0, size).map((item) => item.label);
  const values = items.slice(0, size).map((item) => item.pts ? `-${item.pts}` : "");

  while (labels.length < size) labels.push("");
  while (values.length < size) values.push("");

  return { labels, values };
}

const RULE_ABBREVIATIONS = {
  cala_inf_abrir_hocico: "AH",
  cala_inf_rabear_espiguear: "RE",
  cala_inf_enjetarse: "ENJ",
  cala_inf_cachetear: "CAC",
  cala_inf_estrellar_despapar_gorbetear: "EDG",
  cala_inf_alborotarse: "ALB",
  cala_inf_no_correr_recto: "NCR",
  cala_inf_no_poner_en_mano: "NPM",
  cala_inf_cambiar_mano: "CM",
  cala_inf_patada_una_extremidad: "PAT",
  cala_inf_lados_caminando: "LC",
  cala_inf_espalda_fin_lado: "EFL",
  cala_inf_medio_incompleto: "MI",
  cala_inf_anticiparse: "ANT",
  cala_inf_ceja_fuera_linea: "CFL",
  cala_inf_disminuir_velocidad_lado: "DVL",
  cala_inf_disminuir_velocidad_ceja: "DVC",
  cala_inf_sangrado: "SAN"
};

function abbreviateRule(rule) {
  if (RULE_ABBREVIATIONS[rule.id]) return RULE_ABBREVIATIONS[rule.id];
  return abbreviateCustom(rule.label);
}

function abbreviateCustom(label = "") {
  const clean = String(label)
    .replace(/\([^)]*\)/g, "")
    .replace(/[-+]\d+/g, "")
    .trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (!words.length) return "M";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((word) => word[0]).join("").slice(0, 3).toUpperCase();
}

function describeAttempt(attempt = {}, suerte) {
  const labels = [];
  const catalogItems = [
    ...(suerte?.catalog?.base || []),
    ...(suerte?.catalog?.adic || []),
    ...(suerte?.catalog?.infr || [])
  ];

  (attempt.applied || []).forEach((id) => {
    const rule = catalogItems.find((item) => item.id === id);
    if (rule) labels.push(rule.label);
  });

  (attempt.customAdic || []).forEach((item) => labels.push(`+${item.pts} ${item.label}`));
  (attempt.customInfr || []).forEach((item) => labels.push(`-${item.pts} ${item.label}`));
  if (attempt.desc) labels.push(`DESC: ${attempt.desc}`);
  if (attempt.note) labels.push(`NOTA: ${attempt.note}`);

  return labels.join("; ");
}

function appliedPoints(attempt = {}, suerte, labelNeedles = []) {
  const needles = labelNeedles.map((needle) => needle.toLowerCase());
  const catalogItems = [
    ...(suerte?.catalog?.base || []),
    ...(suerte?.catalog?.adic || [])
  ];

  return (attempt.applied || []).reduce((sum, id) => {
    const rule = catalogItems.find((item) => item.id === id);
    if (!rule) return sum;
    const label = rule.label.toLowerCase();
    const matches = needles.some((needle) => label.includes(needle));
    return matches ? sum + rule.pts : sum;
  }, 0);
}

function safeSheetName(name) {
  return String(name || "Equipo")
    .replace(/[\\/?*[\]:]/g, " ")
    .slice(0, 31)
    .trim() || "Equipo";
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function slug(value) {
  return String(value || "charreada")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

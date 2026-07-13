import assert from "node:assert/strict";
import {
  BROADCAST_DATA_CONTRACT_VERSION,
  buildBroadcastDataContract,
  getBroadcastContractWarnings,
  getBroadcastField,
  hasBroadcastField,
  listAvailableBroadcastFields,
  sanitizeBroadcastDataContract,
  validateBroadcastDataContract
} from "../js/broadcast/dataContract.js";

const NOW = "2026-07-12T18:00:00.000Z";

function build(source, options = {}) {
  return buildBroadcastDataContract(source, {
    generatedAt: NOW,
    now: NOW,
    visibility: "production",
    ...options
  });
}

const teamSource = {
  tournament: {
    id: "torneo_1",
    name: "Torneo de prueba",
    type: "completo",
    venue: "Lienzo Charro"
  },
  organization: {
    id: "org_1",
    name: "Orgullo Charro",
    tenantId: "tenant_1"
  },
  competition: {
    id: "equipos_completo",
    type: "equipos_completo",
    name: "Competencia por equipos",
    scope: "team",
    category: "AAA",
    phase: "Fase 1",
    suerteIds: ["cala", "piales", "colas", "toro", "terna", "yegua", "manganas_pie", "manganas_caballo", "paso"]
  },
  charreada: {
    id: "charreada_1",
    name: "Charreada 1",
    status: "en_vivo",
    date: "2026-07-12",
    startTime: "12:00",
    active: true
  },
  participant: {
    name: "José González",
    scope: "team",
    category: "AAA"
  },
  team: {
    id: "equipo_1",
    name: "Rancho El Ejemplo",
    association: "Asociación Centro",
    total: 0
  },
  suerte: {
    id: "cala",
    name: "Cala de Caballo",
    order: 1,
    active: true
  },
  score: {
    scoreId: "score_1",
    basePoints: 0,
    additionalPoints: 0,
    infractions: 0,
    penalties: [],
    totalPoints: 0,
    published: true,
    timestamp: NOW
  },
  scoreDetail: {
    attempt: { base: 0, adic: 0, infr: 0 },
    breakdown: { total: 0 }
  },
  ranking: [
    {
      position: 1,
      team: { id: "equipo_1", name: "Rancho El Ejemplo", category: "AAA" },
      total: 0
    }
  ],
  timer: {
    id: "timer_1",
    elapsedMs: 15000,
    running: true,
    startedAt: "2026-07-12T17:59:45.000Z",
    updatedAt: NOW,
    revision: 3
  },
  production: {
    outputId: "program_1",
    outputType: "program",
    operatorId: "user_1",
    operatorName: "Operador",
    updatedAt: NOW
  }
};

const teamContract = build(teamSource);

assert.equal(BROADCAST_DATA_CONTRACT_VERSION, "1.0.0");
assert.equal(teamContract.contractVersion, "1.0.0");
assert.equal(teamContract.competition.scope, "team");
assert.equal(teamContract.team.id, "equipo_1");
assert.equal(teamContract.participant.id, null);
assert.equal(teamContract.score.total, 0);
assert.equal(teamContract.score.basePoints, 0);
assert.equal(teamContract.ranking.scope, "team");
assert.equal(teamContract.ranking.entries[0].teamId, "equipo_1");
assert.equal(teamContract.ranking.entries[0].participantId, null);
assert.equal(validateBroadcastDataContract(teamContract).valid, true);

const nestedPayloadContract = build({
  broadcastContext: teamSource,
  graphicsConfig: { unusedLargeBlock: Array.from({ length: 300 }, (_, index) => index) },
  timestamp: NOW
});
assert.equal(nestedPayloadContract.source.type, "livePayload");
assert.equal(nestedPayloadContract.team.id, "equipo_1");
assert.equal(getBroadcastContractWarnings(nestedPayloadContract).some((warning) => warning.includes("graphicsConfig")), false);

const charroCompletoSource = {
  ...teamSource,
  competition: {
    id: "charro_completo",
    type: "charro_completo",
    name: "Charro Completo",
    scope: "individual",
    suerteIds: ["cala", "piales", "colas", "toro", "manganas_pie", "manganas_caballo", "paso"]
  },
  participant: {
    id: "participante_1",
    name: "Luis Martínez",
    scope: "individual",
    association: "Asociación Norte",
    category: "Libre",
    horseName: "Relámpago",
    total: 42,
    position: 1
  },
  team: {
    id: "equipo_residual",
    name: "Este equipo no debe publicarse"
  },
  horse: {
    name: "Relámpago"
  },
  score: {
    scoreId: "score_cc_1",
    totalPoints: 42,
    published: true,
    timestamp: NOW,
    participantId: "participante_1"
  },
  ranking: [
    {
      position: 1,
      participant: {
        id: "participante_1",
        name: "Luis Martínez",
        association: "Asociación Norte"
      },
      total: 42
    }
  ]
};

const charroCompletoContract = build(charroCompletoSource);

assert.equal(charroCompletoContract.competition.scope, "individual");
assert.equal(charroCompletoContract.participant.id, "participante_1");
assert.equal(charroCompletoContract.team.id, null);
assert.equal(charroCompletoContract.team.name, null);
assert.equal(charroCompletoContract.horse.name, "Relámpago");
assert.equal(charroCompletoContract.score.participantId, "participante_1");
assert.equal(charroCompletoContract.score.teamId, null);
assert.equal(charroCompletoContract.ranking.entries[0].participantId, "participante_1");
assert.equal(charroCompletoContract.ranking.entries[0].teamId, null);
assert.equal(charroCompletoContract.competition.suerteIds.includes("terna"), false);
assert.equal(charroCompletoContract.competition.suerteIds.includes("yegua"), false);
assert.equal(validateBroadcastDataContract(charroCompletoContract).valid, true);

const caladeroSource = {
  ...charroCompletoSource,
  competition: {
    id: "caladero_libre",
    type: "caladero",
    name: "Caladero Libre",
    scope: "individual",
    suerteIds: ["cala"]
  },
  suerte: { id: "cala", name: "Cala de Caballo", active: true },
  score: {
    scoreId: "score_cala_1",
    basePoints: 25,
    additionalPoints: 4,
    infractions: 1,
    totalPoints: 28,
    published: true,
    timestamp: NOW
  },
  scoreDetail: {
    attempt: {
      punta: { distancia: 14 },
      adicionales: [{ id: "adicional_1", points: 4 }],
      infracciones: [{ id: "infraccion_1", points: 1 }],
      tiempo: "00:18.2",
      timeEvidence: [{ id: "time_1", timeMs: 18200 }]
    },
    breakdown: {
      base: 25,
      adic: 4,
      infr: 1,
      total: 28
    },
    evidence: [{ id: "evidence_1", type: "timer" }]
  }
};

const caladeroContract = build(caladeroSource);

assert.deepEqual(caladeroContract.competition.suerteIds, ["cala"]);
assert.equal(caladeroContract.score.total, 28);
assert.equal(caladeroContract.scoreDetail.attempt.punta.distancia, 14);
assert.equal(caladeroContract.scoreDetail.attempt.timeEvidence[0].timeMs, 18200);
assert.equal(caladeroContract.scoreDetail.breakdown.total, 28);

const coleaderoContract = build({
  ...charroCompletoSource,
  competition: {
    id: "coleadero",
    type: "coleadero",
    name: "Coleadero",
    scope: "individual",
    suerteIds: ["colas"]
  },
  suerte: { id: "colas", name: "Colas" },
  scoreDetail: {
    attempt: {
      coleadores: [
        { id: "coleador_1", attempts: [{ total: 12 }, { total: 8 }] },
        { id: "coleador_2", attempts: [{ total: 10 }] }
      ]
    }
  }
});

assert.deepEqual(coleaderoContract.competition.suerteIds, ["colas"]);
assert.equal(coleaderoContract.scoreDetail.attempt.coleadores[0].attempts.length, 2);

const pialaderoContract = build({
  ...charroCompletoSource,
  competition: {
    id: "pialadero",
    type: "pialadero",
    name: "Pialadero",
    scope: "individual",
    suerteIds: ["piales"]
  },
  suerte: { id: "piales", name: "Piales" },
  scoreDetail: {
    attempt: {
      attempts: [
        { opportunity: 1, total: 20 },
        { opportunity: 2, total: 0 },
        { opportunity: 3, total: null }
      ]
    }
  }
});

assert.deepEqual(pialaderoContract.competition.suerteIds, ["piales"]);
assert.equal(pialaderoContract.scoreDetail.attempt.attempts[1].total, 0);
assert.equal(pialaderoContract.scoreDetail.attempt.attempts[2].total, null);

const legacySource = {
  tournament: { id: "torneo_legacy", name: "Torneo Legacy", type: "completo" },
  charreada: { id: "charreada_legacy", name: "Charreada Legacy" },
  team: { id: "equipo_legacy", name: "Equipo Legacy" },
  suerte: { id: "cala", name: "Cala" },
  score: { scoreId: "score_legacy", totalPoints: 0 },
  timer: { value: 0 }
};

const legacyContract = build(legacySource, { includeLegacyAliases: true });

assert.equal(legacyContract.competition.type, "equipos_completo");
assert.equal(legacyContract.competition.scope, "team");
assert.equal(legacyContract.competition.id, "equipos_completo");
assert.equal(legacyContract.legacy.used, true);
assert.equal(legacyContract.legacyAliases.teamName, "Equipo Legacy");
assert.equal(legacyContract.legacyAliases.totalPoints, 0);
assert.equal(legacyContract.legacyAliases.timerValue, 0);
assert.equal(getBroadcastContractWarnings(legacyContract).includes("legacy-context"), true);

const noAliasesContract = build(legacySource, { includeLegacyAliases: false });
assert.equal(hasBroadcastField(noAliasesContract, "legacyAliases"), false);

const sourceBeforeBuild = {
  tournament: { id: "torneo_safe", name: "Seguro" },
  competition: { id: "equipos_completo", type: "equipos_completo", scope: "team" },
  team: { id: "equipo_safe", name: "Equipo Seguro" },
  suerte: { id: "cala", name: "Cala" },
  customFields: {
    tournament: {
      transmisor: {
        key: "transmisor",
        dataType: "string",
        value: "Canal 1",
        visibility: "public"
      }
    }
  }
};
const sourceSnapshot = structuredClone(sourceBeforeBuild);
build(sourceBeforeBuild);
assert.deepEqual(sourceBeforeBuild, sourceSnapshot);

const circularSource = {
  tournament: { id: "torneo_circular", name: "Circular" },
  competition: { id: "equipos_completo", type: "equipos_completo", scope: "team" },
  team: { id: "equipo_circular", name: "Equipo Circular" },
  suerte: { id: "cala", name: "Cala" }
};
circularSource.self = circularSource;
const circularContract = build(circularSource);
assert.equal(getBroadcastContractWarnings(circularContract).some((warning) => warning.startsWith("circular-reference-removed:")), true);

const dangerousSource = JSON.parse(`{
  "tournament": {"id": "torneo_danger", "name": "Danger"},
  "competition": {"id": "equipos_completo", "type": "equipos_completo", "scope": "team"},
  "team": {"id": "equipo_danger", "name": "Equipo"},
  "suerte": {"id": "cala", "name": "Cala"},
  "__proto__": {"polluted": true}
}`);
dangerousSource.callback = () => "not-serializable";
dangerousSource.customFields = {
  tournament: {
    profundo: {
      key: "profundo",
      dataType: "object",
      value: { a: { b: { c: { d: { e: { f: { g: "limit" } } } } } } },
      visibility: "production"
    }
  }
};

const dangerousContract = build(dangerousSource);
const securityWarnings = getBroadcastContractWarnings(dangerousContract);
assert.equal(securityWarnings.some((warning) => warning.includes("dangerous-key-removed")), true);
assert.equal(securityWarnings.some((warning) => warning.includes("non-serializable-removed")), true);
assert.equal(securityWarnings.some((warning) => warning.includes("depth-limited")), true);
assert.equal(hasBroadcastField(dangerousContract, "__proto__"), false);
assert.equal(Object.prototype.polluted, undefined);

assert.equal(getBroadcastField(teamContract, "score.total", 99), 0);
assert.equal(getBroadcastField(teamContract, "participant.alias", "fallback"), null);
assert.equal(getBroadcastField(teamContract, "missing.path", "fallback"), "fallback");
assert.equal(hasBroadcastField(teamContract, "score.total"), true);
assert.equal(hasBroadcastField(teamContract, "participant.alias"), true);
assert.equal(hasBroadcastField(teamContract, "missing.path"), false);

const availableFields = listAvailableBroadcastFields(teamContract);
assert.equal(availableFields.includes("score.total"), true);
assert.equal(availableFields.includes("ranking.entries[].name"), true);

const visibilitySource = {
  ...teamSource,
  organization: {
    id: "org_private",
    name: "Organización visible",
    type: "productor",
    tenantId: "tenant_private",
    clientId: "client_private"
  },
  participant: {
    name: "",
    scope: "team",
    category: "AAA"
  },
  team: {
    ...teamSource.team,
    members: [{ id: "charro_private", name: "Integrante operativo" }]
  },
  horse: {
    id: "caballo_1",
    name: "Relámpago",
    owner: "Propietario Privado",
    breeder: "Criador Privado"
  },
  score: {
    ...teamSource.score,
    published: false,
    teamPenalties: [{ id: "team_penalty_1", points: 4 }],
    judgeId: "judge_1",
    judgeName: "Juez Interno"
  },
  scoreDetail: {
    attempt: { note: "Detalle de producción" },
    breakdown: { base: 0, total: 0 },
    evidence: [{ id: "evidence_1" }],
    timeEvidence: [{ id: "time_1", timeMs: 0 }],
    raw: { internalSource: "restricted" }
  },
  timer: {
    ...teamSource.timer,
    paused: false,
    source: { type: "remote" }
  },
  production: {
    sessionId: "session_private",
    outputId: "program_private",
    outputType: "program",
    operatorId: "operator_private",
    operatorName: "Operador Privado",
    updatedAt: NOW
  },
  system: {
    online: true,
    firebaseConnected: true,
    syncStatus: "connected",
    latency: 20,
    warnings: ["operational-warning"],
    errors: ["restricted-error"],
    diagnostics: { traceId: "restricted-trace" }
  },
  customFields: {
    tournament: {
      publicLabel: {
        key: "publicLabel",
        dataType: "string",
        value: "Visible",
        visibility: "public"
      },
      productionNote: {
        key: "productionNote",
        dataType: "string",
        value: "Producción",
        visibility: "production"
      },
      operationalNote: {
        key: "operationalNote",
        dataType: "string",
        value: "Operación",
        visibility: "operational"
      },
      restrictedNote: {
        key: "restrictedNote",
        dataType: "string",
        value: "Privado",
        visibility: "restricted"
      }
    }
  }
};

const visibilitySourceSnapshot = structuredClone(visibilitySource);
const restrictedContract = build(visibilitySource, { visibility: "restricted" });
const publicContract = sanitizeBroadcastDataContract(restrictedContract, "public");
const productionContract = sanitizeBroadcastDataContract(restrictedContract, "production");
const operationalContract = sanitizeBroadcastDataContract(restrictedContract, "operational");

assert.deepEqual(visibilitySource, visibilitySourceSnapshot);
assert.equal(restrictedContract.production.operatorId, "operator_private");
assert.equal(restrictedContract.score.judgeId, "judge_1");
assert.equal(restrictedContract.horse.owner, "Propietario Privado");
assert.equal(restrictedContract.system.diagnostics.traceId, "restricted-trace");
assert.equal(publicContract.score.total, 0);
assert.equal(publicContract.score.published, false);
assert.equal(publicContract.participant.name, "");
assert.equal(publicContract.timer.paused, false);
assert.equal(publicContract.system.syncStatus, "connected");
assert.equal(hasBroadcastField(publicContract, "organization.tenantId"), false);
assert.equal(hasBroadcastField(publicContract, "organization.clientId"), false);
assert.equal(hasBroadcastField(publicContract, "team.members"), false);
assert.equal(hasBroadcastField(publicContract, "horse.id"), false);
assert.equal(hasBroadcastField(publicContract, "horse.owner"), false);
assert.equal(hasBroadcastField(publicContract, "horse.breeder"), false);
assert.equal(hasBroadcastField(publicContract, "score.id"), false);
assert.equal(hasBroadcastField(publicContract, "score.teamPenalties"), false);
assert.equal(hasBroadcastField(publicContract, "scoreDetail"), false);
assert.equal(hasBroadcastField(publicContract, "production.operatorId"), false);
assert.equal(hasBroadcastField(publicContract, "score.judgeId"), false);
assert.equal(hasBroadcastField(publicContract, "system.firebaseConnected"), false);
assert.equal(hasBroadcastField(publicContract, "system.errors"), false);
assert.equal(hasBroadcastField(publicContract, "system.diagnostics"), false);
assert.equal(hasBroadcastField(publicContract, "system.latency"), false);
assert.equal(hasBroadcastField(publicContract, "customFields.tournament.publicLabel"), true);
assert.equal(hasBroadcastField(publicContract, "customFields.tournament.productionNote"), false);
assert.equal(hasBroadcastField(publicContract, "customFields.tournament.operationalNote"), false);
assert.equal(hasBroadcastField(publicContract, "customFields.tournament.restrictedNote"), false);

assert.equal(hasBroadcastField(productionContract, "production.outputType"), true);
assert.equal(hasBroadcastField(productionContract, "scoreDetail.attempt"), true);
assert.equal(hasBroadcastField(productionContract, "scoreDetail.breakdown"), true);
assert.equal(hasBroadcastField(productionContract, "scoreDetail.evidence"), false);
assert.equal(hasBroadcastField(productionContract, "scoreDetail.timeEvidence"), false);
assert.equal(hasBroadcastField(productionContract, "scoreDetail.raw"), false);
assert.equal(hasBroadcastField(productionContract, "team.members"), true);
assert.equal(hasBroadcastField(productionContract, "score.id"), true);
assert.equal(hasBroadcastField(productionContract, "score.teamPenalties"), true);
assert.equal(hasBroadcastField(productionContract, "score.judgeId"), false);
assert.equal(hasBroadcastField(productionContract, "production.operatorId"), false);
assert.equal(hasBroadcastField(productionContract, "system.diagnostics"), false);
assert.equal(hasBroadcastField(productionContract, "organization.tenantId"), false);
assert.equal(hasBroadcastField(productionContract, "horse.owner"), false);
assert.equal(hasBroadcastField(productionContract, "customFields.tournament.publicLabel"), true);
assert.equal(hasBroadcastField(productionContract, "customFields.tournament.productionNote"), true);
assert.equal(hasBroadcastField(productionContract, "customFields.tournament.operationalNote"), false);
assert.equal(hasBroadcastField(productionContract, "customFields.tournament.restrictedNote"), false);

assert.equal(hasBroadcastField(operationalContract, "score.judgeId"), true);
assert.equal(hasBroadcastField(operationalContract, "production.operatorId"), true);
assert.equal(hasBroadcastField(operationalContract, "scoreDetail.evidence"), true);
assert.equal(hasBroadcastField(operationalContract, "scoreDetail.timeEvidence"), true);
assert.equal(hasBroadcastField(operationalContract, "scoreDetail.raw"), false);
assert.equal(hasBroadcastField(operationalContract, "system.firebaseConnected"), true);
assert.equal(hasBroadcastField(operationalContract, "system.latency"), true);
assert.equal(hasBroadcastField(operationalContract, "system.warnings"), true);
assert.equal(hasBroadcastField(operationalContract, "system.errors"), false);
assert.equal(hasBroadcastField(operationalContract, "system.diagnostics"), false);
assert.equal(hasBroadcastField(operationalContract, "organization.tenantId"), false);
assert.equal(hasBroadcastField(operationalContract, "horse.owner"), false);
assert.equal(hasBroadcastField(operationalContract, "customFields.tournament.operationalNote"), true);
assert.equal(hasBroadcastField(operationalContract, "customFields.tournament.restrictedNote"), false);

assert.equal(hasBroadcastField(restrictedContract, "organization.tenantId"), true);
assert.equal(hasBroadcastField(restrictedContract, "organization.clientId"), true);
assert.equal(hasBroadcastField(restrictedContract, "horse.owner"), true);
assert.equal(hasBroadcastField(restrictedContract, "horse.breeder"), true);
assert.equal(hasBroadcastField(restrictedContract, "scoreDetail.raw"), true);
assert.equal(hasBroadcastField(restrictedContract, "system.errors"), true);
assert.equal(hasBroadcastField(restrictedContract, "system.diagnostics"), true);
assert.equal(hasBroadcastField(restrictedContract, "customFields.tournament.restrictedNote"), true);
assert.equal(validateBroadcastDataContract(publicContract).valid, true);
assert.equal(validateBroadcastDataContract(productionContract).valid, true);
assert.equal(validateBroadcastDataContract(operationalContract).valid, true);
assert.equal(validateBroadcastDataContract(restrictedContract).valid, true);

console.log("Broadcast Data Contract v1 tests passed");

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, '..');
const toolDirectory = path.join(root, 'tools', 'fmch-judge-questionnaire');
const dataSource = fs.readFileSync(path.join(toolDirectory, 'questionnaire-data.js'), 'utf8');
const appSource = fs.readFileSync(path.join(toolDirectory, 'app.js'), 'utf8');
const htmlSource = fs.readFileSync(path.join(toolDirectory, 'index.html'), 'utf8');

const localStorageData = new Map();
const localStorage = {
  getItem(key) { return localStorageData.has(key) ? localStorageData.get(key) : null; },
  setItem(key, value) { localStorageData.set(key, value); },
  removeItem(key) { localStorageData.delete(key); }
};
const browserWindow = {
  localStorage,
  addEventListener() {},
  clearTimeout() {},
  setTimeout() { return 1; },
  crypto: { getRandomValues(bytes) { for (let index = 0; index < bytes.length; index += 1) bytes[index] = index + 1; return bytes; } }
};
const context = vm.createContext({ window: browserWindow, Uint8Array, Date, Math, Set, Map, JSON, Object, Array, String, Boolean, Number });
vm.runInContext(dataSource, context, { filename: 'questionnaire-data.js' });
vm.runInContext(appSource, context, { filename: 'app.js' });

const data = browserWindow.FMCHJudgeQuestionnaireData;
const api = browserWindow.FMCHJudgeQuestionnaire;

assert.equal(data.sections.length, 14, 'must expose fourteen judge-facing sections');
assert.equal(api.sections.length, 14, 'public API must preserve section count');
const sourceQuestionIds = new Set(api.questions.flatMap((question) => question.sourceQuestionIds));
const fieldIds = new Set(api.questions.flatMap((question) => question.relatedFieldIds));
const gapIds = new Set(api.questions.flatMap((question) => question.relatedGapIds));
assert.equal(sourceQuestionIds.size, 13, 'must cover all thirteen commission questions');
assert.equal(fieldIds.size, 239, 'must preserve all 239 FieldID relationships');
assert.ok([...gapIds].filter((id) => id.startsWith('GAP-P0-')).length >= 5, 'must cover the five P0 gaps');
assert.ok(api.questions.every((question) => question.relatedFieldIds.length > 0 && question.sourceQuestionIds.length > 0), 'every visible question must remain traceable');

const first = api.createInterview({ respondentName: 'Juez Ejemplo', role: 'Juez', interviewDate: '2026-08-01' });
const second = api.createInterview({ respondentName: 'Juez Dos', role: 'Calificador', interviewDate: '2026-08-01' });
assert.notEqual(first.interviewId, second.interviewId, 'new interviews require unique IDs');
assert.equal(first.interviewStatus, 'DRAFT');
assert.equal(first.consent.registerResponses, false);

const store = api.createStorageAdapter(localStorage);
store.save(first);
store.save(second);
assert.equal(store.list().length, 2, 'multiple interviews must coexist without overwriting');
first.answers['CALA-01'] = {
  selection: '',
  selections: [],
  narrative: 'Primera explicación ficticia',
  example: '',
  evidenceSources: ['Experiencia práctica'],
  confidence: 'Requiere confirmación',
  interviewerNotes: '',
  responseStatus: 'PENDING_REVIEW',
  updatedAt: new Date().toISOString()
};
second.answers['CALA-01'] = { ...first.answers['CALA-01'], narrative: 'Segunda explicación ficticia' };
store.save(first);
store.save(second);
assert.ok(api.compareInterviews(store.list()).some((conflict) => conflict.questionId === 'CALA-01'), 'different answers must be marked for review, not resolved');

const exportPayload = api.buildExportPayload(first);
assert.equal(exportPayload.format, 'charropro-fmch-judge-interview');
assert.equal(api.validateImportPayload(exportPayload).valid, true, 'own JSON export must import');
assert.equal(api.validateImportPayload({ format: 'other', interview: first }).valid, false, 'unknown import formats must fail');
const originalNarrative = first.answers['CALA-01'].narrative;
exportPayload.interview.answers['CALA-01'].narrative = 'Intento de modificar el export';
assert.equal(first.answers['CALA-01'].narrative, originalNarrative, 'export payload must be detached from the record');
const csv = api.buildCsv(first);
assert.ok(csv.includes('CALA-01'));
assert.ok(csv.includes('"Primera explicación ficticia"'));

assert.doesNotMatch(appSource, /\b(fetch|XMLHttpRequest|WebSocket)\b|firebase|https?:\/\//i, 'app must not make network or Firebase calls');
assert.doesNotMatch(appSource, /innerHTML/, 'captured answers must not be inserted as HTML');
assert.doesNotMatch(htmlSource, /https?:\/\/|\/\//i, 'HTML must not load external resources');
assert.doesNotMatch(dataSource, /https?:\/\/|firebase/i, 'questionnaire data must remain offline');

console.log('fmch-judge-questionnaire: passed');

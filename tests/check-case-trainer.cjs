'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'case-trainer.js'), 'utf8');
const baseKey = 'cs-bilets-ru.progress.v1';
const keys = { senior: 'cs-bilets-ru.senior.v1', 'ai-security': 'cs-bilets-ru.ai-security.v1', scenarios: 'cs-bilets-ru.scenarios.v1' };
const bankFiles = { senior: 'senior-questions.json', 'ai-security': 'ai-security-questions.json', scenarios: 'scenarios-questions.json' };
const copy = value => JSON.parse(JSON.stringify(value));
const plain = value => JSON.parse(JSON.stringify(value));
const tick = () => new Promise(resolve => setImmediate(resolve));
const htmlEsc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const decode = value => value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

function fixture(id = 'senior') {
  const prefix = id === 'senior' ? 's' : id === 'ai-security' ? 'ai' : 'sc';
  const trackIds = id === 'senior'
    ? ['net-crypto', 'appsec-identity', 'cloud-platform', 'soc-ir']
    : id === 'ai-security' ? ['ai-agents', 'ai-rag-data', 'ai-mlops', 'ai-evaluation'] : ['mitre', 'owasp', 'cve'];
  return {
    schemaVersion: 1, id, title: `Учебный банк ${id}`, description: 'Тестовые сценарии для проверки поведения интерфейса.', reviewedAt: '2026-10-02',
    tracks: trackIds.map((track, index) => ({ id: track, title: `Направление ${index + 1}` })),
    methodology: 'AUTHOR_METHODOLOGY_SENTINEL',
    interviewCollections: [{ title: 'COLLECTION_SENTINEL', url: 'https://example.org/interviews', note: 'Темы, не экзамен.', tracks: [trackIds[0]] }],
    sources: [{ id: 'test-source', title: 'SOURCE_SENTINEL', publisher: 'Maintainer', url: 'https://example.org/primary?first=1&second=2', accessedAt: '2026-10-02' }],
    questions: Array.from({ length: 12 }, (_, index) => ({
      id: `${prefix}${String(index + 1).padStart(3, '0')}`, track: trackIds[Math.floor(index / (12 / trackIds.length))], title: `Сценарий ${index + 1}`, difficulty: index % 2 ? 'advanced' : 'intermediate',
      question: `Выберите решение ${index + 1} с учётом наблюдений.`, evidence: ['Известен факт 1.', 'Известен факт 2.'], constraints: ['Нельзя нарушать условие 1.'],
      options: ['А', 'Б', 'В', 'Г'].map((letter, option) => ({ sourceLetter: letter, text: `Вариант ${option + 1} сценария ${index + 1}`, correct: option === index % 4, explanation: `OPTION_EXPLANATION_SENTINEL_${index}_${option}` })),
      prerequisites: [{ term: 'FOUNDATION_TERM_SENTINEL', explanation: 'FOUNDATION_EXPLANATION_SENTINEL' }],
      reasoning: ['REASONING_SENTINEL_1', 'REASONING_SENTINEL_2', 'REASONING_SENTINEL_3'], tradeoffs: ['TRADEOFF_SENTINEL'], whatChangesAnswer: 'CHANGED_ASSUMPTION_SENTINEL',
      followUps: [{ question: 'FOLLOWUP_QUESTION_SENTINEL', answer: 'FOLLOWUP_ANSWER_SENTINEL' }], references: [{ sourceId: 'test-source', locator: 'LOCATOR_SENTINEL' }],
      ...(id === 'scenarios' ? { basis: { family: trackIds[Math.floor(index / 4)], identifiers: ['BASIS_IDENTIFIER_SENTINEL'] }, conceptIds: ['api'] } : {})
    }))
  };
}

// A small DOM harness executes the actual event handlers, not a reimplementation of the trainer.
class Element {
  constructor(document, tag = 'DIV', attributes = {}) {
    this.document = document;
    this.tagName = tag.toUpperCase();
    this.attributes = attributes;
    this.dataset = {};
    for (const [key, value] of Object.entries(attributes)) if (key.startsWith('data-')) this.dataset[key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = decode(value);
    this.id = attributes.id || '';
    this.type = attributes.type || '';
    this.disabled = Object.hasOwn(attributes, 'disabled');
    this.checked = Object.hasOwn(attributes, 'checked');
    this.open = false;
    this.value = '';
    this.textContent = '';
    this.listeners = new Map();
    this.isConnected = true;
    this.isContentEditable = false;
    this.innerHTML = '';
  }
  set innerHTML(value) { for (const node of this.cache?.values() || []) node.isConnected = false; this._html = value; this.cache = new Map(); }
  get innerHTML() { return this._html; }
  addEventListener(name, fn) { if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name).add(fn); }
  dispatch(name, extra = {}) {
    const event = { target: this, preventDefault() { this.defaultPrevented = true; }, stopPropagation() { this.propagationStopped = true; }, ...extra };
    for (const handler of this.listeners.get(name) || []) handler(event);
    return event;
  }
  focus() { this.document.activeElement = this; }
  closest(selector) { return selector === '[data-term]' ? this.dataset.term ? this : null : this.isContentEditable ? this : null; }
  contains(element) { return [...this.cache.values()].includes(element); }
  showModal() { this.open = true; }
  close() { this.open = false; this.dispatch('close'); }
  querySelectorAll(selector) {
    const nodes = [];
    const selectorId = selector.startsWith('#') ? selector.slice(1) : null;
    const attribute = selector.match(/^\[([a-z-]+)(?:="([^"]*)")?\]$/);
    for (const match of this._html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/gi)) {
      const attributes = {};
      for (const item of match[2].matchAll(/([a-z][a-z0-9-]*)(?:="([^"]*)")?/gi)) attributes[item[1]] = item[2] || '';
      const matches = selectorId ? attributes.id === selectorId : attribute ? Object.hasOwn(attributes, attribute[1]) && (attribute[2] === undefined || attributes[attribute[1]] === attribute[2]) : false;
      if (!matches) continue;
      if (!this.cache.has(match.index)) {
        const element = new Element(this.document, match[1], attributes);
        if (element.tagName === 'TEXTAREA') element.value = decode(this._html.slice(match.index + match[0].length).split('</textarea>')[0]);
        this.cache.set(match.index, element);
      }
      nodes.push(this.cache.get(match.index));
    }
    return nodes;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
}

async function runtime({ id = 'senior', bank = fixture(id), storage = new Map(), blocked = false, failedHttp = false, expectFailure = false, seed = 2026, banks, failedFile } = {}) {
  const nodes = new Map();
  const listeners = new Map();
  const windowListeners = new Map();
  const errors = [];
  const document = {
    activeElement: null,
    querySelector(selector) { return nodes.get(selector) || null; },
    addEventListener(name, fn) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn); }
  };
  const html = fs.readFileSync(path.join(root, `${id}.html`), 'utf8');
  for (const match of html.matchAll(/<([a-z][a-z0-9-]*)\b[^>]*\bid="([^"]+)"[^>]*>/gi)) nodes.set(`#${match[2]}`, new Element(document, match[1], { id: match[2] }));
  document.body = new Element(document, 'body');
  document.body.dataset.bank = id;
  document.activeElement = document.body;
  const feedback = { open: false, label: '', version: '', questions: [] };
  const window = {
    TrainerFeedback: {
      setBank(label, version, questions) { Object.assign(feedback, { label, version, questions }); },
      actions(id) { return `<button data-question-feedback="error" data-question-id="${htmlEsc(id)}">Сообщить об ошибке</button><button data-question-feedback="suggestion" data-question-id="${htmlEsc(id)}">Предложить улучшение</button>`; },
      isOpen() { return feedback.open; }
    },
    localStorage: {
      getItem(key) { if (blocked) throw new Error('Storage blocked'); return storage.get(key) ?? null; },
      setItem(key, value) { if (blocked) throw new Error('Storage blocked'); storage.set(key, value); }
    },
    scrollTo() {},
    addEventListener(name, fn) { windowListeners.set(name, fn); }
  };
  let randomState = seed >>> 0;
  const math = Object.create(Math);
  math.random = () => { randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0; return randomState / 4294967296; };
  const fetched = [];
  const context = {
    document, window, console: { error(...args) { errors.push(args); } }, Math: math, URL, Map, Set, Promise,
    fetch: async url => { fetched.push(url); const fail = failedHttp || url === failedFile; return { ok: !fail, status: fail ? 404 : 200, json: async () => banks ? banks[url] : bank }; }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root,'glossary.js'),'utf8'),context);
  if (id === 'all-questions') vm.runInContext(fs.readFileSync(path.join(root,'all-questions.js'),'utf8'),context);
  const expose = `  globalThis.qa = { startSession, requestStart, selectAnswer, saveNote, checkAnswer, jump, finishSession, requestFinish, goHome, resume, setMode, resetProgress, mixedIds, keyboard, render, validateBank, get: () => ({ dataset, questions, sources, tracks, signature, progress, storageAvailable, notice, confirmation }) };\n  load();\n})();`;
  assert(source.includes('  load();\n})();'), 'The harness must expose the actual trainer functions');
  vm.runInContext(source.replace('  load();\n})();', expose), context);
  await tick();
  if (expectFailure) {
    assert.equal(context.qa.get().dataset, null);
    assert.equal(errors.length, 1);
    assert(nodes.get('#main').innerHTML.includes('Не удалось загрузить сценарии'));
  } else {
    assert(context.qa.get().dataset, `Bank ${id} must load: ${errors.map(error => String(error[1])).join('; ')}`);
    assert.equal(errors.length, 0);
    assert.deepEqual(fetched, id === 'all-questions' ? ['./questions.json', './ai-security-questions.json', './scenarios-questions.json'] : [`./${bankFiles[id]}`]);
  }
  return {
    a: context.qa, nodes, document, storage, windowListeners, feedback, fetched,
    html: () => nodes.get('#main').innerHTML,
    click(selector) { const element = nodes.get('#main').querySelector(selector); assert(element, `${selector} must exist`); assert(!element.disabled, `${selector} must be enabled`); element.dispatch('click'); },
    key(key, target = document.activeElement, extra = {}) { const event = { key, target, preventDefault() { this.defaultPrevented = true; }, ...extra }; for (const fn of listeners.get('keydown') || []) fn(event); return event; }
  };
}

function choose(run, correct = true) {
  const state = run.a.get();
  const session = state.progress.session;
  const id = session.ids[session.index];
  const index = state.questions.get(id).options.findIndex(option => option.correct === correct);
  run.a.selectAnswer(index);
  return { id, index };
}

function assertHidden(run, hidden) {
  const markup = run.html();
  for (const sentinel of ['FOUNDATION_TERM_SENTINEL', 'FOUNDATION_EXPLANATION_SENTINEL', 'OPTION_EXPLANATION_SENTINEL', 'REASONING_SENTINEL', 'TRADEOFF_SENTINEL', 'CHANGED_ASSUMPTION_SENTINEL', 'FOLLOWUP_QUESTION_SENTINEL', 'FOLLOWUP_ANSWER_SENTINEL', 'SOURCE_SENTINEL', 'LOCATOR_SENTINEL']) {
    assert.equal(markup.includes(sentinel), !hidden, `${sentinel} must be ${hidden ? 'hidden' : 'available'}`);
  }
  if (hidden) {
    assert(!markup.includes('class="case-feedback'));
    assert(!markup.includes('case-option-status'));
    assert(!markup.includes('COLLECTION_SENTINEL'));
    assert(!markup.includes('AUTHOR_METHODOLOGY_SENTINEL'));
  }
}

async function main() {
  // Each scenario page loads its own bank and never mounts the main ticket engine.
  for (const id of Object.keys(keys)) {
    const name = `${id}.html`;
    const html = fs.readFileSync(path.join(root, name), 'utf8');
    assert(html.includes(`data-bank="${id}"`));
    assert(html.includes('src="./case-trainer.js" defer'));
    assert(!html.includes('src="./app.js"'));
    assert(html.includes('href="./style.css"') && html.includes('href="./case-trainer.css"'));
    for (const link of ['index.html', 'senior.html', 'ai-security.html', 'scenarios.html']) assert(html.includes(`href="./${link}"`));
    assert(html.includes('aria-describedby="dialog-message"'));
    assert(html.includes('src="./feedback.js" defer') && html.includes('src="./glossary.js" defer'));
    assert(html.includes('data-question-feedback="suggestion"'));
    assert.equal((html.match(/aria-current="page"/g) || []).length, 1);
    assert(html.includes(`href="./${id}.html" aria-current="page"`));
    assert(html.includes('id="main" tabindex="-1"'));
  }
  const mainPage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert(mainPage.includes('href="./scenarios.html"'));
  const css = fs.readFileSync(path.join(root, 'case-trainer.css'), 'utf8');
  assert(css.includes('.navigation{flex-wrap:wrap}'));
  assert(css.includes('.case-map .question-number{width:100%;height:44px}'));
  assert(css.includes('.nav-item{min-height:44px;min-width:110px}'));

  const initial500 = '{"keep":"all five hundred questions and their progress"}';
  const initialAi = '{"keep":"ai progress"}';
  const storage = new Map([[baseKey, initial500], [keys['ai-security'], initialAi]]);
  let run = await runtime({ storage });
  let state = () => run.a.get().progress;
  assert(run.html().includes('COLLECTION_SENTINEL'));
  assert.equal(state().total, 0);
  assert.equal(storage.get(baseKey), initial500);
  assert.equal(storage.get(keys['ai-security']), initialAi);

  // Every mixed attempt covers all four tracks with 3/3/2/2 cases; no duplicates.
  const mixes = new Set();
  for (let attempt = 0; attempt < 6; attempt++) {
    const ids = run.a.mixedIds();
    assert.equal(ids.length, 10);
    assert.equal(new Set(ids).size, 10);
    const trackCounts = new Map();
    for (const id of ids) { const track = run.a.get().questions.get(id).track; trackCounts.set(track, (trackCounts.get(track) || 0) + 1); }
    assert.deepEqual([...trackCounts.values()].sort(), [2, 2, 3, 3]);
    mixes.add([...ids].join(','));
  }
  assert(mixes.size > 1, 'Mixed sets must use randomness');
  run.a.startSession(fixture().questions.map(question => question.id), 'Весь банк');
  const firstOrder = [...state().session.ids];
  const firstChoices = plain(state().session.orders);
  run.a.startSession(fixture().questions.map(question => question.id), 'Весь банк');
  assert.notDeepEqual([...state().session.ids], firstOrder, 'New attempts shuffle questions');
  assert.notDeepEqual(plain(state().session.orders), firstChoices, 'New attempts shuffle options');
  assert.deepEqual([...state().session.ids].sort(), fixture().questions.map(question => question.id).sort());

  // Practice: immediate review, immutable checked answer, restored ordering, no double count.
  run.a.startSession(['s001', 's002', 's003'], 'Три решения', 'practice');
  assert(run.html().includes('FOUNDATION_TERM_SENTINEL'));
  assert(!run.html().includes('OPTION_EXPLANATION_SENTINEL'));
  const wrong = choose(run, false);
  assert.equal(run.document.activeElement.id, `answer-${wrong.index}`, 'Selecting must keep focus on a real radio');
  assert.equal(run.nodes.get('#main').querySelectorAll('[data-answer]').length, 4);
  const note = '</textarea><img src=x onerror="throw 1">\n1 2 3 4\n<script>alert(1)</script>';
  const noteElement = run.nodes.get('#main').querySelector('#reasoning-note');
  noteElement.value = note;
  noteElement.dispatch('input');
  assert.equal(state().session.notes[wrong.id], note);
  const beforeKeys = plain(state().session);
  for (const key of ['1', '2', '3', '4', 'Enter']) assert(!run.key(key, noteElement).defaultPrevented);
  const editable = new Element(run.document, 'DIV'); editable.isContentEditable = true;
  run.key('1', editable);
  assert.deepEqual(plain(state().session), beforeKeys, 'Typing in notes or editable content must not alter the quiz');
  run.a.checkAnswer();
  assert.equal(state().total, 1); assert.equal(state().correctTotal, 0); assert(state().errors.has(wrong.id));
  assert.equal(run.document.activeElement.id, 'case-feedback');
  assertHidden(run, false);
  assert(!run.html().includes('<img src=x'));
  assert(!run.html().includes('<script>alert(1)</script>'));
  assert(run.html().includes(htmlEsc(note)));
  run.a.checkAnswer(); choose(run, true);
  assert.equal(state().total, 1);
  assert.equal(state().session.answers[wrong.id], wrong.index, 'A checked answer is locked');
  const practiceSnapshot = plain(state().session);
  run = await runtime({ storage });
  assert.deepEqual(plain(state().session), practiceSnapshot, 'Reload preserves shuffled positions, checked answer and note');
  assertHidden(run, false);
  run.a.checkAnswer(); assert.equal(state().total, 1);
  run.a.jump(1); choose(run, true); run.a.checkAnswer();
  run.a.jump(2);
  const skippedId = state().session.ids[2];
  const finishing = run.a.requestFinish();
  assert(run.nodes.get('#confirm-dialog').open);
  assert.equal(state().completed, 0);
  run.nodes.get('#dialog-cancel').dispatch('click'); await finishing;
  assert(!state().session.finished, 'Cancel keeps unfinished attempt');
  const finishingAgain = run.a.requestFinish();
  run.nodes.get('#dialog-ok').dispatch('click'); await finishingAgain;
  assert.equal(state().total, 3); assert.equal(state().correctTotal, 1); assert.equal(state().completed, 1);
  assert(state().errors.has(skippedId));
  assert.equal(state().errors.size, 2);
  assert(run.html().includes('Разбор всех сценариев'));
  assert(run.html().includes(htmlEsc(note)));
  run.a.finishSession(); assert.equal(state().total, 3); assert.equal(state().completed, 1);
  run = await runtime({ storage });
  assert.equal(state().total, 3); assert.equal(state().completed, 1); assert(state().session.finished);
  run.a.startSession([wrong.id], 'Повторение ошибки'); choose(run, true); run.a.checkAnswer(); run.a.finishSession();
  assert(!state().errors.has(wrong.id), 'Correct practice removes an existing mistake');
  assert.equal(state().total, 4); assert.equal(state().correctTotal, 2);

  // Interview: choices remain editable and nothing is graded or revealed until completion, including after reload.
  run.a.startSession(['s001', 's002', 's003'], 'Репетиция', 'interview');
  assertHidden(run, true);
  const totalBeforeInterview = state().total;
  choose(run, false);
  run.a.checkAnswer(); assert.equal(state().total, totalBeforeInterview); assertHidden(run, true);
  const right = choose(run, true);
  run.a.saveNote('Сначала проверю границу доверия.');
  run.a.jump(1); choose(run, true);
  const interviewSnapshot = plain(state().session);
  run = await runtime({ storage });
  assert.deepEqual(plain(state().session), interviewSnapshot);
  assertHidden(run, true);
  assert.equal(state().total, totalBeforeInterview);
  run.a.jump(0);
  assert.equal(state().session.answers[right.id], right.index);
  run.a.finishSession();
  assert.equal(state().total, totalBeforeInterview + 3);
  assertHidden(run, false);
  assert(run.html().includes('Сначала проверю границу доверия.'));

  // Returning to the catalog does not discard the attempt; starting a new one needs an explicit decision.
  run.a.startSession(['s004', 's005'], 'Незавершённая', 'interview'); choose(run, false); run.a.saveNote('Сохранить эту заметку');
  const oldSession = plain(state().session);
  const countersBeforeAbandon = [state().total, state().correctTotal, state().completed];
  run.a.goHome();
  assert(run.html().includes('Есть незавершённая попытка'));
  run = await runtime({ storage });
  assert.equal(state().view, 'home');
  assert.deepEqual(plain(state().session), oldSession);
  run.click('[data-action="resume"]');
  assert.equal(state().view, 'session');
  assertHidden(run, true);
  run.a.goHome();
  const newAttempt = run.a.requestStart('mixed');
  assert(run.nodes.get('#confirm-dialog').open);
  assert.deepEqual(plain(state().session), oldSession);
  assert.equal(run.document.activeElement.id, 'dialog-cancel', 'A destructive dialog initially focuses cancel');
  run.nodes.get('#confirm-dialog').dispatch('cancel'); await newAttempt;
  assert.deepEqual(plain(state().session), oldSession);
  const acceptedAttempt = run.a.requestStart('mixed');
  run.nodes.get('#dialog-ok').dispatch('click'); await acceptedAttempt;
  assert.equal(state().session.ids.length, 10);
  assert.deepEqual(Object.keys(state().session.notes), []);
  assert.deepEqual([state().total, state().correctTotal, state().completed], countersBeforeAbandon, 'Abandoning an interview must not score unchecked choices');
  run.a.goHome(); run.a.setMode('interview');
  assert.equal(state().mode, 'interview');
  assert.equal(state().session.mode, 'practice', 'The catalog switch applies to future attempts only');
  run.a.resume();
  const order = state().session.orders[state().session.ids[0]];
  run.key('2', run.document.body);
  assert.equal(state().session.answers[state().session.ids[0]], order[1], 'Number shortcuts use displayed ordering');
  const beforeButtonEnter = state().total;
  const button = run.nodes.get('#main').querySelector('[data-action="check"]');
  run.key('Enter', button); assert.equal(state().total, beforeButtonEnter, 'Native buttons are not triggered twice by global Enter');
  run.key('Enter', run.document.body); assert.equal(state().total, beforeButtonEnter + 1);
  run.windowListeners.get('pagehide')();

  // Reset affects only this bank, and cancellation leaves its data intact.
  const savedBeforeReset = storage.get(keys.senior);
  const cancelledReset = run.a.resetProgress();
  run.nodes.get('#dialog-cancel').dispatch('click'); await cancelledReset;
  assert.equal(storage.get(keys.senior), savedBeforeReset);
  const acceptedReset = run.a.resetProgress();
  run.nodes.get('#dialog-ok').dispatch('click'); await acceptedReset;
  assert.equal(state().total, 0); assert.equal(state().completed, 0); assert.equal(state().errors.size, 0); assert.equal(state().session, null);
  assert.equal(storage.get(baseKey), initial500);
  assert.equal(storage.get(keys['ai-security']), initialAi);

  // The AI bank uses a different file, ID namespace and storage entry while sharing the same behavior.
  const seniorSaved = storage.get(keys.senior);
  const aiRun = await runtime({ id: 'ai-security', storage });
  aiRun.a.startSession(['ai001', 'ai002'], 'ИИ', 'interview'); choose(aiRun, true);
  assertHidden(aiRun, true);
  aiRun.a.finishSession();
  assertHidden(aiRun, false);
  assert.equal(storage.get(keys.senior), seniorSaved);
  assert.equal(storage.get(baseKey), initial500);

  // MITRE/OWASP/CVE has three balanced tracks and its own storage, feedback context and review metadata.
  const independentStorage = new Map([
    [baseKey, 'main-progress-sentinel'], [keys.senior, 'senior-progress-sentinel'],
    [keys['ai-security'], 'ai-progress-sentinel']
  ]);
  const otherProgress = [...independentStorage.entries()];
  let scenarioRun = await runtime({ id: 'scenarios', storage: independentStorage });
  assert(scenarioRun.html().includes('По 3–4 сценария'));
  assert(!scenarioRun.html().includes('По 2–3 сценария'));
  assert.equal(scenarioRun.feedback.label, 'Ситуационные задачи');
  assert.equal(scenarioRun.feedback.questions.length, 12);
  const bonusTracks = new Set();
  for (let attempt = 0; attempt < 9; attempt++) {
    const ids = scenarioRun.a.mixedIds();
    assert.equal(new Set(ids).size, 10);
    const counts = new Map();
    for (const id of ids) {
      const track = scenarioRun.a.get().questions.get(id).track;
      counts.set(track, (counts.get(track) || 0) + 1);
    }
    assert.deepEqual([...counts.values()].sort(), [3, 3, 4]);
    bonusTracks.add([...counts].find(([, count]) => count === 4)[0]);
  }
  assert(bonusTracks.size > 1, 'The extra case must not always belong to the first track');
  scenarioRun.click('[data-track="mitre"]');
  assert.equal(scenarioRun.a.get().progress.session.ids.length, 4);
  assert(scenarioRun.a.get().progress.session.ids.every(id => scenarioRun.a.get().questions.get(id).track === 'mitre'));
  assert(!scenarioRun.html().includes('BASIS_IDENTIFIER_SENTINEL'), 'Basis must not give away an unchecked practice answer');
  const scenarioFirst = scenarioRun.a.get().progress.session.ids[0];
  const reportButton = scenarioRun.nodes.get('#main').querySelector('[data-question-feedback="error"]');
  assert.equal(reportButton.dataset.questionId, scenarioFirst);
  scenarioRun.feedback.open = true;
  const beforeFeedbackKeys = independentStorage.get(keys.scenarios);
  scenarioRun.key('1', scenarioRun.document.body); scenarioRun.key('Enter', scenarioRun.document.body);
  assert.equal(independentStorage.get(keys.scenarios), beforeFeedbackKeys, 'Feedback dialog must block quiz shortcuts');
  scenarioRun.feedback.open = false;
  choose(scenarioRun, false); scenarioRun.a.saveNote('Сначала проверю факты и ограничения.'); scenarioRun.a.checkAnswer();
  assert(scenarioRun.html().includes('BASIS_IDENTIFIER_SENTINEL'));
  assert(scenarioRun.html().includes('MITRE ATT&amp;CK'));
  const savedScenario = plain(scenarioRun.a.get().progress.session);
  scenarioRun = await runtime({ id: 'scenarios', storage: independentStorage });
  assert.deepEqual(plain(scenarioRun.a.get().progress.session), savedScenario);
  assert.equal(scenarioRun.a.get().progress.total, 1);
  assert(scenarioRun.a.get().progress.errors.has(scenarioFirst));
  scenarioRun.a.startSession(['sc005', 'sc009'], 'Ситуации без подсказок', 'interview');
  choose(scenarioRun, true); scenarioRun.a.saveNote('Моё решение до просмотра источника.');
  assertHidden(scenarioRun, true);
  assert(!scenarioRun.html().includes('BASIS_IDENTIFIER_SENTINEL'));
  const interviewScenario = plain(scenarioRun.a.get().progress.session);
  scenarioRun = await runtime({ id: 'scenarios', storage: independentStorage });
  assert.deepEqual(plain(scenarioRun.a.get().progress.session), interviewScenario);
  assertHidden(scenarioRun, true);
  assert(!scenarioRun.html().includes('BASIS_IDENTIFIER_SENTINEL'));
  scenarioRun.a.finishSession();
  assert(scenarioRun.html().includes('BASIS_IDENTIFIER_SENTINEL'));
  assert(scenarioRun.html().includes('OWASP') && scenarioRun.html().includes('CVE'));
  assert.equal(scenarioRun.nodes.get('#main').querySelectorAll('[data-question-feedback="error"]').length, 2);
  const resetScenarios = scenarioRun.a.resetProgress();
  assert(scenarioRun.nodes.get('#dialog-message').textContent.includes('Прогресс остальных банков останется'));
  scenarioRun.nodes.get('#dialog-ok').dispatch('click'); await resetScenarios;
  assert.equal(scenarioRun.a.get().progress.session, null);
  assert.equal(scenarioRun.a.get().progress.total, 0);
  for (const [key, original] of otherProgress) assert.equal(independentStorage.get(key), original, 'Scenario actions must leave all existing banks untouched');

  // New metadata is mandatory only in the situational bank; original banks retain four-track validation.
  for (const mutation of [
    bank => { bank.tracks[2].id = 'other'; },
    bank => { bank.tracks.push({ id: 'fourth', title: 'Лишнее направление' }); },
    bank => { delete bank.questions[0].basis; },
    bank => { bank.questions[0].basis.family = 'cve'; },
    bank => { bank.questions[0].basis.identifiers = ['']; },
    bank => { bank.questions[0].basis.identifiers = ['T0000', 'T0000']; },
    bank => { bank.questions[0].conceptIds = []; },
    bank => { bank.questions[0].conceptIds = ['api', 'api']; },
    bank => { bank.questions[0].conceptIds = ['<script>']; }
  ]) {
    const invalid = fixture('scenarios'); mutation(invalid);
    const untouched = new Map([[keys.scenarios, 'existing-scenario-progress']]);
    await runtime({ id: 'scenarios', bank: invalid, storage: untouched, expectFailure: true });
    assert.equal(untouched.get(keys.scenarios), 'existing-scenario-progress');
  }
  for (const id of ['senior', 'ai-security']) {
    const invalid = fixture(id); invalid.tracks.pop();
    await runtime({ id, bank: invalid, expectFailure: true });
  }

  // Corrupt state is handled per bank. A content update preserves aggregates and known errors, but invalidates attempt ordering.
  const stateStore = new Map();
  run = await runtime({ storage: stateStore });
  run.a.startSession(['s001', 's002'], 'Сохранение'); const knownError = choose(run, false).id; run.a.checkAnswer(); run.a.saveNote('Исходная заметка');
  const goodSaved = JSON.parse(stateStore.get(keys.senior));
  const changedBank = fixture(); changedBank.questions[0].options[0].explanation += ' Updated.';
  stateStore.set(keys.senior, JSON.stringify({ ...goodSaved, errors: [...goodSaved.errors, 's999'] }));
  run = await runtime({ bank: changedBank, storage: stateStore });
  assert.equal(state().total, 1); assert.equal(state().correctTotal, 0); assert(state().errors.has(knownError)); assert(!state().errors.has('s999'));
  assert.equal(state().session, null); assert(run.a.get().notice.includes('Банк обновился'));
  for (const mutation of [
    saved => { saved.session.orders[saved.session.ids[0]] = [0, 1, 1, 3]; },
    saved => { saved.session.ids[0] = 's999'; },
    saved => { saved.session.answers[saved.session.ids[0]] = 4; },
    saved => { saved.session.notes[saved.session.ids[0]] = 'x'.repeat(6001); },
    saved => { saved.session.notes.foreign = 'Wrong namespace'; },
    saved => { saved.session.index = 999; },
    saved => { saved.session.mode = 'interview'; },
    saved => { saved.total = 0; saved.correctTotal = 0; },
    saved => { saved.correctTotal = saved.total; },
    saved => { saved.session.finished = true; saved.completed = 0; }
  ]) {
    const malformed = copy(goodSaved); mutation(malformed);
    const malformedStorage = new Map([[keys.senior, JSON.stringify(malformed)]]);
    const malformedRun = await runtime({ storage: malformedStorage });
    assert.equal(malformedRun.a.get().progress.session, null, 'Invalid session must not resume or score');
    assert(malformedRun.a.get().notice.length > 0);
  }
  for (const malformed of ['{broken', JSON.stringify({ ...goodSaved, bankId: 'ai-security' }), JSON.stringify({ ...goodSaved, version: 99 }), JSON.stringify({ ...goodSaved, total: -1 })]) {
    run = await runtime({ storage: new Map([[keys.senior, malformed]]) });
    assert.equal(state().total, 0); assert.equal(state().session, null); assert(run.a.get().notice);
  }
  run = await runtime({ blocked: true });
  assert.equal(run.a.get().storageAvailable, false);
  run.a.startSession(['s001'], 'Без хранения'); choose(run, true); run.a.checkAnswer(); run.a.finishSession();
  assert.equal(state().total, 1); assert.equal(state().correctTotal, 1);
  assert(run.nodes.get('#storage-status').textContent.includes('Сохранение недоступно'));

  // Reject invalid source schemes, missing references and broken answer keys before showing or scoring the bank.
  for (const mutation of [
    bank => { bank.id = 'ai-security'; },
    bank => { bank.questions[1].id = bank.questions[0].id; },
    bank => { bank.questions[0].track = 'unknown'; },
    bank => { bank.questions[0].options[1].correct = true; },
    bank => { bank.questions[0].options[1].text = bank.questions[0].options[0].text; },
    bank => { bank.questions[0].references[0].sourceId = 'missing'; },
    bank => { bank.questions[0].followUps[0].answer = ''; },
    bank => { bank.sources[0].url = 'javascript:alert(1)'; },
    bank => { bank.sources[0].url = 'https://user:password@example.org/'; },
    bank => { bank.sources[0].accessedAt = '2026-02-30'; },
    bank => { bank.reviewedAt = '2026-13-01'; }
  ]) {
    const invalid = fixture(); mutation(invalid);
    const untouched = new Map([[keys.senior, JSON.stringify(goodSaved)]]);
    await runtime({ bank: invalid, storage: untouched, expectFailure: true });
    assert.equal(untouched.get(keys.senior), JSON.stringify(goodSaved), 'A bad data file must not overwrite stored progress');
  }
  await runtime({ failedHttp: true, expectFailure: true });
  const htmlBank = fixture();
  htmlBank.questions[0].title = '<script>title()</script>';
  htmlBank.questions[0].evidence = ['<img src=x onerror="fail()">'];
  htmlBank.sources[0].title = '<svg onload="fail()">';
  run = await runtime({ bank: htmlBank });
  run.a.startSession(['s001'], 'Escaping'); choose(run, true); run.a.checkAnswer();
  assert(run.html().includes('&lt;script&gt;title()&lt;/script&gt;'));
  assert(run.html().includes('&lt;svg onload=&quot;fail()&quot;&gt;'));
  assert(run.html().includes('https://example.org/primary?first=1&amp;second=2'));
  assert(!run.html().includes('<img src=x') && !run.html().includes('<svg onload='));

  // Help is independent of a case answer, including in interview mode and after a locked choice.
  for(const id of Object.keys(keys)) {
    const vocabularyBank=fixture(id);
    vocabularyBank.questions[0].question='Как защитить API, использующий LLM и RAG?';
    vocabularyBank.questions[0].options[0].text='Проверить JSON tool call перед выполнением';
    const helpRun=await runtime({id,bank:vocabularyBank});
    helpRun.a.startSession([vocabularyBank.questions[0].id],'Справка','interview');
    const main=helpRun.nodes.get('#main');
    let launcher=main.querySelector('[data-term="tool-call"]');assert(launcher);
    const before=helpRun.storage.get(keys[id]);
    const event=main.dispatch('click',{target:launcher});assert(event.defaultPrevented && event.propagationStopped);
    assert(helpRun.nodes.get('#term-dialog').open);
    helpRun.key('1');helpRun.key('Enter');
    assert.equal(helpRun.storage.get(keys[id]),before,'Help must not save or choose an interview answer');
    assert.equal(Object.keys(helpRun.a.get().progress.session.answers).length,0);
    assert(!helpRun.html().includes('SOURCE_SENTINEL') && !helpRun.html().includes('REASONING_SENTINEL'));
    helpRun.nodes.get('#term-dialog').dispatch('cancel');
    assert.equal(helpRun.document.activeElement,launcher);
    helpRun.a.startSession([vocabularyBank.questions[0].id],'Справка','practice');
    choose(helpRun,true);helpRun.a.checkAnswer();
    launcher=main.querySelector('[data-term="tool-call"]');main.dispatch('click',{target:launcher});
    assert(helpRun.nodes.get('#term-dialog').open,'Help must remain usable in checked choices');
    assert.equal(helpRun.a.get().progress.total,1);
    helpRun.nodes.get('#term-close').dispatch('click');
  }
  const checkedBanks = [];
  const selectedBank = process.argv.find(argument => argument.startsWith('--bank='))?.slice('--bank='.length);
  if (selectedBank) assert(Object.hasOwn(keys, selectedBank), 'Unknown --bank value');
  if (!process.argv.includes('--fixtures-only')) {
    for (const [id, expected] of [['senior', 60], ['ai-security', 40], ['scenarios', 36]]) {
      if (selectedBank && selectedBank !== id) continue;
      const filename = path.join(root, bankFiles[id]);
      assert(fs.existsSync(filename), `Published bank is missing: ${filename}`);
      const bank = JSON.parse(fs.readFileSync(filename, 'utf8'));
      const actual = await runtime({ id, bank });
      assert.equal(bank.questions.length, expected);
      assert.equal(new Set(bank.questions.map(question => question.id)).size, expected);
      for (const track of bank.tracks) assert.equal(bank.questions.filter(question => question.track === track.id).length, expected / bank.tracks.length);
      const actualMix = actual.a.mixedIds();
      assert.equal(actualMix.length, 10);
      assert.equal(new Set(actualMix).size, 10);
      const counts = bank.tracks.map(track => actualMix.filter(questionId => actual.a.get().questions.get(questionId).track === track.id).length).sort();
      assert.deepEqual(counts, id === 'scenarios' ? [3, 3, 4] : [2, 2, 3, 3]);
      actual.a.startSession(bank.questions.map(question => question.id), 'Весь реальный банк', 'interview');
      assert.equal(actual.a.get().progress.session.ids.length, expected);
      assert.equal(new Set(actual.a.get().progress.session.ids).size, expected);
      for (let index = 0; index < expected; index++) { actual.a.jump(index); choose(actual, true); }
      actual.a.finishSession();
      assert.equal(actual.a.get().progress.total, expected);
      assert.equal(actual.a.get().progress.correctTotal, expected);
      assert.equal(actual.a.get().progress.errors.size, 0);
      assert(actual.html().includes('Технические источники'));
      checkedBanks.push(`${expected} ${id}`);
    }
  }
  console.log(`Case trainer checks passed: separate storage, 3/3/2/2 and 4/3/3 mixed sets, basis visibility and feedback integration, full-bank shuffle, practice/interview visibility, notes and XSS, resume/scoring, confirmations, migrations, validation, keyboard and responsive markup${process.argv.includes('--fixtures-only') ? ' (fixtures only; published banks not checked)' : `, plus published banks: ${checkedBanks.join(', ')}`}.`);
}
module.exports = { runtime, fixture, choose, assertHidden, keys, plain, htmlEsc };
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });

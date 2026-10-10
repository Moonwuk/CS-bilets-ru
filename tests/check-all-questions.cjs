'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { runtime, choose, plain, htmlEsc, keys } = require('./check-case-trainer.cjs');
const root = path.resolve(__dirname, '..');
const allKey = 'cs-bilets-ru.all-questions.v1';
const baseKey = 'cs-bilets-ru.progress.v1';
const copy = value => JSON.parse(JSON.stringify(value));
const files = ['questions.json', 'ai-security-questions.json', 'scenarios-questions.json'];
const banks = Object.fromEntries(files.map(file => [`./${file}`, JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))]));
banks['./questions.json'] = require('./compliance-fixtures.cjs').composed();
const originals = banks['./questions.json'].questions.concat(banks['./ai-security-questions.json'].questions, banks['./scenarios-questions.json'].questions);
const expectedIds = originals.map(question => question.id).sort();
const count = originals.length;
const current = run => run.a.get().progress;
const boot = options => runtime({ id: 'all-questions', banks, ...options });
const textOnly = markup => markup.replace(/<[^>]*>/g, '');
const tiny = copy(banks);
const legalOriginal = banks['./questions.json'].questions.find(q => q.legal);
tiny['./questions.json'].questions = [banks['./questions.json'].questions[0], banks['./questions.json'].questions.find(q => q.id === 'q005'), legalOriginal];
for (const file of ['ai-security-questions.json', 'scenarios-questions.json']) {
  const bank = tiny[`./${file}`];
  bank.questions = bank.tracks.flatMap(track => bank.questions.filter(q => q.track === track.id).slice(0, 3));
}
const tinyCount = Object.values(tiny).reduce((sum, bank) => sum + bank.questions.length, 0);
const small = options => boot({ banks: tiny, ...options });
const confirm = (run, correct) => { choose(run, correct); run.click('[data-action="check"]'); };
const oldValues = [[baseKey, 'untouched main'], ...Object.values(keys).map(key => [key, `untouched ${key}`])];
function assertOtherBanks(storage) { for (const [key, value] of oldValues) assert.equal(storage.get(key), value); }
function assertTerminalLocked(run) {
  const before = plain(current(run));
  const session = plain(current(run).session);
  choose(run, true); run.a.checkAnswer(); run.a.jump(0); run.a.jump(session.ids.length - 1);
  run.a.finishSession(); run.a.saveNote('Too late'); run.key('1', run.document.body); run.key('Enter', run.document.body);
  assert.deepEqual(plain(current(run)), before, 'Terminal challenge cannot be changed, continued or scored twice');
}

(async () => {
  assert.equal(count, 1091);
  assert.equal(tinyCount, 24);
  const html = fs.readFileSync(path.join(root, 'all-questions.html'), 'utf8');
  assert(html.includes('data-bank="all-questions"'));
  assert(html.indexOf('src="./all-questions.js"') < html.indexOf('src="./case-trainer.js"'));
  assert(!html.includes('src="./app.js"'));
  const storage = new Map(oldValues);
  let run = await boot({ storage });
  assert.equal(run.a.get().dataset.questions.length, count);
  assert.deepEqual(run.fetched, ['./questions.json', './ai-security-questions.json', './scenarios-questions.json']);
  assert(!run.fetched.some(file => file.includes('senior')));
  assert.deepEqual([...run.a.get().questions.keys()].sort(), expectedIds);
  assert(!expectedIds.some(id => /^s\d/.test(id)));
  assert.equal(new Set(run.a.get().dataset.sources.map(source => source.id)).size, run.a.get().dataset.sources.length);
  assert.equal(run.feedback.label, 'Все вопросы');
  assert.equal(run.nodes.get('#main').querySelectorAll('[data-start]').length, 1);
  assert(run.html().includes('data-start="all"'));
  for (const attribute of ['data-mode=', 'data-track=', 'data-start="mixed"', 'data-start="mistakes"']) assert(!run.html().includes(attribute));
  assert(run.html().includes(`Начать все ${count} вопросов`));
  for (const [track, expected] of Object.entries({ basic: 1015, 'ai-security': 40, scenarios: 36 })) assert.equal(run.a.get().dataset.questions.filter(q => q.track === track).length, expected);

  // No duplicated content or invented case material in the aggregate adapter.
  for (const original of originals) {
    const adapted = run.a.get().questions.get(original.id);
    assert.equal(adapted.question, original.question);
    assert.deepEqual(plain(adapted.options), original.options);
    if (original.id.startsWith('q')) {
      assert.equal(adapted.kind, 'basic'); assert.equal(adapted.topic, original.topic);
      assert.equal(adapted.prerequisites, undefined); assert.equal(adapted.reasoning, undefined);
      assert.deepEqual(plain(adapted.sourceIds), (original.sourceIds || []).map(id => `basic:${id}`));
      assert.deepEqual(plain(adapted.interviewSourceIds), (original.interviewSourceIds || []).map(id => `basic:${id}`));
      if (original.legal) {
        assert.equal(adapted.legal.jurisdiction, original.legal.jurisdiction);
        assert.equal(adapted.legal.reviewedAt, original.legal.reviewedAt);
        assert.deepEqual(plain(adapted.legal.references), original.legal.references.map(ref => ({ ...ref, sourceId: `basic:${ref.sourceId}` })));
      }
    } else {
      for (const key of ['title', 'difficulty', 'evidence', 'constraints', 'prerequisites', 'reasoning', 'tradeoffs', 'whatChangesAnswer', 'followUps']) assert.deepEqual(plain(adapted[key]), original[key]);
      assert.equal(adapted.originalTrack, original.track);
      assert.deepEqual(plain(adapted.references), original.references.map(ref => ({ ...ref, sourceId: `${adapted.track}:${ref.sourceId}` })));
      if (original.basis) assert.deepEqual(plain(adapted.basis), original.basis);
    }
  }
  assert.deepEqual(banks, { ...Object.fromEntries(files.map(file => [`./${file}`, JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))])), './questions.json': require('./compliance-fixtures.cjs').composed() });

  // Confirming every actual question advances sequentially; only the final correct answer is success.
  run.click('[data-start="all"]');
  assert.deepEqual([...current(run).session.ids].sort(), expectedIds);
  assert.equal(current(run).session.mode, 'challenge');
  assert.equal(current(run).session.outcome, null);
  run.a.jump(count - 1); run.a.setMode('interview');
  assert.equal(current(run).session.index, 0);
  assert.equal(current(run).mode, 'challenge');
  await run.a.requestStart('mixed'); await run.a.requestStart('track', 'basic');
  assert.equal(current(run).session.index, 0);
  assert.equal(current(run).session.ids.length, count);
  run.key('Enter', run.document.body);
  assert.equal(current(run).session.index, 0, 'Enter without a selection cannot skip');
  const privacySeen = new Set();
  for (let index = 0; index < count; index++) {
    const session = current(run).session;
    assert.equal(session.index, index);
    assert.equal(session.checked.size, index);
    assert.equal(session.finished, false);
    assert(!run.html().includes('data-jump=') && !run.html().includes('data-action="next"'));
    const id = session.ids[index];
    if (['ai001', 'sc001', legalOriginal.id, 'q358'].includes(id)) {
      const original = originals.find(q => q.id === id);
      const text = textOnly(run.html());
      for (const fact of [...(original.evidence || []), ...(original.constraints || [])]) assert(text.includes(htmlEsc(fact)));
      assert(!run.html().includes('class="case-review"') && !run.html().includes('Опорные понятия'));
      if (original.basis) assert(!run.html().includes(htmlEsc(original.basis.identifiers[0])));
      if (original.legal) {
        assert(run.html().includes(`datetime="${original.legal.reviewedAt}"`));
        for (const ref of original.legal.references) assert(!run.html().includes(htmlEsc(ref.locator)));
      }
      assert.equal(run.nodes.get('#main').querySelector('[data-question-feedback="error"]').dataset.questionId, id);
      const trigger = run.nodes.get('#main').querySelector('[data-term]');
      if (id !== legalOriginal.id) assert(trigger);
      const before = storage.get(allKey);
      if (trigger) {
        run.nodes.get('#main').dispatch('click', { target: trigger });
        run.key('1', run.document.body); run.key('Enter', run.document.body);
        assert(run.nodes.get('#term-dialog').open);
        assert.equal(storage.get(allKey), before, 'Help does not confirm a challenge answer');
        run.nodes.get('#term-close').dispatch('click');
      }
      run.feedback.open = true; run.key('1', run.document.body); run.key('Enter', run.document.body);
      assert.equal(storage.get(allKey), before, 'Feedback does not confirm a challenge answer');
      run.feedback.open = false;
      privacySeen.add(id);
    }
    choose(run, true);
    assert.equal(current(run).total, index, 'Selecting is not confirmation');
    run.click('[data-action="check"]');
    assert.equal(current(run).total, index + 1);
    assert.equal(current(run).correctTotal, index + 1);
    assert.equal(current(run).session.finished, index === count - 1);
  }
  assert.equal(privacySeen.size, 4);
  assert.equal(current(run).session.outcome, 'passed');
  assert.equal(current(run).completed, 1);
  assert.equal(current(run).errors.size, 0);
  assert(run.html().includes('Билет пройден без ошибок'));
  assert(run.html().includes('Источник: infosec_interview.docx.'));
  assert.equal(run.nodes.get('#main').querySelectorAll('[data-question-feedback="error"]').length, count);
  const reviewText = textOnly(run.html());
  for (const option of legalOriginal.options) assert(reviewText.includes(htmlEsc(option.explanation)));
  for (const ref of legalOriginal.legal.references) assert(run.html().includes(htmlEsc(ref.locator)));
  assertTerminalLocked(run);
  const passedSnapshot = plain(current(run).session);
  run = await boot({ storage });
  assert.deepEqual(plain(current(run).session), passedSnapshot);
  assertTerminalLocked(run);
  assertOtherBanks(storage);

  // First, middle and final errors terminate immediately; no unseen item is scored or marked wrong.
  let failedSaved;
  for (const wrongAt of [0, 7, tinyCount - 1]) {
    const local = new Map(oldValues);
    let challenge = await small({ storage: local });
    challenge.a.startSession(['q001'], 'Attempt to start a subset', 'practice');
    assert.equal(current(challenge).session.ids.length, tinyCount, 'All starts use the complete current bank');
    for (let i = 0; i < wrongAt; i++) confirm(challenge, true);
    const id = current(challenge).session.ids[wrongAt];
    const q = challenge.a.get().questions.get(id);
    challenge.a.saveNote('Обоснование перед ошибкой');
    choose(challenge, false);
    assert.equal(current(challenge).session.finished, false);
    assert.equal(current(challenge).total, wrongAt);
    challenge.click('[data-action="check"]');
    assert.equal(current(challenge).session.finished, true);
    assert.equal(current(challenge).session.outcome, 'failed');
    assert.equal(current(challenge).session.index, wrongAt);
    assert.equal(current(challenge).session.checked.size, wrongAt + 1);
    assert.equal(current(challenge).total, wrongAt + 1);
    assert.equal(current(challenge).correctTotal, wrongAt);
    assert.equal(current(challenge).completed, 1);
    assert.deepEqual([...current(challenge).errors], [id]);
    assert(challenge.html().includes('Разбор ошибки'));
    const failedPanel = challenge.html().split('<h2>Разбор ошибки</h2>')[1].split('<h2>Разбор подтверждённых')[0];
    assert(failedPanel.includes(htmlEsc(q.options.find(option => !option.correct).explanation).split('<')[0]) || textOnly(failedPanel).includes(htmlEsc(q.options.find(option => !option.correct).explanation)));
    assert(challenge.html().includes('Обоснование перед ошибкой'));
    assert(!failedPanel.startsWith('<details'), 'The failed question review must be immediately expanded');
    assert.equal(challenge.nodes.get('#main').querySelectorAll('[data-question-feedback="error"]').length, wrongAt + 1);
    assertTerminalLocked(challenge);
    const snapshot = plain(current(challenge).session);
    failedSaved = JSON.parse(local.get(allKey));
    challenge = await small({ storage: local, seed: 2027 + wrongAt });
    assert.deepEqual(plain(current(challenge).session), snapshot);
    assertTerminalLocked(challenge);
    challenge.a.goHome(); challenge.click('[data-action="resume"]');
    assert.equal(current(challenge).session.outcome, 'failed', 'Resume opens the terminal result, not a live attempt');
    const oldIds = [...current(challenge).session.ids], oldOrders = plain(current(challenge).session.orders);
    challenge.click('[data-action="retry"]');
    assert.equal(current(challenge).session.ids.length, tinyCount);
    assert.notDeepEqual([...current(challenge).session.ids], oldIds);
    assert.notDeepEqual(plain(current(challenge).session.orders), oldOrders);
    assert.equal(current(challenge).session.outcome, null);
    assert.equal(current(challenge).session.index, 0);
    assert.equal(current(challenge).session.checked.size, 0);
    assertOtherBanks(local);
  }

  // Pausing retains the pending selection and note without scoring it or reshuffling the ticket.
  const pausedStore = new Map(oldValues);
  let paused = await small({ storage: pausedStore }); paused.click('[data-start="all"]');
  confirm(paused, true); confirm(paused, true); choose(paused, false); paused.a.saveNote('Ещё не подтверждено');
  const pending = plain(current(paused).session);
  paused.a.goHome();
  assert.equal(current(paused).total, 2);
  paused = await small({ storage: pausedStore });
  assert.equal(current(paused).view, 'home');
  assert.deepEqual(plain(current(paused).session), pending);
  paused.key('Enter', paused.document.body); assert.equal(current(paused).total, 2);
  paused.click('[data-action="resume"]');
  assert.deepEqual(plain(current(paused).session), pending);
  const goodSaved = JSON.parse(pausedStore.get(allKey));
  const cancel = paused.a.requestFinish();
  paused.nodes.get('#dialog-cancel').dispatch('click'); await cancel;
  assert.deepEqual(plain(current(paused).session), pending);
  const stop = paused.a.requestFinish();
  paused.nodes.get('#dialog-ok').dispatch('click'); await stop;
  assert.equal(current(paused).session.outcome, 'stopped');
  assert.equal(current(paused).total, 2); assert.equal(current(paused).correctTotal, 2);
  assert.equal(current(paused).errors.size, 0);
  assert.equal(Object.keys(current(paused).session.answers).length, 2, 'Unconfirmed selection is not scored');
  assert(paused.html().includes('Билет не пройден'));
  assertTerminalLocked(paused);
  paused = await small({ storage: pausedStore });
  assert.equal(current(paused).session.outcome, 'stopped');
  assert.equal(current(paused).total, 2);
  assertOtherBanks(pausedStore);
  const emptyStop = await small(); emptyStop.click('[data-start="all"]'); emptyStop.a.finishSession();
  assert.equal(current(emptyStop).session.outcome, 'stopped');
  assert.equal(current(emptyStop).total, 0); assert.equal(current(emptyStop).errors.size, 0);

  // Sequential prefixes and terminal reasons are part of the persisted rule, not merely hidden UI.
  for (const mutate of [
    saved => { saved.session.checked.reverse(); },
    saved => { saved.session.checked[0] = saved.session.ids[3]; },
    saved => { saved.session.index++; },
    saved => { saved.session.ids.pop(); },
    saved => { saved.session.answers[saved.session.ids[5]] = 0; },
    saved => { delete saved.session.answers[saved.session.ids[0]]; },
    saved => { saved.session.answers[saved.session.ids[0]] = tiny['./questions.json'].questions.find(q => q.id === saved.session.ids[0])?.options.findIndex(o => !o.correct) ?? -1; },
    saved => { saved.session.outcome = 'passed'; },
    saved => { saved.session.finished = true; saved.session.outcome = 'passed'; saved.completed = 1; },
    saved => { saved.session.mode = 'interview'; },
    saved => { saved.session.notes[saved.session.ids[6]] = 'future'; }
  ]) {
    const invalid = copy(goodSaved); mutate(invalid);
    const loaded = await small({ storage: new Map([[allKey, JSON.stringify(invalid)]]) });
    assert.equal(current(loaded).session, null);
    assert(loaded.a.get().notice);
  }
  for (const mutate of [
    saved => { saved.session.finished = false; saved.session.outcome = null; },
    saved => { saved.session.finished = false; saved.session.outcome = null; saved.session.index = saved.session.checked.length; },
    saved => { saved.session.outcome = 'passed'; },
    saved => { saved.errors = []; }
  ]) {
    const invalid = copy(failedSaved); mutate(invalid);
    const loaded = await small({ storage: new Map([[allKey, JSON.stringify(invalid)]]) });
    assert.equal(current(loaded).session, null, 'Cannot resurrect or relabel a failed ticket');
  }
  const legacy = copy(goodSaved); delete legacy.challengeVersion; legacy.session.mode = 'practice'; delete legacy.session.outcome;
  const legacyStore = new Map([...oldValues, [allKey, JSON.stringify(legacy)]]);
  const migrated = await small({ storage: legacyStore });
  assert.equal(current(migrated).session, null); assert.equal(current(migrated).total, 0);
  assert.equal(current(migrated).correctTotal, 0); assert.equal(current(migrated).errors.size, 0);
  assert(migrated.a.get().notice.includes('Правила общей попытки изменились'));
  assertOtherBanks(legacyStore);

  // Any fetch/schema failure rejects the entire aggregate and never overwrites saved challenge state.
  for (const file of files) {
    const local = new Map([[allKey, JSON.stringify(goodSaved)]]);
    await small({ storage: local, failedFile: `./${file}`, expectFailure: true });
    assert.equal(local.get(allKey), JSON.stringify(goodSaved));
  }
  for (const mutate of [
    all => { all['./questions.json'].questions[1].id = all['./questions.json'].questions[0].id; },
    all => { all['./questions.json'].questions[0].options[1].correct = true; },
    all => { all['./questions.json'].sources[0].url = 'javascript:alert(1)'; },
    all => { delete all['./questions.json'].questions.find(q => q.legal).legal; },
    all => { all['./ai-security-questions.json'].tracks.pop(); },
    all => { all['./ai-security-questions.json'].questions[0].reasoning = []; },
    all => { all['./ai-security-questions.json'].reviewedAt = '2026-02-30'; },
    all => { all['./scenarios-questions.json'].questions[0].basis.family = 'wrong'; },
    all => { all['./scenarios-questions.json'].questions[0].references[0].sourceId = 'missing'; }
  ]) {
    const changed = copy(tiny); mutate(changed);
    const local = new Map([[allKey, JSON.stringify(goodSaved)]]);
    await small({ banks: changed, storage: local, expectFailure: true });
    assert.equal(local.get(allKey), JSON.stringify(goodSaved));
  }
  const reset = run.a.resetProgress(); run.nodes.get('#dialog-ok').dispatch('click'); await reset;
  assert.equal(current(run).total, 0); assert.equal(current(run).session, null);
  assertOtherBanks(storage);
  console.log(`All-questions challenge checks passed: complete ${count}-question ticket, first/middle/last error ends immediately, confirmed-only scoring, no skipping, explicit stop vs success, terminal reload locks, full retry shuffle, pause/notes/help/feedback, strict saved prefix/outcome, legacy migration, source preservation and atomic loading.`);
})().catch(error => { console.error(error); process.exitCode = 1; });

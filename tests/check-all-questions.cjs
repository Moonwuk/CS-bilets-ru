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
const originals = banks['./questions.json'].questions.concat(banks['./ai-security-questions.json'].questions, banks['./scenarios-questions.json'].questions);
const expectedIds = originals.map(question => question.id).sort();
const count = originals.length;
const expectedCounts = { basic: 600, 'ai-security': 40, scenarios: 36 };
const current = run => run.a.get().progress;
const boot = options => runtime({ id: 'all-questions', banks, ...options });
function plainText(markup) { return markup.replace(/<[^>]*>/g, ''); }

(async () => {
  assert.equal(count, 676);
  const html = fs.readFileSync(path.join(root, 'all-questions.html'), 'utf8');
  assert(html.includes('data-bank="all-questions"'));
  assert(html.includes('src="./all-questions.js" defer'));
  assert(html.indexOf('src="./all-questions.js"') < html.indexOf('src="./case-trainer.js"'));
  assert(!html.includes('src="./app.js"'));
  const oldValues = [[baseKey, 'untouched main progress'], ...Object.values(keys).map(key => [key, `untouched ${key}`])];
  const storage = new Map(oldValues);
  let run = await boot({ storage });
  assert.equal(run.a.get().dataset.questions.length, count);
  assert.equal(run.fetched.length, 3);
  assert(!run.fetched.some(file => file.includes('senior')));
  assert.equal(new Set(run.a.get().dataset.sources.map(source => source.id)).size, run.a.get().dataset.sources.length);
  assert.deepEqual([...run.a.get().questions.keys()].sort(), expectedIds);
  assert(![...run.a.get().questions.keys()].some(id => /^s\d/.test(id)));
  assert(run.html().includes(`<strong>${count}</strong> вопросов`));
  assert(run.html().includes('>Экзамен</button>'));
  assert.equal(run.feedback.label, 'Все вопросы');
  for (const [track, expected] of Object.entries(expectedCounts)) assert.equal(run.a.get().dataset.questions.filter(q => q.track === track).length, expected);

  // Original wording, answer keys, explanations and every detailed scenario field survive adaptation.
  for (const original of originals) {
    const adapted = run.a.get().questions.get(original.id);
    assert.equal(adapted.question, original.question);
    assert.deepEqual(plain(adapted.options), original.options);
    if (original.id.startsWith('q')) {
      assert.equal(adapted.kind, 'basic');
      assert.equal(adapted.topic, original.topic);
      assert.equal(adapted.difficulty, original.difficulty);
      assert.equal(adapted.prerequisites, undefined);
      assert.equal(adapted.reasoning, undefined, 'Do not invent reasoning for basic questions');
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
  assert.deepEqual(banks, Object.fromEntries(files.map(file => [`./${file}`, JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))])), 'Adapter must not mutate the underlying banks');

  // The visible full-bank action includes every original ID exactly once; a new attempt reshuffles.
  run.click('[data-start="all"]');
  assert.equal(current(run).session.ids.length, count);
  assert(run.html().includes('quiz-map case-map long-session'), 'A long attempt needs a bounded navigation grid');
  assert.deepEqual([...current(run).session.ids].sort(), expectedIds);
  const firstIds = [...current(run).session.ids];
  const firstOrders = plain(current(run).session.orders);
  run.a.startSession(expectedIds, 'Весь банк');
  assert.notDeepEqual([...current(run).session.ids], firstIds);
  assert.notDeepEqual(plain(current(run).session.orders), firstOrders);
  const secondIds = [...current(run).session.ids];
  choose(run, false); run.a.checkAnswer(); run.a.saveNote('Сохранить рассуждение общей попытки');
  run.a.jump(count - 1);
  const snapshot = plain(current(run).session);
  run = await boot({ storage });
  assert.deepEqual(plain(current(run).session), snapshot);
  assert.deepEqual([...current(run).session.ids], secondIds);
  assert.equal(current(run).total, 1);
  for (const [key, value] of oldValues) assert.equal(storage.get(key), value);
  const ten = run.a.mixedIds();
  const distribution = [...run.a.get().tracks.keys()].map(track => ten.filter(id => run.a.get().questions.get(id).track === track).length).sort();
  assert.deepEqual(distribution, [3, 3, 4]);

  // Basic questions have no fabricated case body. Sources/locators/notes stay hidden until review;
  // legal jurisdiction and date remain visible because they qualify the question itself.
  const legalOriginal = banks['./questions.json'].questions.find(q => q.legal);
  run.a.startSession([legalOriginal.id], 'Правовая задача', 'interview');
  assert(!run.html().includes('Известные факты') && !run.html().includes('Опорные понятия'));
  assert(run.html().includes(`datetime="${legalOriginal.legal.reviewedAt}"`));
  for (const ref of legalOriginal.legal.references) assert(!run.html().includes(htmlEsc(ref.locator)));
  choose(run, true); run.a.checkAnswer();
  assert(!run.html().includes('class="case-review"'));
  run.a.finishSession();
  for (const ref of legalOriginal.legal.references) assert(run.html().includes(htmlEsc(ref.locator)));
  const legalText = plainText(run.html());
  for (const option of legalOriginal.options) assert(legalText.includes(htmlEsc(option.explanation)), 'All original explanations appear in review');
  assert(!run.html().includes('<h3>Ход рассуждений</h3>'));
  assert.equal(run.nodes.get('#main').querySelector('[data-question-feedback="error"]').dataset.questionId, legalOriginal.id);
  run.a.startSession(['q005'], 'Исходный документ', 'practice'); choose(run, true); run.a.checkAnswer();
  assert(run.html().includes('Источник: infosec_interview.docx.'));
  assert(run.nodes.get('#main').querySelector('[data-term]'), 'Basic questions retain clickable terms');

  for (const id of ['ai001', 'sc001']) {
    const original = originals.find(q => q.id === id);
    run.a.startSession([id], 'Сценарий', 'interview');
    const text = plainText(run.html());
    for (const fact of [...original.evidence, ...original.constraints]) assert(text.includes(htmlEsc(fact)));
    assert(!run.html().includes('class="case-review"'));
    if (original.basis) assert(!run.html().includes(htmlEsc(original.basis.identifiers[0])));
    const trigger = run.nodes.get('#main').querySelector('[data-term]');
    assert(trigger);
    const before = storage.get(allKey);
    run.nodes.get('#main').dispatch('click', { target: trigger });
    assert(run.nodes.get('#term-dialog').open);
    run.key('1', run.document.body); run.key('Enter', run.document.body);
    assert.equal(storage.get(allKey), before, 'Term help must not choose an aggregate answer');
    run.nodes.get('#term-close').dispatch('click');
    choose(run, true); run.a.saveNote('Моё обоснование');
    const saved = plain(current(run).session);
    run = await boot({ storage });
    assert.deepEqual(plain(current(run).session), saved);
    assert(!run.html().includes('class="case-review"'));
    run.a.finishSession();
    assert(run.html().includes('<h3>Ход рассуждений</h3>'));
    assert(run.html().includes('<h3>Компромиссы и остаточные риски</h3>'));
    assert(run.html().includes('Моё обоснование'));
    assert.equal(run.nodes.get('#main').querySelector('[data-question-feedback="error"]').dataset.questionId, id);
    if (original.basis) assert(run.html().includes(htmlEsc(original.basis.identifiers[0])));
  }

  // A failure in any constituent file must fail the complete bank and preserve existing progress.
  for (const file of files) {
    const before = storage.get(allKey);
    await boot({ storage, failedFile: `./${file}`, expectFailure: true });
    assert.equal(storage.get(allKey), before);
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
    const changed = copy(banks); mutate(changed);
    const before = storage.get(allKey);
    await boot({ banks: changed, storage, expectFailure: true });
    assert.equal(storage.get(allKey), before);
  }

  // Complete a real aggregate attempt: all IDs can be answered, scored and reviewed together.
  run = await boot({ storage });
  run.a.startSession(expectedIds, 'Все вопросы', 'interview');
  for (let index = 0; index < count; index++) { run.a.jump(index); choose(run, true); }
  const beforeTotal = current(run).total;
  const beforeCorrect = current(run).correctTotal;
  run.a.finishSession();
  assert.equal(current(run).total, beforeTotal + count);
  assert.equal(current(run).correctTotal, beforeCorrect + count);
  assert.equal(current(run).errors.size, 0);
  assert(run.html().includes('Разбор всех вопросов'));
  assert.equal(run.nodes.get('#main').querySelectorAll('[data-question-feedback="error"]').length, count);
  run.a.finishSession(); assert.equal(current(run).total, beforeTotal + count);
  const reset = run.a.resetProgress();
  run.nodes.get('#dialog-ok').dispatch('click'); await reset;
  assert.equal(current(run).total, 0); assert.equal(current(run).session, null);
  for (const [key, value] of oldValues) assert.equal(storage.get(key), value);
  console.log(`All-questions checks passed: ${count} original IDs (600 basic + 40 AI + 36 situations), no senior load, source/answer preservation, shuffle/resume, isolated progress, legal context and review privacy, term help, feedback IDs, atomic load failure and full scoring.`);
})().catch(error => { console.error(error); process.exitCode = 1; });

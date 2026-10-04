'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { runtime, choose, plain, keys } = require('./check-case-trainer.cjs');
const root = path.resolve(__dirname, '..');
const copy = value => JSON.parse(JSON.stringify(value));
const files = ['questions.json', 'ai-security-questions.json', 'scenarios-questions.json'];
const banks = Object.fromEntries(files.map(file => [`./${file}`, JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))]));
const wheelKey = 'cs-bilets-ru.topic-wheel.v1';
const oldValues = [['cs-bilets-ru.progress.v1', 'keep basic'], ['cs-bilets-ru.all-questions.v1', 'keep first-error'], ...Object.values(keys).map(key => [key, `keep ${key}`])];
const state = run => run.a.get().progress;
const htmlEsc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const textOnly = markup => markup.replace(/<[^>]*>/g, '');
const immediateView = { markup: topics => `<div data-wheel-count="${topics.length}"></div>`, animate: () => Promise.resolve() };
const boot = options => runtime({ id: 'topic-wheel', banks, wheelView: immediateView, ...options });
const confirm = (run, correct) => { choose(run, correct); run.click('[data-action="check"]'); };
const othersIntact = storage => { for (const [key, value] of oldValues) assert.equal(storage.get(key), value); };
function assertHiddenResults(run) {
  assert(!run.html().includes('class="case-review"'));
  assert(!run.html().includes('id="case-feedback"'));
  assert(!run.html().includes('Правильный ответ'));
  assert(!/locked (good|bad)/.test(run.html()));
  assert.equal(run.nodes.get('#stat-correct').textContent, 'После темы');
  assert.equal(run.nodes.get('#stat-errors').textContent, 'После темы');
  assert(!/Верно|Есть ошибка|Неверный/.test(run.nodes.get('#announcement').textContent));
}
async function finishPerfect(run) {
  while (!state(run).session.finished) {
    confirm(run, true);
    if (!state(run).session.finished) run.click('[data-action="next"]');
  }
}
function deferredView() {
  let release, calls = 0, selected;
  return {
    markup: immediateView.markup,
    animate(container, topics, selectedId) { calls++; selected = selectedId; return new Promise(resolve => { release = resolve; }); },
    release() { release(); }, get calls() { return calls; }, get selected() { return selected; }
  };
}

(async () => {
  const html = fs.readFileSync(path.join(root, 'topic-wheel.html'), 'utf8');
  assert(html.includes('data-bank="topic-wheel"'));
  for (const name of ['all-questions.js', 'wheel-visual.js', 'case-trainer.js']) assert(html.includes(`src="./${name}" defer`));
  const loaderContext = { window: {}, fetch: async url => ({ ok: true, json: async () => copy(banks[url]) }) };
  vm.createContext(loaderContext); vm.runInContext(fs.readFileSync(path.join(root, 'all-questions.js'), 'utf8'), loaderContext);
  const defaultBefore = await loaderContext.window.TrainerAllQuestions.load();
  const enriched = await loaderContext.window.TrainerAllQuestions.load({ includeTopics: true });
  const defaultAfter = await loaderContext.window.TrainerAllQuestions.load();
  assert(!Object.hasOwn(defaultBefore, 'topicGroups'));
  assert.equal(JSON.stringify(defaultBefore), JSON.stringify(defaultAfter), 'Opt-in topics must not change default all-questions data or its saved signature');
  const noGroups = { ...enriched }; delete noGroups.topicGroups;
  assert.equal(JSON.stringify(defaultBefore), JSON.stringify(noGroups));

  const storage = new Map(oldValues);
  let run = await boot({ storage });
  const groups = run.a.get().dataset.topicGroups;
  assert.equal(groups.length, 43);
  assert.deepEqual(['basic', 'ai-security', 'scenarios'].map(id => groups.filter(group => group.bankId === id).length), [36, 4, 3]);
  const assigned = groups.flatMap(group => group.questionIds);
  assert.equal(assigned.length, 676); assert.equal(new Set(assigned).size, 676);
  assert.deepEqual([...assigned].sort(), Object.values(banks).flatMap(bank => bank.questions.map(q => q.id)).sort());
  assert(!run.fetched.some(url => url.includes('senior')));
  for (const group of groups) {
    if (group.bankId === 'basic') { assert(banks['./questions.json'].topics.includes(group.title)); assert.equal(group.id, `basic:${encodeURIComponent(group.title)}`); }
    else assert.equal(group.title, banks[`./${group.bankId}-questions.json`].tracks.find(track => `${group.bankId}:${track.id}` === group.id).title);
  }
  assert(!run.html().includes('Первая ошибка завершает'));
  assert(run.html().includes('Ошибка не прерывает тему'));
  assert.equal(run.feedback.label, 'Барабан тем');
  const initialStats = [state(run).total, state(run).completed];
  run.a.startSession(['q001'], 'Cannot select a custom subset');
  assert.equal(state(run).session, null);
  assert.deepEqual([state(run).total, state(run).completed], initialStats);

  // The draw is persisted before the view runs, and a second click cannot change it.
  const delayed = deferredView();
  run = await boot({ storage, wheelView: delayed });
  const spinning = run.a.spinWheel();
  assert.equal(delayed.calls, 1);
  const persisted = JSON.parse(storage.get(wheelKey));
  assert.equal(persisted.pendingSpin, true);
  assert.equal(persisted.selectedTopicId, delayed.selected);
  assert.equal(persisted.session.checked.length, 0);
  const selectedIds = groups.find(group => group.id === persisted.selectedTopicId).questionIds;
  assert.deepEqual([...persisted.session.ids].sort(), [...selectedIds].sort());
  await run.a.spinWheel();
  assert.equal(delayed.calls, 1);
  assert.equal(storage.get(wheelKey), JSON.stringify(persisted));
  assert(run.nodes.get('#main').querySelector('[data-action="spin"]').disabled);
  const savedPending = storage.get(wheelKey);
  const pendingSnapshot = plain(state(run).session);
  let resumed = await boot({ storage: new Map([...oldValues, [wheelKey, savedPending]]) });
  assert.equal(state(resumed).selectedTopicId, persisted.selectedTopicId);
  assert.deepEqual(plain(state(resumed).session), pendingSnapshot);
  assert.equal(state(resumed).pendingSpin, false);
  assert.equal(state(resumed).view, 'session');
  delayed.release(); await spinning;
  assert.equal(state(run).selectedTopicId, persisted.selectedTopicId);
  assert.equal(state(run).pendingSpin, false);

  // A wrong answer is immutable after confirmation but does not terminate the topic.
  const firstId = state(run).session.ids[0];
  const firstWrong = choose(run, false).index;
  assert.equal(state(run).total, 0);
  run.click('[data-action="check"]');
  assert.equal(state(run).session.finished, false);
  assert.equal(state(run).session.checked.size, 1);
  assert.equal(state(run).errors.has(firstId), true);
  assert.equal(state(run).clearedTopics.size, 0);
  assertHiddenResults(run);
  choose(run, true); run.a.checkAnswer();
  assert.equal(state(run).session.answers[firstId], firstWrong);
  assert.equal(state(run).total, 1);
  run.a.jump(999);
  assert.equal(state(run).session.index, 0);
  run.click('[data-action="next"]');
  assert.equal(state(run).session.index, 1);
  run.a.nextWheelQuestion();
  assert.equal(state(run).session.index, 1, 'Cannot skip an unanswered question');
  choose(run, true); run.a.saveNote('Продолжить позже');
  const pauseSnapshot = plain(state(run).session);
  const selectedTopic = state(run).selectedTopicId;
  run.a.goHome();
  assertHiddenResults(run);
  assert(run.nodes.get('#main').querySelector('[data-action="spin"]').disabled);
  await run.a.spinWheel(); assert.equal(state(run).selectedTopicId, selectedTopic);
  run = await boot({ storage });
  assert.deepEqual(plain(state(run).session), pauseSnapshot);
  assert.equal(state(run).view, 'home');
  assertHiddenResults(run);
  run.click('[data-action="resume"]');
  run.click('[data-action="check"]');
  if (!state(run).session.finished) run.click('[data-action="next"]');
  await finishPerfect(run);
  assert.equal(state(run).session.outcome, 'failed');
  assert.equal(state(run).clearedTopics.size, 0);
  assert(run.a.eligibleWheelTopics().some(group => group.id === selectedTopic));
  const failedSnapshot = plain(state(run).session), totalAfterFailed = state(run).total;
  run.a.finishSession(); run.a.checkAnswer(); choose(run, true);
  assert.deepEqual(plain(state(run).session), failedSnapshot);
  assert.equal(state(run).total, totalAfterFailed);
  run = await boot({ storage });
  assert.equal(state(run).session.outcome, 'failed');
  assert.equal(state(run).clearedTopics.size, 0);

  // An early stop does not clear the topic or score a pending selection.
  await run.a.spinWheel();
  const earlyTopic = state(run).selectedTopicId;
  choose(run, false); run.a.saveNote('Не подтверждено');
  const stopBefore = state(run).total;
  const cancelled = run.a.requestFinish(); run.nodes.get('#dialog-cancel').dispatch('click'); await cancelled;
  assert.equal(state(run).session.finished, false);
  const stop = run.a.requestFinish(); run.nodes.get('#dialog-ok').dispatch('click'); await stop;
  assert.equal(state(run).session.outcome, 'stopped');
  assert.equal(state(run).total, stopBefore);
  assert.equal(state(run).session.checked.size, 0);
  assert.equal(state(run).clearedTopics.size, 0);
  assert(run.a.eligibleWheelTopics().some(group => group.id === earlyTopic));
  run = await boot({ storage });
  assert.equal(state(run).session.outcome, 'stopped');

  // Finishing every real topic perfectly covers all 676 questions and clears exactly 43 topics.
  let confirmedThisRound = 0;
  const clearedOrder = new Set();
  const legalId = banks['./questions.json'].questions.find(question => question.legal).id;
  const privacyIds = new Set(['ai001', 'sc001', 'q358', legalId]);
  const privacySeen = new Set();
  while (state(run).clearedTopics.size < groups.length) {
    await run.a.spinWheel();
    const topicId = state(run).selectedTopicId;
    assert(!clearedOrder.has(topicId), 'A cleared topic must never be drawn again');
    const group = groups.find(group => group.id === topicId);
    assert.deepEqual([...state(run).session.ids].sort(), [...group.questionIds].sort());
    const before = state(run).clearedTopics.size;
    const length = state(run).session.ids.length;
    for (let index = 0; index < length; index++) {
      assert.equal(state(run).session.index, index);
      assert.equal(state(run).clearedTopics.size, before);
      const id = state(run).session.ids[index];
      const question = run.a.get().questions.get(id);
      if (privacyIds.has(id)) {
        const text = textOnly(run.html());
        for (const fact of [...(question.evidence || []), ...(question.constraints || [])]) assert(text.includes(htmlEsc(fact)));
        assert(!run.html().includes('class="case-review"'));
        if (question.basis) assert(!run.html().includes(htmlEsc(question.basis.identifiers[0])));
        if (question.legal) {
          assert(run.html().includes(`datetime="${question.legal.reviewedAt}"`));
          for (const ref of question.legal.references) assert(!run.html().includes(htmlEsc(ref.locator)));
        }
        assert.equal(run.nodes.get('#main').querySelector('[data-question-feedback="error"]').dataset.questionId, id);
        const trigger = run.nodes.get('#main').querySelector('[data-term]');
        if (id !== legalId) assert(trigger);
        const beforeHelp = storage.get(wheelKey);
        if (trigger) {
          run.nodes.get('#main').dispatch('click', { target: trigger });
          run.key('1', run.document.body); run.key('Enter', run.document.body);
          assert(run.nodes.get('#term-dialog').open);
          assert.equal(storage.get(wheelKey), beforeHelp);
          run.nodes.get('#term-close').dispatch('click');
        }
        run.feedback.open = true; run.key('1', run.document.body); run.key('Enter', run.document.body);
        assert.equal(storage.get(wheelKey), beforeHelp);
        run.feedback.open = false;
        privacySeen.add(id);
      }
      confirm(run, true); confirmedThisRound++;
      if (!state(run).session.finished) assertHiddenResults(run);
      if (privacyIds.has(id) && state(run).session.finished) {
        const text = textOnly(run.html());
        for (const option of question.options) assert(text.includes(htmlEsc(option.explanation)));
        for (const ref of question.references) assert(run.html().includes(htmlEsc(run.a.get().sources.get(ref.sourceId).url)));
        if (question.basis) assert(run.html().includes(htmlEsc(question.basis.identifiers[0])));
        if (question.legal) for (const ref of question.legal.references) assert(run.html().includes(htmlEsc(ref.locator)));
      }
      if (index < length - 1) {
        assert.equal(state(run).session.finished, false);
        assert.equal(state(run).clearedTopics.size, before);
        run.click('[data-action="next"]');
      }
    }
    assert.equal(state(run).session.outcome, 'passed');
    assert(run.html().includes('class="case-review"'));
    assert.equal(run.nodes.get('#stat-correct').textContent, state(run).correctTotal);
    assert.equal(state(run).clearedTopics.size, before + 1);
    assert(state(run).clearedTopics.has(topicId));
    clearedOrder.add(topicId);
    const checkedTotal = state(run).total;
    run.a.checkAnswer(); run.a.finishSession();
    assert.equal(state(run).total, checkedTotal);
    run = await boot({ storage });
    assert.equal(state(run).session.outcome, 'passed');
    assert.equal(state(run).clearedTopics.size, before + 1);
  }
  assert.equal(confirmedThisRound, 676);
  assert.equal(privacySeen.size, privacyIds.size);
  assert.equal(clearedOrder.size, 43);
  assert.equal(run.a.eligibleWheelTopics().length, 0);
  assert(run.html().includes('Все темы пройдены!'));
  const wonSaved = storage.get(wheelKey);
  await run.a.spinWheel(); assert.equal(storage.get(wheelKey), wonSaved);
  const cancelRound = run.a.requestNewWheelRound(); run.nodes.get('#dialog-cancel').dispatch('click'); await cancelRound;
  assert.equal(storage.get(wheelKey), wonSaved);
  const totalAtWin = state(run).total;
  const newRound = run.a.requestNewWheelRound(); run.nodes.get('#dialog-ok').dispatch('click'); await newRound;
  assert.equal(state(run).clearedTopics.size, 0); assert.equal(state(run).session, null);
  assert.equal(state(run).total, totalAtWin);
  assert.equal(run.a.eligibleWheelTopics().length, 43);
  othersIntact(storage);

  // Reset during animation cannot be undone by a late animation completion.
  const resetView = deferredView(), resetStore = new Map(oldValues);
  const resetRun = await boot({ storage: resetStore, wheelView: resetView });
  const pendingResetSpin = resetRun.a.spinWheel();
  const reset = resetRun.a.resetProgress(); resetRun.nodes.get('#dialog-ok').dispatch('click'); await reset;
  assert.equal(state(resetRun).session, null);
  assert.equal(resetRun.nodes.get('#main').querySelector('[data-action="spin"]').disabled, false);
  resetView.release(); await pendingResetSpin;
  assert.equal(state(resetRun).session, null);
  assert.equal(state(resetRun).pendingSpin, false);
  othersIntact(resetStore);

  // Corrupt saves cannot clear an unfinished topic or attach another topic's answers.
  const seedStore = new Map(); let seedRun = await boot({ storage: seedStore }); await seedRun.a.spinWheel(); confirm(seedRun, true);
  const good = JSON.parse(seedStore.get(wheelKey));
  for (const mutate of [
    saved => { saved.clearedTopicIds = [saved.selectedTopicId]; },
    saved => { saved.clearedTopicIds = ['unknown']; },
    saved => { saved.selectedTopicId = groups.find(group => group.id !== saved.selectedTopicId).id; },
    saved => { saved.session.ids.pop(); },
    saved => { saved.session.checked = [saved.session.ids[1]]; },
    saved => { saved.session.index += 2; },
    saved => { saved.session.outcome = 'passed'; saved.session.finished = true; },
    saved => { saved.pendingSpin = true; },
    saved => { saved.session.answers[saved.session.ids[2]] = 0; }
  ]) {
    const invalid = copy(good); mutate(invalid);
    const rejected = await boot({ storage: new Map([[wheelKey, JSON.stringify(invalid)]]) });
    assert.equal(state(rejected).session, null);
    assert.equal(state(rejected).clearedTopics.size, 0);
    assert(rejected.a.get().notice);
  }
  const changed = copy(banks); changed['./questions.json'].questions[0].options[0].explanation += ' Уточнение.';
  const changedRun = await boot({ banks: changed, storage: new Map([[wheelKey, JSON.stringify(good)]]) });
  assert.equal(state(changedRun).session, null); assert.equal(state(changedRun).clearedTopics.size, 0);
  assert.equal(state(changedRun).total, good.total);
  assert(changedRun.a.get().notice.includes('обновились'));
  console.log('Topic wheel checks passed:43 original topics/676 questions, opt-in metadata, persisted uniform draw, double/reload spin, immutable confirmed answers, failed and stopped topics retained, perfect-only clearing, all43 win, pause/notes, late-animation reset safety, strict save validation, signature migration and independent storage.');
})().catch(error => { console.error(error); process.exitCode = 1; });

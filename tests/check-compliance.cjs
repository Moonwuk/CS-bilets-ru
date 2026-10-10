'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { base, manifest, parts, composed, read } = require('./compliance-fixtures.cjs');
const { merge, load, selectSection } = require('../basic-bank.js');
const root = path.resolve(__dirname, '..');
const copy = value => JSON.parse(JSON.stringify(value));
const code = filename => fs.readFileSync(path.join(root, filename), 'utf8');
const files = { './questions.json': base, './data/compliance-ru/manifest.json': manifest,
  ...Object.fromEntries(manifest.parts.map((filename, index) => [`./data/compliance-ru/${filename}`, parts[index]])) };

(async () => {
  const original = JSON.stringify([base, manifest, parts]);
  const data = composed();
  assert.equal(JSON.stringify([base, manifest, parts]), original, 'Source banks must not mutate');
  assert.equal(data.questions.length, 1075); assert.equal(data.topics.length, 45);
  assert.equal(data.topics.filter(topic => topic === 'Комплаенс РФ').length, 1);
  const topic = data.questions.filter(question => question.topic === 'Комплаенс РФ');
  assert.equal(topic.length, 180); assert.equal(topic.filter(question => question.compliance.reused).length, 5);
  assert.equal(topic.filter(question => !question.compliance.reused).length, 175);
  assert(topic.every(question => question.legal.jurisdiction === 'RU' && question.legal.reviewedAt === '2026-10-10'));
  assert.equal(data.questions.filter(question => question.legal?.jurisdiction === 'EU').length, 25);
  assert.deepEqual(data.questions.filter(question => question.legal?.jurisdiction === 'EU'), base.questions.filter(question => question.legal?.jurisdiction === 'EU'));
  assert.equal(new Set(data.questions.map(question => question.id)).size, data.questions.length);
  assert.equal(new Set(data.sources.map(source => source.id)).size, data.sources.length);
  const raw = parts.flatMap(part => part.questions);
  const sourceIds = new Set(data.sources.map(source => source.id));
  for (const question of topic) {
    assert.match(question.id, /^q\d{3,5}$/);
    assert.equal(question.options.length, 4);
    assert.equal(question.options.filter(option => option.correct).length, 1);
    assert.deepEqual(question.options.map(option => option.sourceLetter), ['А', 'Б', 'В', 'Г']);
    assert(question.options.every(option => option.text.trim() && option.explanation.trim()));
    assert(question.legal.references.every(ref => sourceIds.has(ref.sourceId) && ref.locator.trim()));
    assert(question.compliance.learningObjective && question.compliance.recommendedEvidence);
    assert(['application', 'practice'].includes(question.compliance.basisType));
    const research = raw.find(item => item.id === question.compliance.researchId);
    assert.equal(question.compliance.module, research.module);
    if (!question.compliance.reused) {
      assert.equal(question.question, research.question);
      assert.deepEqual(question.options.map(({ sourceLetter, ...rest }) => rest), research.options);
    }
  }
  for (const module of manifest.modules) assert.equal(topic.filter(question => question.compliance.module === module.id).length, 12);
  for (const question of base.questions) {
    const current = data.questions.find(item => item.id === question.id);
    if (Object.values(manifest.reuse).includes(question.id)) {
      assert.equal(current.question, question.question);
      assert.deepEqual(current.options, question.options);
      assert.equal(current.collection, question.collection);
      assert.deepEqual(current.conceptIds, question.conceptIds);
    } else assert.deepEqual(current, question);
  }
  const normalize = value => value.toLocaleLowerCase('ru-RU').replace(/\s+/g, ' ').trim();
  assert.equal(new Set(data.questions.map(question => normalize(question.question))).size, data.questions.length, 'No exact repeated prompts in the composed base bank');
  assert.equal(manifest.sources.length, 34); assert.equal(manifest.furtherReading.length, 10);
  assert(manifest.sources.every(source => source.type && source.access && source.limitations && new URL(source.url).protocol === 'https:'));
  assert(manifest.furtherReading.every(source => source.status && new URL(source.url).protocol === 'https:'));
  const snapshot = JSON.stringify(data);
  const basic = selectSection(data, 'basic'), compliance = selectSection(data, 'compliance');
  assert.equal(basic.questions.length, 895); assert.equal(basic.topics.length, 44);
  assert.equal(compliance.questions.length, 180); assert.equal(compliance.topics.length, 15);
  assert.deepEqual(compliance.topics, manifest.modules.map(module => module.name));
  assert(!basic.questions.some(question => question.compliance));
  assert(compliance.questions.every(question => question.topic === question.compliance.moduleTitle));
  const splitIds = [...basic.questions, ...compliance.questions].map(question => question.id);
  assert.equal(new Set(splitIds).size, data.questions.length);
  assert.deepEqual(splitIds.sort(), data.questions.map(question => question.id).sort());
  for (const question of compliance.questions) {
    const original = data.questions.find(item => item.id === question.id);
    assert.deepEqual({ ...question, topic: original.topic }, original, 'Section selection changes only the topic label');
  }
  assert.equal(JSON.stringify(data), snapshot, 'Selecting sections must not mutate the shared composition');
  assert.throws(() => selectSection(data, 'missing'), /неизвестный раздел/);
  const added = raw.filter(question => Number(question.id.slice(3)) > 120);
  assert.equal(added.length, 60);
  assert.equal(new Set(added.map(question => question.learningObjective)).size, 60);
  assert.deepEqual([0,1,2,3].map(index => added.filter(question => question.options[index].correct).length), [15,15,15,15]);

  const requested = [];
  const fetcher = async url => { requested.push(url); return { ok: true, json: async () => copy(files[url]) }; };
  assert.deepEqual(await load(fetcher), data);
  assert.deepEqual(requested.sort(), Object.keys(files).sort());
  for (const broken of Object.keys(files)) {
    await assert.rejects(load(async url => ({ ok: url !== broken, status: 404, json: async () => copy(files[url]) })), /Не удалось загрузить/);
  }
  await assert.rejects(load(async url => ({ ok: true, json: async () => { if (url.endsWith('m07.json')) throw new SyntaxError('Invalid JSON'); return copy(files[url]); } })), /Invalid JSON/);
  assert.deepEqual(await load(fetcher), data, 'Retry loads the whole pack, not a cached incomplete subset');
  const badCases = [
    [m => { m.reuse.rfc010 = 'q999'; }, () => {}, /не найден/],
    [m => { m.reuse.rfc010 = 'q476'; }, () => {}, /GDPR/],
    [m => { m.parts[0] = '../../untrusted.json'; }, () => {}, /неполный/],
    [m => { m.sources[0].url = 'javascript:alert(1)'; }, () => {}, /источник/],
    [m => { m.sources.push(m.sources[0]); }, () => {}, /источник/],
    [m => { m.reviewedAt = '2026-02-30'; }, () => {}, /манифест/],
    [() => {}, p => { p[0].questions[0].references[0].sourceId = 'missing'; }, /ссылк/],
    [() => {}, p => { p[0].questions[0].options.forEach(option => { option.correct = false; }); }, /четыре/],
    [() => {}, p => { p[0].questions.pop(); }, /часть/],
    [() => {}, p => { p[0].questions[0].id = 'rfc999'; }, /ID/],
    [() => {}, p => { p[0].questions[0].basisType = 'anything'; }, /основания/],
    [() => {}, p => { [p[0].questions[0], p[1].questions[0]] = [p[1].questions[0], p[0].questions[0]]; }, /чужом файле/],
    [() => {}, p => { p[0].questions[0].relatedQuestionIds = ['q999']; }, /соседний/]
  ];
  for (const [changeManifest, changeParts, expected] of badCases) {
    const m = copy(manifest), p = copy(parts); changeManifest(m); changeParts(p);
    assert.throws(() => merge(base, m, p), expected);
  }
  const collision = copy(base); collision.questions.push({ ...collision.questions[0], id: 'q10001' });
  assert.throws(() => merge(collision, manifest, parts), /конфликт/);

  // Verify the actual browser form of the shared loader, not just the Node export.
  const browser = { window: {}, URL, fetch: fetcher };
  vm.createContext(browser); vm.runInContext(code('basic-bank.js'), browser);
  assert.deepEqual(copy(await browser.window.TrainerBasicBank.load()), data);
  const aggregateFiles = { ...files, './ai-security-questions.json': read('ai-security-questions.json'), './scenarios-questions.json': read('scenarios-questions.json') };
  browser.fetch = async url => ({ ok: true, json: async () => copy(aggregateFiles[url]) });
  vm.runInContext(code('all-questions.js'), browser);
  const all = await browser.window.TrainerAllQuestions.load({ includeTopics: true });
  assert.equal(all.questions.length, 1151); assert.equal(all.topicGroups.length, 66);
  const wheelTopics = all.topicGroups.filter(group => group.bankId === 'compliance');
  assert.equal(wheelTopics.length, 15); assert(wheelTopics.every(group => group.questionIds.length === 12));
  assert.deepEqual(Array.from(wheelTopics, group => group.id), manifest.modules.map(module => `compliance:${module.id}`));
  assert.equal(all.questions.filter(question => question.compliance).length, 180);
  assert(!all.questions.some(question => /^s\d/.test(question.id)));
  for (const broken of manifest.parts) {
    browser.fetch = async url => ({ ok: !url.endsWith(broken), status: 404, json: async () => copy(aggregateFiles[url]) });
    await assert.rejects(browser.window.TrainerAllQuestions.load({ includeTopics: true }), /Не удалось загрузить/);
  }

  // Additive glossary: safe markup, word boundaries, no score hooks, shared dialog.
  class Element {
    constructor() { this.listeners = new Map(); this.open = false; this.textContent = ''; this.isConnected = true; }
    addEventListener(type, fn) { if (!this.listeners.has(type)) this.listeners.set(type, []); this.listeners.get(type).push(fn); }
    contains(element) { return element === launcher; }
    showModal() { this.open = true; }
    focus() { this.focused = true; }
    fire(type, event = {}) { for (const fn of this.listeners.get(type) || []) fn(event); }
  }
  const nodes = new Map(['#main', '#term-dialog', '#term-title', '#term-description', '#term-example', '#term-close'].map(id => [id, new Element()]));
  const launcher = { dataset: { complianceTerm: 'pd' }, isConnected: true, focus() { this.focused = true; }, closest(selector) { return selector === '[data-compliance-term]' ? this : null; } };
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const glossary = { document: { querySelector: id => nodes.get(id) }, window: { TrainerTerms: { markup: escape, isOpen: () => nodes.get('#term-dialog').open } } };
  vm.createContext(glossary); vm.runInContext(code('compliance-glossary.js'), glossary);
  const markup = glossary.window.TrainerTerms.markup('Комплаенс РФ: ПДн, ИСПДн; неИСПДн https://example.org/ПДн <img src=x onerror=alert(1)>');
  assert.equal((markup.match(/data-compliance-term=/g) || []).length, 3);
  assert(markup.includes('&lt;img')); assert(!markup.includes('<img'));
  assert(markup.includes('https://example.org/ПДн'));
  const event = { target: launcher, preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } };
  nodes.get('#main').fire('click', event);
  assert(event.prevented && event.stopped && glossary.window.TrainerTerms.isOpen());
  assert.equal(nodes.get('#term-title').textContent, 'ПДн');
  nodes.get('#term-dialog').open = false; nodes.get('#term-dialog').fire('close'); assert(launcher.focused);
  assert(!/localStorage|checkAnswer|selectAnswer/.test(code('compliance-glossary.js')), 'Vocabulary must not change answers or statistics');

  const practice = read('data/compliance-ru/practice.json');
  assert.equal(practice.cases.length, 15);
  assert.equal(new Set(practice.cases.map(item => item.id)).size, 15);
  assert(practice.cases.every(item => item.criteria.length === 5 && item.situation && item.task && item.discussion && item.criticalMistake));
  assert(!/localStorage|eval\(|new Function/.test(code('compliance-materials.js')));
  for (const page of ['index.html', 'compliance.html', 'all-questions.html', 'topic-wheel.html']) {
    const html = code(page);
    assert(html.includes('src="./basic-bank.js" defer'));
    assert(html.indexOf('src="./glossary.js"') < html.indexOf('src="./compliance-glossary.js"'));
    assert(html.indexOf('src="./compliance-glossary.js"') < html.indexOf(['index.html','compliance.html'].includes(page) ? 'src="./app.js"' : 'src="./case-trainer.js"'));
  }
  const java = code('android/src/ru/moongametechnology/infosec/tickets/MainActivity.java');
  const build = code('android/build.py');
  for (const file of ['compliance.html', 'basic-bank.js', 'compliance-glossary.js', 'compliance-materials.js', 'compliance-materials.html', ...Object.keys(files).filter(file => file.startsWith('./data/')).map(file => file.slice(2)), 'data/compliance-ru/practice.json']) {
    assert(java.includes(`"${file}"`), `Android WebView must explicitly allow ${file}`);
    assert(fs.existsSync(path.join(root, file)));
  }
  assert(build.includes('"data"') && build.includes('"compliance-materials.html"'));
  assert(build.includes('"compliance.html"'));
  assert(java.includes('"/assets/compliance.html".equals(uri.getPath())'));
  assert(code('.github/workflows/deploy-pages.yml').includes('compliance.html'));
  assert(code('compliance.html').includes('data-bank="compliance"'));
  for (const page of ['index.html', 'senior.html', 'ai-security.html', 'scenarios.html', 'all-questions.html', 'topic-wheel.html', 'compliance-materials.html']) {
    assert(code(page).includes('href="./compliance.html"'), `${page} must link directly to compliance`);
  }
  assert(java.includes('"/assets/compliance-materials.html".equals(uri.getPath())'));
  for (const workflow of ['.github/workflows/android.yml', '.github/workflows/deploy-pages.yml']) assert(code(workflow).includes('node tests/check-compliance.cjs'));
  assert(code('.github/workflows/deploy-pages.yml').includes('cp -R data _site/'));
  console.log('PASS: RF compliance: 180 questions (175 added + 5 reused), 15 independent topics, 34 sources, 10 reading entries, 15 cases, immutable composition, zero exact repeats, source/ID validation, all-or-nothing load/retry, actual all/wheel adapters, glossary escaping/dialog, and explicit Android/Pages delivery.');
})().catch(error => { console.error(error); process.exitCode = 1; });

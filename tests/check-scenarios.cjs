'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const bank = JSON.parse(read('scenarios-questions.json'));
assert.equal(bank.schemaVersion, 1);
assert.equal(bank.id, 'scenarios');
assert.equal(bank.questions.length, 36);
assert.deepEqual(bank.tracks.map(t => t.id).sort(), ['cve', 'mitre', 'owasp']);
const sources = new Map(bank.sources.map(s => [s.id, s]));
assert.equal(sources.size, bank.sources.length);
for (const s of sources.values()) {
  assert(s.title && s.publisher && /^\d{4}-\d{2}-\d{2}$/.test(s.accessedAt));
  const url = new URL(s.url);
  assert.equal(url.protocol, 'https:');
  assert(!url.username && !url.password);
}
const context = { window: {}, document: { querySelector: () => ({ addEventListener() {} }) } };
vm.createContext(context);
vm.runInContext(read('glossary.js').replace('  window.TrainerTerms =', '  globalThis.entries = glossary;\n  window.TrainerTerms ='), context);
const terms = text => [...context.window.TrainerTerms.markup(text).matchAll(/data-term="([^"]+)"/g)].map(m => m[1]);
const oldQuestions = ['questions.json', 'senior-questions.json', 'ai-security-questions.json'].flatMap(name => JSON.parse(read(name)).questions);
const questionTexts = new Set(oldQuestions.map(q => q.question.trim().toLowerCase()));
const correctPositions = [0, 0, 0, 0];
const cves = new Set();
for (const [index, q] of bank.questions.entries()) {
  assert.equal(q.id, `sc${String(index + 1).padStart(3, '0')}`);
  assert.equal(bank.questions.filter(other => other.track === q.track).length, 12);
  assert.equal(q.basis.family, q.track);
  assert(q.basis.identifiers.length && new Set(q.basis.identifiers).size === q.basis.identifiers.length);
  const normalized = q.question.trim().toLowerCase();
  assert(!questionTexts.has(normalized), `Repeated scenario ${q.id}`);
  questionTexts.add(normalized);
  assert(q.evidence.length >= 2 && q.constraints.length >= 1, `Conditions missing in ${q.id}`);
  assert.equal(q.options.length, 4);
  assert.equal(new Set(q.options.map(o => o.text.trim().toLowerCase())).size, 4);
  assert(q.options.every((o, i) => o.text.trim() && o.explanation.trim() && o.sourceLetter === 'АБВГ'[i]));
  const right = q.options.map((o, i) => o.correct ? i : -1).filter(i => i >= 0);
  assert.equal(right.length, 1);
  correctPositions[right[0]]++;
  assert(q.reasoning.length >= 2 && q.tradeoffs.length && q.whatChangesAnswer.trim() && q.followUps.length);
  assert(q.references.length && q.references.every(ref => sources.has(ref.sourceId) && ref.locator.trim()));
  assert(q.conceptIds.length && new Set(q.conceptIds).size === q.conceptIds.length);
  const visibleTerms = new Set([q.question, ...q.evidence, ...q.constraints, ...q.options.map(o => o.text)].flatMap(terms));
  for (const id of q.conceptIds) {
    assert(context.entries.has(id), `Missing definition ${q.id}: ${id}`);
    assert(visibleTerms.has(id), `No clickable spelling before answering ${q.id}: ${id}`);
  }
  if (q.track === 'mitre') assert(q.basis.identifiers.every(id => /^T\d{4}(?:\.\d{3})?$/.test(id)));
  if (q.track === 'cve') {
    assert(q.basis.identifiers.every(id => /^CVE-\d{4}-\d{4,}$/.test(id)));
    q.basis.identifiers.forEach(id => cves.add(id));
    const urls = q.references.map(ref => sources.get(ref.sourceId).url);
    const record = url => /(?:www\.)?cve\.org\//.test(url) || /(?:github\.com|raw\.githubusercontent\.com)\/CVEProject\/cvelistV5\//i.test(url);
    assert(urls.some(record), `CVE record missing: ${q.id}`);
    assert(urls.some(url => !record(url)), `Original project advisory missing: ${q.id}`);
  }
}
assert.deepEqual(correctPositions, [9, 9, 9, 9], 'No fixed answer-position shortcut');
assert(cves.size >= 6, 'CVE cases need a varied set of actual vulnerabilities');

// The new mode must be reachable and shipped by both deployment paths.
for (const name of ['index.html', 'senior.html', 'ai-security.html', 'scenarios.html', 'all-questions.html', 'topic-wheel.html']) {
  const html = read(name);
  assert(html.includes('href="./scenarios.html"'), `No scenarios navigation in ${name}`);
  assert(html.includes('href="./topic-wheel.html"'), `No topic wheel navigation in ${name}`);
}
const html = read('scenarios.html');
assert(html.includes('data-bank="scenarios"') && html.includes('src="./glossary.js" defer') && html.includes('src="./feedback.js" defer'));
assert(html.includes('id="term-dialog"') && html.includes('aria-describedby="term-description"'));
const pagesWorkflow = read('.github/workflows/deploy-pages.yml');
const copy = pagesWorkflow.match(/cp index\.html[\s\S]+?_site\//)?.[0] || '';
assert(['scenarios.html','scenarios-questions.json','all-questions.html','all-questions.js'].every(name => copy.includes(name)));
for (const name of ['.github/workflows/deploy-pages.yml', '.github/workflows/android.yml']) assert(read(name).includes('node tests/check-scenarios.cjs') && read(name).includes('node tests/check-all-questions.cjs'));
const builder = read('android/build.py');
const assets = JSON.parse(builder.match(/SITE_FILES = (\[[\s\S]+?\n\])/)?.[1] || '[]');
assert(assets.includes('all-questions.html') && assets.includes('all-questions.js'));
assert(assets.includes('scenarios.html') && assets.includes('scenarios-questions.json'), 'Android must package the scenario files');
assert(builder.includes('assets.glob("*.html")') && builder.includes('android-adapter.js'), 'Android must inject its adapter into every packaged page');
const android = read('android/src/ru/moongametechnology/infosec/tickets/MainActivity.java');
const allowlist = android.match(/ASSETS = new HashSet<>\(Arrays\.asList\(([\s\S]+?)\)\);/)?.[1] || '';
assert(allowlist.includes('"all-questions.html"') && allowlist.includes('"all-questions.js"'));
assert(android.includes('"/assets/all-questions.html".equals(uri.getPath())'));
assert(allowlist.includes('"scenarios.html"') && allowlist.includes('"scenarios-questions.json"'), 'Native asset allowlist must admit the new files');
assert(android.includes('"/assets/scenarios.html".equals(uri.getPath())'), 'Native navigation must allow the new local page');
const wheelPage = read('topic-wheel.html');
assert(wheelPage.includes('data-bank="topic-wheel"'));
assert(wheelPage.indexOf('src="./all-questions.js"') < wheelPage.indexOf('src="./case-trainer.js"'));
assert(wheelPage.indexOf('src="./wheel-visual.js"') < wheelPage.indexOf('src="./case-trainer.js"'));
for (const name of ['topic-wheel.html', 'wheel-visual.js', 'wheel-visual.css']) {
  assert(copy.includes(name), `Pages must ship ${name}`);
  assert(assets.includes(name), `Android must ship ${name}`);
  assert(allowlist.includes(`"${name}"`), `Native asset allowlist must admit ${name}`);
}
assert(assets.includes('topic-wheel.html'), 'Android must include the wheel page in adapter processing');
assert(android.includes('"/assets/topic-wheel.html".equals(uri.getPath())'));
for (const name of ['.github/workflows/deploy-pages.yml', '.github/workflows/android.yml']) {
  assert(read(name).includes('node tests/check-topic-wheel.cjs'));
  assert(read(name).includes('node tests/check-wheel-visual.cjs'));
}
console.log(`PASS: 36 original scenarios, three tracks, ${cves.size} CVEs with record + advisory references, balanced answers, all concept definitions reachable, Pages and Android packaging/navigation.`);

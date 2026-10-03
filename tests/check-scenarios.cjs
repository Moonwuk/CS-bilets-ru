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
for (const name of ['index.html', 'senior.html', 'ai-security.html', 'scenarios.html', 'all-questions.html']) {
  const html = read(name);
  assert(html.includes('href="./scenarios.html"'), `No scenarios navigation in ${name}`);
}
const html = read('scenarios.html');
assert(html.includes('data-bank="scenarios"') && html.includes('src="./glossary.js" defer') && html.includes('src="./feedback.js" defer'));
assert(html.includes('id="term-dialog"') && html.includes('aria-describedby="term-description"'));
const pagesWorkflow = read('.github/workflows/deploy-pages.yml');
const copy = pagesWorkflow.match(/cp index\.html[\s\S]+?_site\//)?.[0] || '';
assert(['scenarios.html','scenarios-questions.json','all-questions.html','all-questions.js'].every(name => copy.includes(name)));
for (const name of ['.github/workflows/deploy-pages.yml', '.github/workflows/android.yml']) assert(read(name).includes('node tests/check-scenarios.cjs') && read(name).includes('node tests/check-all-questions.cjs'));
const assetLists = [...read('android/build.py').matchAll(/for name in (\[[^\n]+\]):/g)].map(m => JSON.parse(m[1]));
assert.equal(assetLists.length, 2);
assert(assetLists[0].includes('all-questions.html') && assetLists[0].includes('all-questions.js'));
assert(assetLists[1].includes('all-questions.html'));
assert(assetLists[0].includes('scenarios.html') && assetLists[0].includes('scenarios-questions.json'), 'APK must package the new files');
assert(assetLists[1].includes('scenarios.html'), 'APK must inject its adapter into the new page');
const android = read('android/src/ru/moongametechnology/infosec/tickets/MainActivity.java');
const allowlist = android.match(/ASSETS = new HashSet<>\(Arrays\.asList\(([\s\S]+?)\)\);/)?.[1] || '';
assert(allowlist.includes('"all-questions.html"') && allowlist.includes('"all-questions.js"'));
assert(android.includes('"/assets/all-questions.html".equals(uri.getPath())'));
assert(allowlist.includes('"scenarios.html"') && allowlist.includes('"scenarios-questions.json"'), 'Native asset allowlist must admit the new files');
assert(android.includes('"/assets/scenarios.html".equals(uri.getPath())'), 'Native navigation must allow the new local page');
console.log(`PASS: 36 original scenarios, three tracks, ${cves.size} CVEs with record + advisory references, balanced answers, all concept definitions reachable, Pages and Android packaging/navigation.`);

'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');

class Element {
  constructor() { this.listeners = new Map(); this.textContent = ''; this.open = false; this.isConnected = true; this.focused = false; }
  addEventListener(name, fn) { if (!this.listeners.has(name)) this.listeners.set(name, []); this.listeners.get(name).push(fn); }
  dispatch(name, extra = {}) {
    const event = { target: this, preventDefault() { this.defaultPrevented = true; }, stopPropagation() { this.propagationStopped = true; }, ...extra };
    for (const fn of this.listeners.get(name) || []) fn(event);
    return event;
  }
  contains(element) { return element.isConnected; }
  focus() { this.focused = true; }
  showModal() { this.open = true; }
  close() { this.open = false; this.dispatch('close'); }
  getBoundingClientRect() { return { left: 100, top: 100, right: 520, bottom: 400 }; }
}

const nodes = new Map();
const document = { querySelector(selector) { if (!nodes.has(selector)) nodes.set(selector, new Element()); return nodes.get(selector); } };
const context = { document, window: {}, console };
vm.createContext(context);
const source = fs.readFileSync(path.join(root, 'glossary.js'), 'utf8');
vm.runInContext(source.replace('  window.TrainerTerms =', '  globalThis.entries = glossary;\n  window.TrainerTerms ='), context);
const help = context.window.TrainerTerms;
const main = nodes.get('#main');
const dialog = nodes.get('#term-dialog');
const termIds = text => [...help.markup(text).matchAll(/data-term="([^"]+)"/g)].map(match => match[1]);

// Every spelling resolves to its own definition; no alias silently overwrites another.
const aliases = new Set();
for (const [id, term] of context.entries) {
  assert(/^[a-z0-9-]+$/.test(id));
  for (const field of ['title', 'description', 'example']) assert(typeof term[field] === 'string' && term[field].trim());
  for (const alias of term.aliases) {
    const normalized = alias.toLowerCase();
    assert(!aliases.has(normalized), `Duplicate spelling: ${alias}`);
    aliases.add(normalized);
    assert.deepEqual(termIds(alias), [id], `Wrong definition for ${alias}`);
  }
}
assert.deepEqual(termIds('inline-скрипты через CSP nonce. Значение nonce'), ['inline-script', 'csp-nonce', 'nonce']);
assert.deepEqual(termIds('CSP\u00a0nonce и INLINE-СКРИПТЫ'), ['csp-nonce', 'inline-script']);
assert.deepEqual(termIds('HTTP-ответа, HTML-атрибут и script-тегах, unsafe-inline'), ['http-response', 'html-attribute', 'script-tag', 'unsafe-inline']);
assert.deepEqual(termIds('TCP/IP и SSL/TLS, SQL-инъекция, AES-GCM, prompt injection'), ['tcp-ip', 'tls', 'sql-injection', 'aes-gcm', 'prompt-injection']);
assert.deepEqual(termIds('XSS2 XSS_field mynonce предCSP postAPI'), [], 'Never split longer words');
assert.deepEqual(termIds('https://example.org/API/CSP?nonce=123'), [], 'URLs are preserved as text');
assert.deepEqual(termIds('RAG, LLM, tool call и API'), ['rag', 'llm', 'tool-call', 'api']);
const escaped = help.markup('<img src="x" onerror="alert(1)"> & <script>bad()</script>');
assert(!escaped.includes('<img') && !escaped.includes('<script>'));
assert(escaped.includes('&lt;img') && escaped.includes('&quot;') && escaped.includes('&amp;'));
assert.deepEqual(termIds('CSP nonce'), termIds('CSP nonce'), 'Repeated rendering must retain matches');

const bank = JSON.parse(fs.readFileSync(path.join(root, 'questions.json'), 'utf8'));
const toolQuestions = bank.questions.filter(q => q.collection === 'security-tools');
assert.equal(toolQuestions.length, 100);
assert.equal(new Set(toolQuestions.map(q => q.topic)).size, 10);
assert.equal(new Set(bank.questions.map(q => q.question.trim().toLowerCase())).size, bank.questions.length, 'No repeated question text');
const sourceIds = new Set(bank.sources.map(s => s.id));
for (const [index, q] of toolQuestions.entries()) {
  assert.equal(q.id, `q${501 + index}`);
  assert.equal(toolQuestions.filter(other => other.topic === q.topic).length, 10);
  assert.equal(q.options.length, 4);
  assert.equal(new Set(q.options.map(o => o.text.trim().toLowerCase())).size, 4);
  assert.equal(q.options.filter(o => o.correct).length, 1);
  assert(q.options.every(o => o.text.trim() && o.explanation.trim()));
  assert(q.sourceIds.length && q.sourceIds.every(id => sourceIds.has(id)), `Missing source in ${q.id}`);
  assert(q.conceptIds.length && new Set(q.conceptIds).size === q.conceptIds.length);
  const visibleTerms = new Set([q.question, ...q.options.map(o => o.text)].flatMap(termIds));
  for (const id of q.conceptIds) {
    assert(context.entries.has(id), `Missing definition ${q.id}: ${id}`);
    assert(visibleTerms.has(id), `Term is not clickable before answering ${q.id}: ${id}`);
  }
  assert(termIds(q.question).length, `Question ${q.id} must offer vocabulary help`);
}

// Imported questions remain in the existing aggregate bank, with reachable vocabulary help.
const expansion = bank.questions.filter(q => q.importBatch === 'jwt-owasp-2025');
assert.equal(expansion.length, 140);
assert.equal(bank.questions.length, 900);
assert.equal(bank.topics.length, 44);
assert.deepEqual(expansion.map(q => q.sourceQuestionNumber), Array.from({length: 140}, (_, i) => i + 1));
assert.deepEqual(expansion.map(q => q.id), Array.from({length: 140}, (_, i) => `q${601 + i}`));
const newTopics = new Map([['JWT и проверка токенов',27],['OAuth и жизненный цикл токенов',19],['PKI и сертификаты',19],['Архитектура безопасности',16]]);
for (const [topic, count] of newTopics) assert.equal(expansion.filter(q => q.topic === topic).length, count);
assert.equal(new Set(expansion.map(q => q.topic)).size, 15);
assert.deepEqual([0,1,2,3].map(i => expansion.filter(q => q.options[i].correct).length), [35,35,35,35]);
for (const q of expansion) {
  assert(bank.topics.includes(q.topic));
  assert(q.sourceIds.length && q.sourceIds.every(id => sourceIds.has(id)), `Missing source ${q.id}`);
  assert.equal(q.options.length, 4);
  assert.equal(new Set(q.options.map(o => o.text.toLowerCase())).size, 4);
  assert.equal(q.options.filter(o => o.correct).length, 1);
  assert(q.options.every(o => o.explanation.length > 80), `Missing reasoning ${q.id}`);
  assert(q.conceptIds.length, `Missing vocabulary ${q.id}`);
  const visible = new Set([q.question, ...q.options.map(o => o.text)].flatMap(termIds));
  for (const id of q.conceptIds) assert(context.entries.has(id) && visible.has(id), `Unreachable concept ${q.id}: ${id}`);
}
// Research expansion: all new questions remain attributable, distinct and explainable before answering.
const research = bank.questions.filter(q => q.researchBatch === 'interview-expansion-2026-10');
assert.equal(research.length, 100);
assert.deepEqual(research.map(q => q.id), Array.from({length: 100}, (_, i) => `q${741+i}`));
assert.equal(new Set(research.map(q => q.learningObjective)).size, 100);
assert.deepEqual([0,1,2,3].map(i => research.filter(q => q.options[i].correct).length), [25,25,25,25]);
for (const q of research) {
  assert.equal(q.reviewedAt, '2026-10-10');
  assert.equal(q.origin, 'authored');
  assert(bank.topics.includes(q.topic));
  assert(q.sourceIds.length && q.sourceIds.every(id => sourceIds.has(id)), `Missing source ${q.id}`);
  assert.equal(q.options.length, 4);
  assert.equal(new Set(q.options.map(o => o.text.toLowerCase())).size, 4);
  assert.equal(q.options.filter(o => o.correct).length, 1);
  assert(q.options.every(o => o.text.trim() && o.explanation.trim()), `Missing reasoning ${q.id}`);
  assert.equal(new Set(q.options.map(o => o.explanation)).size, 4, `Repeated option rationale ${q.id}`);
  assert(q.conceptIds.length, `Missing vocabulary ${q.id}`);
  const visible = new Set([q.question, ...q.options.map(o => o.text)].flatMap(termIds));
  for (const id of q.conceptIds) assert(context.entries.has(id) && visible.has(id), `Unreachable concept ${q.id}: ${id}`);
}
// Protocol expansion stays in the existing OSI topic and distinguishes sources of
// technical claims from public exercises used as teaching inspiration.
const osi = bank.questions.filter(q => q.researchBatch === 'osi-protocols-2026-10');
assert.equal(osi.length, 60);
assert.equal(bank.questions.filter(q => q.topic === 'Модель OSI').length, 101);
assert.deepEqual(osi.map(q => q.id), Array.from({length: 60}, (_, i) => `q${841+i}`));
assert.equal(new Set(osi.map(q => q.learningObjective)).size, 60);
assert.deepEqual([0,1,2,3].map(i => osi.filter(q => q.options[i].correct).length), [15,15,15,15]);
const sourcesById = new Map(bank.sources.map(s => [s.id, s]));
assert.equal(sourcesById.size, bank.sources.length, 'Source IDs must be unique');
assert.equal(osi.filter(q => q.exerciseSourceIds.length).length, 4);
for (const q of osi) {
  assert.equal(q.topic, 'Модель OSI');
  assert.equal(q.reviewedAt, '2026-10-10');
  assert.equal(q.origin, 'authored');
  assert(q.learningObjective.trim() && q.osiFocus.trim() && q.protocols.length);
  assert(q.sourceIds.length && new Set(q.sourceIds).size === q.sourceIds.length);
  for (const id of q.sourceIds) assert(sourcesById.has(id) && /^https:\/\//.test(sourcesById.get(id).url), `Missing source ${q.id}: ${id}`);
  for (const id of q.exerciseSourceIds) assert(q.sourceIds.includes(id) && sourcesById.get(id).kind === 'practice', `Missing exercise attribution ${q.id}: ${id}`);
  assert.equal(q.options.length, 4);
  assert.equal(new Set(q.options.map(o => o.text.trim().toLowerCase())).size, 4);
  assert.equal(q.options.filter(o => o.correct).length, 1);
  assert(q.options.every(o => o.text.trim() && o.explanation.trim()), `Missing reasoning ${q.id}`);
  assert.equal(new Set(q.options.map(o => o.explanation)).size, 4, `Repeated option rationale ${q.id}`);
  assert(q.conceptIds.length && new Set(q.conceptIds).size === q.conceptIds.length);
  const visible = new Set([q.question, ...q.options.map(o => o.text)].flatMap(termIds));
  for (const id of q.conceptIds) assert(context.entries.has(id) && visible.has(id), `Unreachable concept ${q.id}: ${id}`);
}
assert.deepEqual(termIds('HTTP/3, QUIC, DHCPv4, DHCPv6, ICMPv6, EAPOL, ASN.1'), ['http3','quic','dhcp','dhcpv6','icmpv6','eapol','asn1']);
assert.deepEqual(termIds('SAML-утверждение, IdP, AudienceRestriction'), ['saml-assertion','idp','audience-restriction']);
const reportedSaml = bank.questions.find(q => q.id === 'q387');
for (const id of ['saml-assertion','idp','audience-restriction']) assert(termIds(reportedSaml.question).includes(id));
assert.deepEqual(termIds('scope проверки, OAuth scope'), ['scope-testing','oauth','oauth-scope']);
assert(bank.questions.find(q => q.id === 'q671').question.includes('почт'));

// Avoid confusing overlapping protocol names and long OWASP category names.
assert.deepEqual(termIds('JWT JWS JWE JWKS'), ['jwt','jws','jwe','jwks']);
assert.deepEqual(termIds('OAuth state, code_challenge, code_verifier, DPoP'), ['oauth-state','code-challenge','code-verifier','dpop']);
assert.deepEqual(termIds('Software Supply Chain Failures и Software or Data Integrity Failures'), ['supply-chain-failures','software-integrity-failures']);
assert.deepEqual(termIds('Публичные ключи, цифровую подпись, приватным ключом'), ['public-key','digital-signature','private-key']);

// A full CVE must open its specific advisory summary, including in the original reported question.
assert.deepEqual(termIds('(CVE-2022-3602), cve-2023-38545; CVE'), ['cve-2022-3602', 'cve-2023-38545', 'cve']);
assert.deepEqual(termIds('Log4Shell (CVE-2021-44228) и Heartbleed (CVE-2014-0160)'), ['cve-2021-44228', 'cve-2021-44228', 'cve-2014-0160', 'cve-2014-0160']);
assert.deepEqual(termIds('https://example.org/CVE-2022-3602'), [], 'CVE identifiers inside source URLs remain unchanged');
assert(!termIds('CVE-2022-36020').includes('cve-2022-3602'), 'Do not explain a different CVE by matching a shorter prefix');
const collectStrings = value => typeof value === 'string' ? [value] : value && typeof value === 'object' ? Object.values(value).flatMap(collectStrings) : [];
const explainedCves = new Set();
for (const file of ['questions.json', 'senior-questions.json', 'ai-security-questions.json', 'scenarios-questions.json']) {
  const questions = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')).questions;
  for (const q of questions) {
    const visible = collectStrings([q.title, q.question, q.evidence, q.constraints, q.options, q.prerequisites, q.reasoning, q.tradeoffs, q.whatChangesAnswer, q.followUps, q.basis?.identifiers]);
    for (const text of visible) {
      const markup = help.markup(text);
      for (const identifier of text.match(/\bCVE-\d{4}-\d{4,}\b/g) || []) {
        const id = identifier.toLowerCase();
        const term = context.entries.get(id);
        assert(term && term.title.startsWith(identifier), `Specific CVE help missing in ${q.id}: ${identifier}`);
        assert(markup.includes(`data-term="${id}"`) && markup.includes(`>${identifier}</button>`), `Full identifier must be clickable in ${q.id}: ${identifier}`);
        explainedCves.add(id);
      }
    }
  }
}
assert.equal(explainedCves.size, 11);

const launcher = new Element();
launcher.dataset = { term: 'csp-nonce' };
launcher.closest = selector => selector === '[data-term]' ? launcher : null;
const click = main.dispatch('click', { target: launcher });
assert(click.defaultPrevented && click.propagationStopped, 'Help must not activate an answer or a details summary');
assert(help.isOpen());
assert.equal(nodes.get('#term-title').textContent, 'CSP nonce');
assert.equal(nodes.get('#term-description').textContent, context.entries.get('csp-nonce').description);
assert(nodes.get('#term-example').textContent && nodes.get('#term-close').focused);
dialog.dispatch('click', { clientX: 120, clientY: 120 });
assert(help.isOpen(), 'Clicking inside dialog padding must not dismiss it');
dialog.dispatch('click', { clientX: 10, clientY: 10 });
assert(!help.isOpen() && launcher.focused, 'Backdrop dismissal restores focus');
launcher.focused = false;
main.dispatch('click', { target: launcher });
assert(dialog.dispatch('cancel').defaultPrevented);
assert(!help.isOpen() && launcher.focused, 'Escape dismissal restores focus');
main.dispatch('click', { target: launcher });
nodes.get('#term-close').dispatch('click');
assert(!help.isOpen(), 'Close control dismisses the dialog');
launcher.dataset.term = 'cve-2022-3602';
main.dispatch('click', { target: launcher });
assert(help.isOpen());
assert.equal(nodes.get('#term-title').textContent, context.entries.get('cve-2022-3602').title);
assert.equal(nodes.get('#term-description').textContent, context.entries.get('cve-2022-3602').description, 'CVE click opens the specific vulnerability explanation');
assert.equal(nodes.get('#term-example').textContent, context.entries.get('cve-2022-3602').example);
nodes.get('#term-close').dispatch('click');
nodes.get('#confirm-dialog').open = true;
main.dispatch('click', { target: launcher });
assert(!help.isOpen(), 'Do not open help over a confirmation dialog');

for (const page of ['index.html', 'compliance.html', 'senior.html', 'ai-security.html', 'scenarios.html', 'all-questions.html', 'topic-wheel.html']) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  assert(html.includes('src="./glossary.js" defer'));
  assert(html.includes('id="term-dialog"') && html.includes('aria-describedby="term-description"'));
}
assert(fs.readFileSync(path.join(root, '.github/workflows/deploy-pages.yml'), 'utf8').includes('style.css glossary.js app.js'), 'Pages must include the shared dictionary');
console.log(`PASS: ${context.entries.size} plain-language definitions, all aliases, 100 tools + 140 imported + 100 research + 60 OSI protocol questions with clickable concept coverage and valid sources, phrase priority, word boundaries, safe markup, dialog dismissal/focus and seven-page publication.`);

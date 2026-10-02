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
nodes.get('#confirm-dialog').open = true;
main.dispatch('click', { target: launcher });
assert(!help.isOpen(), 'Do not open help over a confirmation dialog');

for (const page of ['index.html', 'senior.html', 'ai-security.html']) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  assert(html.includes('src="./glossary.js" defer'));
  assert(html.includes('id="term-dialog"') && html.includes('aria-describedby="term-description"'));
}
assert(fs.readFileSync(path.join(root, '.github/workflows/deploy-pages.yml'), 'utf8').includes('style.css glossary.js app.js'), 'Pages must include the shared dictionary');
console.log(`PASS: ${context.entries.size} plain-language definitions, all aliases, phrase priority, word boundaries, safe markup, AI terms, dialog dismissal/focus and three-page publication.`);

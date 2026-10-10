'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'wheel-visual.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'wheel-visual.css'), 'utf8');
const degrees = angle => ((angle % 360) + 360) % 360;
const angleDistance = (a, b) => Math.abs(degrees(a - b + 180) - 180);

function runtime(topics, reducedMotion = false) {
  const timers = new Map();
  const listeners = new Map();
  const classes = new Set();
  const styles = new Map();
  const wheel = {classList: {add: name => classes.add(name), remove: name => classes.delete(name)}};
  let timerId = 0;
  const disc = {
    dataset: {wheelIds: JSON.stringify(topics.map(topic => String(topic.id))), wheelRotation: '0'},
    style: {setProperty: (name, value) => styles.set(name, value)},
    closest: selector => selector === '.topic-wheel' ? wheel : null,
    getBoundingClientRect: () => ({width: 320, height: 320}),
    addEventListener(name, listener) { listeners.set(name, listener); },
    removeEventListener(name, listener) { if (listeners.get(name) === listener) listeners.delete(name); },
    dispatch(name, properties = {}) { listeners.get(name)?.({target: disc, propertyName: 'transform', ...properties}); }
  };
  const container = {querySelector: selector => selector === '[data-wheel-disc]' ? disc : null};
  const context = {window: {
    matchMedia: query => ({matches: query === '(prefers-reduced-motion: reduce)' && reducedMotion}),
    setTimeout(callback, delay) { const id = ++timerId; timers.set(id, {callback, delay}); return id; },
    clearTimeout(id) { timers.delete(id); }
  }, Math: Object.create(Math)};
  // The visual must never generate or change the outcome chosen and saved by the trainer.
  context.Math.random = () => { throw new Error('Visual must not choose an outcome'); };
  vm.createContext(context);
  vm.runInContext(source, context);
  return {view: context.window.TrainerWheelView, container, disc, timers, listeners, classes, styles};
}

(async () => {
  const empty = runtime([]);
  assert(!empty.view.markup([]).includes('<svg'));
  await empty.view.animate(empty.container, [], null);
  assert.equal(empty.timers.size, 0);

  for (const count of [1, 2, 51, 52]) {
    const topics = Array.from({length: count}, (_, index) => ({id: `topic-${index}`, title: `Тема ${index + 1}`, count: index + 1}));
    const r = runtime(topics);
    const markup = r.view.markup(topics);
    assert.equal((markup.match(/data-wheel-sector="/g) || []).length, count);
    assert.equal((markup.match(/<li>/g) || []).length, count);
    const labels = [...markup.matchAll(/<g transform="translate\(([\d.-]+) ([\d.-]+)\)"><text[^>]+>(\d+)<\/text><\/g>/g)];
    assert.equal(labels.length, count);
    for (let index = 0; index < count; index++) {
      assert.equal(Number(labels[index][3]), index + 1, 'Sector numbers follow exactly the legend order');
      const before = Number(r.disc.dataset.wheelRotation);
      const promise = r.view.animate(r.container, topics, topics[index].id);
      if (count > 1) {
        assert(r.classes.has('is-spinning'));
        assert.equal(r.timers.size, 1, 'Every animation has a bounded fallback');
        const timeout = [...r.timers.values()][0];
        assert(timeout.delay > 2100 && timeout.delay < 3000);
        assert(Number(r.disc.dataset.wheelRotation) >= before + 4 * 360, 'The visual advances smoothly in the same direction');
        r.disc.dispatch('transitionend', {target: {}, propertyName: 'transform'});
        assert.equal(r.timers.size, 1, 'A text label transition must not finish the disc animation');
        r.disc.dispatch('transitionend', {propertyName: 'opacity'});
        assert.equal(r.timers.size, 1, 'Unrelated transition properties do not finish the spin');
        r.disc.dispatch('transitionend');
      }
      await promise;
      const labelAngle = Math.atan2(Number(labels[index][2]) - 160, Number(labels[index][1]) - 160) * 180 / Math.PI;
      const finalAngle = Number(r.disc.dataset.wheelRotation);
      assert(angleDistance(labelAngle + finalAngle, -90) < 0.0001, `The pointer must land on sector ${index + 1}/${count}`);
      assert.equal(r.styles.get('--wheel-angle'), `${finalAngle}deg`);
      assert.equal(r.timers.size, 0);
      assert.equal(r.listeners.size, 0);
      assert(!r.classes.has('is-spinning'));
    }
    assert(css.includes('transform:rotate(var(--wheel-angle,0deg))'), 'Clockwise SVG rotation must match tested geometry');
    assert(css.includes('left:50%;top:1px'), 'The fixed pointer is at twelve o’clock');
  }

  const topics = [{id: 'first', title: 'Первая'}, {id: 'last', title: 'Последняя'}];
  const reduced = runtime(topics, true);
  await reduced.view.animate(reduced.container, topics, 'last');
  assert.equal(Number(reduced.disc.dataset.wheelRotation), 180);
  assert.equal(reduced.timers.size, 0);
  assert(!reduced.classes.has('is-spinning'));
  assert(css.includes('@media (prefers-reduced-motion:reduce)'));

  const fallback = runtime(topics);
  const missingTransition = fallback.view.animate(fallback.container, topics, 'last');
  const timer = [...fallback.timers.values()][0];
  timer.callback();
  await missingTransition;
  assert.equal(degrees(Number(fallback.disc.dataset.wheelRotation)), 180);
  assert.equal(fallback.listeners.size, 0);
  assert.equal(fallback.timers.size, 0);

  const cancelled = runtime(topics);
  const interrupted = cancelled.view.animate(cancelled.container, topics, 'last');
  cancelled.disc.dispatch('transitioncancel');
  await interrupted;
  assert.equal(degrees(Number(cancelled.disc.dataset.wheelRotation)), 180);
  assert.equal(cancelled.listeners.size, 0);

  const escaped = runtime(topics);
  const hostile = escaped.view.markup([{id: '\"><svg onload="bad()">', title: '<img src=x onerror="bad()"> & \'topic\'', count: 2}]);
  assert(!hostile.includes('<img'));
  assert.equal((hostile.match(/<svg\b/g) || []).length, 1, 'IDs cannot inject extra SVG markup');
  assert(hostile.includes('&lt;img') && hostile.includes('&quot;') && hostile.includes('&amp;'));
  const actualTagAttributes = (hostile.match(/<[^>]+>/g) || []).map(tag => tag.replace(/"[^"]*"|'[^']*'/g, '""')).join(' ');
  assert(!/\son(?:click|load|error)=/.test(actualTagAttributes), 'Escaped text must never become an event-handler attribute');
  await assert.rejects(() => escaped.view.animate(escaped.container, topics, 'unknown'), /absent/);
  await assert.rejects(() => escaped.view.animate(escaped.container, [...topics].reverse(), 'last'), /does not match/);
  assert.equal(escaped.timers.size, 0);

  console.log('PASS: wheel geometry for every sector at 1/2/51/52 topics, zero topics, repeated spins, escaped labels/IDs, uniform-outcome separation, reduced motion, transition completion/cancellation and bounded fallback.');
})().catch(error => { console.error(error); process.exitCode = 1; });

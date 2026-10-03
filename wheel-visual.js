'use strict';
(() => {
  const DURATION_MS = 2100;
  const FALLBACK_MS = DURATION_MS + 300;
  const COLORS = ['#d9e8ff', '#99c1fa', '#c3dcff', '#79acee', '#eaf2ff', '#b0cff7'];
  const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));
  const degrees = value => ((value % 360) + 360) % 360;
  const point = angle => {
    const radians = angle * Math.PI / 180;
    return [160 + 144 * Math.cos(radians), 160 + 144 * Math.sin(radians)].map(value => Number(value.toFixed(5)));
  };
  const ids = topics => topics.map(topic => String(topic.id));
  const questionCount = value => `${value} ${value % 10 === 1 && value % 100 !== 11 ? 'вопрос' : value % 10 >= 2 && value % 10 <= 4 && (value % 100 < 12 || value % 100 > 14) ? 'вопроса' : 'вопросов'}`;

  function markup(topics) {
    if (!Array.isArray(topics)) throw new TypeError('Wheel topics must be an array');
    if (!topics.length) return '<section class="topic-wheel topic-wheel-empty"><p>Нет тем для выбора.</p></section>';
    const count = topics.length;
    const step = 360 / count;
    const sectors = topics.map((topic, index) => {
      // Sector zero starts half a sector before twelve o’clock: its centre is under the pointer.
      const start = point(-90 + index * step - step / 2);
      const end = point(-90 + index * step + step / 2);
      const shape = count === 1
        ? `<circle cx="160" cy="160" r="144" fill="${COLORS[0]}" data-wheel-sector="0"/>`
        : `<path d="M160 160 L${start.join(' ')} A144 144 0 ${step > 180 ? 1 : 0} 1 ${end.join(' ')} Z" fill="${COLORS[index % COLORS.length]}" data-wheel-sector="${index}"/>`;
      const radians = (-90 + index * step) * Math.PI / 180;
      const labelX = (160 + 125 * Math.cos(radians)).toFixed(5);
      const labelY = (160 + 125 * Math.sin(radians)).toFixed(5);
      return `${shape}<g transform="translate(${labelX} ${labelY})"><text class="topic-wheel-number" x="0" y="0" text-anchor="middle" dominant-baseline="central">${index + 1}</text></g>`;
    }).join('');
    const legend = topics.map(topic => `<li><span>${escapeHTML(topic.title)}</span>${Number.isInteger(topic.count) && topic.count >= 0 ? `<small>${questionCount(topic.count)}</small>` : ''}</li>`).join('');
    return `<section class="topic-wheel${count > 24 ? ' topic-wheel-dense' : ''}"><div class="topic-wheel-surface" role="img" aria-label="Барабан из ${count} тем. Указатель находится сверху; номера соответствуют списку тем."><span class="topic-wheel-pointer" aria-hidden="true"></span><svg class="topic-wheel-disc" data-wheel-disc data-wheel-ids="${escapeHTML(JSON.stringify(ids(topics)))}" data-wheel-rotation="0" viewBox="0 0 320 320" aria-hidden="true" focusable="false">${sectors}<circle class="topic-wheel-hub" cx="160" cy="160" r="25"/></svg><span class="topic-wheel-hub-label" aria-hidden="true">ИБ</span></div><p class="topic-wheel-hint">Номера секторов соответствуют темам в списке.</p><details class="topic-wheel-legend"><summary>Темы на барабане: ${count}</summary><ol>${legend}</ol></details></section>`;
  }

  async function animate(container, topics, selectedId) {
    if (!Array.isArray(topics)) throw new TypeError('Wheel topics must be an array');
    if (!topics.length) return;
    const topicIds = ids(topics);
    const selectedIndex = topicIds.indexOf(String(selectedId));
    if (selectedIndex < 0) throw new Error('Selected topic is absent from the wheel');
    const disc = container.querySelector('[data-wheel-disc]');
    if (!disc || disc.dataset.wheelIds !== JSON.stringify(topicIds)) throw new Error('Wheel markup does not match the topic order');
    const wheel = disc.closest('.topic-wheel');
    const previousRotation = Number(disc.dataset.wheelRotation);
    const currentRotation = Number.isFinite(previousRotation) ? previousRotation : 0;
    const selectedRotation = degrees(-selectedIndex * 360 / topics.length);
    const reducedMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const setRotation = angle => {
      disc.dataset.wheelRotation = String(angle);
      disc.style.setProperty('--wheel-angle', `${angle}deg`);
    };
    if (reducedMotion || topics.length === 1) {
      wheel.classList.remove('is-spinning');
      setRotation(selectedRotation);
      return;
    }
    // Outcome comes from the trainer. The view only advances to its exact sector centre.
    const finalRotation = currentRotation + 4 * 360 + degrees(selectedRotation - degrees(currentRotation));
    wheel.classList.add('is-spinning');
    disc.style.setProperty('--wheel-duration', `${DURATION_MS}ms`);
    // Commit the current transform before changing the target, including on first render.
    disc.getBoundingClientRect();
    await new Promise(resolve => {
      let settled = false;
      let timeout;
      const finish = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        disc.removeEventListener('transitionend', onEnd);
        disc.removeEventListener('transitioncancel', onEnd);
        wheel.classList.remove('is-spinning');
        // With cancelled/missing transitions the persisted choice still gets an exact static endpoint.
        setRotation(finalRotation);
        resolve();
      };
      const onEnd = event => {
        if (event.target === disc && event.propertyName === 'transform') finish();
      };
      disc.addEventListener('transitionend', onEnd);
      disc.addEventListener('transitioncancel', onEnd);
      timeout = window.setTimeout(finish, FALLBACK_MS);
      setRotation(finalRotation);
    });
  }

  window.TrainerWheelView = Object.freeze({markup, animate});
})();

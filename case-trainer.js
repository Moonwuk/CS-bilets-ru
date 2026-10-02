(() => {
  'use strict';

  const CONFIGS = {
    senior: { file: './senior-questions.json', key: 'cs-bilets-ru.senior.v1', prefix: 's' },
    'ai-security': { file: './ai-security-questions.json', key: 'cs-bilets-ru.ai-security.v1', prefix: 'ai' }
  };
  const bankId = document.body.dataset.bank;
  const config = Object.prototype.hasOwnProperty.call(CONFIGS, bankId) ? CONFIGS[bankId] : null;
  const NOTE_LIMIT = 6000;
  const LETTERS = ['А', 'Б', 'В', 'Г'];
  const $ = selector => document.querySelector(selector);
  const main = $('#main');
  const esc = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const termsMarkup = window.TrainerTerms.markup;
  const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const isObject = value => !!value && typeof value === 'object' && !Array.isArray(value);
  const nonempty = value => typeof value === 'string' && value.trim().length > 0;
  const validMode = value => value === 'practice' || value === 'interview';
  const stringList = (value, minimum = 1) => Array.isArray(value) && value.length >= minimum && value.every(nonempty);
  const counter = value => Number.isSafeInteger(value) && value >= 0;
  const dateLabel = value => value.split('-').reverse().join('.');
  const modeLabel = value => value === 'interview' ? 'Репетиция собеседования' : 'Обучение';
  let dataset = null;
  let questions = new Map();
  let sources = new Map();
  let tracks = new Map();
  let signature = '';
  let progress = emptyProgress();
  let storageAvailable = true;
  let notice = '';
  let confirmation = null;
  let loading = false;

  function emptyProgress() {
    return { total: 0, correctTotal: 0, completed: 0, errors: new Set(), mode: 'practice', view: 'home', session: null };
  }

  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  function validUrl(value) {
    if (!nonempty(value) || value !== value.trim()) return false;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password;
    } catch (_) { return false; }
  }

  function validateBank(data) {
    const require = (condition, message) => { if (!condition) throw new Error(message); };
    require(isObject(data) && data.schemaVersion === 1 && data.id === bankId, 'Неверный формат или идентификатор банка.');
    require(nonempty(data.title) && nonempty(data.description) && validDate(data.reviewedAt), 'Не заполнены сведения о банке.');
    require(Array.isArray(data.tracks) && data.tracks.length === 4, 'Банк должен содержать четыре направления.');
    const trackIds = new Set();
    for (const track of data.tracks) {
      require(isObject(track) && typeof track.id === 'string' && /^[a-z][a-z0-9-]{0,60}$/.test(track.id) && nonempty(track.title), 'Некорректное направление.');
      require(!trackIds.has(track.id), 'Повторяющийся идентификатор направления.');
      require(track.description === undefined || nonempty(track.description), 'Некорректное описание направления.');
      trackIds.add(track.id);
    }
    require(Array.isArray(data.sources) && data.sources.length > 0, 'В банке отсутствуют источники.');
    const sourceIds = new Set();
    for (const source of data.sources) {
      require(isObject(source) && typeof source.id === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,100}$/.test(source.id), 'Некорректный идентификатор источника.');
      require(!sourceIds.has(source.id) && nonempty(source.title) && nonempty(source.publisher) && validUrl(source.url) && validDate(source.accessedAt), 'Невалидный или повторяющийся источник.');
      sourceIds.add(source.id);
    }
    require(Array.isArray(data.questions) && data.questions.length >= 10, 'В банке недостаточно сценариев.');
    const questionIds = new Set();
    for (const question of data.questions) {
      require(isObject(question) && typeof question.id === 'string' && new RegExp(`^${config.prefix}\\d{3,5}$`).test(question.id) && !questionIds.has(question.id), 'Невалидный или повторяющийся идентификатор сценария.');
      questionIds.add(question.id);
      require(trackIds.has(question.track) && nonempty(question.title) && nonempty(question.question), 'Не заполнен сценарий или его направление.');
      require(['intermediate', 'advanced'].includes(question.difficulty), 'Не указана сложность сценария.');
      require(stringList(question.evidence) && stringList(question.constraints), 'Не заполнены факты или ограничения сценария.');
      require(Array.isArray(question.options) && question.options.length === 4, 'Требуются четыре варианта ответа.');
      require(question.options.every((option, index) => isObject(option) && option.sourceLetter === LETTERS[index] && nonempty(option.text) && typeof option.correct === 'boolean' && nonempty(option.explanation)), 'Некорректный вариант ответа.');
      require(new Set(question.options.map(option => option.text.trim().toLocaleLowerCase('ru-RU'))).size === 4, 'Варианты ответа не должны повторяться.');
      require(question.options.filter(option => option.correct).length === 1, 'В сценарии должен быть один лучший ответ.');
      require(Array.isArray(question.prerequisites) && question.prerequisites.length > 0 && question.prerequisites.every(item => isObject(item) && nonempty(item.term) && nonempty(item.explanation)), 'Не заполнены опорные понятия.');
      require(stringList(question.reasoning) && stringList(question.tradeoffs) && nonempty(question.whatChangesAnswer), 'Не заполнен подробный разбор.');
      require(Array.isArray(question.followUps) && question.followUps.length > 0 && question.followUps.every(item => isObject(item) && nonempty(item.question) && nonempty(item.answer)), 'Не заполнены дополнительные вопросы.');
      require(Array.isArray(question.references) && question.references.length > 0 && question.references.every(ref => isObject(ref) && sourceIds.has(ref.sourceId) && nonempty(ref.locator)), 'Не заполнены ссылки на технические источники.');
    }
    for (const id of trackIds) require(data.questions.filter(question => question.track === id).length >= 3, 'В каждом направлении нужны хотя бы три сценария.');
    require(data.methodology === undefined || nonempty(data.methodology), 'Некорректное описание методики.');
    require(data.interviewCollections === undefined || (Array.isArray(data.interviewCollections) && data.interviewCollections.every(collection => isObject(collection) && nonempty(collection.title) && validUrl(collection.url) && (collection.note === undefined || nonempty(collection.note)) && (collection.tracks === undefined || (Array.isArray(collection.tracks) && collection.tracks.every(id => trackIds.has(id)))))), 'Некорректная подборка собеседований.');
    return data;
  }

  function bankSignature(data) {
    // Detect content changes, including a changed answer or explanation, before restoring an attempt.
    const text = JSON.stringify(data);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
    return `v1-${text.length}-${(hash >>> 0).toString(16)}`;
  }

  function shuffled(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [result[index], result[other]] = [result[other], result[index]];
    }
    return result;
  }

  function mixedIds() {
    const groups = shuffled(dataset.tracks).map(track => shuffled(dataset.questions.filter(question => question.track === track.id).map(question => question.id)));
    const ids = [];
    for (let index = 0; ids.length < 10; index++) {
      const group = groups[index % groups.length];
      if (group.length) ids.push(group.pop());
    }
    return ids;
  }

  function validateSession(value) {
    if (!isObject(value) || !validMode(value.mode) || typeof value.finished !== 'boolean' || !nonempty(value.title) || value.title.length > 250) return null;
    if (!Array.isArray(value.ids) || value.ids.length === 0 || value.ids.length > dataset.questions.length || !value.ids.every(id => typeof id === 'string' && questions.has(id)) || new Set(value.ids).size !== value.ids.length) return null;
    if (!Number.isInteger(value.index) || value.index < 0 || value.index >= value.ids.length || !isObject(value.orders) || !isObject(value.answers) || !isObject(value.notes)) return null;
    const ids = new Set(value.ids);
    const orders = Object.create(null);
    const answers = Object.create(null);
    const notes = Object.create(null);
    if (Object.keys(value.orders).length !== ids.size || Object.keys(value.orders).some(id => !ids.has(id))) return null;
    for (const id of ids) {
      const order = value.orders[id];
      if (!Array.isArray(order) || order.length !== 4 || new Set(order).size !== 4 || !order.every(index => Number.isInteger(index) && index >= 0 && index < 4)) return null;
      orders[id] = [...order];
    }
    for (const [id, answer] of Object.entries(value.answers)) {
      if (!ids.has(id) || !Number.isInteger(answer) || answer < 0 || answer > 3) return null;
      answers[id] = answer;
    }
    for (const [id, note] of Object.entries(value.notes)) {
      if (!ids.has(id) || typeof note !== 'string' || note.length > NOTE_LIMIT) return null;
      notes[id] = note;
    }
    if (!Array.isArray(value.checked) || new Set(value.checked).size !== value.checked.length || !value.checked.every(id => ids.has(id) && has(answers, id)) || (value.mode === 'interview' && value.checked.length)) return null;
    return { ids: [...value.ids], title: value.title, mode: value.mode, index: value.index, orders, answers, notes, checked: new Set(value.checked), finished: value.finished };
  }

  function restoreProgress() {
    progress = emptyProgress();
    let saved;
    try {
      const text = window.localStorage.getItem(config.key);
      if (!text) return;
      try { saved = JSON.parse(text); } catch (_) {
        notice = 'Сохранение этого банка повреждено. Начата новая запись прогресса.';
        return;
      }
    } catch (_) { storageAvailable = false; return; }
    if (!isObject(saved) || saved.version !== 1 || saved.bankId !== bankId || !counter(saved.total) || !counter(saved.correctTotal) || saved.correctTotal > saved.total || !counter(saved.completed) || !Array.isArray(saved.errors)) {
      notice = 'Формат сохранения этого банка не распознан. Начата новая запись прогресса.';
      return;
    }
    progress.total = saved.total;
    progress.correctTotal = saved.correctTotal;
    progress.completed = saved.completed;
    progress.errors = new Set(saved.errors.filter(id => typeof id === 'string' && questions.has(id)));
    progress.mode = validMode(saved.mode) ? saved.mode : 'practice';
    if (saved.signature !== signature) {
      notice = 'Банк обновился. Общие счётчики и известные ошибки сохранены. Предыдущая попытка и её заметки сброшены, чтобы не сопоставлять ответы с изменившимися сценариями.';
      return;
    }
    if (saved.session !== null && saved.session !== undefined) {
      progress.session = validateSession(saved.session);
      if (!progress.session) notice = 'Сохранённая попытка повреждена и сброшена. Общие счётчики и известные ошибки сохранены.';
      else {
        const minimumScored = progress.session.finished ? progress.session.ids.length : progress.session.checked.size;
        const minimumCorrect = progress.session.finished
          ? progress.session.ids.filter(id => isCorrect(id)).length
          : [...progress.session.checked].filter(id => isCorrect(id)).length;
        if (progress.total < minimumScored || progress.correctTotal < minimumCorrect || progress.total - progress.correctTotal < minimumScored - minimumCorrect || (progress.session.finished && progress.completed === 0)) {
          progress.session = null;
          notice = 'Сохранённая попытка не согласуется со счётчиками и сброшена. Общие счётчики и известные ошибки сохранены.';
        }
      }
    }
    progress.view = saved.view === 'session' && progress.session ? 'session' : 'home';
  }

  function saveProgress() {
    if (!dataset) return;
    const session = progress.session;
    const value = {
      version: 1, bankId, signature, total: progress.total, correctTotal: progress.correctTotal,
      completed: progress.completed, errors: [...progress.errors], mode: progress.mode, view: progress.view,
      session: session ? { ...session, checked: [...session.checked] } : null
    };
    try { window.localStorage.setItem(config.key, JSON.stringify(value)); storageAvailable = true; }
    catch (_) { storageAvailable = false; }
    updateStats();
  }

  function updateStats() {
    $('#stat-total').textContent = progress.total;
    $('#stat-correct').textContent = progress.correctTotal;
    $('#stat-errors').textContent = progress.errors.size;
    $('#storage-status').textContent = storageAvailable
      ? 'Текущая или последняя попытка и заметки сохраняются в этом браузере.'
      : 'Сохранение недоступно. Новые результаты и заметки могут потеряться при закрытии страницы.';
  }

  function announce(message) { $('#announcement').textContent = message; }
  function focusMain() { main.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'auto' }); }
  function focusElement(selector, preventScroll = true) { const element = main.querySelector(selector); if (element) element.focus({ preventScroll }); }
  function noticeMarkup() { return notice ? `<div class="case-notice" role="status">${esc(notice)}</div>` : ''; }
  function listMarkup(items, ordered = false) { const tag = ordered ? 'ol' : 'ul'; return `<${tag}>${items.map(item => `<li>${termsMarkup(item)}</li>`).join('')}</${tag}>`; }

  function methodologyMarkup() {
    const collections = dataset.interviewCollections || [];
    return `<details class="case-methodology"><summary>О сценариях и источниках</summary>
      <p>Это авторские учебные ситуации. Они помогают разбирать технические решения и готовиться к обсуждению на собеседовании. Их формулировки не являются заданиями конкретного работодателя или официального экзамена.</p>
      ${dataset.methodology ? `<p>${esc(dataset.methodology)}</p>` : ''}
      <p>После проверки доступны объяснения всех вариантов, ход рассуждений, компромиссы, изменённые условия и вопросы для устного ответа. Технические положения сопровождаются ссылками на первичные источники и указанием раздела.</p>
      <p>Материалы проверены <time datetime="${esc(dataset.reviewedAt)}">${dateLabel(dataset.reviewedAt)}</time>. Реальная система может иметь другие ограничения: сравнивайте их с условиями сценария.</p>
      ${collections.length ? `<p>Открытые подборки для изучения тем технических собеседований:</p><ul>${collections.map(collection => `<li><a href="${esc(collection.url)}" target="_blank" rel="noopener noreferrer">${esc(collection.title)}</a>${collection.note ? ` — ${esc(collection.note)}` : ''}</li>`).join('')}</ul>` : ''}
      <p>Заметки проверяются самостоятельно по разбору. Автоматически оценивается только выбранный вариант. Процент верных решений не подтверждает квалификацию или рабочий опыт.</p>
      <p>Сохраняется одна текущая или последняя попытка. Новая попытка заменяет предыдущую; общие счётчики и список ошибок остаются. Каждый банк хранит свой прогресс отдельно.</p>
    </details>`;
  }

  function renderHome() {
    const session = progress.session;
    const accuracy = progress.total ? `${Math.round(progress.correctTotal / progress.total * 100)}%` : '—';
    main.innerHTML = `${noticeMarkup()}
      <header class="page-heading"><div><span class="eyebrow">От фактов к решению</span><h1>${esc(dataset.title)}</h1><p class="case-intro">${esc(dataset.description)}</p></div></header>
      <div class="case-notice"><p>Сначала разберите факты и ограничения, выберите лучший вариант и при желании запишите ход мысли. Затем сравните своё решение с подробным разбором.</p><p>Если тема новая, в режиме обучения можно раскрыть опорные понятия до ответа.</p></div>
      <div class="case-summary"><span><strong>${dataset.questions.length}</strong> сценариев</span><span><strong>${dataset.tracks.length}</strong> направления</span><span>Завершено попыток: <strong>${progress.completed}</strong></span><span>Верных решений: <strong>${accuracy}</strong></span><span>Ошибок: <strong>${progress.errors.size}</strong></span></div>
      ${session ? `<section class="resume-card" aria-label="Сохранённая попытка"><div><strong>${session.finished ? 'Разбор последней попытки' : 'Есть незавершённая попытка'}</strong><p>${esc(session.title)} · ${esc(modeLabel(session.mode))} · ${session.finished ? `${session.ids.filter(id => isCorrect(id)).length} из ${session.ids.length} верно` : `выбрано ответов ${Object.keys(session.answers).length} из ${session.ids.length}`}</p></div><button class="button primary" data-action="resume">${session.finished ? 'Открыть разбор' : 'Продолжить'}</button></section>` : ''}
      <div class="mode-bar"><div class="mode-switch case-mode-switch" role="group" aria-label="Когда показывать разбор"><button data-mode="practice" aria-pressed="${progress.mode === 'practice'}">Обучение</button><button data-mode="interview" aria-pressed="${progress.mode === 'interview'}">Собеседование</button></div><p class="mode-hint case-mode-help">${progress.mode === 'practice' ? 'Разбор после проверки каждого решения. Опорные понятия доступны заранее.' : 'Вся обратная связь — после завершения. Опорные понятия и источники до этого скрыты.'}</p></div>
      <div class="case-choice-grid">
        <section class="ticket-card quick-card"><h2>Смешанная десятка</h2><p>По 2–3 сценария из каждого направления. Подходит для одной вдумчивой сессии.</p><button class="button primary" data-start="mixed">Начать 10 сценариев</button></section>
        <section class="ticket-card"><h2>Весь банк</h2><p>Все ${dataset.questions.length} сценариев. Порядок вопросов и вариантов перемешивается в каждой попытке.</p><button class="button secondary" data-start="all">Пройти весь банк</button></section>
        <section class="ticket-card"><h2>Работа над ошибками</h2><p>${progress.errors.size ? `Сценариев для повторения: ${progress.errors.size}. Верное решение убирает сценарий из списка ошибок.` : 'После проверки сюда попадут неверные решения и вопросы, пропущенные при завершении.'}</p><button class="button secondary" data-start="mistakes" ${progress.errors.size ? '' : 'disabled'}>Повторить ошибки</button></section>
      </div>
      <section class="case-tracks" aria-labelledby="tracks-heading"><div class="section-heading"><h2 id="tracks-heading">Выбрать направление</h2></div><div class="topic-grid">${dataset.tracks.map(track => `<button class="topic-card" data-track="${esc(track.id)}"><span class="case-track-copy"><span class="topic-name">${esc(track.title)}</span><span class="topic-count">${dataset.questions.filter(question => question.track === track.id).length} сценариев${track.description ? ` · ${esc(track.description)}` : ''}</span></span><span class="case-track-arrow" aria-hidden="true">→</span></button>`).join('')}</div></section>
      <p class="case-score-note">Объясните решающий факт, назовите оставшийся риск и проверьте, как ответ изменится при других условиях.</p>
      ${methodologyMarkup()}`;
    bindMain();
    updateStats();
  }

  function foundationsMarkup(question) {
    return `<details class="case-foundations"><summary>Опорные понятия</summary><dl>${question.prerequisites.map(item => `<dt>${termsMarkup(item.term)}</dt><dd>${termsMarkup(item.explanation)}</dd>`).join('')}</dl></details>`;
  }

  function scenarioMarkup(question) {
    return `<p class="case-prompt">${termsMarkup(question.question)}</p><div class="case-context"><section><h3>Известные факты</h3>${listMarkup(question.evidence)}</section><section><h3>Ограничения и условия</h3>${listMarkup(question.constraints)}</section></div>`;
  }

  function deepReviewMarkup(question, order) {
    return `<div class="case-review">
      <section><h3>Почему выбран этот ответ</h3>${order.map((optionIndex, displayIndex) => { const option = question.options[optionIndex]; return `<div class="case-option-reason ${option.correct ? 'best' : ''}"><strong>${LETTERS[displayIndex]}. ${termsMarkup(option.text)}</strong>${option.correct ? '<span class="case-option-status">Лучший ответ при заданных условиях</span>' : ''}<p>${termsMarkup(option.explanation)}</p></div>`; }).join('')}</section>
      <section><h3>Ход рассуждений</h3>${listMarkup(question.reasoning, true)}</section>
      <section><h3>Компромиссы и остаточные риски</h3>${listMarkup(question.tradeoffs)}</section>
      <section><h3>Что изменит ответ</h3><p>${termsMarkup(question.whatChangesAnswer)}</p></section>
      <section><h3>Углублённые вопросы для собеседования</h3><p>Сначала попробуйте ответить вслух, затем раскройте ориентир для самопроверки.</p>${question.followUps.map(item => `<details class="case-followup"><summary>${termsMarkup(item.question)}</summary><p>${termsMarkup(item.answer)}</p></details>`).join('')}</section>
      ${foundationsMarkup(question)}
      <section><h3>Технические источники</h3><ul class="case-source-list">${question.references.map(reference => { const source = sources.get(reference.sourceId); return `<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a><small>${esc(source.publisher)} · ${esc(reference.locator)}<br>Проверено: <time datetime="${esc(source.accessedAt)}">${dateLabel(source.accessedAt)}</time></small></li>`; }).join('')}</ul></section>
    </div>`;
  }

  function isCorrect(id) {
    const session = progress.session;
    return !!session && has(session.answers, id) && questions.get(id).options[session.answers[id]].correct;
  }

  function renderQuiz() {
    const session = progress.session;
    if (!session) return renderHome();
    if (session.finished) return renderResults();
    const id = session.ids[session.index];
    const question = questions.get(id);
    const checked = session.mode === 'practice' && session.checked.has(id);
    const answer = session.answers[id];
    const selected = has(session.answers, id);
    const answeredCount = Object.keys(session.answers).length;
    const last = session.index === session.ids.length - 1;
    main.innerHTML = `${noticeMarkup()}
      <div class="quiz-top"><button class="button ghost" data-action="home">← К наборам</button><span>${esc(session.title)}</span><span class="quiz-tag">${esc(modeLabel(session.mode))}</span></div>
      <p class="case-progress-label" role="status">Сценарий ${session.index + 1} из ${session.ids.length} · ${esc(tracks.get(question.track).title)}</p>
      <div class="case-layout"><article class="question-panel" aria-labelledby="case-title">
        <div class="question-context"><span class="level-tag">${question.difficulty === 'advanced' ? 'Углублённый' : 'Переход к сложным задачам'}</span><span>${session.mode === 'interview' ? 'Разбор появится после завершения попытки' : 'Можно учиться в своём темпе'}</span></div>
        <h1 class="case-title" id="case-title" tabindex="-1">${termsMarkup(question.title)}</h1>${scenarioMarkup(question)}
        ${session.mode === 'practice' && !checked ? foundationsMarkup(question) : ''}
        <p class="term-help-hint case-term-hint">Нажмите на подчёркнутый термин — объясним простыми словами.</p><fieldset class="case-options"><legend>Выберите лучший ответ при этих условиях</legend><div class="case-option-list">${session.orders[id].map((optionIndex, displayIndex) => { const option = question.options[optionIndex]; const chosen = selected && answer === optionIndex; const status = checked ? (option.correct ? 'Лучший ответ' : chosen ? 'Ваш ответ · неверно' : '') : ''; return `<div class="case-option ${chosen ? 'selected' : ''} ${checked ? `locked ${option.correct ? 'good' : chosen ? 'bad' : ''}` : ''}"><input type="radio" name="case-answer" id="answer-${optionIndex}" data-answer="${optionIndex}" value="${optionIndex}" aria-label="${LETTERS[displayIndex]}. ${esc(option.text)}" ${chosen ? 'checked' : ''} ${checked ? 'disabled' : ''}><label class="case-option-pick" for="answer-${optionIndex}" aria-hidden="true"></label><span class="case-option-copy"><strong>${LETTERS[displayIndex]}.</strong>${termsMarkup(option.text)}${status ? `<span class="case-option-status">${status}</span>` : ''}</span></div>`; }).join('')}</div></fieldset>
        <div class="case-notes"><label for="reasoning-note">Мои рассуждения <span class="topic-count">Необязательно</span></label><p id="reasoning-help">Какие факты определяют решение? Какие допущения и риски остаются? До ${NOTE_LIMIT} символов. Заметка хранится только в этом браузере; сравните её с разбором самостоятельно.</p><textarea id="reasoning-note" aria-describedby="reasoning-help" maxlength="${NOTE_LIMIT}" rows="5" placeholder="Запишите ход мысли до просмотра ответа…">${esc(session.notes[id] || '')}</textarea></div>
        <div class="case-actions"><button class="button secondary" data-action="previous" ${session.index === 0 ? 'disabled' : ''}>Назад</button><div class="action-right">${session.mode === 'practice' && !checked ? `<button class="button primary" data-action="check" ${selected ? '' : 'disabled'}>Проверить решение</button>` : ''}<button class="button ${session.mode === 'interview' || checked ? 'primary' : 'secondary'}" data-action="${last ? 'finish' : 'next'}">${last ? 'К результатам' : 'Далее'}</button></div></div>
        ${checked ? `<section class="case-feedback ${isCorrect(id) ? '' : 'is-error'}" id="case-feedback" tabindex="-1"><h2>${isCorrect(id) ? 'Решение верное' : 'В выбранном решении есть проблема'}</h2><p>Сравните ход своих рассуждений с разбором. У правильного варианта тоже есть ограничения.</p>${deepReviewMarkup(question, session.orders[id])}</section>` : ''}
      </article><aside class="quiz-map case-map" aria-label="Навигация по сценариям"><p class="quiz-map-title">Сценарии попытки</p><div class="question-grid">${session.ids.map((questionId, index) => { const wasChecked = session.mode === 'practice' && session.checked.has(questionId); const wasAnswered = has(session.answers, questionId); const status = wasChecked ? (isCorrect(questionId) ? 'верно' : 'ошибка') : wasAnswered ? 'ответ выбран' : 'без ответа'; return `<button class="question-number ${wasChecked ? (isCorrect(questionId) ? 'good' : 'bad') : wasAnswered ? 'answered' : ''}" data-jump="${index}" aria-label="Сценарий ${index + 1}: ${status}" ${index === session.index ? 'aria-current="step"' : ''}>${index + 1}</button>`; }).join('')}</div><p class="quiz-progress">Выбрано ответов: ${answeredCount} / ${session.ids.length}${session.mode === 'practice' ? `<br>Проверено: ${session.checked.size}` : ''}</p><button class="button secondary" data-action="finish">Завершить попытку</button></aside></div>
      <p class="keyboard-hint">1–4 — выбрать вариант · Enter — проверить или перейти далее. В поле заметки клавиши вводят текст.</p>`;
    bindMain();
    updateStats();
  }

  function renderResults() {
    const session = progress.session;
    if (!session || !session.finished) return renderQuiz();
    const correct = session.ids.filter(id => isCorrect(id)).length;
    const skipped = session.ids.filter(id => !has(session.answers, id)).length;
    const wrong = session.ids.length - correct;
    main.innerHTML = `${noticeMarkup()}<header class="page-heading"><div><span class="eyebrow">Результат и самопроверка</span><h1>Разбор попытки</h1><p>${esc(session.title)} · ${esc(modeLabel(session.mode))}</p></div></header>
      <section class="result-card"><div class="result-score" aria-label="Верно ${correct} из ${session.ids.length}">${correct}<span> / ${session.ids.length}</span></div><div class="result-copy"><h2>Решения проверены</h2><p>Верно: ${correct}. Неверно: ${wrong - skipped}. Без ответа: ${skipped}.</p><div class="result-actions"><button class="button primary" data-action="retry">Повторить набор</button>${wrong ? '<button class="button secondary" data-action="repeat-wrong">Разобрать ошибки</button>' : ''}<button class="button secondary" data-action="home">К наборам</button></div></div></section>
      <p class="case-score-note">Оценён только выбор варианта. Ваши заметки не получили автоматическую оценку: сравните их с ходом рассуждений, компромиссами и ответами на дополнительные вопросы. Этот результат не является оценкой профессиональной квалификации.</p>
      <section aria-labelledby="review-heading"><div class="section-heading"><h2 id="review-heading">Разбор всех сценариев</h2></div><div class="case-review-list">${session.ids.map((id, index) => { const question = questions.get(id); const chosen = session.answers[id]; const answered = has(session.answers, id); const correctAnswer = isCorrect(id); return `<details class="review-item"><summary><span class="case-review-state ${correctAnswer ? '' : 'bad'}">${correctAnswer ? 'Верно' : answered ? 'Ошибка' : 'Без ответа'}</span>${index + 1}. ${termsMarkup(question.title)}</summary><div class="review-body"><div class="question-context"><span>${esc(tracks.get(question.track).title)}</span></div>${scenarioMarkup(question)}<p class="review-answer ${correctAnswer ? '' : 'wrong'}"><strong>Ваш ответ:</strong> ${answered ? esc(question.options[chosen].text) : 'Не выбран; сценарий добавлен в работу над ошибками.'}</p><section><h3>Мои рассуждения</h3>${session.notes[id] ? `<div class="case-review-note">${esc(session.notes[id])}</div>` : '<p class="topic-count">Заметка не добавлена.</p>'}</section>${deepReviewMarkup(question, session.orders[id])}</div></details>`; }).join('')}</div></section>`;
    bindMain();
    updateStats();
  }

  function render() {
    if (!dataset) return;
    if (progress.view === 'session' && progress.session) renderQuiz();
    else renderHome();
  }

  function recordDecision(id) {
    progress.total++;
    if (isCorrect(id)) { progress.correctTotal++; progress.errors.delete(id); }
    else progress.errors.add(id);
  }

  function startSession(ids, title, mode = progress.mode) {
    if (!dataset || !validMode(mode)) return false;
    const known = [...new Set(ids)].filter(id => questions.has(id));
    if (!known.length) return false;
    const order = shuffled(known);
    const orders = Object.create(null);
    order.forEach(id => { orders[id] = shuffled([0, 1, 2, 3]); });
    progress.session = { ids: order, title, mode, index: 0, orders, answers: Object.create(null), notes: Object.create(null), checked: new Set(), finished: false };
    progress.view = 'session';
    saveProgress();
    renderQuiz();
    focusMain();
    announce(`${modeLabel(mode)}. В попытке ${order.length} сценариев.`);
    return true;
  }

  async function requestStart(kind, trackId) {
    if (!dataset) return;
    const previous = progress.session;
    if (previous && !previous.finished && !await askConfirmation('Начать новую попытку?', 'Новая попытка заменит текущую вместе с её заметками. Уже проверенные решения останутся в общих счётчиках; выбранные, но непроверенные ответы не будут оценены.', 'Начать новую')) return;
    if (kind === 'mixed') startSession(mixedIds(), 'Смешанная десятка');
    if (kind === 'all') startSession(dataset.questions.map(question => question.id), 'Весь банк');
    if (kind === 'mistakes') startSession([...progress.errors], 'Работа над ошибками');
    if (kind === 'track' && tracks.has(trackId)) startSession(dataset.questions.filter(question => question.track === trackId).map(question => question.id), tracks.get(trackId).title);
  }

  function selectAnswer(optionIndex) {
    const session = progress.session;
    if (!session || session.finished || progress.view !== 'session' || !Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex > 3) return;
    const id = session.ids[session.index];
    if (session.mode === 'practice' && session.checked.has(id)) return;
    session.answers[id] = optionIndex;
    saveProgress();
    renderQuiz();
    focusElement(`#answer-${optionIndex}`);
  }

  function saveNote(value) {
    const session = progress.session;
    if (!session || session.finished || typeof value !== 'string') return;
    session.notes[session.ids[session.index]] = value.slice(0, NOTE_LIMIT);
    saveProgress();
  }

  function checkAnswer() {
    const session = progress.session;
    if (!session || session.finished || session.mode !== 'practice') return;
    const id = session.ids[session.index];
    if (session.checked.has(id) || !has(session.answers, id)) return;
    recordDecision(id);
    session.checked.add(id);
    saveProgress();
    renderQuiz();
    focusElement('#case-feedback', false);
    announce(isCorrect(id) ? 'Решение верное. Доступен подробный разбор.' : 'Решение неверное. Доступен подробный разбор.');
  }

  function jump(index) {
    const session = progress.session;
    if (!session || session.finished || !Number.isInteger(index) || index < 0 || index >= session.ids.length) return;
    session.index = index;
    progress.view = 'session';
    saveProgress();
    renderQuiz();
    focusMain();
    announce(`Сценарий ${index + 1} из ${session.ids.length}.`);
  }

  function finishSession() {
    const session = progress.session;
    if (!session || session.finished) return;
    for (const id of session.ids) if (session.mode === 'interview' || !session.checked.has(id)) recordDecision(id);
    session.finished = true;
    progress.completed++;
    progress.view = 'session';
    saveProgress();
    renderResults();
    focusMain();
    announce('Попытка завершена. Доступны результаты и подробный разбор.');
  }

  async function requestFinish() {
    const session = progress.session;
    if (!session || session.finished) return;
    const skipped = session.ids.filter(id => !has(session.answers, id)).length;
    if (skipped && !await askConfirmation('Завершить с пропусками?', `Осталось без ответа: ${skipped}. Эти сценарии попадут в работу над ошибками и будут учтены как неверные. После завершения ответы этой попытки изменить нельзя.`, 'Завершить попытку')) return;
    finishSession();
  }

  function goHome() {
    progress.view = 'home';
    saveProgress();
    renderHome();
    focusMain();
  }

  function resume() {
    if (!progress.session) return;
    progress.view = 'session';
    saveProgress();
    renderQuiz();
    focusMain();
  }

  function setMode(value) {
    if (!validMode(value)) return;
    progress.mode = value;
    saveProgress();
    renderHome();
    focusElement(`[data-mode="${value}"]`);
  }

  function askConfirmation(title, message, okLabel) {
    if (confirmation) return Promise.resolve(false);
    return new Promise(resolve => {
      confirmation = { resolve, previousFocus: document.activeElement };
      $('#dialog-title').textContent = title;
      $('#dialog-message').textContent = message;
      $('#dialog-ok').textContent = okLabel;
      $('#confirm-dialog').showModal();
      $('#dialog-cancel').focus();
    });
  }

  function closeConfirmation(accepted) {
    if (!confirmation) return;
    const current = confirmation;
    confirmation = null;
    $('#confirm-dialog').close();
    if (current.previousFocus && current.previousFocus.isConnected !== false) current.previousFocus.focus();
    current.resolve(accepted);
  }

  async function resetProgress() {
    if (!dataset || !await askConfirmation('Сбросить прогресс этого банка?', 'Будут удалены его счётчики, ошибки, текущая или последняя попытка и заметки. Прогресс двух других банков останется.', 'Сбросить этот банк')) return;
    progress = emptyProgress();
    notice = 'Прогресс этого банка сброшен.';
    saveProgress();
    renderHome();
    focusMain();
    announce('Прогресс этого банка сброшен.');
  }

  function bindMain() {
    main.querySelectorAll('[data-mode]').forEach(element => element.addEventListener('click', () => setMode(element.dataset.mode)));
    main.querySelectorAll('[data-start]').forEach(element => element.addEventListener('click', () => requestStart(element.dataset.start)));
    main.querySelectorAll('[data-track]').forEach(element => element.addEventListener('click', () => requestStart('track', element.dataset.track)));
    main.querySelectorAll('[data-answer]').forEach(element => element.addEventListener('change', () => selectAnswer(Number(element.dataset.answer))));
    main.querySelectorAll('[data-jump]').forEach(element => element.addEventListener('click', () => jump(Number(element.dataset.jump))));
    main.querySelectorAll('[data-action]').forEach(element => element.addEventListener('click', () => {
      const session = progress.session;
      switch (element.dataset.action) {
        case 'home': goHome(); break;
        case 'resume': resume(); break;
        case 'check': checkAnswer(); break;
        case 'previous': if (session) jump(session.index - 1); break;
        case 'next': if (session) jump(session.index + 1); break;
        case 'finish': requestFinish(); break;
        case 'retry': if (session && session.finished) startSession(session.ids, session.title, session.mode); break;
        case 'repeat-wrong': if (session && session.finished) startSession(session.ids.filter(id => !isCorrect(id)), 'Работа над ошибками попытки', 'practice'); break;
        case 'reload': load(); break;
      }
    }));
    const note = main.querySelector('#reasoning-note');
    if (note) note.addEventListener('input', event => saveNote(event.target.value));
  }

  function keyboard(event) {
    const session = progress.session;
    if (!session || session.finished || progress.view !== 'session' || confirmation || window.TrainerTerms.isOpen() || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target;
    if (target && (target.isContentEditable || target.closest?.('[contenteditable="true"]') || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || (target.tagName === 'INPUT' && target.type !== 'radio'))) return;
    if (/^[1-4]$/.test(event.key)) {
      event.preventDefault();
      selectAnswer(session.orders[session.ids[session.index]][Number(event.key) - 1]);
      return;
    }
    if (event.key !== 'Enter' || (target && ['BUTTON', 'A', 'SUMMARY'].includes(target.tagName))) return;
    event.preventDefault();
    const id = session.ids[session.index];
    if (session.mode === 'practice' && !session.checked.has(id)) checkAnswer();
    else if (session.index < session.ids.length - 1) jump(session.index + 1);
    else requestFinish();
  }

  async function load() {
    if (loading) return;
    loading = true;
    try {
      if (!config) throw new Error('Неизвестный банк сценариев.');
      const response = await fetch(config.file);
      if (!response.ok) throw new Error(`Не удалось получить файл банка: HTTP ${response.status}.`);
      const data = validateBank(await response.json());
      dataset = data;
      questions = new Map(data.questions.map(question => [question.id, question]));
      sources = new Map(data.sources.map(source => [source.id, source]));
      tracks = new Map(data.tracks.map(track => [track.id, track]));
      signature = bankSignature(data);
      restoreProgress();
      $('#dataset-info').textContent = `${data.questions.length} сценариев · ${data.tracks.length} направления`;
      $('#reset-progress').disabled = false;
      saveProgress();
      render();
    } catch (error) {
      dataset = null;
      $('#reset-progress').disabled = true;
      $('#dataset-info').textContent = 'Банк недоступен';
      main.innerHTML = '<section class="error-message"><h1>Не удалось загрузить сценарии</h1><p>Проверьте соединение. Если ошибка сохраняется, возможно, файл банка ещё не опубликован или имеет неверный формат.</p><button class="button primary" data-action="reload">Повторить загрузку</button><a class="button secondary" href="./index.html">К базовым билетам</a></section>';
      bindMain();
      console.error('Scenario bank loading failed:', error);
    } finally { loading = false; }
  }

  $('#reset-progress').addEventListener('click', resetProgress);
  $('#dialog-ok').addEventListener('click', () => closeConfirmation(true));
  $('#dialog-cancel').addEventListener('click', () => closeConfirmation(false));
  $('#confirm-dialog').addEventListener('cancel', event => { event.preventDefault(); closeConfirmation(false); });
  document.addEventListener('keydown', keyboard);
  window.addEventListener('pagehide', saveProgress);
  load();
})();

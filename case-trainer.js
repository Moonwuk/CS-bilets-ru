(() => {
  'use strict';

  const CONFIGS = {
    senior: { file: './senior-questions.json', key: 'cs-bilets-ru.senior.v1', prefix: 's', trackCount: 4, label: 'Сеньор' },
    'ai-security': { file: './ai-security-questions.json', key: 'cs-bilets-ru.ai-security.v1', prefix: 'ai', trackCount: 4, label: 'Защита ИИ' },
    scenarios: { file: './scenarios-questions.json', key: 'cs-bilets-ru.scenarios.v1', prefix: 'sc', trackCount: 3, label: 'Ситуационные задачи' },
    'all-questions': { key: 'cs-bilets-ru.all-questions.v1', prefix: '(?:q|ai|sc)', trackCount: 3, label: 'Все вопросы' }
  };
  const bankId = document.body.dataset.bank;
  const config = Object.prototype.hasOwnProperty.call(CONFIGS, bankId) ? CONFIGS[bankId] : null;
  const aggregate = bankId === 'all-questions';
  const itemLabel = aggregate ? 'Вопрос' : 'Сценарий';
  const itemsLabel = aggregate ? 'вопросов' : 'сценариев';
  const itemsFew = aggregate ? 'вопроса' : 'сценария';
  const CHALLENGE_VERSION = 1;
  const NOTE_LIMIT = 6000;
  const LETTERS = ['А', 'Б', 'В', 'Г'];
  const $ = selector => document.querySelector(selector);
  const main = $('#main');
  const esc = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const termsMarkup = window.TrainerTerms.markup;
  const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const isObject = value => !!value && typeof value === 'object' && !Array.isArray(value);
  const nonempty = value => typeof value === 'string' && value.trim().length > 0;
  const validMode = value => aggregate ? value === 'challenge' : value === 'practice' || value === 'interview';
  const stringList = (value, minimum = 1) => Array.isArray(value) && value.length >= minimum && value.every(nonempty);
  const counter = value => Number.isSafeInteger(value) && value >= 0;
  const dateLabel = value => value.split('-').reverse().join('.');
  const modeLabel = value => aggregate ? 'До первой ошибки' : value === 'interview' ? 'Репетиция собеседования' : 'Обучение';
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
    return { total: 0, correctTotal: 0, completed: 0, errors: new Set(), mode: aggregate ? 'challenge' : 'practice', view: 'home', session: null };
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
    require(Array.isArray(data.tracks) && data.tracks.length === config.trackCount, `Банк должен содержать ${config.trackCount} направления.`);
    const trackIds = new Set();
    for (const track of data.tracks) {
      require(isObject(track) && typeof track.id === 'string' && /^[a-z][a-z0-9-]{0,60}$/.test(track.id) && nonempty(track.title), 'Некорректное направление.');
      require(!trackIds.has(track.id), 'Повторяющийся идентификатор направления.');
      require(track.description === undefined || nonempty(track.description), 'Некорректное описание направления.');
      trackIds.add(track.id);
    }
    if (bankId === 'scenarios') require(['mitre', 'owasp', 'cve'].every(id => trackIds.has(id)), 'Не заданы направления MITRE, OWASP и CVE.');
    if (aggregate) require(['basic', 'ai-security', 'scenarios'].every(id => trackIds.has(id)), 'Не заданы разделы общей подборки.');
    require(Array.isArray(data.sources) && data.sources.length > 0, 'В банке отсутствуют источники.');
    const sourceIds = new Set();
    const sourceById = new Map();
    for (const source of data.sources) {
      require(isObject(source) && typeof source.id === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,100}$/.test(source.id), 'Некорректный идентификатор источника.');
      require(!sourceIds.has(source.id) && nonempty(source.title) && validUrl(source.url) && ((aggregate && source.originalBank === 'basic' && source.id.startsWith('basic:')) || (nonempty(source.publisher) && validDate(source.accessedAt))), 'Невалидный или повторяющийся источник.');
      sourceIds.add(source.id);
      sourceById.set(source.id, source);
    }
    require(Array.isArray(data.questions) && data.questions.length >= 10, 'В банке недостаточно сценариев.');
    const questionIds = new Set();
    for (const question of data.questions) {
      require(isObject(question) && typeof question.id === 'string' && new RegExp(`^${config.prefix}\\d{3,5}$`).test(question.id) && !questionIds.has(question.id), 'Невалидный или повторяющийся идентификатор сценария.');
      questionIds.add(question.id);
      require(trackIds.has(question.track) && nonempty(question.title) && nonempty(question.question), 'Не заполнен сценарий или его направление.');
      if (aggregate) {
        const prefixes = { basic: 'q', 'ai-security': 'ai', scenarios: 'sc' };
        require(question.originalBank === question.track && question.id.startsWith(prefixes[question.track]) && question.kind === (question.track === 'basic' ? 'basic' : 'case'), 'Неверный раздел или вид вопроса общей подборки.');
      }
      if (bankId === 'scenarios' || (aggregate && question.originalBank === 'scenarios')) {
        require(isObject(question.basis) && question.basis.family === (aggregate ? question.originalTrack : question.track) && stringList(question.basis.identifiers) && new Set(question.basis.identifiers).size === question.basis.identifiers.length, 'Не заполнена основа ситуационной задачи.');
        require(stringList(question.conceptIds) && new Set(question.conceptIds).size === question.conceptIds.length && question.conceptIds.every(id => /^[a-z][a-z0-9-]*$/.test(id)), 'Не заполнены понятия ситуационной задачи.');
      }
      const basic = aggregate && question.kind === 'basic';
      if (basic) {
        require(question.difficulty === undefined || ['basic', 'intermediate', 'advanced'].includes(question.difficulty), 'Неверная сложность базового вопроса.');
        require(nonempty(question.topic), 'Не указана тема базового вопроса.');
      } else {
        require(['intermediate', 'advanced'].includes(question.difficulty), 'Не указана сложность сценария.');
        require(stringList(question.evidence) && stringList(question.constraints), 'Не заполнены факты или ограничения сценария.');
      }
      require(Array.isArray(question.options) && question.options.length === 4, 'Требуются четыре варианта ответа.');
      require(question.options.every((option, index) => isObject(option) && option.sourceLetter === LETTERS[index] && nonempty(option.text) && typeof option.correct === 'boolean' && nonempty(option.explanation)), 'Некорректный вариант ответа.');
      require(new Set(question.options.map(option => option.text.trim().toLocaleLowerCase('ru-RU'))).size === 4, 'Варианты ответа не должны повторяться.');
      require(question.options.filter(option => option.correct).length === 1, 'В сценарии должен быть один лучший ответ.');
      if (!basic) {
        require(Array.isArray(question.prerequisites) && question.prerequisites.length > 0 && question.prerequisites.every(item => isObject(item) && nonempty(item.term) && nonempty(item.explanation)), 'Не заполнены опорные понятия.');
        require(stringList(question.reasoning) && stringList(question.tradeoffs) && nonempty(question.whatChangesAnswer), 'Не заполнен подробный разбор.');
        require(Array.isArray(question.followUps) && question.followUps.length > 0 && question.followUps.every(item => isObject(item) && nonempty(item.question) && nonempty(item.answer)), 'Не заполнены дополнительные вопросы.');
      }
      require(Array.isArray(question.references) && (question.references.length > 0 || (basic && nonempty(question.documentSource))) && question.references.every(ref => isObject(ref) && sourceIds.has(ref.sourceId) && (basic ? ref.locator === undefined || nonempty(ref.locator) : nonempty(ref.locator))), 'Не заполнены ссылки на источники.');
      if (basic) {
        require(Array.isArray(question.sourceIds) && Array.isArray(question.interviewSourceIds) && [...question.sourceIds, ...question.interviewSourceIds].every(id => sourceIds.has(id)), 'Неизвестный источник базового вопроса.');
        require(question.interviewSourceIds.every(id => sourceById.get(id)?.kind === 'interview'), 'Некорректная подборка собеседований.');
        require(question.origin !== 'authored' || (question.sourceIds.length > 0 && nonempty(question.difficulty)), 'Не заполнен авторский базовый вопрос.');
        const legalSourceIds = question.sourceIds.filter(id => sourceById.get(id)?.kind === 'legal');
        require(!legalSourceIds.length || isObject(question.legal), 'Нет сведений о правовых источниках.');
        require(question.certifications === undefined || stringList(question.certifications, 0), 'Некорректные тематические метки.');
        if (question.legal !== undefined) {
          require(isObject(question.legal) && ['RU', 'EU'].includes(question.legal.jurisdiction) && validDate(question.legal.reviewedAt) && Array.isArray(question.legal.references) && question.legal.references.length > 0 && question.legal.references.every(ref => isObject(ref) && question.sourceIds.includes(ref.sourceId) && sourceById.get(ref.sourceId)?.kind === 'legal' && nonempty(ref.locator)) && legalSourceIds.every(id => question.legal.references.some(ref => ref.sourceId === id)), 'Некорректные правовые источники.');
        }
      }
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
    return `${aggregate ? `challenge-${CHALLENGE_VERSION}-` : ''}v1-${text.length}-${(hash >>> 0).toString(16)}`;
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
    if (aggregate && !validChallengeState(value, answers, notes)) return null;
    return { ids: [...value.ids], title: value.title, mode: value.mode, index: value.index, orders, answers, notes, checked: new Set(value.checked), finished: value.finished, ...(aggregate ? { outcome: value.outcome } : {}) };
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
    if (aggregate && saved.challengeVersion !== CHALLENGE_VERSION) {
      notice = 'Правила общей попытки изменились: теперь первая ошибка завершает билет. Прежняя общая попытка и её счётчики сброшены, потому что они оценивались по другим правилам. Прогресс остальных банков сохранён.';
      return;
    }
    progress.total = saved.total;
    progress.correctTotal = saved.correctTotal;
    progress.completed = saved.completed;
    progress.errors = new Set(saved.errors.filter(id => typeof id === 'string' && questions.has(id)));
    progress.mode = validMode(saved.mode) ? saved.mode : aggregate ? 'challenge' : 'practice';
    if (saved.signature !== signature) {
      notice = 'Банк обновился. Общие счётчики и известные ошибки сохранены. Предыдущая попытка и её заметки сброшены, чтобы не сопоставлять ответы с изменившимися сценариями.';
      return;
    }
    if (saved.session !== null && saved.session !== undefined) {
      progress.session = validateSession(saved.session);
      if (!progress.session) notice = 'Сохранённая попытка повреждена и сброшена. Общие счётчики и известные ошибки сохранены.';
      else {
        const minimumScored = aggregate ? progress.session.checked.size : progress.session.finished ? progress.session.ids.length : progress.session.checked.size;
        const minimumCorrect = !aggregate && progress.session.finished
          ? progress.session.ids.filter(id => isCorrect(id)).length
          : [...progress.session.checked].filter(id => isCorrect(id)).length;
        if (progress.total < minimumScored || progress.correctTotal < minimumCorrect || progress.total - progress.correctTotal < minimumScored - minimumCorrect || (progress.session.finished && progress.completed === 0) || (aggregate && [...progress.session.checked].some(id => isCorrect(id) === progress.errors.has(id)))) {
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
      version: 1, bankId, signature, ...(aggregate ? { challengeVersion: CHALLENGE_VERSION } : {}), total: progress.total, correctTotal: progress.correctTotal,
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
      ? 'Текущая или последняя попытка и заметки сохраняются на этом устройстве.'
      : 'Сохранение недоступно. Новые результаты и заметки могут потеряться при закрытии страницы.';
  }

  function announce(message) { $('#announcement').textContent = message; }
  function focusMain() { main.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'auto' }); }
  function focusElement(selector, preventScroll = true) { const element = main.querySelector(selector); if (element) element.focus({ preventScroll }); }
  function noticeMarkup() { return notice ? `<div class="case-notice" role="status">${esc(notice)}</div>` : ''; }
  function listMarkup(items, ordered = false) { const tag = ordered ? 'ol' : 'ul'; return `<${tag}>${items.map(item => `<li>${termsMarkup(item)}</li>`).join('')}</${tag}>`; }

  function methodologyMarkup() {
    const collections = dataset.interviewCollections || [];
    return `<details class="case-methodology"><summary>${aggregate ? 'О вопросах и источниках' : 'О сценариях и источниках'}</summary>
      <p>${aggregate ? 'Это учебные вопросы и авторские ситуации.' : 'Это авторские учебные ситуации.'} Они помогают разбирать технические решения и готовиться к обсуждению на собеседовании. Их формулировки не являются заданиями конкретного работодателя или официального экзамена.</p>
      ${dataset.methodology ? `<p>${esc(dataset.methodology)}</p>` : ''}
      <p>После проверки доступны объяснения всех вариантов.${aggregate ? ' У ситуационных задач также сохранены подробные разборы, ограничения и дополнительные вопросы.' : ' Также доступны ход рассуждений, компромиссы, изменённые условия и вопросы для устного ответа.'} Технические положения сопровождаются ссылками на первичные источники и указанием раздела.</p>
      <p>${aggregate ? 'Последнее обновление подборки:' : 'Материалы проверены'} <time datetime="${esc(dataset.reviewedAt)}">${dateLabel(dataset.reviewedAt)}</time>. Реальная система может иметь другие ограничения: сравнивайте их с условиями сценария.</p>
      ${collections.length ? `<p>Открытые подборки для изучения тем технических собеседований:</p><ul>${collections.map(collection => `<li><a href="${esc(collection.url)}" target="_blank" rel="noopener noreferrer">${esc(collection.title)}</a>${collection.note ? ` — ${esc(collection.note)}` : ''}</li>`).join('')}</ul>` : ''}
      <p>Заметки проверяются самостоятельно по разбору. Автоматически оценивается только выбранный вариант. Процент верных решений не подтверждает квалификацию или рабочий опыт.</p>
      <p>Сохраняется одна текущая или последняя попытка. Новая попытка заменяет предыдущую; общие счётчики и список ошибок остаются. Каждый банк хранит свой прогресс отдельно.</p>
    </details>`;
  }

  function renderHome() {
    if (aggregate) return renderChallengeHome();
    const session = progress.session;
    const accuracy = progress.total ? `${Math.round(progress.correctTotal / progress.total * 100)}%` : '—';
    const mixedCard = `<section class="ticket-card${aggregate ? '' : ' quick-card'}"><h2>Смешанная десятка</h2><p>По ${Math.floor(10 / dataset.tracks.length)}–${Math.ceil(10 / dataset.tracks.length)} ${itemsFew} из каждого направления. Подходит для одной вдумчивой сессии.</p><button class="button ${aggregate ? 'secondary' : 'primary'}" data-start="mixed">Начать 10 ${itemsLabel}</button></section>`;
    const allCard = `<section class="ticket-card${aggregate ? ' quick-card' : ''}"><h2>${aggregate ? 'Все вопросы' : 'Весь банк'}</h2><p>Все ${dataset.questions.length} ${itemsLabel}. Порядок вопросов и вариантов перемешивается в каждой попытке.</p><button class="button ${aggregate ? 'primary' : 'secondary'}" data-start="all">${aggregate ? `Начать все ${dataset.questions.length} ${itemsLabel}` : 'Пройти весь банк'}</button></section>`;
    main.innerHTML = `${noticeMarkup()}
      <header class="page-heading"><div><span class="eyebrow">От фактов к решению</span><h1>${esc(dataset.title)}</h1><p class="case-intro">${esc(dataset.description)}</p></div></header>
      <div class="case-notice"><p>Сначала разберите факты и ограничения, выберите лучший вариант и при желании запишите ход мысли. Затем сравните своё решение с подробным разбором.</p><p>Нажатие на термин открывает пояснение. У ситуационных задач в режиме обучения также доступны опорные понятия до ответа.</p></div>
      <div class="case-summary"><span><strong>${dataset.questions.length}</strong> ${itemsLabel}</span><span><strong>${dataset.tracks.length}</strong> направления</span><span>Завершено попыток: <strong>${progress.completed}</strong></span><span>Верных решений: <strong>${accuracy}</strong></span><span>Ошибок: <strong>${progress.errors.size}</strong></span></div>
      ${session ? `<section class="resume-card" aria-label="Сохранённая попытка"><div><strong>${session.finished ? 'Разбор последней попытки' : 'Есть незавершённая попытка'}</strong><p>${esc(session.title)} · ${esc(modeLabel(session.mode))} · ${session.finished ? `${session.ids.filter(id => isCorrect(id)).length} из ${session.ids.length} верно` : `выбрано ответов ${Object.keys(session.answers).length} из ${session.ids.length}`}</p></div><button class="button primary" data-action="resume">${session.finished ? 'Открыть разбор' : 'Продолжить'}</button></section>` : ''}
      <div class="mode-bar"><div class="mode-switch case-mode-switch" role="group" aria-label="Когда показывать разбор"><button data-mode="practice" aria-pressed="${progress.mode === 'practice'}">Обучение</button><button data-mode="interview" aria-pressed="${progress.mode === 'interview'}">${aggregate ? 'Экзамен' : 'Собеседование'}</button></div><p class="mode-hint case-mode-help">${progress.mode === 'practice' ? 'Разбор после проверки каждого решения. Опорные понятия доступны заранее.' : 'Вся обратная связь — после завершения. Опорные понятия и источники до этого скрыты.'}</p></div>
      <div class="case-choice-grid">
        ${aggregate ? allCard + mixedCard : mixedCard + allCard}
        <section class="ticket-card"><h2>Работа над ошибками</h2><p>${progress.errors.size ? `${aggregate ? 'Вопросов' : 'Сценариев'} для повторения: ${progress.errors.size}. Верное решение убирает ${aggregate ? 'вопрос' : 'сценарий'} из списка ошибок.` : 'После проверки сюда попадут неверные решения и вопросы, пропущенные при завершении.'}</p><button class="button secondary" data-start="mistakes" ${progress.errors.size ? '' : 'disabled'}>Повторить ошибки</button></section>
      </div>
      <section class="case-tracks" aria-labelledby="tracks-heading"><div class="section-heading"><h2 id="tracks-heading">Выбрать направление</h2></div><div class="topic-grid">${dataset.tracks.map(track => `<button class="topic-card" data-track="${esc(track.id)}"><span class="case-track-copy"><span class="topic-name">${esc(track.title)}</span><span class="topic-count">${dataset.questions.filter(question => question.track === track.id).length} ${itemsLabel}${track.description ? ` · ${esc(track.description)}` : ''}</span></span><span class="case-track-arrow" aria-hidden="true">→</span></button>`).join('')}</div></section>
      <p class="case-score-note">Объясните решающий факт, назовите оставшийся риск и проверьте, как ответ изменится при других условиях.</p>
      ${methodologyMarkup()}`;
    bindMain();
    updateStats();
  }

  function foundationsMarkup(question) {
    if (question.kind === 'basic') return '';
    return `<details class="case-foundations"><summary>Опорные понятия</summary><dl>${question.prerequisites.map(item => `<dt>${termsMarkup(item.term)}</dt><dd>${termsMarkup(item.explanation)}</dd>`).join('')}</dl></details>`;
  }

  function scenarioMarkup(question) {
    if (question.kind === 'basic') return `${question.legal ? `<p class="question-context"><span class="level-tag legal-tag">${question.legal.jurisdiction === 'RU' ? 'РФ' : 'ЕС · GDPR'}</span><span>Нормы проверены: <time datetime="${esc(question.legal.reviewedAt)}">${dateLabel(question.legal.reviewedAt)}</time></span></p>` : ''}<p class="case-prompt">${termsMarkup(question.question)}</p>`;
    return `<p class="case-prompt">${termsMarkup(question.question)}</p><div class="case-context"><section><h3>Известные факты</h3>${listMarkup(question.evidence)}</section><section><h3>Ограничения и условия</h3>${listMarkup(question.constraints)}</section></div>`;
  }

  function deepReviewMarkup(question, order) {
    const families = { mitre: 'MITRE ATT&CK', owasp: 'OWASP', cve: 'CVE' };
    const basis = bankId === 'scenarios' || (aggregate && question.originalBank === 'scenarios') ? `<section class="case-basis"><h3>Основа задачи</h3><p><strong>${esc(families[question.basis.family])}</strong> · ${question.basis.identifiers.map(esc).join(' · ')}</p></section>` : '';
    const options = `<section><h3>Почему выбран этот ответ</h3>${order.map((optionIndex, displayIndex) => { const option = question.options[optionIndex]; return `<div class="case-option-reason ${option.correct ? 'best' : ''}"><strong>${LETTERS[displayIndex]}. ${termsMarkup(option.text)}</strong>${option.correct ? '<span class="case-option-status">Лучший ответ при заданных условиях</span>' : ''}<p>${termsMarkup(option.explanation)}</p></div>`; }).join('')}</section>`;
    const details = question.kind === 'basic' ? basicMetadataMarkup(question) : `
      <section><h3>Ход рассуждений</h3>${listMarkup(question.reasoning, true)}</section>
      <section><h3>Компромиссы и остаточные риски</h3>${listMarkup(question.tradeoffs)}</section>
      <section><h3>Что изменит ответ</h3><p>${termsMarkup(question.whatChangesAnswer)}</p></section>
      <section><h3>Углублённые вопросы для собеседования</h3><p>Сначала попробуйте ответить вслух, затем раскройте ориентир для самопроверки.</p>${question.followUps.map(item => `<details class="case-followup"><summary>${termsMarkup(item.question)}</summary><p>${termsMarkup(item.answer)}</p></details>`).join('')}</section>
      ${foundationsMarkup(question)}`;
    const references = question.references.length ? `<ul class="case-source-list">${question.references.map(reference => { const source = sources.get(reference.sourceId); return `<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a>${source.publisher || reference.locator || source.accessedAt ? `<small>${[source.publisher, reference.locator].filter(Boolean).map(esc).join(' · ')}${source.accessedAt ? `<br>Проверено: <time datetime="${esc(source.accessedAt)}">${dateLabel(source.accessedAt)}</time>` : ''}</small>` : ''}</li>`; }).join('')}</ul>` : `<p>Источник: ${esc(question.documentSource)}.</p>`;
    return `<div class="case-review">${basis}${options}${details}<section><h3>${aggregate ? 'Источники' : 'Технические источники'}</h3>${references}</section></div>`;
  }

  function basicMetadataMarkup(question) {
    const legal = question.legal;
    const entries = [];
    if (legal) entries.push(`<p>Юрисдикция: ${legal.jurisdiction === 'RU' ? 'РФ' : 'ЕС · GDPR'}. Нормы проверены: <time datetime="${esc(legal.reviewedAt)}">${dateLabel(legal.reviewedAt)}</time>. Применимость зависит от условий вопроса.</p>`);
    if (question.certifications?.length) entries.push(`<p>По тематике: ${question.certifications.map(esc).join(' · ')}. Это учебные вопросы, а не официальный экзамен.</p>`);
    if (question.interviewSourceIds?.length) entries.push('<p>Тема из открытой подборки собеседований; ссылки включены в источники ниже.</p>');
    if (question.revisionNote) entries.push(`<p>Уточнение формулировки: ${esc(question.revisionNote)}</p>`);
    return entries.length ? `<section><h3>О вопросе</h3>${entries.join('')}</section>` : '';
  }

  function isCorrect(id) {
    const session = progress.session;
    return !!session && has(session.answers, id) && questions.get(id).options[session.answers[id]].correct;
  }

  function renderQuiz() {
    if (aggregate) return renderChallengeQuiz();
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
      <p class="case-progress-label" role="status">${itemLabel} ${session.index + 1} из ${session.ids.length} · ${esc(tracks.get(question.track).title)}</p>
      <div class="case-layout"><article class="question-panel" aria-labelledby="case-title">
        <div class="question-context"><span class="level-tag">${question.kind === 'basic' ? 'Базовый банк' : question.difficulty === 'advanced' ? 'Углублённый' : 'Переход к сложным задачам'}</span><span>${session.mode === 'interview' ? 'Разбор появится после завершения попытки' : 'Можно учиться в своём темпе'}</span></div>
        <h1 class="case-title" id="case-title" tabindex="-1">${termsMarkup(question.title)}</h1>${scenarioMarkup(question)}
        ${session.mode === 'practice' && !checked ? foundationsMarkup(question) : ''}
        <p class="term-help-hint case-term-hint">Нажмите на подчёркнутый термин — объясним простыми словами.</p><fieldset class="case-options"><legend>Выберите лучший ответ при этих условиях</legend><div class="case-option-list">${session.orders[id].map((optionIndex, displayIndex) => { const option = question.options[optionIndex]; const chosen = selected && answer === optionIndex; const status = checked ? (option.correct ? 'Лучший ответ' : chosen ? 'Ваш ответ · неверно' : '') : ''; return `<div class="case-option ${chosen ? 'selected' : ''} ${checked ? `locked ${option.correct ? 'good' : chosen ? 'bad' : ''}` : ''}"><input type="radio" name="case-answer" id="answer-${optionIndex}" data-answer="${optionIndex}" value="${optionIndex}" aria-label="${LETTERS[displayIndex]}. ${esc(option.text)}" ${chosen ? 'checked' : ''} ${checked ? 'disabled' : ''}><label class="case-option-pick" for="answer-${optionIndex}" aria-hidden="true"></label><span class="case-option-copy"><strong>${LETTERS[displayIndex]}.</strong>${termsMarkup(option.text)}${status ? `<span class="case-option-status">${status}</span>` : ''}</span></div>`; }).join('')}</div></fieldset>
        <div class="case-notes"><label for="reasoning-note">Мои рассуждения <span class="topic-count">Необязательно</span></label><p id="reasoning-help">Какие факты определяют решение? Какие допущения и риски остаются? До ${NOTE_LIMIT} символов. Заметка хранится только на этом устройстве; сравните её с разбором самостоятельно.</p><textarea id="reasoning-note" aria-describedby="reasoning-help" maxlength="${NOTE_LIMIT}" rows="5" placeholder="Запишите ход мысли до просмотра ответа…">${esc(session.notes[id] || '')}</textarea></div>
        <div class="case-actions"><button class="button secondary" data-action="previous" ${session.index === 0 ? 'disabled' : ''}>Назад</button><div class="action-right">${session.mode === 'practice' && !checked ? `<button class="button primary" data-action="check" ${selected ? '' : 'disabled'}>Проверить решение</button>` : ''}<button class="button ${session.mode === 'interview' || checked ? 'primary' : 'secondary'}" data-action="${last ? 'finish' : 'next'}">${last ? 'К результатам' : 'Далее'}</button></div></div>
        ${checked ? `<section class="case-feedback ${isCorrect(id) ? '' : 'is-error'}" id="case-feedback" tabindex="-1"><h2>${isCorrect(id) ? 'Решение верное' : 'В выбранном решении есть проблема'}</h2><p>Сравните ход своих рассуждений с разбором. У правильного варианта тоже есть ограничения.</p>${deepReviewMarkup(question, session.orders[id])}</section>` : ''}
        ${window.TrainerFeedback?.actions(question.id) || ''}
      </article><aside class="quiz-map case-map${session.ids.length > 50 ? ' long-session' : ''}" aria-label="${aggregate ? 'Навигация по вопросам' : 'Навигация по сценариям'}"><p class="quiz-map-title">${aggregate ? 'Вопросы попытки' : 'Сценарии попытки'}</p><div class="question-grid">${session.ids.map((questionId, index) => { const wasChecked = session.mode === 'practice' && session.checked.has(questionId); const wasAnswered = has(session.answers, questionId); const status = wasChecked ? (isCorrect(questionId) ? 'верно' : 'ошибка') : wasAnswered ? 'ответ выбран' : 'без ответа'; return `<button class="question-number ${wasChecked ? (isCorrect(questionId) ? 'good' : 'bad') : wasAnswered ? 'answered' : ''}" data-jump="${index}" aria-label="${itemLabel} ${index + 1}: ${status}" ${index === session.index ? 'aria-current="step"' : ''}>${index + 1}</button>`; }).join('')}</div><p class="quiz-progress">Выбрано ответов: ${answeredCount} / ${session.ids.length}${session.mode === 'practice' ? `<br>Проверено: ${session.checked.size}` : ''}</p><button class="button secondary" data-action="finish">Завершить попытку</button></aside></div>
      <p class="keyboard-hint">1–4 — выбрать вариант · Enter — проверить или перейти далее. В поле заметки клавиши вводят текст.</p>`;
    bindMain();
    if (session.ids.length > 50) {
      const grid = main.querySelector('.question-grid');
      const current = main.querySelector(`[data-jump="${session.index}"]`);
      if (grid && current && grid.clientHeight) grid.scrollTop = Math.max(0, current.offsetTop - (grid.clientHeight - current.offsetHeight) / 2);
    }
    updateStats();
  }

  function renderResults() {
    if (aggregate) return renderChallengeResults();
    const session = progress.session;
    if (!session || !session.finished) return renderQuiz();
    const correct = session.ids.filter(id => isCorrect(id)).length;
    const skipped = session.ids.filter(id => !has(session.answers, id)).length;
    const wrong = session.ids.length - correct;
    main.innerHTML = `${noticeMarkup()}<header class="page-heading"><div><span class="eyebrow">Результат и самопроверка</span><h1>Разбор попытки</h1><p>${esc(session.title)} · ${esc(modeLabel(session.mode))}</p></div></header>
      <section class="result-card"><div class="result-score" aria-label="Верно ${correct} из ${session.ids.length}">${correct}<span> / ${session.ids.length}</span></div><div class="result-copy"><h2>Решения проверены</h2><p>Верно: ${correct}. Неверно: ${wrong - skipped}. Без ответа: ${skipped}.</p><div class="result-actions"><button class="button primary" data-action="retry">Повторить набор</button>${wrong ? '<button class="button secondary" data-action="repeat-wrong">Разобрать ошибки</button>' : ''}<button class="button secondary" data-action="home">К наборам</button></div></div></section>
      <p class="case-score-note">Оценён только выбор варианта. Ваши заметки не получили автоматическую оценку: сравните их с ходом рассуждений, компромиссами и ответами на дополнительные вопросы. Этот результат не является оценкой профессиональной квалификации.</p>
      <section aria-labelledby="review-heading"><div class="section-heading"><h2 id="review-heading">${aggregate ? 'Разбор всех вопросов' : 'Разбор всех сценариев'}</h2></div><div class="case-review-list">${session.ids.map((id, index) => { const question = questions.get(id); const chosen = session.answers[id]; const answered = has(session.answers, id); const correctAnswer = isCorrect(id); return `<details class="review-item"><summary><span class="case-review-state ${correctAnswer ? '' : 'bad'}">${correctAnswer ? 'Верно' : answered ? 'Ошибка' : 'Без ответа'}</span>${index + 1}. ${termsMarkup(question.title)}</summary><div class="review-body"><div class="question-context"><span>${esc(tracks.get(question.track).title)}</span></div>${scenarioMarkup(question)}<p class="review-answer ${correctAnswer ? '' : 'wrong'}"><strong>Ваш ответ:</strong> ${answered ? esc(question.options[chosen].text) : 'Не выбран; сценарий добавлен в работу над ошибками.'}</p><section><h3>Мои рассуждения</h3>${session.notes[id] ? `<div class="case-review-note">${esc(session.notes[id])}</div>` : '<p class="topic-count">Заметка не добавлена.</p>'}</section>${deepReviewMarkup(question, session.orders[id])}${window.TrainerFeedback?.actions(question.id) || ''}</div></details>`; }).join('')}</div></section>`;
    bindMain();
    updateStats();
  }

  function render() {
    if (!dataset) return;
    if (progress.view === 'session' && progress.session) renderQuiz();
    else renderHome();
  }

  function validChallengeState(value, answers, notes) {
    if (value.ids.length !== dataset.questions.length || !['failed', 'passed', 'stopped', null].includes(value.outcome)) return false;
    const checked = value.checked;
    if (!checked.every((id, index) => id === value.ids[index])) return false;
    const correctCount = checked.filter(id => questions.get(id).options[answers[id]].correct).length;
    const confirmed = checked.length;
    if (Object.keys(notes).some(id => value.ids.indexOf(id) > value.index)) return false;
    if (!value.finished) {
      if (value.outcome !== null || confirmed !== value.index || correctCount !== confirmed) return false;
      return Object.keys(answers).every(id => checked.includes(id) || id === value.ids[value.index]);
    }
    if (Object.keys(answers).length !== confirmed) return false;
    if (value.outcome === 'failed') return confirmed > 0 && value.index === confirmed - 1 && correctCount === confirmed - 1 && !questions.get(checked[confirmed - 1]).options[answers[checked[confirmed - 1]]].correct;
    if (value.outcome === 'passed') return confirmed === value.ids.length && correctCount === confirmed && value.index === value.ids.length - 1;
    if (value.outcome === 'stopped') return confirmed < value.ids.length && correctCount === confirmed && value.index === confirmed;
    return false;
  }

  function renderChallengeHome() {
    const session = progress.session;
    const streak = session ? [...session.checked].filter(id => isCorrect(id)).length : 0;
    main.innerHTML = `${noticeMarkup()}<header class="page-heading"><div><span class="eyebrow">До первой ошибки</span><h1>Все вопросы</h1><p class="case-intro">Один билет из ${dataset.questions.length} вопросов: базовый банк, защита ИИ и ситуационные задачи. Сеньор проходится отдельно.</p></div></header>
      <div class="case-notice"><p>Выберите вариант и нажмите «Ответить». Верный ответ сразу открывает следующий вопрос. Первая ошибка завершает попытку и открывает разбор.</p><p>Чтобы пройти билет, нужно правильно ответить на все ${dataset.questions.length} вопросов подряд. Новая попытка перемешивает вопросы и варианты заново.</p></div>
      ${session ? `<section class="resume-card" aria-label="Сохранённая попытка"><div><strong>${session.finished ? session.outcome === 'passed' ? 'Билет пройден' : session.outcome === 'failed' ? 'Попытка завершена ошибкой' : 'Попытка остановлена' : 'Есть незавершённая попытка'}</strong><p>Верных ответов подряд: ${streak} из ${session.ids.length}.</p></div><button class="button primary" data-action="resume">${session.finished ? 'Открыть результат' : 'Продолжить'}</button></section>` : ''}
      <section class="ticket-card quick-card"><h2>Весь билет · ${dataset.questions.length} вопросов</h2><p>Пропускать вопросы нельзя. Кнопка «К наборам · пауза» сохраняет место и выбранный, но ещё не подтверждённый ответ.</p><button class="button primary" data-start="all">${session ? 'Начать новую попытку' : `Начать все ${dataset.questions.length} вопросов`}</button></section>
      <p class="case-score-note">Пояснения терминов доступны по нажатию. В статистику попадают только подтверждённые ответы; неоткрытые вопросы не считаются ошибками.</p>`;
    bindMain();
    updateStats();
  }

  function renderChallengeQuiz() {
    const session = progress.session;
    if (!session) return renderChallengeHome();
    if (session.finished) return renderChallengeResults();
    const id = session.ids[session.index];
    const question = questions.get(id);
    const selected = has(session.answers, id);
    main.innerHTML = `${noticeMarkup()}<div class="quiz-top"><button class="button ghost" data-action="home">← К наборам · пауза</button><span>Все вопросы</span><span class="quiz-tag">До первой ошибки</span></div>
      <p class="case-progress-label" role="status">Вопрос ${session.index + 1} из ${session.ids.length} · Верных подряд: ${session.checked.size}</p>
      <div class="case-layout"><article class="question-panel" aria-labelledby="case-title"><div class="question-context"><span>${esc(tracks.get(question.track).title)}</span><span>Первая ошибка завершает попытку</span></div>
        <h1 class="case-title" id="case-title" tabindex="-1">${termsMarkup(question.title)}</h1>${scenarioMarkup(question)}
        <p class="term-help-hint case-term-hint">Нажмите на подчёркнутый термин — объясним простыми словами.</p>
        <fieldset class="case-options"><legend>Выберите ответ, затем подтвердите его</legend><div class="case-option-list">${session.orders[id].map((optionIndex, displayIndex) => { const option = question.options[optionIndex]; const chosen = selected && session.answers[id] === optionIndex; return `<div class="case-option ${chosen ? 'selected' : ''}"><input type="radio" name="case-answer" id="answer-${optionIndex}" data-answer="${optionIndex}" value="${optionIndex}" aria-label="${LETTERS[displayIndex]}. ${esc(option.text)}" ${chosen ? 'checked' : ''}><label class="case-option-pick" for="answer-${optionIndex}" aria-hidden="true"></label><span class="case-option-copy"><strong>${LETTERS[displayIndex]}.</strong>${termsMarkup(option.text)}</span></div>`; }).join('')}</div></fieldset>
        <div class="case-notes"><label for="reasoning-note">Мои рассуждения <span class="topic-count">Необязательно</span></label><p id="reasoning-help">Заметка сохраняется только на этом устройстве. Запишите мысль до подтверждения ответа.</p><textarea id="reasoning-note" aria-describedby="reasoning-help" maxlength="${NOTE_LIMIT}" rows="5" placeholder="Запишите ход мысли…">${esc(session.notes[id] || '')}</textarea></div>
        <div class="case-actions"><button class="button primary" data-action="check" ${selected ? '' : 'disabled'}>Ответить</button></div>${window.TrainerFeedback?.actions(id) || ''}
      </article><aside class="quiz-map case-map" aria-label="Прогресс билета"><p class="quiz-map-title">Верных подряд</p><strong>${session.checked.size} / ${session.ids.length}</strong><p class="case-score-note">Ответьте на текущий вопрос, чтобы перейти дальше.</p><button class="button secondary" data-action="finish">Остановить попытку</button></aside></div>
      <p class="keyboard-hint">1–4 — выбрать вариант · Enter — ответить. Клавиши в заметке вводят текст.</p>`;
    bindMain();
    updateStats();
  }

  function renderChallengeResults() {
    const session = progress.session;
    if (!session || !session.finished) return renderChallengeQuiz();
    const answered = [...session.checked];
    const correct = answered.filter(id => isCorrect(id)).length;
    const failedId = session.outcome === 'failed' ? session.ids[session.index] : null;
    const title = session.outcome === 'passed' ? 'Билет пройден без ошибок' : failedId ? 'Первая ошибка — попытка завершена' : 'Попытка остановлена';
    const review = id => {
      const question = questions.get(id);
      return `<div class="review-body"><h3>${termsMarkup(question.title)}</h3>${scenarioMarkup(question)}<p class="review-answer ${isCorrect(id) ? '' : 'wrong'}"><strong>Ваш ответ:</strong> ${termsMarkup(question.options[session.answers[id]].text)}</p>${session.notes[id] ? `<section><h3>Мои рассуждения</h3><div class="case-review-note">${esc(session.notes[id])}</div></section>` : ''}${deepReviewMarkup(question, session.orders[id])}${window.TrainerFeedback?.actions(id) || ''}</div>`;
    };
    main.innerHTML = `${noticeMarkup()}<header class="page-heading"><div><span class="eyebrow">До первой ошибки · результат</span><h1>${title}</h1></div></header>
      <section class="result-card"><div class="result-score" aria-label="Верных подряд ${correct} из ${session.ids.length}">${correct}<span> / ${session.ids.length}</span></div><div class="result-copy"><h2>Верных ответов подряд: ${correct}</h2><p>${session.outcome === 'passed' ? 'Все вопросы подтверждены верно.' : failedId ? 'На этом билете продолжить нельзя. Неотвеченные вопросы не учтены как ошибки.' : 'Билет не пройден. Неподтверждённые и неотвеченные вопросы не учтены в результате.'}</p><div class="result-actions"><button class="button primary" data-action="retry">Начать новый билет</button><button class="button secondary" data-action="home">К наборам</button></div></div></section>
      ${failedId ? `<section class="case-feedback is-error" id="case-feedback" tabindex="-1"><h2>Разбор ошибки</h2>${review(failedId)}</section>` : ''}
      ${correct ? `<section><h2>Разбор подтверждённых верных ответов</h2><div class="case-review-list">${answered.filter(id => id !== failedId).map((id, index) => `<details class="review-item"><summary>${index + 1}. ${termsMarkup(questions.get(id).title)}</summary>${review(id)}</details>`).join('')}</div></section>` : ''}`;
    bindMain();
    updateStats();
  }

  function finishChallenge(outcome) {
    const session = progress.session;
    if (!session || session.finished) return;
    if (outcome === 'stopped') delete session.answers[session.ids[session.index]];
    session.finished = true;
    session.outcome = outcome;
    progress.completed++;
    progress.view = 'session';
    saveProgress();
    renderChallengeResults();
    focusMain();
    announce(outcome === 'failed' ? 'Неверный ответ. Попытка завершена; открыт разбор ошибки.' : outcome === 'passed' ? 'Все ответы верны. Билет пройден.' : 'Попытка остановлена.');
  }

  function recordDecision(id) {
    progress.total++;
    if (isCorrect(id)) { progress.correctTotal++; progress.errors.delete(id); }
    else progress.errors.add(id);
  }

  function startSession(ids, title, mode = progress.mode) {
    if (!dataset) return false;
    if (aggregate) { ids = dataset.questions.map(question => question.id); title = 'Все вопросы'; mode = 'challenge'; }
    if (!validMode(mode)) return false;
    const known = [...new Set(ids)].filter(id => questions.has(id));
    if (!known.length) return false;
    const order = shuffled(known);
    const orders = Object.create(null);
    order.forEach(id => { orders[id] = shuffled([0, 1, 2, 3]); });
    progress.session = { ids: order, title, mode, index: 0, orders, answers: Object.create(null), notes: Object.create(null), checked: new Set(), finished: false, ...(aggregate ? { outcome: null } : {}) };
    progress.view = 'session';
    saveProgress();
    renderQuiz();
    focusMain();
    announce(`${modeLabel(mode)}. В попытке ${order.length} ${itemsLabel}.`);
    return true;
  }

  async function requestStart(kind, trackId) {
    if (!dataset || (aggregate && kind !== 'all')) return;
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
    if (!session || session.finished || progress.view !== 'session' || (!aggregate && session.mode !== 'practice')) return;
    const id = session.ids[session.index];
    if (session.checked.has(id) || !has(session.answers, id)) return;
    recordDecision(id);
    session.checked.add(id);
    if (aggregate) {
      if (!isCorrect(id)) return finishChallenge('failed');
      if (session.checked.size === session.ids.length) return finishChallenge('passed');
      session.index++;
      saveProgress();
      renderChallengeQuiz();
      focusMain();
      announce(`Верно. Вопрос ${session.index + 1} из ${session.ids.length}.`);
      return;
    }
    saveProgress();
    renderQuiz();
    focusElement('#case-feedback', false);
    announce(isCorrect(id) ? 'Решение верное. Доступен подробный разбор.' : 'Решение неверное. Доступен подробный разбор.');
  }

  function jump(index) {
    if (aggregate) return;
    const session = progress.session;
    if (!session || session.finished || !Number.isInteger(index) || index < 0 || index >= session.ids.length) return;
    session.index = index;
    progress.view = 'session';
    saveProgress();
    renderQuiz();
    focusMain();
    announce(`${itemLabel} ${index + 1} из ${session.ids.length}.`);
  }

  function finishSession() {
    if (aggregate) return finishChallenge('stopped');
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
    if (aggregate) {
      if (await askConfirmation('Остановить попытку?', 'Билет будет завершён без прохождения. Неподтверждённые и неотвеченные вопросы не будут оценены. Для паузы отмените это действие и нажмите «К наборам · пауза».', 'Остановить попытку')) finishChallenge('stopped');
      return;
    }
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
    if (aggregate || !validMode(value)) return;
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
    if (!dataset || !await askConfirmation('Сбросить прогресс этого банка?', 'Будут удалены его счётчики, ошибки, текущая или последняя попытка и заметки. Прогресс остальных банков останется.', 'Сбросить этот банк')) return;
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
    if (!session || session.finished || progress.view !== 'session' || confirmation || window.TrainerTerms.isOpen() || window.TrainerFeedback?.isOpen() || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target;
    if (target && (target.isContentEditable || target.closest?.('[contenteditable="true"]') || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || (target.tagName === 'INPUT' && target.type !== 'radio'))) return;
    if (/^[1-4]$/.test(event.key)) {
      event.preventDefault();
      selectAnswer(session.orders[session.ids[session.index]][Number(event.key) - 1]);
      return;
    }
    if (event.key !== 'Enter' || (target && ['BUTTON', 'A', 'SUMMARY'].includes(target.tagName))) return;
    event.preventDefault();
    if (aggregate) { checkAnswer(); return; }
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
      let loaded;
      if (aggregate) {
        if (!window.TrainerAllQuestions) throw new Error('Загрузчик общей подборки недоступен.');
        loaded = await window.TrainerAllQuestions.load();
      } else {
        const response = await fetch(config.file);
        if (!response.ok) throw new Error(`Не удалось получить файл банка: HTTP ${response.status}.`);
        loaded = await response.json();
      }
      const data = validateBank(loaded);
      window.TrainerFeedback?.setBank(config.label, data.reviewedAt, data.questions);
      dataset = data;
      questions = new Map(data.questions.map(question => [question.id, question]));
      sources = new Map(data.sources.map(source => [source.id, source]));
      tracks = new Map(data.tracks.map(track => [track.id, track]));
      signature = bankSignature(data);
      restoreProgress();
      $('#dataset-info').textContent = `${data.questions.length} ${itemsLabel} · ${data.tracks.length} направления`;
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
  window.trainerNativeBack = () => {
    if (progress.view !== 'session') return false;
    goHome();
    return true;
  };
  load();
})();

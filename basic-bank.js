/* Base-bank composition shared by the web app, topic wheel, Android and tests. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TrainerBasicBank = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const DIRECTORY = './data/compliance-ru/';
  const PARTS = Array.from({ length: 15 }, (_, index) => `m${String(index + 1).padStart(2, '0')}.json`);
  const TOPIC = 'Комплаенс РФ';
  const LETTERS = ['А', 'Б', 'В', 'Г'];
  const clone = value => JSON.parse(JSON.stringify(value));
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  const text = value => typeof value === 'string' && value.trim().length > 0;
  function requireValue(value, message) { if (!value) throw new Error(`Комплаенс РФ: ${message}`); }
  function date(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  }
  function https(value) {
    try { const url = new URL(value); return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password; }
    catch (_) { return false; }
  }
  function merge(base, manifest, parts) {
    requireValue(object(base) && Array.isArray(base.questions) && Array.isArray(base.topics) && Array.isArray(base.sources), 'неверный основной банк.');
    requireValue(object(manifest) && manifest.schemaVersion === 1 && manifest.id === 'compliance-ru' && manifest.title === TOPIC && date(manifest.reviewedAt), 'неверный манифест.');
    requireValue(JSON.stringify(manifest.parts) === JSON.stringify(PARTS) && manifest.questionCount === 180, 'неполный состав пакета.');
    requireValue(Array.isArray(parts) && parts.length === PARTS.length && parts.every(part => object(part) && part.schemaVersion === 1 && Array.isArray(part.questions) && part.questions.length === 12), 'отсутствует часть вопросов.');
    requireValue(Array.isArray(manifest.modules) && manifest.modules.length === 15, 'неверные направления.');
    const modules = new Map(manifest.modules.map(item => [item.id, item.name]));
    requireValue(modules.size === 15 && manifest.modules.every(item => /^M\d{2}$/.test(item.id) && text(item.name)), 'повтор или неверное направление.');
    const baseIds = new Set(base.questions.map(question => question.id));
    requireValue(baseIds.size === base.questions.length, 'повтор ID в основном банке.');
    const sourceIds = new Set(base.sources.map(source => source.id));
    requireValue(sourceIds.size === base.sources.length && Array.isArray(manifest.sources) && manifest.sources.length > 0, 'неверные источники.');
    const addedSources = new Set();
    for (const source of manifest.sources) {
      requireValue(object(source) && /^rfc-[a-zA-Z0-9-]+$/.test(source.id) && !sourceIds.has(source.id) && !addedSources.has(source.id) && source.kind === 'legal' && text(source.title) && https(source.url) && date(source.reviewedAt), 'неверный или повторный источник.');
      addedSources.add(source.id);
    }
    const raw = parts.flatMap(part => part.questions);
    const rawIds = new Set(raw.map(question => question.id));
    requireValue(rawIds.size === manifest.questionCount && raw.every(question => /^rfc\d{3}$/.test(question.id) && Number(question.id.slice(3)) >= 1 && Number(question.id.slice(3)) <= manifest.questionCount), 'повтор или неверный ID исследования.');
    requireValue(object(manifest.reuse) && new Set(Object.values(manifest.reuse)).size === Object.keys(manifest.reuse).length, 'неверная карта повторного использования.');
    for (const [researchId, originalId] of Object.entries(manifest.reuse)) {
      requireValue(rawIds.has(researchId) && baseIds.has(originalId), 'не найден вопрос для повторного использования.');
      requireValue(base.questions.find(question => question.id === originalId).legal?.jurisdiction !== 'EU', 'GDPR нельзя перемещать в тему РФ.');
    }
    for (const question of raw) {
      requireValue(modules.has(question.module) && text(question.question) && ['basic', 'intermediate', 'advanced'].includes(question.difficulty), 'неверная формулировка или сложность.');
      requireValue(Array.isArray(question.options) && question.options.length === 4 && question.options.every(option => object(option) && text(option.text) && typeof option.correct === 'boolean' && text(option.explanation)) && question.options.filter(option => option.correct).length === 1, 'требуются четыре объяснённых варианта и один ответ.');
      requireValue(new Set(question.options.map(option => option.text.trim().toLocaleLowerCase('ru-RU'))).size === 4, 'повтор вариантов.');
      requireValue(Array.isArray(question.references) && question.references.length > 0 && question.references.every(ref => object(ref) && addedSources.has(ref.sourceId) && text(ref.locator)), 'неверная ссылка на норму.');
      requireValue(Array.isArray(question.relatedQuestionIds) && question.relatedQuestionIds.every(id => baseIds.has(id)), 'неизвестный соседний вопрос.');
      requireValue(['application', 'practice'].includes(question.basisType), 'неверный тип основания.');
      requireValue(text(question.learningObjective) && text(question.recommendedEvidence), 'не заполнен разбор компетенции.');
    }
    for (const [index, moduleId] of [...modules.keys()].entries()) {
      requireValue(parts[index].questions.every(question => question.module === moduleId), 'вопрос находится в чужом файле направления.');
      requireValue(raw.filter(question => question.module === moduleId).length === 12, 'в направлении должно быть двенадцать вопросов.');
    }
    // Never mutate downloaded data: all modes must see the same canonical composition.
    const result = clone(base);
    const reused = new Map(result.questions.map(question => [question.id, question]));
    for (const question of raw) {
      const existingId = manifest.reuse[question.id];
      const runtimeId = existingId || `q${10000 + Number(question.id.slice(3))}`;
      requireValue(existingId || !baseIds.has(runtimeId), 'конфликт нового ID с основным банком.');
      const target = existingId ? reused.get(existingId) : {
        id: runtimeId, question: question.question,
        options: question.options.map((option, index) => ({ ...option, sourceLetter: LETTERS[index] })),
        origin: 'authored', difficulty: question.difficulty, sourceIds: []
      };
      // Reused questions retain their text, answer order, explanations, IDs and collections.
      target.topic = TOPIC;
      target.sourceIds = [...new Set([...(target.sourceIds || []), ...question.references.map(ref => ref.sourceId)])];
      const references = [...(target.legal?.references || []), ...clone(question.references)];
      target.legal = { jurisdiction: 'RU', reviewedAt: manifest.reviewedAt,
        references: references.filter((ref, index) => references.findIndex(other => other.sourceId === ref.sourceId && other.locator === ref.locator) === index) };
      target.compliance = { researchId: question.id, module: question.module, moduleTitle: modules.get(question.module),
        basisType: question.basisType, learningObjective: question.learningObjective, recommendedEvidence: question.recommendedEvidence,
        relatedQuestionIds: [...question.relatedQuestionIds], reused: !!existingId };
      if (!existingId) result.questions.push(target);
    }
    result.sources.push(...clone(manifest.sources));
    result.topics = [...result.topics.filter(topic => topic !== TOPIC && result.questions.some(question => question.topic === topic)), TOPIC];
    result.updatedAt = manifest.reviewedAt;
    result.compliance = { id: manifest.id, title: TOPIC, reviewedAt: manifest.reviewedAt,
      questionCount: raw.length, newQuestionCount: raw.length - Object.keys(manifest.reuse).length,
      reusedQuestionIds: Object.values(manifest.reuse), modules: clone(manifest.modules), disclaimer: manifest.disclaimer };
    requireValue(new Set(result.questions.map(question => question.id)).size === result.questions.length, 'повтор ID после объединения.');
    return result;
  }
  function selectSection(composed, section) {
    requireValue(['basic', 'compliance'].includes(section), 'неизвестный раздел.');
    const result = clone(composed);
    result.questions = result.questions.filter(question => section === 'compliance' ? !!question.compliance : !question.compliance);
    if (section === 'compliance') {
      requireValue(Array.isArray(result.compliance?.modules), 'не найдены темы раздела.');
      result.questions.forEach(question => { question.topic = question.compliance.moduleTitle; });
      result.topics = result.compliance.modules.map(item => item.name);
    } else result.topics = result.topics.filter(topic => result.questions.some(question => question.topic === topic));
    requireValue(result.questions.length && result.topics.length, 'пустой раздел.');
    result.section = section;
    return result;
  }
  async function load(fetcher) {
    const request = fetcher || fetch;
    const get = async path => {
      const response = await request(path);
      if (!response.ok) throw new Error(`Не удалось загрузить ${path}: HTTP ${response.status}.`);
      return response.json();
    };
    const [base, manifest, ...parts] = await Promise.all([
      get('./questions.json'), get(`${DIRECTORY}manifest.json`), ...PARTS.map(part => get(`${DIRECTORY}${part}`))
    ]);
    return merge(base, manifest, parts);
  }
  return Object.freeze({ load, merge, selectSection });
});

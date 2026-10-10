(() => {
  'use strict';
  const FILES = [
    { id: 'basic', url: './questions.json', title: 'Базовые вопросы' },
    { id: 'ai-security', url: './ai-security-questions.json', title: 'Защита ИИ' },
    { id: 'scenarios', url: './scenarios-questions.json', title: 'Ситуационные задачи' }
  ];
  const scoped = (bank, id) => `${bank}:${id}`;
  const refs = (bank, items) => items.map(ref => ({ ...ref, sourceId: scoped(bank, ref.sourceId) }));

  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }
  function validateOrigin(data, file) {
    if (!data || !Array.isArray(data.questions) || !data.questions.length || !Array.isArray(data.sources) || !data.sources.length || !validDate(data.reviewedAt || data.updatedAt)) throw new Error(`Неверный формат ${file.url}.`);
    if (file.id === 'basic') {
      if (!Array.isArray(data.topics) || !data.topics.length || data.questions.some(q => !q || !data.topics.includes(q.topic))) throw new Error('Некорректные темы базового банка.');
    } else {
      if (data.schemaVersion !== 1 || data.id !== file.id || !Array.isArray(data.tracks) || data.tracks.length !== (file.id === 'scenarios' ? 3 : 4)) throw new Error(`Неверная структура ${file.url}.`);
      const ids = data.tracks.map(track => track?.id);
      if (new Set(ids).size !== ids.length || ids.some(id => typeof id !== 'string' || !/^[a-z][a-z0-9-]{0,60}$/.test(id)) || data.questions.some(q => !q || !ids.includes(q.track)) || ids.some(id => data.questions.filter(q => q.track === id).length < 3)) throw new Error(`Некорректные направления ${file.url}.`);
      if (file.id === 'scenarios' && !['mitre', 'owasp', 'cve'].every(id => ids.includes(id))) throw new Error('Некорректные направления ситуационных задач.');
    }
  }

  async function load({ includeTopics = false } = {}) {
    const banks = await Promise.all(FILES.map(async file => {
      if (file.id === 'basic') {
        const data = await window.TrainerBasicBank.load();
        validateOrigin(data, file);
        return data;
      }
      const response = await fetch(file.url);
      if (!response.ok) throw new Error(`Не удалось получить ${file.url}: HTTP ${response.status}.`);
      const data = await response.json();
      validateOrigin(data, file);
      return data;
    }));
    const questions = [];
    const sources = [];
    banks.forEach((bank, index) => {
      const id = FILES[index].id;
      sources.push(...bank.sources.map(source => ({ ...source, id: scoped(id, source.id), originalBank: id })));
      for (const question of bank.questions) {
        if (id === 'basic') {
          const sourceIds = (question.sourceIds || []).map(sourceId => scoped(id, sourceId));
          const interviewSourceIds = (question.interviewSourceIds || []).map(sourceId => scoped(id, sourceId));
          const legal = question.legal ? { ...question.legal, references: refs(id, question.legal.references) } : undefined;
          const references = [...new Set([...sourceIds, ...interviewSourceIds])].flatMap(sourceId => {
            const locators = legal?.references.filter(ref => ref.sourceId === sourceId) || [];
            return locators.length ? locators : [{ sourceId }];
          });
          questions.push({ ...question, kind: 'basic', originalBank: id, track: question.compliance ? 'compliance' : id, title: question.compliance?.moduleTitle || question.topic,
            sourceIds, interviewSourceIds, ...(legal ? { legal } : {}), references,
            documentSource: references.length ? undefined : bank.source });
        } else {
          questions.push({ ...question, kind: 'case', originalBank: id, originalTrack: question.track,
            track: id, references: refs(id, question.references) });
        }
      }
    });
    const dates = banks.map(bank => bank.reviewedAt || bank.updatedAt).sort();
    const result = {
      schemaVersion: 1, id: 'all-questions', title: 'Все вопросы', reviewedAt: dates[dates.length - 1],
      description: `Базовые вопросы (${banks[0].questions.filter(q=>!q.compliance).length}), комплаенс РФ (${banks[0].questions.filter(q=>q.compliance).length}), защита ИИ (${banks[1].questions.length}) и ситуационные задачи (${banks[2].questions.length}) в одном перемешанном билете. Первая ошибка завершает попытку. Раздел «Сеньор» проходится отдельно.`,
      methodology: 'Подборка загружается из исходных банков без копирования вопросов. Ответ подтверждается кнопкой «Ответить». Чтобы пройти билет, нужно ответить верно на все вопросы подряд. В разборе сохраняются исходные пояснения и источники; даты правовых норм и первоисточников указаны отдельно. Прогресс общей подборки не меняет результаты отдельных банков.',
      tracks: [{id:'basic',title:'Базовые вопросы'}, {id:'compliance',title:'Комплаенс РФ'}, ...FILES.slice(1).map(file => ({ id: file.id, title: file.title }))], sources, questions
    };
    if (includeTopics) {
      result.topicGroups = banks.flatMap((bank, index) => {
        const origin = FILES[index].id;
        if (origin !== 'basic') return bank.tracks.map(track => ({ id: `${origin}:${track.id}`, title: track.title, bankId: origin, questionIds: bank.questions.filter(question => question.track === track.id).map(question => question.id) }));
        const basicQuestions = bank.questions.filter(question => !question.compliance);
        const basicGroups = bank.topics.filter(title => basicQuestions.some(question => question.topic === title)).map(title => ({ id: `basic:${encodeURIComponent(title)}`, title, bankId: origin, questionIds: basicQuestions.filter(question => question.topic === title).map(question => question.id) }));
        const complianceGroups = (bank.compliance?.modules || []).map(module => ({ id:`compliance:${module.id}`, title:module.name, bankId:'compliance', questionIds:bank.questions.filter(question => question.compliance?.module === module.id).map(question => question.id) }));
        return [...basicGroups, ...complianceGroups];
      });
    }
    return result;
  }
  window.TrainerAllQuestions = Object.freeze({ load });
})();

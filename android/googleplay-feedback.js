'use strict';
(() => {
  const ISSUE_URL = 'https://github.com/Moonwuk/CS-bilets-ru/issues/new';
  let bankLabel = '', bankVersion = '', questions = new Map();
  const escape = value => String(value).replace(/[&<>"']/g,
    c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-question-feedback]');
    if (!button) return;
    event.preventDefault();
    const id = button.dataset.questionId || '';
    const kind = button.dataset.questionFeedback === 'error' ? 'Ошибка' : 'Предложение';
    const question = questions.get(id);
    const url = new URL(ISSUE_URL);
    url.searchParams.set('title', `${kind}: ${id || 'приложение'} · ${bankLabel}`);
    // Only public question content is sent to the external browser.
    // No answers, local notes, progress, free text or device identifiers.
    url.searchParams.set('body', [
      `Банк: ${bankLabel}`, `Версия банка: ${bankVersion}`,
      `ID вопроса: ${id || 'всё приложение'}`,
      question ? question.question : '',
      '', 'Опишите предложение или ошибку здесь. Обращение будет публичным.'
    ].join('\n'));
    const link = document.createElement('a');
    link.href = url.href;
    link.rel = 'noopener noreferrer';
    document.body.append(link);
    link.click();
    link.remove();
  });
  window.TrainerFeedback = {
    setBank(label, version, items) {
      bankLabel = label; bankVersion = version || 'не указана';
      questions = new Map(items.map(q => [String(q.id), q]));
    },
    actions(id) {
      return `<div class="question-feedback-actions" role="group" aria-label="Обратная связь через GitHub"><button type="button" data-question-feedback="suggestion" data-question-id="${escape(id)}">Предложить улучшение ↗</button><button type="button" data-question-feedback="error" data-question-id="${escape(id)}">Сообщить об ошибке ↗</button></div>`;
    },
    isOpen() { return false; }
  };
})();

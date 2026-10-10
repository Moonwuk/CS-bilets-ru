'use strict';
(() => {
  const ISSUE_URL = 'https://github.com/Moonwuk/CS-bilets-ru/issues/new';
  const APP_VERSION = '1.1.0';
  let bankLabel = '', bankVersion = '', questions = new Map(), current = null, previousFocus;
  // Drafts stay in memory only; answering a question never sends a report.
  const drafts = new Map();
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dialog = document.createElement('dialog');
  dialog.className = 'feedback-dialog';
  dialog.id = 'question-feedback-dialog';
  dialog.setAttribute('aria-labelledby', 'question-feedback-title');
  dialog.innerHTML = `<form method="dialog" class="feedback-form">
    <div class="feedback-dialog-heading"><div><span class="eyebrow">Обратная связь</span><h2 id="question-feedback-title"></h2></div><button type="button" class="feedback-close" aria-label="Закрыть обратную связь">×</button></div>
    <p class="feedback-context" id="question-feedback-context"></p>
    <label for="question-feedback-message" id="question-feedback-label"></label>
    <textarea id="question-feedback-message" rows="5" maxlength="2000" required aria-describedby="question-feedback-help" placeholder="Напишите, что стоит изменить…"></textarea>
    <p id="question-feedback-help" class="feedback-help">Номер и текст вопроса добавятся автоматически. Отправка откроется на GitHub: нужен аккаунт, обращение будет публичным. Не указывайте личные данные.</p>
    <details class="feedback-preview"><summary>Что попадёт в обращение</summary><pre id="question-feedback-preview"></pre></details>
    <div class="feedback-submit-actions"><button type="button" class="button secondary" id="feedback-copy">Скопировать текст</button><button type="submit" class="button primary">Открыть в GitHub</button></div>
    <a id="feedback-long-draft" hidden rel="noopener noreferrer">Открыть черновик и вставить текст</a>
    <p class="feedback-status" id="feedback-status" role="status" aria-live="polite"></p>
  </form>`;
  document.body.append(dialog);
  const field = dialog.querySelector('textarea');
  const status = dialog.querySelector('#feedback-status');
  const longDraft = dialog.querySelector('#feedback-long-draft');
  function draftKey() { return `${bankLabel}:${current.kind}:${current.id || 'general'}`; }
  function report() {
    const q = current.id ? questions.get(current.id) : null;
    const lines = [current.kind === 'error' ? 'Ошибка в вопросе' : 'Предложение', '', field.value.trim(), '', `Банк: ${bankLabel}`, `Версия банка: ${bankVersion}`, `Версия приложения: ${APP_VERSION}`];
    if (q) {
      lines.push(`ID вопроса: ${q.id}`, '', q.title || q.topic || '', q.question);
      if (Array.isArray(q.evidence)) lines.push('', 'Данные сценария:', ...q.evidence);
      if (Array.isArray(q.constraints)) lines.push('', 'Условия:', ...q.constraints);
      lines.push('', 'Варианты в исходном порядке:', ...q.options.map((option, index) => `${index + 1}. ${option.text}`));
    }
    // No answers, correct-answer flags, private reasoning notes, statistics or device identifiers.
    return lines.join('\n');
  }
  function refresh() {
    drafts.set(draftKey(), field.value);
    dialog.querySelector('#question-feedback-preview').textContent = report();
    status.textContent = '';
    longDraft.hidden = true;
  }
  function open(kind, id, launcher) {
    if (id && !questions.has(id)) return;
    current = {kind, id};
    previousFocus = launcher;
    dialog.querySelector('#question-feedback-title').textContent = kind === 'error' ? 'Ошибка в вопросе' : 'Предложить улучшение';
    dialog.querySelector('#question-feedback-context').textContent = `${bankLabel}${id ? ` · вопрос ${id}` : ' · всё приложение'}`;
    dialog.querySelector('#question-feedback-label').textContent = kind === 'error' ? 'Что неверно и как это исправить?' : 'Что можно сделать лучше?';
    field.value = drafts.get(draftKey()) || '';
    field.setCustomValidity('');
    dialog.querySelector('details').open = false;
    refresh();
    dialog.showModal();
    field.focus();
  }
  function close() { dialog.close(); }
  async function copyReport() {
    const content = report();
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(content);
    } catch (error) {
      const copy = document.createElement('textarea');
      copy.value = content; copy.setAttribute('readonly', '');
      copy.className = 'feedback-clipboard'; dialog.append(copy); copy.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch (ignored) { /* manual selection below */ }
      copy.remove();
      if (!copied) {
        dialog.querySelector('details').open = true;
        const range = document.createRange(); range.selectNodeContents(dialog.querySelector('pre'));
        const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
        status.textContent = 'Скопируйте выделенный текст вручную.';
        return false;
      }
    }
    status.textContent = 'Текст скопирован. Его можно отправить разработчику.';
    return true;
  }
  dialog.querySelector('.feedback-close').addEventListener('click', close);
  dialog.addEventListener('close', () => { if (previousFocus?.isConnected) previousFocus.focus(); });
  field.addEventListener('input', refresh);
  dialog.querySelector('#feedback-copy').addEventListener('click', copyReport);
  dialog.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    if (!field.value.trim()) { field.setCustomValidity('Опишите предложение или ошибку.'); field.reportValidity(); return; }
    const title = `${current.kind === 'error' ? 'Ошибка' : 'Предложение'}: ${current.id || 'приложение'} · ${bankLabel}`;
    const url = new URL(ISSUE_URL);
    url.searchParams.set('title', title);
    url.searchParams.set('body', report());
    if (url.href.length > 7500) {
      status.textContent = 'Обращение длинное. Нажмите «Скопировать текст», затем откройте черновик по ссылке ниже и вставьте текст на GitHub.';
      url.searchParams.set('body', `Банк: ${bankLabel}\nID вопроса: ${current.id || 'всё приложение'}\n\nВставьте сюда текст, скопированный в приложении.`);
      longDraft.href = url.href;
      if (!window.CS_ANDROID) longDraft.target = '_blank';
      else longDraft.removeAttribute('target');
      longDraft.hidden = false;
      return;
    } else {
      status.textContent = 'Черновик откроется в браузере. Для отправки опубликуйте его на GitHub.';
    }
    // Use a user-initiated same-window navigation so Android opens its external browser.
    // A regular browser uses a new tab to keep the current attempt and draft intact.
    const link = document.createElement('a');
    link.href = url.href; link.rel = 'noopener noreferrer';
    if (!window.CS_ANDROID) link.target = '_blank';
    dialog.append(link); link.click(); link.remove();
  });
  field.addEventListener('input', () => field.setCustomValidity(''));
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-question-feedback]');
    if (!button) return;
    event.preventDefault();
    open(button.dataset.questionFeedback, button.dataset.questionId || null, button);
  });
  window.TrainerFeedback = {
    setBank(label, version, items) { bankLabel = label; bankVersion = version || 'не указана'; questions = new Map(items.map(q => [String(q.id), q])); },
    actions(id) {
      return `<div class="question-feedback-actions" role="group" aria-label="Обратная связь по вопросу"><button type="button" data-question-feedback="suggestion" data-question-id="${escape(id)}">Предложить улучшение</button><button type="button" data-question-feedback="error" data-question-id="${escape(id)}">Сообщить об ошибке</button></div>`;
    },
    isOpen() { return dialog.open; }
  };
})();

(() => {
  'use strict';
  const container = document.querySelector('#compliance-content');
  const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const validLink = value => {
    try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; }
    catch (_) { return false; }
  };
  const link = item => validLink(item.url) ? `<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.title)}</a>` : esc(item.title);
  const paragraph = (title, value) => `<p class="practice-text"><strong>${title}</strong> ${esc(value)}</p>`;
  async function load() {
    try {
      const [manifest, practice] = await Promise.all(['manifest.json', 'practice.json'].map(async name => {
        const response = await fetch(`./data/compliance-ru/${name}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      }));
      if (manifest.schemaVersion !== 1 || manifest.id !== 'compliance-ru' || !Array.isArray(manifest.modules) || manifest.modules.length !== 15 || !Array.isArray(manifest.sources) || !Array.isArray(manifest.furtherReading) || practice.schemaVersion !== 1 || !Array.isArray(practice.cases) || practice.cases.length !== 15) throw new Error('Неверная структура материалов');
      for (const item of practice.cases) {
        if (!/^rpc\d{2}$/.test(item.id) || !['title', 'situation', 'task', 'discussion', 'criticalMistake'].every(field => typeof item[field] === 'string' && item[field].trim()) || !Array.isArray(item.criteria) || item.criteria.length !== 5 || !item.criteria.every(value => typeof value === 'string') || !Array.isArray(item.sources)) throw new Error('Неполный практический кейс');
      }
      container.removeAttribute('role');
      container.innerHTML = `<p><strong>Дата сверки:</strong> <time datetime="${esc(manifest.reviewedAt)}">${esc(manifest.reviewedAt.split('-').reverse().join('.'))}</time>.</p><p>${esc(manifest.disclaimer)}</p>
        <nav aria-label="Разделы материалов"><a href="#modules">Направления</a><a href="#practice">15 кейсов</a><a href="#sources">Источники ответов</a><a href="#reading">Дополнительные подборки</a></nav>
        <h2 id="modules">15 направлений темы</h2><ol>${manifest.modules.map(item => `<li>${esc(item.name)}</li>`).join('')}</ol>
        <h2 id="practice">Самостоятельный практикум</h2><p>${esc(practice.disclaimer)}</p>
        ${practice.cases.map((item, index) => `<details id="${esc(item.id)}"><summary>${index + 1}. ${esc(item.title)}</summary>${paragraph('Ситуация.', item.situation)}${paragraph('Задание.', item.task)}<details><summary>Показать ориентир и критерии самопроверки</summary>${paragraph('Ориентир для разбора.', item.discussion)}${paragraph('Существенная ошибка.', item.criticalMistake)}<p><strong>Пять критериев: каждый от 0 до 2 баллов.</strong></p><ol>${item.criteria.map(value => `<li>${esc(value)}</li>`).join('')}</ol><p>Это ручная самопроверка, а не подтверждение профессиональной квалификации.</p><ul>${item.sources.map(source => `<li>${link(source)}</li>`).join('')}</ul></details></details>`).join('')}
        <h2 id="sources">Источники правильных разборов</h2><p>Нормативный текст, официальное объяснение, рекомендация и редакционный разбор имеют разный статус. Ограничения каждой использованной копии сохранены ниже.</p>
        ${manifest.sources.map(source => `<details><summary>${esc(source.title)}</summary><p>${link(source)}</p>${paragraph('Статус.', source.type)}${paragraph('Использованные положения.', source.usedProvisions)}${paragraph('Доступ.', source.access)}${paragraph('Ограничения.', source.limitations)}</details>`).join('')}
        <h2 id="reading">Дополнительные источники вопросов</h2><p>Это отдельный список для дальнейшей подготовки и расширения. Он не означает, что все вопросы этих сайтов прочитаны, проверены и добавлены в тему.</p><ul>${manifest.furtherReading.map(item => `<li><p>${link(item)}</p><p class="source-note">${esc(item.status)}</p></li>`).join('')}</ul>`;
    } catch (error) {
      console.error('Could not load compliance materials', error);
      container.setAttribute('role', 'alert');
      container.innerHTML = '<p>Не удалось загрузить все материалы. Проверьте соединение или комплект офлайн-приложения.</p><button class="button primary" id="retry-materials">Повторить загрузку</button>';
      document.querySelector('#retry-materials').addEventListener('click', load);
    }
  }
  load();
})();

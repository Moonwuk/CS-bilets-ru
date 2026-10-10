'use strict';
(() => {
  const icons = {
    tickets:'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h4"/>',
    topics:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    mistakes:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 17h.01"/>',
    document:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    cross:'<path d="m6 6 12 12M18 6 6 18"/>',
    shuffle:'<path d="m18 3 3 3-3 3M18 15l3 3-3 3M3 6h3c6 0 6 12 12 12h3M3 18h3c2 0 3-1 4-3M14 9c1-2 2-3 4-3h3"/>',
    chevron:'<path d="m6 9 6 6 6-6"/>',
    shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.tickets}</svg>`;
  document.querySelectorAll('[data-icon]').forEach(el => {el.innerHTML = icon(el.dataset.icon);});
  const $ = selector => document.querySelector(selector);
  const main = $('#main');
  const letters = ['А','Б','В','Г'];
  const TICKET_SIZE = 50;
  let randomSize = 50;
  const isCompliance = document.body.dataset.bank === 'compliance';
  const basicStorageKey = 'cs-bilets-ru.progress.v1';
  const complianceStorageKey = 'cs-bilets-ru.compliance.v1';
  const storageKey = isCompliance ? complianceStorageKey : basicStorageKey;
  const homePage = isCompliance ? 'topics' : 'tickets';
  let migrationBlocked = false;
  let dataset, bank, tickets, sourceIndex, session = null, sessionOpen = false, page = homePage, mode = 'practice';
  let storageAvailable = true, bankSignature = '', bankUpdateNotice = '';
  let total = 0, correctTotal = 0;
  const errors = new Set();
  const ticketResults = new Map();
  function updateStorageStatus() {
    $('#storage-status').textContent = storageAvailable
      ? 'Прогресс сохраняется на этом устройстве автоматически.'
      : 'Браузер не разрешает сохранение. Прогресс доступен только до закрытия страницы.';
    $('#sidebar-storage-status').textContent = storageAvailable
      ? 'Результаты и ошибки сохраняются между посещениями.'
      : 'Сохранение недоступно на этом устройстве.';
  }
  function saveProgress() {
    if(!dataset)return;
    if(migrationBlocked){storageAvailable=false;updateStorageStatus();return;}
    try {
      window.localStorage.setItem(storageKey,JSON.stringify({
        version:1,sectionSplit:1,randomSize,bankSignature,total,correctTotal,page,mode,errors:[...errors],ticketResults:[...ticketResults],sessionOpen,
        session:session ? {...session,answers:[...session.answers],orders:[...session.orders],recorded:[...session.recorded]} : null
      }));
      storageAvailable=true;
    } catch(error) {
      storageAvailable=false;
    }
    updateStorageStatus();
  }
  function migrateComplianceErrors(data) {
    // Copy old compliance mistakes before the basic section filters them out.
    // Aggregate counters cannot be attributed to a section retroactively.
    try {
      const raw=window.localStorage.getItem(basicStorageKey);
      if(!raw)return;
      let saved;
      try { saved=JSON.parse(raw); } catch (_) { return; }
      if(!saved || saved.version!==1 || saved.sectionSplit===1)return;
      const ids=new Set(data.questions.filter(q=>q.compliance).map(q=>q.id));
      const mistakes=Array.isArray(saved.errors) ? saved.errors.filter(id=>ids.has(id)) : [];
      if(mistakes.length){
        const targetRaw=window.localStorage.getItem(complianceStorageKey);
        let target;
        try { target=JSON.parse(targetRaw); } catch (_) { target=null; }
        if(!target || target.version!==1)target={version:1,total:0,correctTotal:0,page:'topics',mode:'practice',errors:[]};
        target.errors=[...new Set([...(Array.isArray(target.errors)?target.errors:[]),...mistakes])];
        window.localStorage.setItem(complianceStorageKey,JSON.stringify(target));
      }
      window.localStorage.setItem(basicStorageKey,JSON.stringify({...saved,sectionSplit:1}));
    } catch (_) { migrationBlocked=true;storageAvailable=false; }
  }
  function getBankSignature(data) {
    // Answers depend on the question content; numbered results also depend on the ticket layout.
    const content=JSON.stringify([data.questions.map(q=>[q.id,q.topic,q.question,q.options.map(o=>[o.text,o.correct])]),tickets]);
    let hash=2166136261;
    for(let i=0;i<content.length;i++)hash=Math.imul(hash^content.charCodeAt(i),16777619);
    return (hash>>>0).toString(16);
  }
  function restoreProgress() {
    let raw;
    try {raw=window.localStorage.getItem(storageKey);}catch(error){storageAvailable=false;return;}
    if(!raw)return;
    let saved;
    try {saved=JSON.parse(raw);}catch(error){return;}
    if(!saved || saved.version!==1)return;
    if(Number.isSafeInteger(saved.total) && saved.total>=0 && Number.isSafeInteger(saved.correctTotal) && saved.correctTotal>=0 && saved.correctTotal<=saved.total){
      total=saved.total;correctTotal=saved.correctTotal;
    }
    if(['tickets','topics','mistakes'].includes(saved.page))page=saved.page;
    if(['practice','exam'].includes(saved.mode))mode=saved.mode;
    if([20,50].includes(saved.randomSize))randomSize=saved.randomSize;
    if(Array.isArray(saved.errors))saved.errors.forEach(id=>{if(bank.has(id))errors.add(id);});
    // Keep aggregate history and mistake IDs, but never apply old answer indices or ticket results to a new bank.
    if(saved.bankSignature!==bankSignature){
      if(typeof saved.bankSignature==='string' && saved.bankSignature)bankUpdateNotice='Банк вопросов обновлён. Общая статистика и список ошибок сохранены. Старые результаты билетов и незавершённый билет сброшены.';
      return;
    }
    if(Array.isArray(saved.ticketResults))saved.ticketResults.forEach(entry=>{
      if(!Array.isArray(entry) || entry.length!==2)return;
      const [n,result]=entry;
      if(Number.isInteger(n) && tickets[n] && result && result.length===tickets[n].length && Number.isInteger(result.correct) && result.correct>=0 && result.correct<=result.length)ticketResults.set(n,result);
    });
    const stored=saved.session;
    if(!stored || !Array.isArray(stored.ids) || !stored.ids.length || stored.ids.length>bank.size || new Set(stored.ids).size!==stored.ids.length || !stored.ids.every(id=>bank.has(id)))return;
    if(typeof stored.title!=='string' || !['practice','exam'].includes(stored.mode) || !Number.isInteger(stored.index) || stored.index<0 || stored.index>=stored.ids.length || typeof stored.finished!=='boolean')return;
    if(stored.ticket!==null && (!Number.isInteger(stored.ticket) || !tickets[stored.ticket] || tickets[stored.ticket].length!==stored.ids.length || !tickets[stored.ticket].every(id=>stored.ids.includes(id))))return;
    if(!Array.isArray(stored.answers) || !Array.isArray(stored.orders) || !Array.isArray(stored.recorded))return;
    if(!stored.answers.every(entry=>Array.isArray(entry) && entry.length===2 && stored.ids.includes(entry[0]) && Number.isInteger(entry[1]) && entry[1]>=0 && entry[1]<4))return;
    if(!stored.orders.every(entry=>Array.isArray(entry) && entry.length===2 && stored.ids.includes(entry[0]) && Array.isArray(entry[1]) && entry[1].length===4 && new Set(entry[1]).size===4 && entry[1].every(n=>Number.isInteger(n) && n>=0 && n<4)))return;
    if(new Map(stored.answers).size!==stored.answers.length || new Map(stored.orders).size!==stored.ids.length || stored.orders.length!==stored.ids.length || !stored.recorded.every(id=>stored.ids.includes(id)) || new Set(stored.recorded).size!==stored.recorded.length)return;
    if(stored.finished && stored.recorded.length!==stored.ids.length)return;
    if(!stored.finished && (stored.mode==='exam' ? stored.recorded.length>0 : !stored.recorded.every(id=>new Map(stored.answers).has(id))))return;
    session={title:stored.title,ticket:stored.ticket,mode:stored.mode,ids:stored.ids,index:stored.index,finished:stored.finished,answers:new Map(stored.answers),orders:new Map(stored.orders),recorded:new Set(stored.recorded)};
    sessionOpen=saved.sessionOpen===true;
  }
  async function resetProgress() {
    if(!dataset || !await confirmAction('Сбросить прогресс?','Результаты билетов, ошибки и незавершённый билет будут удалены с этого устройства.','Сбросить','Отмена'))return;
    total=0;correctTotal=0;errors.clear();ticketResults.clear();session=null;sessionOpen=false;page=homePage;mode='practice';bankUpdateNotice='';
    saveProgress();renderHome();focusMain();announce('Прогресс сброшен.');
  }
  const esc = str => String(str).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const termsMarkup = window.TrainerTerms.markup;
  const word = (n, forms) => forms[n%100>=11 && n%100<=14 ? 2 : n%10===1 ? 0 : n%10>=2 && n%10<=4 ? 1 : 2];
  const questionCount = n => `${n} ${word(n,['вопрос','вопроса','вопросов'])}`;
  const errorCount = n => `${n} ${word(n,['ошибка','ошибки','ошибок'])}`;
  const difficultyNames = {basic:'Базовый',intermediate:'Средний',advanced:'Сложный'};
  const legalJurisdictions = {RU:'РФ',EU:'ЕС · GDPR'};
  const dateLabel = value => value.split('-').reverse().join('.');
  function questionContext(q) {
    const level=difficultyNames[q.difficulty];
    const certs=Array.isArray(q.certifications) ? q.certifications : [];
    const interview=q.interviewSourceIds?.length;
    const legal=q.legal;
    if(!level && !certs.length && !interview && !legal)return '';
    return `<div class="question-context">${q.compliance ? `<span class="level-tag">${esc(q.compliance.moduleTitle)}</span>${q.compliance.basisType==='practice' ? '<span class="level-tag">Рекомендуемая практика</span>' : ''}` : ''}${legal ? `<span class="level-tag legal-tag">${legalJurisdictions[legal.jurisdiction]}</span><span class="legal-reviewed">Нормы проверены: <time datetime="${esc(legal.reviewedAt)}">${dateLabel(legal.reviewedAt)}</time></span>` : ''}${level ? `<span class="level-tag">${esc(level)}</span>` : ''}${interview ? '<span class="level-tag">Собеседование</span>' : ''}${certs.length ? `<span>По тематике: ${certs.map(esc).join(' · ')}</span>` : ''}</div>`;
  }
  function sourcesMarkup(q) {
    const allSources=(q.sourceIds || []).map(id=>sourceIndex.get(id)).filter(Boolean);
    const sources=allSources.filter(source=>source.kind!=='legal');
    const legalSources=allSources.filter(source=>source.kind==='legal');
    const interviews=(q.interviewSourceIds || []).map(id=>sourceIndex.get(id)).filter(Boolean);
    if(!sources.length && !legalSources.length && !interviews.length)return '<p class="answer-source">Источник: infosec_interview.docx.</p>';
    const links=items=>`<ul>${items.map(source=>`<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a>${source.kind==='legal' ? q.legal.references.filter(ref=>ref.sourceId===source.id).map(ref=>`<span class="legal-locator">${esc(ref.locator)}</span>`).join('') : ''}</li>`).join('')}</ul>`;
    return `<div class="answer-sources">${legalSources.length ? `<span class="feedback-label">Правовые источники</span>${links(legalSources)}` : ''}${sources.length ? `<span class="feedback-label">Для разбора темы</span>${links(sources)}` : ''}${interviews.length ? `<span class="feedback-label">Тема из открытой подборки собеседований</span>${links(interviews)}` : ''}</div>`;
  }
  function bankNotes() {
    if(isCompliance)return `<details class="bank-notes"><summary>О вопросах и источниках</summary><p>${questionCount(dataset.questions.length)} по ${dataset.topics.length} темам комплаенса РФ. Дата сверки: ${dateLabel(dataset.updatedAt)}. В каждом вопросе указаны условия; нормы и источники раскрываются в разборе. Рекомендуемые практики помечены отдельно от применения обязательных требований.</p><p>Статистика этого раздела ведётся отдельно. <a href="./compliance-materials.html">Практические кейсы и источники</a> помогают проверить рассуждение на более длинных ситуациях.</p></details>`;
    const added=dataset.questions.filter(q=>q.origin==='authored').length;
    if(!added)return '';
    const guides=dataset.certificationGuides || [];
    const interviewCount=dataset.questions.filter(q=>q.interviewSourceIds?.length).length;
    const interviews=dataset.interviewCollections || [];
    const legalQuestions=dataset.questions.filter(q=>q.legal);
    const reviewDates=[...new Set(legalQuestions.map(q=>q.legal.reviewedAt))].sort().map(dateLabel);
    const links=items=>`<ul>${items.map(item=>`<li><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.title)}</a></li>`).join('')}</ul>`;
    return `<details class="bank-notes"><summary>О вопросах и источниках</summary><p>${questionCount(dataset.questions.length-added)} из исходного документа и ${questionCount(added)} с авторскими формулировками. Новые вопросы опираются на открытые программы сертификаций, темы собеседований${legalQuestions.length ? ', техническую документацию и правовые источники' : ' и техническую документацию'}. В исходных вопросах уточнены найденные неточности. Ссылки на материалы доступны в разборе ответов.</p>${interviewCount ? `<p>Для подготовки к собеседованиям: ${questionCount(interviewCount)} с меткой «Собеседование». Темы взяты из открытых подборок; сценарии, варианты и объяснения составлены для тренажёра. Технические ответы проверены отдельно по документации.</p>` : ''}${legalQuestions.length ? `<p>Для изучения правовых норм: ${questionCount(legalQuestions.length)} по РФ и ЕС (GDPR). Нормы проверены по состоянию на ${reviewDates.join(', ')}. Применимость нормы зависит от юрисдикции и условий вопроса.</p>` : ''}<p>Метки сертификатов обозначают тематику. Это учебная подборка, а не официальный экзамен или полная программа подготовки. Режим «Экзамен» проверяет выбранный билет.</p>${interviews.length ? `<p><strong>Открытые подборки собеседований</strong></p>${links(interviews)}` : ''}${guides.length ? `<p><strong>Программы сертификаций</strong></p>${links(guides)}` : ''}</details>`;
  }
  function shuffled(items) {
    const result = [...items];
    for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
    return result;
  }
  function announce(message) {$('#announcement').textContent = message;}
  function focusMain() {main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
  function updateStats() {
    $('#stat-total').textContent = total;
    $('#stat-correct').textContent = correctTotal;
    $('#mistake-count').textContent = errors.size;
    $('#stat-bar').style.width = `${total ? correctTotal/total*100 : 0}%`;
  }
  function modeToggle() {
    return `<div class="mode-switch" role="group" aria-label="Способ проверки"><button data-mode="practice" aria-pressed="${mode==='practice'}">Тренировка</button><button data-mode="exam" aria-pressed="${mode==='exam'}">Экзамен</button></div>`;
  }
  function modeHint() {return mode==='practice' ? 'Пояснение сразу после каждого ответа.' : 'Проверка и разбор после завершения билета.';}
  function setNav() {
    document.querySelectorAll('[data-page]').forEach(el => {
      el.classList.toggle('active',el.dataset.page===page);
      if(el.dataset.page===page) el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');
    });
  }
  function renderHome() {
    setNav();
    const headings = {tickets:['Случайный билет','Выберите 20 или 50 вопросов. Каждый раз — новая подборка из базового банка.'],topics:['Темы базового банка','Отработайте отдельно то, что пока даётся сложнее. Защита ИИ и ситуационные задачи доступны в отдельных разделах.'],mistakes:['Мои ошибки','Повторяйте вопросы, пока не ответите правильно.']};
    if(isCompliance){headings.tickets=['Смешанный билет','Выберите 20 или 50 вопросов из всех тем комплаенса РФ.'];headings.topics=['Комплаенс РФ','Выберите тему и разберите её целиком. В каждой — 12 вопросов: условия применения, практические ситуации и объяснения.'];headings.mistakes=['Ошибки в комплаенсе','Повторяйте сложные вопросы этого раздела.'];}
    const [title,description]=headings[page];
    let body='';
    if(page==='tickets') {
      const combinedQuestionsCard=`<article class="ticket-card quick-card"><div class="ticket-head"><span class="ticket-no">${icon('shuffle')}</span><span class="ticket-status">До первой ошибки</span></div><h3>Все вопросы</h3><p>Один билет на все вопросы базового банка, комплаенса, ИИ и ситуаций. Первая ошибка завершает попытку. Сеньор — отдельно.</p><a class="button primary" href="./all-questions.html">Открыть билет</a></article>`;
      const topicWheelCard=`<article class="ticket-card quick-card"><div class="ticket-head"><span class="ticket-no">${icon('shuffle')}</span><span class="ticket-status">До последней темы</span></div><h3>Барабан тем</h3><p>Темы базового банка, комплаенса, защиты ИИ и ситуационных задач. Крутите барабан и решайте выпавшую тему целиком. Без ошибок — тема исчезает, с ошибками — возвращается. Прогресс сохраняется.</p><a class="button primary" href="./topic-wheel.html">К барабану</a></article>`;
      const allQuestionsCard=`<article class="ticket-card quick-card"><div class="ticket-head"><span class="ticket-no">${icon('shuffle')}</span><span class="ticket-status">Новый каждый раз</span></div><h3>${isCompliance ? 'Весь комплаенс' : 'Весь базовый банк'}</h3><p>${questionCount(dataset.questions.length)} · без повторов</p><button class="button secondary" data-action="all">Начать</button></article>`;
      const toolQuestions=dataset.questions.filter(q=>q.collection==='security-tools');
      const toolsCard=!isCompliance && toolQuestions.length ? `<article class="ticket-card quick-card"><div class="ticket-head"><span class="ticket-no">${icon('shield')}</span><span class="ticket-status">Новый каждый раз</span></div><h3>Инструменты ИБ</h3><p>${questionCount(toolQuestions.length)} · назначение и ограничения</p><button class="button primary" data-action="tools">Начать</button></article>` : '';
      body=`<section class="random-setup" aria-label="Случайный билет"><span class="eyebrow">Количество вопросов</span><div class="size-options" role="group" aria-label="Количество вопросов">${[20,50].map(size=>`<button class="size-choice" data-size="${size}" aria-pressed="${randomSize===size}"><strong>${size}</strong><span>${size===20?'Короткая тренировка':'Полный билет'}</span></button>`).join('')}</div><p>${questionCount(randomSize)} из всех тем ${isCompliance ? 'комплаенса РФ' : 'базового банка'} · без повторов в билете</p><button class="button primary" data-action="random">Начать ${mode==='exam'?'экзамен':'тренировку'}</button></section><details class="extra-practice"><summary>Другие способы подготовки <span>Подборки и испытания</span></summary><div class="tickets-grid">${allQuestionsCard}${isCompliance ? '' : toolsCard+topicWheelCard+combinedQuestionsCard}</div></details>`;
    } else if(page==='topics') {
      body=`<div class="topic-grid">${dataset.topics.map((topic,i)=>`<button class="topic-card" data-topic="${i}"><span class="topic-left"><span class="topic-icon">${icon(i===0?'shield':'document')}</span><span><span class="topic-name">${esc(topic)}</span><span class="topic-count">${questionCount(dataset.questions.filter(q=>q.topic===topic).length)}</span></span></span></button>`).join('')}</div>`;
    } else if(!errors.size) {
      body=`<div class="empty-state"><div class="empty-icon">${icon('check')}</div><h2>Пока нет ошибок</h2><p>Ошибочные и пропущенные вопросы появятся здесь для повторения.</p><button class="button primary" data-action="random">Начать случайный билет</button></div>`;
    } else {
      body=`<div class="mode-bar"><span class="mode-hint">${questionCount(errors.size)} для повторения</span><button class="button primary" data-action="errors">Повторить ошибки</button></div><div class="error-list">${[...errors].map(id=>{const q=bank.get(id);return `<div class="error-item">${icon('mistakes')}<div><span class="error-topic">${esc(q.topic)}</span><p>${termsMarkup(q.question)}</p></div><button class="button secondary" data-single="${id}">Повторить</button></div>`;}).join('')}</div>`;
    }
    if(isCompliance && page==='topics')body+=`<section class="bank-notes"><h2>Практикум</h2><p>15 развёрнутых кейсов для самостоятельного разбора.</p><a class="button secondary" href="./compliance-materials.html">Открыть кейсы и источники</a></section>`;
    if(!isCompliance && page!=='mistakes')body=`<section class="resume-card compliance-entry" aria-label="Комплаенс РФ"><div><strong>Комплаенс РФ</strong><p>${dataset.compliance?.questionCount || 0} вопросов · ${dataset.compliance?.modules?.length || 0} отдельных тем · свой прогресс</p></div><a class="button primary" href="./compliance.html">Открыть темы</a></section>`+body;
    const updateNotice=bankUpdateNotice ? `<p class="bank-update-notice" role="status">${esc(bankUpdateNotice)}</p>` : '';
    const resume=session && !session.finished ? `<section class="resume-card" aria-label="Незавершённый билет"><div><strong>${esc(session.title)}</strong><p>${session.mode==='exam'?'Экзамен':'Тренировка'} · вопрос ${session.index+1} из ${session.ids.length}</p></div><button class="button primary" data-action="resume">Продолжить билет</button></section>` : '';
    main.innerHTML=`<div class="page-heading"><div><span class="eyebrow">Учимся на практике</span><h1>${title}</h1><p>${description}</p></div>${modeToggle()}</div><div class="mode-bar"><span class="mode-hint">${modeHint()}</span></div>${updateNotice}${resume}${body}${page==='mistakes'?'':bankNotes()}`;
    bindHome();
    updateStats();
  }
  function bindHome() {
    main.querySelectorAll('[data-mode]').forEach(el=>el.addEventListener('click',()=>{mode=el.dataset.mode;saveProgress();renderHome();}));
    main.querySelectorAll('[data-size]').forEach(el=>el.addEventListener('click',()=>{const size=Number(el.dataset.size);if(![20,50].includes(size))return;randomSize=size;saveProgress();renderHome();main.querySelector(`[data-size="${size}"]`).focus();}));
    main.querySelectorAll('[data-topic]').forEach(el=>el.addEventListener('click',()=>{const topic=dataset.topics[Number(el.dataset.topic)];requestStartSession(dataset.questions.filter(q=>q.topic===topic).map(q=>q.id),topic);}));
    main.querySelectorAll('[data-single]').forEach(el=>el.addEventListener('click',()=>requestStartSession([el.dataset.single],'Повторение ошибки')));
    main.querySelectorAll('[data-action="random"]').forEach(el=>el.addEventListener('click',()=>requestStartSession(shuffled(dataset.questions.map(q=>q.id)).slice(0,randomSize),'Случайный билет')));
    main.querySelectorAll('[data-action="all"]').forEach(el=>el.addEventListener('click',()=>requestStartSession([...bank.keys()],isCompliance ? 'Весь комплаенс' : 'Весь базовый банк')));
    main.querySelectorAll('[data-action="tools"]').forEach(el=>el.addEventListener('click',()=>requestStartSession(dataset.questions.filter(q=>q.collection==='security-tools').map(q=>q.id),'Инструменты ИБ')));
    main.querySelectorAll('[data-action="errors"]').forEach(el=>el.addEventListener('click',()=>requestStartSession([...errors],'Работа над ошибками')));
    main.querySelectorAll('[data-action="resume"]').forEach(el=>el.addEventListener('click',()=>{sessionOpen=true;saveProgress();renderQuiz();focusMain();}));
  }
  async function requestStartSession(ids,title,ticket=null) {
    if(session && !session.finished && !await confirmAction('Начать другой билет?','Незавершённый билет будет заменён. Проверенные ответы и ошибки останутся в вашем прогрессе.','Начать','Отмена'))return;
    startSession(ids,title,ticket);
  }
  function startSession(ids,title,ticket=null) {
    if(!ids.length) return;
    session={title,ticket,mode,ids:shuffled(ids),index:0,answers:new Map(),orders:new Map(),recorded:new Set(),finished:false};
    session.ids.forEach(id=>session.orders.set(id,shuffled([0,1,2,3])));
    sessionOpen=true;saveProgress();
    renderQuiz();focusMain();
  }
  function isCorrect(id) {
    const answer=session.answers.get(id);
    return answer!==undefined && bank.get(id).options[answer].correct;
  }
  function recordAnswer(id) {
    if(session.recorded.has(id)) return;
    session.recorded.add(id);total++;
    if(isCorrect(id)){correctTotal++;errors.delete(id);}else errors.add(id);
    updateStats();
  }
  function detailsMarkup(q,selected) {
    const order=session.orders.get(q.id);
    return `${q.compliance ? `<p><strong>Что проверяется:</strong> ${termsMarkup(q.compliance.learningObjective)}</p><p><strong>Пример подтверждения:</strong> ${termsMarkup(q.compliance.recommendedEvidence)}</p>` : ''}<details class="explanation-details"><summary>Почему другие варианты неверны</summary>${order.map((oi,i)=>{
      const o=q.options[oi];if(o.correct || oi===selected)return '';
      return `<div class="explanation-detail"><strong>${letters[i]}. ${termsMarkup(o.text)}</strong>${termsMarkup(o.explanation)}</div>`;
    }).join('')}</details>`;
  }
  function feedbackMarkup(q) {
    const selected=session.answers.get(q.id);
    const right=q.options.findIndex(o=>o.correct);
    const correct=isCorrect(q.id);
    return `<section class="feedback${correct?'':' is-error'}" aria-label="Разбор ответа"><div class="feedback-heading">${icon(correct?'check':'mistakes')}${correct?'Верно':'Есть ошибка'}</div>${!correct ? `<span class="feedback-label">Почему ваш ответ неверен</span><p>${termsMarkup(q.options[selected].explanation)}</p><span class="feedback-label">Правильный ответ</span><p>${termsMarkup(q.options[right].text)}</p>`:''}<span class="feedback-label">${correct?'Пояснение':'Почему это верно'}</span><p>${termsMarkup(q.options[right].explanation)}</p>${detailsMarkup(q,selected)}${sourcesMarkup(q)}</section>`;
  }
  function renderQuiz() {
    const id=session.ids[session.index],q=bank.get(id),selected=session.answers.get(id);
    const checked=session.mode==='practice' && session.recorded.has(id);
    const order=session.orders.get(id);
    const answered=session.answers.size;
    const isLast=session.index===session.ids.length-1;
    const options=order.map((oi,i)=>{
      const o=q.options[oi];let style=selected===oi?' selected':'';
      if(checked && o.correct)style=' correct';
      if(checked && selected===oi && !o.correct)style=' wrong';
      // The answer control and help controls are siblings: never nest buttons.
      return `<div class="option${style}${checked?' is-checked':''}"><button type="button" class="option-pick" data-option="${oi}" aria-label="${letters[i]}. ${esc(o.text)}" aria-pressed="${selected===oi}"${checked?' disabled':''}></button><span class="option-letter" aria-hidden="true">${letters[i]}</span><span class="option-text">${termsMarkup(o.text)}</span>${checked && (o.correct || selected===oi) ? icon(o.correct?'check':'cross'):''}</div>`;
    }).join('');
    const questionMap=session.ids.map((qid,i)=>{
      let status=session.answers.has(qid)?' answered':'';
      if(session.mode==='practice' && session.recorded.has(qid))status=isCorrect(qid)?' good':' bad';
      const label=`Вопрос ${i+1}${session.mode==='practice' && session.recorded.has(qid) ? (isCorrect(qid)?', верно':', ошибка') : session.answers.has(qid)?', ответ выбран':''}`;
      return `<button class="question-number${status}" data-jump="${i}" aria-current="${i===session.index}" aria-label="${label}">${i+1}</button>`;
    }).join('');
    let primary='';
    if(session.mode==='practice' && !checked)primary=`<button class="button primary" data-action="check"${selected===undefined?' disabled':''}>Проверить</button>`;
    else primary=`<button class="button primary" data-action="${isLast?'finish':'next'}">${isLast?'Завершить билет':'Следующий вопрос'}</button>`;
    main.innerHTML=`<div class="quiz-top"><div><span class="eyebrow">${session.mode==='exam'?'Экзамен':'Тренировка'}</span><h1>${esc(session.title)}</h1></div><button class="button secondary" data-action="leave">К подготовке</button></div><div class="quiz-layout"><div class="question-panel"><div class="question-meta"><span class="topic-tag">${esc(q.topic)}</span><span>Вопрос ${session.index+1} / ${session.ids.length}</span></div>${questionContext(q)}<h2 class="question-title">${termsMarkup(q.question)}</h2>${[q.question,...q.options.map(o=>o.text)].some(text=>/data-(?:compliance-)?term=/.test(termsMarkup(text))) ? '<p class="term-help-hint">Нажмите на синий термин — объясним простыми словами.</p>' : ''}<div class="options" role="group" aria-label="Варианты ответа">${options}</div>${checked ? feedbackMarkup(q):''}<div class="question-actions"><button class="button ghost" data-action="previous"${session.index===0?' disabled':''}>Назад</button><div class="action-right">${!checked && session.mode==='practice' ? `<button class="button secondary" data-action="${isLast?'finish':'next'}">${isLast?'Завершить':'Пропустить'}</button>` : !isLast && session.mode==='exam' ? '<button class="button secondary" data-action="finish">Завершить</button>':''}${primary}</div></div>${window.TrainerFeedback?.actions(q.id) || ''}</div><aside class="quiz-map${session.ids.length>TICKET_SIZE?' long-session':''}" aria-label="Навигация по вопросам"><div class="quiz-map-title">Вопросы билета</div><div class="question-grid">${questionMap}</div><div class="map-legend">${session.mode==='practice' ? '<span class="legend-item"><span class="legend-square good"></span>Верно</span><span class="legend-item"><span class="legend-square bad"></span>Ошибка</span>':'<span class="legend-item"><span class="legend-square"></span>Ответ выбран</span>'}</div><div class="quiz-progress">${session.mode==='practice' ? session.recorded.size : answered} из ${session.ids.length} ${session.mode==='practice'?'проверено':'отвечено'}<div class="progress-track"><span style="width:${(session.mode==='practice'?session.recorded.size:answered)/session.ids.length*100}%"></span></div></div></aside></div><p class="keyboard-hint">Клавиши 1–4 — выбрать ответ · Enter — проверить или продолжить</p>`;
    if(session.ids.length>TICKET_SIZE){
      const grid=main.querySelector('.question-grid'),current=main.querySelector('.question-number[aria-current="true"]');
      if(grid && current && grid.clientHeight)grid.scrollTop=Math.max(0,current.offsetTop-(grid.clientHeight-current.offsetHeight)/2);
    }
    main.querySelectorAll('[data-option]').forEach(el=>el.addEventListener('click',()=>selectAnswer(Number(el.dataset.option))));
    main.querySelectorAll('[data-jump]').forEach(el=>el.addEventListener('click',()=>jump(Number(el.dataset.jump))));
    main.querySelector('[data-action="leave"]').addEventListener('click',()=>navigate(homePage));
    main.querySelector('[data-action="previous"]').addEventListener('click',()=>jump(session.index-1));
    main.querySelectorAll('[data-action="next"]').forEach(el=>el.addEventListener('click',()=>jump(session.index+1)));
    main.querySelectorAll('[data-action="finish"]').forEach(el=>el.addEventListener('click',requestFinish));
    const check=main.querySelector('[data-action="check"]');if(check)check.addEventListener('click',checkAnswer);
  }
  function selectAnswer(oi) {
    if(!session || session.finished || !Number.isInteger(oi) || oi<0 || oi>3)return;
    const id=session.ids[session.index];
    if(session.recorded.has(id))return;
    session.answers.set(id,oi);saveProgress();renderQuiz();
    const chosen=main.querySelector(`[data-option="${oi}"]`);if(chosen)chosen.focus({preventScroll:true});
  }
  function checkAnswer() {
    if(!session || session.finished || session.mode!=='practice')return;
    const id=session.ids[session.index];
    if(!session.answers.has(id) || session.recorded.has(id))return;
    recordAnswer(id);saveProgress();renderQuiz();
    announce(isCorrect(id)?'Верно. Пояснение под вариантами ответа.':'Есть ошибка. Правильный ответ и пояснение под вариантами ответа.');
    const next=main.querySelector('[data-action="next"], [data-action="finish"]');if(next)next.focus({preventScroll:true});
  }
  function jump(index) {
    if(!session || session.finished || index<0 || index>=session.ids.length)return;
    session.index=index;saveProgress();renderQuiz();focusMain();
    announce(`Вопрос ${index+1} из ${session.ids.length}`);
  }
  function confirmAction(title,message,ok,cancel='Продолжить') {
    return new Promise(resolve=>{
      const dialog=$('#confirm-dialog');
      $('#dialog-title').textContent=title;$('#dialog-message').textContent=message;
      $('#dialog-ok').textContent=ok;$('#dialog-cancel').textContent=cancel;
      const clean=()=>{dialog.removeEventListener('cancel',onCancel);$('#dialog-ok').removeEventListener('click',onOk);$('#dialog-cancel').removeEventListener('click',onCancel);};
      const done=value=>{clean();dialog.close();resolve(value);};
      const onOk=()=>done(true);
      const onCancel=event=>{event.preventDefault();done(false);};
      $('#dialog-ok').addEventListener('click',onOk);$('#dialog-cancel').addEventListener('click',onCancel);dialog.addEventListener('cancel',onCancel);
      dialog.showModal();$('#dialog-cancel').focus();
    });
  }
  async function requestFinish() {
    if(!session || session.finished)return;
    const pending=session.ids.filter(id=>session.mode==='practice' ? !session.recorded.has(id) : !session.answers.has(id)).length;
    if(pending && !await confirmAction('Завершить билет?',`Осталось ${questionCount(pending)} ${session.mode==='practice'?'без проверки':'без ответа'}. Они будут считаться ошибками.`,'Завершить','Вернуться'))return;
    finishSession();
  }
  function finishSession() {
    if(!session || session.finished)return;
    session.ids.forEach(id=>{
      // An unchecked choice in training has not been submitted.
      if(session.mode==='practice' && !session.recorded.has(id))session.answers.delete(id);
      recordAnswer(id);
    });
    session.finished=true;
    const correct=session.ids.filter(isCorrect).length;
    if(session.ticket!==null)ticketResults.set(session.ticket,{correct,length:session.ids.length});
    saveProgress();
    renderResult();focusMain();announce(`${correct} из ${session.ids.length} верно.`);
  }
  function renderResult() {
    const correct=session.ids.filter(isCorrect).length;
    const wrong=session.ids.filter(id=>!isCorrect(id));
    const skipped=session.ids.filter(id=>!session.answers.has(id)).length;
    const title=wrong.length?'Есть что повторить':'Билет пройден';
    const review=session.ids.map((id,i)=>{
      const q=bank.get(id),selected=session.answers.get(id),right=q.options.find(o=>o.correct),good=isCorrect(id);
      return `<details class="review-item"><summary><span class="review-symbol${good?'':' bad'}">${icon(good?'check':'cross')}</span><span class="review-summary-text"><small>${i+1}. ${esc(q.topic)}${selected===undefined?' · пропущен':''}</small><span>${termsMarkup(q.question)}</span></span><span class="review-toggle">${icon('chevron')}</span></summary><div class="review-body">${questionContext(q)}${!good ? `<div class="review-answer wrong"><strong>Ваш ответ:</strong> ${selected===undefined?'Нет ответа':termsMarkup(q.options[selected].text)}</div>`:''}<div class="review-answer"><strong>Правильный ответ:</strong> ${termsMarkup(right.text)}</div>${selected!==undefined && !good ? `<p><strong>Почему ваш ответ неверен:</strong> ${termsMarkup(q.options[selected].explanation)}</p>`:''}<p><strong>Пояснение:</strong> ${termsMarkup(right.explanation)}</p>${detailsMarkup(q,selected)}${sourcesMarkup(q)}${window.TrainerFeedback?.actions(q.id) || ''}</div></details>`;
    }).join('');
    main.innerHTML=`<div class="page-heading"><div><span class="eyebrow">${session.mode==='exam'?'Результат экзамена':'Результат тренировки'}</span><h1>${esc(session.title)}</h1></div></div><section class="result-card"><div class="result-score">${correct}<span> / ${session.ids.length}</span></div><div class="result-copy"><h2>${title}</h2><p>${wrong.length ? `${errorCount(wrong.length)}${skipped?`, из них ${skipped} без ответа`:''}. Они добавлены в «Мои ошибки».`:'Все ответы верные. Можно перейти к следующему билету.'}</p><div class="result-actions">${wrong.length?'<button class="button primary" data-result="errors">Повторить ошибки</button>':''}<button class="button ${wrong.length?'secondary':'primary'}" data-result="retry">Решить снова</button><button class="button secondary" data-result="home">К подготовке</button></div></div></section><div class="section-heading"><h2>Разбор всех вопросов</h2><span>Откройте вопрос</span></div><div class="result-review">${review}</div>`;
    main.querySelector('[data-result="retry"]').addEventListener('click',()=>startSession([...session.ids],session.title,session.ticket));
    main.querySelector('[data-result="home"]').addEventListener('click',()=>navigate(homePage));
    const repeat=main.querySelector('[data-result="errors"]');if(repeat)repeat.addEventListener('click',()=>{mode='practice';startSession(wrong,'Работа над ошибками');});
  }
  async function navigate(destination) {
    if(!dataset || !['tickets','topics','mistakes'].includes(destination))return;
    if(session?.finished)session=null;
    sessionOpen=false;page=destination;saveProgress();renderHome();focusMain();
  }
  document.querySelectorAll('[data-page]').forEach(el=>el.addEventListener('click',()=>navigate(el.dataset.page)));
  $('#brand').addEventListener('click',event=>{event.preventDefault();navigate(homePage);});
  $('#reset-progress').addEventListener('click',resetProgress);
  document.addEventListener('keydown',event=>{
    if(!session || !sessionOpen || session.finished || $('#confirm-dialog').open || window.TrainerTerms.isOpen() || window.TrainerFeedback?.isOpen() || event.ctrlKey || event.metaKey || event.altKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName))return;
    if(/^[1-4]$/.test(event.key)){
      event.preventDefault();selectAnswer(session.orders.get(session.ids[session.index])[Number(event.key)-1]);
    } else if(event.key==='Enter' && (event.target===document.body || event.target===main || event.target.matches('.option-pick'))){
      event.preventDefault();
      const id=session.ids[session.index];
      if(session.mode==='practice' && !session.recorded.has(id))checkAnswer();
      else if(session.index===session.ids.length-1)requestFinish();else jump(session.index+1);
    }
  });
  async function load() {
    try {
      const complete=await window.TrainerBasicBank.load();
      migrateComplianceErrors(complete);
      const data=window.TrainerBasicBank.selectSection(complete,isCompliance ? 'compliance' : 'basic');
      if(!Array.isArray(data.questions) || !data.questions.length || !Array.isArray(data.topics))throw new Error('Invalid question bank');
      const sources=data.sources || [];
      if(!Array.isArray(sources) || new Set(sources.map(s=>s.id)).size!==sources.length)throw new Error('Invalid sources');
      for(const source of sources){if(!source.id || !source.title || new URL(source.url).protocol!=='https:')throw new Error('Invalid source');}
      sourceIndex=new Map(sources.map(source=>[source.id,source]));
      for(const guide of data.certificationGuides || []){if(!guide.title || new URL(guide.url).protocol!=='https:')throw new Error('Invalid guide');}
      for(const collection of data.interviewCollections || []){if(!collection.title || new URL(collection.url).protocol!=='https:')throw new Error('Invalid interview collection');}
      for(const q of data.questions){
        if(!q.id || !data.topics.includes(q.topic) || !q.question || !Array.isArray(q.options) || q.options.length!==4 || q.options.filter(o=>o.correct===true).length!==1 || q.options.some(o=>typeof o.correct!=='boolean' || !o.text || !o.explanation))throw new Error('Invalid question');
        if(q.difficulty && !difficultyNames[q.difficulty])throw new Error('Invalid difficulty');
        if(q.sourceIds && (!Array.isArray(q.sourceIds) || q.sourceIds.some(id=>!sourceIndex.has(id))))throw new Error('Missing source');
        if(q.interviewSourceIds && (!Array.isArray(q.interviewSourceIds) || q.interviewSourceIds.some(id=>sourceIndex.get(id)?.kind!=='interview')))throw new Error('Invalid interview source');
        const legalSourceIds=(q.sourceIds || []).filter(id=>sourceIndex.get(id)?.kind==='legal');
        if(q.legal!==undefined || legalSourceIds.length){
          const legal=q.legal;
          if(!legal || typeof legal!=='object' || Array.isArray(legal) || !['RU','EU'].includes(legal.jurisdiction) || typeof legal.reviewedAt!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(legal.reviewedAt) || !Number.isFinite(Date.parse(legal.reviewedAt)) || new Date(legal.reviewedAt).toISOString().slice(0,10)!==legal.reviewedAt || !Array.isArray(legal.references) || !legal.references.length)throw new Error('Invalid legal metadata');
          if(legal.references.some(ref=>!ref || typeof ref.sourceId!=='string' || sourceIndex.get(ref.sourceId)?.kind!=='legal' || !q.sourceIds?.includes(ref.sourceId) || typeof ref.locator!=='string' || !ref.locator.trim()) || legalSourceIds.some(id=>!legal.references.some(ref=>ref.sourceId===id)))throw new Error('Invalid legal reference');
        }
        if(q.origin==='authored' && (!q.sourceIds?.length || !q.difficulty))throw new Error('Incomplete authored question');
      }
      if(new Set(data.questions.map(q=>q.id)).size!==data.questions.length)throw new Error('Duplicate question IDs');
      window.TrainerFeedback?.setBank(isCompliance ? 'Комплаенс РФ' : 'Базовые билеты', data.updatedAt, data.questions);
      dataset=data;bank=new Map(data.questions.map(q=>[q.id,q]));
      // Spread each topic across tickets, respecting the size of the final ticket.
      const groups=data.topics.map(topic=>data.questions.filter(q=>q.topic===topic));
      const capacities=Array.from({length:Math.ceil(data.questions.length/TICKET_SIZE)},(_,i)=>Math.min(TICKET_SIZE,data.questions.length-i*TICKET_SIZE));
      tickets=capacities.map(()=>[]);
      let ticketIndex=0;
      for(const group of groups)for(const q of group){
        while(tickets[ticketIndex].length>=capacities[ticketIndex])ticketIndex=(ticketIndex+1)%tickets.length;
        tickets[ticketIndex].push(q.id);
        ticketIndex=(ticketIndex+1)%tickets.length;
      }
      $('#ticket-count').textContent=tickets.length;
      $('#topic-count').textContent=dataset.topics.length;
      $('#dataset-info').textContent=`${questionCount(dataset.questions.length)} · ${dataset.topics.length} ${word(dataset.topics.length,['тема','темы','тем'])}`;
      bankSignature=getBankSignature(data);restoreProgress();saveProgress();updateStats();
      if(session && sessionOpen){if(session.finished)renderResult();else renderQuiz();}else renderHome();
      registerTools();
    } catch(error) {
      console.error('Could not load question bank',error);
      main.innerHTML='<section class="error-message"><h1>Не удалось загрузить вопросы</h1><p>Проверьте соединение и попробуйте ещё раз.</p><button class="button primary" id="retry-load">Повторить загрузку</button></section>';
      $('#retry-load').addEventListener('click',load);
    }
  }
  function registerTools() {
    const context=document.modelContext;if(!context?.registerTool)return;
    const lifecycle=new AbortController();
    window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
    const state=()=>({page,mode,total,correct:correctTotal,mistakeIds:[...errors],savingAvailable:storageAvailable,session:session?{title:session.title,mode:session.mode,index:session.index+1,length:session.ids.length,finished:session.finished}:null});
    const tools=[
      {name:'read_training_state',title:'Посмотреть состояние тренировки',description:'Read the saved training counters, errors and current ticket. Progress is stored locally in this browser.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(input){if(!input || typeof input!=='object' || Array.isArray(input) || Object.keys(input).length)throw new Error('Expected an empty object');return state();}},
      {name:'start_practice_ticket',title:'Начать случайный билет',description:'Start a random training ticket with 20 or 50 unique questions. Rejects when an unfinished ticket exists.',inputSchema:{type:'object',properties:{questionCount:{type:'integer',enum:[20,50]}},required:['questionCount'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input || typeof input!=='object' || Object.keys(input).some(k=>k!=='questionCount') || ![20,50].includes(input.questionCount))throw new Error('Choose 20 or 50 questions');if(session && !session.finished)throw new Error('Finish the current ticket first');mode='practice';randomSize=input.questionCount;startSession(shuffled([...bank.keys()]).slice(0,randomSize),'Случайный билет');return state();}}
    ];
    for(const tool of tools){try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(error=>console.warn('Training tool unavailable',error));}catch(error){console.warn('Training tool unavailable',error);}}
  }
  window.trainerNativeBack = () => {
    if (!sessionOpen) return false;
    navigate(homePage);
    return true;
  };
  load();
})();

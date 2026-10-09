'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'questions.json'),'utf8'));
const key='cs-bilets-ru.progress.v1';

class Node {
  constructor(){this.innerHTML='';this.textContent='';this.style={};this.dataset={};this.open=false;this.isConnected=true;this.listeners=new Map();this.classList={toggle(){}};}
  addEventListener(name,fn){if(!this.listeners.has(name))this.listeners.set(name,new Set());this.listeners.get(name).add(fn);}
  removeEventListener(name,fn){this.listeners.get(name)?.delete(fn);}
  dispatch(name,extra={}){const event={target:this,preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.propagationStopped=true;},...extra};for(const fn of this.listeners.get(name)||[])fn(event);return event;}
  setAttribute(){} removeAttribute(){} focus(){this.focused=true;}
  closest(selector){return selector==='[data-term]' && this.dataset.term ? this : null;}
  contains(element){return [...this.children.values()].includes(element);}
  get innerHTML(){return this._html;}
  set innerHTML(value){this._html=value;this.children=new Map();}
  querySelector(selector){if(!this.children.has(selector))this.children.set(selector,new Node());return this.children.get(selector);}
  querySelectorAll(selector){
    const match=selector.match(/^\[(data-[a-z-]+)(?:="([^"]*)")?\]$/);
    if(!match)return [];
    const [,attribute,value]=match;
    return [...this.innerHTML.matchAll(new RegExp(`${attribute}="([^"]*)"`,'g'))].filter(([,v])=>value===undefined || v===value).map(([,v])=>{
      const node=this.querySelector(`[${attribute}="${v}"]`);
      node.dataset[attribute.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;
      return node;
    });
  }
  showModal(){this.open=true;} close(){this.open=false;this.dispatch('close');}
}

async function runtime(storage=new Map(),options={}) {
  const nodes=new Map();
  const loadErrors=[];
  const listeners=new Map();
  const document={querySelector:s=>{if(!nodes.has(s))nodes.set(s,new Node());return nodes.get(s);},querySelectorAll:()=>[],addEventListener(name,fn){if(!listeners.has(name))listeners.set(name,[]);listeners.get(name).push(fn);},body:new Node()};
  const localStorage={
    getItem(k){if(options.blocked)throw new Error('Storage denied');return storage.get(k)??null;},
    setItem(k,value){if(options.blocked)throw new Error('Storage denied');storage.set(k,value);}
  };
  const logger={...console,error(...args){loadErrors.push(args);if(!options.expectLoadFailure)console.error(...args);}};
  const randomMath=options.random ? Object.assign(Object.create(Math),{random:options.random}) : Math;
  const ctx={document,window:{localStorage,scrollTo(){},addEventListener(){}},fetch:async()=>({ok:true,json:async()=>options.data||data}),console:logger,AbortController,Math:randomMath,Map,Set,Promise,URL};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root,'glossary.js'),'utf8'),ctx);
  const source=fs.readFileSync(path.join(root,'app.js'),'utf8').replace('const TICKET_SIZE = 50;',`const TICKET_SIZE = ${options.ticketSize||50};`).replace('  load();\n})();',`  globalThis.qa={startSession,requestStartSession,selectAnswer,checkAnswer,jump,finishSession,isCorrect,navigate,resetProgress,setMode:m=>{mode=m;},get:()=>({session,sessionOpen,tickets,bank,errors,ticketResults,total,correctTotal,page,mode,storageAvailable})};\n  load();\n})();`);
  vm.runInContext(source,ctx);
  await new Promise(resolve=>setImmediate(resolve));
  if(options.expectLoadFailure){
    assert(!ctx.qa.get().bank,`${options.expectLoadFailure} must be rejected`);
    assert.equal(loadErrors.length,1);
    assert(nodes.get('#main').innerHTML.includes('Не удалось загрузить вопросы'));
  } else assert(ctx.qa.get().bank,'The bank must load successfully');
  return {a:ctx.qa,nodes,storage,key(key){const event={key,target:document.body,preventDefault(){}};for(const fn of listeners.get('keydown')||[])fn(event);}};
}

function choose(a,correct) {
  const {session,bank}=a.get();
  const id=session.ids[session.index];
  const oi=bank.get(id).options.findIndex(o=>o.correct===correct);
  a.selectAnswer(oi);
  return {id,oi};
}

(async()=>{
  // Click help in the real screenshot question without touching its attempt or score.
  const glossaryRun=await runtime();
  glossaryRun.a.startSession(['q358'],'Справка');
  const glossaryMain=glossaryRun.nodes.get('#main');
  assert.equal((glossaryMain.innerHTML.match(/class="option-pick"/g)||[]).length,4);
  assert([...glossaryMain.innerHTML.matchAll(/<button[^>]*data-option[^>]*>([\s\S]*?)<\/button>/g)].every(([,content])=>!/<button|<input|<a\b/.test(content)), 'Answer buttons must have no interactive descendants');
  let launcher=glossaryMain.querySelectorAll('[data-term="nonce"]')[0];
  const beforeHelp=glossaryRun.storage.get(key);
  const helpClick=glossaryMain.dispatch('click',{target:launcher});
  assert(helpClick.defaultPrevented && helpClick.propagationStopped);
  assert(glossaryRun.nodes.get('#term-dialog').open);
  glossaryRun.key('1');glossaryRun.key('Enter');
  assert.equal(glossaryRun.a.get().session.answers.size,0);
  assert.equal(glossaryRun.storage.get(key),beforeHelp,'Reading help must not change the saved attempt');
  glossaryRun.nodes.get('#term-dialog').dispatch('cancel');
  assert(launcher.focused);
  const right=glossaryRun.a.get().bank.get('q358').options.findIndex(o=>o.correct);
  glossaryMain.querySelector(`[data-option="${right}"]`).dispatch('click');glossaryRun.a.checkAnswer();
  launcher=glossaryMain.querySelectorAll('[data-term="nonce"]')[0];
  const checkedHelp=glossaryRun.storage.get(key);
  glossaryMain.dispatch('click',{target:launcher});
  assert(glossaryRun.nodes.get('#term-dialog').open,'Vocabulary remains usable after checking');
  glossaryRun.key('2');assert.equal(glossaryRun.storage.get(key),checkedHelp);
  assert.equal(glossaryRun.a.get().total,1);assert.equal(glossaryRun.a.get().correctTotal,1);
  glossaryRun.nodes.get('#term-close').dispatch('click');
  let {a,nodes}=await runtime();
  let state=()=>a.get();
  const all=state().tickets.flat();
  assert.equal(all.length,840);assert.equal(new Set(all).size,840);
  assert.deepEqual(Array.from(all).sort(),data.questions.map(q=>q.id).sort(),'Numbered tickets cover every question once');
  assert.deepEqual(Array.from(state().tickets,t=>t.length),[...Array(16).fill(50),40]);
  const legalCounts=Array.from(state().tickets,t=>t.filter(id=>state().bank.get(id).legal).length);
  assert.equal(legalCounts.reduce((a,b)=>a+b,0),100);assert(legalCounts.every(n=>n===5||n===6),'Legal questions remain evenly distributed');
  assert.equal(Number(nodes.get('#ticket-count').textContent),17);
  assert.equal(Number(nodes.get('#topic-count').textContent),44);
  assert(nodes.get('#dataset-info').textContent.includes('840 вопросов · 44 тем'));
  assert.equal(nodes.get('#main').querySelectorAll('[data-ticket]').length,0);
  assert(fs.readFileSync(path.join(root,'index.html'),'utf8').includes('840 вопросов'));
  for(const topic of data.topics){
    const counts=Array.from(state().tickets,ticket=>ticket.filter(id=>state().bank.get(id).topic===topic).length);
    // Equal-capacity legacy tickets stay balanced; the final 40-question ticket can fill earlier.
    const fullCounts=counts.filter((_,i)=>state().tickets[i].length===50);
    assert(Math.max(...fullCounts)-Math.min(...fullCounts)<=1,`${topic} must be spread evenly across full tickets`);
    assert(counts.at(-1)<=Math.max(...fullCounts)+1,`${topic} must respect the smaller final ticket`);
    if(topic==='Модель OSI'){assert.equal(counts.reduce((a,b)=>a+b,0),41);assert(counts.every(n=>n===2||n===3));}
  }
  const legalTopics=new Map([['Персональные данные РФ',30],['Правовые основы ИБ РФ',25],['КИИ и ответственность в ИБ',20],['GDPR и защита данных в ЕС',25]]);
  assert.equal(data.questions.filter(q=>q.legal).length,100);
  for(const [topic,count] of legalTopics){
    const questions=data.questions.filter(q=>q.topic===topic);
    assert.equal(questions.length,count);
    assert(questions.every(q=>q.legal?.jurisdiction===(topic.startsWith('GDPR')?'EU':'RU') && q.legal.reviewedAt==='2026-10-02'));
  }
  assert(nodes.get('#main').innerHTML.includes('Для изучения правовых норм: 100 вопросов'));
  assert(nodes.get('#main').innerHTML.includes('Нормы проверены по состоянию на 02.10.2026'));
  assert(nodes.get('#main').innerHTML.includes('Применимость нормы зависит от юрисдикции и условий вопроса'));
  assert(nodes.get('#main').innerHTML.includes('50 вопросов из всех тем'));
  nodes.get('#main').querySelector('[data-action="random"]').dispatch('click');
  assert.equal(state().session.ids.length,50);assert.equal(new Set(state().session.ids).size,50);
  a.jump(49);assert.equal(state().session.index,49);assert(nodes.get('#main').innerHTML.includes('Вопрос 50 / 50'));
  a.jump(50);assert.equal(state().session.index,49,'Navigation must stop at question 50');
  // Random size is persisted and a fresh 20-question session has unique IDs.
  const shortRun=await runtime();
  shortRun.nodes.get('#main').querySelector('[data-size="20"]').dispatch('click');
  shortRun.nodes.get('#main').querySelector('[data-action="random"]').dispatch('click');
  assert.equal(shortRun.a.get().session.ids.length,20);
  assert.equal(new Set(shortRun.a.get().session.ids).size,20);
  assert.equal(JSON.parse(shortRun.storage.get(key)).randomSize,20);
  const resumedShort=await runtime(shortRun.storage);
  assert.equal(resumedShort.a.get().session.ids.length,20);
  await resumedShort.a.navigate('tickets');
  assert(resumedShort.nodes.get('#main').innerHTML.includes('data-size="20" aria-pressed="true"'));
  // The global collection is a separate page; the internal control still starts only the basic bank.
  const allStorage=new Map();
  let randomValue=0;
  let full=await runtime(allStorage,{random:()=>randomValue});
  const fullState=()=>full.a.get();
  assert.equal(full.nodes.get('#main').querySelectorAll('[data-action="all"]').length,1);
  assert(full.nodes.get('#main').innerHTML.includes('<h3>Весь базовый банк</h3><p>840 вопросов · без повторов</p>'));
  assert.match(full.nodes.get('#main').innerHTML, /<h3>Все вопросы<\/h3>[\s\S]*?href="\.\/all-questions\.html"/, 'The full-ticket entry must open the global mode');
  for(const file of ['index.html','senior.html','ai-security.html','scenarios.html','all-questions.html']) {
    const html=fs.readFileSync(path.join(root,file),'utf8');
    assert.equal((html.match(/href="\.\/all-questions\.html"/g)||[]).length,1,`${file} must expose the global collection in navigation`);
    const activeGlobal=/<a class="nav-item active" href="\.\/all-questions\.html" aria-current="page">Все вопросы<\/a>/.test(html);
    assert.equal(activeGlobal,file==='all-questions.html',`${file} must identify the current bank correctly`);
  }
  const combinedPage=fs.readFileSync(path.join(root,'all-questions.html'),'utf8');
  assert(combinedPage.includes('data-bank="all-questions"'));
  assert(combinedPage.indexOf('src="./all-questions.js" defer')<combinedPage.indexOf('src="./case-trainer.js" defer'),'The aggregate loader must run before the trainer');
  assert(combinedPage.includes('src="./all-questions.js" defer'),'The global page must load its aggregate bank loader');
  full.nodes.get('#main').querySelector('[data-action="all"]').dispatch('click');
  assert.equal(fullState().session.title,'Весь базовый банк');
  const firstOrder=Array.from(fullState().session.ids);
  const firstAnswers=Array.from(fullState().session.orders.get(firstOrder[0]));
  assert.equal(firstOrder.length,840);assert.equal(new Set(firstOrder).size,840);
  assert.deepEqual([...firstOrder].sort(),data.questions.map(q=>q.id).sort(),'Whole-bank mode must include every question exactly once');
  assert.equal(fullState().session.ticket,null,'Whole-bank results must not overwrite numbered tickets');
  assert(full.nodes.get('#main').innerHTML.includes('class="quiz-map long-session"'));
  const checkedFull=choose(full.a,true);full.a.checkAnswer();
  full.a.jump(250);const pendingFull=choose(full.a,false);
  randomValue=.75;
  full=await runtime(allStorage,{random:()=>randomValue});
  assert.equal(fullState().session.index,250);
  assert.equal(fullState().total,1,'Resuming 840 questions must not score again');
  assert.deepEqual(Array.from(fullState().session.ids),firstOrder,'Resume must retain the original question order');
  assert.deepEqual(Array.from(fullState().session.orders.get(firstOrder[0])),firstAnswers);
  assert(fullState().session.recorded.has(checkedFull.id));
  assert.equal(fullState().session.answers.get(pendingFull.id),pendingFull.oi);
  full.a.jump(839);assert(full.nodes.get('#main').innerHTML.includes('Вопрос 840 / 840'));
  full.a.jump(840);assert.equal(fullState().session.index,839);
  full.a.finishSession();assert.equal(fullState().total,840);assert.equal(fullState().correctTotal,1);
  assert.equal(fullState().ticketResults.size,0);
  full.nodes.get('#main').querySelector('[data-result="retry"]').dispatch('click');
  assert.equal(fullState().session.ids.length,840);
  assert.notDeepEqual(Array.from(fullState().session.ids),firstOrder,'Retry must create a fresh shuffled question order');
  assert.notDeepEqual(Array.from(fullState().session.orders.get(firstOrder[0])),firstAnswers,'Retry must reshuffle answer options');
  assert.equal(fullState().session.answers.size,0);assert.equal(fullState().session.recorded.size,0);
  assert.equal(fullState().session.index,0);assert.equal(fullState().total,840);
  const fullExam=await runtime();fullExam.a.setMode('exam');
  fullExam.nodes.get('#main').querySelector('[data-action="all"]').dispatch('click');
  assert.equal(fullExam.a.get().session.mode,'exam');assert.equal(fullExam.a.get().session.ids.length,840);
  choose(fullExam.a,true);
  assert.equal(fullExam.a.get().total,0);assert(!fullExam.nodes.get('#main').innerHTML.includes('class="feedback'));
  assert(!fullExam.nodes.get('#main').innerHTML.includes('option correct'));
  // The tools shortcut is an actual collection, with fresh attempts and preserved resumes.
  const toolIds=data.questions.filter(q=>q.collection==='security-tools').map(q=>q.id).sort();
  const toolStorage=new Map();let toolRandom=0;
  let toolRun=await runtime(toolStorage,{random:()=>toolRandom});
  assert.equal(toolRun.nodes.get('#main').querySelectorAll('[data-action="tools"]').length,1);
  assert(toolRun.nodes.get('#main').innerHTML.includes('<h3>Инструменты ИБ</h3><p>100 вопросов'));
  toolRun.nodes.get('#main').querySelector('[data-action="tools"]').dispatch('click');
  const toolOrder=Array.from(toolRun.a.get().session.ids);
  assert.equal(toolOrder.length,100);assert.deepEqual([...toolOrder].sort(),toolIds);
  assert.equal(toolRun.a.get().session.ticket,null);
  const toolAnswerOrder=Array.from(toolRun.a.get().session.orders.get(toolOrder[0]));
  choose(toolRun.a,true);toolRun.a.checkAnswer();toolRun.a.jump(32);
  const toolPending=choose(toolRun.a,false);
  toolRandom=.73;toolRun=await runtime(toolStorage,{random:()=>toolRandom});
  assert.equal(toolRun.a.get().session.index,32);assert.equal(toolRun.a.get().total,1);
  assert.deepEqual(Array.from(toolRun.a.get().session.ids),toolOrder);
  assert.deepEqual(Array.from(toolRun.a.get().session.orders.get(toolOrder[0])),toolAnswerOrder);
  assert.equal(toolRun.a.get().session.answers.get(toolPending.id),toolPending.oi);
  toolRun.a.finishSession();assert.equal(toolRun.a.get().total,100);
  assert.equal(toolRun.a.get().ticketResults.size,0);
  toolRun.nodes.get('#main').querySelector('[data-result="retry"]').dispatch('click');
  assert.deepEqual(Array.from(toolRun.a.get().session.ids).sort(),toolIds);
  assert.notDeepEqual(Array.from(toolRun.a.get().session.ids),toolOrder);
  assert.notDeepEqual(Array.from(toolRun.a.get().session.orders.get(toolOrder[0])),toolAnswerOrder);
  const toolExam=await runtime();
  toolExam.nodes.get('#main').querySelector('[data-mode="exam"]').dispatch('click');
  toolExam.nodes.get('#main').querySelector('[data-action="tools"]').dispatch('click');
  assert.equal(toolExam.a.get().session.mode,'exam');assert.equal(toolExam.a.get().session.ids.length,100);
  choose(toolExam.a,true);assert.equal(toolExam.a.get().total,0);
  assert(!toolExam.nodes.get('#main').innerHTML.includes('class="feedback'));
  assert(!toolExam.nodes.get('#main').innerHTML.includes('option correct'));
  const ids=data.questions.slice(0,3).map(q=>q.id);
  a.startSession(ids,'Practice');
  const {id:wrongId}=choose(a,false);a.checkAnswer();
  assert.equal(state().total,1);assert.equal(state().correctTotal,0);assert(state().errors.has(wrongId));
  assert(nodes.get('#main').innerHTML.includes('Почему ваш ответ неверен'));
  a.checkAnswer();assert.equal(state().total,1,'Checking twice must not double-count');
  a.jump(1);choose(a,true);a.checkAnswer();a.finishSession();
  assert.equal(state().total,3);assert.equal(state().correctTotal,1);assert.equal(state().errors.size,2,'A skipped question must be an error');
  assert(nodes.get('#main').innerHTML.includes('Разбор всех вопросов'));
  a.startSession([wrongId],'Repeat');choose(a,true);a.checkAnswer();a.finishSession();
  assert(!state().errors.has(wrongId),'A successful retry removes the error');
  const before=state().total;
  a.setMode('exam');a.startSession(ids,'Exam');choose(a,false);
  assert.equal(state().total,before,'Exam answers are not scored before finishing');
  assert(!nodes.get('#main').innerHTML.includes('class="feedback'));
  assert(!nodes.get('#main').innerHTML.includes('option correct'));
  const {id:examId}=choose(a,true);a.finishSession();
  assert(a.isCorrect(examId),'The exam must accept a changed answer');assert.equal(state().total,before+3);
  const perfectBefore=state().correctTotal;
  a.setMode('practice');a.startSession(state().tickets[0],'Perfect ticket',0);
  for(let i=0;i<state().session.ids.length;i++){
    a.jump(i);const {id}=choose(a,true);
    assert.equal(new Set(state().session.orders.get(id)).size,4);a.checkAnswer();assert(a.isCorrect(id));
  }
  a.finishSession();assert.equal(state().correctTotal,perfectBefore+50);
  assert(nodes.get('#main').innerHTML.includes('Билет пройден'));

  // Interview and certification metadata are visible, while source links appear only after submission.
  const interview=data.questions.find(q=>q.interviewSourceIds?.length);
  assert(interview,'The bank must contain interview questions');
  a.startSession([interview.id],'Interview practice');
  assert(nodes.get('#main').innerHTML.includes('Собеседование'));
  assert(!nodes.get('#main').innerHTML.includes('class="answer-sources"'));
  choose(a,true);a.checkAnswer();
  assert(nodes.get('#main').innerHTML.includes('class="answer-sources"'));
  assert(nodes.get('#main').innerHTML.includes('Для разбора темы'));
  assert(nodes.get('#main').innerHTML.includes('Тема из открытой подборки собеседований'));
  const certQuestion=data.questions.find(q=>q.certifications?.length && q.difficulty);
  a.startSession([certQuestion.id],'Certification practice');
  assert(nodes.get('#main').innerHTML.includes('По тематике:'));
  assert(nodes.get('#main').innerHTML.includes('class="level-tag"'));
  a.setMode('exam');a.startSession([interview.id],'Interview exam');choose(a,true);
  assert(!nodes.get('#main').innerHTML.includes('class="answer-sources"'));
  a.finishSession();assert(nodes.get('#main').innerHTML.includes('class="answer-sources"'));

  // Jurisdiction and review date are visible; distinctive citation text must never leak into an unchecked question.
  for(const [jurisdiction,label] of [['RU','РФ'],['EU','ЕС · GDPR']]){
    const legalData=JSON.parse(JSON.stringify(data));
    const q=legalData.questions.filter(q=>q.legal?.jurisdiction===jurisdiction).sort((a,b)=>b.legal.references.length-a.legal.references.length)[0];
    q.legal.references.forEach((ref,i)=>{
      ref.locator=`QA legal locator ${jurisdiction} ${i}`;
      legalData.sources.find(source=>source.id===ref.sourceId).title=`QA legal source ${jurisdiction} ${i}`;
    });
    const legalStorage=new Map();
    ({a,nodes}=await runtime(legalStorage,{data:legalData}));
    const checkLegalMarkup=visible=>{
      const markup=nodes.get('#main').innerHTML;
      assert(markup.includes(`class="level-tag legal-tag">${label}</span>`));
      assert(markup.includes('<time datetime="2026-10-02">02.10.2026</time>'));
      assert.equal(markup.includes('class="answer-sources"'),visible);
      assert.equal(markup.includes('Правовые источники'),visible);
      assert.equal(markup.includes('class="legal-locator"'),visible);
      if(q.sourceIds.every(id=>legalData.sources.find(source=>source.id===id).kind==='legal'))assert(!markup.includes('Для разбора темы'));
      for(const ref of q.legal.references){
        const source=legalData.sources.find(source=>source.id===ref.sourceId);
        assert.equal(markup.includes(`href="${source.url.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}"`),visible);
        assert.equal(markup.includes(source.title),visible);
        assert.equal(markup.includes(ref.locator),visible);
      }
    };
    a.startSession([q.id],'Legal practice');checkLegalMarkup(false);
    choose(a,true);checkLegalMarkup(false);a.checkAnswer();checkLegalMarkup(true);a.finishSession();
    a.setMode('exam');a.startSession([q.id],'Legal exam');choose(a,true);a.checkAnswer();checkLegalMarkup(false);
    ({a,nodes}=await runtime(legalStorage,{data:legalData}));
    assert.equal(state().total,1,'Resuming a legal exam does not score an unchecked answer');checkLegalMarkup(false);
    a.finishSession();checkLegalMarkup(true);assert.equal(state().total,2);
  }

  // New topic buttons and the last numbered ticket use the dynamic bank, with the same existing controls.
  await a.navigate('tickets');a.startSession(a.get().tickets[11],'Сохранённый билет',11);
  assert.equal(state().session.ticket,11);assert.equal(state().session.ids.length,50);
  await a.navigate('topics');assert.equal(nodes.get('#main').querySelectorAll('[data-topic]').length,44);
  nodes.get('#main').querySelector('[data-mode="practice"]').dispatch('click');
  nodes.get('#main').querySelector(`[data-topic="${data.topics.indexOf('Персональные данные РФ')}"]`).dispatch('click');
  nodes.get('#dialog-ok').dispatch('click');await new Promise(resolve=>setImmediate(resolve));
  assert.equal(state().session.mode,'practice');assert.equal(state().session.ids.length,30);
  assert(state().session.ids.every(id=>state().bank.get(id).topic==='Персональные данные РФ'));

  // Reject malformed legal context and references before making the bank available.
  const ordinarySource=data.sources.find(source=>source.kind!=='legal');
  for(const [reason,mutate] of [
    ['missing legal context',q=>{q.legal=null;}],
    ['unknown jurisdiction',q=>{q.legal.jurisdiction='US';}],
    ['non-ISO review date',q=>{q.legal.reviewedAt='02.10.2026';}],
    ['impossible review date',q=>{q.legal.reviewedAt='2026-02-30';}],
    ['empty legal references',q=>{q.legal.references=[];}],
    ['unknown legal source',q=>{q.legal.references[0].sourceId='law-missing';}],
    ['reference absent from sourceIds',q=>{q.sourceIds=q.sourceIds.filter(id=>id!==q.legal.references[0].sourceId);q.sourceIds.push(ordinarySource.id);}],
    ['non-legal source',q=>{q.legal.references[0].sourceId=ordinarySource.id;q.sourceIds.push(ordinarySource.id);}],
    ['empty legal locator',q=>{q.legal.references[0].locator='  ';}]
  ]){
    const invalidData=JSON.parse(JSON.stringify(data));mutate(invalidData.questions.find(q=>q.legal));
    await runtime(new Map(),{data:invalidData,expectLoadFailure:reason});
  }

  // Simulate closing and reopening the page with the same browser storage.
  const storage=new Map();
  ({a,nodes}=await runtime(storage));state=()=>a.get();
  a.startSession(state().tickets[0],'Saved practice',0);
  const checked=choose(a,false);a.checkAnswer();
  const order=Array.from(state().session.orders.get(checked.id));
  a.jump(1);const unchecked=choose(a,true);
  ({a,nodes}=await runtime(storage));
  assert.equal(state().session.index,1);assert.equal(state().total,1);
  assert.equal(state().session.answers.get(unchecked.id),unchecked.oi);
  assert(state().session.recorded.has(checked.id));assert(state().errors.has(checked.id));
  assert.deepEqual(Array.from(state().session.orders.get(checked.id)),order,'Answer order must survive reload');
  assert(!state().session.recorded.has(unchecked.id),'An unchecked choice stays unchecked');
  a.jump(0);choose(a,true);a.checkAnswer();
  assert.equal(state().total,1,'Previously checked answers remain locked after reload');
  assert.equal(state().session.answers.get(checked.id),checked.oi);
  await a.navigate('topics');
  assert(!state().sessionOpen);assert(nodes.get('#main').innerHTML.includes('Продолжить билет'));
  ({a,nodes}=await runtime(storage));
  assert.equal(state().page,'topics');assert(!state().sessionOpen);
  assert(nodes.get('#main').innerHTML.includes('Продолжить билет'),'Paused ticket stays available');

  // Replacing a paused ticket requires the user's explicit choice in the UI.
  const oldTitle=state().session.title;
  let pending=a.requestStartSession(ids,'Replacement');nodes.get('#dialog-cancel').dispatch('click');await pending;
  assert.equal(state().session.title,oldTitle);
  pending=a.requestStartSession(ids,'Replacement');nodes.get('#dialog-ok').dispatch('click');await pending;
  assert.equal(state().session.title,'Replacement');assert.equal(state().total,1);

  // Completed results and mistake correction persist without scoring again.
  a.startSession(state().tickets[1],'Saved result',1);choose(a,true);a.checkAnswer();a.finishSession();
  const completedTotal=state().total;
  ({a,nodes}=await runtime(storage));
  assert(state().session.finished);assert.equal(state().total,completedTotal);
  assert.equal(state().ticketResults.get(1).correct,1);assert(nodes.get('#main').innerHTML.includes('Разбор всех вопросов'));
  const mistake=[...state().errors][0];a.startSession([mistake],'Fix saved error');choose(a,true);a.checkAnswer();a.finishSession();
  ({a,nodes}=await runtime(storage));assert(!state().errors.has(mistake));

  // An exam resumes without leaking correctness or submitting choices.
  const examStorage=new Map();
  ({a,nodes}=await runtime(examStorage));a.setMode('exam');a.startSession(ids,'Saved exam');
  const first=choose(a,false);a.jump(1);choose(a,true);
  ({a,nodes}=await runtime(examStorage));
  assert.equal(state().session.mode,'exam');assert.equal(state().session.index,1);assert.equal(state().total,0);
  assert.equal(state().session.answers.get(first.id),first.oi);
  assert(!nodes.get('#main').innerHTML.includes('class="feedback'));assert(!nodes.get('#main').innerHTML.includes('option correct'));
  a.jump(0);choose(a,true);a.finishSession();assert.equal(state().correctTotal,2);
  ({a,nodes}=await runtime(examStorage));assert.equal(state().total,3,'Reopening a finished exam must not resubmit');

  // Reset cancellation preserves progress; confirmation persists an empty state.
  pending=a.resetProgress();nodes.get('#dialog-cancel').dispatch('click');await pending;assert.equal(state().total,3);
  pending=a.resetProgress();nodes.get('#dialog-ok').dispatch('click');await pending;
  ({a,nodes}=await runtime(examStorage));
  assert.equal(state().total,0);assert.equal(state().errors.size,0);assert.equal(state().ticketResults.size,0);assert.equal(state().session,null);

  // Bad or stale data must not prevent use of the trainer.
  for(const saved of ['{broken',JSON.stringify({version:1,total:10,correctTotal:99,session:{ids:['missing']}})]){
    ({a,nodes}=await runtime(new Map([[key,saved]])));assert.equal(state().total,0);assert.equal(state().session,null);
  }
  ({a,nodes}=await runtime(new Map(),{blocked:true}));
  a.startSession(ids,'Storage unavailable');choose(a,true);a.checkAnswer();
  assert.equal(state().correctTotal,1);assert(!state().storageAvailable);assert(nodes.get('#storage-status').textContent.includes('не разрешает'));
  const beforeUpdate=JSON.parse(storage.get(key));
  const changedData=JSON.parse(JSON.stringify(data));changedData.questions[0].question+=' (updated)';
  ({a,nodes}=await runtime(storage,{data:changedData}));
  assert.equal(state().session,null,'A changed bank must not restore potentially stale answers');assert.equal(state().ticketResults.size,0);
  assert.equal(state().total,beforeUpdate.total,'Aggregate history remains available after a bank update');
  assert.equal(state().correctTotal,beforeUpdate.correctTotal);
  assert.deepEqual([...state().errors].sort(),beforeUpdate.errors.sort());
  assert(nodes.get('#main').innerHTML.includes('Банк вопросов обновлён'));
  ({a,nodes}=await runtime(storage,{data:changedData}));
  assert(!nodes.get('#main').innerHTML.includes('Банк вопросов обновлён'),'The update notice is not repeated on later visits');

  // Version 1 storage from the original 88-question trainer retains history, never its 20-question session.
  const legacyIds=['q001','q006','q011','q016','q023','q028','q033','q038','q043','q048','q056','q064','q070','q079','q002','q007','q012','q017','q024','q029'];
  const legacy={version:1,bankSignature:'f103401f',total:31,correctTotal:22,page:'topics',mode:'exam',errors:['q001','removed-question'],ticketResults:[[0,{correct:20,length:20}]],sessionOpen:true,
    session:{title:'Билет 1',ticket:0,mode:'practice',ids:legacyIds,index:1,finished:false,answers:[['q001',0]],orders:legacyIds.map(id=>[id,[0,1,2,3]]),recorded:['q001']}};
  const legacyStorage=new Map([[key,JSON.stringify(legacy)]]);
  ({a,nodes}=await runtime(legacyStorage));
  assert.equal(state().total,31);assert.equal(state().correctTotal,22);
  assert.deepEqual([...state().errors],['q001']);assert.equal(state().session,null);assert.equal(state().ticketResults.size,0);
  assert.equal(state().page,'topics');assert.equal(state().mode,'exam');
  assert(!nodes.get('#main').innerHTML.includes('Продолжить билет'));
  assert(nodes.get('#main').innerHTML.includes('Банк вопросов обновлён'));
  a.startSession(state().tickets[0],'New ticket',0);assert.equal(state().session.ids.length,50);
  choose(a,true);a.finishSession();
  assert.equal(state().total,81);assert.equal(state().correctTotal,23,'Only the new ticket is scored');
  assert.equal(state().ticketResults.get(0).length,50);

  // Bank growth from 400/500 questions and a layout-only change from 20 to 50 retain aggregates and mistake IDs.
  const previousData={...data,questions:data.questions.filter(q=>Number(q.id.slice(1))<=400)};
  previousData.topics=data.topics.filter(topic=>previousData.questions.some(q=>q.topic===topic));
  assert.equal(previousData.questions.length,400);assert.equal(previousData.topics.length,22);
  const previous500={...data,questions:data.questions.filter(q=>Number(q.id.slice(1))<=500)};
  previous500.topics=data.topics.filter(topic=>previous500.questions.some(q=>q.topic===topic));
  assert.equal(previous500.questions.length,500);assert.equal(previous500.topics.length,26);
  const previous600={...data,questions:data.questions.filter(q=>Number(q.id.slice(1))<=600)};
  previous600.topics=data.topics.filter(topic=>previous600.questions.some(q=>q.topic===topic));
  assert.equal(previous600.questions.length,600);assert.equal(previous600.topics.length,36);
  const previous740={...data,questions:data.questions.filter(q=>Number(q.id.slice(1))<=740)};
  previous740.topics=data.topics.filter(topic=>previous740.questions.some(q=>q.topic===topic));
  assert.equal(previous740.questions.length,740);assert.equal(previous740.topics.length,40);
  for(const [priorData,ticketSize] of [[previous740,50],[previous600,50],[previous500,50],[previousData,50],[previousData,20],[data,20]]){
    const migrationStorage=new Map();
    ({a,nodes}=await runtime(migrationStorage,{data:priorData,ticketSize}));
    a.startSession(state().tickets[0],'Old completed ticket',0);choose(a,true);a.checkAnswer();a.finishSession();
    a.startSession(state().tickets[1],'Old pending ticket',1);choose(a,false);
    const beforeMigration=JSON.parse(migrationStorage.get(key));
    ({a,nodes}=await runtime(migrationStorage));
    assert.equal(state().session,null);assert.equal(state().ticketResults.size,0);
    assert.equal(state().total,ticketSize);assert.equal(state().correctTotal,1);
    assert.deepEqual([...state().errors].sort(),beforeMigration.errors.sort(),'Mistake IDs survive bank and ticket-layout changes');
    assert(nodes.get('#main').innerHTML.includes('Банк вопросов обновлён'));
  }
  console.log('PASS: 840 questions, legacy ticket capacity 16 × 50 + 40, 44 balanced topics, OSI 2–3 per ticket, dynamic controls, tools collection shuffle/resume/exam, random ticket, validated legal metadata, legal sources only after checking/completion, training, exam secrecy, scoring, mistakes, reload/resume, answer order, completed results, reset, corrupt/unavailable storage, migrations from 88/400/500/600/740 questions and 20/50-question tickets.');
})().catch(error=>{console.error(error);process.exitCode=1;});

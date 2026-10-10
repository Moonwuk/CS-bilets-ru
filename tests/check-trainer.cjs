'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const key='cs-bilets-ru.progress.v1';
const fixtureRoot=require('node:path').resolve(__dirname,'..');
const realBank=require('./compliance-fixtures.cjs').composed();
const source=fs.readFileSync('app.js','utf8');
const plain=value=>JSON.parse(JSON.stringify(value));
const clone=value=>structuredClone(value);
const correctIndex=(data,id)=>data.questions.find(q=>q.id===id).options.findIndex(o=>o.correct);
const wrongIndex=(data,id)=>data.questions.find(q=>q.id===id).options.findIndex(o=>!o.correct);
const specialText='Keep  two  spaces,\r\nthen\ta tab and </script><img src=x onerror=alert(1)> & "quotes" intact.';
const fixture={source:'fixture.docx',topics:['Fixture'],questions:Array.from({length:4},(_,i)=>({
  id:`f${i}`,topic:'Fixture',question:`Question ${i}?`,
  options:[0,1,2,3].map(j=>({text:`Option ${j}`,correct:j===0,explanation:i===0&&j===0?specialText:`Explanation ${i}.${j}`}))
}))};
class Element {
  constructor(selector){this.selector=selector;this._html='';this.textContent='';this.style={};this.dataset={};this.open=false;this.disabled=false;this.attributes={};this.listeners=new Map();this.children=new Map();this.focused=false;}
  set innerHTML(value){this._html=value;this.children.clear();}
  get innerHTML(){return this._html;}
  addEventListener(name,fn){if(!this.listeners.has(name))this.listeners.set(name,new Set());this.listeners.get(name).add(fn);}
  removeEventListener(name,fn){this.listeners.get(name)?.delete(fn);}
  dispatch(name,event={}){const actual={target:this,preventDefault(){this.prevented=true;},...event};for(const fn of [...(this.listeners.get(name)||[])])fn(actual);return actual;}
  querySelector(selector){if(!this.children.has(selector))this.children.set(selector,new Element(selector));return this.children.get(selector);}
  querySelectorAll(){return [];}
  focus(){this.focused=true;}
  showModal(){assert(!this.open,'Dialog was already open');this.open=true;}
  close(){this.open=false;}
  setAttribute(name,value){this.attributes[name]=value;}
  removeAttribute(name){delete this.attributes[name];}
  matches(selector){return selector==='.option-pick'&&this.selector.startsWith('[data-option');}
}
function runtime(data,{storage=new Map(),storageBlocked=false}={}){
  const nodes=new Map();
  const get=selector=>{if(!nodes.has(selector))nodes.set(selector,new Element(selector));return nodes.get(selector);};
  const documentListeners=new Map();
  const context={
    console:{error(){}},
    document:{body:{tagName:'BODY'},querySelector:get,querySelectorAll(){return [];},addEventListener(name,fn){documentListeners.set(name,fn);}},
    window:{scrollTo(){},TrainerTerms:{markup:value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),isOpen:()=>false},localStorage:{getItem(k){if(storageBlocked)throw Error('denied');return storage.get(k)||null;},setItem(k,v){if(storageBlocked)throw Error('denied');storage.set(k,v);}}},
    fetch:async()=>({ok:true,json:async()=>data}),Set,Map,URL,Math
  };
  // Mode tests use composed fixtures; the actual loader and failure paths are tested separately.
  context.window.TrainerBasicBank={load:async()=>data};
  const exposed=`  window.__test={load,getBankSignature,startSession,selectAnswer,checkAnswer,jump,finishSession,requestFinish,requestStartSession,navigate,resetProgress,saveProgress,restoreProgress,recordAnswer,isCorrect,renderHome,renderQuiz,renderResult,setMode:value=>mode=value,getState:()=>({dataset,total,correctTotal,page,mode,randomSize,errors:[...errors],ticketResults:[...ticketResults],tickets,bankSignature,bankUpdateNotice,storageAvailable,sessionOpen,session:session?{...session,answers:[...session.answers],orders:[...session.orders],recorded:[...session.recorded]}:null})};\n})();`;
  const instrumented=source.replace(/  load\(\);\n\}\)\(\);\s*$/,exposed);
  assert.notEqual(instrumented,source,'Could not expose trainer test interface');
  vm.createContext(context);vm.runInContext(instrumented,context);
  return {a:context.window.__test,nodes,storage,getHtml:()=>get('#main').innerHTML,getState:()=>plain(context.window.__test.getState()),documentListeners,context};
}
async function main(){
  assert.equal(realBank.questions.length,955);
  assert.equal(new Set(realBank.questions.map(q=>q.id)).size,955);
  assert.equal(realBank.topics.length,45);
  assert(!/onclick=|\.onchange=/.test(fs.readFileSync('index.html','utf8')));
  for(const selector of ['main','reset-progress','storage-status','sidebar-storage-status','confirm-dialog','dialog-cancel','dialog-ok'])assert(fs.readFileSync('index.html','utf8').includes(`id="${selector}"`));
  assert(fs.readFileSync('style.css','utf8').includes('white-space:pre-wrap'),'Question/answer whitespace must remain visible');
  const full=runtime(realBank);await full.a.load();
  let state=full.getState();
  const expectedTicketLengths=Array.from({length:Math.ceil(realBank.questions.length/50)},(_,i)=>Math.min(50,realBank.questions.length-i*50));
  assert.deepEqual(state.tickets.map(t=>t.length),expectedTicketLengths);
  assert.equal(state.tickets.flat().length,realBank.questions.length);
  assert.equal(new Set(state.tickets.flat()).size,realBank.questions.length);
  assert.deepEqual([...state.tickets.flat()].sort(),realBank.questions.map(q=>q.id).sort());
  assert.equal(full.nodes.get('#ticket-count').textContent,expectedTicketLengths.length);
  assert.equal(full.nodes.get('#topic-count').textContent,realBank.topics.length);
  assert.equal(full.nodes.get('#dataset-info').textContent,`${realBank.questions.length} вопросов · ${realBank.topics.length} тем`);
  // A deliberately smaller valid bank checks that labels are derived from data.
  const smallerTopics=clone(realBank);
  smallerTopics.topics=smallerTopics.topics.slice(0,24);
  smallerTopics.questions=smallerTopics.questions.filter(q=>smallerTopics.topics.includes(q.topic));
  const smallerHeader=runtime(smallerTopics);await smallerHeader.a.load();
  assert.equal(smallerHeader.nodes.get('#topic-count').textContent,24);
  assert(smallerHeader.nodes.get('#dataset-info').textContent.endsWith(' · 24 темы'));
  for(const topic of realBank.topics){
    const sizes=state.tickets.map(t=>t.filter(id=>realBank.questions.find(q=>q.id===id).topic===topic).length);
    const fullSizes=sizes.filter((_,i)=>state.tickets[i].length===50);
    assert(Math.max(...fullSizes)-Math.min(...fullSizes)<=1,`Uneven distribution: ${topic}`);
  }
  assert.equal(full.getState().dataset.questions[0].options.length,4);
  assert(full.getHtml().includes('data-action="random"'));
  assert(full.getHtml().includes('data-size="20"')&&full.getHtml().includes('data-size="50"'));
  assert(!full.getHtml().includes('data-ticket='));
  assert(full.getHtml().includes('data-action="all"'));
  assert(full.getHtml().includes('Весь базовый банк'));
  assert(full.getHtml().includes('href="./all-questions.html"'));
  assert(full.getHtml().includes('Сеньор — отдельно'));
  assert(full.getHtml().includes(`>${realBank.questions.length} вопросов · без повторов<`));
  assert.equal(realBank.questions.filter(q=>q.origin==='document').length,88);
  assert.equal(realBank.questions.filter(q=>q.origin==='authored').length,realBank.questions.length-88);
  assert(full.getHtml().includes('В исходных вопросах уточнены найденные неточности.'));
  assert(full.getHtml().includes('50 вопросов'));
  assert(full.getHtml().includes('О вопросах и источниках'));
  assert(full.getHtml().includes('не официальный экзамен'));
  assert(full.getHtml().includes('Нормы проверены по состоянию на 02.10.2026, 10.10.2026'));
  assert(!full.getHtml().includes('режимов права ЕС'));
  full.a.startSession([...full.getState().tickets[1]],'Билет 2',1);
  state=full.getState();
  assert.equal(state.session.ids.length,50);
  assert.equal(new Set(state.session.ids).size,50);
  assert.deepEqual([...state.session.ids].sort(),[...state.tickets[1]].sort());
  assert(state.session.orders.every(([,order])=>new Set(order).size===4&&order.every(n=>[0,1,2,3].includes(n))));
  assert.equal(full.getState().randomSize,50);
  assert(full.getHtml().includes('Вопрос 1 / 50'));
  assert(!full.getHtml().includes('quiz-map long-session'));
  full.a.startSession(realBank.questions.map(q=>q.id),'Весь базовый банк');
  const firstAll=full.getState().session;
  assert.equal(firstAll.ids.length,realBank.questions.length);
  assert.equal(new Set(firstAll.ids).size,realBank.questions.length);
  assert.deepEqual([...firstAll.ids].sort(),realBank.questions.map(q=>q.id).sort());
  assert(full.getHtml().includes('quiz-map long-session'));
  assert(full.getHtml().includes(`Вопрос 1 / ${realBank.questions.length}`));
  assert.equal((full.getHtml().match(/data-jump="/g)||[]).length,realBank.questions.length);
  for(let i=0;i<5;i++){
    full.a.startSession(realBank.questions.map(q=>q.id),'Весь базовый банк');
    const nextAll=full.getState().session;
    assert.notDeepEqual(nextAll.ids,firstAll.ids);
    assert.notDeepEqual(nextAll.orders,firstAll.orders);
  }
  const allActive=full.getState().session;
  full.a.selectAnswer(correctIndex(realBank,allActive.ids[0]));full.a.checkAnswer();full.a.jump(137);
  const allSnapshot=full.getState().session;
  const resumedAll=runtime(realBank,{storage:full.storage});await resumedAll.a.load();
  assert.deepEqual(resumedAll.getState().session,allSnapshot);
  assert.equal(resumedAll.getState().session.ids.length,realBank.questions.length);
  assert.equal(resumedAll.getState().session.index,137);
  assert(resumedAll.getHtml().includes(`Вопрос 138 / ${realBank.questions.length}`));
  assert(fs.readFileSync('style.css','utf8').includes('.quiz-map.long-session .question-grid{max-height:260px;overflow-y:auto'));
  assert(fs.readFileSync('style.css','utf8').includes('.quiz-map.long-session .question-grid{max-height:148px}'));
  assert(realBank.questions.filter(q=>q.origin==='authored').every(q=>q.difficulty&&q.sourceIds?.length&&q.options.length===4&&q.options.filter(o=>o.correct).length===1&&q.options.every(o=>o.explanation)));
  const sources=new Map(realBank.sources.map(s=>[s.id,s]));
  assert.equal(sources.size,realBank.sources.length);
  for(const q of realBank.questions)for(const id of q.sourceIds||[])assert(sources.has(id),`${q.id}: missing source ${id}`);
  assert.equal(realBank.questions.filter(q=>q.topic==='Модель OSI').length,41);
  const interviewQuestions=realBank.questions.filter(q=>q.interviewSourceIds?.length);
  assert(interviewQuestions.length>=50);
  for(const q of interviewQuestions)for(const id of q.interviewSourceIds)assert.equal(sources.get(id)?.kind,'interview');
  assert.equal(realBank.interviewCollections.length,9);
  assert(new Set(interviewQuestions.map(q=>q.topic)).size>=8);
  const legalQuestions=realBank.questions.filter(q=>q.legal);
  assert.equal(legalQuestions.length,217);
  assert.equal(legalQuestions.filter(q=>q.legal.jurisdiction==='EU').length,25);
  const newLegal=realBank.questions.filter(q=>/^q4\d\d$/.test(q.id)||q.id==='q500');
  assert.equal(newLegal.length,100);
  assert.equal(newLegal.filter(q=>q.legal.jurisdiction==='RU').length,75);
  assert.equal(newLegal.filter(q=>q.legal.jurisdiction==='EU').length,25);
  for(const q of newLegal){
    assert(['RU','EU'].includes(q.legal.jurisdiction));
    assert.equal(q.legal.reviewedAt,['q416','q425','q449'].includes(q.id)?'2026-10-10':'2026-10-02');
    assert(q.legal.references.length>0);
    for(const ref of q.legal.references){assert.equal(sources.get(ref.sourceId)?.kind,'legal');assert(q.sourceIds.includes(ref.sourceId));assert(ref.locator.trim().length>4);}
    assert(q.options.every(o=>o.explanation.trim().length>=25));
  }
  const pd=newLegal.filter(q=>Number(q.id.slice(1))>=401&&Number(q.id.slice(1))<=430);
  assert.equal(pd.length,30);
  assert(pd.every(q=>q.legal.jurisdiction==='RU'&&q.topic===(['q416','q425'].includes(q.id)?'Комплаенс РФ':'Персональные данные РФ')));
  assert(newLegal.filter(q=>Number(q.id.slice(1))>=431&&Number(q.id.slice(1))<=455).every(q=>q.topic===(q.id==='q449'?'Комплаенс РФ':'Правовые основы ИБ РФ')));
  assert(newLegal.filter(q=>Number(q.id.slice(1))>=456&&Number(q.id.slice(1))<=475).every(q=>q.topic==='КИИ и ответственность в ИБ'));
  assert(newLegal.filter(q=>Number(q.id.slice(1))>=476).every(q=>q.topic==='GDPR и защита данных в ЕС'));
  assert(fs.existsSync('docs/legal-bank-review.md'));
  assert(fs.readFileSync('README.md','utf8').includes('docs/legal-bank-review.md'));
  const byId=new Map(realBank.questions.map(q=>[q.id,q]));
  const rightText=id=>byId.get(id).options.find(o=>o.correct).text;
  const description=id=>[byId.get(id).question,...byId.get(id).options.map(o=>o.explanation)].join(' ');
  assert(/24/.test(rightText('q430'))&&/72/.test(rightText('q430')));
  assert(/10/.test(rightText('q425'))&&/5/.test(rightText('q425')));
  assert(/самостоятельно/.test(rightText('q435')));
  assert(/псевдоним/.test(description('q479'))&&!/прекратилось/.test(rightText('q479')));
  assert(/только дата. не гарантирует соблюдение/i.test(description('q483')));
  assert(/вредонос/.test(description('q471'))&&/заведом/.test(description('q471')));
  assert(!/миллион|сто тысяч/.test(description('q472')));
  assert(/уничтож|блокир|модифик|копир/.test(rightText('q473')));
  assert.equal(rightText('q051'),'Защита информации в ГИС и иных информационных системах госорганов, ГУП и государственных учреждений');
  assert(/не каждая/.test(byId.get('q058').options.find(o=>o.correct).explanation.toLowerCase()));
  assert(byId.get('q146').question.includes('без HTTPS-инспекции'));
  assert(byId.get('q316').question.includes('TTL'));
  assert(byId.get('q327').question.includes('checksum offload'));
  assert(byId.get('q354').question.includes('Content-Length'));
  assert(byId.get('q357').options.find(o=>o.correct).text.includes('не даёт скрипту прочитать'));
  assert(byId.get('q310').question.includes('коммутатор'));
  const tools=realBank.questions.filter(q=>q.collection==='security-tools');
  assert.equal(tools.length,100);
  assert.equal(new Set(tools.map(q=>q.id)).size,100);
  assert(new Set(tools.map(q=>q.topic)).size>=11);
  for(const q of tools){
    assert(q.origin==='authored'&&q.difficulty&&q.sourceIds?.length&&q.conceptIds?.length);
    assert(q.options.every(o=>o.text&&typeof o.correct==='boolean'&&o.explanation.length>20));
    assert.equal(q.options.filter(o=>o.correct).length,1);
    // Reused q566 retains technical sources and additionally has the legal references of its module.
    const expectedKinds=q.compliance?['technical','legal']:['technical'];
    for(const sourceId of q.sourceIds)assert(expectedKinds.includes(sources.get(sourceId)?.kind));
    assert(q.sourceIds.some(sourceId=>sources.get(sourceId)?.kind==='technical'));
  }
  const conceptsContext={window:{},document:{querySelector:()=>null}};
  const conceptsSource=fs.readFileSync('glossary.js','utf8').replace('  const termsById = new Map(terms.map(term => [term.id, term]));','  window.__terms = terms;\n  const termsById = new Map(terms.map(term => [term.id, term]));');
  vm.createContext(conceptsContext);vm.runInContext(conceptsSource,conceptsContext);
  const termIds=new Set(conceptsContext.window.__terms.map(term=>term.id));
  assert(termIds.size>=200);
  for(const q of tools)for(const concept of q.conceptIds)assert(termIds.has(concept),`${q.id}: no glossary entry for ${concept}`);
  for(const file of ['senior-questions.json','ai-security-questions.json','scenarios-questions.json']){
    const caseBank=JSON.parse(fs.readFileSync(file,'utf8'));
    for(const q of caseBank.questions)for(const concept of q.conceptIds||[])assert(termIds.has(concept));
  }
  assert(fs.existsSync('docs/tools-bank-review.md'));
  assert(fs.readFileSync('README.md','utf8').includes('docs/tools-bank-review.md'));
  const toolRun=runtime(realBank);await toolRun.a.load();
  assert(toolRun.getHtml().includes('data-action="tools"'));
  assert(toolRun.getHtml().includes('100 вопросов · назначение и ограничения'));
  toolRun.a.startSession(tools.map(q=>q.id),'Инструменты ИБ');
  const firstTools=toolRun.getState().session;
  assert.equal(firstTools.ids.length,100);
  assert.deepEqual([...firstTools.ids].sort(),tools.map(q=>q.id).sort());
  assert(toolRun.getHtml().includes('quiz-map long-session'));
  toolRun.a.startSession(tools.map(q=>q.id),'Инструменты ИБ');
  assert.notDeepEqual(toolRun.getState().session.ids,firstTools.ids);
  assert.notDeepEqual(toolRun.getState().session.orders,firstTools.orders);
  const secondTools=toolRun.getState().session;
  toolRun.a.selectAnswer(wrongIndex(realBank,secondTools.ids[0]));toolRun.a.checkAnswer();toolRun.a.jump(1);
  const toolsResume=runtime(realBank,{storage:toolRun.storage});await toolsResume.a.load();
  assert.deepEqual(toolsResume.getState().session,toolRun.getState().session);
  assert(toolsResume.getState().errors.includes(secondTools.ids[0]));
  const sourceRun=runtime(realBank);await sourceRun.a.load();
  sourceRun.a.startSession(['q089'],'Свойства безопасности');
  assert(sourceRun.getHtml().includes('Базовый'));
  assert(!sourceRun.getHtml().includes('csrc.nist.gov/glossary/term/confidentiality'));
  sourceRun.a.selectAnswer(correctIndex(realBank,'q089'));sourceRun.a.checkAnswer();
  assert(sourceRun.getHtml().includes('https://csrc.nist.gov/glossary/term/confidentiality'));
  assert(sourceRun.getHtml().includes('target="_blank" rel="noopener noreferrer"'));
  const interviewRun=runtime(realBank);await interviewRun.a.load();
  interviewRun.a.startSession(['q354'],'Собеседование');
  assert(interviewRun.getHtml().includes('<span class="level-tag">Собеседование</span>'));
  assert(!interviewRun.getHtml().includes('https://tib3rius.com/interview-questions.html'));
  interviewRun.a.selectAnswer(correctIndex(realBank,'q354'));interviewRun.a.checkAnswer();
  assert(interviewRun.getHtml().includes('https://tib3rius.com/interview-questions.html'));
  assert(interviewRun.getHtml().includes('Тема из открытой подборки собеседований'));
  const legalRun=runtime(realBank);await legalRun.a.load();
  legalRun.a.setMode('exam');legalRun.a.startSession(['q483'],'Правовой вопрос');
  assert(legalRun.getHtml().includes('ЕС · GDPR'));
  assert(legalRun.getHtml().includes('<time datetime="2026-10-02">02.10.2026</time>'));
  assert(!legalRun.getHtml().includes('Article 5'));
  const legalSource=sources.get(byId.get('q483').sourceIds[0]);
  assert(!legalRun.getHtml().includes(legalSource.url));
  legalRun.a.selectAnswer(correctIndex(realBank,'q483'));
  assert(!legalRun.getHtml().includes('Правовые источники'));
  legalRun.a.finishSession();
  assert(legalRun.getHtml().includes('Правовые источники'));
  assert(legalRun.getHtml().includes(legalSource.url));
  assert(legalRun.getHtml().includes('ст. 5(1)(c)'));
  const scopedLegal=runtime(realBank);await scopedLegal.a.load();
  scopedLegal.a.setMode('practice');scopedLegal.a.startSession(['q430'],'Уведомление Роскомнадзора');
  assert(scopedLegal.getHtml().includes('РФ')&&!scopedLegal.getHtml().includes('ст. 21 ч. 3.1'));
  scopedLegal.a.selectAnswer(correctIndex(realBank,'q430'));scopedLegal.a.checkAnswer();
  assert(scopedLegal.getHtml().includes('ст. 21 ч. 3.1'));
  const invalidLegalBank=clone(realBank);delete invalidLegalBank.questions.find(q=>q.id==='q483').legal;
  const invalidLegal=runtime(invalidLegalBank);await invalidLegal.a.load();
  assert(invalidLegal.getHtml().includes('Не удалось загрузить вопросы'));
  for(const mutate of [q=>q.legal.jurisdiction='WORLD',q=>q.legal.reviewedAt='2026-02-30',q=>q.legal.references=[],q=>q.legal.references[0].locator=' ',q=>q.legal.references[0].sourceId='missing-law']){
    const invalid=clone(realBank);mutate(invalid.questions.find(q=>q.id==='q483'));
    const checked=runtime(invalid);await checked.a.load();assert(checked.getHtml().includes('Не удалось загрузить вопросы'));
  }
  // Exact option indexes, whitespace, escaping and idempotent scoring.
  let run=runtime(fixture);await run.a.load();run.a.startSession(['f0'],'One');
  run.a.selectAnswer(0);run.a.checkAnswer();state=run.getState();
  assert.equal(state.total,1);assert.equal(state.correctTotal,1);assert.deepEqual(state.errors,[]);
  assert.deepEqual(state.session.answers,[['f0',0]]);assert.deepEqual(state.session.recorded,['f0']);
  const html=run.getHtml();
  assert(html.includes('Keep  two  spaces,\r\nthen\ta tab'));
  assert(html.includes('&lt;/script&gt;&lt;img src=x onerror=alert(1)&gt; &amp; &quot;quotes&quot;'));
  assert(!html.includes('<img src=x onerror=alert(1)>'));
  run.a.checkAnswer();run.a.selectAnswer(1);run.a.checkAnswer();assert.equal(run.getState().total,1);
  assert.equal(run.getState().session.answers[0][1],0);
  run.a.finishSession();run.a.finishSession();assert.equal(run.getState().total,1);
  assert.equal(run.getState().session.finished,true);
  assert(run.getHtml().includes('Разбор всех вопросов'));
  assert(run.getHtml().includes('Keep  two  spaces,\r\nthen\ta tab'));
  run=runtime(fixture);await run.a.load();run.a.startSession(['f0','f1','f2','f3'],'Four');
  let ids=run.getState().session.ids;
  run.a.selectAnswer(wrongIndex(fixture,ids[0]));run.a.checkAnswer();
  run.a.jump(1);run.a.selectAnswer(correctIndex(fixture,ids[1]));run.a.checkAnswer();
  run.a.jump(2);run.a.selectAnswer(correctIndex(fixture,ids[2]));run.a.finishSession();state=run.getState();
  assert.equal(state.total,4);assert.equal(state.correctTotal,1);
  assert.deepEqual([...state.errors].sort(),[ids[0],ids[2],ids[3]].sort());
  assert(!state.session.answers.some(([id])=>id===ids[2]));assert(run.getHtml().includes('из них 2 без ответа'));
  const originalErrors=[...state.errors];run.a.startSession(originalErrors,'Работа над ошибками');ids=run.getState().session.ids;
  run.a.selectAnswer(correctIndex(fixture,ids[0]));run.a.checkAnswer();
  assert(!run.getState().errors.includes(ids[0]));assert.equal(run.getState().total,5);assert.equal(run.getState().correctTotal,2);
  assert(originalErrors.filter(id=>id!==ids[0]).every(id=>run.getState().errors.includes(id)));
  const persisted=run.storage;const before=run.getState();
  const fresh=runtime(fixture,{storage:persisted});await fresh.a.load();const after=fresh.getState();
  for(const property of ['total','correctTotal','errors','sessionOpen','page','mode','session'])assert.deepEqual(after[property],before[property]);
  fresh.a.checkAnswer();assert.equal(fresh.getState().total,5);
  fresh.a.jump(1);fresh.a.selectAnswer(correctIndex(fixture,fresh.getState().session.ids[1]));fresh.a.checkAnswer();assert.equal(fresh.getState().total,6);
  await fresh.a.navigate('topics');assert.equal(fresh.getState().sessionOpen,false);assert(fresh.getHtml().includes('Продолжить билет'));
  const paused=runtime(fixture,{storage:persisted});await paused.a.load();
  assert.equal(paused.getState().sessionOpen,false);assert.equal(paused.getState().page,'topics');
  assert(paused.getHtml().includes('Продолжить билет'));assert(!paused.getHtml().includes('question-panel'));
  // Exam choices remain editable; answers and sources stay hidden until finish.
  run=runtime(fixture);await run.a.load();run.a.setMode('exam');run.a.startSession(['f0','f1','f2'],'Экзамен');ids=run.getState().session.ids;
  const question=fixture.questions.find(q=>q.id===ids[0]);
  run.a.selectAnswer(1);run.a.selectAnswer(0);run.a.checkAnswer();
  assert.equal(run.getState().total,0);assert.equal(run.getState().session.answers[0][1],0);
  assert(!run.getHtml().includes('class="feedback'));assert(!run.getHtml().includes('option correct'));assert(!run.getHtml().includes('option wrong'));
  assert(!run.getHtml().includes(question.options[0].explanation));
  const resumedExam=runtime(fixture,{storage:run.storage});await resumedExam.a.load();
  assert.equal(resumedExam.getState().total,0);assert.equal(resumedExam.getState().session.mode,'exam');assert(!resumedExam.getHtml().includes('class="feedback'));
  resumedExam.a.jump(1);resumedExam.a.selectAnswer(1);resumedExam.a.finishSession();state=resumedExam.getState();
  assert.equal(state.total,3);assert.equal(state.correctTotal,1);assert.equal(state.errors.length,2);assert.equal(state.session.recorded.length,3);
  assert(resumedExam.getHtml().includes('Разбор всех вопросов'));assert(resumedExam.getHtml().includes('Почему ваш ответ неверен:'));
  const examBeforeFinish=runtime(fixture,{storage:run.storage});await examBeforeFinish.a.load();
  assert.equal(examBeforeFinish.getState().total,3);assert.equal(examBeforeFinish.getState().session.finished,true);
  assert(examBeforeFinish.getHtml().includes('Разбор всех вопросов'));examBeforeFinish.a.finishSession();assert.equal(examBeforeFinish.getState().total,3);
  const sourceExam=runtime(realBank);await sourceExam.a.load();sourceExam.a.setMode('exam');sourceExam.a.startSession(['q089'],'Exam source');sourceExam.a.selectAnswer(0);
  assert(!sourceExam.getHtml().includes('https://csrc.nist.gov/glossary/term/confidentiality'));
  sourceExam.a.finishSession();assert(sourceExam.getHtml().includes('https://csrc.nist.gov/glossary/term/confidentiality'));
  // Confirmation dialogs preserve unfinished attempts and support cancellation.
  run=runtime(fixture);await run.a.load();run.a.startSession(['f0','f1'],'Old');
  const cancelNew=run.a.requestStartSession(['f2'],'New');assert(run.nodes.get('#confirm-dialog').open);assert.equal(run.getState().session.title,'Old');
  run.nodes.get('#dialog-cancel').dispatch('click');await cancelNew;assert.equal(run.getState().session.title,'Old');assert(!run.nodes.get('#confirm-dialog').open);
  const acceptNew=run.a.requestStartSession(['f2'],'New');run.nodes.get('#dialog-ok').dispatch('click');await acceptNew;assert.equal(run.getState().session.title,'New');
  const cancelFinish=run.a.requestFinish();assert(run.nodes.get('#confirm-dialog').open);run.nodes.get('#confirm-dialog').dispatch('cancel');await cancelFinish;assert(!run.getState().session.finished);
  const acceptFinish=run.a.requestFinish();run.nodes.get('#dialog-ok').dispatch('click');await acceptFinish;
  assert(run.getState().session.finished);assert.equal(run.getState().total,1);assert.equal(run.getState().errors.length,1);
  const cancelReset=run.a.resetProgress();run.nodes.get('#dialog-cancel').dispatch('click');await cancelReset;assert.equal(run.getState().total,1);
  const acceptReset=run.a.resetProgress();run.nodes.get('#dialog-ok').dispatch('click');await acceptReset;
  state=run.getState();assert.equal(state.total,0);assert.equal(state.correctTotal,0);assert.equal(state.session,null);assert.deepEqual(state.errors,[]);
  assert.equal(JSON.parse(run.storage.get(key)).session,null);
  run=runtime(fixture);await run.a.load();run.a.setMode('exam');run.a.startSession([...run.getState().tickets[0]],'Билет 1',0);ids=run.getState().session.ids;
  for(let i=0;i<ids.length;i++){run.a.jump(i);run.a.selectAnswer(i<3?0:1);}
  run.a.finishSession();assert.deepEqual(run.getState().ticketResults,[[0,{correct:3,length:4}]]);
  const restoredScore=runtime(fixture,{storage:run.storage});await restoredScore.a.load();assert.deepEqual(restoredScore.getState().ticketResults,[[0,{correct:3,length:4}]]);
  // Content updates retain counters and known mistake IDs, but invalidate old answer indices.
  run=runtime(fixture);await run.a.load();run.a.startSession([...run.getState().tickets[0]],'Old bank',0);run.a.selectAnswer(1);run.a.checkAnswer();
  const changed=clone(fixture);changed.questions[0].question+=' Revised.';
  const updated=runtime(changed,{storage:run.storage});await updated.a.load();state=updated.getState();
  assert.equal(state.total,1);assert.equal(state.correctTotal,0);assert.equal(state.errors.length,1);assert.equal(state.session,null);assert.deepEqual(state.ticketResults,[]);
  assert(state.bankUpdateNotice.includes('Банк вопросов обновлён'));assert(updated.getHtml().includes('Общая статистика и список ошибок сохранены'));
  const removed=clone(fixture);removed.questions=removed.questions.filter(q=>q.id!==state.errors[0]);
  const removedRun=runtime(removed,{storage:run.storage});await removedRun.a.load();assert.deepEqual(removedRun.getState().errors,[]);
  const currentSig=full.getState().bankSignature;
  const oldLayoutContent=JSON.stringify(realBank.questions.map(q=>[q.id,q.topic,q.question,q.options.map(o=>[o.text,o.correct])]));
  let oldHash=2166136261;for(let i=0;i<oldLayoutContent.length;i++)oldHash=Math.imul(oldHash^oldLayoutContent.charCodeAt(i),16777619);
  assert.notEqual(currentSig,(oldHash>>>0).toString(16));
  const legacy={version:1,bankSignature:(oldHash>>>0).toString(16),total:25,correctTotal:20,page:'tickets',mode:'practice',errors:['q012'],ticketResults:[[0,{correct:18,length:20}]],sessionOpen:false,session:null};
  const legacyStore=new Map([[key,JSON.stringify(legacy)]]);const legacyRun=runtime(realBank,{storage:legacyStore});await legacyRun.a.load();state=legacyRun.getState();
  assert.equal(state.total,25);assert.equal(state.correctTotal,20);assert.deepEqual(state.errors,['q012']);assert.deepEqual(state.ticketResults,[]);assert.equal(state.session,null);assert(state.bankUpdateNotice);
  const bank500=clone(realBank);bank500.questions=bank500.questions.filter(q=>Number(q.id.slice(1))<=500);bank500.topics=bank500.topics.filter(topic=>bank500.questions.some(q=>q.topic===topic));assert.equal(bank500.questions.length,500);
  const old500Store=new Map();const old500=runtime(bank500,{storage:old500Store});await old500.a.load();
  old500.a.startSession(['q012','q401','q483'],'Старые 500 вопросов');const old500Id=old500.getState().session.ids[0];old500.a.selectAnswer(wrongIndex(bank500,old500Id));old500.a.checkAnswer();
  const old500Snapshot=old500.getState();const expanded=runtime(realBank,{storage:old500Store});await expanded.a.load();
  assert.equal(expanded.getState().total,old500Snapshot.total);assert.equal(expanded.getState().correctTotal,old500Snapshot.correctTotal);assert.deepEqual(expanded.getState().errors,old500Snapshot.errors);
  assert.equal(expanded.getState().session,null);assert.equal(expanded.getState().tickets.length,Math.ceil(realBank.questions.length/50));assert(expanded.getState().bankUpdateNotice.includes('Банк вопросов обновлён'));assert.deepEqual([...old500Store.keys()],[key]);
  const previous840=JSON.parse(fs.readFileSync(require('node:path').join(fixtureRoot,'questions.json'),'utf8'));
  const complianceMigrationStore=new Map();const beforeCompliance=runtime(previous840,{storage:complianceMigrationStore});await beforeCompliance.a.load();
  beforeCompliance.a.startSession(['q416','q566','q012'],'До темы комплаенса');const migrationId=beforeCompliance.getState().session.ids[0];beforeCompliance.a.selectAnswer(wrongIndex(previous840,migrationId));beforeCompliance.a.checkAnswer();
  const migrationSnapshot=beforeCompliance.getState();const afterCompliance=runtime(realBank,{storage:complianceMigrationStore});await afterCompliance.a.load();
  assert.equal(afterCompliance.getState().total,migrationSnapshot.total);assert.deepEqual(afterCompliance.getState().errors,migrationSnapshot.errors);assert.equal(afterCompliance.getState().session,null);assert(afterCompliance.getState().bankUpdateNotice.includes('Банк вопросов обновлён'));
  // Broken storage and malformed saved state do not prevent a fresh attempt.
  const broken=runtime(fixture,{storage:new Map([[key,'{not json']])});await broken.a.load();assert.equal(broken.getState().total,0);assert.equal(broken.getState().session,null);
  const denied=runtime(fixture,{storageBlocked:true});await denied.a.load();assert.equal(denied.getState().storageAvailable,false);assert(denied.nodes.get('#storage-status').textContent.includes('не разрешает сохранение'));
  denied.a.startSession(['f0'],'Private mode');denied.a.selectAnswer(0);denied.a.checkAnswer();assert.equal(denied.getState().total,1);assert.equal(denied.getState().correctTotal,1);assert(denied.nodes.get('#sidebar-storage-status').textContent.includes('недоступно'));
  run=runtime(fixture);await run.a.load();run.a.startSession(['f0','f1'],'Stored');
  let tampered=JSON.parse(run.storage.get(key));tampered.session.orders[0][1]=[0,1,1,3];
  const invalidOrder=runtime(fixture,{storage:new Map([[key,JSON.stringify(tampered)]])});await invalidOrder.a.load();assert.equal(invalidOrder.getState().session,null);
  tampered=JSON.parse(run.storage.get(key));tampered.session.ids[0]='unknown';
  const invalidId=runtime(fixture,{storage:new Map([[key,JSON.stringify(tampered)]])});await invalidId.a.load();assert.equal(invalidId.getState().session,null);
  for(const [savedSize,expectedSize] of [[400,50],[20,20],[undefined,50]]){
    tampered=JSON.parse(run.storage.get(key));if(savedSize===undefined)delete tampered.randomSize;else tampered.randomSize=savedSize;
    const sized=runtime(fixture,{storage:new Map([[key,JSON.stringify(tampered)]])});await sized.a.load();assert.equal(sized.getState().randomSize,expectedSize);
  }
  const duplicate=clone(fixture);duplicate.questions[1].id=duplicate.questions[0].id;const duplicateRun=runtime(duplicate);await duplicateRun.a.load();assert(duplicateRun.getHtml().includes('Не удалось загрузить вопросы'));
  const badAnswer=clone(fixture);badAnswer.questions[0].options[1].correct=true;const badRun=runtime(badAnswer);await badRun.a.load();assert(badRun.getHtml().includes('Не удалось загрузить вопросы'));
  const badSource=clone(fixture);badSource.sources=[{id:'unsafe',title:'Bad',url:'javascript:alert(1)'}];const badSourceRun=runtime(badSource);await badSourceRun.a.load();assert(badSourceRun.getHtml().includes('Не удалось загрузить вопросы'));
  const wrongInterview=clone(realBank);wrongInterview.questions.find(q=>q.id==='q354').interviewSourceIds=['rfc9112'];const badInterviewRun=runtime(wrongInterview);await badInterviewRun.a.load();assert(badInterviewRun.getHtml().includes('Не удалось загрузить вопросы'));
  const missingSource=clone(fixture);missingSource.questions[0].sourceIds=['missing'];const missingSourceRun=runtime(missingSource);await missingSourceRun.a.load();assert(missingSourceRun.getHtml().includes('Не удалось загрузить вопросы'));
  run=runtime(fixture);await run.a.load();run.a.startSession(['f0'],'Keyboard');
  const keydown=run.documentListeners.get('keydown');const event=(key,target)=>({key,target,ctrlKey:false,metaKey:false,altKey:false,preventDefault(){this.prevented=true;}});
  const body={tagName:'BODY'};const input={tagName:'INPUT'};keydown(event('1',input));assert.equal(run.getState().session.answers.length,0);
  const order=run.getState().session.orders[0][1];keydown(event('2',body));assert.equal(run.getState().session.answers[0][1],order[1]);
  const button={tagName:'BUTTON',matches:()=>false};keydown(event('Enter',button));assert.equal(run.getState().total,0);
  await run.a.navigate('topics');const pausedAnswer=run.getState().session.answers[0][1];keydown(event('3',body));assert.equal(run.getState().session.answers[0][1],pausedAnswer);
  console.log('Trainer checks passed: composed 955-question base, 120 compliance questions, 45 topics, legal/source metadata, original collections, shuffle, scoring, hidden exam sources, dialogs, exact text, keyboard, validation and 500/840-bank migrations.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});

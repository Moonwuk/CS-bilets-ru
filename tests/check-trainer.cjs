'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'questions.json'),'utf8'));
const key='cs-bilets-ru.progress.v1';

class Node {
  constructor(){this.innerHTML='';this.textContent='';this.style={};this.dataset={};this.open=false;this.listeners=new Map();this.classList={toggle(){}};}
  addEventListener(name,fn){if(!this.listeners.has(name))this.listeners.set(name,new Set());this.listeners.get(name).add(fn);}
  removeEventListener(name,fn){this.listeners.get(name)?.delete(fn);}
  dispatch(name){for(const fn of this.listeners.get(name)||[])fn({preventDefault(){}});}
  setAttribute(){} removeAttribute(){} focus(){}
  get innerHTML(){return this._html;}
  set innerHTML(value){this._html=value;this.children=new Map();}
  querySelector(selector){if(!this.children.has(selector))this.children.set(selector,new Node());return this.children.get(selector);}
  querySelectorAll(selector){return selector==='[data-action="random"]' && this.innerHTML.includes('data-action="random"') ? [this.querySelector(selector)] : [];}
  showModal(){this.open=true;} close(){this.open=false;}
}

async function runtime(storage=new Map(),options={}) {
  const nodes=new Map();
  const document={querySelector:s=>{if(!nodes.has(s))nodes.set(s,new Node());return nodes.get(s);},querySelectorAll:()=>[],addEventListener(){},body:new Node()};
  const localStorage={
    getItem(k){if(options.blocked)throw new Error('Storage denied');return storage.get(k)??null;},
    setItem(k,value){if(options.blocked)throw new Error('Storage denied');storage.set(k,value);}
  };
  const ctx={document,window:{localStorage,scrollTo(){},addEventListener(){}},fetch:async()=>({ok:true,json:async()=>options.data||data}),console,AbortController,Math,Map,Set,Promise,URL};
  vm.createContext(ctx);
  const source=fs.readFileSync(path.join(root,'app.js'),'utf8').replace('const TICKET_SIZE = 50;',`const TICKET_SIZE = ${options.ticketSize||50};`).replace('  load();\n})();',`  globalThis.qa={startSession,requestStartSession,selectAnswer,checkAnswer,jump,finishSession,isCorrect,navigate,resetProgress,setMode:m=>{mode=m;},get:()=>({session,sessionOpen,tickets,bank,errors,ticketResults,total,correctTotal,page,mode,storageAvailable})};\n  load();\n})();`);
  vm.runInContext(source,ctx);
  await new Promise(resolve=>setImmediate(resolve));
  assert(ctx.qa.get().bank,'The bank must load successfully');
  return {a:ctx.qa,nodes,storage};
}

function choose(a,correct) {
  const {session,bank}=a.get();
  const id=session.ids[session.index];
  const oi=bank.get(id).options.findIndex(o=>o.correct===correct);
  a.selectAnswer(oi);
  return {id,oi};
}

(async()=>{
  let {a,nodes}=await runtime();
  let state=()=>a.get();
  const all=state().tickets.flat();
  assert.equal(all.length,400);assert.equal(new Set(all).size,400);
  assert.deepEqual(Array.from(state().tickets,t=>t.length),Array(8).fill(50));
  assert.equal(Number(nodes.get('#ticket-count').textContent),8);
  assert.equal(Number(nodes.get('#topic-count').textContent),22);
  assert(nodes.get('#dataset-info').textContent.includes('400 вопросов'));
  for(const topic of data.topics){
    const counts=Array.from(state().tickets,ticket=>ticket.filter(id=>state().bank.get(id).topic===topic).length);
    assert(Math.max(...counts)-Math.min(...counts)<=1,`${topic} must be spread evenly across tickets`);
    if(topic==='Модель OSI'){assert.equal(counts.reduce((a,b)=>a+b,0),41);assert(counts.every(n=>n===5||n===6));}
  }
  assert(nodes.get('#main').innerHTML.includes('50 вопросов из всех тем'));
  nodes.get('#main').querySelector('[data-action="random"]').dispatch('click');
  assert.equal(state().session.ids.length,50);assert.equal(new Set(state().session.ids).size,50);
  a.jump(49);assert.equal(state().session.index,49);assert(nodes.get('#main').innerHTML.includes('Вопрос 50 / 50'));
  a.jump(50);assert.equal(state().session.index,49,'Navigation must stop at question 50');
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

  // A ticket-layout change alone must invalidate numbered results, even when all question content is identical.
  const layoutStorage=new Map();
  ({a,nodes}=await runtime(layoutStorage,{ticketSize:20}));
  a.startSession(state().tickets[0],'Old short ticket',0);choose(a,true);a.checkAnswer();a.finishSession();
  a.startSession(state().tickets[1],'Old pending ticket',1);choose(a,false);
  ({a,nodes}=await runtime(layoutStorage));
  assert.equal(state().session,null);assert.equal(state().ticketResults.size,0);assert.equal(state().total,20);assert.equal(state().correctTotal,1);
  assert.equal(state().errors.size,19,'Mistake IDs survive a ticket-layout change');
  assert(nodes.get('#main').innerHTML.includes('Банк вопросов обновлён'));
  console.log('PASS: 400 questions, 8 tickets × 50, balanced OSI/topics, random ticket, sources after checking, training, exam secrecy, scoring, mistakes, reload/resume, answer order, completed results, reset, corrupt/unavailable storage, legacy 88-question and ticket-layout migrations.');
})().catch(error=>{console.error(error);process.exitCode=1;});

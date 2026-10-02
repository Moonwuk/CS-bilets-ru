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
  querySelector(){return new Node();} querySelectorAll(){return [];}
  showModal(){this.open=true;} close(){this.open=false;}
}

async function runtime(storage=new Map(),options={}) {
  const nodes=new Map();
  const document={querySelector:s=>{if(!nodes.has(s))nodes.set(s,new Node());return nodes.get(s);},querySelectorAll:()=>[],addEventListener(){},body:new Node()};
  const localStorage={
    getItem(k){if(options.blocked)throw new Error('Storage denied');return storage.get(k)??null;},
    setItem(k,value){if(options.blocked)throw new Error('Storage denied');storage.set(k,value);}
  };
  const ctx={document,window:{localStorage,scrollTo(){},addEventListener(){}},fetch:async()=>({ok:true,json:async()=>options.data||data}),console,AbortController,Math,Map,Set,Promise};
  vm.createContext(ctx);
  const source=fs.readFileSync(path.join(root,'app.js'),'utf8').replace('  load();\n})();',`  globalThis.qa={startSession,requestStartSession,selectAnswer,checkAnswer,jump,finishSession,isCorrect,navigate,resetProgress,setMode:m=>{mode=m;},get:()=>({session,sessionOpen,tickets,bank,errors,ticketResults,total,correctTotal,page,mode,storageAvailable})};\n  load();\n})();`);
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
  assert.equal(all.length,88);assert.equal(new Set(all).size,88);
  assert.deepEqual(Array.from(state().tickets,t=>t.length),[20,20,20,20,8]);
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
  a.finishSession();assert.equal(state().correctTotal,perfectBefore+20);
  assert(nodes.get('#main').innerHTML.includes('Билет пройден'));

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
  const changedData=JSON.parse(JSON.stringify(data));changedData.questions[0].question+=' (updated)';
  ({a,nodes}=await runtime(storage,{data:changedData}));
  assert.equal(state().session,null,'A changed bank must not restore potentially stale answers');assert.equal(state().ticketResults.size,0);
  assert(state().total>0,'Aggregate history remains available after a bank update');
  console.log('PASS: 88 questions, 5 tickets, training, exam secrecy, scoring, mistakes, reload/resume, answer order, completed results, reset, corrupt data and unavailable storage.');
})().catch(error=>{console.error(error);process.exitCode=1;});

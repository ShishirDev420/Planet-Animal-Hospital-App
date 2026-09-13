import test from 'node:test';
import assert from 'node:assert/strict';
import { createCareHandler } from '../api/care';
import { emptyState, applyCareCommand, validateConfig } from '../src/lib/care/domain';

// Transactional in-memory contract double, not a claim of Firestore emulator testing.
function harness() {
  const records=new Map<string,any>();let counter=0;let tail=Promise.resolve();
  const ref=(path:string)=>({path,get:async()=>snapshot(path)});
  const snapshot=(path:string)=>({exists:records.has(path),data:()=>structuredClone(records.get(path))});
  const db:any={doc:ref,collection:(name:string)=>({doc:()=>ref(`${name}/auto-${++counter}`)}),runTransaction:(fn:any)=>{
    const run=tail.then(async()=>{const writes:any[]=[];const tx={get:async(r:any)=>snapshot(r.path),set:(r:any,v:any)=>writes.push([r.path,structuredClone(v),false]),create:(r:any,v:any)=>writes.push([r.path,structuredClone(v),true])};const result=await fn(tx);for(const[p,,create]of writes)if(create&&records.has(p))throw Error('Already exists');for(const[p,v]of writes)records.set(p,v);return result;});tail=run.catch(()=>{});return run;
  }};
  const auth:any={verifyIdToken:async(token:string)=>{if(token==='bad')throw Error('invalid');return {uid:token==='parent'?'p1':token,clinicId:token==='staff'?'planet-animal':null,clinicRole:token==='staff'?'coordinator':null};}};
  const handler=createCareHandler(()=>({db,auth}));
  const call=async(token:string|undefined,body?:any,url='/api/care')=>{let payload='';const res:any={setHeader(){},end(s:string){payload=s;}};await handler({method:body?'POST':'GET',url,headers:token?{authorization:`Bearer ${token}`}:{},body},res);return {status:res.statusCode,data:JSON.parse(payload)};};
  return {records,call};
}
test('endpoint rejects missing/invalid identity and cross-account access',async()=>{
  const h=harness();assert.equal((await h.call(undefined)).status,401);assert.equal((await h.call('bad')).status,401);assert.equal((await h.call('parent',undefined,'/api/care?ownerUid=p2')).status,403);assert.equal((await h.call('parent',undefined,'/api/care?view=queue')).status,403);
});
test('completion endpoint serializes concurrent retries into one award',async()=>{
  const h=harness(),now=Date.now();
  const config=validateConfig({version:'fixture',workflowName:'Fixture',rules:{test:{points:10,creditPaise:100}}},{uid:'manager',role:'manager'});
  h.records.set('careSettings/pilot',config);
  h.records.set('careAccounts/p1',applyCareCommand(emptyState('p1','Pet'),{uid:'vet',role:'veterinarian'},{type:'approve',petId:'primary',id:'a',title:'Fixture',instructions:'Recorded test instruction',sourceRef:'test-record',windowStart:null,dueAt:null,reminderAt:null,ruleId:'test'},config,now-1000));
  const body={type:'complete',ownerUid:'p1',petId:'primary',milestoneId:'a',completedAt:now,evidence:'bill-line-1'};
  const results=await Promise.all(Array.from({length:12},()=>h.call('staff',body)));
  assert.ok(results.every(r=>r.status===200));assert.equal(h.records.get('careAccounts/p1').ledger.length,1);assert.equal([...h.records.keys()].filter(k=>k.startsWith('careEvidence/')).length,1);
  assert.equal((await h.call('parent',body)).status,403);
});
test('global completion evidence blocks a second account without partial changes',async()=>{
  const h=harness(),now=Date.now();const config=validateConfig({version:'fixture',workflowName:'Fixture',rules:{test:{points:10,creditPaise:100}}},{uid:'manager',role:'manager'});h.records.set('careSettings/pilot',config);
  for(const uid of ['p1','p2'])h.records.set('careAccounts/'+uid,applyCareCommand(emptyState(uid,'Pet'),{uid:'vet',role:'veterinarian'},{type:'approve',petId:'primary',id:'a',title:'Fixture',instructions:'Recorded test instruction',sourceRef:'test-record',windowStart:null,dueAt:null,reminderAt:null,ruleId:'test'},config,now-1000));
  const body={type:'complete',petId:'primary',milestoneId:'a',completedAt:now,evidence:'bill-line-1'};
  assert.equal((await h.call('staff',{...body,ownerUid:'p1'})).status,200);
  assert.equal((await h.call('staff',{...body,ownerUid:'p2'})).status,409);
  assert.equal(h.records.get('careAccounts/p2').ledger.length,0);assert.equal(h.records.get('careAccounts/p2').milestones[0].status,'approved');
});

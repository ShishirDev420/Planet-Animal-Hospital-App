import test from 'node:test';
import assert from 'node:assert/strict';
import { Jimp } from 'jimp';
import { createPrescriptionHandler, decodeImage } from '../api/prescriptions';
import { createCareHandler } from '../api/care';
import { emptyState } from '../src/lib/care/domain';
import { blankTranscript } from '../src/lib/care/prescriptions';

// Transactional contract double only: no network, live patient records or production provider.
function harness(options:{private?:boolean;extract?:()=>Promise<any>}={}) {
  const records=new Map<string,any>(),objects=new Map<string,Buffer>();let counter=0,tail=Promise.resolve(),providerCalls=0,failDelete=false;
  records.set('careAccounts/parent',emptyState('parent','Synthetic Pet'));
  const snapshot=(path:string)=>({exists:records.has(path),data:()=>structuredClone(records.get(path))});
  const ref=(path:string)=>({path,get:async()=>snapshot(path)});
  const collection=(name:string)=>{let cursor='',limit=50;const q:any={doc:()=>ref(`${name}/${++counter}`),orderBy:()=>q,startAfter:(v:string)=>{cursor=v;return q;},limit:(v:number)=>{limit=v;return q;},get:async()=>{const docs=[...records.keys()].filter(p=>p.startsWith(name+'/')&&p.split('/').length===2&&p.split('/')[1]>cursor).sort().slice(0,limit).map(p=>({id:p.split('/')[1],ref:ref(p),data:()=>structuredClone(records.get(p))}));return{docs,size:docs.length};}};return q;};
  const db:any={doc:ref,collection,runTransaction:(fn:any)=>{
    const run=tail.then(async()=>{const writes:any[]=[];const tx={get:async(r:any)=>snapshot(r.path),set:(r:any,v:any)=>writes.push([r.path,structuredClone(v)]),create:(r:any,v:any)=>writes.push([r.path,structuredClone(v)])};const result=await fn(tx);for(const[p,v]of writes)records.set(p,v);return result;});tail=run.catch(()=>{});return run;
  }};
  const bucket:any={getMetadata:async()=>[{iamConfiguration:{uniformBucketLevelAccess:{enabled:true},publicAccessPrevention:options.private===false?'inherited':'enforced'}}],file:(path:string)=>({
    save:async(bytes:Buffer,opts:any)=>{assert.equal(opts.preconditionOpts.ifGenerationMatch,0);assert.equal(opts.metadata.cacheControl,'private, no-store');if(objects.has(path))throw {code:412};objects.set(path,Buffer.from(bytes));},
    download:async()=>{if(!objects.has(path))throw Error('missing');return[objects.get(path)];},
    delete:async()=>{if(failDelete)throw Error('unavailable');objects.delete(path);},
  })};
  const roles:Record<string,string>={vet:'veterinarian',staff:'coordinator',manager:'manager'};
  const auth:any={verifyIdToken:async(token:string,revoked:boolean)=>{assert.equal(revoked,true);if(token==='bad')throw Error('bad');return{uid:token,clinicId:roles[token]?'planet-animal':undefined,clinicRole:roles[token]};}};
  const handler=createPrescriptionHandler(()=>({auth,db,bucket,retentionDays:30,extract:async()=>{providerCalls++;return options.extract?options.extract():blankTranscript();}}));
  const care=createCareHandler(()=>({auth,db}));
  const call=async(token?:string,body?:any,url='/api/prescriptions')=>{let payload:any;const headers:Record<string,string>={};const res:any={setHeader:(k:string,v:string)=>headers[k]=v,end:(v:any)=>payload=v};await (url==='/api/care'?care:handler)({method:body?'POST':'GET',url,headers:token?{authorization:`Bearer ${token}`}:{},body},res);return{status:res.statusCode,data:Buffer.isBuffer(payload)?payload:JSON.parse(payload),headers};};
  return{records,objects,call,providerCalls:()=>providerCalls,failDelete:(v:boolean)=>failDelete=v};
}
async function upload() {const bytes=await new Jimp({width:2,height:2,color:0xffffffff}).getBuffer('image/png');return{type:'upload',petId:'primary',consent:true,mime:'image/png',base64:bytes.toString('base64')};}
test('private endpoint denies missing revoked and cross-account access before storage or OCR',async()=>{
  const h=harness(),body=await upload();assert.equal((await h.call(undefined,body)).status,401);assert.equal((await h.call('bad',body)).status,401);assert.equal((await h.call('other',{...body,ownerUid:'parent'})).status,403);assert.equal(h.objects.size,0);assert.equal(h.providerCalls(),0);
});
test('invalid image, absent consent, wrong pet and non-private bucket are rejected',async()=>{
  const h=harness(),body=await upload();
  for(const [patch,status] of [[{consent:false},400],[{petId:'foreign'},404],[{mime:'image/svg+xml'},400],[{base64:Buffer.from('<script>alert(1)</script>').toString('base64')},400]] as const)assert.equal((await h.call('parent',{...body,...patch})).status,status);
  assert.equal((await harness({private:false}).call('parent',body)).status,503);assert.equal(h.providerCalls(),0);
});
test('original bytes retained privately; duplicates do not repeat OCR or issue care',async()=>{
  const h=harness(),body=await upload(),first=await h.call('parent',body);assert.equal(first.status,200);
  const again=await h.call('parent',body);assert.equal(again.data.duplicate,true);assert.equal(h.objects.size,1);assert.equal(h.providerCalls(),1);
  const source=await h.call('parent',undefined,`/api/prescriptions?id=${first.data.prescriptionId}`);assert.equal(source.status,200);assert.deepEqual(source.data,Buffer.from(body.base64,'base64'));assert.equal(source.headers['Cache-Control'],'no-store');assert.equal(source.headers['X-Content-Type-Options'],'nosniff');
  assert.equal((await h.call('other',undefined,`/api/prescriptions?ownerUid=parent&id=${first.data.prescriptionId}`)).status,403);
  assert.equal((await h.call('vet',undefined,`/api/prescriptions?ownerUid=parent&id=${first.data.prescriptionId}`)).status,200);
  assert.equal(h.records.get('careAccounts/parent').ledger.length,0);assert.equal(h.records.get('careAccounts/parent').milestones.length,0);
});
test('same image on another pet conflicts; another account cannot discover its existence',async()=>{
  const h=harness(),body=await upload();h.records.get('careAccounts/parent').pets.push({id:'second',name:'Second'});await h.call('parent',body);
  assert.equal((await h.call('parent',{...body,petId:'second'})).status,409);
  h.records.set('careAccounts/other',emptyState('other','Other'));const result=await h.call('other',body);assert.equal(result.status,200);assert.equal(result.data.duplicate,false);assert.equal(h.objects.size,2);
});
test('provider failure retains source with truthful unavailable OCR, no generated fallback',async()=>{
  const h=harness({extract:async()=>{throw Error('provider token secret');}}),body=await upload();const response=await h.call('parent',body);assert.equal(response.status,200);assert.equal(response.data.ocrStatus,'unavailable');const rx=h.records.get('careAccounts/parent').prescriptions[0];assert.equal(rx.extraction,null);assert.equal(rx.provider,null);assert.equal(h.objects.size,1);assert.ok(!JSON.stringify(response).includes('secret'));
});
test('concurrent upload requests hold one reservation and make one provider call',async()=>{
  const h=harness(),body=await upload();const results=await Promise.all(Array.from({length:8},()=>h.call('parent',body)));assert.ok(results.every(r=>[200,409].includes(r.status)));assert.equal(h.providerCalls(),1);assert.equal(h.objects.size,1);assert.equal(h.records.get('careAccounts/parent').prescriptions.length,1);
});
test('deletion blocks readers even if storage fails; retry removes original bytes',async()=>{
  const h=harness(),body=await upload();const uploaded=await h.call('parent',body),rx=h.records.get('careAccounts/parent').prescriptions[0];h.failDelete(true);
  const command={type:'delete',prescriptionId:rx.id,expectedRevision:rx.revision};assert.equal((await h.call('parent',command)).status,503);assert.equal((await h.call('parent',undefined,`/api/prescriptions?id=${uploaded.data.prescriptionId}`)).status,404);assert.equal(h.records.get('careAccounts/parent').prescriptions[0].extraction,null);
  h.failDelete(false);assert.equal((await h.call('parent',command)).status,200);assert.equal(h.objects.size,0);assert.equal((await h.call('parent',body)).status,409);
});
test('image decoder rejects an image dimension bomb before decode',async()=>{
  const body=await upload(),bytes=Buffer.from(body.base64,'base64');bytes.writeUInt32BE(200000,16);await assert.rejects(()=>decodeImage(bytes.toString('base64'),'image/png'),/16 megapixels/);
  await assert.rejects(()=>decodeImage('a'.repeat(2800004),'image/png'),/encoding/);
});
test('private upload through care approval and twelve completion retries earns exactly once',async()=>{
  const transcript=blankTranscript();transcript.instructions={value:'Recorded synthetic review',sourceQuote:'Recorded synthetic review',confidence:'high'};
  const h=harness({extract:async()=>transcript}),body=await upload();
  h.records.set('careSettings/pilot',{version:'fixture',approvedBy:'manager',workflowName:'Synthetic',rules:{fixture:{points:40,creditPaise:1000}}});
  const uploaded=await h.call('parent',body),prescriptionId=uploaded.data.prescriptionId;
  const confirmed=await h.call('parent',{type:'confirmPrescription',petId:'primary',prescriptionId,expectedRevision:2,transcript,consent:true},'/api/care');assert.equal(confirmed.status,200);assert.equal(confirmed.data.state.milestones.length,0);
  const approved=await h.call('vet',{type:'approve',ownerUid:'parent',petId:'primary',prescriptionId,prescriptionVersion:3,id:'recorded',title:'Recorded review',ruleId:'fixture',sourceReviewed:true,conflictsReviewed:true,dueAt:null,reminderAt:null},'/api/care');assert.equal(approved.status,200);
  const completion={type:'complete',ownerUid:'parent',petId:'primary',milestoneId:'recorded',evidence:'synthetic-service-line',completedAt:Date.now()};
  const results=await Promise.all(Array.from({length:12},()=>h.call('staff',completion,'/api/care')));assert.ok(results.every(r=>r.status===200));assert.equal(h.records.get('careAccounts/parent').ledger.length,1);assert.equal(h.records.get('careAccounts/parent').ledger[0].points,40);
});
test('retention purge is manager-only, removes bytes and scrubs expired transcription idempotently',async()=>{
  const h=harness(),body=await upload();await h.call('parent',body);h.records.get('careAccounts/parent').prescriptions[0].expiresAt=1;
  assert.equal((await h.call('parent',{type:'purgeExpired'})).status,403);
  const result=await h.call('manager',{type:'purgeExpired'});assert.equal(result.status,200);assert.equal(h.objects.size,0);assert.equal(h.records.get('careAccounts/parent').prescriptions[0].extraction,null);assert.equal(h.records.get('careAccounts/parent').prescriptions[0].status,'deleted');
  const revision=h.records.get('careAccounts/parent').revision;await h.call('manager',{type:'purgeExpired'});assert.equal(h.records.get('careAccounts/parent').revision,revision);
});

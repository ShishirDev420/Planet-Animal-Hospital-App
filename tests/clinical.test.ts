import test from 'node:test';
import assert from 'node:assert/strict';
import { createClinicalHandler } from '../api/clinical';
import { emptyState } from '../src/lib/care/domain';
import { ANALYSIS_DEPTH, EMPTY_DETAILS, clinicalTier, clinicalContext, reviewAnalysis, visibleAnalysis, approvedAnalysisText, validateClinicalContent, type ClinicalAnalysis } from '../src/lib/care/clinical';
import { buildPetContextExport } from '../src/lib/care/clinical-export';
import { parseResearch, researchRequest, researchSpecies } from '../server/clinical-research';

const content = { summary:'Synthetic review summary',sections:[{title:'Profile review',observation:'Synthetic observation only',basis:'inference' as const,sourceIds:['profile']}],suggestedCheckups:[],uncertainties:['Species is not recorded.'] };
const active = {plan:'advanced' as const,status:'active' as const,startsAt:1,endsAt:Date.now()+86400000,verifiedBy:'billing',paymentReference:'paid-ref'};
const vet = {uid:'doctor',role:'veterinarian' as const};
const analysis: ClinicalAnalysis = {id:'a',petId:'primary',tier:'advanced',revision:1,status:'draft',sourceHash:'hash',requestedAt:1,requestedBy:'parent',provider:'synthetic',model:'synthetic',content};

test('expired, deleted, changed or reassigned prescription milestones cannot enter analysis/export',()=>{
  const state=emptyState('parent','Pet');
  state.milestones=[{id:'m',petId:'primary',status:'approved',instructions:'STALE SECRET',prescription:{id:'rx',version:2}} as any];
  for (const change of [{expiresAt:5},{status:'deleted'},{revision:3},{petId:'another'},{status:'review'}]) {
    state.prescriptions=[{id:'rx',petId:'primary',status:'confirmed',expiresAt:100,revision:2,versions:[],...change} as any];
    assert.equal(clinicalContext(state,'primary',EMPTY_DETAILS,10).recordedCare.length,0);
    assert.ok(!buildPetContextExport(state,'primary',EMPTY_DETAILS,{profile:false,history:false,prescriptions:false,approvedCare:true},10).includes('STALE SECRET'));
  }
});
test('research uses only canonical species, requires actual search and allowed URL annotations',()=>{
  const state=emptyState('PRIVATE-OWNER','PRIVATE-PET');const context=clinicalContext(state,'primary',{...EMPTY_DETAILS,species:'Dog',breed:'PRIVATE-BREED'},10);
  const request=JSON.stringify(researchRequest(researchSpecies(context),'configured-model'));assert.ok(!request.includes('PRIVATE'));assert.match(request,/dog preventive/);
  assert.throws(()=>researchSpecies({...context,pet:{...context.pet,profile:{...context.pet.profile,species:'Dog named private-person'}}}),/currently supports/);
  const result={status:'completed',output:[{type:'web_search_call',status:'completed'},{type:'message',content:[{type:'output_text',text:'Synthetic summary.',annotations:[{type:'url_citation',url:'https://www.aaha.org/guidelines/',title:'Synthetic guideline',start_index:0,end_index:18}]}]}]};
  assert.equal(parseResearch(result,10)[0].citations[0].url,'https://www.aaha.org/guidelines/');
  for (const url of ['javascript:alert(1)','https://aaha.org.evil.example/','http://www.aaha.org/','https://user:secret@aaha.org/']) {const bad=structuredClone(result);bad.output[1].content![0].annotations[0].url=url;assert.throws(()=>parseResearch(bad,10),/verifiable/);}
  assert.throws(()=>parseResearch({...result,output:result.output.slice(1)},10),/verifiable/);
  const fake=structuredClone(result);fake.output[1].content![0].annotations=[];assert.throws(()=>parseResearch(fake,10),/verifiable/);
});
test('research citations remain hidden before approval and allowed as immutable review sources',()=>{
  const evidence=[{id:'research:brief',title:'Brief',excerpt:'Private draft evidence',retrievedAt:10,citations:[{url:'https://aaha.org/',title:'Source'}]}];
  const draft={...analysis,evidence,content:{...content,sections:[{...content.sections[0],sourceIds:['research:brief']}]}};
  assert.ok(!JSON.stringify(visibleAnalysis(draft,'parent','hash')).includes('Private draft evidence'));
  const approved=reviewAnalysis(draft,vet,'approve',1,'hash',draft.content,'Reviewed sources',['profile'],20);
  assert.equal(visibleAnalysis(approved,'parent','hash').evidence?.[0].citations.length,1);
});

test('tiers require authoritative paid verification; expired/cancelled/client-like values fail closed',()=>{
  assert.equal(clinicalTier(active,Date.now()),'advanced');
  for (const change of [{status:'cancelled'},{verifiedBy:''},{paymentReference:''},{endsAt:1},{plan:'premium'},{plan:'__proto__'},{startsAt:NaN},{plan:'free'}]) assert.equal(clinicalTier({...active,...change} as any,Date.now()),null);
  assert.equal(clinicalTier({...active,plan:'prestige'},Date.now()),'prestige');
  assert.ok(ANALYSIS_DEPTH.essential.maxTokens < ANALYSIS_DEPTH.advanced.maxTokens && ANALYSIS_DEPTH.advanced.maxTokens < ANALYSIS_DEPTH.prestige.maxTokens);
});
test('only vet can approve; source and revision checks precede approval; edit withdraws parent visibility',()=>{
  for (const role of ['parent','coordinator','manager'] as const) assert.throws(()=>reviewAnalysis(analysis,{uid:role,role},'approve',1,'hash',content,'Reviewed',['profile'],2),/Only a verified/);
  assert.throws(()=>reviewAnalysis(analysis,vet,'approve',1,'changed',content,'Reviewed',['profile'],2),/sources changed/);
  assert.throws(()=>reviewAnalysis(analysis,vet,'approve',0,'hash',content,'Reviewed',['profile'],2),/Another review/);
  const approved = reviewAnalysis(analysis,vet,'approve',1,'hash',content,'Compared source',['profile'],2);
  assert.equal(approved.approvedBy,'doctor'); assert.ok(approvedAnalysisText(visibleAnalysis(approved,'parent','hash')));
  const edited = reviewAnalysis(approved,vet,'edit',2,'hash',{...content,summary:'Changed'},'Revising',['profile'],3);
  assert.equal(edited.status,'draft');assert.equal(edited.approvedBy,undefined);assert.equal(visibleAnalysis(edited,'parent','hash').content,undefined);
});
test('every unapproved or stale payload strips advice and review notes for non-vets',()=>{
  for (const status of ['pending','draft','rejected','failed'] as const) for (const role of ['parent','coordinator','manager'] as const) { const v=visibleAnalysis({...analysis,status,reviewNote:'PRIVATE'},role,'hash');assert.equal(v.content,undefined);assert.ok(!JSON.stringify(v).includes('PRIVATE')); }
  const approved=reviewAnalysis(analysis,vet,'approve',1,'hash',content,'Reviewed',['profile'],2);
  assert.equal(visibleAnalysis(approved,'parent','different').content,undefined);
  assert.equal(approvedAnalysisText(visibleAnalysis(approved,'parent','different')),null);
});
test('unknown sources and oversized tier content never become clinical drafts',()=>{
  assert.throws(()=>validateClinicalContent({...content,sections:[{...content.sections[0],sourceIds:['invented-journal']}]},'advanced',['profile']),/unavailable evidence/);
  assert.throws(()=>validateClinicalContent({...content,sections:Array(4).fill(content.sections[0])},'essential',['profile']),/incomplete/);
  assert.throws(()=>validateClinicalContent({...content,approvedBy:'model'},'advanced',['profile']),/incomplete/);
});
test('context and explicit export are selected-pet only, exclude identity and wallet, preserve unknowns',()=>{
  const state=emptyState('secret-parent','Dog');state.pets.push({id:'other',name:'OTHER PET'});state.updates=[{id:'u',petId:'other',text:'OTHER HISTORY',createdAt:1,consent:true}];
  const context=clinicalContext(state,'primary',EMPTY_DETAILS,10);assert.ok(!JSON.stringify(context).includes('OTHER'));
  assert.throws(()=>clinicalContext(state,'unknown',EMPTY_DETAILS,10),/belonging/);
  const text=buildPetContextExport(state,'primary',EMPTY_DETAILS,{profile:true,history:false,prescriptions:false,approvedCare:false},10);
  assert.match(text,/Not provided/);assert.ok(!text.includes('secret-parent'));assert.ok(!text.includes('OTHER'));assert.ok(!text.includes('UNVERIFIED PRESCRIPTION'));
});

// Serialized transactional contract double. Real Firestore emulator coverage is a separate release gate.
function harness(generate?: (context:any,tier:any)=>Promise<any>, retrieve?: any) {
  const records=new Map<string,any>();let counter=0,tail=Promise.resolve();
  const snapshot=(path:string)=>({exists:records.has(path),data:()=>structuredClone(records.get(path))});
  const ref=(path:string)=>({path});
  const db:any={doc:ref,collection:(name:string)=>({doc:()=>ref(`${name}/${++counter}`)}),runTransaction:(fn:any)=>{const run=tail.then(async()=>{const writes:any[]=[];const tx={get:async(r:any)=>snapshot(r.path),set:(r:any,v:any)=>writes.push([r.path,structuredClone(v),false]),create:(r:any,v:any)=>writes.push([r.path,structuredClone(v),true])};const result=await fn(tx);for(const [p,,create]of writes)if(create&&records.has(p))throw Error('exists');for(const [p,v]of writes)records.set(p,v);return result;});tail=run.catch(()=>{});return run;}};
  const auth:any={verifyIdToken:async(token:string)=>{if(token==='bad')throw Error('bad');return {uid:token,clinicId:['doctor','manager','coordinator'].includes(token)?'planet-animal':null,clinicRole:token==='doctor'?'veterinarian':token};}};
  const handler=createClinicalHandler(()=>({auth,db}),generate || (async()=>content),retrieve);
  records.set('careAccounts/parent',emptyState('parent','Synthetic Pet'));records.set('careSubscriptions/parent',active);
  const call=async(token='parent',body?:any,ownerUid='parent',petId='primary')=>{let payload='';const res:any={setHeader(){},end(v:string){payload=v;}};await handler({method:body?'POST':'GET',url:`/api/clinical?ownerUid=${ownerUid}&petId=${petId}`,headers:token?{authorization:`Bearer ${token}`}:{},body},res);return {status:res.statusCode,data:JSON.parse(payload)};};
  return {records,call};
}
const generateBody={action:'generate',requestId:'req',consent:true,adult:true};
test('research-enriched provider context persists evidence without corrupting patient-source hashes',async()=>{
  const evidence=[{id:'research:brief',title:'Brief',excerpt:'Synthetic evidence',retrievedAt:10,citations:[{url:'https://aaha.org/',title:'Source'}]}];
  const cited={...content,sections:[{...content.sections[0],sourceIds:['research:brief']}]};
  const h=harness(async(context)=>{assert.deepEqual(context.evidence,evidence);return cited;},async()=>evidence);
  assert.equal((await h.call('parent',generateBody)).status,202);
  const draft=(await h.call('doctor')).data.analyses[0];assert.equal(draft.stale,false);assert.deepEqual(draft.evidence,evidence);
  assert.equal((await h.call('doctor',{action:'approve',analysisId:'req',revision:draft.revision,content:cited,note:'Reviewed literature'})).status,200);
  assert.deepEqual((await h.call()).data.analyses[0].evidence,evidence);
});
test('endpoint denies invalid identity, cross-account and cross-pet access',async()=>{
  const h=harness();assert.equal((await h.call('')).status,401);assert.equal((await h.call('bad')).status,401);assert.equal((await h.call('outsider')).status,403);assert.equal((await h.call('parent',undefined,'parent','missing')).status,404);
});
test('server reads verified tier, consent, selected sources; never trusts submitted premium plan',async()=>{
  let seen:any;const h=harness(async(context,tier)=>{seen={context,tier};return content;});
  h.records.set('careSubscriptions/parent',{...active,plan:'essential'});
  assert.equal((await h.call('parent',{...generateBody,consent:false})).status,400);
  const r=await h.call('parent',{...generateBody,tier:'prestige',profile:{breed:'invented'}});assert.equal(r.status,202);assert.equal(seen.tier,'essential');assert.equal(seen.context.pet.profile.breed,'');assert.equal(r.data.content,undefined);
  assert.equal((await h.call()).data.analyses[0].content,undefined);
});
test('vet draft review persists audit and approved content only; parent/manager spoof rejected',async()=>{
  const h=harness();await h.call('parent',generateBody);
  const d=(await h.call('doctor')).data.analyses[0];assert.equal(d.status,'draft');assert.deepEqual(d.content,content);
  const body={action:'approve',analysisId:'req',revision:d.revision,content,note:'Checked original records'};
  assert.equal((await h.call('parent',{...body,clinicRole:'veterinarian'})).status,403);assert.equal((await h.call('manager',body)).status,403);
  assert.equal((await h.call('doctor',body)).status,200);assert.deepEqual((await h.call()).data.analyses[0].content,content);
  assert.equal([...h.records.keys()].filter(p=>p.startsWith('careClinicalAudit/')).length,2);
  assert.equal((await h.call('doctor',body)).status,409);
  assert.equal(h.records.get('careAccounts/parent').milestones.length,0);assert.equal(h.records.get('careAccounts/parent').ledger.length,0);
});
test('changed profile hides approved advice and blocks stale approval',async()=>{
  const h=harness();await h.call('parent',generateBody);const d=(await h.call('doctor')).data.analyses[0];await h.call('doctor',{action:'approve',analysisId:'req',revision:d.revision,content,note:'Reviewed'});
  const before=(await h.call()).data;await h.call('parent',{action:'profile',revision:before.revision,profile:{...EMPTY_DETAILS,weight:'8kg'}});
  assert.equal((await h.call()).data.analyses[0].content,undefined);assert.equal((await h.call()).data.analyses[0].status,'needs-refresh');
  assert.equal((await h.call('doctor',{action:'approve',analysisId:'req',revision:2,content,note:'Reviewed'})).status,409);
});
test('source or entitlement change during generation never publishes a draft',async()=>{
  for (const change of ['source','tier']) {const h=harness(async()=>{if(change==='tier')h.records.set('careSubscriptions/parent',{...active,status:'cancelled'});else {const s=h.records.get('careAccounts/parent');s.pets[0].name='Changed';}return content;});assert.equal((await h.call('parent',generateBody)).status,409);assert.equal((await h.call('doctor')).data.analyses[0].content,undefined);}
});
test('failure retries are bounded, concurrent duplicate requests generate once',async()=>{
  let calls=0;const h=harness(async()=>{calls++;await new Promise(r=>setTimeout(r,10));return content;});
  const result=await Promise.all([h.call('parent',generateBody),h.call('parent',generateBody)]);assert.equal(calls,1);assert.ok(result.some(r=>r.status===202));
  const fail=harness(async()=>{throw Error('SECRET provider payload');});for(let i=0;i<2;i++){const r=await fail.call('parent',generateBody);assert.equal(r.status,503);assert.ok(!JSON.stringify(r).includes('SECRET'));}assert.equal((await fail.call('parent',generateBody)).status,409);
});
test('a failed provider cannot bypass free-plan isolation or consent',async()=>{
  let calls=0;const h=harness(async()=>{calls++;return content;});h.records.delete('careSubscriptions/parent');assert.equal((await h.call('parent',generateBody)).status,403);assert.equal(calls,0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCareCommand as apply, emptyState, roleFromClaims, validateConfig, metrics, reconcile, careSummary, type Actor, type CareState } from '../src/lib/care/domain';
const now = 1800000000000;
const parent:Actor={uid:'parent-a',role:'parent'}, vet:Actor={uid:'vet-a',role:'veterinarian'}, coordinator:Actor={uid:'staff-a',role:'coordinator'}, manager:Actor={uid:'manager-a',role:'manager'};
const config=validateConfig({version:'test-v1',workflowName:'TEST FIXTURE ONLY',rules:{fixture:{points:40,creditPaise:1000}}},manager);
const approval={type:'approve',petId:'primary',id:'milestone-a',title:'Recorded follow-up',instructions:'Instructions copied from the test clinical record.',sourceRef:'record-a',windowStart:now+1000,dueAt:now+10000,reminderAt:now+1000,ruleId:'fixture'};
const approved=()=>apply(emptyState(parent.uid,'Pet A'),vet,approval,config,now);
const complete={type:'complete',petId:'primary',milestoneId:'milestone-a',evidence:'performed-service-line-a',completedAt:now+5000};

test('parent cannot read or mutate another account',()=>{assert.throws(()=>apply(approved(),{uid:'intruder',role:'parent'},{type:'preferences',inApp:true},config,now),/another account/);});
test('untrusted profile role and wrong clinic claims never grant staff access',()=>{
  assert.equal(roleFromClaims({role:'manager',clinicRole:'manager'}),'parent');
  assert.equal(roleFromClaims({clinicRole:'veterinarian',clinicId:'other'}),'parent');
  assert.equal(roleFromClaims({clinicRole:'veterinarian',clinicId:'planet-animal'}),'veterinarian');
});
test('only a veterinarian can approve; manager and coordinator cannot invent clinical plans',()=>{for(const actor of [parent,coordinator,manager])assert.throws(()=>apply(emptyState(parent.uid,'Pet A'),actor,approval,config,now),/staff role/);});
test('no approved configuration or missing record source cannot activate rewards',()=>{
  assert.throws(()=>apply(emptyState(parent.uid,'Pet A'),vet,approval,null,now),/configuration/);
  assert.throws(()=>apply(emptyState(parent.uid,'Pet A'),vet,{...approval,sourceRef:''},config,now),/reference/);
});
test('configuration is manager-only and integer-valued',()=>{
  assert.throws(()=>validateConfig(config,parent),/staff role/);
  assert.throws(()=>validateConfig({...config,rules:{fixture:{points:1.5,creditPaise:1}}},manager),/integer/);
});
test('missing approved dates remain missing and produce one scheduling item',()=>{
  let s=apply(emptyState(parent.uid,'Pet A'),vet,{...approval,windowStart:null,dueAt:null,reminderAt:null},config,now);
  s=apply(s,coordinator,{type:'tick'},config,now+50000);
  assert.equal(s.milestones[0].dueAt,null);assert.equal(s.queues.length,1);assert.equal(s.reminders.length,0);assert.match(careSummary(s,'primary'),/not recorded/);
});
test('booking and retries never award or create duplicate scheduling items',()=>{
  const command={type:'book',petId:'primary',milestoneId:'milestone-a',requestedFor:now+5000};
  let s=apply(approved(),parent,command,config,now+10);
  const again=apply(s,parent,command,config,now+20);
  assert.equal(again,s);assert.equal(s.ledger.length,0);assert.equal(s.milestones[0].booking.status,'requested');assert.equal(s.queues.length,1);
});
test('confirmation needs staff and an actual clinic booking reference',()=>{
  const s=apply(approved(),parent,{type:'book',petId:'primary',milestoneId:'milestone-a',requestedFor:now+5000},config,now+10);
  const cmd={type:'confirmBooking',petId:'primary',milestoneId:'milestone-a',scheduledAt:now+5000,reference:'clinic-booking-a'};
  assert.throws(()=>apply(s,parent,cmd,config,now+20),/staff role/);
  assert.throws(()=>apply(s,coordinator,{...cmd,reference:''},config,now+20),/reference/);
  assert.equal(apply(s,coordinator,cmd,config,now+20).milestones[0].booking.status,'confirmed');
});
test('booking failure leaves unresolved scheduling and no points',()=>{
  const s=apply(approved(),coordinator,{type:'bookingFailed',petId:'primary',milestoneId:'milestone-a',reason:'Booking provider unavailable; contact parent.'},config,now+30);
  assert.equal(s.milestones[0].booking.status,'none');assert.equal(s.queues[0].status,'open');assert.equal(s.ledger.length,0);
});
test('only staff-verified care earns once, including repeated completion calls',()=>{
  assert.throws(()=>apply(approved(),parent,complete,config,now+6000),/staff role/);
  let s=apply(approved(),coordinator,complete,config,now+6000);
  for(let i=0;i<20;i++)s=apply(s,coordinator,complete,config,now+6000+i);
  assert.equal(s.ledger.length,1);assert.equal(s.ledger[0].points,40);assert.equal(s.ledger[0].creditPaise,1000);assert.equal(s.entitlements.length,0);
  assert.throws(()=>apply(s,parent,complete,config,now+7000),/staff role/);
});
test('clinical approval retries cannot revise rewards or instructions silently',()=>{
  const s=approved();assert.equal(apply(s,vet,{...approval,title:'Changed'},config,now+20),s);
});
test('awards use captured approved rules after configuration changes',()=>{
  const changed=validateConfig({...config,version:'test-v2',rules:{fixture:{points:999,creditPaise:0}}},manager);
  assert.equal(apply(approved(),coordinator,complete,changed,now+6000).ledger[0].points,40);
});
test('duplicate evidence cannot earn a second award for another milestone or pet',()=>{
  let s=apply(approved(),coordinator,complete,config,now+6000);
  s=apply(s,parent,{type:'addPet',petId:'second',name:'Pet B'},config,now+6100);
  s=apply(s,vet,{...approval,id:'milestone-b',petId:'second'},config,now+6200);
  assert.throws(()=>apply(s,coordinator,{...complete,petId:'second',milestoneId:'milestone-b',completedAt:now+6300},config,now+7000),/already earned/);
  assert.throws(()=>apply(s,coordinator,{...complete,petId:'second'},config,now+7000),/not found/);
});
test('opt-in, snooze, opt-out and completion govern one reminder',()=>{
  let s=approved();assert.equal(s.reminders[0].status,'cancelled');
  s=apply(s,parent,{type:'preferences',inApp:true},config,now+2000);assert.equal(s.reminders[0].status,'available');
  s=apply(s,parent,{type:'preferences',inApp:true,snoozeUntil:now+9000},config,now+2500);assert.equal(s.reminders[0].status,'scheduled');
  s=apply(s,parent,{type:'preferences',inApp:false},config,now+3000);assert.equal(s.reminders[0].status,'cancelled');
  s=apply(s,coordinator,complete,config,now+6000);s=apply(s,parent,{type:'preferences',inApp:true},config,now+7000);assert.equal(s.reminders.length,1);assert.equal(s.reminders[0].status,'cancelled');
});
test('staff cannot opt parents in and unconfigured external messaging is rejected',()=>{
  assert.throws(()=>apply(approved(),coordinator,{type:'preferences',inApp:true},config,now),/Only the parent/);
  assert.throws(()=>apply(approved(),parent,{type:'preferences',inApp:true,external:true},config,now),/not configured/);
});
test('consented parent concerns stay unresolved until clinical review',()=>{
  const cmd={type:'update',petId:'primary',id:'update-a',text:'New concern',consent:true};
  assert.throws(()=>apply(approved(),parent,{...cmd,consent:false},config,now),/consent/);
  let s=apply(approved(),parent,cmd,config,now+1);s=apply(s,parent,cmd,config,now+2);
  assert.equal(s.updates.length,1);const q=s.queues.find(q=>q.kind==='clinical')!;
  assert.throws(()=>apply(s,coordinator,{type:'queue',queueId:q.id,resolve:true,nextAction:'Done'},config,now+3),/staff role/);
  s=apply(s,vet,{type:'queue',queueId:q.id,resolve:true,nextAction:'Reviewed; see recorded clinical instructions.'},config,now+3);
  assert.equal(s.queues.find(x=>x.id===q.id)!.status,'resolved');
});
test('late or missed care never forfeits earned points; accurate window metrics',()=>{
  let s=apply(approved(),coordinator,complete,config,now+6000);
  s=apply(s,vet,{...approval,id:'milestone-b'},config,now+7000);
  s=apply(s,coordinator,{type:'tick'},config,now+20000);
  assert.equal(s.ledger[0].points,40);assert.equal(s.queues.filter(q=>q.kind==='missed'&&q.status==='open').length,1);
  assert.deepEqual([metrics(s,now+20000).due,metrics(s,now+20000).completedInWindow],[2,1]);
});
test('vet exemption closes reminders without manufacturing rewards',()=>{
  const s=apply(approved(),vet,{type:'exempt',petId:'primary',milestoneId:'milestone-a',reason:'Recorded clinical exemption'},config,now+100);
  assert.equal(s.ledger.length,0);assert.equal(s.reminders[0].status,'cancelled');
});
test('repeat background processing does not generate duplicate work or audit revisions',()=>{
  const s=apply(approved(),coordinator,{type:'tick'},config,now+20000);
  assert.equal(apply(s,coordinator,{type:'tick'},config,now+21000),s);
});

import { BrowserRouter } from 'react-router-dom';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import CareWorkflow, { careButton } from './components/CareWorkflow';
import { CareReviewProvider } from './lib/care/client';
import { applyCareCommand, emptyState, validateConfig } from './lib/care/domain';
import './index.css';
function Review() {
  const [state,setState]=useState(()=>emptyState('fixture-parent','Fixture Pet'));
  const [petId,setPetId]=useState('primary'), [notice,setNotice]=useState('');
  const config=validateConfig({version:'fixture-only',workflowName:'LOCAL TEST ONLY',rules:{fixture:{points:40,creditPaise:1000}}},{uid:'fixture-manager',role:'manager'});
  const run=(role:'parent'|'veterinarian'|'coordinator',body:Record<string,unknown>)=>{setState(s=>applyCareCommand(s,{uid:role==='parent'?'fixture-parent':`fixture-${role}`,role},body,config,Date.now()));};
  return <main className="mx-auto max-w-3xl p-4 text-white"><p className="rounded-xl border border-[#fec708] p-3 text-sm">LOCAL TEST FIXTURE · No patient records, bookings, money or messages. Illustrative test rewards are not approved commercial benefits.</p>
    <div className="mt-3 flex flex-wrap gap-2">
      <button className={careButton} onClick={()=>{run('veterinarian',{type:'approve',id:crypto.randomUUID(),petId,title:'Fixture follow-up',instructions:'Follow the instructions recorded by the fixture veterinarian.',sourceRef:'fixture-record',windowStart:Date.now(),dueAt:Date.now()+86400000,reminderAt:Date.now(),ruleId:'fixture'});setNotice('Test veterinarian approved a recorded milestone.');}}>Fixture: vet approves milestone</button>
      <button className={careButton} disabled={!state.milestones.some(m=>m.status==='approved')} onClick={()=>{const m=state.milestones.find(m=>m.status==='approved')!;run('coordinator',{type:'complete',petId:m.petId,milestoneId:m.id,evidence:`fixture-line-${m.id}`,completedAt:Date.now()});setNotice('Test staff verified performed care.');}}>Fixture: staff verifies completion</button>
    </div>
    {notice&&<p role="status" className="mt-3">{notice}</p>}
    <CareReviewProvider value={{state,role:'parent',config,loading:false,error:'',petId,setPetId,refresh:async()=>{},command:async body=>run('parent',{...body,petId:body.petId||petId})}}><CareWorkflow/></CareReviewProvider>
  </main>;
}
if (import.meta.env.DEV) createRoot(document.getElementById('root')!).render(<BrowserRouter><Review/></BrowserRouter>);

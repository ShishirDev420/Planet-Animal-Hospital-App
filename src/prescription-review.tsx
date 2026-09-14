import { BrowserRouter } from 'react-router-dom';
import { useCallback, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import CareWorkflow, { careButton } from './components/CareWorkflow';
import StaffPrescriptions from './components/StaffPrescriptions';
import { CareReviewProvider } from './lib/care/client';
import { applyCareCommand, emptyState, type CareState } from './lib/care/domain';
import { blankTranscript, prescriptionQueue } from './lib/care/prescriptions';
import './index.css';
const config={version:'fixture',approvedBy:'fixture-manager',workflowName:'Synthetic only',rules:{fixture:{points:40,creditPaise:1000}}};
const sourceSvg='<svg xmlns="http://www.w3.org/2000/svg" width="480" height="240"><rect width="480" height="240" fill="white"/><g fill="black" font-family="sans-serif" font-size="20"><text x="20" y="35">SYNTHETIC SOURCE - NOT CLINICAL</text><text x="20" y="75">Pet: Fixture Pet</text><text x="20" y="115">Medication: [illegible]</text><text x="20" y="155">Return for recorded review.</text><text x="20" y="195">Follow-up date: not written</text></g></svg>';
const source=async()=>new Blob([sourceSvg],{type:'image/svg+xml'});
function Review() {
  const [state,setState]=useState(()=>{const s=emptyState('fixture-parent','Fixture Pet');s.pets.push({id:'second',name:'Second Fixture Pet'});return s;});
  const current=useRef(state);current.current=state;
  const [petId,setPetId]=useState('primary'),[role,setRole]=useState<'parent'|'veterinarian'>('parent'),[fail,setFail]=useState(false),[reduced,setReduced]=useState(false),[notice,setNotice]=useState('');
  const failRef=useRef(fail);failRef.current=fail;
  const request=useCallback(async(body?:Record<string,unknown>,_query?:string,progress?:(n:number)=>void)=>{
    if(!body)return{retentionDays:30,ocrConfigured:true};
    if(failRef.current)throw Error('Synthetic upload failure. Turn failure off and retry.');
    if(body.type==='delete'){setState(s=>applyCareCommand(s,{uid:s.ownerUid,role:'parent'},{type:'deletePrescription',prescriptionId:body.prescriptionId,expectedRevision:body.expectedRevision},config,Date.now()));return{deleted:true};}
    progress?.(100);
    const existing=current.current.prescriptions?.[0];if(existing)return{prescriptionId:existing.id,duplicate:true};
    const transcript=blankTranscript();transcript.petName={value:'Fixture Pet',sourceQuote:'Pet: Fixture Pet',confidence:'high'};transcript.instructions={value:'Return for recorded review.',sourceQuote:'Return for recorded review.',confidence:'high'};
    setState(s=>{const next=structuredClone(s),now=Date.now();const rx={id:'synthetic-source',petId:String(body.petId),hash:'a'.repeat(64),objectPath:'fixture-only',mime:'image/png',createdAt:now,expiresAt:now+30*86400000,consentAt:now,status:'review' as const,extraction:transcript,provider:'synthetic fixture; no OCR call',ocrStatus:'ready' as const,versions:[],revision:2};next.prescriptions=[rx];prescriptionQueue(next,rx,now);next.revision++;return next;});
    return{prescriptionId:'synthetic-source',duplicate:false,ocrStatus:'ready'};
  },[]);
  const act=async(body:Record<string,unknown>,actorRole:'parent'|'veterinarian'|'coordinator'=role)=>{
    try{const next=applyCareCommand(current.current,{uid:actorRole==='parent'?'fixture-parent':`fixture-${actorRole}`,role:actorRole},body,config,Date.now());current.current=next;setState(next);setNotice('Synthetic action saved.');}catch(e){setNotice((e as Error).message);throw e;}
  };
  return <MotionConfig reducedMotion={reduced?'always':'never'}><main className="mx-auto max-w-3xl p-3 text-white"><p className="rounded-xl border border-[#fec708] p-3 text-sm">LOCAL SYNTHETIC FIXTURE · No patient writes, actual OCR, bookings, money or messages. Upload and source adapters are test doubles. Reload resets everything.</p><div className="my-3 flex flex-wrap gap-2"><button className={careButton} onClick={()=>setRole(role==='parent'?'veterinarian':'parent')}>{role==='parent'?'Open fixture staff review':'Return to fixture parent'}</button><label className="text-sm"><input type="checkbox" checked={fail} onChange={e=>setFail(e.target.checked)}/>Simulate upload failure</label><label className="text-sm"><input type="checkbox" checked={reduced} onChange={e=>setReduced(e.target.checked)}/>Reduced motion fixture</label><button className={careButton} disabled={!state.milestones.some(m=>m.status==='approved')} onClick={()=>{const m=state.milestones.find(m=>m.status==='approved')!;void act({type:'complete',petId:m.petId,milestoneId:m.id,evidence:'fixture-service-line',completedAt:Date.now()},'coordinator').catch(()=>{});}}>Fixture staff verifies completion</button></div><p role="status" className="text-sm">{notice} {state.milestones.length} milestones · {state.ledger.length} awards</p>
    <CareReviewProvider value={{state,petId,setPetId,role:'parent',config,loading:false,error:'',refresh:async()=>{},command:body=>act({...body,petId:body.petId||petId},'parent')}}>{role==='parent'?<CareWorkflow prescriptionServices={{request,source}}/>:<StaffPrescriptions state={state} config={config} role="veterinarian" busy={false} act={body=>act(body).catch(()=>{})} source={source}/>}</CareReviewProvider></main></MotionConfig>;
}
if(import.meta.env.DEV) {
  const width=Number(new URLSearchParams(location.search).get('reviewWidth'));
  const root=createRoot(document.getElementById('root')!);
  root.render(<BrowserRouter>{[320,768].includes(width)?<main><p className="p-3 text-white">Synthetic review · {width}px contained viewport</p><iframe id="fixture-viewport" title={`${width}px prescription review`} src="/prescription-review.html" style={{width,height:900,border:0}}/></main>:<Review/>}</BrowserRouter>);
  import.meta.hot?.dispose(()=>root.unmount());
}

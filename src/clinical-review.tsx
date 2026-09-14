// Isolated synthetic review entry. Not imported by any production route.
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import ClinicalCare, { ClinicalReview, type clinicalRequest } from './components/ClinicalCare';
import { CareReviewProvider } from './lib/care/client';
import { emptyState } from './lib/care/domain';
import { EMPTY_DETAILS, reviewAnalysis, visibleAnalysis, type ClinicalAnalysis } from './lib/care/clinical';
import './index.css';
const state=emptyState('synthetic-parent','Milo — synthetic dog');
state.pets.push({id:'second',name:'Luna — synthetic cat'});
let profile={...EMPTY_DETAILS,species:'Dog',breed:'Labrador',age:'6 years',weight:'28 kg'};
let analysis:ClinicalAnalysis={id:'synthetic-analysis',petId:'primary',tier:'advanced',revision:1,status:'draft',sourceHash:'synthetic-hash',requestedAt:Date.now(),requestedBy:'synthetic-parent',provider:'synthetic',model:'no-provider-call',content:{summary:'Synthetic draft: the veterinarian should compare Milo’s recorded profile with the current clinical record.',sections:[{title:'Record completeness',observation:'The synthetic record has no allergy history or recent examination. These remain unknown.',basis:'recorded',sourceIds:['profile']}],suggestedCheckups:[{title:'Synthetic checkup proposal',rationale:'For review testing only; the veterinarian must decide whether it is appropriate.',sourceIds:['profile']}],uncertainties:['No clinical research was performed.']}};
function Review() {
  const [petId,setPetId]=useState('primary'),[mode,setMode]=useState('parent'),[version,setVersion]=useState(0);
  const service:typeof clinicalRequest=async(owner,pet,body)=>{
    if(body?.action==='profile')profile=body.profile as typeof profile;
    if(body?.action==='generate')return {message:'Synthetic analysis queued for veterinarian review.'};
    if(body&&['approve','edit','reject'].includes(String(body.action)))analysis=reviewAnalysis(analysis,{uid:'synthetic-vet',role:'veterinarian'},body.action as any,Number(body.revision),'synthetic-hash',body.content,body.note,['profile'],Date.now());
    return {profile,revision:1,tier:'advanced',configured:true,analyses:pet==='primary'?[visibleAnalysis(analysis,mode==='vet'?'veterinarian':'parent','synthetic-hash')]:[]};
  };
  return <main className="min-h-screen bg-[#071912] p-4 text-white"><p className="mb-4 text-sm">Synthetic review only — no provider, patient or billing activity.</p><div className="mb-4 flex flex-wrap gap-3"><button className="rounded-lg border p-3" onClick={()=>{setMode(m=>m==='parent'?'vet':'parent');setVersion(v=>v+1);}}>{mode==='parent'?'Open synthetic veterinarian review':'Open synthetic parent view'}</button><button className="rounded-lg border p-3" onClick={()=>setPetId(p=>p==='primary'?'second':'primary')}>Switch synthetic pet</button></div><CareReviewProvider value={{state,petId,setPetId,role:mode==='vet'?'veterinarian':'parent',config:null,loading:false,error:'',refresh:async()=>{},command:async()=>{}}}><div key={`${mode}:${version}`}>{mode==='parent'?<ClinicalCare requestService={service}/>:<ClinicalReview ownerUid={state.ownerUid} petId={petId} requestService={service}/>}</div></CareReviewProvider></main>;
}
createRoot(document.getElementById('root')!).render(<Review/>);

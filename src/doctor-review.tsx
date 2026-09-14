// Development-only synthetic entry, not included in the production bundle.
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { DoctorSession } from './pages/DoctorPortal';
import { emptyState } from './lib/care/domain';
import { clinicalContext, EMPTY_DETAILS, reviewAnalysis, type ClinicalAnalysis } from './lib/care/clinical';
import './index.css';
const state=emptyState('synthetic-parent','Milo · synthetic dog');
state.pets.push({id:'second',name:'Luna · synthetic cat'});
const profile={...EMPTY_DETAILS,species:'Dog',breed:'Labrador',age:'6 years'};
let analysis:ClinicalAnalysis={id:'synthetic-draft',petId:'primary',tier:'advanced',revision:1,status:'draft',sourceHash:'fixture',requestedAt:1,requestedBy:'synthetic-parent',provider:'synthetic',model:'no-provider-call',content:{summary:'Synthetic review only. No patient or provider activity.',sections:[{title:'Missing history',observation:'The test record has no verified allergy history.',basis:'recorded',sourceIds:['profile']}],suggestedCheckups:[],uncertainties:['Synthetic fixture only.']}};
createRoot(document.getElementById('root')!).render(<BrowserRouter><p className="bg-yellow-300 p-3 text-black">Synthetic doctor review · no real patients, AI calls or billing changes.</p><DoctorSession signedIn patientService={async()=>({role:'veterinarian',patients:[{ownerUid:state.ownerUid,tier:'advanced',pets:state.pets.map(p=>({...p,awaitingReview:p.id==='primary'&&analysis.status==='draft'?1:0,latestStatus:p.id==='primary'?analysis.status:'No analysis requested'}))}],nextCursor:null})} careService={async body=>{if(body)throw Error('Synthetic fixture: recorded-care writes disabled.');return {role:'veterinarian',state,config:null};}} clinicalService={async(_owner,pet,body)=>{if(body)analysis=reviewAnalysis(analysis,{uid:'synthetic-vet',role:'veterinarian'},body.action as any,Number(body.revision),'fixture',body.content,body.note,['profile'],Date.now());return {profile,revision:1,tier:'advanced',configured:false,sources:clinicalContext(state,pet,pet==='primary'?profile:{...EMPTY_DETAILS,species:'Cat'},Date.now()),analyses:pet==='primary'?[analysis]:[]};}}/></BrowserRouter>);

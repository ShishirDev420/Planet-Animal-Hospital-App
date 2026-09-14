import { useEffect, useRef, useState } from 'react';
import planetLogo from '../assets/planet-logo.png';
import { Link, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { isPreviewDemoMode } from '../lib/demoMode';
import { requestCareJson } from '../lib/care/request';
import { careRequest } from '../lib/care/client';
import { ANALYSIS_DEPTH, type ClinicalTier } from '../lib/care/clinical';
import type { CareState, PilotConfig } from '../lib/care/domain';
import { ClinicalReview, clinicalRequest } from '../components/ClinicalCare';
import StaffPrescriptions from '../components/StaffPrescriptions';
import { careButton, careInput } from '../components/CareWorkflow';

type Patient = { ownerUid: string; tier: ClinicalTier | null; pets: { id: string; name: string; awaitingReview: number; latestStatus: string }[] };
export default function DoctorPortal() {
  const [session,setSession]=useState(auth.currentUser?.uid||'');
  const location=useLocation();
  useEffect(()=>onAuthStateChanged(auth,user=>setSession(user?.uid||'')),[]);
  if(isPreviewDemoMode(location.search,location.pathname)) return <main className="min-h-screen bg-[#071912] p-8 text-white"><h1 className="text-3xl font-bold">Doctor portal</h1><p className="mt-4">Visual preview only. Open the main app and sign in with a verified veterinarian account to review patient records.</p></main>;
  return <DoctorSession key={session} signedIn={!!session}/>;
}
async function patientRequest(next?:string) {
  const user=auth.currentUser;if(!user)throw Error('Sign in to open the doctor portal.');
  const data=await requestCareJson('/api/clinical?view=patients'+(next?'&cursor='+encodeURIComponent(next):''),{headers:{Authorization:`Bearer ${await user.getIdToken()}`}});
  if(auth.currentUser?.uid!==user.uid)throw Error('Account changed. Reopen the doctor portal.');return data;
}
export function DoctorSession({signedIn,patientService=patientRequest,careService=careRequest,clinicalService=clinicalRequest}:{signedIn:boolean;patientService?:typeof patientRequest;careService?:typeof careRequest;clinicalService?:typeof clinicalRequest}) {
  const [patients,setPatients]=useState<Patient[]>([]),[cursor,setCursor]=useState<string|null>(null),[allowed,setAllowed]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [record,setRecord]=useState<CareState|null>(null),[config,setConfig]=useState<PilotConfig|null>(null),[petId,setPetId]=useState(''),[lookup,setLookup]=useState('');
  const sequence=useRef(0),alive=useRef(true);
  const queue=async(next?:string)=>{if(!signedIn)return;try{const d=await patientService(next);if(!alive.current)return;setAllowed(true);setPatients(d.patients);setCursor(d.nextCursor);setError('');}catch(e){if(alive.current){setAllowed(false);setPatients([]);setRecord(null);setError((e as Error).message);}}};
  useEffect(()=>{alive.current=true;void queue();return()=>{alive.current=false;sequence.current++;};},[]);
  const open=async(ownerUid:string,selectedPet?:string)=>{const seq=++sequence.current;setRecord(null);setBusy(true);try{const d=await careService(undefined,'?ownerUid='+encodeURIComponent(ownerUid));if(d.role!=='veterinarian')throw Error('Verified veterinarian access is required.');if(!alive.current||seq!==sequence.current)return;setRecord(d.state);setConfig(d.config);setPetId(selectedPet||d.state.pets[0]?.id||'');setError('');}catch(e){if(alive.current&&seq===sequence.current)setError((e as Error).message);}finally{if(alive.current&&seq===sequence.current)setBusy(false);}};
  const act=async(body:Record<string,unknown>)=>{if(!record)return;setBusy(true);try{await careService({...body,ownerUid:record.ownerUid});await open(record.ownerUid,petId);await queue();}catch(e){if(alive.current)setError((e as Error).message);}finally{if(alive.current)setBusy(false);}};
  const pet=record?.pets.find(p=>p.id===petId);
  return <main className="min-h-screen bg-[#071912] px-4 py-8 text-white sm:px-8"><div className="mx-auto max-w-6xl">
    <nav className="flex flex-wrap gap-5 text-sm text-[#fec708]"><Link to="/">Parent app / sign in</Link><Link to="/staff">Care team workspace</Link></nav>
    <header className="my-8"><img src={planetLogo} alt="Planet Animal Hospital" className="mb-5 h-auto w-20 object-contain"/><p className="text-xs uppercase tracking-[.2em] text-[#fec708]">Planet Animal Hospital</p><h1 className="mt-3 font-heading text-4xl font-semibold">Doctor portal</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70">Review the patient record, assess AI suggestions and publish your care guidance. Your approved current version appears in the parent’s roadmap.</p></header>
    {!signedIn&&<p className="rounded-2xl border border-white/15 p-5">Sign in through the parent app, then return here. Access requires the clinic’s verified veterinarian role.</p>}
    {error&&<p role="alert" className="my-4 rounded-xl border border-[#fec708]/40 p-4">{error}</p>}
    {signedIn&&!allowed&&<button className={careButton} onClick={()=>void queue()}>Check doctor access</button>}
    {allowed&&<div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]"><aside className="min-w-0 rounded-2xl border border-white/15 bg-black/20 p-4"><h2 className="text-xl font-semibold">Patients & reviews</h2><p className="mt-2 text-xs text-white/60">Ten parent accounts per page. Review counts cover this page only.</p><button className="my-3 text-sm text-[#fec708] underline" onClick={()=>void queue()}>Refresh patients</button>
      <div className="space-y-3">{patients.flatMap(p=>p.pets.map(pet=><button key={p.ownerUid+pet.id} disabled={busy} aria-pressed={record?.ownerUid===p.ownerUid&&petId===pet.id} onClick={()=>void open(p.ownerUid,pet.id)} className="w-full rounded-xl border border-white/15 p-3 text-left aria-pressed:border-[#fec708]"><strong>{pet.name}</strong><span className="mt-1 block text-xs text-white/65">{p.tier?ANALYSIS_DEPTH[p.tier].name:'No verified active plan'}</span><span className="mt-2 block text-sm">{pet.awaitingReview?`${pet.awaitingReview} awaiting review`:pet.latestStatus}</span></button>))}</div>{!patients.length&&<p className="text-sm">No care accounts on this page.</p>}{cursor&&<button className={`${careButton} mt-4`} onClick={()=>void queue(cursor)}>Next accounts</button>}
      <form className="mt-5 border-t border-white/15 pt-4" onSubmit={e=>{e.preventDefault();void open(lookup);}}><label className="text-xs">Open a parent account by UID<input className={`${careInput} mt-2`} required value={lookup} onChange={e=>setLookup(e.target.value)}/></label><button disabled={busy} className={`${careButton} mt-3`}>Open record</button></form>
    </aside><section className="min-w-0">{busy&&<p role="status">Loading / saving care record…</p>}{!record&&!busy&&<div className="rounded-2xl border border-white/15 p-8"><h2 className="text-xl font-semibold">Select a patient</h2><p className="mt-3 text-sm text-white/65">Open a pet to compare current sources, review analysis and approve follow-up care.</p></div>}
      {record&&pet&&<><h2 className="text-2xl font-bold">{pet.name}</h2><p className="mt-2 break-all text-xs text-white/60">Parent account {record.ownerUid} · Pet {pet.id}</p><ClinicalReview key={record.ownerUid+petId} ownerUid={record.ownerUid} petId={petId} requestService={clinicalService} onReviewed={()=>void queue()}/>
      <details className="mt-5 rounded-2xl border border-white/15 p-5"><summary className="font-semibold">Prescription review and recorded follow-up steps</summary><StaffPrescriptions state={{...record,pets:[pet],prescriptions:record.prescriptions?.filter(p=>p.petId===petId)}} config={config} role="veterinarian" busy={busy} act={act}/></details>
      <section className="mt-5 rounded-2xl border border-white/15 p-5"><h3 className="text-lg font-semibold">Parent roadmap · recorded steps</h3><p className="mt-2 text-sm text-white/65">Analysis approval publishes reviewed guidance. Add a dated step only after you establish clinical instructions and its record reference. Booking and rewards require separate verification.</p>{record.milestones.filter(m=>m.petId===petId).map(m=><article className="mt-4 border-t border-white/15 pt-3" key={m.id}><h4 className="font-semibold">{m.title} · {m.status}</h4><p className="mt-2 whitespace-pre-wrap text-sm">{m.instructions}</p><p className="mt-2 text-xs text-white/60">{m.dueAt?new Date(m.dueAt).toLocaleString():'Date not recorded'} · {m.sourceRef}</p></article>)}
      <form className="mt-5 space-y-3" onSubmit={e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.currentTarget));void act({type:'approve',petId,id:f.id,title:f.title,instructions:f.instructions,sourceRef:f.sourceRef,ruleId:f.ruleId,windowStart:null,dueAt:f.dueAt?new Date(String(f.dueAt)).getTime():null,reminderAt:null});}}><h4 className="font-semibold">Approve a recorded follow-up</h4>{[['id','Stable clinical step ID'],['title','Step title'],['sourceRef','Clinical record reference']].map(([name,label])=><label key={name} className="block text-sm">{label}<input className={careInput} name={name} required maxLength={name==='id'?128:160}/></label>)}<label className="block text-sm">Approved instructions<textarea className={careInput} name="instructions" required/></label><label className="block text-sm">Clinically approved date (leave blank if unknown)<input className={careInput} name="dueAt" type="datetime-local"/></label><label className="block text-sm">Existing clinic reward rule<select name="ruleId" required className={careInput}><option value="">Choose verified eligibility</option>{Object.entries(config?.rules||{}).map(([id,r])=><option key={id} value={id}>{id} · {r.points} points</option>)}</select></label><button disabled={busy||!config} className={careButton}>Approve recorded step for roadmap</button></form>
      </section></>}
    </section></div>}
  </div></main>;
}

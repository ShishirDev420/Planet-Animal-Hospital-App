import { useState } from 'react';
import { useCare } from '../lib/care/client';
import { careButton, careInput } from './CareWorkflow';
export default function PetHistory() {
  const {state,petId,command}=useCare(),pet=state?.pets.find(p=>p.id===petId);
  const [value,setValue]=useState({breed:pet?.history?.breed||'',allergies:pet?.history?.allergies||'',surgeries:pet?.history?.surgeries||'',conditions:pet?.history?.conditions||''});
  const [consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
  if(!pet)return null;
  return <details className="mt-4 text-sm"><summary>About {pet.name} · parent-reported history</summary><p className="mt-2 text-xs text-white/65">Shared with the care team. These details do not create treatment, dates or rewards. Leave optional history blank if unknown.</p><form className="mt-3 space-y-3" onSubmit={async e=>{e.preventDefault();setBusy(true);try{await command({type:'history',petId,...value,consent});setNotice('Parent-reported history saved.');}catch(e){setNotice((e as Error).message);}finally{setBusy(false);}}}>{Object.entries({breed:'Breed (or unknown / mixed)',allergies:'Allergies (optional)',surgeries:'Past surgeries (optional)',conditions:'Chronic conditions (optional)'}).map(([key,label])=><label key={key} className="block">{label}<input className={careInput} value={value[key as keyof typeof value]} required={key==='breed'} maxLength={key==='breed'?100:600} onChange={e=>setValue({...value,[key]:e.target.value})}/></label>)}<label className="flex gap-2"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>Share these parent-reported details with my care team.</label><button className={careButton} disabled={busy||!consent}>Save history</button>{notice&&<p role="status">{notice}</p>}</form></details>;
}

import { requestCareJson } from '../lib/care/request';
import { useEffect, useRef, useState } from 'react';
import { auth } from '../lib/firebase';
import { useCare } from '../lib/care/client';
import { EDUCATION, type AssistantDraft } from '../lib/care/assistant';
const input='w-full min-w-0 rounded-xl border border-white/20 bg-black/20 px-3 py-3 text-sm text-white';
export async function assistantRequest(body?:Record<string,unknown>) {
  const user=auth.currentUser;if(!user)throw new Error('Sign in for your free assistant allowance.');
  const data=await requestCareJson('/api/assistant',{method:body?'POST':'GET',headers:{Authorization:`Bearer ${await user.getIdToken()}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})},{timeoutMs:35000});
  if(auth.currentUser?.uid!==user.uid)throw new Error('Account changed. Reopen the assistant.');
  return data;
}
export default function CareAssistant({agent='pritpawl',requestService=assistantRequest}:{agent?:'pawl'|'pawlina'|'pritpawl';requestService?:typeof assistantRequest}) {
  const care=useCare();
  // Parent key remounts this private workspace on account/pet/agent changes.
  return <AssistantSession key={`${care.state?.ownerUid}:${care.petId}:${agent}`} agent={agent} requestService={requestService}/>;
}
function AssistantSession({agent,requestService}:{agent:string;requestService:typeof assistantRequest}) {
  const care=useCare();const [prompt,setPrompt]=useState(''),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[answer,setAnswer]=useState<AssistantDraft|null>(null),[remaining,setRemaining]=useState<any>(null),[availability,setAvailability]=useState('Checking free assistant availability…');
  const request=useRef({prompt:'',id:''}),mounted=useRef(true);
  useEffect(()=>{mounted.current=true;void requestService().then(d=>{if(mounted.current)setRemaining(d.allowance);}).catch(e=>{if(mounted.current)setAvailability(e.message);});return()=>{mounted.current=false;};},[]);
  const ask=async()=>{if(busy||!consent||!prompt.trim())return;setBusy(true);setError('');if(request.current.prompt!==prompt)request.current={prompt,id:crypto.randomUUID()};try{const d=await requestService({agent,petId:care.petId,prompt,requestId:request.current.id,consent,adult:true});if(mounted.current){setAnswer(d.draft);setRemaining(d.allowance);}}catch(e){if(mounted.current)setError((e as Error).message);}finally{if(mounted.current)setBusy(false);}};
  return <section aria-label={`${agent} AI discussion`} className="liquid-glass relative rounded-[2rem] border border-white/10 p-5 text-white min-w-0">
    <p className="cinematic-kicker">{agent} · AI care discussion</p><h2 className="cinematic-card-title text-2xl mt-2">Understand the next step.</h2>
    <p className="mt-3 text-sm text-white/75">Get help organizing the selected pet’s records and preparing questions about missing details or appointments. Clinical advice comes from your veterinarian.</p>
    <p className="mt-3 text-xs text-planet-yellow" role="status">{remaining?`${remaining.dailyRemaining} of ${remaining.dailyLimit} free requests left today · ${remaining.monthlyRemaining} of ${remaining.monthlyLimit} this month. Resets at UTC boundaries.`:availability}</p>
    {!care.state && <p className="mt-3 text-xs text-white/70">Record-based AI discussion needs your signed-in care workspace. Free general guides on Roadmap remain available.</p>}
    <label className="block text-sm mt-4">Your question<textarea className={`${input} mt-2`} rows={3} maxLength={2000} value={prompt} onChange={e=>setPrompt(e.target.value)}/></label>
    <label className="flex gap-3 text-xs leading-relaxed mt-3"><input type="checkbox" className="shrink-0 mt-1" checked={consent} onChange={e=>setConsent(e.target.checked)}/>I am 18 or older. Send this question, selected pet history, recorded instructions and prescription text to the hospital’s configured Gemini service. Images are not sent by this chat. AI discussion drafts are kept for seven days, with deletion processing after expiry; they are not clinical approval.</label>
    <button onClick={()=>void ask()} disabled={!care.state||busy||!consent||!prompt.trim()} className="mt-4 rounded-xl bg-planet-yellow text-black px-5 py-3 font-semibold disabled:opacity-40">{busy?'Preparing an answer…':error?'Retry this question':'Ask '+agent}</button>
    {error&&<div><p role="alert" className="mt-3 text-sm text-planet-yellow">{error}</p><button disabled={busy||!consent||!prompt.trim()} className="mt-2 text-xs underline" onClick={()=>{request.current={prompt:"",id:""};void ask();}}>Start a new request (uses your allowance)</button></div>}
    {answer&&<div className="mt-5 border-t border-white/15 pt-4 space-y-3"><h3 className="font-semibold">AI discussion draft · needs veterinary review</h3><p className="text-sm leading-relaxed whitespace-pre-wrap">{answer.summary}</p><h4 className="text-sm font-semibold">Questions to discuss with your veterinarian</h4><ul className="space-y-3 text-sm">{answer.discussionTopics.map((t,i)=><li key={i}>{t.question}{t.sourceId&&<a className="block mt-1 text-planet-yellow underline" href={EDUCATION.find(s=>s.id===t.sourceId)?.url} target="_blank" rel="noopener noreferrer">General veterinary guidance (opens a new tab)</a>}</li>)}</ul>{answer.uncertainty.map((u,i)=><p className="text-xs text-planet-yellow" key={i}>{u}</p>)}<p className="text-xs text-white/65">No treatment, date, appointment or reward has been approved or changed by this answer. Follow your veterinarian’s recorded instructions.</p></div>}
  </section>;
}

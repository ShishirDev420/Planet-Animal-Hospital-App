import ClinicalCare from '../components/ClinicalCare';
import ApprovedAdviceSpeech from '../components/ApprovedAdviceSpeech';
import Logo from '../components/Logo';
import CareWorkflow from '../components/CareWorkflow';
import CareAssistant from '../components/CareAssistant';
import GeneralCareGuide from '../components/GeneralCareGuide';
import CareRewardCards from '../components/CareRewardCards';
import { useCare } from '../lib/care/client';

export default function Roadmap() {
  const {state,petId}=useCare();
  const steps=state?.milestones.filter(m=>m.petId===petId&&m.status!=='exempt')||[];
  return <div className="relative w-full px-5 pt-6 pb-28 text-white max-w-6xl mx-auto">
    <header className="relative z-10 flex items-center gap-3 mb-6"><Logo className="!h-11 !w-11 shrink-0"/><div><p className="cinematic-kicker">Pritpawl · Your care roadmap</p><h1 className="cinematic-card-title text-2xl">One record. A clear next step.</h1></div></header>
    <p className="text-sm text-white/75 mb-5">Your veterinarian’s recorded instructions stay separate from AI discussion drafts. Missing dates remain unrecorded.</p>
    <div className="space-y-4 mb-5">{steps.map(m=><article key={m.id} className="rounded-2xl border border-white/10 bg-black/20 p-5"><p className="text-xs text-planet-yellow">{m.status==='completed'?'Staff-verified completion':'Veterinarian-approved record'}</p><h2 className="cinematic-card-title text-xl mt-2">{m.title}</h2><p className="text-sm leading-relaxed mt-2 whitespace-pre-wrap">{m.instructions}</p><p className="text-xs text-white/65 mt-3">Source: {m.sourceRef} · Follow-up: {m.dueAt?new Date(m.dueAt).toLocaleString():'not recorded'}</p></article>)}</div>
    <CareRewardCards/><GeneralCareGuide key={`${state?.ownerUid}:${petId}`}/><ClinicalCare renderSpeech={props=><ApprovedAdviceSpeech {...props}/>}/><CareAssistant/><CareWorkflow/>
  </div>;
}

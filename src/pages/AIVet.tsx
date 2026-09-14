import ClinicalCare from '../components/ClinicalCare';
import ApprovedAdviceSpeech from '../components/ApprovedAdviceSpeech';
import Logo from '../components/Logo';
import CareAssistant from '../components/CareAssistant';
import CareWorkflow from '../components/CareWorkflow';
import { CLINIC_TEL_URL } from '../lib/pawPoints';
export default function AIVet() {
  return <div className="relative min-h-screen max-w-6xl mx-auto px-5 pt-6 pb-28 text-white">
    <header className="flex items-center gap-3 mb-6"><Logo className="!h-12 !w-12"/><div><p className="cinematic-kicker">Planet Animal Hospital</p><h1 className="cinematic-card-title text-2xl">Your care assistant</h1></div></header>
    <p className="text-sm text-white/75 mb-5">Pritpawl helps organize your records. The hospital reviews clinical questions and approves your care plan.</p>
    <ClinicalCare renderSpeech={props=><ApprovedAdviceSpeech {...props}/>}/><CareAssistant/><CareWorkflow/>
    <p className="text-sm mt-5">For urgent concerns, contact a veterinarian directly. <a className="text-planet-yellow underline" href={CLINIC_TEL_URL}>Call the hospital</a>. This app does not automatically call or alert the clinic.</p>
  </div>;
}

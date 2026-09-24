import { ArrowLeft, HeartPulse, ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import CareAssistant from '../components/CareAssistant';
import Logo from '../components/Logo';
import { CLINIC_TEL_URL } from '../lib/pawPoints';
import './ai-vet.css';

export default function AIVet() {
  const navigate = useNavigate();
  const location = useLocation();
  return <main className="ai-vet-page mx-auto max-w-5xl px-4 pb-32 pt-5 text-white sm:px-6 lg:pt-10">
    <header className="ai-vet-header"><button type="button" onClick={() => navigate({ pathname: '/', search: location.search })} aria-label="Back to overview"><ArrowLeft size={19}/></button><Logo className="!h-12 !w-12"/><div><span>Planet Animal Hospital</span><h1>Ask about your pet</h1></div></header>
    <div className="ai-vet-intro"><div><span className="ai-vet-eyebrow">A calmer way to prepare for care</span><h2>Questions, with <em>your pet</em> in mind.</h2><p>Ask about recorded care. Your veterinarian makes clinical decisions.</p></div><div className="ai-vet-intro-mark" aria-hidden="true"><HeartPulse size={54} strokeWidth={1.4}/></div></div>
    <CareAssistant/>
    <aside className="ai-vet-safety"><ShieldCheck size={21}/><p>For urgent concerns, <a href={CLINIC_TEL_URL}>call the hospital</a> or contact a veterinarian directly. This chat does not notify the clinic.</p></aside>
  </main>;
}

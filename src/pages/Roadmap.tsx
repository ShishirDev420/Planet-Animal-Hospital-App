import ClinicalCare from '../components/ClinicalCare';
import RoadmapProgress from '../components/RoadmapProgress';
import ApprovedAdviceSpeech from '../components/ApprovedAdviceSpeech';
import Logo from '../components/Logo';
import CareWorkflow from '../components/CareWorkflow';
import CareAssistant from '../components/CareAssistant';
import GeneralCareGuide from '../components/GeneralCareGuide';
import CareRewardCards from '../components/CareRewardCards';
import { useCare } from '../lib/care/client';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, MessageCircleMore, Check } from 'lucide-react';
import './roadmap.css';

export default function Roadmap() {
  const {state,petId}=useCare();
  const location=useLocation();
  const steps=state?.milestones.filter(m=>m.petId===petId&&m.status!=='exempt')||[];
  return <div className="roadmap-page">
    <header className="roadmap-header">
      <div className="roadmap-brandline"><Logo className="!h-10 !w-10 shrink-0"/><span>Pritpawl · Your care companion</span></div>
      <div className="roadmap-heading-row"><div><h1>Health roadmap</h1><p>One record. A clear next step.</p></div><div className="roadmap-header-actions"><a href="#roadmap-conversation"><MessageCircleMore size={17}/>Ask about care</a><Link to={{pathname:'/records',search:location.search}}>Health records<ArrowUpRight size={16}/></Link></div></div>
    </header>
    <div className="roadmap-overview"><div className="roadmap-recorded"><RoadmapProgress/>
      {steps.length>0 && <section className="roadmap-milestones" aria-label="Recorded care milestones"><div className="roadmap-section-label"><span>From your care record</span><span>{steps.length} steps</span></div>{steps.map((m,index)=><article key={m.id} className="roadmap-milestone"><span className={`roadmap-step-marker ${m.status==='completed'?'is-complete':''}`} aria-hidden="true">{m.status==='completed'?<Check size={15}/>:String(index+1).padStart(2,'0')}</span><div><p className="roadmap-step-status">{m.status==='completed'?'Staff-verified completion':'Veterinarian-approved record'}</p><h2>{m.title}</h2><p className="roadmap-step-instructions">{m.instructions}</p><p className="roadmap-step-source">Source: {m.sourceRef}<br/>Follow-up: {m.dueAt?new Date(m.dueAt).toLocaleString():'not recorded'}</p></div></article>)}</section>}
    </div><GeneralCareGuide key={`${state?.ownerUid}:${petId}`}/></div>
    <div className="roadmap-record-extras"><CareRewardCards/><ClinicalCare renderSpeech={props=><ApprovedAdviceSpeech {...props}/>}/></div>
    <section id="roadmap-conversation" className="roadmap-conversation-section" aria-labelledby="roadmap-conversation-heading"><div className="roadmap-section-heading"><div><span>Make sense of your next visit</span><h2 id="roadmap-conversation-heading">A little clarity, together.</h2></div><p>Questions about recorded care, with your pet in mind.</p></div><CareAssistant/></section>
    <div className="roadmap-clinic-section"><CareWorkflow/></div>
  </div>;
}

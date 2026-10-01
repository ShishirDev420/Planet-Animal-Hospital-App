import { motion, useReducedMotion } from 'framer-motion';
import { ClipboardList, RefreshCw, ArrowRight } from 'lucide-react';
import { useCare } from '../lib/care/client';
import './roadmap-progress.css';

export default function RoadmapProgress() {
  const { state, petId, loading, error, refresh } = useCare();
  const reduced = useReducedMotion();
  const ready = Boolean(state && petId && !loading && !error);
  const steps = ready ? state!.milestones.filter(step => step.petId === petId && step.status !== 'exempt') : [];
  const completed = steps.filter(step => step.status === 'completed').length;
  const next = steps.filter(step => step.status === 'approved').sort((a, b) => (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity))[0];
  const recorded = ready && steps.length > 0;
  const fraction = recorded ? completed / steps.length : 0;
  const finished = recorded && completed === steps.length;
  const transition = { duration: reduced || !recorded ? 0 : 1.4, ease: [.22, 1, .36, 1] as const };
  return <section aria-label="Health roadmap progress" aria-busy={loading} className="roadmap-progress">
    <div className="roadmap-progress-label"><span>Your care journey</span><ClipboardList size={20} aria-hidden="true"/></div>
    <div className="roadmap-progress-title"><h2>{recorded ? finished ? 'Every recorded step, complete.' : 'One step closer. Together.' : loading ? 'Loading your progress' : error ? 'Progress unavailable' : 'Your roadmap starts here'}</h2>{recorded&&<p className="roadmap-progress-percent">{Math.round(fraction*100)}<span>%</span></p>}</div>
    {recorded ? <div className="roadmap-progress-track"><div className="roadmap-progress-count"><span><strong>{completed} of {steps.length}</strong> care steps complete</span><span>{steps.length-completed} remaining</span></div><div key={petId} className="roadmap-progress-bar" role="progressbar" aria-label="Verified care completion" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={completed} aria-valuetext={`${completed} of ${steps.length} recorded care steps complete`}><motion.div data-roadmap-fill aria-hidden="true" initial={{scaleX:reduced?fraction:0}} animate={{scaleX:fraction}} transition={transition}/></div></div> : <p className="roadmap-progress-empty">{loading?'Checking your care record.':error?'Your recorded progress could not be loaded.':'Your veterinarian-approved steps will appear here.'}</p>}
    {recorded&&<div className="roadmap-next-step" aria-live="polite" aria-atomic="true"><span className="roadmap-next-icon" aria-hidden="true"><ArrowRight size={18}/></span><div><p>{next?'Next approved step':finished?'Up to date':'Your next step'}</p><h3>{next?next.title:finished?'All recorded steps completed':'No next approved step is recorded.'}</h3>{next&&<span>{next.dueAt!=null?`Recorded follow-up: ${new Date(next.dueAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}`:'Follow-up date not recorded'}</span>}</div></div>}
    {!loading&&error&&<button type="button" className="roadmap-retry" onClick={()=>void refresh()}><RefreshCw size={15}/>Try again</button>}
    <p className="roadmap-progress-note">{recorded?'Progress updates after the clinic verifies completed care.':'No progress has been assumed. General care guides remain available below.'}</p>
  </section>;
}

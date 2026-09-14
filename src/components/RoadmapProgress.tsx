import { motion, useReducedMotion } from 'framer-motion';
import { useCare } from '../lib/care/client';

export default function RoadmapProgress() {
  const { state, petId, loading, error } = useCare();
  const reduced = useReducedMotion();
  // Never turn a failed refresh or a pet switch into apparently current progress.
  const ready = Boolean(state && petId && !loading && !error);
  const steps = ready ? state!.milestones.filter(step => step.petId === petId && step.status !== 'exempt') : [];
  const completed = steps.filter(step => step.status === 'completed').length;
  const next = steps.filter(step => step.status === 'approved').sort((a, b) => (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity))[0];
  const recorded = ready && steps.length > 0;
  const fraction = recorded ? completed / steps.length : 0;
  const finished = recorded && completed === steps.length;
  const transition = { duration: reduced || !recorded ? 0 : 1.4, ease: [.22, 1, .36, 1] as const };

  return <section aria-label="Health roadmap progress" aria-busy={loading} className="relative mb-6 overflow-hidden rounded-[2rem] border border-white/15 bg-[#101e16] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_16px_40px_rgba(0,0,0,0.12)] sm:p-7">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_85%_0%,rgba(254,199,8,0.09),transparent_65%)]" />
    <div className="relative">
      <p className="text-sm font-medium text-planet-yellow">Your care journey</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <h2 className="max-w-[22ch] text-2xl font-semibold leading-tight text-white">{recorded ? finished ? 'Every recorded step, complete.' : 'One step closer. Together.' : loading ? 'Loading your progress' : error ? 'Progress unavailable' : 'Your roadmap starts here'}</h2>
        {recorded && <p className="shrink-0 text-4xl font-semibold tabular-nums tracking-tight text-[#ffe9a3]">{Math.round(fraction * 100)}<span className="ml-0.5 text-lg font-normal">%</span></p>}
      </div>
      {recorded && <p className="mt-3 text-sm text-white/75"><span className="font-semibold text-white">{completed} of {steps.length}</span> care steps complete</p>}

      <div className="my-6 rounded-2xl border border-white/10 bg-white/[0.035] px-4 pb-4 pt-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="mb-4 flex justify-between gap-2 text-xs text-white/70"><span>{recorded ? 'You are here' : 'Recorded care'}</span><span>{recorded ? `${steps.length - completed} remaining` : 'Awaiting records'}</span></div>
        <div key={petId} className="relative h-5 rounded-full border border-white/10 bg-black/30 shadow-[inset_0_2px_5px_rgba(0,0,0,0.4)]" role={recorded ? 'progressbar' : undefined} aria-label={recorded ? 'Verified care completion' : undefined} aria-valuemin={recorded ? 0 : undefined} aria-valuemax={recorded ? steps.length : undefined} aria-valuenow={recorded ? completed : undefined} aria-valuetext={recorded ? `${completed} of ${steps.length} recorded care steps complete` : undefined}>
          <motion.div data-roadmap-fill aria-hidden="true" className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-[#bc8b15] via-[#fec708] to-[#ffe9a3] shadow-[inset_0_1px_2px_rgba(255,255,255,0.7)]" initial={{ scaleX: reduced ? fraction : 0 }} animate={{ scaleX: fraction }} transition={transition} />
          {recorded && <motion.div data-roadmap-position aria-hidden="true" className="pointer-events-none absolute inset-0" initial={{ x: reduced ? `${fraction * 100}%` : '0%' }} animate={{ x: `${fraction * 100}%` }} transition={transition}>
            <span className="absolute -left-3 -top-1 h-7 w-7 rounded-full border border-[#fff4c9]/80 bg-[radial-gradient(circle_at_32%_25%,#fffdf1_0%,#ffe7a0_30%,#c39324_80%)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_2px_6px_rgba(0,0,0,0.4),0_0_14px_rgba(254,199,8,0.2)]" />
          </motion.div>}
        </div>
        <div aria-hidden="true" className="mt-3 flex justify-between text-[11px] text-white/55"><span>Start</span><span>Recorded steps complete</span></div>
      </div>

      <div className="border-t border-white/10 pt-4" aria-live="polite" aria-atomic="true">
        <p className="text-xs font-medium tracking-wide text-planet-yellow">{next ? 'NEXT APPROVED STEP' : finished ? 'UP TO DATE' : 'YOUR NEXT STEP'}</p>
        <p className="mt-2 break-words text-lg font-medium leading-snug text-white">{next ? next.title : finished ? 'All recorded steps completed' : loading ? 'Checking your care record…' : error ? 'Your recorded progress could not be loaded.' : recorded ? 'No next approved step is recorded.' : 'Your veterinarian-approved steps will appear here.'}</p>
        {next && <p className="mt-2 text-sm text-white/70">{next.dueAt != null ? `Recorded follow-up: ${new Date(next.dueAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Follow-up date not recorded'}</p>}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-white/60">{recorded ? 'Progress updates after the clinic verifies completed care.' : 'No progress has been assumed. General care guides remain available below.'}</p>
    </div>
  </section>;
}


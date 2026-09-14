import { motion, useReducedMotion } from 'framer-motion';
import type { RedemptionPolicy } from '../lib/care/redemption';

export function rewardPosition(points: number, policy?: RedemptionPolicy) {
  const tiers = policy?.status === 'active' ? [...policy.tiers].sort((a, b) => a.points - b.points) : [];
  const reached = tiers.filter(tier => points >= tier.points);
  const current = reached.at(-1);
  const next = tiers.find(tier => tier.points > points);
  const fraction = next ? Math.max(0, Math.min(1, (points - (current?.points ?? 0)) / (next.points - (current?.points ?? 0)))) : tiers.length ? 1 : 0;
  return { tiers, current, next, fraction, level: reached.length };
}

/** Only the wallet's available balance and active clinic policy enter this view. */
export default function RewardClimb({ points, policy, paused = false }: {
  points: number | null; policy?: RedemptionPolicy; paused?: boolean;
}) {
  const reduced = useReducedMotion();
  const { tiers, current, next, fraction, level } = rewardPosition(points ?? 0, policy);
  const ready = points !== null && tiers.length > 0;
  const ease = [0.22, 1, 0.36, 1] as const;
  return <div className="my-5 min-w-0" aria-label="Your rewards climb">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-sm text-white/70">Available points</p><p className="mt-1 font-heading text-4xl font-bold tabular-nums text-planet-yellow">{points === null ? 'Awaiting clinic check' : points.toLocaleString('en-IN')}</p></div>
      {ready && <p className="text-sm text-white/75">Current level <strong className="ml-1 text-white">{level} / {tiers.length}</strong></p>}
    </div>
    {ready ? <>
      <div role="progressbar" aria-label={next ? `Progress to ${next.percent}% off the entire bill` : 'Highest configured reward reached'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fraction * 100)} aria-valuetext={next ? `${next.points - points!} points to the next reward` : 'All configured thresholds reached'}>
        <svg viewBox="0 0 320 150" className="mx-auto w-full max-w-md" aria-hidden="true">
          <path d="M24 116 L296 30" stroke="currentColor" className="text-planet-yellow/20" strokeWidth="2" fill="none" />
          {[0, .25, .5, .75, 1].map(step => <path key={step} d={`M${17 + step * 272} ${129 - step * 86} h14`} stroke="currentColor" className={step <= fraction ? 'text-planet-yellow/70' : 'text-white/20'} strokeWidth="2" strokeLinecap="round" />)}
          <motion.path d="M24 116 L296 30" stroke="currentColor" className="text-planet-yellow" strokeWidth="2" fill="none" initial={false} animate={{ pathLength: fraction }} transition={{ duration: reduced ? 0 : .9, ease }} />
          <circle cx="296" cy="30" r="5" fill="none" stroke="currentColor" className="text-planet-yellow/60" />
          <motion.g initial={false} animate={{ x: 24 + fraction * 272, y: 116 - fraction * 86 }} transition={{ duration: reduced ? 0 : .9, ease }}>
            <circle r="17" fill="currentColor" className="text-planet-yellow/10" /><circle r="9" fill="currentColor" className="text-planet-yellow" />
            <path d="m-3 1 3-3 3 3" fill="none" stroke="#101b14" strokeWidth="1.5" strokeLinecap="round" />
          </motion.g>
        </svg>
      </div>
      <p className="text-sm text-white/70">{next ? 'Your next reward' : 'Highest configured reward'}</p>
      <p className="mt-1 font-heading text-2xl font-semibold text-white">{next?.percent ?? current?.percent}% off the entire bill</p>
      <p className="mt-2 text-sm text-planet-yellow">{next ? `${(next.points - points!).toLocaleString('en-IN')} more points to reach it` : 'You have reached every current threshold'}</p>
      {current && next && <p className="mt-2 text-sm text-white/70">Current threshold: {current.percent}% off · {current.points.toLocaleString('en-IN')} points</p>}
      <p className="mt-3 text-xs leading-relaxed text-white/70">{paused ? 'The clinic needs to check a refunded reward before you can use points.' : 'Choose a discount below. The clinic confirms it on your invoice before points are spent.'}</p>
    </> : <p className="mt-4 text-sm leading-relaxed text-white/70">{points === null ? 'Your clinic is checking your balance. Reward progress will appear when it is confirmed.' : 'Your points are recorded. The next reward will appear once the clinic approves its discount levels.'}</p>}
  </div>;
}

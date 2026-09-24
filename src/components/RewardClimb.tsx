import { motion, useReducedMotion } from 'framer-motion';
import { Check, LockKeyhole, Sparkles } from 'lucide-react';
import type { RedemptionPolicy } from '../lib/care/redemption';

export function rewardPosition(points: number, policy?: RedemptionPolicy) {
  const tiers = policy?.status === 'active' ? [...policy.tiers].sort((a, b) => a.points - b.points) : [];
  const reached = tiers.filter(tier => points >= tier.points);
  const current = reached.at(-1);
  const next = tiers.find(tier => tier.points > points);
  const fraction = next ? Math.max(0, Math.min(1, (points - (current?.points ?? 0)) / (next.points - (current?.points ?? 0)))) : tiers.length ? 1 : 0;
  return { tiers, current, next, fraction, level: reached.length };
}

/** Available wallet balance and active clinic policy are the only reward inputs. */
export default function RewardClimb({ points, policy, paused = false }: { points: number | null; policy?: RedemptionPolicy; paused?: boolean }) {
  const reduced = useReducedMotion();
  const { tiers, current, next, fraction } = rewardPosition(points ?? 0, policy);
  const ready = points !== null && tiers.length > 0;
  return <div className="reward-climb" aria-label="Your rewards journey">
    {ready ? <>
      <div className="reward-climb-feature"><span className="reward-climb-spark" aria-hidden="true"><Sparkles size={25}/></span><div><span>{next ? 'Your next reward' : 'Highest current reward'}</span><strong>{next?.percent ?? current?.percent}% off</strong><p>the entire recorded bill</p></div></div>
      <div className="reward-climb-track" role="progressbar" aria-label={next ? `Progress to ${next.percent}% off the entire bill` : 'Highest configured reward reached'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fraction * 100)} aria-valuetext={next ? `${next.points - points!} more points needed` : 'All approved thresholds reached'}><motion.span initial={reduced ? false : { scaleX: 0 }} animate={{ scaleX: fraction }} transition={{ duration: reduced ? 0 : 1.15, ease: [0.22, 1, 0.36, 1] }}/></div>
      <p className="reward-climb-caption">{next ? <><strong>{(next.points - points!).toLocaleString('en-IN')} points</strong> to go</> : 'You have reached every approved level.'}</p>
      <div className="reward-tier-list">{tiers.map(tier => { const reached = points! >= tier.points; return <div key={tier.id} className={reached ? 'is-reached' : ''}><span>{reached ? <Check size={16}/> : <LockKeyhole size={14}/>}</span><div><strong>{tier.percent}% off</strong><small>{tier.points.toLocaleString('en-IN')} points</small></div></div>; })}</div>
      <p className="reward-climb-disclaimer">{paused ? 'A refunded reward needs clinic review before points can be used.' : 'The clinic confirms any discount on the actual invoice before points are spent.'}</p>
    </> : <div className="reward-climb-pending"><span className="reward-climb-spark" aria-hidden="true"><Sparkles size={25}/></span><div><strong>{points === null ? 'Your balance is being checked' : 'Your next reward is being prepared'}</strong><p>{points === null ? 'Verified points and approved rewards will appear here.' : 'The clinic is setting the discount levels. Your points remain recorded.'}</p></div></div>}
  </div>;
}

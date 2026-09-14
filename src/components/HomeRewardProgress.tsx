import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import { ArrowRight, Calendar } from 'lucide-react';
import { auth } from '../lib/firebase';
import { walletRequest } from './ClinicWallet';
import { rewardPosition } from './RewardClimb';
import type { RedemptionPolicy } from '../lib/care/redemption';

type Balance = { points: number | null; policy?: RedemptionPolicy; paused?: boolean };
export function HomeRewardCard({ balance, notice, onBook, onWallet }: { balance: Balance | null; notice: string; onBook: () => void; onWallet: () => void }) {
  const reduced = useReducedMotion();
  const points = balance?.points ?? null;
  const { tiers, next, current, fraction, level } = rewardPosition(points ?? 0, balance?.policy);
  const ready = points !== null && tiers.length > 0;
  return <section aria-label="Paw Points progress" className="relative z-10 mb-6 rounded-3xl border border-planet-yellow/25 bg-[#12271d] p-5 text-white sm:p-6">
    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-white/75">Your Paw Points</p><h2 className="mt-1 text-3xl font-semibold tabular-nums text-planet-yellow">{points === null ? '—' : points.toLocaleString('en-IN')}<span className="ml-2 text-sm font-normal text-white/70">available</span></h2></div><button onClick={onWallet} className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs text-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-planet-yellow">Wallet<ArrowRight size={14}/></button></div>
    <div className="mb-2 mt-5 flex flex-wrap justify-between gap-2 text-xs text-white/75"><span>{ready ? `Level ${level} of ${tiers.length}` : 'Your reward journey'}</span><span>{ready ? next ? `Next: ${next.percent}% off` : `${current?.percent}% threshold reached` : 'Awaiting verified rewards'}</span></div>
    <div role={ready ? 'progressbar' : undefined} aria-label="Progress to next Paw Points reward" aria-valuemin={ready ? 0 : undefined} aria-valuemax={ready ? 100 : undefined} aria-valuenow={ready ? Math.round(fraction * 100) : undefined} aria-valuetext={ready ? next ? `${next.points - points!} more points to the next reward` : 'Highest configured threshold reached' : undefined} className="h-3 overflow-hidden rounded-full bg-white/10">
      {ready && <motion.div data-home-reward-fill className="h-full origin-left rounded-full bg-gradient-to-r from-[#c9990a] via-[#fec708] to-[#ffe699]" initial={reduced ? false : { scaleX: 0 }} animate={{ scaleX: fraction }} transition={{ duration: reduced ? 0 : 1.4, ease: [.22, 1, .36, 1] }} />}
    </div>
    <p className="mt-3 text-sm leading-relaxed text-white/80">{ready ? next ? `${(next.points - points!).toLocaleString('en-IN')} more points to ${next.percent}% off the entire bill.` : 'You’ve reached the highest current reward threshold.' : notice || (points === null ? 'Your verified balance will appear here.' : 'Your points are recorded. The clinic is setting the reward levels.')}</p>
    {balance?.paused && <p className="mt-2 text-xs text-planet-yellow">The clinic needs to review your wallet before points can be used.</p>}
    <button onClick={onBook} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-planet-yellow px-4 py-3 text-sm font-semibold text-[#102018] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-planet-yellow"><Calendar size={17}/>Book a visit<ArrowRight size={17}/></button>
    <p className="mt-3 text-xs leading-relaxed text-white/65">Eligible completed care earns points after clinic verification. Booking alone does not add points.</p>
  </section>;
}

export default function HomeRewardProgress({ demo, onBook, onWallet }: { demo: boolean; onBook: () => void; onWallet: () => void }) {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [notice, setNotice] = useState('Loading your verified balance…');
  useEffect(() => {
    if (demo) { setBalance(null); setNotice('Visual preview. Sign in to see your verified points and next reward.'); return; }
    let generation = 0;
    const stop = onAuthStateChanged(auth, user => {
      const request = ++generation;
      setBalance(null);
      setNotice(user ? 'Loading your verified balance…' : 'Sign in to see your verified points.');
      if (user) void walletRequest().then(data => { if (request !== generation) return; setBalance({ points: data.wallet ? data.wallet.points - data.wallet.reservedPoints : null, policy: data.redemptionPolicy, paused: data.wallet?.reconciliationRequired }); setNotice(''); }).catch(() => { if (request === generation) setNotice('Your balance could not be loaded. Open your wallet to retry.'); });
    });
    return () => { generation++; stop(); };
  }, [demo]);
  return <HomeRewardCard balance={balance} notice={notice} onBook={onBook} onWallet={onWallet}/>;
}

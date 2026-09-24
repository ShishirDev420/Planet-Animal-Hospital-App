import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import { ArrowRight, CalendarDays, PawPrint, Sparkles } from 'lucide-react';
import { auth } from '../lib/firebase';
import { walletRequest } from './ClinicWallet';
import { rewardPosition } from './RewardClimb';
import type { RedemptionPolicy } from '../lib/care/redemption';
import careCompanions from '../assets/care-companions.webp';
import './home-rewards.css';

type Balance = { points: number | null; policy?: RedemptionPolicy; paused?: boolean };
export function HomeRewardCard({ balance, notice, onBook, onWallet }: { balance: Balance | null; notice: string; onBook: () => void; onWallet: () => void }) {
  const reduced = useReducedMotion();
  const points = balance?.points ?? null;
  const { tiers, next, current, fraction, level } = rewardPosition(points ?? 0, balance?.policy);
  const ready = points !== null && tiers.length > 0;
  return <section aria-label="Paw Points progress" className="home-reward-card">
    <div className="home-reward-copy"><span className="home-reward-kicker"><Sparkles size={14}/> Your care journey</span><h2>Little steps.<br/><em>Lovely rewards.</em></h2><p>Care for your pet. Watch your verified Paw Points grow.</p>
      <div className="home-reward-points"><span>{points === null ? '—' : points.toLocaleString('en-IN')}</span><div><strong>Paw Points</strong><small>available to use</small></div></div>
      <div className="home-reward-next"><span>{ready ? next ? 'Next approved reward' : 'Current approved reward' : 'Your next reward'}</span><strong>{ready ? `${next?.percent ?? current?.percent}% off the entire bill` : notice || 'Appears when approved by the clinic'}</strong>{ready && next && <small>{(next.points - points!).toLocaleString('en-IN')} points to go</small>}</div>
      {ready && <div className="home-reward-meter" role="progressbar" aria-label="Progress to next Paw Points reward" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fraction * 100)} aria-valuetext={next ? `${next.points - points!} more points to the next reward` : 'Highest approved reward reached'}><motion.span initial={reduced ? false : { scaleX: 0 }} animate={{ scaleX: fraction }} transition={{ duration: reduced ? 0 : 1.2, ease: [0.22, 1, 0.36, 1] }}/></div>}
      <div className="home-reward-actions"><button type="button" onClick={onWallet}>Explore my wallet <ArrowRight size={17}/></button><button type="button" onClick={onBook}><CalendarDays size={17}/> Book a visit</button></div>
      <p className="home-reward-fineprint">Eligible care earns points after completion and clinic approval. Booking alone earns no points.</p>
      {balance?.paused && <p className="home-reward-warning">The clinic needs to review your wallet before points can be used.</p>}
    </div>
    <div className="home-reward-visual" aria-hidden="true"><div className="home-reward-orbit"><span className="home-reward-orbit-ring ring-one"/><span className="home-reward-orbit-ring ring-two"/><span className="home-reward-orbit-ring ring-three"/><span className="home-reward-star star-one">✦</span><span className="home-reward-star star-two">✧</span><span className="home-reward-star star-three">✦</span></div><img className="home-reward-pets" src={careCompanions} alt=""/><span className="home-reward-level"><PawPrint size={12}/> {ready ? `LEVEL ${level} OF ${tiers.length}` : 'PAW POINTS'}</span></div>
  </section>;
}

export default function HomeRewardProgress({ demo, onBook, onWallet }: { demo: boolean; onBook: () => void; onWallet: () => void }) {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [notice, setNotice] = useState('Loading your verified balance…');
  useEffect(() => {
    if (demo) { setBalance(null); setNotice('Sign in to see your verified points and next reward.'); return; }
    let generation = 0;
    const stop = onAuthStateChanged(auth, user => {
      const request = ++generation;
      setBalance(null);
      setNotice(user ? 'Loading your verified balance…' : 'Sign in to see your verified points.');
      if (user) void walletRequest().then(data => { if (request !== generation) return; setBalance({ points: data.wallet && Number.isFinite(data.wallet.points) && Number.isFinite(data.wallet.reservedPoints) ? Math.max(0, data.wallet.points - data.wallet.reservedPoints) : null, policy: data.redemptionPolicy, paused: data.wallet?.reconciliationRequired }); setNotice(''); }).catch(() => { if (request === generation) setNotice('Your balance could not be loaded. Open your wallet to retry.'); });
    });
    return () => { generation++; stop(); };
  }, [demo]);
  return <HomeRewardCard balance={balance} notice={notice} onBook={onBook} onWallet={onWallet}/>;
}

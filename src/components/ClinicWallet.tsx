import { useEffect, useRef, useState } from 'react';
import { useInRouterContext, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { ArrowDownLeft, ArrowUpRight, Clock3, RefreshCw, ShieldCheck, Wallet } from 'lucide-react';
import { auth } from '../lib/firebase';
import { isPreviewDemoMode } from '../lib/demoMode';
import { requestCareJson } from '../lib/care/request';
import RewardClimb from './RewardClimb';
import RedemptionPolicyEditor from './RedemptionPolicyEditor';
import '../pages/rewards.css';

export async function walletRequest(body?: Record<string, unknown>, ownerUid?: string) {
  if (isPreviewDemoMode() || window.location.pathname.endsWith('-review.html')) throw new Error('Visual previews cannot access the live wallet.');
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in to view your clinic wallet.');
  const data = await requestCareJson('/api/wallet' + (ownerUid ? '?ownerUid=' + encodeURIComponent(ownerUid) : ''), {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${await user.getIdToken()}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (auth.currentUser?.uid !== user.uid) throw new Error('Account changed. Reopen the wallet.');
  return data;
}

const field = 'wallet-field';
export default function ClinicWallet(props: { ownerUid?: string; staff?: boolean }) {
  const routed = useInRouterContext();
  return routed ? <RoutedWallet {...props}/> : <PreviewWalletNotice/>;
}
function PreviewWalletNotice() { return <div className="wallet-empty">Visual preview only. Sign in through the main app to view verified points.</div>; }
function RoutedWallet(props: { ownerUid?: string; staff?: boolean }) {
  const location = useLocation();
  return isPreviewDemoMode(location.search, location.pathname) || location.pathname.endsWith('-review.html') ? <PreviewWalletNotice/> : <AuthenticatedWallet {...props}/>;
}
function AuthenticatedWallet({ ownerUid, staff = false }: { ownerUid?: string; staff?: boolean }) {
  const [session, setSession] = useState(auth.currentUser?.uid);
  useEffect(() => onAuthStateChanged(auth, user => setSession(user?.uid)), []);
  return <WalletSession key={`${session}:${ownerUid}`} ownerUid={ownerUid} staff={staff}/>;
}
function WalletSession({ ownerUid, staff }: { ownerUid?: string; staff: boolean }) {
  const [data, setData] = useState<any>(null);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [invoice, setInvoice] = useState('');
  const [tierId, setTierId] = useState('');
  const [reference, setReference] = useState('');
  const [eligible, setEligible] = useState('');
  const [plan, setPlan] = useState('essential');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const mounted = useRef(true);
  const mutationActive = useRef(false);
  const reservation = useRef({ fingerprint: '', id: '' });
  const load = async () => {
    try { const result = await walletRequest(undefined, ownerUid); if (mounted.current) { setData(result); setNotice(''); } return true; }
    catch (error) { if (mounted.current) { setData(null); setNotice((error as Error).message); } return false; }
    finally { if (mounted.current) setLoading(false); }
  };
  useEffect(() => { mounted.current = true; void load(); return () => { mounted.current = false; }; }, []);
  const run = async (body: Record<string, unknown>) => {
    if (mutationActive.current) return;
    mutationActive.current = true;
    setBusy(true);
    try { const result = await walletRequest({ ...body, ...(ownerUid ? { ownerUid } : {}) }); const refreshed = await load(); if (mounted.current && refreshed) setNotice(result.invoiceId ? `Invoice registered: ${result.invoiceId}` : 'Your wallet has been updated.'); }
    catch (error) { if (mounted.current) setNotice((error as Error).message); }
    finally { mutationActive.current = false; if (mounted.current) setBusy(false); }
  };
  const wallet = data?.wallet;
  const available = wallet && Number.isFinite(wallet.points) && Number.isFinite(wallet.reservedPoints) ? Math.max(0, wallet.points - wallet.reservedPoints) : null;
  const active = data?.redemptionPolicy?.status === 'active';
  const tiers = active ? data.redemptionPolicy.tiers : [];
  const reservations = data?.reservations || [];
  const entries = data?.entries || [];
  return <section aria-label="Clinic wallet" className="wallet-workspace">
    <div className="wallet-balance-panel">
      <div className="wallet-balance-top"><span><Wallet size={17}/> Your available balance</span><button type="button" onClick={() => void load()} disabled={busy || loading} aria-label="Refresh wallet"><RefreshCw size={17}/></button></div>
      <div className="wallet-balance-value" aria-live="polite">{available === null ? '—' : available.toLocaleString('en-IN')} <small>Paw Points</small></div>
      <p>{loading ? 'Checking your verified balance…' : available === null ? auth.currentUser ? 'Your verified balance is unavailable right now.' : 'Sign in to see your verified balance.' : 'Shared across your pets at Planet Animal Hospital.'}</p>
      <div className="wallet-balance-orbit" aria-hidden="true"><span>✦</span><span>✦</span><span>✦</span></div>
    </div>

    {data && <>
      <div className="wallet-status-grid">
        <div><span className="wallet-stat-icon"><ShieldCheck size={20}/></span><span>Awaiting clinic check</span><strong>{Number.isFinite(data.pendingPoints) ? data.pendingPoints.toLocaleString('en-IN') : '—'}</strong><small>These points are not available yet.</small></div>
        <div><span className="wallet-stat-icon"><Clock3 size={20}/></span><span>Reserved for a bill</span><strong>{Number.isFinite(wallet?.reservedPoints) ? wallet.reservedPoints.toLocaleString('en-IN') : '—'}</strong><small>Held until the reservation ends or staff confirms it.</small></div>
      </div>

      <div className="wallet-journey-panel"><div className="wallet-section-head"><span className="wallet-eyebrow">Your next chapter</span><h2>Reward journey</h2><p>{active ? 'Only clinic approved discounts appear here.' : 'Your points are saved while the clinic finalizes discount levels.'}</p></div><RewardClimb points={available} policy={data.redemptionPolicy} paused={wallet?.reconciliationRequired}/></div>
      {!wallet?.legacyReconciled && <div className="wallet-callout">Previous profile points: {data.legacyPoints === null ? 'not recorded' : `${data.legacyPoints.toLocaleString('en-IN')} awaiting a clinic check`}. They are separate from the available balance above.</div>}
      {wallet?.reconciliationRequired && <div className="wallet-callout" role="alert">The clinic needs to check a refunded reward. New discounts are paused until that review is complete.</div>}

      <div className="wallet-activity-panel"><div className="wallet-section-head"><span className="wallet-eyebrow">Your record</span><h2>Recent activity</h2><p>Verified wallet changes appear here.</p></div>
        {entries.length ? <ul className="wallet-activity-list">{entries.slice(0, 5).map((entry: any) => <li key={entry.id}><span className="wallet-activity-icon">{entry.type === 'earn' ? <ArrowDownLeft size={19}/> : <ArrowUpRight size={19}/>}</span><div><strong>{entry.type === 'earn' ? 'Points earned' : entry.type === 'apply' ? 'Discount applied' : entry.type === 'reserve' ? 'Points reserved' : 'Wallet update'}</strong><small>{entry.at ? new Date(entry.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date unavailable'}{entry.convertible === false ? ' · Awaiting clinic check' : ''}</small></div><b>{typeof entry.points === 'number' ? `${entry.type === 'earn' ? '+' : ''}${entry.points.toLocaleString('en-IN')}` : '—'}</b></li>)}</ul> : <p className="wallet-no-activity">No verified wallet activity yet. It will appear after eligible care is completed and approved.</p>}
        {entries.length > 5 && <details className="wallet-details"><summary>View all activity</summary><ul className="wallet-activity-list">{entries.slice(5).map((entry: any) => <li key={entry.id}><span className="wallet-activity-icon"><Clock3 size={18}/></span><div><strong>{entry.type}</strong><small>{entry.at ? new Date(entry.at).toLocaleDateString('en-IN') : 'Date unavailable'}</small></div><b>{typeof entry.points === 'number' ? entry.points.toLocaleString('en-IN') : '—'}</b></li>)}</ul></details>}
      </div>

      {reservations.length > 0 && <div className="wallet-action-panel"><div className="wallet-section-head"><span className="wallet-eyebrow">At the hospital</span><h2>Active reservations</h2></div>{reservations.map((item: any) => <div className="wallet-reservation" key={item.id}><div><strong>{item.points} points reserved</strong><p>{item.basis === 'entire-bill' ? `${item.percent}% off the recorded ₹${(item.totalPaise / 100).toFixed(2)} bill` : 'Invoice discount'} · Expires {new Date(item.expiresAt).toLocaleString('en-IN')}</p></div><button disabled={busy} onClick={() => void run({ type: 'release', id: item.id })}>Release</button>{staff && <button disabled={busy || !reference} onClick={() => void run({ type: 'apply', id: item.id, billingReference: reference })}>Confirm on invoice</button>}</div>)}</div>}

      {!staff && active && <details className="wallet-action-panel wallet-details"><summary>Use points at the hospital</summary><p>Ask billing staff for the invoice ID. Reserving a discount holds points for 15 minutes; staff confirms it on the bill before points are spent.</p><label>Invoice ID<input className={field} value={invoice} onChange={event => setInvoice(event.target.value)}/></label><label>Discount<select className={field} value={tierId} onChange={event => setTierId(event.target.value)}><option value="">Choose a discount</option>{tiers.map((tier: any) => <option key={tier.id} value={tier.id}>{tier.points} points · {tier.percent}% off the entire bill</option>)}</select></label><button className="wallet-primary-action" disabled={busy || !invoice || !tierId || wallet?.reconciliationRequired} onClick={() => { const fingerprint = invoice + ':' + tierId; if (reservation.current.fingerprint !== fingerprint) reservation.current = { fingerprint, id: crypto.randomUUID() }; void run({ type: 'reserveTier', id: reservation.current.id, invoiceId: invoice, tierId }); }}>Reserve discount</button></details>}

      {staff && <details className="wallet-action-panel wallet-details"><summary>Staff billing controls</summary><label>Actual billing reference<input className={field} value={reference} onChange={event => setReference(event.target.value)}/></label><label>Entire invoice total in paise<input type="number" min="1" step="1" className={field} value={eligible} onChange={event => setEligible(event.target.value)}/></label><button className="wallet-primary-action" disabled={busy || !reference || !eligible} onClick={() => void run({ type: 'registerInvoice', reference, eligiblePaise: Number(eligible), totalPaise: Number(eligible) })}>Record confirmed invoice</button>{data.role === 'manager' && !wallet?.legacyReconciled && <button className="wallet-secondary-action" disabled={busy || data.legacyPoints === null} onClick={() => void run({ type: 'reconcileLegacy', expectedPoints: data.legacyPoints })}>Reconcile previous profile points</button>}{data.role === 'manager' && <><h3>Verified membership</h3><label>Plan<select className={field} value={plan} onChange={event => setPlan(event.target.value)}><option value="essential">Essential</option><option value="advanced">Advanced</option><option value="prestige">Premium</option></select></label><label>Paid period begins<input type="datetime-local" className={field} value={start} onChange={event => setStart(event.target.value)}/></label><label>Paid period ends<input type="datetime-local" className={field} value={end} onChange={event => setEnd(event.target.value)}/></label><button className="wallet-secondary-action" disabled={busy || !reference || !start || !end} onClick={() => void run({ type: 'verifySubscription', plan, status: 'active', paymentReference: reference, startsAt: new Date(start).getTime(), endsAt: new Date(end).getTime() })}>Confirm verified payment</button><button className="wallet-secondary-action" disabled={busy || !reference || !start || !end} onClick={() => void run({ type: 'verifySubscription', plan, status: 'cancelled', paymentReference: reference, startsAt: new Date(start).getTime(), endsAt: new Date(end).getTime() })}>Record cancellation</button></>}</details>}
      {staff && data.role === 'manager' && <RedemptionPolicyEditor busy={busy} onSave={policy => void run({ type: 'configureRedemption', policy })}/>}
      {staff && entries.some((entry: any) => entry.type === 'earn' || entry.type === 'apply' || entry.status === 'reconciliation-required') && <details className="wallet-action-panel wallet-details"><summary>Staff refund review</summary>{entries.map((entry: any) => <div key={entry.id} className="wallet-reservation"><span>{entry.type} · {entry.points ?? '—'} points</span>{data.role === 'manager' && entry.status === 'reconciliation-required' && <button disabled={busy} onClick={() => void run({ type: 'settleRefund', id: entry.id })}>Settle refund</button>}{entry.type === 'earn' && entry.convertible === true && <button disabled={busy || !reference} onClick={() => void run({ type: 'reverseEarn', entryId: entry.id, billingReference: reference })}>Record service refund</button>}{entry.type === 'apply' && <button disabled={busy || !reference} onClick={() => void run({ type: 'reverse', id: entry.id.replace('apply-', ''), billingReference: reference })}>Reverse invoice discount</button>}</div>)}</details>}
    </>}
    {notice && <p role="status" className="wallet-notice">{notice}</p>}
  </section>;
}

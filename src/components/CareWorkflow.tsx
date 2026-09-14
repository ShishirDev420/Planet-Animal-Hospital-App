import ApprovedAdviceSpeech from './ApprovedAdviceSpeech';
import ClinicWallet from './ClinicWallet';
import { motion, useReducedMotion } from 'framer-motion';
import PrescriptionWorkspace from './PrescriptionWorkspace';
import PetHistory from './PetHistory';
import { useState } from 'react';
import { useCare } from '../lib/care/client';
import { careSummary } from '../lib/care/domain';

export const careInput = 'w-full min-w-0 rounded-xl border border-white/20 bg-[#071912] px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#fec708]';
export const careButton = 'rounded-xl border border-[#fec708]/30 bg-[#fec708]/10 px-4 py-2.5 text-sm font-bold text-[#fec708] disabled:opacity-40';
export default function CareWorkflow({prescriptionServices}: {prescriptionServices?: React.ComponentProps<typeof PrescriptionWorkspace>} = {}) {
  const reducedMotion = useReducedMotion();
  const { state, petId, setPetId, loading, error, command, refresh } = useCare();
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState(''), [update, setUpdate] = useState(''), [consent, setConsent] = useState(false), [date, setDate] = useState(''), [petName, setPetName] = useState('');
  const run = async (action: Record<string, unknown>, success: string) => {
    setBusy(true); setNotice(''); try { await command(action); setNotice(success); } catch (e) { setNotice((e as Error).message); } finally { setBusy(false); }
  };
  const next = state?.milestones.filter(m => m.petId === petId && m.status === 'approved').sort((a,b) => (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity))[0];
  const completed = state?.milestones.filter(m => m.petId === petId && m.status === 'completed').length || 0;
  return <section aria-label="Recorded care follow-through" className="relative z-10 my-5 rounded-[2rem] border border-white/10 bg-black/40 p-5 text-white sm:p-6">
    <p className="cinematic-kicker text-[#fec708]">Your recorded next step</p>
    <p className="mt-2 text-sm text-white/70">Pritpawl guides your plan · Pawlina coordinates follow-up · Pawl explains rewards.</p>
    {loading && !state ? <p role="status" className="mt-4">Loading recorded care…</p> : error && !state ? <div className="mt-4"><p role="alert">{error}</p><button className={`${careButton} mt-3`} onClick={() => void refresh()}>Retry care service</button></div> : state && <>
      {loading && <p role="status" className="mt-3 text-sm text-white/70">Refreshing recorded care…</p>}{error && <p role="status" className="mt-3 text-sm text-[#fec708]">Refresh unavailable. Showing the last loaded record. {error}</p>}
      {state.pets.length > 0 && <label className="mt-4 block text-sm">Pet<select className={`${careInput} mt-1`} value={petId} onChange={e => { setPetId(e.target.value); setNotice(''); setUpdate(''); setConsent(false); setDate(''); }}>{state.pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}
      <details className="mt-3 text-sm"><summary className="cursor-pointer text-white/70">Add another pet to this care workspace</summary><label className="mt-3 block">Pet name<input className={careInput} value={petName} onChange={e=>setPetName(e.target.value)} maxLength={100}/></label><button className={`${careButton} mt-2`} disabled={busy || !petName.trim()} onClick={()=>void run({type:'addPet',petId:crypto.randomUUID(),name:petName},'Pet added to this account.')}>Add pet</button></details>
      <button className={`${careButton} mt-4`} disabled={busy || !state.pets.some(p=>p.id===petId)} onClick={()=>void run({type:"requestCheckup",id:"checkup-"+petId+"-"+new Date().toISOString().slice(0,10),petId,text:"Please contact me to arrange a proactive checkup and confirm reward eligibility.",consent:true},"Checkup request saved for the care team. Booking and reward eligibility still need clinic confirmation.")}>Ask Pawlina to arrange a checkup</button><PetHistory key={'history:'+state.ownerUid+':'+petId}/><PrescriptionWorkspace key={'source:'+state.ownerUid+':'+petId} {...prescriptionServices}/>
      <p className="mt-4 text-sm leading-6">{careSummary(state, petId)}</p>
      <motion.p key={completed} role="status" initial={reducedMotion ? false : {opacity:0,y:4}} animate={{opacity:1,y:0}} transition={{duration:0.18}} className="mt-3 text-sm text-[#fec708]">{completed} staff-verified milestone{completed === 1 ? '' : 's'} completed</motion.p>
      {next ? <><p className="mt-3 text-sm whitespace-pre-line">{next.instructions}</p><ApprovedAdviceSpeech text={next.title + '. ' + next.instructions} approvalId={next.id + ':' + next.approvedAt} />
        <p className="mt-2 text-xs text-white/65">Approved record: {next.sourceRef}. {next.walletReward ? `${next.walletReward.points} points pending verified completion.` : "The clinic confirms reward eligibility with your booking."}</p>
        <p className="mt-2 text-sm">{next.booking.status === 'confirmed' ? `Clinic booking confirmed for ${new Date(next.booking.scheduledAt!).toLocaleString()} · ${next.booking.reference}` : next.booking.status === 'requested' ? 'Your request is awaiting clinic confirmation. No appointment is confirmed.' : 'Request a clinic appointment for this recorded milestone.'}</p>
        <label className="mt-4 block text-sm">Preferred appointment date and time<input className={`${careInput} mt-1`} type="datetime-local" value={date} onInput={e=>setDate(e.currentTarget.value)} onChange={e=>setDate(e.target.value)}/></label>
        <button className={`${careButton} mt-2`} disabled={busy || !date} onClick={()=>void run({type:'book', milestoneId:next.id,requestedFor:new Date(date).getTime()},'Request saved. The clinic must confirm availability; points remain pending until the clinic confirms and verifies care.')}>{next.booking.status === 'confirmed' ? 'Request rescheduling' : 'Request appointment'}</button>
      </> : <button className={`${careButton} mt-3`} disabled={busy || !state.pets.some(p=>p.id===petId)} onClick={()=>void run({type:'requestInstructions',id:crypto.randomUUID(),text:'Please find my recorded care instructions and approved follow-up dates.',consent:true},'Request shared with the coordinator. No clinical deadline has been invented.')}>Ask the team for my instructions</button>}
      <label className="mt-5 flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 accent-[#fec708]" checked={state.preferences.inApp} disabled={busy} onChange={e=>void run({type:'preferences',inApp:e.target.checked,snoozeUntil:null},'Reminder preference saved.')}/>Remind me in the app using the veterinarian-approved reminder dates.</label>
      <p className="mt-2 text-xs text-white/65">WhatsApp, email and calendar delivery are not connected to this pilot. In-app reminders appear when you open the app. No external messages are sent.</p>
      {state.reminders.some(r=>r.status==='available' && state.milestones.some(m=>m.id===r.milestoneId && m.petId===petId)) && <div role="status" className="mt-3 rounded-xl border border-[#fec708]/30 p-3"><p>A recorded follow-up reminder is due.</p><button className={`${careButton} mt-2`} disabled={busy} onClick={()=>void run({type:'preferences',inApp:true,snoozeUntil:Date.now()+86400000},'Reminder snoozed for one day. Your clinical due date is unchanged.')}>Snooze reminder one day</button></div>}
      <details className="mt-5"><summary className="cursor-pointer text-sm font-bold">Share an update with the care team</summary><label className="mt-3 block text-sm">What changed?<textarea className={`${careInput} mt-1`} value={update} maxLength={1600} onChange={e=>setUpdate(e.target.value)}/></label><label className="mt-2 flex gap-2 text-sm"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>Share this update with my hospital care team.</label><p className="mt-2 text-xs text-white/65">Updates await staff review. This is not an emergency service; no response time is promised here.</p><button className={`${careButton} mt-3`} disabled={busy || !consent || !update.trim()} onClick={()=>void run({type:'update',id:crypto.randomUUID(),text:update,consent},'Update recorded for clinical review. No diagnosis or treatment change has been made.')}>Send update for review</button></details>
      <div className="mt-5 border-t border-white/10 pt-4"><p className="text-sm font-bold">Pawl · Verified pilot rewards</p><p className="mt-2 text-sm">{state.ledger.reduce((n,l)=>n+l.points,0)} earned points · ₹{(state.ledger.reduce((n,l)=>n+l.creditPaise,0)/100).toFixed(2)} recorded clinic credit</p><p className="mt-2 text-xs text-white/65">Existing wallet amounts remain separate until reconciled below. Checkup entitlements are pet-specific and are not inferred from points.</p><p className="mt-2 text-sm">{state.entitlements.filter(e=>e.petId===petId).length} recorded checkup entitlements for this pet.</p></div>
    </>}
    <ClinicWallet />
    {notice && <p role="status" className="mt-4 text-sm leading-6 text-[#ffe28f]">{notice}</p>}
  </section>;
}

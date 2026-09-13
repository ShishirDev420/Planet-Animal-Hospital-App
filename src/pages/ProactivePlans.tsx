import { useEffect, useRef, useState } from 'react';
import { Check, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { buildWhatsAppUrl, CLINIC_TEL_URL } from '../lib/pawPoints';
import { planOffers, planComparison, planInquiry, type PlanId } from '../lib/planOffers';

export default function ProactivePlans() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<PlanId | null>(null);
  const nextStep = useRef<HTMLHeadingElement>(null);
  const offer = planOffers.find(plan => plan.id === selected);
  useEffect(() => { if (selected) nextStep.current?.focus(); }, [selected]);
  return (
    <div className="pb-24 text-white/95 relative min-h-screen">
      <header className="lg:hidden px-6 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] mb-2">
        <div className="flex items-center justify-between w-full py-4">
          <button aria-label="Open profiles" onClick={() => navigate('/profiles')} className="w-12 shrink-0 focus-visible:outline-2 focus-visible:outline-planet-yellow"><Logo className="!w-12 !h-12" /></button>
          <div className="flex flex-col items-center flex-1 text-center">
            <p className="font-heading text-sm font-black text-white/95 tracking-tight uppercase leading-none">PLANET ANIMAL</p>
            <p className="cinematic-kicker mt-0.5 text-[7px] tracking-[0.15em]">HOSPITAL & WELLNESS</p>
          </div><div className="w-12 shrink-0" />
        </div>
      </header>
      <div className="px-6 lg:px-8 max-w-6xl mx-auto relative z-10">
        <div className="pt-4 lg:pt-10 pb-8 lg:pb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-planet-yellow/15 bg-planet-yellow/10 px-3 py-1.5 cinematic-kicker mb-5"><Shield size={13} aria-hidden="true" />Care memberships</span>
          <h1 className="cinematic-title text-4xl lg:text-6xl max-w-3xl mb-4">Make room for <span className="text-planet-yellow">regular care.</span></h1>
          <p className="cinematic-copy text-sm lg:text-base max-w-2xl">Compare consultation, grooming and care benefits. Find the plan you’d like to explore, then confirm the details with the hospital before joining.</p>
          <a href="#compare-plans" className="inline-block text-planet-yellow text-sm font-semibold mt-5 underline underline-offset-4 focus-visible:outline-2">Compare all benefits</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-7">
          {planOffers.map(plan => (
            <article key={plan.id} className={`relative rounded-2xl flex flex-col liquid-glass-tier ${plan.surface} ${selected === plan.id ? 'ring-2 ring-planet-yellow' : ''}`} aria-labelledby={`title-${plan.id}`}>
              <div className="absolute inset-0 rounded-2xl bg-black/20" aria-hidden="true" />
              <div className="relative z-10 flex flex-col flex-1 p-6 lg:p-7">
                <p className="text-xs font-semibold text-planet-yellow mb-3">{plan.focus}</p>
                <h2 id={`title-${plan.id}`} className="cinematic-card-title text-2xl">{plan.name}</h2>
                <p className="mt-3 text-sm leading-relaxed text-white/75 md:min-h-20">{plan.description}</p>
                <p className="mt-5 mb-6"><span className="cinematic-price text-[2.5rem] text-planet-yellow">{plan.price}</span><span className="text-sm text-white/65"> /month</span></p>
                <ul className="border-y border-white/15 py-5 space-y-4">
                  {plan.highlights.map(benefit => <li key={benefit} className="flex items-start gap-3 font-semibold text-base leading-snug"><Check className="text-planet-yellow shrink-0 mt-0.5" size={18} aria-hidden="true" /><span>{benefit}</span></li>)}
                </ul>
                <ul className="pt-5 pb-6 space-y-3 text-sm text-white/80 flex-1">
                  {plan.features.map(benefit => <li key={benefit} className="flex gap-3"><span className="text-planet-yellow" aria-hidden="true">·</span><span>{benefit}</span></li>)}
                </ul>
                <p className="text-xs text-white/65 mb-5">Listed points rate <span className="text-white font-semibold">{plan.points}</span></p>
                <button onClick={() => setSelected(plan.id)} aria-controls="plan-next-step" aria-expanded={selected === plan.id} className="w-full rounded-xl bg-planet-yellow text-black font-semibold px-4 py-3 min-h-12 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-planet-yellow">Explore {plan.name.replace(' Paws', '')}</button>
              </div>
            </article>
          ))}
        </div>
        <section id="plan-next-step" aria-live="polite">
          {offer && <div className="mt-8 rounded-2xl border border-planet-yellow/35 bg-planet-yellow/[0.06] p-6 lg:p-8">
            <p className="text-sm text-planet-yellow mb-2">{offer.name} · {offer.price}/month</p>
            <h2 ref={nextStep} tabIndex={-1} className="cinematic-card-title text-2xl focus:outline-none">Join through the hospital</h2>
            <p className="text-sm leading-relaxed text-white/80 mt-3 max-w-2xl">Online checkout isn’t available here. Ask the hospital to confirm the current price, included benefits, eligibility and payment steps.</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-5">
              <a href={buildWhatsAppUrl(planInquiry(offer.id))} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-planet-yellow text-black font-semibold px-5 py-3 text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-planet-yellow">Ask on WhatsApp <span className="sr-only">about {offer.name} (opens a new tab)</span></a>
              <a href={CLINIC_TEL_URL} className="rounded-xl border border-white/25 px-5 py-3 text-center font-semibold focus-visible:outline-2 focus-visible:outline-planet-yellow">Call the hospital</a>
            </div>
            <p className="text-xs leading-relaxed text-white/65 mt-4">Selecting a plan does not charge you or change your membership. You can review the WhatsApp message before sending it.</p>
          </div>}
        </section>
        <section id="compare-plans" className="mt-12 scroll-mt-6" aria-labelledby="comparison-title">
          <h2 id="comparison-title" className="cinematic-card-title text-2xl mb-3">The benefits, side by side.</h2>
          <p className="text-sm text-white/75 leading-relaxed max-w-2xl mb-6">Compare the listed benefits below. Items marked “Confirm” need clarification from the hospital before you join.</p>
          <div className="rounded-2xl border border-white/15 overflow-hidden">
            <div className="grid grid-cols-3 bg-white/[0.06] text-center py-4 text-xs sm:text-sm font-semibold text-planet-yellow">{planOffers.map(plan => <span key={plan.id}>{plan.name.replace(' Paws', '')}</span>)}</div>
            <dl>{planComparison.map(row => <div key={row.label} className="border-t border-white/10 p-4">
              <dt className="text-sm font-semibold mb-3">{row.label}</dt>
              <dd className="grid grid-cols-3 gap-3 text-center text-xs sm:text-sm leading-relaxed text-white/80">{row.values.map((value, index) => <span key={index}><span className="sr-only">{planOffers[index].name}: </span>{value === '—' ? 'Not listed' : value}</span>)}</dd>
            </div>)}</dl>
          </div>
          <p className="text-xs text-white/65 leading-relaxed mt-4">The existing Premium listings differ on deworming, blood panels and included grooming. Confirm these benefits and Calendar sync availability with the hospital. Your veterinarian can advise which care is appropriate for your pet.</p>
        </section>
      </div>
    </div>
  );
}

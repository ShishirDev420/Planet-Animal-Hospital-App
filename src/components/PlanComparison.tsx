import { useState } from 'react';
import { ArrowRight, Check, SlidersHorizontal } from 'lucide-react';
import { planComparison, planOffers, type PlanId } from '../lib/planOffers';

const groups = [
  { name: 'Everyday savings', labels: ['Consultations', 'Grooming discount', 'Core vaccinations'] },
  { name: 'Included care', labels: ['Deworming follow-up', 'Blood panels', 'Dental exam & consult', 'Included grooming', 'Full-body ultrasound'] },
  { name: 'Support & rewards', labels: ['Longevity officer', 'Paw Pal agent', 'Calendar sync', 'Listed points rate'] },
];

export default function PlanComparison({ onExplore }: { onExplore: (id: PlanId) => void }) {
  const [category, setCategory] = useState('All benefits');
  const [differences, setDifferences] = useState(false);
  const [focus, setFocus] = useState<PlanId | null>(null);
  const focused = planOffers.find(plan => plan.id === focus);
  const visible = planComparison.filter(row => (category === 'All benefits' || groups.find(group => group.name === category)?.labels.includes(row.label)) && (!differences || new Set(row.values).size > 1));
  return <section id="compare-plans" className="mt-12 scroll-mt-6" aria-labelledby="comparison-title">
    <div className="flex items-center gap-2 text-planet-yellow cinematic-kicker mb-3"><SlidersHorizontal size={14} aria-hidden="true"/>Make it your comparison</div>
    <h2 id="comparison-title" className="cinematic-card-title text-3xl sm:text-4xl max-w-xl">Find your kind of <span className="text-planet-yellow">care.</span></h2>
    <p className="text-sm text-white/75 leading-relaxed max-w-2xl mt-3">Compare the monthly fee with the care you expect to use. Included care and service discounts are different benefits; ask the clinic for individual prices before comparing total costs.</p>
    <div className="mt-6 flex flex-wrap gap-2" aria-label="Benefit categories">{['All benefits', ...groups.map(group => group.name)].map(name => <button key={name} type="button" aria-pressed={category === name} onClick={() => setCategory(name)} className={`rounded-full border px-4 py-3 text-xs sm:text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-planet-yellow ${category === name ? 'bg-planet-yellow border-planet-yellow text-black' : 'bg-white/[0.035] border-white/15 text-white/80'}`}>{name}</button>)}</div>
    <div className="my-5 flex flex-wrap items-center justify-between gap-3">
      <label className="flex items-center gap-3 text-sm text-white/85 cursor-pointer"><input type="checkbox" checked={differences} onChange={event => setDifferences(event.target.checked)} className="accent-[#fec708] h-4 w-4"/>Show differences only</label>
      <p className="text-xs text-white/60" role="status">{visible.length} benefits shown</p>
    </div>
    <div className="rounded-2xl border border-white/15 bg-[#071912]/70 overflow-hidden">
      <div className="grid grid-cols-3 gap-1 p-2 border-b border-white/15 bg-white/[0.04]">{planOffers.map(plan => <button key={plan.id} type="button" aria-label={`Focus on ${plan.name}`} aria-pressed={focus === plan.id} onClick={() => setFocus(focus === plan.id ? null : plan.id)} className={`min-w-0 rounded-xl px-1 py-4 text-center border focus-visible:outline-2 focus-visible:outline-planet-yellow ${focus === plan.id ? 'border-planet-yellow/60 bg-planet-yellow/[0.1]' : 'border-transparent'}`}><span className="block text-[11px] sm:text-sm font-semibold text-white">{plan.name.replace(' Paws', '')}</span><span className="block text-lg sm:text-2xl font-bold tracking-tight text-planet-yellow mt-2">{plan.price}</span><span className="text-[10px] text-white/60">/month</span></button>)}</div>
      <dl>{groups.map(group => { const rows = visible.filter(row => group.labels.includes(row.label)); return rows.length ? <div key={group.name}><div className="px-4 py-3 bg-white/[0.025] text-[10px] uppercase tracking-[0.18em] font-semibold text-planet-yellow/85">{group.name}</div>{rows.map(row => <div key={row.label} className="border-t border-white/[0.07] px-3 sm:px-5 py-4"><dt className="text-sm font-semibold text-white/95 mb-3">{row.label}</dt><dd className="grid grid-cols-3 gap-2 text-center text-xs sm:text-sm leading-relaxed">{row.values.map((value, index) => <span key={index} className={`flex min-w-0 flex-col justify-center items-center rounded-xl px-1 py-3 ${focus === planOffers[index].id ? 'bg-planet-yellow/[0.08] ring-1 ring-inset ring-planet-yellow/20' : 'bg-white/[0.025]'} ${value.startsWith('Confirm') ? 'text-planet-yellow' : value === '—' ? 'text-white/40' : 'text-white/90'}`}><span className="sr-only">{planOffers[index].name}: </span>{value === 'Included' && <Check size={14} className="mb-1 text-planet-yellow" aria-hidden="true"/>}{value === '—' ? 'Not listed' : value}</span>)}</dd></div>)}</div> : null; })}</dl>
      {visible.length === 0 && <p className="p-5 text-sm text-white/75">The listed benefits in this category match across all three plans. Turn off “Show differences only” to see them.</p>}
    </div>
    <p className="text-xs text-white/60 leading-relaxed mt-3">Tap a plan heading to highlight its column. “Not listed” means the benefit is absent from the listing, not a confirmed exclusion.</p>
    {focused && <div className="mt-5 rounded-2xl border border-planet-yellow/25 bg-planet-yellow/[0.06] p-5" role="region" aria-label={`${focused.name} comparison focus`}><p className="text-xs text-planet-yellow">Your comparison focus</p><h3 className="cinematic-card-title text-xl mt-2">{focused.name} · {focused.price}/month</h3><p className="text-sm text-white/80 mt-3">{focused.highlights.join(' · ')}</p><button type="button" onClick={() => onExplore(focused.id)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-planet-yellow px-4 py-3 text-sm font-semibold text-black">Explore {focused.name.replace(' Paws', '')}<ArrowRight size={16} aria-hidden="true"/></button></div>}
    <p className="text-xs text-white/65 leading-relaxed mt-5">Clinic wallet credit is separate from these care benefits; points do not create checkup entitlements. Items marked “Confirm” need clarification before joining. The existing Premium listings differ on deworming, blood panels and included grooming; Calendar sync availability also needs confirmation. Your veterinarian advises which care is appropriate for your pet.</p>
  </section>;
}

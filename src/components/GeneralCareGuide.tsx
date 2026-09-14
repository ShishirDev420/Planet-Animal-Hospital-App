import { useState } from 'react';

const guides = [
  { title: 'Everyday care', intro: 'Notice your pet’s usual habits and bring changes to your veterinarian’s attention.', items: ['Notice eating, drinking, activity and behaviour compared with your pet’s usual routine.', 'Review whether your pet has comfortable resting places and access to food and water.', 'Write down changes or questions to discuss with the clinic.'], source: 'https://www.aaha.org/resources/why-are-regular-veterinary-visits-important/' },
  { title: 'Prepare for a visit', intro: 'A little preparation helps you use your appointment well.', items: ['Gather previous care records and your current medication list.', 'Write your main concern and the questions you want answered.', 'Ask the clinic about arrival, transport and any preparation instructions.'], source: 'https://www.rcvsknowledge.org/resource/pre-consultation-conversation-guide-for-pet-owners/' },
  { title: 'Understand follow-up', intro: 'Use these questions to clarify the instructions your veterinarian gave you.', items: ['Check that you understand the recorded instructions; ask the clinic about anything unclear.', 'Ask which changes to watch for and who to contact with concerns.', 'Confirm whether a follow-up is needed and ask the clinic for the date.'], source: 'https://www.rcvsknowledge.org/resource/pre-consultation-conversation-guide-for-pet-owners/' },
];

export default function GeneralCareGuide() {
  const [selected, setSelected] = useState(0);
  const [checked, setChecked] = useState<string[]>([]);
  const guide = guides[selected];
  const count = guide.items.filter((_, i) => checked.includes(`${selected}:${i}`)).length;
  return <section aria-label="Free general care guide" className="liquid-glass relative rounded-[2rem] border border-white/10 p-5 text-white min-w-0 mb-5">
    <p className="cinematic-kicker text-planet-yellow">Free general guidance</p>
    <h2 className="cinematic-card-title text-2xl mt-2">Something useful to do now.</h2>
    <p className="mt-3 text-sm text-white/75">Choose a short guide. These prepared educational checklists are available without signing in. Your veterinarian sets your pet’s individual care plan.</p>
    <div className="flex flex-wrap gap-2 mt-4" aria-label="Choose a care topic">{guides.map((g, i) => <button key={g.title} type="button" aria-pressed={selected === i} onClick={() => setSelected(i)} className={`rounded-xl border px-3 py-3 text-sm ${selected === i ? 'border-planet-yellow bg-planet-yellow text-black' : 'border-white/20 text-white'}`}>{g.title}</button>)}</div>
    <h3 className="mt-5 font-semibold">{guide.title}</h3>
    <p className="mt-2 text-sm text-white/75">{guide.intro}</p>
    <ul className="mt-3 space-y-3">{guide.items.map((item, i) => { const id = `${selected}:${i}`; return <li key={id}><label className="flex items-start gap-3 text-sm leading-relaxed"><input type="checkbox" className="mt-1 shrink-0 accent-[#fec708]" checked={checked.includes(id)} onChange={e => setChecked(previous => e.target.checked ? [...previous, id] : previous.filter(value => value !== id))}/>{item}</label></li>; })}</ul>
    <p role="status" className="mt-4 text-xs text-planet-yellow">{count} of {guide.items.length} reviewed · checklist only, no care completion or points recorded.</p>
    <p className="mt-2 text-xs text-white/65">Selections stay on this page only. They are not sent to the clinic or an AI service.</p>
    <a href={guide.source} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs text-planet-yellow underline">Read the veterinary education source (opens a new tab)</a>
  </section>;
}

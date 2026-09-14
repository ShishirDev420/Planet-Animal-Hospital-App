/** Existing live plan cards, inspected 2026-09-13. No new prices or benefits. */
export const planOffers = [
  {
    id: 'essential', name: 'Essential Paws', price: '₹999',
    focus: 'Consultations & grooming',
    description: 'For regular consultations and grooming: pay less per service, with a free deworming follow-up each quarter.',
    highlights: ['15% off consultations', '10% off grooming'],
    features: ['Discounted core vaccinations', 'Free quarterly deworming follow-up'],
    points: '1.0×', surface: 'liquid-glass-essential',
  },
  {
    id: 'advanced', name: 'Advanced Paws', price: '₹1,999',
    focus: 'More included care benefits',
    description: 'Adds a dental exam and consultation, grooming every three months, and a dedicated longevity officer.',
    highlights: ['Free dental exam & consultation', '1 free grooming every 3 months'],
    features: ['Everything in Essential', 'Dedicated longevity officer', '15% off biannual blood panels'],
    points: '1.5×', surface: 'liquid-glass-advanced',
  },
  {
    id: 'prestige', name: 'Premium Paws', price: '₹3,499',
    focus: 'Wider service discounts',
    description: 'For wider care needs: half-price consultations and grooming, plus a listed twice-yearly ultrasound.',
    highlights: ['50% off consultations', '50% off grooming'],
    features: ['Paw Pal agent', 'Biannual full-body ultrasound', 'Calendar sync — confirm availability'],
    points: '2.0×', surface: 'liquid-glass-premium-tier',
  },
] as const;
export type PlanId = typeof planOffers[number]['id'];
// The old Premium comparison conflicted with its inherited card benefits in these rows.
// Keep uncertainty explicit instead of selecting the more generous claim.
export const planComparison = [
  { label: 'Consultations', values: ['15% off', '15% off', '50% off'] },
  { label: 'Grooming discount', values: ['10% off', '10% off', '50% off'] },
  { label: 'Core vaccinations', values: ['Discounted', 'Discounted', 'Discounted'] },
  { label: 'Deworming follow-up', values: ['Quarterly, free', 'Quarterly, free', 'Confirm frequency'] },
  { label: 'Blood panels', values: ['—', '15% off biannual panels', 'Confirm coverage'] },
  { label: 'Dental exam & consult', values: ['—', 'Free', 'Free'] },
  { label: 'Included grooming', values: ['—', '1 every 3 months', 'Confirm frequency'] },
  { label: 'Full-body ultrasound', values: ['—', '—', 'Biannual'] },
  { label: 'Longevity officer', values: ['—', 'Included', 'Included'] },
  { label: 'Paw Pal agent', values: ['—', '—', 'Included'] },
  { label: 'Calendar sync', values: ['—', '—', 'Confirm availability'] },
  { label: 'Listed points rate', values: ['1.0×', '1.5×', '2.0×'] },
] as const;

export function planInquiry(id: string): string {
  const plan = planOffers.find(p => p.id === id);
  if (!plan) throw new Error('Choose a listed plan.');
  return `Hello Planet Animal Hospital. I am interested in joining ${plan.name}, listed at ${plan.price}/month. Please confirm the current price, included benefits, eligibility and payment steps before I join. Thank you.`;
}

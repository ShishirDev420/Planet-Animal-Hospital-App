import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Shield, Zap, Check, Star, PawPrint } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';

const tiers = {
  essential: {
    id: 'essential',
    title: 'Essential Paws',
    price: '₹999',
    period: '/month',
    tag: 'starter',
    desc: 'Perfect for young, healthy pets to stay on track.',
    features: [
      { text: '15% Off Every Consultation' },
      { text: '10% Off Every Grooming' },
      { text: 'Discounted Core Vaccinations' },
      { text: 'Free Quarterly Deworming Follow-up' },
    ],
    pawPoints: '1.0×',
    accent: '#7ea892',
    accentDim: 'rgba(126, 168, 146, 0.15)',
  },
  advanced: {
    id: 'advanced',
    title: 'Advanced Paws',
    price: '₹1,999',
    period: '/month',
    tag: 'most popular',
    desc: 'Comprehensive care for adult pets.',
    features: [
      { text: 'Everything in Essential', highlight: true },
      { text: 'Dedicated longevity officer' },
      { text: '15% Off Biannual Blood Panels' },
      { text: 'Free Dental Exam & Consult' },
      { text: '1 Free Grooming / 3 months' },
    ],
    pawPoints: '1.5×',
    accent: '#f5a623',
    accentDim: 'rgba(245, 166, 35, 0.12)',
  },
  premium: {
    id: 'prestige',
    title: 'Premium Paws',
    price: '₹3,499',
    period: '/month',
    tag: 'elite',
    desc: 'The ultimate peace of mind for senior pets.',
    features: [
      { text: 'Everything in Advanced', highlight: true },
      { text: 'Paw Pal agent' },
      { text: 'Biannual Full-Body Ultrasound' },
      { text: '50% Off Grooming & Consults' },
      { text: 'Google Calendar Sync' },
    ],
    pawPoints: '2.0×',
    accent: '#9b6fc7',
    accentDim: 'rgba(155, 111, 199, 0.14)',
  },
};

const stagger = 0.12;

function PawSvg({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <ellipse cx="100" cy="132" rx="34" ry="28" fill={color} />
      <ellipse cx="56" cy="82" rx="20" ry="24" fill={color} transform="rotate(-8 56 82)" />
      <ellipse cx="88" cy="58" rx="18" ry="22" fill={color} transform="rotate(-4 88 58)" />
      <ellipse cx="122" cy="58" rx="18" ry="22" fill={color} transform="rotate(4 122 58)" />
      <ellipse cx="152" cy="82" rx="20" ry="24" fill={color} transform="rotate(8 152 82)" />
    </svg>
  );
}

function OrganicPawTrail({ color }: { color: string }) {
  const shouldReduceMotion = useReducedMotion();

  const steps = [
    { left: '6%', top: '86%', rotate: -22 },
    { left: '14%', top: '78%', rotate: 20 },
    { left: '20%', top: '68%', rotate: -18 },
    { left: '28%', top: '60%', rotate: 18 },
    { left: '34%', top: '52%', rotate: -16 },
    { left: '42%', top: '44%', rotate: 16 },
    { left: '48%', top: '36%', rotate: -14 },
    { left: '56%', top: '28%', rotate: 14 },
    { left: '62%', top: '20%', rotate: -12 },
    { left: '70%', top: '12%', rotate: 12 },
    { left: '76%', top: '6%', rotate: -10 },
    { left: '84%', top: '2%', rotate: 10 },
  ];

  const stepInterval = 1.0;
  const printLife = 3.6;

  if (shouldReduceMotion) {
    return (
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden rounded-2xl" aria-hidden="true">
        {steps.slice(0, 4).map((step, i) => (
          <div
            key={i}
            className="absolute h-[22px] w-[22px]"
            style={{
              left: step.left,
              top: step.top,
              marginLeft: -11,
              marginTop: -11,
              transform: `rotate(${step.rotate}deg)`,
              opacity: 0.14,
            }}
          >
            <PawSvg color={color} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 z-[1] pointer-events-none overflow-hidden rounded-2xl"
      aria-hidden="true"
    >
      {steps.map((step, i) => (
        <motion.div
          key={i}
          className="absolute h-[22px] w-[22px]"
          style={{
            left: step.left,
            top: step.top,
            marginLeft: -11,
            marginTop: -11,
          }}
          animate={{
            opacity: [0, 0.20, 0.14, 0],
            scale: [0.88, 1.0, 0.96, 0.82],
          }}
          transition={{
            duration: printLife,
            delay: i * stepInterval,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          <div style={{ transform: `rotate(${step.rotate}deg)` }}>
            <PawSvg color={color} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function ProactivePlans() {
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = onSnapshot(doc(db, 'users', auth.currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurrentPlan(data.currentPlan || data.petProfile?.currentPlan || 'free');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSelectPlan = async (planId: string) => {
    if (!auth.currentUser) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        currentPlan: planId,
        'petProfile.currentPlan': planId,
      });
    } catch (error) {
      console.error('Error updating plan:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="pb-16 text-white/95 relative min-h-screen">

      {/* Background Ambient Orbs — General Theme */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 flex justify-center isolate">
        <div className="relative w-full max-w-5xl h-full">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-planet-yellow/40 rounded-full blur-3xl opacity-60 animate-blob transform-gpu" />
          <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-teal-300/40 rounded-full blur-3xl opacity-60 animate-blob animation-delay-2000 transform-gpu" />
          <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-amber-200/40 rounded-full blur-3xl opacity-60 animate-blob animation-delay-4000 transform-gpu" />
        </div>
      </div>

      {/* Desktop Header */}
      <header className="hidden lg:block px-8 pt-10 pb-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-2 bg-planet-yellow/15 text-planet-yellow px-3 py-1 rounded-full text-xs font-bold tracking-wide">
              <Shield size={13} />
              Preventative Care
            </span>
          </div>
          <h1 className="text-[3.25rem] leading-[1.08] font-bold tracking-tight text-white mb-5 max-w-3xl">
            Stop emergencies<br />
            <span className="text-planet-yellow">before they start.</span>
          </h1>
          <p className="text-base font-medium text-slate-300 leading-relaxed max-w-2xl mb-6">
            A skipped checkup can snowball. Our plans catch the small things before they become expensive emergencies — so your pet stays healthier, longer.
          </p>
          <div className="inline-flex items-center gap-2.5 bg-white/[0.06] border border-white/10 rounded-xl px-5 py-3">
            <Zap size={17} className="text-planet-yellow shrink-0" />
            <p className="text-sm text-slate-200 font-medium">
              Upgrade to unlock <span className="text-white font-semibold">Point Multipliers</span> up to 2.0× on every visit.
            </p>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden px-6 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] mb-2">
        <div className="flex items-center justify-between w-full py-4">
          <div className="w-12 shrink-0 pl-[calc(env(safe-area-inset-left,0px))]">
            <button onClick={() => navigate('/profiles')}>
              <div className="drop-shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-transform active:scale-95">
                <Logo className="!w-12 !h-12" />
              </div>
            </button>
          </div>
          <div className="flex flex-col items-center flex-1 text-center pointer-events-none">
            <h1 className="text-sm font-display font-black text-white/95 tracking-tight uppercase leading-none">
              PLANET ANIMAL
            </h1>
            <p className="text-[7px] font-bold text-planet-yellow uppercase tracking-[0.15em] mt-0.5">
              HOSPITAL & WELLNESS
            </p>
          </div>
          <div className="w-12 shrink-0 pr-[calc(env(safe-area-inset-right,0px))]" />
        </div>
      </header>

      {/* Mobile Hero */}
      <div className="lg:hidden px-6 pt-4 pb-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}>
          <div className="inline-flex items-center gap-2 bg-planet-yellow/15 text-planet-yellow px-3 py-1 rounded-full text-xs font-bold mb-3 tracking-wide">
            <Shield size={12} />
            Preventative Care
          </div>
          <h1 className="text-3xl font-bold tracking-tight leading-tight text-white mb-3">
            Stop emergencies <span className="text-planet-yellow">before they start.</span>
          </h1>
          <p className="text-sm font-medium text-slate-300 leading-relaxed mb-4">
            The 'Domino Effect' in pet health is real. Our proactive plans catch the small things before they become heartbreaking emergencies.
          </p>
          <div className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5">
            <Zap size={15} className="text-planet-yellow shrink-0" />
            <p className="text-xs text-slate-200 font-medium">
              Up to <span className="text-white font-semibold">2.0× Point Multipliers</span> on every visit.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Pricing Cards */}
      <div className="px-6 lg:px-8 max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-7">
          {(['essential', 'advanced', 'premium'] as const).map((key, i) => {
            const t = tiers[key];
            const isHero = key === 'advanced';
            const isElite = key === 'premium';
            const isActive = currentPlan === t.id;

            const liquidClass = isElite
              ? 'liquid-glass-premium-tier'
              : isHero
                ? 'liquid-glass-advanced'
                : 'liquid-glass-essential';

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * stagger, duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
                whileHover={{ y: -6, transition: { duration: 0.3, ease: [0.25, 1, 0.5, 1] } }}
                className={`relative rounded-2xl flex flex-col min-h-[480px] lg:min-h-[540px] liquid-glass-tier ${liquidClass} ${isHero ? 'md:-mt-4 md:mb-[-12px]' : ''}`}
              >
                <OrganicPawTrail color={t.accent} />
                <div className="absolute inset-0 z-[0] rounded-2xl bg-gradient-to-b from-black/22 via-black/14 to-black/26" />

                {/* Hero indicator */}
                {isHero && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <span className="inline-flex items-center gap-1.5 bg-planet-yellow text-black text-[11px] font-black px-4 py-1.5 rounded-full tracking-wide shadow-lg">
                      <Star size={12} />
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="relative z-10 flex flex-col h-full p-7 lg:p-8">
                  {/* Header */}
                  <div className="mb-6">
                    <span
                      className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] mb-2"
                      style={{ color: t.accent }}
                    >
                      {t.tag}
                    </span>
                    <h3 className="text-xl font-semibold text-white">{t.title}</h3>
                    <p className="text-sm font-medium text-white/82 mt-1.5 leading-relaxed">{t.desc}</p>
                  </div>

                  {/* Price */}
                  <div className="flex items-end gap-1.5 mb-7">
                    <span className="text-[2.5rem] leading-none font-bold text-white">{t.price}</span>
                    <span className="text-sm text-white/65 font-medium pb-0.5">{t.period}</span>
                  </div>

                  {/* Paw Points badge */}
                  <div
                    className="inline-flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 mb-6"
                    style={{ backgroundColor: t.accentDim }}
                  >
                    <PawPrint size={14} style={{ color: t.accent }} />
                    <span
                      className="text-sm font-semibold text-white/80"
                      style={{ color: t.accent }}
                    >
                      {t.pawPoints}
                    </span>
                    <span className="text-xs font-medium text-white/72">Paw Points Multiplier</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-8 flex-grow">
                    {t.features.map((f, fi) => (
                      <li
                        key={fi}
                        className="flex items-start gap-2.5"
                        style={f.highlight ? { borderLeft: `2px solid ${t.accent}`, paddingLeft: '10px' } : {}}
                      >
                        <Check
                          size={15}
                          className="shrink-0 mt-0.5"
                          style={{ color: f.highlight ? t.accent : '#64748b' }}
                        />
                        <span
                          className={`text-sm leading-snug ${f.highlight ? 'text-white font-semibold' : 'text-white/86 font-medium'}`}
                        >
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => handleSelectPlan(t.id)}
                    disabled={isUpdating || isActive}
                    className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 ${
                      isActive
                        ? 'bg-white/5 text-planet-yellow border border-white/10 cursor-default'
                        : isHero
                          ? 'bg-planet-yellow text-black hover:brightness-105 shadow-lg shadow-planet-yellow/20 hover:scale-[1.02]'
                          : isElite
                            ? 'text-white border-2 hover:scale-[1.02]'
                            : 'bg-white/5 text-white border border-white/15 hover:bg-white/10 hover:scale-[1.02]'
                    }`}
                    style={isElite && !isActive ? { borderColor: t.accent, color: t.accent } : {}}
                  >
                    {isActive ? 'Current Plan' : isUpdating ? 'Updating...' : `Choose ${t.title.split(' ')[0]}`}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="hidden lg:block px-8 mt-20 max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white mb-2">Compare plans</h2>
          <p className="text-sm font-medium text-slate-400">Every plan includes our core preventative care. Upgrade for more.</p>
        </div>
        <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ backgroundColor: '#0c1410' }}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left p-5 pl-6 text-sm font-semibold text-slate-300 w-[200px]">Feature</th>
                {(['essential', 'advanced', 'premium'] as const).map((k) => {
                  const t = tiers[k];
                  const isCenter = k === 'advanced';
                  const isPremium = k === 'premium';
                  return (
                    <th
                      key={k}
                      className="p-5 text-center"
                      style={isCenter ? { backgroundColor: 'rgba(245, 166, 35, 0.06)' } : isPremium ? { backgroundColor: 'rgba(155, 111, 199, 0.04)' } : {}}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-semibold" style={{ color: isCenter ? '#f5a623' : isPremium ? '#9b6fc7' : '#7ea892' }}>
                          {t.title}
                        </span>
                        <span className="text-xs text-slate-500">{t.price}{t.period}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {[
                ['Consultation Discount', '15% off', '15% off', '50% off'],
                ['Grooming Discount', '10% off', '10% off', '50% off'],
                ['Core Vaccinations', 'Discounted', 'Discounted', 'Discounted'],
                ['Deworming Follow-up', 'Quarterly', 'Quarterly', 'Monthly'],
                ['Blood Panels', '—', '15% off', 'Included'],
                ['Dental Exam', '—', 'Free', 'Free'],
                ['Free Grooming', '—', '1 per 3 mo.', 'Monthly'],
                ['Full-Body Ultrasound', '—', '—', 'Biannual'],
                ['Paw Points Multiplier', '1.0×', '1.5×', '2.0×'],
                ['Longevity Officer', '—', '✓', '✓'],
                ['Paw Pal Agent', '—', '—', '✓'],
                ['Google Calendar Sync', '—', '—', '✓'],
              ].map((row, ri) => (
                <tr key={ri} className="border-b border-white/[0.04]" style={ri % 2 === 1 ? { backgroundColor: 'rgba(255,255,255,0.015)' } : {}}>
                  <td className="p-3.5 pl-6 text-sm text-slate-300">{row[0]}</td>
                  {([1, 2, 3] as const).map((ci) => {
                    const isCenter = ci === 2;
                    const isPremium = ci === 3;
                    return (
                      <td
                        key={ci}
                        className="p-3.5 text-center text-sm"
                        style={{
                          color: isCenter ? '#f5a623' : isPremium ? '#9b6fc7' : '#94a3b8',
                          backgroundColor: isCenter ? 'rgba(245, 166, 35, 0.04)' : isPremium ? 'rgba(155, 111, 199, 0.04)' : 'transparent',
                        }}
                      >
                        {row[ci]}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

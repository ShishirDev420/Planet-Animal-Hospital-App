import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle2, Zap, ArrowRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';

export default function ProactivePlans() {
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = onSnapshot(doc(db, 'users', auth.currentUser.uid), (docSnap) => {
      if (docSnap.exists() && docSnap.data().petProfile?.currentPlan) {
        setCurrentPlan(docSnap.data().petProfile.currentPlan);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSelectPlan = async (planId: string) => {
    if (!auth.currentUser) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        'petProfile.currentPlan': planId
      });
    } catch (error) {
      console.error('Error updating plan:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="pb-12 dark:text-white/95 relative min-h-screen">
      {/* Background Ambient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 flex justify-center">
        <div className="relative w-full max-w-5xl h-full">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-planet-yellow/40 rounded-full blur-3xl opacity-60 animate-blob"></div>
          <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-teal-300/40 rounded-full blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-amber-200/40 rounded-full blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Header with Logo */}
      <header className="px-6 pt-4 mb-2">
        <div className="relative flex items-center justify-between w-full py-4">
          <div className="relative z-10">
            <button onClick={() => navigate('/profiles')} className="shrink-0 group">
              <div className="origin-left drop-shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-transform active:scale-95">
                <Logo className="!w-16 !h-16" />
              </div>
            </button>
          </div>
            
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-0 w-max pointer-events-none whitespace-nowrap">
            <span className="text-lg font-display font-black text-slate-800 tracking-tight uppercase block leading-none dark:text-white/95">PLANET ANIMAL</span>
            <span className="text-[10px] font-bold text-[#fec708] uppercase tracking-[0.25em] mt-0.5 dark:text-[#fec708]">HOSPITAL & WELLNESS</span>
          </div>

          <div className="relative z-10 w-16 h-16"></div>
        </div>
      </header>

      {/* Hero / Educational Hook */}
      <div className="px-6 pt-6 pb-8 relative max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-2 bg-planet-yellow/20 text-[#fec708] px-3 py-1 rounded-full text-xs font-bold mb-4 border border-planet-yellow/30">
            <Shield size={14} />
            Preventative Care
          </div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight leading-tight mb-4 text-white drop-shadow-md md:text-5xl">
            Stop emergencies <br/>
            <span className="text-[#fec708]">before they start.</span>
          </h1>
          <p className="font-body font-medium text-slate-200 text-sm md:text-base leading-relaxed mb-6 max-w-2xl">
            The 'Domino Effect' in pet health is real. A skipped proactive checkup or biannual blood test can lead to hidden infections, which can lead to organ stress. Our proactive plans are designed to catch the small things before they become heartbreaking—and expensive—emergencies.
          </p>
          <div className="glass p-5 rounded-2xl border-l-4 border-l-planet-yellow dark:bg-neutral-900 dark:border-white/10 md:inline-block">
            <p className="text-sm font-medium font-body text-slate-200 leading-relaxed">
              <Zap className="inline text-planet-yellow mr-1" size={16}/>
              Upgrading unlocks <strong className="text-white">Point Multipliers</strong> up to 2.0x for every visit.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Pricing Cards */}
      <div className="px-6 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <PlanCard
          title="Essential Paws"
          planId="essential"
          price="₹999"
          period="/month"
          description="Perfect for young, healthy pets to stay on track."
          features={["15% Off Every Consultation", "10% Off Every Grooming", "Discounted Core Vaccinations", "Free Quarterly Deworming Follow-up", "0.5x Paw Points Multiplier"]}
          delay={0.1}
          currentPlan={currentPlan}
          onSelect={handleSelectPlan}
          isUpdating={isUpdating}
        />
        <PlanCard
          title="Advanced Paws"
          planId="advanced"
          price="₹1,999"
          period="/month"
          description="Comprehensive care for adult pets."
          features={[
            "Everything in Essential", 
            "15% Off Biannual Blood Panels", 
            "Free Dental Exam & Consult", 
            "1 Free Grooming / 3 months",
            "1.5x Paw Points Multiplier"
          ]}
          isPopular
          delay={0.2}
          currentPlan={currentPlan}
          onSelect={handleSelectPlan}
          isUpdating={isUpdating}
        />
        <PlanCard
          title="Prestige Paws"
          planId="prestige"
          price="₹3,499"
          period="/month"
          description="The ultimate peace of mind for senior pets."
          features={[
            "Everything in Advanced", 
            "Biannual Full-Body Ultrasound", 
            "50% Off Grooming & Consults", 
            "Google Calendar Sync",
            "2.0x Paw Points Multiplier"
          ]}
          isElite
          delay={0.3}
          currentPlan={currentPlan}
          onSelect={handleSelectPlan}
          isUpdating={isUpdating}
        />
      </div>
    </div>
  );
}

function PlanCard({ title, planId, price, period, description, features, isPopular, isElite, delay, currentPlan, onSelect, isUpdating }: any) {
  const isCurrentPlan = currentPlan === planId;
  const baseClasses = isElite 
    ? 'glass-card dark:bg-neutral-900 dark:border-white/10 ring-2 ring-[#fec708] relative overflow-hidden z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#e8bc4b]/15 to-transparent'
    : isPopular 
      ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/30 dark:bg-black dark:border dark:border-white/20 mt-10 md:mt-0 md:scale-105 z-20' 
      : 'glass-card dark:bg-neutral-900 dark:border-white/10';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={
        isElite 
          ? { opacity: 1, y: 0, boxShadow: ['0px 0px 30px rgba(232,188,75,0.1)', '0px 0px 60px rgba(232,188,75,0.3)', '0px 0px 30px rgba(232,188,75,0.1)'] } 
          : { opacity: 1, y: 0 }
      }
      transition={
        isElite
          ? { default: { delay }, boxShadow: { duration: 8, repeat: Infinity, ease: "easeInOut" } }
          : { delay }
      }
      className={`relative rounded-3xl p-6 ${isPopular ? 'pt-12 md:pt-14' : ''} ${baseClasses} h-full flex flex-col`}
    >
      {isPopular && (
        <div className="whitespace-nowrap flex-shrink-0 absolute -top-4 left-1/2 -translate-x-1/2 bg-[#fec708] text-black text-xs font-black px-4 py-1 rounded-full shadow-lg z-20">
          MOST POPULAR
        </div>
      )}
      <div className="relative z-10 flex-grow">
        <h3 className={`font-heading font-bold text-xl mb-1 ${isPopular ? 'text-white pt-2' : 'text-slate-800 dark:text-white'}`}>{title}</h3>
        <p className={`font-body font-medium text-sm mb-4 leading-relaxed ${isPopular ? 'text-slate-200' : 'text-slate-600 dark:text-slate-300'}`}>{description}</p>
        <div className="flex items-end gap-1 mb-6">
          <span className="font-heading text-4xl font-black tracking-tighter">{price}</span>
          <span className={`font-medium pb-1 font-body ${isPopular ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>{period}</span>
        </div>

        <ul className="space-y-3 mb-8">
          {features.map((f: string, i: number) => (
            <li key={i} className="flex items-start gap-3 text-sm font-body font-medium leading-tight">
              <CheckCircle2 className="shrink-0 text-[#fec708] mt-0.5" size={16} />
              <span className={`${isPopular ? 'text-slate-200' : 'text-slate-700 dark:text-slate-200'} break-words`}>{f}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="relative z-10 mt-auto">
        {isCurrentPlan ? (
          <button disabled className="w-full py-4 bg-green-500/20 text-green-500 border border-green-500/30 font-bold rounded-xl flex items-center justify-center gap-2">
            <Check size={18} /> Current Plan
          </button>
        ) : (
          <button 
            disabled={isUpdating}
            onClick={() => onSelect(planId)} 
            className="w-full py-4 bg-[#fec708] text-black font-bold rounded-xl shadow-lg hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isUpdating ? 'Updating...' : 'Choose Plan'} <ArrowRight size={18} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

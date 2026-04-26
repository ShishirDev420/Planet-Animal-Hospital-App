import { motion } from 'framer-motion';
import { Shield, CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

export default function ProactivePlans() {
  const navigate = useNavigate();

  return (
    <div className="pb-12 dark:text-white/95">
      {/* Header with Logo */}
      <header className="px-6 pt-4 mb-2">
        <div className="relative flex items-center justify-between w-full py-4">
          {/* Logo Container (Left) */}
          <div className="relative z-10">
            <button onClick={() => navigate('/profiles')} className="shrink-0 group">
              <div className="animate-sync-heartbeat origin-left drop-shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-transform active:scale-95">
                <Logo className="!w-16 !h-16" />
              </div>
            </button>
          </div>
            
          {/* Center Text Container */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-0 w-max pointer-events-none whitespace-nowrap">
            <span className="text-lg font-display font-black text-slate-800 tracking-tight uppercase block leading-none dark:text-white/95">PLANET ANIMAL</span>
            <span className="text-[10px] font-bold text-[#fec708] uppercase tracking-[0.25em] mt-0.5 dark:text-[#fec708]">HOSPITAL & WELLNESS</span>
          </div>

          {/* Spacer (Right) */}
          <div className="relative z-10 w-16 h-16"></div>
        </div>
      </header>

      {/* Hero / Educational Hook */}
      <div className="px-6 pt-6 pb-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-2 bg-planet-yellow/20 text-[#fec708] px-3 py-1 rounded-full text-xs font-bold mb-4 border border-planet-yellow/30">
            <Shield size={14} />
            Preventative Care
          </div>
          <h1 className="text-3xl font-heading font-extrabold tracking-tight leading-tight mb-4 text-white drop-shadow-md">
            Stop emergencies <br/>
            <span className="text-[#fec708]">before they start.</span>
          </h1>
          <p className="font-body font-medium text-slate-200 text-sm leading-relaxed mb-6">
            The 'Domino Effect' in pet health is real. A skipped proactive checkup or biannual blood test can lead to hidden infections, which can lead to organ stress. Our proactive plans are designed to catch the small things before they become heartbreaking—and expensive—emergencies.
          </p>
          <div className="glass p-5 rounded-2xl border-l-4 border-l-planet-yellow dark:bg-neutral-900 dark:border-white/10">
            <p className="text-sm font-medium font-body text-slate-200 leading-relaxed">
              <Zap className="inline text-planet-yellow mr-1" size={16}/>
              All plans instantly unlock the <strong className="text-white">2x Points Multiplier</strong> for every visit.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Pricing Cards */}
      <div className="px-6 space-y-6">
        <PlanCard
          title="Essential Paws"
          price="₹999"
          period="/month"
          description="Perfect for young, healthy pets to stay on track."
          features={["25% Off Every Consultation", "Discounted Core Vaccinations", "Free Quarterly Deworming Follow-up & Administration"]}
          delay={0.1}
        />
        <PlanCard
          title="Advanced Paws"
          price="₹1,999"
          period="/month"
          description="Comprehensive care for adult pets."
          features={[
            "Everything in Essential", 
            "Biannual Blood Panels", 
            "Free Dental Exam & Consult (Once every 6 months)", 
            "1 Free Grooming (Once every 3 months)",
            "Dedicated Longevity Officer (Monthly Updates)"
          ]}
          isPopular
          delay={0.2}
        />
        <PlanCard
          title="Prestige Paws"
          price="₹3,499"
          period="/month"
          description="The ultimate peace of mind for senior pets."
          features={[
            "Everything in Advanced", 
            "Biannual Full-Body Ultrasound", 
            "50% Off Grooming & Consults", 
            "Advanced Roadmap + Live Doctor Consult",
            "Google Calendar Sync",
            "Paw Pal AI Agent"
          ]}
          isElite
          delay={0.3}
        />
      </div>
    </div>
  );
}

function PlanCard({ title, price, period, description, features, isPopular, isElite, delay }: any) {
  const baseClasses = isElite 
    ? 'glass-card dark:bg-neutral-900 dark:border-white/10 ring-2 ring-[#fec708] relative overflow-hidden scale-105 z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#e8bc4b]/15 to-transparent'
    : isPopular 
      ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/30 dark:bg-black dark:border dark:border-white/20 mt-10' 
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
      className={`relative rounded-3xl p-6 ${isPopular ? 'pt-12' : ''} ${baseClasses}`}
    >
      {isPopular && (
        <div className="whitespace-nowrap flex-shrink-0 absolute -top-4 left-1/2 -translate-x-1/2 bg-[#fec708] text-black text-xs font-black px-4 py-1 rounded-full shadow-lg z-20">
          MOST POPULAR
        </div>
      )}
      {/* Wrapping content in relative z-10 to stay above background */}
      <div className="relative z-10">
        <h3 className={`font-heading font-bold text-xl mb-1 ${isPopular ? 'text-white pt-2' : 'text-slate-800 dark:text-white'}`}>{title}</h3>
        <p className={`font-body font-medium text-sm mb-4 leading-relaxed ${isPopular ? 'text-slate-200' : 'text-slate-600 dark:text-slate-300'}`}>{description}</p>
        <div className="flex items-end gap-1 mb-6">
          <span className="font-heading text-4xl font-black tracking-tighter">{price}</span>
          <span className={`font-medium pb-1 font-body ${isPopular ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>{period}</span>
        </div>

        <ul className="space-y-3 mb-8">
          {features.map((f: string, i: number) => (
            <li key={i} className="flex items-start gap-3 text-sm font-body font-medium">
              <CheckCircle2 className="shrink-0 text-[#fec708]" size={18} />
              <span className={`${isPopular ? 'text-slate-200' : 'text-slate-700 dark:text-slate-200'}`}>{f}</span>
            </li>
          ))}
        </ul>

        <button className="w-full py-4 bg-[#fec708] text-black font-bold rounded-xl shadow-lg hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-2 active:scale-95">
          Choose Plan <ArrowRight size={18} />
        </button>
      </div>
    </motion.div>
  );
}

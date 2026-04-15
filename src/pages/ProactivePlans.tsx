import { motion } from 'framer-motion';
import { Shield, CheckCircle2, Zap, ArrowRight } from 'lucide-react';

export default function ProactivePlans() {
  return (
    <div className="pb-12 dark:text-white/95">
      {/* Hero / Educational Hook */}
      <div className="px-6 pt-12 pb-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-2 bg-planet-yellow/20 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold mb-4 border border-planet-yellow/30">
            <Shield size={14} />
            Preventative Care
          </div>
          <h1 className="text-3xl font-black tracking-tight leading-tight mb-4 dark:text-white/95">
            Stop emergencies <br/>
            <span className="text-slate-400 dark:text-white/40">before they start.</span>
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed mb-6 dark:text-white/60">
            The "Domino Effect" in pet health is real. A skipped dental checkup can lead to infections, which can lead to organ stress. Our proactive plans are designed to catch the small things before they become heartbreaking—and expensive—emergencies.
          </p>
          <div className="glass p-4 rounded-2xl border-l-4 border-l-planet-yellow dark:bg-neutral-900 dark:border-white/10">
            <p className="text-sm font-medium text-slate-800 dark:text-white/90">
              <Zap className="inline text-planet-yellow mr-1" size={16}/>
              All plans instantly unlock the <strong className="text-black dark:text-white">2x Points Multiplier</strong> for every visit.
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
          features={["25% Off Every Consultation", "Annual Core Vaccinations", "Free Quarterly Deworming"]}
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
            "50% Off Annual Dental Scaling", 
            "Free Pre-Dental Exam & Consult", 
            "1 Free Grooming/mo",
            "Dedicated Longevity Officer (Monthly Updates)"
          ]}
          isPopular
          delay={0.2}
        />
        <PlanCard
          title="Planet Premium"
          price="₹3,499"
          period="/month"
          description="The ultimate peace of mind for senior pets."
          features={[
            "Everything in Advanced", 
            "Biannual Full-Body Ultrasound", 
            "50% Off Grooming & Consults", 
            "Advanced Roadmap + Live Doctor Consult",
            "Google Calendar Sync",
            "Priority 24/7 AI Routing"
          ]}
          delay={0.3}
        />
      </div>
    </div>
  );
}

function PlanCard({ title, price, period, description, features, isPopular, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`relative rounded-3xl p-6 ${isPopular ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/30 dark:bg-black dark:border dark:border-white/20' : 'glass-card dark:bg-neutral-900 dark:border-white/10'}`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-planet-yellow text-black text-xs font-black px-4 py-1 rounded-full shadow-lg dark:bg-yellow-400">
          MOST POPULAR
        </div>
      )}
      <h3 className={`text-xl font-bold mb-1 ${isPopular ? 'text-white' : 'text-slate-800 dark:text-white/95'}`}>{title}</h3>
      <p className={`text-sm mb-4 ${isPopular ? 'text-slate-400' : 'text-slate-500 dark:text-white/60'}`}>{description}</p>
      <div className="flex items-end gap-1 mb-6">
        <span className="text-4xl font-black tracking-tighter">{price}</span>
        <span className={`font-medium pb-1 ${isPopular ? 'text-slate-400' : 'text-slate-500'}`}>{period}</span>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((f: string, i: number) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <CheckCircle2 className={`shrink-0 ${isPopular ? 'text-planet-yellow' : 'text-teal-500'}`} size={18} />
            <span className={isPopular ? 'text-slate-200' : 'text-slate-700'}>{f}</span>
          </li>
        ))}
      </ul>

      <button className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 ${isPopular ? 'bg-planet-yellow text-black' : 'bg-slate-900 text-white'}`}>
        Choose Plan <ArrowRight size={18} />
      </button>
    </motion.div>
  );
}

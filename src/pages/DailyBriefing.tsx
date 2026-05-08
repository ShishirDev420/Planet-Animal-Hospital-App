import { motion } from 'framer-motion';
import { Sparkles, Calendar, ArrowRight, ShieldCheck, Heart, Zap, Info, ChevronRight, Clock } from 'lucide-react';
import { usePetProfile } from '../hooks/usePetProfile';
import { usePawlMessage } from '../hooks/usePawlMessage';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function DailyBriefing() {
  const { profile, loading: profileLoading } = usePetProfile();
  const { message, loading: messageLoading, error: messageError } = usePawlMessage();
  const navigate = useNavigate();

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-full pb-20">
      {/* Header Section */}
      <header className="mb-8 px-4 pt-4">
        <div className="flex items-center justify-between mb-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <span className="text-[10px] font-bold text-planet-yellow uppercase tracking-[0.2em] mb-1">
              {today}
            </span>
            <h1 className="text-3xl font-heading font-black text-slate-900 dark:text-white tracking-tight">
              Daily Briefing
            </h1>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-12 h-12 rounded-2xl bg-planet-yellow/10 border border-planet-yellow/20 flex items-center justify-center text-planet-yellow"
          >
            <Sparkles size={24} />
          </motion.div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Everything you need to keep {profile?.petName || 'your pet'} happy today.
        </p>
      </header>

      <div className="px-4 space-y-6">
        {/* Pawl's Daily Insight - Main Highlight */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap size={120} className="text-planet-yellow" />
          </div>
          
          <div className="liquid-glass rounded-3xl border border-white/20 p-6 relative z-10 shadow-xl bg-gradient-to-br from-white/40 to-white/10 dark:from-white/5 dark:to-transparent">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 to-yellow-400 flex items-center justify-center shadow-lg">
                <span className="text-xl">🐾</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Pawl's Daily Insight</h3>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">AI-Powered Personalized Tip</p>
              </div>
            </div>

            {messageLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-white/10 rounded-full w-3/4"></div>
                <div className="h-4 bg-slate-200 dark:bg-white/10 rounded-full w-full"></div>
                <div className="h-4 bg-slate-200 dark:bg-white/10 rounded-full w-5/6"></div>
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-slate-700 dark:text-slate-200 text-base leading-relaxed font-medium">
                  {message}
                </p>
              </div>
            )}

            {messageError && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                <Info size={14} />
                <span>Could not connect to Pawl. Showing general tips.</span>
              </div>
            )}
            
            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-200/50 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Verified by Planet Animal Vets</span>
              <button 
                onClick={() => window.open('https://wa.me/919004290923', '_blank')}
                className="flex items-center gap-1 text-[10px] font-black text-planet-yellow uppercase tracking-widest hover:translate-x-1 transition-transform"
              >
                Ask Vet <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </motion.section>

        {/* Daily Checklist */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar size={16} className="text-planet-yellow" />
              Today's Vitals
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <VitalItem 
              icon={<ShieldCheck size={18} />} 
              label="Vaccination Status" 
              value="Up to date" 
              color="text-emerald-500"
              bg="bg-emerald-500/10"
            />
            <VitalItem 
              icon={<Heart size={18} />} 
              label="Wellness Score" 
              value="92/100" 
              color="text-pink-500"
              bg="bg-pink-500/10"
            />
            <VitalItem 
              icon={<Clock size={18} />} 
              label="Next Grooming" 
              value="In 12 days" 
              color="text-blue-500"
              bg="bg-blue-500/10"
            />
          </div>
        </motion.section>

        {/* Quick Actions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-4"
        >
          <QuickActionCard 
            title="Book a Consult" 
            desc="Speak with an expert" 
            icon={<Zap size={20} />} 
            onClick={() => navigate('/ai')}
          />
          <QuickActionCard 
            title="Update Logs" 
            desc="Track health data" 
            icon={<ArrowRight size={20} />} 
            onClick={() => navigate('/')}
          />
        </motion.section>
      </div>
    </div>
  );
}

function VitalItem({ icon, label, value, color, bg }: { icon: any, label: string, value: string, color: string, bg: string }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bg, color)}>
          {icon}
        </div>
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{label}</span>
      </div>
      <span className={cn("text-sm font-bold", color)}>{value}</span>
    </div>
  );
}

function QuickActionCard({ title, desc, icon, onClick }: { title: string, desc: string, icon: any, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="p-4 rounded-3xl bg-planet-yellow text-black text-left flex flex-col gap-3 shadow-lg shadow-planet-yellow/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
    >
      <div className="w-10 h-10 rounded-2xl bg-black/10 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h4 className="font-heading font-black text-xs uppercase tracking-tight">{title}</h4>
        <p className="text-[10px] font-medium opacity-70 leading-tight mt-0.5">{desc}</p>
      </div>
    </button>
  );
}

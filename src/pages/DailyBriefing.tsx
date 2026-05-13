import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, ArrowRight, ShieldCheck, Heart, Zap, Info, ChevronRight, Clock, CheckCircle2, Sun, Moon, SunDim } from 'lucide-react';
import { usePetProfile } from '../hooks/usePetProfile';
import { usePawlMessage } from '../hooks/usePawlMessage';
import { useTimeOfDay, type TimePeriod, PERIOD_DISPLAY } from '../hooks/useTimeOfDay';
import { useCheckInStatus } from '../hooks/useCheckInStatus';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const PERIOD_ORDER: TimePeriod[] = ['morning', 'afternoon', 'evening'];

function getPeriodIcon(period: TimePeriod, size: number = 20) {
  switch (period) {
    case 'morning': return <Sun size={size} className="text-amber-500" />;
    case 'afternoon': return <SunDim size={size} className="text-orange-500" />;
    case 'evening': return <Moon size={size} className="text-indigo-400" />;
  }
}

export default function DailyBriefing() {
  const { profile, loading: profileLoading } = usePetProfile();
  const { currentPeriod, nextPeriod } = useTimeOfDay();
  const navigate = useNavigate();

  const uid = profile?.uid || profile?.parentName || 'demo';
  const {
    completedPeriods,
    isPeriodComplete,
    completePeriod,
    currentIncompletePeriod,
    allComplete,
    progressPercent,
    completedCount,
    totalPeriods,
  } = useCheckInStatus(uid, currentPeriod);

  const [activePeriod, setActivePeriod] = useState<TimePeriod>(currentPeriod);

  const { message, loading: messageLoading, error: messageError } = usePawlMessage(activePeriod);

  useEffect(() => {
    if (currentIncompletePeriod && activePeriod !== currentIncompletePeriod) {
      setActivePeriod(currentIncompletePeriod);
    }
  }, [currentIncompletePeriod]);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const display = PERIOD_DISPLAY[activePeriod];
  const isActiveComplete = completedPeriods.includes(activePeriod);
  const periodIndex = PERIOD_ORDER.indexOf(activePeriod);

  const handleComplete = () => {
    completePeriod(activePeriod);
    if (nextPeriod && !completedPeriods.includes(nextPeriod)) {
      setActivePeriod(nextPeriod);
    }
  };

  const handlePeriodClick = (period: TimePeriod) => {
    setActivePeriod(period);
  };

  return (
    <div className="min-h-full pb-20">
      {/* Header Section */}
      <header className="mb-6 px-4 pt-4">
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
              {display.emoji} {display.title}
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
          {display.subtitle} — everything {profile?.petName || 'your pet'} needs.
        </p>
      </header>

      {/* Progress Bar */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          {PERIOD_ORDER.map((period, i) => {
            const completed = completedPeriods.includes(period);
            const isActive = period === activePeriod;
            const isPast = i < periodIndex;
            return (
              <button
                key={period}
                onClick={() => handlePeriodClick(period)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                  completed && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                  isActive && !completed && "bg-planet-yellow/15 text-planet-yellow border border-planet-yellow/20",
                  !completed && !isActive && "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/5",
                )}
              >
                {completed ? (
                  <CheckCircle2 size={12} className="text-emerald-500" />
                ) : (
                  getPeriodIcon(period, 12)
                )}
                {period}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {completedCount}/{totalPeriods} check-ins complete
          </span>
          <div className="flex-1 mx-3 h-1.5 rounded-full bg-slate-200 dark:bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-planet-yellow to-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <span className="text-[10px] font-bold text-emerald-500">{progressPercent}%</span>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* All Complete State */}
        {allComplete ? (
          <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-heading font-black text-slate-900 dark:text-white mb-2">
              All Done for Today!
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              All {totalPeriods} check-ins complete. {profile?.petName || 'Your pet'} is all set. Great job!
            </p>
          </motion.section>
        ) : (
          <>
            {/* Pawl's Daily Insight - Main Highlight */}
            <motion.section
              key={activePeriod}
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
                    {getPeriodIcon(activePeriod, 20)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">{display.emoji} Pawl's {display.title}</h3>
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
                  {!isActiveComplete && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleComplete}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCircle2 size={14} />
                      Mark Complete
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.section>

            {/* Today's Vitals */}
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
          </>
        )}
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

import { useState, useMemo } from 'react';
import { motion, type Variants } from 'framer-motion';
import { ArrowLeft, CheckCircle2, PawPrint, Sun, Moon, SunDim, ChevronRight } from 'lucide-react';
import { increment } from 'firebase/firestore';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePetProfile } from '../hooks/usePetProfile';
import { usePawlMessage } from '../hooks/usePawlMessage';
import { useTimeOfDay, type TimePeriod, PERIOD_DISPLAY } from '../hooks/useTimeOfDay';
import { useCheckInStatus } from '../hooks/useCheckInStatus';
import { cn } from '../lib/utils';

const PERIOD_ORDER: TimePeriod[] = ['morning', 'afternoon', 'evening'];
const POINTS_PER_BRIEFING = 5;
const DAILY_BRIEFING_POINTS = PERIOD_ORDER.length * POINTS_PER_BRIEFING;

const PERIOD_ICON_GRADIENTS: Record<TimePeriod, string> = {
  morning: 'from-amber-300 via-yellow-400 to-orange-400',
  afternoon: 'from-orange-300 via-amber-400 to-yellow-300',
  evening: 'from-indigo-300 via-purple-400 to-slate-400',
};

const PERIOD_GLOW: Record<TimePeriod, string> = {
  morning: 'shadow-amber-500/30',
  afternoon: 'shadow-orange-500/30',
  evening: 'shadow-indigo-500/30',
};

function PremiumPeriodIcon({ period, size = 20 }: { period: TimePeriod; size?: number }) {
  const Icon = period === 'morning' ? Sun : period === 'afternoon' ? SunDim : Moon;
  return (
    <div className={cn(
      "relative flex items-center justify-center rounded-full",
      "bg-gradient-to-br",
      PERIOD_ICON_GRADIENTS[period],
      "shadow-lg",
      PERIOD_GLOW[period]
    )}
      style={{ width: size * 2, height: size * 2 }}
    >
      <Icon size={size} className="text-white drop-shadow-md" absoluteStrokeWidth />
    </div>
  );
}

function getPeriodIcon(period: TimePeriod, size: number = 20) {
  return <PremiumPeriodIcon period={period} size={size} />;
}

function parseMessageSections(text: string) {
  const blocks = text.split('\n\n').filter(Boolean);
  return blocks.map(block => {
    const lines = block.split('\n').filter(Boolean);
    const hasBullets = lines.some(l => /^[\s]*[-*•]\s+/.test(l.trim()));
    const isHeader = lines.length === 1 && lines[0].trim().endsWith(':');

    if (hasBullets) {
      const headerLines: string[] = [];
      const bulletLines: string[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (/^[-*•]\s+/.test(trimmed)) {
          bulletLines.push(trimmed.replace(/^[-*•]\s*/, ''));
        } else if (trimmed.endsWith(':') || !bulletLines.length) {
          headerLines.push(trimmed);
        } else {
          headerLines.push(trimmed);
        }
      }
      return { type: 'bullets' as const, header: headerLines.join(' '), items: bulletLines };
    }

    if (isHeader) {
      return { type: 'header' as const, text: lines[0].trim() };
    }

    return { type: 'prose' as const, text: block.trim() };
  });
}

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 200,
      damping: 24,
      delay: 0.08 * i,
    },
  }),
};

const bulletVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 250,
      damping: 22,
      delay: 0.04 * i,
    },
  }),
};

function MessageSection({ block, index }: { block: ReturnType<typeof parseMessageSections>[0]; index: number }) {
  if (block.type === 'prose') {
    const isIntro = index === 0;
    return (
      <motion.div
        custom={index}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          "rounded-2xl border px-4 py-3 font-semibold leading-relaxed",
          isIntro
            ? "border-planet-yellow/20 bg-planet-yellow/10 text-sm text-slate-900 dark:text-white"
            : "border-white/10 bg-white/[0.04] text-[13px] text-slate-600 dark:text-slate-300"
        )}
      >
        <p>{block.text}</p>
      </motion.div>
    );
  }

  if (block.type === 'header') {
    return (
      <motion.div
        custom={index}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="relative pl-3 border-l-2 border-planet-yellow/50"
      >
        <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-[0.18em]">
          {block.text}
        </p>
      </motion.div>
    );
  }

  if (block.type === 'bullets') {
    return (
      <motion.div
        custom={index}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2.5"
      >
        {block.header && (
          <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.18em]">
            {block.header}
          </p>
        )}
        <div className="grid gap-2">
          {block.items.map((item, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={bulletVariants}
              initial="hidden"
              animate="visible"
              className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-2.5 shadow-sm"
            >
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-planet-yellow/15 text-planet-yellow transition-colors group-hover:bg-planet-yellow/25">
                <CheckCircle2 size={12} />
              </div>
              <span className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">
                {item}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  return null;
}

export default function DailyBriefing() {
  const navigate = useNavigate();
  const location = useLocation();
  const isDemoMode = location.search.includes('demo_mode=true');
  const { profile, loading: profileLoading, updateProfile } = usePetProfile();
  const { currentPeriod } = useTimeOfDay();

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

  const [activePeriod, setActivePeriod] = useState<TimePeriod>(
    () => currentIncompletePeriod || currentPeriod
  );
  const { message, loading: messageLoading, error: messageError } = usePawlMessage(activePeriod);
  const [justCompleted, setJustCompleted] = useState(false);
  const [awardNotice, setAwardNotice] = useState<string | null>(null);

  const sections = useMemo(() => message ? parseMessageSections(message) : [], [message]);
  const petMeta = useMemo(() => {
    return [profile?.breed, profile?.age, profile?.weight].filter(Boolean).join(' • ');
  }, [profile?.breed, profile?.age, profile?.weight]);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const display = PERIOD_DISPLAY[activePeriod];
  const isActiveComplete = completedPeriods.includes(activePeriod);
  const nextIncompleteAfterActive = PERIOD_ORDER
    .slice(PERIOD_ORDER.indexOf(activePeriod) + 1)
    .find(period => !completedPeriods.includes(period));

  const handleBackHome = () => {
    navigate({ pathname: '/', search: location.search });
  };

  const handleComplete = async () => {
    if (isActiveComplete || justCompleted) return;

    setJustCompleted(true);
    try {
      const currentPoints = Number(profile?.pawPoints || 0);
      await updateProfile({
        pawPoints: isDemoMode ? currentPoints + POINTS_PER_BRIEFING : increment(POINTS_PER_BRIEFING),
      });
      setAwardNotice(`+${POINTS_PER_BRIEFING} Paw Points added`);
    } catch (error) {
      console.error('Could not award briefing Paw Points:', error);
      setAwardNotice('Briefing completed. Points sync will retry later.');
    }

    completePeriod(activePeriod);
    setTimeout(() => {
      if (nextIncompleteAfterActive) {
        setActivePeriod(nextIncompleteAfterActive);
      }
      setJustCompleted(false);
      setAwardNotice(null);
    }, 600);
  };

  const handlePeriodClick = (period: TimePeriod) => {
    setActivePeriod(period);
  };

  return (
    <div className="min-h-full pb-20">
      {/* Header Section */}
      <header className="mb-5 px-4 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBackHome}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-white/80 shadow-sm backdrop-blur-xl transition-all hover:border-planet-yellow/30 hover:bg-planet-yellow/15 hover:text-planet-yellow active:scale-95"
            aria-label="Back to home"
            title="Back to home"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-1.5 rounded-full border border-planet-yellow/20 bg-planet-yellow/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-planet-yellow">
            <PawPrint size={12} />
            {Number(profile?.pawPoints || 0).toLocaleString()} pts
          </div>
        </div>
        <div className="flex items-start justify-between mb-2">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="flex flex-col"
          >
            <span className="text-[10px] font-bold text-planet-yellow uppercase tracking-[0.25em] mb-1.5">
              {today}
            </span>
            <h1 className="font-heading text-4xl leading-tight text-slate-900 dark:text-white">
              {display.title}
            </h1>
            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              {display.subtitle}
            </p>
          </motion.div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="px-4 mb-5">
        <div className="flex items-center gap-2 mb-2.5">
          {PERIOD_ORDER.map((period, i) => {
            const completed = completedPeriods.includes(period);
            const isActive = period === activePeriod;
            return (
              <motion.button
                key={period}
                onClick={() => handlePeriodClick(period)}
                whileTap={{ scale: 0.94 }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                  completed && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                  isActive && !completed && "bg-planet-yellow/15 text-planet-yellow border border-planet-yellow/20 shadow-lg shadow-planet-yellow/10",
                  !completed && !isActive && "bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-white/[0.06]",
                )}
              >
                {completed ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    <CheckCircle2 size={12} className="text-emerald-500" />
                  </motion.div>
                ) : (
                  <div className="opacity-70">
                    {getPeriodIcon(period, 10)}
                  </div>
                )}
                {period}
              </motion.button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">
            {completedCount}/{totalPeriods} done
          </span>
          <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-planet-yellow via-amber-400 to-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(progressPercent, 4)}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />
          </div>
        </div>
      </div>

      <div className="px-4 space-y-5">
        {/* All Complete State */}
        {allComplete ? (
          <motion.div
            key="all-done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="text-center py-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400/20 to-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-500/10"
            >
              <CheckCircle2 size={48} className="text-emerald-500 icon-premium" />
            </motion.div>
            <h2 className="font-heading text-3xl text-slate-900 dark:text-white mb-2">
              All Done Today
            </h2>
            <div className="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full border border-planet-yellow/20 bg-planet-yellow/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-planet-yellow">
              <PawPrint size={12} />
              +{DAILY_BRIEFING_POINTS} Paw Points earned today
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs mx-auto font-medium">
              {profile?.petName || 'Your pet'} is all set. See you tomorrow!
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={activePeriod}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
            className="space-y-5"
          >
            {/* Pawl's Daily Insight */}
            <section className="relative overflow-hidden">
                {/* Ambient glow */}
                <div className={cn(
                  "absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-20 blur-3xl pointer-events-none",
                  activePeriod === 'morning' && "bg-amber-400",
                  activePeriod === 'afternoon' && "bg-orange-400",
                  activePeriod === 'evening' && "bg-indigo-400",
                )} />

                <div className="liquid-glass rounded-[2rem] border border-white/20 p-5 relative z-10 shadow-xl bg-gradient-to-br from-white/40 to-white/10 dark:from-white/5 dark:to-transparent">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.15 }}
                    >
                      <PremiumPeriodIcon period={activePeriod} size={16} />
                    </motion.div>
                    <div>
                      <h3 className="font-heading text-lg text-slate-800 dark:text-slate-100 leading-tight">
                        Pawl's {display.title}
                      </h3>
                      <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em]">
                        AI-Powered for {profile?.petName || 'your pet'}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">
                      {profile?.petName || 'Your pet'}
                    </span>
                    {petMeta && (
                      <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">
                        {petMeta}
                      </span>
                    )}
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-400">
                      +{POINTS_PER_BRIEFING} pts on completion
                    </span>
                  </div>

                  {/* Content */}
                  {messageLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-planet-yellow/30" />
                          <motion.div
                            className="h-3 bg-slate-200 dark:bg-white/[0.06] rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${60 + i * 12}%` }}
                            transition={{ duration: 0.8, delay: i * 0.15, ease: 'easeOut' }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="max-h-[340px] space-y-3 overflow-y-auto pr-1 hide-scrollbar">
                      {sections.map((block, i) => (
                        <MessageSection key={i} block={block} index={i} />
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-5 flex items-center justify-between gap-3 pt-4 border-t border-slate-200/50 dark:border-white/[0.06]">
                    <div className="min-w-0 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="truncate text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        {awardNotice || (messageError ? 'Local care fallback active' : 'Verified by Planet Animal Vets')}
                      </span>
                    </div>
                    {!isActiveComplete && (
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={handleComplete}
                        disabled={justCompleted}
                        className={cn(
                          "flex shrink-0 items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                          "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white",
                          "shadow-lg shadow-emerald-500/25",
                          "hover:from-emerald-400 hover:to-emerald-500",
                          "active:shadow-md",
                        )}
                      >
                        <motion.div
                          animate={justCompleted ? { scale: [1, 1.3, 1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          <CheckCircle2 size={14} />
                        </motion.div>
                        {justCompleted ? 'Done!' : `Mark Complete +${POINTS_PER_BRIEFING}`}
                        <ChevronRight size={12} className="opacity-60" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </section>
            </motion.div>
          )}
      </div>
    </div>
  );
}

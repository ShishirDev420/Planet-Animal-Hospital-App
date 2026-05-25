import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { ArrowLeft, CheckCircle2, ChevronRight, Circle, HeartPulse, Moon, PawPrint, ShieldCheck, SunMedium, Sunrise, Trophy, Zap } from 'lucide-react';
import { increment } from 'firebase/firestore';
import { useLocation, useNavigate } from 'react-router-dom';
import planetLogo from '../assets/planet-logo.png';
import { usePetProfile } from '../hooks/usePetProfile';
import { usePawlMessage } from '../hooks/usePawlMessage';
import { useTimeOfDay, type TimePeriod, PERIOD_DISPLAY } from '../hooks/useTimeOfDay';
import { useCheckInStatus } from '../hooks/useCheckInStatus';
import { cn } from '../lib/utils';

const PERIOD_ORDER: TimePeriod[] = ['morning', 'afternoon', 'evening'];
const POINTS_PER_BRIEFING = 5;
const DAILY_BRIEFING_POINTS = PERIOD_ORDER.length * POINTS_PER_BRIEFING;

type ParsedBriefing = {
  intro: string;
  groups: Array<{ title: string; items: string[] }>;
  notes: string[];
};

const periodVisuals: Record<TimePeriod, {
  eyebrow: string;
  actionLabel: string;
  Icon: typeof Sunrise;
  orbClass: string;
  ringClass: string;
  panelGlow: string;
  activeTab: string;
  copy: string;
}> = {
  morning: {
    eyebrow: 'Open The Day',
    actionLabel: 'Morning ritual',
    Icon: Sunrise,
    orbClass: 'bg-[#fec708] text-black shadow-[0_0_42px_rgba(254,199,8,0.48)]',
    ringClass: 'border-[#fec708]/28 bg-[#fec708]/10',
    panelGlow: 'from-[#fec708]/10 via-[#10170d]/98 to-[#06130d]',
    activeTab: 'border border-[#fec708]/28 bg-[#fec708] text-black shadow-[0_14px_30px_rgba(254,199,8,0.18)]',
    copy: 'Prime the body, routine, hydration, and mood before the day gets noisy.',
  },
  afternoon: {
    eyebrow: 'Protect The Middle',
    actionLabel: 'Midday reset',
    Icon: SunMedium,
    orbClass: 'bg-[#f0a11a] text-black shadow-[0_0_42px_rgba(240,161,26,0.40)]',
    ringClass: 'border-[#f0a11a]/28 bg-[#f0a11a]/10',
    panelGlow: 'from-[#fec708]/10 via-[#12170d]/98 to-[#06130d]',
    activeTab: 'border border-[#fec708]/28 bg-[#fec708] text-black shadow-[0_14px_30px_rgba(254,199,8,0.18)]',
    copy: 'Keep energy steady, heat risk low, and care momentum intact.',
  },
  evening: {
    eyebrow: 'Close The Loop',
    actionLabel: 'Evening wind-down',
    Icon: Moon,
    orbClass: 'bg-[#d8b36a] text-black shadow-[0_0_34px_rgba(216,179,106,0.28)]',
    ringClass: 'border-[#d8b36a]/24 bg-[#d8b36a]/10',
    panelGlow: 'from-[#d8b36a]/10 via-[#10150f]/98 to-[#06130d]',
    activeTab: 'border border-[#fec708]/28 bg-[#fec708] text-black shadow-[0_14px_30px_rgba(254,199,8,0.18)]',
    copy: 'Settle digestion, safety, comfort, and recovery before sleep.',
  },
};

const pageStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.03 },
  },
};

const riseIn: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

const actionIn: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.46, delay: index * 0.045, ease: [0.16, 1, 0.3, 1] },
  }),
};

function cleanLine(value: string) {
  return value
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\uFE0F/g, '')
    .replace(/\*\*/g, '')
    .replace(/^[-*•]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseBriefing(text: string, period: TimePeriod, petName: string): ParsedBriefing {
  const blocks = text.split('\n\n').map((block) => block.trim()).filter(Boolean);
  const groups: ParsedBriefing['groups'] = [];
  const notes: string[] = [];
  let intro = `A focused ${period} care ritual for ${petName}.`;

  blocks.forEach((block, blockIndex) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    const bulletLines = lines.filter((line) => /^[-*•]\s+/.test(line));

    if (bulletLines.length > 0) {
      const header = cleanLine(lines.find((line) => !/^[-*•]\s+/.test(line)) || periodVisuals[period].actionLabel).replace(/:$/, '');
      groups.push({
        title: header || periodVisuals[period].actionLabel,
        items: bulletLines.map(cleanLine).filter(Boolean),
      });
      return;
    }

    const prose = cleanLine(block).replace(/:$/, '');
    if (!prose) return;

    if (blockIndex === 0 || /good morning|good afternoon|good evening|briefing/i.test(prose)) {
      intro = prose
        .replace(/here'?s your .*? briefing for/i, `today's care ritual for`)
        .replace(/good morning!?/i, 'Good morning.')
        .replace(/good afternoon!?/i, 'Good afternoon.')
        .replace(/good evening!?/i, 'Good evening.');
    } else {
      notes.push(prose);
    }
  });

  if (groups.length === 0 && notes.length > 0) {
    groups.push({ title: periodVisuals[period].actionLabel, items: notes.splice(0, 5) });
  }

  return { intro, groups, notes };
}

function PeriodGlyph({ period, complete = false, large = false }: { period: TimePeriod; complete?: boolean; large?: boolean }) {
  const visual = periodVisuals[period];
  const Icon = visual.Icon;
  const size = large ? 'h-16 w-16' : 'h-7 w-7';
  const iconSize = large ? 28 : 15;

  return (
    <div className={cn('relative grid shrink-0 place-items-center rounded-full', size, visual.orbClass)}>
      <motion.span
        className={cn('absolute rounded-full border', large ? 'inset-[-7px]' : 'inset-[-5px]', visual.ringClass)}
        animate={complete ? { scale: [1, 1.1, 1], opacity: [0.5, 0.9, 0.5] } : { scale: [1, 1.06, 1], opacity: [0.34, 0.64, 0.34] }}
        transition={{ duration: complete ? 1.4 : 3.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      {complete ? <CheckCircle2 size={iconSize} absoluteStrokeWidth /> : <Icon size={iconSize} absoluteStrokeWidth />}
    </div>
  );
}

function BriefingSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="rounded-[1.4rem] border border-white/[0.06] bg-white/[0.035] p-4">
          <div className="flex items-center gap-3">
            <motion.div
              className="h-9 w-9 rounded-full bg-[#fec708]/16"
              animate={{ opacity: [0.35, 0.75, 0.35] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: item * 0.08 }}
            />
            <motion.div
              className="h-3 rounded-full bg-white/[0.08]"
              initial={{ width: '38%' }}
              animate={{ width: [`${44 + item * 8}%`, `${62 + item * 7}%`, `${44 + item * 8}%`] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CareActionCard({ item, index, period }: { item: string; index: number; period: TimePeriod }) {
  const visual = periodVisuals[period];

  return (
    <motion.div
      custom={index}
      variants={actionIn}
      initial="hidden"
      animate="visible"
      whileTap={{ scale: 0.985 }}
      className="group relative overflow-hidden rounded-[1.45rem] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(255,255,255,0.074),rgba(255,255,255,0.028))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_16px_34px_rgba(0,0,0,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#fec708]/20 hover:bg-white/[0.07]"
    >
      <div className="absolute right-[-48px] top-[-56px] h-28 w-28 rounded-full bg-[#fec708]/[0.045] blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative flex items-start gap-3.5">
        <div className={cn('relative mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border text-[11px] font-black tabular-nums', visual.ringClass)}>
          <motion.span
            className="absolute inset-1 rounded-full border border-white/10"
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          />
          {String(index + 1).padStart(2, '0')}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#fec708]/70">Life-max action</p>
          <p className="mt-1 text-[0.92rem] font-bold leading-6 tracking-[-0.018em] text-white/88">{item}</p>
        </div>
        <Circle className="mt-1 h-4 w-4 shrink-0 text-white/20 transition-colors group-hover:text-[#fec708]/70" />
      </div>
    </motion.div>
  );
}

function PeriodSelector({ activePeriod, completedPeriods, onPeriodClick }: { activePeriod: TimePeriod; completedPeriods: TimePeriod[]; onPeriodClick: (period: TimePeriod) => void }) {
  return (
    <motion.div variants={riseIn} className="rounded-[1.35rem] border border-white/[0.08] bg-black/34 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.055),0_16px_42px_rgba(0,0,0,0.22)]">
      <div className="grid grid-cols-3 gap-1.5">
        {PERIOD_ORDER.map((period) => {
          const complete = completedPeriods.includes(period);
          const active = period === activePeriod;
          const visual = periodVisuals[period];

          return (
            <motion.button
              key={period}
              type="button"
              onClick={() => onPeriodClick(period)}
              whileTap={{ scale: 0.96 }}
              className={cn(
                'relative min-h-[4.35rem] overflow-hidden rounded-[1rem] px-2 py-2.5 text-center transition-colors duration-300',
                active ? visual.activeTab : 'border border-white/[0.06] bg-white/[0.035] text-white/46 hover:bg-white/[0.06] hover:text-white/76',
              )}
            >
              {active && (
                <motion.div
                  layoutId="active-briefing-period"
                  className="absolute inset-0 rounded-[1rem] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.26),transparent_52%)]"
                  transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
              <div className="relative flex flex-col items-center gap-1.5">
                <PeriodGlyph period={period} complete={complete} />
                <div className="min-w-0 max-w-full">
                  <p className="truncate text-[9px] font-black uppercase tracking-[0.11em]">{period}</p>
                  <p className={cn('mt-0.5 hidden text-[10px] font-bold leading-none sm:block', active ? 'text-black/58' : 'text-white/28')}>
                    {complete ? 'Banked' : active ? 'Open now' : 'Preview'}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function DailyBriefing() {
  const navigate = useNavigate();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const isDemoMode = location.search.includes('demo_mode=true');
  const { profile, updateProfile } = usePetProfile();
  const { currentPeriod } = useTimeOfDay();

  const uid = profile?.uid || profile?.parentName || 'demo';
  const {
    completedPeriods,
    completePeriod,
    currentIncompletePeriod,
    allComplete,
    progressPercent,
    completedCount,
    totalPeriods,
  } = useCheckInStatus(uid, currentPeriod);

  const [activePeriod, setActivePeriod] = useState<TimePeriod>(() => currentIncompletePeriod || currentPeriod);
  const { message, loading: messageLoading, error: messageError } = usePawlMessage(activePeriod);
  const [justCompleted, setJustCompleted] = useState(false);
  const [awardNotice, setAwardNotice] = useState<string | null>(null);

  const petName = profile?.petName || 'Your pet';
  const display = PERIOD_DISPLAY[activePeriod];
  const visual = periodVisuals[activePeriod];
  const Icon = visual.Icon;
  const isActiveComplete = completedPeriods.includes(activePeriod);
  const nextIncompleteAfterActive = PERIOD_ORDER.slice(PERIOD_ORDER.indexOf(activePeriod) + 1).find((period) => !completedPeriods.includes(period));

  const parsedBriefing = useMemo(() => parseBriefing(message || '', activePeriod, petName), [message, activePeriod, petName]);
  const petMeta = useMemo(() => [profile?.breed, profile?.age, profile?.weight].filter(Boolean).join(' • '), [profile?.breed, profile?.age, profile?.weight]);
  const today = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }), []);
  const points = Number(profile?.pawPoints || 0);

  const handleBackHome = () => {
    navigate({ pathname: '/', search: location.search });
  };

  const handleComplete = async () => {
    if (isActiveComplete || justCompleted) return;

    setJustCompleted(true);
    try {
      await updateProfile({
        pawPoints: isDemoMode ? points + POINTS_PER_BRIEFING : increment(POINTS_PER_BRIEFING),
      });
      setAwardNotice(`+${POINTS_PER_BRIEFING} Paw Points banked`);
    } catch (error) {
      console.error('Could not award briefing Paw Points:', error);
      setAwardNotice('Briefing complete. Points sync will retry.');
    }

    completePeriod(activePeriod);
    setTimeout(() => {
      if (nextIncompleteAfterActive) setActivePeriod(nextIncompleteAfterActive);
      setJustCompleted(false);
      setAwardNotice(null);
    }, 760);
  };

  return (
    <motion.div
      variants={pageStagger}
      initial="hidden"
      animate="visible"
      className="relative -mt-[var(--preview-safe-area-top,0px)] min-h-full overflow-hidden bg-[#071912] px-4 pb-32 pt-[calc(var(--preview-safe-area-top,0px)+1rem)] text-white"
    >
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_74%_4%,rgba(254,199,8,0.055),transparent_34%),radial-gradient(circle_at_12%_24%,rgba(44,128,90,0.10),transparent_30%),linear-gradient(180deg,#08140e_0%,#071912_44%,#040806_100%)]" />
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.035] mix-blend-soft-light" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 180 180%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.65%22/%3E%3C/svg%3E")' }} />
      <motion.div
        className="pointer-events-none absolute right-[-46%] top-[4rem] z-0 h-[380px] w-[380px] rounded-full bg-[#fec708]/10 blur-3xl"
        animate={shouldReduceMotion ? undefined : { scale: [1, 1.02, 1], opacity: [0.14, 0.2, 0.14] }}
        transition={{ duration: 9.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 mx-auto max-w-2xl">
        <motion.header variants={riseIn} className="mb-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <motion.button
              type="button"
              onClick={handleBackHome}
              whileTap={{ scale: 0.92 }}
              whileHover={{ x: -2 }}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.055] text-white/78 shadow-[0_14px_34px_rgba(0,0,0,0.28)] transition-colors hover:border-[#fec708]/25 hover:text-[#fec708]"
              aria-label="Back to home"
            >
              <ArrowLeft size={18} />
            </motion.button>

            <div className="flex items-center gap-2 rounded-full border border-[#fec708]/20 bg-[#fec708]/10 px-3 py-1.5 text-[#fec708] shadow-[0_16px_38px_rgba(254,199,8,0.08)]">
              <PawPrint size={13} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{points.toLocaleString()} pts</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2.2rem] border border-[#fec708]/12 bg-[linear-gradient(145deg,rgba(254,199,8,0.055),rgba(0,0,0,0.34)_40%,rgba(0,0,0,0.62))] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.06)]">
            <motion.div
              className="pointer-events-none absolute right-[-128px] top-[-142px] h-72 w-72 rounded-full bg-[#fec708]/24 blur-xl"
              animate={shouldReduceMotion ? undefined : { scale: [1, 1.025, 1], opacity: [0.7, 0.86, 0.7] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="absolute right-5 top-5 h-14 w-14 overflow-hidden rounded-full border border-black/25 bg-[#f4c40a] p-1 shadow-[0_0_22px_rgba(254,199,8,0.18)]">
              <img src={planetLogo} alt="Planet Animal Hospital" className="h-full w-full rounded-full object-cover" />
            </div>

            <div className="relative max-w-[78%]">
              <p className="cinematic-kicker mb-3 text-[9px] tracking-[0.24em]">{today}</p>
              <h1 className="cinematic-section-title text-[2.8rem] leading-[0.88] tracking-[-0.065em] text-white">
                {display.title}
              </h1>
              <p className="mt-3 text-sm font-bold leading-6 text-white/54">{visual.copy}</p>
            </div>
          </div>
        </motion.header>

        <PeriodSelector activePeriod={activePeriod} completedPeriods={completedPeriods} onPeriodClick={setActivePeriod} />

        <motion.div variants={riseIn} className="my-4 flex items-center gap-3">
          <span className="text-[9px] font-black uppercase tracking-[0.22em] text-white/38">{completedCount}/{totalPeriods} complete</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full border border-white/[0.055] bg-black/34 shadow-[inset_0_1px_5px_rgba(0,0,0,0.42)]">
            <motion.div
              className="h-full rounded-full bg-[linear-gradient(90deg,#fec708,#f5dd76,#09c987)] shadow-[0_0_20px_rgba(254,199,8,0.34)]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(progressPercent, 4)}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[#fec708]">+{DAILY_BRIEFING_POINTS}/day</span>
        </motion.div>

        {allComplete ? (
          <motion.section
            key="all-done"
            variants={riseIn}
            className="relative overflow-hidden rounded-[2.4rem] border border-[#fec708]/14 bg-[linear-gradient(145deg,rgba(254,199,8,0.12),rgba(8,12,7,0.96)_46%,rgba(5,9,6,0.98))] p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.45)]"
          >
            <motion.div
              className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-full bg-[#fec708] text-black shadow-[0_0_48px_rgba(254,199,8,0.38)]"
              animate={shouldReduceMotion ? undefined : { scale: [1, 1.04, 1], rotate: [0, -1.5, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Trophy size={42} absoluteStrokeWidth />
            </motion.div>
            <p className="cinematic-kicker mb-3">Care Loop Complete</p>
            <h2 className="cinematic-section-title text-4xl">All done today.</h2>
            <p className="cinematic-copy mx-auto mt-4 max-w-sm text-sm">{petName} has the full daily care rhythm logged. Tomorrow's ritual will be ready with fresh prompts.</p>
            <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-[#fec708] px-5 py-3 text-black shadow-[0_18px_42px_rgba(254,199,8,0.22)]">
              <PawPrint size={15} />
              <span className="text-[11px] font-black uppercase tracking-[0.18em]">+{DAILY_BRIEFING_POINTS} Paw Points earned</span>
            </div>
          </motion.section>
        ) : (
          <AnimatePresence mode="wait">
            <motion.section
              key={activePeriod}
              initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 18, scale: 0.985 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: shouldReduceMotion ? 0 : -18, scale: 0.985 }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
              className={cn('relative overflow-hidden rounded-[2.35rem] border border-white/[0.08] bg-gradient-to-br p-5 shadow-[0_32px_90px_rgba(0,0,0,0.46),inset_0_1px_0_rgba(255,255,255,0.07)]', visual.panelGlow)}
            >
              <motion.div
                className="pointer-events-none absolute right-[-110px] top-[-120px] h-64 w-64 rounded-full bg-[#fec708]/8 blur-3xl"
                animate={shouldReduceMotion ? undefined : { opacity: [0.24, 0.4, 0.24], scale: [1, 1.035, 1] }}
                transition={{ duration: 7.8, repeat: Infinity, ease: 'easeInOut' }}
              />

              <div className="relative mb-5 flex items-start gap-4">
                <PeriodGlyph period={activePeriod} large />
                <div className="min-w-0 flex-1 pt-1">
                  <p className="cinematic-kicker mb-2 text-[9px] tracking-[0.26em]">{visual.eyebrow}</p>
                  <h2 className="cinematic-card-title text-2xl text-white">Pawl's {display.title}</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white/58">{parsedBriefing.intro}</p>
                </div>
              </div>

              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.045] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.17em] text-white/60">
                  <HeartPulse size={12} className="text-[#fec708]" />
                  {petName}
                </span>
                {petMeta && (
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.045] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.17em] text-white/42">
                    {petMeta}
                  </span>
                )}
                <span className="inline-flex items-center gap-2 rounded-full border border-[#fec708]/18 bg-[#fec708]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.17em] text-[#fec708]">
                  <Zap size={12} />
                  +{POINTS_PER_BRIEFING} on completion
                </span>
              </div>

              {messageLoading ? (
                <BriefingSkeleton />
              ) : (
                <div className="space-y-5">
                  <div className="space-y-4">
                    {parsedBriefing.groups.map((group, groupIndex) => (
                      <div key={`${group.title}-${groupIndex}`} className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/36">{visual.actionLabel}</p>
                            <h3 className="mt-1 text-lg font-black tracking-[-0.04em] text-white">{group.title}</h3>
                          </div>
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#fec708]/18 bg-[#fec708]/10 text-[#fec708]">
                            <Icon size={18} absoluteStrokeWidth />
                          </div>
                        </div>

                        <div className="grid gap-3">
                          {group.items.map((item, index) => (
                            <CareActionCard key={`${item}-${index}`} item={item} index={index} period={activePeriod} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {parsedBriefing.notes.length > 0 && (
                    <motion.div variants={riseIn} initial="hidden" animate="visible" className="rounded-[1.5rem] border border-[#fec708]/12 bg-[#fec708]/[0.055] p-4">
                      <div className="mb-2 flex items-center gap-2 text-[#fec708]">
                        <ShieldCheck size={15} />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Vet-aware note</p>
                      </div>
                      <p className="text-sm font-semibold leading-6 text-white/64">{parsedBriefing.notes[0]}</p>
                    </motion.div>
                  )}
                </div>
              )}

              <div className="mt-6 border-t border-white/[0.07] pt-5">
                <div className="mb-4 flex items-center gap-2 text-white/38">
                  <motion.span
                    className={cn('h-1.5 w-1.5 rounded-full', messageError ? 'bg-amber-300' : 'bg-emerald-400')}
                    animate={{ scale: [1, 1.6, 1], opacity: [0.45, 1, 0.45] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <span className="truncate text-[9px] font-black uppercase tracking-[0.22em]">
                    {awardNotice || (messageError ? 'Local care intelligence active' : 'Personalized by Pawl')}
                  </span>
                </div>

                {!isActiveComplete ? (
                  <motion.button
                    type="button"
                    onClick={handleComplete}
                    disabled={justCompleted}
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ y: -1 }}
                    className="group relative flex w-full items-center justify-between overflow-hidden rounded-[1.45rem] bg-[#fec708] px-5 py-4 text-black shadow-[0_20px_48px_rgba(254,199,8,0.24)] transition-all disabled:opacity-80"
                  >
                    <motion.span
                      className="absolute inset-y-0 left-[-35%] w-1/3 skew-x-[-18deg] bg-white/22"
                      animate={shouldReduceMotion ? undefined : { x: ['0%', '430%'] }}
                      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
                    />
                    <span className="relative flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-black text-[#fec708]">
                        <CheckCircle2 size={17} />
                      </span>
                      <span className="text-left">
                        <span className="block text-[12px] font-black uppercase tracking-[0.18em]">{justCompleted ? 'Care banked' : 'Mark complete'}</span>
                        <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-black/54">Earn +{POINTS_PER_BRIEFING} Paw Points</span>
                      </span>
                    </span>
                    <ChevronRight className="relative h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </motion.button>
                ) : (
                  <div className="flex items-center justify-center gap-2 rounded-[1.45rem] border border-emerald-400/16 bg-emerald-400/10 px-5 py-4 text-emerald-300">
                    <CheckCircle2 size={18} />
                    <span className="text-[11px] font-black uppercase tracking-[0.18em]">Briefing complete. Points banked.</span>
                  </div>
                )}
              </div>
            </motion.section>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

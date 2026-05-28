import React, { useState, useMemo } from 'react';
import { 
  Trophy,
  Zap,
  CheckCircle2,
  Lock,
  ChevronRight,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  Medal,
  PawPrint,
  Share2,
  Activity,
  ShieldCheck,
  Stethoscope,
  HeartPulse,
  ShoppingBag,
  ArrowUpRight,
  Gift,
  Clock,
  Crown
} from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePetProfile } from '../hooks/usePetProfile';
import { cn } from '../lib/utils';
import planetLogo from '../assets/planet-logo.png';

const PAW_POINT_TO_INR = 0.25; // 1 Paw Point = ₹0.25

interface PawPointActivity {
  id: string;
  type: 'earned' | 'redeemed';
  activity: string;
  points: number;
  date: string;
  source?: string;
}

function getActivityIcon(activity: PawPointActivity) {
  if (activity.type === 'redeemed') return <ShoppingBag className="w-4 h-4" />;
  if (activity.source === 'briefing') return <Activity className="w-4 h-4" />;
  if (activity.source === 'referral') return <Share2 className="w-4 h-4" />;
  if (activity.source === 'roadmap') return <ShieldCheck className="w-4 h-4" />;
  return <Activity className="w-4 h-4" />;
}

const pawPointsRoadmap = [
  {
    id: 'tier1',
    points: 500,
    title: 'Health Starter',
    description: 'Welcome to the Program! Unlock the foundation of your pet\'s personalized care journey.',
    icon: <Activity className="w-10 h-10" />,
    color: 'from-emerald-400 to-cyan-500',
    badge: 'Entry',
  },
  {
    id: 'tier2',
    points: 1500,
    title: '15% Bill Rebate',
    description: 'Congratulations! Enjoy an instant 15% discount on your entire Planet Animal bill — valid on your next visit.',
    icon: <ShoppingBag className="w-10 h-10" />,
    color: 'from-blue-400 to-indigo-500',
    badge: 'Savings',
  },
  {
    id: 'tier3',
    points: 2500,
    title: '20% Bill Rebate',
    description: 'You\'re serious about your pet\'s health. Redeem a deeper 20% discount on your next complete bill.',
    icon: <Zap className="w-10 h-10" />,
    color: 'from-[#fec708] to-orange-500',
    badge: 'Deep Savings',
  },
  {
    id: 'tier4',
    points: 5000,
    title: 'Life-Maxing Consultation',
    description: 'The Crown Jewel. A private, 1-on-1 consultation with our specialist doctors — tailored to your pet\'s breed, size, weight, and lifestyle — to craft a comprehensive, individualized longevity plan.',
    icon: <Stethoscope className="w-10 h-10" />,
    color: 'from-purple-400 to-pink-500',
    badge: '★ Signature',
  },
  {
    id: 'tier5',
    points: 7500,
    title: 'Premium Spa & Therapy',
    description: 'Your pet deserves a full reset. Complimentary full-day spa including grooming, deep conditioning, and medicated baths if required for skin conditions.',
    icon: <Sparkles className="w-10 h-10" />,
    color: 'from-rose-400 to-red-500',
    badge: 'Luxury',
  },
  {
    id: 'tier6',
    points: 10000,
    title: 'Full Hematology Panel',
    description: 'A super comprehensive, full-spectrum blood examination to detect, prevent, and optimize your pet\'s internal health from the inside out.',
    icon: <HeartPulse className="w-10 h-10" />,
    color: 'from-amber-400 to-yellow-600',
    badge: 'Clinical',
  },
  {
    id: 'tier7',
    points: 25000,
    title: 'Elite Health Sentinel',
    description: 'Exclusive 24/7 Concierge Health Line and the privilege of scheduling home visits from our veterinary team.',
    icon: <Crown className="w-10 h-10" />,
    color: 'from-indigo-400 to-purple-600',
    badge: 'Elite',
  },
  {
    id: 'tier8',
    points: 100000,
    title: "The Founder's Peak",
    description: 'The highest honor in the Planet Animal universe. An exclusive invite to our annual Founder\'s Medical Gala — a luxury event celebrating the world\'s most dedicated pet parents.',
    icon: <Trophy className="w-10 h-10" />,
    color: 'from-yellow-400 to-orange-600',
    badge: '∞ Founder',
  },
];

const HolographicFoil = () => (
  <div className="absolute inset-0 holographic-foil opacity-30 pointer-events-none mix-blend-overlay rounded-[inherit]" />
);

const BentoQuestCard = ({ item, i }: { item: any, i: number }) => {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative overflow-hidden bento-card-premium group cursor-pointer rounded-[2.5rem] p-6"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        {React.cloneElement(item.icon, { size: 80 })}
      </div>
      
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-white/5">
          {React.cloneElement(item.icon, { size: 24 })}
        </div>
        
        <h4 className="font-heading font-bold text-sm uppercase tracking-tight mb-1 group-hover:text-[#fec708] transition-colors">
          {item.title}
        </h4>
        <p className="text-white/30 text-[10px] leading-tight max-w-[150px]">
          {item.desc}
        </p>
        
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-heading font-bold text-[#fec708]">{item.points}</span>
            <span className="text-[8px] font-bold uppercase tracking-widest text-white/20">PTS</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#fec708] group-hover:text-black transition-all">
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
      
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#fec708]/5 blur-[40px] rounded-full group-hover:bg-[#fec708]/10 transition-all" />
    </motion.div>
  );
};

export default function Rewards() {
  const navigate = useNavigate();
  const { profile, updateProfile, loading } = usePetProfile();
  const [showRedeemSuccess, setShowRedeemSuccess] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [redeemedReward, setRedeemedReward] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const currentPoints = Number(profile?.pawPoints || 0);

  const recentActivity = useMemo<PawPointActivity[]>(() => {
    const rawHistory =
      profile?.pawPointHistory ??
      profile?.pointsHistory ??
      profile?.rewardsHistory;

    if (Array.isArray(rawHistory) && rawHistory.length > 0) {
      return rawHistory.map((item: any, index: number) => ({
        id: String(item?.id ?? `activity-${index}`),
        type: item?.type === 'redeemed' ? 'redeemed' : 'earned',
        activity: String(item?.activity ?? item?.description ?? item?.title ?? 'Paw Points Activity'),
        points: Number(item?.points ?? item?.amount ?? 0),
        date: String(item?.date ?? item?.timestamp ?? item?.createdAt ?? ''),
        source: item?.source ? String(item.source) : undefined,
      }));
    }

    if (currentPoints > 0) {
      return [
        {
          id: 'current-balance',
          type: 'earned',
          activity: 'Paw Points Balance Verified',
          points: currentPoints,
          date: 'Current balance',
          source: 'balance',
        },
      ];
    }

    return [];
  }, [profile, currentPoints]);
  const referralCount = useMemo(() => {
    const rawReferrals = profile?.referralCount ?? profile?.successfulReferrals ?? profile?.referrals;

    if (Array.isArray(rawReferrals)) return rawReferrals.length;

    const parsedReferrals = Number(rawReferrals ?? 0);
    return Number.isFinite(parsedReferrals) && parsedReferrals > 0 ? Math.floor(parsedReferrals) : 0;
  }, [profile]);
  const healthStreakDays = Math.max(0, Number(profile?.healthStreakDays ?? profile?.streakDays ?? profile?.healthStreak ?? 0));
  const visibleStreakDays = Math.min(healthStreakDays, 7);
  const streakMultiplier = healthStreakDays >= 7 ? 1.5 : healthStreakDays >= 3 ? 1.25 : 1;
  const nextTier = pawPointsRoadmap.find(t => t.points > currentPoints) || pawPointsRoadmap[pawPointsRoadmap.length - 1];
  const previousTier = [...pawPointsRoadmap].reverse().find(t => t.points <= currentPoints) || { points: 0 };
  const nextTierProgress = Math.min(100, Math.max(0, ((currentPoints - previousTier.points) / Math.max(1, nextTier.points - previousTier.points)) * 100));
  const pointsToNextTier = Math.max(0, nextTier.points - currentPoints);
  
  const handleRedeem = async (reward: any) => {
    if (currentPoints < reward.points) return;
    
    try {
      setRedeemedReward(reward.title);
      setShowRedeemSuccess(true);
      
      const newPoints = currentPoints - reward.points;
      await updateProfile({ pawPoints: newPoints });
      
      setTimeout(() => setShowRedeemSuccess(false), 4000);
    } catch (error) {
      console.error('Failed to redeem reward:', error);
    }
  };

  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 1000], [0, 300]);

  return (
    <div className="min-h-screen w-full flex flex-col pb-40 overflow-x-hidden relative bg-black text-white selection:bg-[#fec708] selection:text-black">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div 
          style={{ y: bgY }}
          className="absolute top-[-10%] right-[-20%] w-[800px] h-[800px] bg-[#fec708]/10 rounded-full blur-[160px] opacity-50" 
        />
        <motion.div 
          style={{ y: useTransform(scrollY, [0, 1000], [0, -200]) }}
          className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] opacity-30" 
        />
      </div>

      <div className="fixed top-0 left-0 right-0 h-20 bg-gradient-to-b from-black via-black to-transparent z-[45] pointer-events-none" />

      <header className="px-5 pt-5 pb-3 flex items-center justify-between relative z-50 sm:px-6 sm:pt-10 sm:pb-6">
        <motion.button 
          whileHover={{ scale: 1.1, x: -5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => { if (window.history.length > 1) { navigate(-1); } else { navigate('/'); } }} 
          className="w-10 h-10 rounded-xl bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center sm:h-12 sm:w-12"
        >
          <ChevronLeft size={20} />
        </motion.button>
        <div className="flex flex-col items-center">
          <h1 className="font-heading text-lg font-black uppercase italic tracking-[-0.06em] text-[#fec708] sm:text-xl">PAW POINTS</h1>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#fec708] animate-pulse" />
            <span className="text-[11px] font-bold text-white/52 uppercase tracking-[0.18em]">Health Rewards</span>
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 15 }}
          className="w-10 h-10 rounded-xl bg-[#fec708]/10 border border-[#fec708]/20 flex items-center justify-center text-[#fec708] sm:h-12 sm:w-12"
        >
          <Medal size={20} />
        </motion.button>
      </header>

      {/* Header Section */}
      <div className="relative px-5 pt-1 pb-10 sm:px-6 sm:pt-12 sm:pb-20">
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-2xl mb-4 shadow-2xl overflow-hidden group sm:mb-8 sm:px-6 sm:py-2.5"
          >
            <HolographicFoil />
            <PawPrint className="w-4 h-4 text-[#fec708] group-hover:rotate-12 transition-transform" />
            <span className="cinematic-kicker text-[10px] tracking-[0.18em] text-white/84">Rewards Hub &bull; <span className="text-[#fec708]">Paw Points</span></span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="cinematic-title mb-4 text-[2.85rem] leading-[0.96] tracking-[-0.045em] sm:mb-8 sm:text-6xl md:text-8xl"
          >
            YOUR <span className="text-[#fec708] italic">PAW</span><br />POINTS
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="cinematic-copy mx-auto mb-7 max-w-[21rem] text-[0.95rem] leading-7 text-white/68 sm:mb-16 sm:max-w-2xl sm:text-xl"
          >
            Every visit, every check-in, every act of care earns Paw Points. Unlock real clinical rewards on your journey to pet longevity.
          </motion.p>

          {/* Points Counter - warm medallion treatment */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative inline-block w-full max-w-[392px] rounded-[2.35rem] p-[1px] shadow-[0_40px_100px_rgba(0,0,0,0.72)] sm:rounded-[2.65rem]"
          >
            <motion.div
              className="absolute -inset-2 rounded-[2.75rem] border border-[#fec708]/15 pointer-events-none sm:-inset-3 sm:rounded-[3rem]"
              animate={shouldReduceMotion ? undefined : { opacity: [0.28, 0.6, 0.28], scale: [1, 1.015, 1] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -inset-4 rounded-[3rem] bg-[#fec708]/8 blur-2xl pointer-events-none sm:-inset-6 sm:rounded-[3.6rem]"
              animate={shouldReduceMotion ? undefined : { opacity: [0.22, 0.44, 0.22] }}
              transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="paw-balance-card rounded-[2.25rem] px-5 py-5 sm:rounded-[2.55rem] sm:px-8 sm:py-9 flex flex-col items-center relative overflow-hidden">
              <div className="paw-balance-logo-stage mb-2 sm:mb-4">
                <motion.div
                  className="paw-balance-logo-halo"
                  animate={shouldReduceMotion ? undefined : { opacity: [0.55, 0.9, 0.55], scale: [0.98, 1.04, 0.98] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="paw-balance-logo relative grid place-items-center rounded-full"
                  animate={shouldReduceMotion ? undefined : { scale: [1, 1.025, 1], filter: ['brightness(1)', 'brightness(1.08)', 'brightness(1)'] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: [0.25, 1, 0.5, 1] }}
                >
                  <img src={planetLogo} alt="Planet Animal" className="h-full w-full rounded-full object-cover" />
                </motion.div>
              </div>

              <motion.span
                className="cinematic-kicker mb-4 tracking-[0.48em] opacity-85 sm:mb-7"
                animate={shouldReduceMotion ? undefined : { opacity: [0.68, 0.94, 0.68] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                Points Balance
              </motion.span>

              <div className="flex items-end justify-center gap-2.5 mb-2 overflow-visible py-1 w-full">
                <motion.span
                  key={currentPoints}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="paw-balance-number cinematic-price text-[3.65rem] sm:text-[5.6rem] tabular-nums"
                >
                  {currentPoints.toLocaleString()}
                </motion.span>
                <div className="flex flex-col items-start pb-[0.62rem] shrink-0 sm:pb-[0.95rem]">
                  <span className="text-[1.3rem] sm:text-[2rem] font-black text-[#fec708] leading-none tracking-[-0.035em]">PAW</span>
                  <span className="text-sm sm:text-xl font-black text-white/30 tracking-[0.02em] leading-none">PTS</span>
                </div>
              </div>

              {/* Progress to Next Tier */}
              {(() => {
                const progress = nextTierProgress;
                const ptsToNext = pointsToNextTier;

                return (
                  <div className="mt-5 w-full max-w-[320px] sm:mt-8">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-black text-white/52 uppercase tracking-[0.16em]">Next: {nextTier.title}</span>
                      <span className="text-[10px] font-black text-[#fec708] uppercase tracking-widest">{Math.round(progress)}%</span>
                    </div>
                    <div className="paw-progress-track h-2.5 w-full rounded-full overflow-hidden mb-2 relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className="paw-progress-fill h-full rounded-full"
                      />
                    </div>
                    <p className="text-[10px] font-extrabold leading-snug text-white/44">{ptsToNext.toLocaleString()} pts away from your next reward</p>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Rewards Details */}
      <section aria-labelledby="reward-details-title" className="px-6 mb-24 max-w-6xl mx-auto w-full">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#fec708]/15 bg-[#fec708]/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#fec708]">
              <Sparkles className="h-3.5 w-3.5" /> Rewards Details
            </span>
            <h2 id="reward-details-title" className="cinematic-section-title mt-5 text-4xl md:text-5xl">
              Clear value, next action, no guesswork.
            </h2>
            <p className="cinematic-copy mt-3 max-w-xl text-[0.95rem] leading-7 text-white/62">
              See what your points are worth today and what one more health action moves you toward next.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 text-left md:text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Next unlock</p>
            <p className="mt-1 text-lg font-black text-white">{nextTier.title}</p>
            <p className="text-xs font-bold text-[#fec708] tabular-nums">{pointsToNextTier.toLocaleString()} pts away</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
            className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0b0a07] p-6 md:p-8"
          >
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[#fec708]/[0.08] blur-[90px]" />
            <div className="relative flex flex-col gap-8">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#fec708]/20 bg-[#fec708]/10 text-[#fec708]">
                    <Gift className="h-7 w-7" />
                  </div>
                  <h3 className="cinematic-card-title text-3xl">Redeemable Value</h3>
                  <p className="mt-2 max-w-md text-[0.95rem] font-semibold leading-7 text-white/62">
                    Paw Points convert directly into clinical credit for eligible Planet Animal services.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">Balance</p>
                  <p className="reward-card-balance mt-1 tabular-nums">{currentPoints.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="reward-metric-card rounded-3xl p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Cash value</p>
                  <motion.p
                    key={Math.round(currentPoints * PAW_POINT_TO_INR * 100)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="reward-metric-value mt-3 tabular-nums"
                  >
                    ₹{(currentPoints * PAW_POINT_TO_INR).toFixed(2)}
                  </motion.p>
                  <p className="reward-rate mt-1 tabular-nums">1 point = ₹0.25</p>
                </div>
                <div className="reward-metric-card rounded-3xl p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Progress</p>
                  <div className="mt-4 flex items-end justify-between gap-4">
                    <p className="reward-progress-number tabular-nums">{Math.round(nextTierProgress)}%</p>
                    <p className="max-w-[8rem] text-right text-[0.82rem] font-bold leading-snug text-white/50">toward {nextTier.title}</p>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full border border-white/10 bg-white/[0.06]">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${nextTierProgress}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.9, ease: [0.25, 1, 0.5, 1] }}
                      className="h-full rounded-full bg-[#fec708]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.25, 1, 0.5, 1] }}
            className="relative overflow-hidden rounded-[2.5rem] border border-orange-300/15 bg-[#100b08] p-6 md:p-8"
          >
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-orange-400/10 blur-[90px]" />
            <div className="relative">
              <div className="mb-7 flex items-start justify-between gap-5">
                <div>
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-300/20 bg-orange-400/10 text-orange-300">
                    <Activity className="h-7 w-7" />
                  </div>
                  <h3 className="cinematic-card-title text-3xl">Health Streak</h3>
                  <p className="mt-2 text-sm font-medium text-white/45">A calmer weekly view of check-in momentum.</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">Current</p>
                  <p className="mt-1 text-3xl font-black text-orange-300 tabular-nums">{healthStreakDays}</p>
                  <p className="text-xs font-bold text-white/35">days</p>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const isComplete = dayIndex < visibleStreakDays;
                  const isCurrent = dayIndex === Math.max(0, visibleStreakDays - 1) && visibleStreakDays > 0;

                  return (
                    <motion.div
                      key={dayIndex}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.28, delay: shouldReduceMotion ? 0 : dayIndex * 0.035 }}
                      className={cn(
                        "flex aspect-square min-h-10 items-center justify-center rounded-2xl border text-xs font-black tabular-nums transition-colors",
                        isComplete ? 'border-orange-300/25 bg-orange-300/15 text-orange-200' : 'border-white/10 bg-white/[0.035] text-white/[0.28]',
                        isCurrent ? 'shadow-[0_0_24px_rgba(251,146,60,0.22)]' : ''
                      )}
                    >
                      {isComplete ? <CheckCircle2 className="h-4 w-4" /> : dayIndex + 1}
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Multiplier</p>
                  <p className="mt-2 text-2xl font-black text-emerald-300 tabular-nums">
                    {streakMultiplier.toFixed(streakMultiplier % 1 === 0 ? 0 : 2).replace(/0$/, '')}x
                  </p>
                </div>
                <div className="rounded-3xl border border-[#fec708]/15 bg-[#fec708]/5 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#fec708]">Today</p>
                  <p className="mt-2 text-xs font-semibold leading-relaxed text-white/55">Complete 1 Pulse Check to keep the streak alive and earn +10 pts.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Referral Program */}
      <section className="mb-24 max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden p-10 md:p-14 rounded-[3rem] border border-[#fec708]/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] shadow-[inset_0_1px_1px_rgba(255,255,255,0.14),0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-3xl"
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(254,199,8,0.07),transparent_38%,rgba(255,255,255,0.035))] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fec708]/10 border border-[#fec708]/20 mb-6">
                <Share2 className="w-3.5 h-3.5 text-[#fec708]" />
                <span className="cinematic-kicker text-[9px]">Referral Rewards</span>
              </div>
              <h2 className="cinematic-section-title mb-4 text-4xl md:text-5xl">
                Invite a <span className="text-[#fec708]">Friend</span>
              </h2>
              <p className="cinematic-copy mb-8 max-w-xl text-lg text-white/50">
                Refer a fellow pet parent. When they join Planet Animal, <span className="text-white font-bold">you both receive <span className="text-[#fec708]">2,500 Paw Points</span></span> instantly — enough to unlock your first bill rebate.
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <motion.button
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    navigator.clipboard.writeText('https://planetanimal.in/refer/papyrus');
                    alert('Referral link copied!');
                  }}
                  className="group relative flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#fec708] text-black font-black text-sm uppercase tracking-widest shadow-[0_20px_40px_rgba(254,199,8,0.3)] overflow-hidden"
                >
                  <span className="relative">Invite a Friend</span>
                  <Share2 className="relative w-4 h-4 group-hover:scale-110 transition-transform" />
                </motion.button>
              </div>
            </div>
            <div className="shrink-0">
              <motion.div
                whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
                className="relative p-8 rounded-[2.5rem] bg-[#0b0b09]/70 border border-[#fec708]/12 flex flex-col items-center shadow-[0_24px_60px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.08)] backdrop-blur-2xl overflow-hidden"
              >
                <div className="absolute inset-0 rounded-[2.5rem] bg-[radial-gradient(circle_at_50%_0%,rgba(254,199,8,0.12),transparent_46%)] pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="mb-5 relative grid place-items-center w-24 h-24">
                    <motion.div
                      className="absolute inset-1 rounded-full border border-[#fec708]/18 shadow-[0_0_34px_rgba(254,199,8,0.14)]"
                      animate={shouldReduceMotion ? undefined : { scale: [1, 1.035, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 3.8, repeat: Infinity, ease: [0.25, 1, 0.5, 1] }}
                    />
                    <motion.div
                      className="absolute inset-4 rounded-full bg-[conic-gradient(from_120deg,transparent,rgba(254,199,8,0.34),rgba(255,246,204,0.14),transparent)] blur-sm"
                      animate={shouldReduceMotion ? undefined : { rotate: 360 }}
                      transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                    />
                    <motion.div
                      className="relative grid place-items-center w-16 h-16 rounded-full border border-white/15 bg-[#fec708] shadow-[0_0_28px_rgba(254,199,8,0.42),inset_0_1px_14px_rgba(255,255,255,0.3)]"
                      animate={shouldReduceMotion ? undefined : { scale: [1, 1.025, 1] }}
                      transition={{ duration: 2.6, repeat: Infinity, ease: [0.25, 1, 0.5, 1] }}
                    >
                      <Gift className="w-7 h-7 text-black" strokeWidth={2.4} />
                      <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_20%,rgba(255,255,255,0.42),transparent_32%)]" />
                    </motion.div>
                  </div>
                  <span className="text-white/40 font-bold uppercase tracking-widest text-[10px] mb-1">Your Referrals</span>
                  <motion.span
                    key={referralCount}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="cinematic-price text-5xl tabular-nums text-white"
                  >
                    {referralCount}
                  </motion.span>
                  <span className="text-[9px] font-black text-[#fec708] uppercase tracking-[0.2em] mt-2">
                    {referralCount === 0 ? 'No friends joined yet' : referralCount === 1 ? 'friend joined' : 'friends joined'}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Reward Milestones */}
      <section id="roadmap-section" className="mb-32 max-w-5xl mx-auto px-6 relative">
        <div className="flex flex-col items-center mb-20 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="w-px h-20 bg-gradient-to-b from-[#fec708] to-transparent mb-6"
          />
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="cinematic-title mb-6 text-5xl uppercase italic md:text-7xl"
          >
            Reward <span className="text-[#fec708]">Milestones</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="cinematic-copy max-w-xl text-xl text-white/35"
          >
            From your first visit to legendary status — every Paw Point you earn brings real clinical rewards closer.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#fec708]/5 border border-[#fec708]/15"
          >
            <Zap className="w-3.5 h-3.5 text-[#fec708]" />
            <span className="text-[10px] font-black text-[#fec708] uppercase tracking-[0.2em]">
              {pawPointsRoadmap.filter(t => currentPoints >= t.points).length} of {pawPointsRoadmap.length} Milestones Reached
            </span>
          </motion.p>
        </div>

        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] hidden md:block overflow-hidden">
            <div className="absolute inset-0 bg-white/5" />
            <motion.div 
              style={{ height: useTransform(scrollY, [1000, 3000], ["0%", "100%"]) }}
              className="absolute top-0 left-0 w-full bg-gradient-to-b from-[#fec708] via-orange-500 to-transparent"
            />
          </div>

          <div className="space-y-20 relative">
            {pawPointsRoadmap.map((tier, index) => {
              const isLocked = currentPoints < tier.points;
              const isEven = index % 2 === 0;
              const isNext = currentPoints >= (pawPointsRoadmap[index - 1]?.points || 0) && isLocked;

              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6 }}
                  className={`flex flex-col md:flex-row items-center gap-10 ${isEven ? 'md:flex-row-reverse' : ''}`}
                >
                  <div className={`flex-1 w-full ${isEven ? 'md:text-right' : 'md:text-left'}`}>
                    <div className={cn(
                      "p-8 md:p-10 rounded-[2.5rem] relative overflow-hidden group transition-all duration-700 gradient-noise",
                      isLocked
                        ? 'bg-[#0b0b09] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.28)]'
                        : 'bg-[#0b0b09] border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.4)]',
                      isNext && isLocked ? 'border-white/15 shadow-[0_0_40px_rgba(254,199,8,0.06)]' : ''
                    )}>
                      {/* Beautiful tier color gradient wash */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${tier.color} opacity-10 group-hover:opacity-20 transition-opacity duration-700`} />
                      {/* Extra glow layer for unlocked tiers */}
                      {!isLocked && (
                        <div className={`absolute inset-0 bg-gradient-to-br ${tier.color} opacity-0 group-hover:opacity-15 transition-opacity duration-700`} />
                      )}

                      <div className={`flex flex-col ${isEven ? 'md:items-end' : 'md:items-start'} gap-4 relative z-10`}>
                        <div className={cn(
                          "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]",
                          isLocked ? 'bg-white/[0.06] text-white/50 border border-white/10' : 'bg-[#fec708]/10 text-[#fec708]'
                        )}>
                          {isLocked ? (
                            <><Lock className="w-3 h-3" /> {isNext ? 'Next Up' : 'Locked'} &bull; {tier.points.toLocaleString()} pts</>
                          ) : (
                            <><CheckCircle2 className="w-3.5 h-3.5" /> Unlocked</>
                          )}
                        </div>

                        <h3 className={cn(
                          "cinematic-card-title text-3xl transition-all duration-500 group-hover:tracking-tight md:text-4xl",
                          isLocked ? 'text-white/70' : 'text-white'
                        )}>
                          {tier.title}
                        </h3>

                        <p className={cn(
                          "text-base md:text-lg font-medium leading-relaxed max-w-md",
                          isLocked ? 'text-white/40' : 'text-white/45'
                        )}>
                          {tier.description}
                        </p>

                        {/* Gamification progress for locked tiers */}
                        {isLocked && (
                          <div className="mt-4 w-full max-w-xs">
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Progress</span>
                              <span className="text-[8px] font-black text-white/40">{Math.min(100, Math.round((currentPoints / tier.points) * 100))}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden border border-white/[0.04]">
                              <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${Math.min(100, (currentPoints / tier.points) * 100)}%` }}
                                transition={{ duration: 1.5, ease: 'circOut' }}
                                className="h-full bg-[#fec708] rounded-full"
                              />
                            </div>
                            <p className="text-[9px] font-bold text-white/30 mt-2">
                              {Math.max(0, tier.points - currentPoints).toLocaleString()} pts to unlock
                            </p>
                          </div>
                        )}

                        {/* Unlocked — reward claim */}
                        {!isLocked && (
                          <motion.button
                            onClick={() => handleRedeem(tier)}
                            whileHover={{ scale: 1.05, x: isEven ? -8 : 8 }}
                            whileTap={{ scale: 0.95 }}
                            className="mt-4 flex items-center gap-3 text-[#fec708] font-black text-xs uppercase tracking-[0.3em] group/btn bg-[#fec708]/5 px-5 py-2.5 rounded-2xl border border-[#fec708]/10 hover:bg-[#fec708] hover:text-black transition-all"
                          >
                            Claim Reward <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Orb Icon — inspired by referral card, clean orb for all tiers */}
                  <div className="relative z-20 shrink-0">
                    <div className="relative grid place-items-center" style={{ width: 100, height: 100 }}>
                      {/* Outer pulsing ring */}
                      <motion.div
                        className={cn(
                          "absolute inset-1 rounded-full border shadow-lg",
                          isLocked
                            ? isNext ? 'border-[#fec708]/20 shadow-[0_0_30px_rgba(254,199,8,0.12)]' : 'border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.04)]'
                            : 'border-[#fec708]/20 shadow-[0_0_30px_rgba(254,199,8,0.18)]'
                        )}
                        animate={shouldReduceMotion ? undefined : { scale: [1, 1.03, 1], opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: [0.25, 1, 0.5, 1] }}
                      />
                      {/* Conic gradient ring — only for unlocked to avoid locked banding */}
                      {!isLocked && (
                        <motion.div
                          className="absolute inset-3 rounded-full bg-[conic-gradient(from_120deg,transparent,rgba(254,199,8,0.3),rgba(255,246,204,0.12),transparent)] blur-sm"
                          animate={shouldReduceMotion ? undefined : { rotate: 360 }}
                          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                        />
                      )}
                      {/* Inner icon container */}
                      <motion.div
                        className={cn(
                          "relative grid place-items-center rounded-full border shadow-xl",
                          isLocked
                            ? isNext
                              ? 'w-[52px] h-[52px] md:w-14 md:h-14 border-[#fec708]/25 bg-[#fec708]/8'
                              : 'w-[52px] h-[52px] md:w-14 md:h-14 border-white/12 bg-white/[0.04]'
                            : 'w-[52px] h-[52px] md:w-14 md:h-14 border-white/15 bg-[#0a0a0a] shadow-[0_0_24px_rgba(254,199,8,0.2),inset_0_1px_1px_rgba(255,255,255,0.08)]'
                        )}
                        animate={shouldReduceMotion ? undefined : { scale: [1, 1.025, 1] }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: [0.25, 1, 0.5, 1] }}
                      >
                        {React.cloneElement(tier.icon, {
                          className: isLocked ? (isNext ? 'text-[#fec708]' : 'text-white/40') : 'text-[#fec708]',
                          size: 24
                        })}
                        {/* Gloss highlight */}
                        <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_20%,rgba(255,255,255,0.25),transparent_35%)]" />
                      </motion.div>
                      {/* Lock badge for locked tiers */}
                      {isLocked && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-black text-white/50">
                          <Lock className="h-3 w-3" />
                        </span>
                      )}
                    </div>

                    {/* Glowing point on timeline */}
                    <div className={cn(
                      "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full blur-[3px] -z-10 hidden md:block transition-all duration-700",
                      isLocked ? (isNext ? 'bg-[#fec708]/70 shadow-[0_0_14px_rgba(254,199,8,0.5)]' : 'bg-white/20') : 'bg-[#fec708] shadow-[0_0_16px_#fec708]'
                    )} />
                  </div>

                  <div className="flex-1 hidden md:block" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>



      {/* Legacy Ledger Section */}
      <section className="mb-32 max-w-4xl mx-auto px-6">
        <div className="p-12 rounded-[3rem] bg-[#0a0a0a] border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#fec708]/5 blur-[100px] -z-10" />

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-[#fec708] shadow-[0_0_20px_rgba(254,199,8,0.15)]">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="cinematic-card-title text-3xl uppercase text-white">Paw Points Ledger</h2>
                <p className="cinematic-kicker text-sm font-semibold tracking-[-0.01em] text-white/35">Every point has a trail.</p>
              </div>
            </div>
            <button className="text-[10px] font-black text-[#fec708] uppercase tracking-[0.2em] border-b border-[#fec708]/20 pb-1 hover:text-white hover:border-white transition-all">
              Export History
            </button>
          </div>

          {recentActivity.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-white/30 text-sm cinematic-copy">
                Your Paw Points trail will appear here after visits, check-ins, referrals, or redemptions.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity, i) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  whileHover={{ scale: 1.01, y: -2 }}
                  className="relative flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all group cursor-pointer overflow-hidden"
                >
                  <div
                    className={cn(
                      "absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-[30px] pointer-events-none",
                      activity.type === 'earned' ? 'bg-emerald-500/5' : 'bg-rose-500/5'
                    )}
                  />

                  <div className="flex items-center gap-4 relative z-10">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        activity.type === 'earned'
                          ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.2)]'
                          : 'bg-rose-500/10 text-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.2)]'
                      )}
                    >
                      {getActivityIcon(activity)}
                    </div>
                    <div>
                      <h4 className="cinematic-card-title text-sm text-white/95">{activity.activity}</h4>
                      <span className="text-[10px] font-black text-white/25 uppercase tracking-widest">{activity.date}</span>
                    </div>
                  </div>

                  <div className="text-right relative z-10">
                    <motion.span
                      key={activity.id}
                      initial={{ scale: 1.2, opacity: 0, filter: 'blur(4px)' }}
                      whileInView={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className={cn(
                        "text-lg font-black tabular-nums inline-block",
                        activity.type === 'earned'
                          ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]'
                          : 'text-rose-400 drop-shadow-[0_0_10px_rgba(251,113,133,0.4)]',
                        !shouldReduceMotion && activity.type === 'earned' && 'animate-point-glow-earned',
                        !shouldReduceMotion && activity.type === 'redeemed' && 'animate-point-glow-redeemed'
                      )}
                    >
                      {activity.type === 'earned' ? '+' : ''}{activity.points}
                    </motion.span>
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1.5">PTS</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-8 py-4 rounded-2xl border border-white/5 text-white/30 font-black text-[10px] uppercase tracking-[0.3em] hover:text-white hover:border-white/20 hover:bg-white/[0.02] transition-all"
          >
            Review Full Performance Analytics
          </motion.button>
        </div>
      </section>



      {/* Success Toast */}
      <AnimatePresence>
        {showRedeemSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 20, scale: 0.9, filter: 'blur(10px)' }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md"
          >
            <div className="relative overflow-hidden p-8 rounded-[2.5rem] liquid-glass-premium bg-[#fec708]/10 border-[#fec708]/30 shadow-[0_50px_100px_rgba(0,0,0,0.8)] text-center">
              <HolographicFoil />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#fec708] to-transparent animate-pulse" />
              
              <div className="w-20 h-20 rounded-[2rem] bg-[#fec708] flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(254,199,8,0.4)]">
                <Crown className="text-black w-10 h-10" />
              </div>
              
              <h4 className="text-white text-3xl font-black uppercase tracking-tight mb-2">Reward <span className="text-[#fec708]">Redeemed!</span></h4>
              <p className="text-white/60 font-medium text-sm leading-relaxed mb-8">
                <span className="text-white font-bold">"{redeemedReward}"</span> has been confirmed and added to your health profile. Our team will be in touch.
              </p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowRedeemSuccess(false)}
                  className="flex-1 py-4 rounded-2xl bg-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] border border-white/10 hover:bg-white/20 transition-all"
                >
                  Dismiss
                </button>
                <button 
                  onClick={() => {
                    setShowRedeemSuccess(false);
                    setShowReceipt(true);
                  }}
                  className="flex-1 py-4 rounded-2xl bg-[#fec708] text-black font-black text-[10px] uppercase tracking-[0.2em] shadow-xl"
                >
                  View Receipt
                </button>
              </div>
            </div>
            
            {/* Confetti-like particles (simple) */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute -top-10 left-1/2 -translate-x-1/2 w-full h-20 pointer-events-none"
            >
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    y: [-20, -100], 
                    x: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 200],
                    opacity: [1, 0],
                    scale: [1, 0.5]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                  className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full bg-[#fec708]"
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 noise-overlay opacity-[0.03] pointer-events-none" />
    </div>
  );
}

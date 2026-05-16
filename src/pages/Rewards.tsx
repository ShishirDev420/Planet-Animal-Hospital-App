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
  <div className="absolute inset-0 holographic-foil opacity-30 pointer-events-none mix-blend-overlay" />
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

  const recentActivity = useMemo(() => [
    { id: 1, type: 'earned', activity: 'Morning Pulse Check', points: 25, date: '2 hours ago', icon: <Activity className="w-4 h-4" /> },
    { id: 2, type: 'earned', activity: 'Completed Annual Labs', points: 500, date: 'Yesterday', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 3, type: 'redeemed', activity: 'Nutrition Program Activation', points: -1000, date: '2 days ago', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 4, type: 'earned', activity: 'Weekly Social Share', points: 100, date: '3 days ago', icon: <Share2 className="w-4 h-4" /> },
  ], []);

  const currentPoints = Number(profile?.pawPoints || 0);
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

      <header className="px-6 pt-10 pb-6 flex items-center justify-between relative z-50">
        <motion.button 
          whileHover={{ scale: 1.1, x: -5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)} 
          className="w-12 h-12 rounded-xl bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center"
        >
          <ChevronLeft size={20} />
        </motion.button>
        <div className="flex flex-col items-center">
          <h1 className="font-heading font-black text-xl uppercase italic tracking-tighter text-[#fec708]">PAW POINTS</h1>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#fec708] animate-pulse" />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Health Rewards</span>
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 15 }}
          className="w-12 h-12 rounded-xl bg-[#fec708]/10 border border-[#fec708]/20 flex items-center justify-center text-[#fec708]"
        >
          <Medal size={20} />
        </motion.button>
      </header>

      {/* Header Section */}
      <div className="relative pt-12 pb-20 px-6">
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-2xl mb-8 shadow-2xl overflow-hidden group"
          >
            <HolographicFoil />
            <PawPrint className="w-4 h-4 text-[#fec708] group-hover:rotate-12 transition-transform" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/80">Rewards Hub &bull; <span className="text-[#fec708]">Paw Points</span></span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.95]"
          >
            YOUR <span className="text-[#fec708] italic">PAW</span><br />POINTS
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/40 font-medium leading-relaxed max-w-2xl mx-auto mb-16"
          >
            Every visit, every check-in, every act of care earns Paw Points. Unlock real clinical rewards on your journey to pet longevity.
          </motion.p>

          {/* Points Counter - Prestige Glow Implementation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block relative p-[1px] rounded-[3rem] ascension-glow shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
          >
            <div className="bg-[#0a0a08]/95 rounded-[2.9rem] px-16 py-10 backdrop-blur-3xl flex flex-col items-center relative overflow-hidden">
              <HolographicFoil />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#fec708]/40 to-transparent" />

              {/* Inline Orb — compact visual anchor */}
              <div className="mb-3 relative grid place-items-center" style={{ width: 100, height: 100 }}>
                <motion.div
                  className="absolute inset-2 rounded-full border border-[#fec708]/25 shadow-[0_0_48px_rgba(254,199,8,0.22)]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3.8, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border border-dashed border-teal-200/15"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 5.4, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="absolute inset-1 rounded-full bg-[conic-gradient(from_90deg,transparent,rgba(254,199,8,0.32),rgba(255,246,204,0.12),rgba(45,212,191,0.18),transparent)] blur-lg"
                  animate={{ rotate: 360, scale: [1, 1.04, 1] }}
                  transition={{ rotate: { duration: 6.5, repeat: Infinity, ease: 'linear' }, scale: { duration: 2.2, repeat: Infinity, ease: [0.25, 1, 0.5, 1] } }}
                />
                <motion.div
                  className="relative grid place-items-center rounded-full border border-white/15 bg-[#fec708] shadow-[0_0_40px_rgba(254,199,8,0.55),inset_0_1px_16px_rgba(255,255,255,0.28)] h-[72px] w-[72px]"
                  animate={{ scale: [1, 1.035, 1], filter: ['brightness(1)', 'brightness(1.08)', 'brightness(1)'] }}
                  transition={{ duration: 1.9, repeat: Infinity, ease: [0.25, 1, 0.5, 1] }}
                >
                  <img src={planetLogo} alt="Planet Animal" className="h-full w-full rounded-full object-cover" />
                  <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_22%,rgba(255,255,255,0.38),transparent_30%)]" />
                </motion.div>
              </div>
              
              <span className="text-[10px] font-black text-[#fec708] uppercase tracking-[0.5em] mb-4 opacity-60">Points Balance</span>
              <div className="flex items-end gap-3">
                <motion.span 
                  key={currentPoints}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-7xl md:text-9xl font-black text-white tabular-nums tracking-tighter leading-none"
                >
                  {currentPoints.toLocaleString()}
                </motion.span>
                <div className="flex flex-col items-start pb-2">
                  <span className="text-3xl font-black text-[#fec708] leading-none">PAW</span>
                  <span className="text-xl font-bold text-white/20 tracking-widest leading-none">PTS</span>
                </div>
              </div>

              {/* Progress to Next Tier */}
              {(() => {
                const progress = nextTierProgress;
                const ptsToNext = pointsToNextTier;

                return (
                  <div className="mt-10 w-full max-w-[320px]">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Next: {nextTier.title}</span>
                      <span className="text-[10px] font-black text-[#fec708] uppercase tracking-widest">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 mb-2">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className="h-full bg-gradient-to-r from-[#fec708] to-orange-400 shadow-[0_0_18px_rgba(254,199,8,0.7)] rounded-full"
                      />
                    </div>
                    <p className="text-[9px] font-bold text-white/25 mb-4">{ptsToNext.toLocaleString()} pts away from your next reward</p>
                    {/* Premium Nudge — TAP FOR REWARD DETAILS */}
                    <motion.button
                      onClick={() => {
                        const el = document.getElementById('roadmap-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      className="group relative flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl overflow-hidden border border-[#fec708]/30 bg-[#fec708]/5 hover:bg-[#fec708]/12 transition-all duration-300"
                      style={{ boxShadow: '0 0 24px rgba(254,199,8,0.18), inset 0 1px 0 rgba(255,255,255,0.06)' }}
                    >
                      {/* Breathing glow layer */}
                      <motion.div
                        className="absolute inset-0 rounded-2xl bg-[#fec708]/10 pointer-events-none"
                        animate={{ opacity: [0.4, 0.9, 0.4] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <motion.div
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Sparkles className="w-3 h-3 text-[#fec708]" />
                      </motion.div>
                      <span className="relative text-[10px] font-black uppercase tracking-[0.22em] text-[#fec708]">
                        TAP FOR REWARD DETAILS
                      </span>
                      <motion.div
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-[#fec708] group-hover:translate-x-0.5 transition-transform" />
                      </motion.div>
                    </motion.button>

                    {/* Gamification Stats Row */}
                    <div className="mt-5 grid grid-cols-3 gap-2 w-full">
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.75 }}
                        className="relative flex flex-col items-center gap-1 p-3 rounded-2xl bg-white/[0.03] border border-white/5 overflow-hidden"
                      >
                        <motion.div
                          className="absolute inset-0 bg-orange-500/5 rounded-2xl"
                          animate={{ opacity: [0.3, 0.8, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                        />
                        <span className="relative text-lg font-black text-orange-400 tabular-nums">
                          {healthStreakDays}d
                        </span>
                        <span className="relative text-[8px] font-black text-white/30 uppercase tracking-widest">Day Streak</span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.85 }}
                        className="relative flex flex-col items-center gap-1 p-3 rounded-2xl bg-white/[0.03] border border-white/5 overflow-hidden"
                      >
                        <motion.div
                          className="absolute inset-0 bg-[#fec708]/5 rounded-2xl"
                          animate={{ opacity: [0.2, 0.6, 0.2] }}
                          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                        />
                        <span className="relative text-lg font-black text-[#fec708]">
                          {currentPoints >= 25000 ? '★ Elite' : currentPoints >= 10000 ? '◆ Senior' : currentPoints >= 5000 ? '✦ Guard' : currentPoints >= 1500 ? '● Care' : '○ New'}
                        </span>
                        <span className="relative text-[8px] font-black text-white/30 uppercase tracking-widest">Your Rank</span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.95 }}
                        className="relative flex flex-col items-center gap-1 p-3 rounded-2xl bg-white/[0.03] border border-white/5 overflow-hidden"
                      >
                        <motion.div
                          className="absolute inset-0 bg-emerald-500/5 rounded-2xl"
                          animate={{ opacity: [0.2, 0.7, 0.2] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                        />
                        <span className="relative text-lg font-black text-emerald-400 tabular-nums">
                          {streakMultiplier.toFixed(streakMultiplier % 1 === 0 ? 0 : 2).replace(/0$/, '')}x
                        </span>
                        <span className="relative text-[8px] font-black text-white/30 uppercase tracking-widest">Boost</span>
                      </motion.div>
                    </div>
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
            <h2 id="reward-details-title" className="mt-5 text-4xl font-black tracking-tight text-white md:text-5xl">
              Clear value, next action, no guesswork.
            </h2>
            <p className="mt-3 max-w-xl text-base font-medium leading-relaxed text-white/45">
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
                  <h3 className="text-3xl font-black text-white">Redeemable Value</h3>
                  <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-white/45">
                    Paw Points convert directly into clinical credit for eligible Planet Animal services.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">Balance</p>
                  <p className="mt-1 text-2xl font-black text-white tabular-nums">{currentPoints.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Cash value</p>
                  <motion.p
                    key={Math.round(currentPoints * PAW_POINT_TO_INR * 100)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 text-4xl font-black text-[#fec708] tabular-nums"
                  >
                    ₹{(currentPoints * PAW_POINT_TO_INR).toFixed(2)}
                  </motion.p>
                  <p className="mt-1 text-xs font-semibold text-white/35">1 point = ₹0.25</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Progress</p>
                  <div className="mt-4 flex items-end justify-between gap-4">
                    <p className="text-4xl font-black text-white tabular-nums">{Math.round(nextTierProgress)}%</p>
                    <p className="max-w-[8rem] text-right text-xs font-semibold leading-snug text-white/35">toward {nextTier.title}</p>
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
                  <h3 className="text-3xl font-black text-white">Health Streak</h3>
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
                <span className="text-[9px] font-black text-[#fec708] uppercase tracking-[0.2em]">Referral Rewards</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                Invite a <span className="text-[#fec708]">Friend</span>
              </h2>
              <p className="text-lg text-white/50 font-medium leading-relaxed max-w-xl mb-8">
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
                    className="text-5xl font-black text-white tabular-nums"
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
            className="text-5xl md:text-7xl font-black text-white mb-6 uppercase italic tracking-tighter"
          >
            Reward <span className="text-[#fec708]">Milestones</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/30 font-medium max-w-xl leading-relaxed"
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
                      "p-8 md:p-10 rounded-[3rem] relative overflow-hidden group transition-all duration-700",
                      isLocked 
                        ? 'bg-white/[0.055] border border-white/[0.12] shadow-[0_24px_60px_rgba(0,0,0,0.28)]' 
                        : 'liquid-glass-premium border-[#fec708]/20 shadow-[0_40px_80px_rgba(0,0,0,0.4)]',
                      isNext && !isLocked ? '' : '',
                      isNext && isLocked ? 'ring-1 ring-[#fec708]/35 bg-[#fec708]/[0.075]' : ''
                    )}>
                      {!isLocked && <HolographicFoil />}
                      <div className={`absolute inset-0 bg-gradient-to-br ${tier.color} ${isLocked ? 'opacity-[0.045] group-hover:opacity-[0.1]' : 'opacity-0 group-hover:opacity-[0.08]'} transition-opacity duration-700`} />
                      
                      <div className={`flex flex-col ${isEven ? 'md:items-end' : 'md:items-start'} gap-4 relative z-10`}>
                        <div className={cn(
                          "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]",
                          isLocked ? 'bg-white/[0.08] text-white/55 border border-white/10' : 'bg-[#fec708]/10 text-[#fec708]'
                        )}>
                          {isLocked ? (
                            <><Lock className="w-3 h-3" /> {isNext ? 'Next Up' : 'Locked'} &bull; {tier.points.toLocaleString()} pts</>
                          ) : (
                            <><CheckCircle2 className="w-3.5 h-3.5" /> Unlocked</>
                          )}
                        </div>
                        
                        <h3 className={cn(
                          "text-3xl md:text-4xl font-black transition-all group-hover:tracking-tight duration-500",
                          isLocked ? 'text-white/[0.72]' : 'text-white'
                        )}>
                          {tier.title}
                        </h3>
                        
                        <p className={cn(
                          "text-base md:text-lg font-medium leading-relaxed max-w-md",
                          isLocked ? 'text-white/[0.42]' : 'text-white/40'
                        )}>
                          {tier.description}
                        </p>

                        {/* Gamification progress for locked tiers */}
                        {isLocked && (
                          <div className="mt-4 w-full max-w-xs">
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-[8px] font-black text-white/45 uppercase tracking-widest">Progress</span>
                              <span className="text-[8px] font-black text-white/45">{Math.min(100, Math.round((currentPoints / tier.points) * 100))}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                whileInView={{ width: `${Math.min(100, (currentPoints / tier.points) * 100)}%` }}
                                transition={{ duration: 1.5, ease: 'circOut' }}
                                className="h-full bg-gradient-to-r from-[#fec708]/45 to-[#fec708] rounded-full"
                              />
                            </div>
                            <p className="text-[9px] font-bold text-white/[0.38] mt-2">
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

                  {/* Orb Icon — unlocked tiers get animated orb */}
                  <div className="relative z-20 shrink-0">
                    {isLocked ? (
                      <motion.div
                        whileHover={shouldReduceMotion ? undefined : { scale: 1.08 }}
                        className={cn(
                          "relative w-20 h-20 md:w-24 md:h-24 rounded-[2rem] flex items-center justify-center border bg-[#0d0d0d] shadow-xl transition-colors",
                          isNext ? 'border-[#fec708]/35 text-[#fec708] bg-[#fec708]/10' : 'border-white/15 text-white/45 bg-white/[0.04]'
                        )}
                      >
                        {React.cloneElement(tier.icon, { className: isNext ? 'text-[#fec708]' : 'text-white/45', size: 30 })}
                        <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black text-white/55">
                          <Lock className="h-3.5 w-3.5" />
                        </span>
                      </motion.div>
                    ) : (
                      <div className="relative grid place-items-center" style={{ width: 96, height: 96 }}>
                        <motion.div
                          className="absolute inset-3 rounded-full border border-[#fec708]/20 shadow-[0_0_32px_rgba(254,199,8,0.15)]"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
                        />
                        <motion.div
                          className="absolute inset-1 rounded-full border border-dashed border-teal-200/10"
                          animate={{ rotate: -360 }}
                          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                        />
                        <motion.div
                          className="absolute inset-2 rounded-full bg-[conic-gradient(from_90deg,transparent,rgba(254,199,8,0.2),rgba(255,246,204,0.08),rgba(45,212,191,0.08),transparent)] blur-md"
                          animate={{ rotate: 360, scale: [1, 1.03, 1] }}
                          transition={{ rotate: { duration: 6, repeat: Infinity, ease: 'linear' }, scale: { duration: 2, repeat: Infinity, ease: [0.25, 1, 0.5, 1] } }}
                        />
                        <div className="relative grid place-items-center rounded-full border border-white/15 bg-[#0a0a0a] shadow-[0_0_24px_rgba(254,199,8,0.25),inset_0_1px_1px_rgba(255,255,255,0.1)] w-14 h-14 md:w-16 md:h-16">
                          {React.cloneElement(tier.icon, { className: 'text-[#fec708]', size: 28 })}
                        </div>
                      </div>
                    )}
                    
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
              <div className="w-12 h-12 rounded-2xl bg-[#fec708]/10 flex items-center justify-center text-[#fec708]">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">Points History</h2>
                <p className="text-white/30 font-medium text-sm tracking-wide">A complete record of your earned and redeemed Paw Points.</p>
              </div>
            </div>
            <button className="text-[10px] font-black text-[#fec708] uppercase tracking-[0.2em] border-b border-[#fec708]/20 pb-1 hover:text-white hover:border-white transition-all">
              Export History
            </button>
          </div>

          <div className="space-y-3">
            {recentActivity.map((activity, i) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                whileHover={{ scale: 1.01, x: 4 }}
                className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-transform",
                      activity.type === 'earned' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                    )}
                  >
                    {activity.icon}
                  </motion.div>
                  <div>
                    <h4 className="font-black text-white text-sm">{activity.activity}</h4>
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{activity.date}</span>
                  </div>
                </div>
                <div className="text-right">
                  <motion.span
                    key={activity.points}
                    initial={{ scale: 1.3, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    className={cn(
                      "text-lg font-black tabular-nums inline-block",
                      activity.type === 'earned' ? 'text-emerald-500' : 'text-rose-500'
                    )}
                  >
                    {activity.type === 'earned' ? '+' : ''}{activity.points}
                  </motion.span>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">PTS</span>
                </div>
              </motion.div>
            ))}
          </div>

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

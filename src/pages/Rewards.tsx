import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, Lock, CheckCircle2, Clock, Sparkles, Gift, Scissors, Stethoscope, Syringe, HeartPulse } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePetProfile } from '../hooks/usePetProfile';

interface RewardTier {
  points: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'unlocked' | 'in-progress' | 'locked';
}

export default function Rewards() {
  const navigate = useNavigate();
  const { profile } = usePetProfile();
  const currentPoints = profile?.pawPoints || 0;

  const rewards: RewardTier[] = useMemo(() => [
    {
      points: 3000,
      title: '15% Off Entire Bill',
      description: 'One-time discount on any service or product',
      icon: <Gift className="w-6 h-6 text-amber-400" />,
      status: currentPoints >= 3000 ? 'unlocked' : currentPoints >= 1500 ? 'in-progress' : 'locked'
    },
    {
      points: 5000,
      title: 'Free General Wellness Checkup',
      description: 'Complete health assessment with our veterinarians',
      icon: <Stethoscope className="w-6 h-6 text-teal-400" />,
      status: currentPoints >= 5000 ? 'unlocked' : currentPoints >= 3000 ? 'in-progress' : 'locked'
    },
    {
      points: 10000,
      title: 'Blood Panel + Doctor Consult',
      description: 'Comprehensive blood work with expert analysis',
      icon: <HeartPulse className="w-6 h-6 text-rose-400" />,
      status: currentPoints >= 10000 ? 'unlocked' : currentPoints >= 5000 ? 'in-progress' : 'locked'
    },
    {
      points: 15000,
      title: 'Free Annual Dental Checkup',
      description: 'Complete dental examination and cleaning consultation',
      icon: <Sparkles className="w-6 h-6 text-purple-400" />,
      status: currentPoints >= 15000 ? 'unlocked' : currentPoints >= 10000 ? 'in-progress' : 'locked'
    },
    {
      points: 25000,
      title: '50% Off Three Groomings',
      description: 'One grooming session per month for three months',
      icon: <Scissors className="w-6 h-6 text-indigo-400" />,
      status: currentPoints >= 25000 ? 'unlocked' : currentPoints >= 15000 ? 'in-progress' : 'locked'
    },
    {
      points: 50000,
      title: 'Free Senior Health Screening',
      description: 'Annual comprehensive senior wellness package',
      icon: <Syringe className="w-6 h-6 text-emerald-400" />,
      status: currentPoints >= 50000 ? 'unlocked' : currentPoints >= 25000 ? 'in-progress' : 'locked'
    }
  ], [currentPoints]);

  const nextUnlock = rewards.find(r => r.status === 'in-progress');
  const nextUnlockPoints = nextUnlock ? nextUnlock.points - currentPoints : 0;

  return (
    <div className="min-h-screen relative overflow-hidden font-sans pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-[#0d0d0d]">
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#fec708]/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="px-6 py-6 flex items-center justify-between relative z-50">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col items-center pointer-events-none">
          <h1 className="font-heading font-extrabold tracking-tight text-white text-lg">Paw Points Rewards</h1>
          <span className="text-[10px] font-bold font-body text-[#fec708] uppercase tracking-[0.2em] mt-0.5">Planet Animal Hospital</span>
        </div>
        <div className="w-10 h-10" />
      </header>

      {/* Current Balance Card */}
      <div className="px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 mb-6"
        >
          <p className="text-white/60 text-xs uppercase tracking-widest font-medium mb-2">Your Balance</p>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-5xl font-black text-[#fec708]">{currentPoints.toLocaleString()}</span>
            <span className="text-[#fec708] font-bold text-lg">PTS</span>
          </div>

          {nextUnlock && nextUnlockPoints > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/50 mb-2">
                <span>Next unlock</span>
                <span>{nextUnlockPoints.toLocaleString()} pts</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentPoints / nextUnlock.points) * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-[#fec708] to-[#e8bc4b] rounded-full"
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Rewards Timeline */}
      <div className="px-6 relative z-10">
        <h2 className="text-white font-heading font-bold text-lg mb-4">Your Rewards Journey</h2>
        
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-white/10" />

          <div className="space-y-4">
            {rewards.map((reward, index) => (
              <RewardCard key={reward.points} reward={reward} index={index} />
            ))}
          </div>
        </div>
      </div>

      {/* How to Earn Section */}
      <div className="px-6 py-8 relative z-10">
        <h2 className="text-white font-heading font-bold text-lg mb-4">How to Earn</h2>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#fec708]/20 flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-[#fec708]" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Book Visits</p>
              <p className="text-white/50 text-xs">Earn points on every visit</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#fec708]/20 flex items-center justify-center">
              <Gift className="w-4 h-4 text-[#fec708]" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Complete Checkups</p>
              <p className="text-white/50 text-xs">Bonus points for regular care</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#fec708]/20 flex items-center justify-center">
              <HeartPulse className="w-4 h-4 text-[#fec708]" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Proactive Plans</p>
              <p className="text-white/50 text-xs">2x points multiplier on plans</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RewardCard({ reward, index }: { reward: RewardTier; index: number }) {
  const statusColors = {
    unlocked: 'border-[#fec708] bg-[#fec708]/10',
    'in-progress': 'border-teal-500 bg-teal-500/10',
    locked: 'border-white/10 bg-white/5'
  };

  const statusIcons = {
    unlocked: <CheckCircle2 className="w-5 h-5 text-[#fec708]" />,
    'in-progress': <Clock className="w-5 h-5 text-teal-400" />,
    locked: <Lock className="w-5 h-5 text-white/30" />
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`relative pl-16 ${reward.status === 'unlocked' ? 'opacity-100' : reward.status === 'in-progress' ? 'opacity-100' : 'opacity-60'}`}
    >
      {/* Timeline Dot */}
      <div className={`absolute left-4 top-6 w-4 h-4 rounded-full border-2 ${
        reward.status === 'unlocked' ? 'bg-[#fec708] border-[#fec708]' :
        reward.status === 'in-progress' ? 'bg-teal-500 border-teal-500 animate-pulse' :
        'bg-transparent border-white/30'
      }`} />
      
      {/* Card */}
      <div className={`backdrop-blur-xl border rounded-2xl p-4 ${statusColors[reward.status]}`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            reward.status === 'unlocked' ? 'bg-[#fec708]/20' :
            reward.status === 'in-progress' ? 'bg-teal-500/20' :
            'bg-white/10'
          }`}>
            {reward.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-heading font-bold text-base">{reward.title}</h3>
              <div className="flex items-center gap-2">
                {statusIcons[reward.status]}
                <span className="text-[#fec708] font-bold text-sm">{reward.points.toLocaleString()} pts</span>
              </div>
            </div>
            <p className="text-white/50 text-sm mt-1">{reward.description}</p>
            {reward.status === 'unlocked' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-3 w-full bg-[#fec708] text-black font-bold py-2 rounded-xl text-sm"
              >
                Redeem Now
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

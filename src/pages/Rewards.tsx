import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Star, 
  TrendingUp, 
  Zap,
  CheckCircle2,
  Lock,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Award,
  ArrowLeft,
  ChevronLeft,
  Medal,
  PawPrint,
  Share2,
  Check,
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
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePetProfile } from '../hooks/usePetProfile';
import { cn } from '../lib/utils';

const pawPointsRoadmap = [
  { id: 'tier1', points: 500, title: 'Core Foundation', description: 'Unlock core health tracking and daily pulse check rewards.', icon: <Activity className="w-10 h-10" />, color: 'from-emerald-400 to-cyan-500' },
  { id: 'tier2', points: 1500, title: 'Health Savior', description: '25% discount on your next clinical visit or specialist consultation.', icon: <HeartPulse className="w-10 h-10" />, color: 'from-blue-400 to-indigo-500' },
  { id: 'tier3', points: 3000, title: 'Wellness Master', description: '35% off all preventive lab tests and metabolic screenings.', icon: <Zap className="w-10 h-10" />, color: 'from-[#fec708] to-orange-500' },
  { id: 'tier4', points: 5000, title: 'Expert Access', description: '1 FREE Virtual Vet Consultation with our senior specialists.', icon: <Stethoscope className="w-10 h-10" />, color: 'from-purple-400 to-pink-500' },
  { id: 'tier5', points: 7500, title: 'Clinical Privilege', description: '15% OFF all consultations for three months. Priority booking included.', icon: <ShieldCheck className="w-10 h-10" />, color: 'from-rose-400 to-red-500' },
  { id: 'tier6', points: 10000, title: 'The Lifeline Sentinel', description: '50% off next major surgery + Lifetime 5% discount + Priority Emergency Line + Personalized Wellness Concierge.', icon: <Award className="w-10 h-10" />, color: 'from-amber-400 to-yellow-600' },
  { id: 'tier7', points: 25000, title: 'Archive Elite', description: 'Exclusive 24/7 Concierge Health Line and Home Visits.', icon: <Crown className="w-10 h-10" />, color: 'from-indigo-400 to-purple-600' },
  { id: 'tier8', points: 100000, title: "The Founder's Peak", description: 'Luxury all-inclusive estate event for you and your pack. Our highest honor.', icon: <Trophy className="w-10 h-10" />, color: 'from-yellow-400 to-orange-600' },
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

  const specialOffers = useMemo(() => [
    { id: 'off1', title: 'Longevity Bundle', description: 'Complete metabolic panel + 3 months of premium diagnostics.', points: 1200, icon: <Activity className="w-8 h-8" />, tag: 'Popular' },
    { id: 'off2', title: 'Specialist Direct', description: 'Skip the queue. Direct access to our chief surgical officer.', points: 2500, icon: <ShieldCheck className="w-8 h-8" />, tag: 'Elite' },
    { id: 'off3', title: 'Genome Mapping', description: 'Advanced DNA screening for hereditary longevity markers.', points: 5000, icon: <Zap className="w-8 h-8" />, tag: 'Advanced' },
  ], []);

  const clinicalInventory = useMemo(() => [
    { id: 'item1', name: 'Vitality Kibble+', description: 'Scientifically formulated for cardiac support.', points: 450, price: '$45.00', image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&q=80&w=200' },
    { id: 'item2', name: 'Neuro-Enhance Treats', description: 'Brain health and cognitive support formula.', points: 150, price: '$18.00', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=200' },
    { id: 'item3', name: 'Articulator Paste', description: 'High-potency joint and mobility lubricant.', points: 300, price: '$32.00', image: 'https://images.unsplash.com/photo-1541591047357-124c2a49ae21?auto=format&fit=crop&q=80&w=200' },
    { id: 'item4', name: 'Dermal-Pure Serum', description: 'Advanced skin barrier recovery and coat shine.', points: 280, price: '$28.00', image: 'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?auto=format&fit=crop&q=80&w=200' },
  ], []);

  const recentActivity = useMemo(() => [
    { id: 1, type: 'earned', activity: 'Morning Pulse Check', points: 25, date: '2 hours ago', icon: <Activity className="w-4 h-4" /> },
    { id: 2, type: 'earned', activity: 'Completed Annual Labs', points: 500, date: 'Yesterday', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 3, type: 'redeemed', activity: 'Vitality Kibble+ Purchase', points: -450, date: '2 days ago', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 4, type: 'earned', activity: 'Weekly Social Share', points: 100, date: '3 days ago', icon: <Share2 className="w-4 h-4" /> },
  ], []);

  const currentPoints = profile?.pawPoints || 0;
  
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
          <h1 className="font-heading font-black text-xl uppercase italic tracking-tighter text-[#fec708]">ASCENSION</h1>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#fec708] animate-pulse" />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Vitality Archive</span>
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
            <Sparkles className="w-4 h-4 text-[#fec708] group-hover:rotate-12 transition-transform" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/80">Ecosystem Status &bull; <span className="text-[#fec708]">Ascension</span></span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.95]"
          >
            THE <span className="text-[#fec708] italic">VITALITY</span><br />ARCHIVE
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/40 font-medium leading-relaxed max-w-2xl mx-auto mb-16"
          >
            Your dedication to pet longevity translates into tangible clinical assets. Scale the tiers, unlock absolute medical excellence.
          </motion.p>

          {/* Points Counter - Prestige Glow Implementation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block relative p-[1px] rounded-[3rem] ascension-glow shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
          >
            <div className="bg-[#0a0a0a]/95 rounded-[2.9rem] px-16 py-10 backdrop-blur-3xl flex flex-col items-center relative overflow-hidden">
              <HolographicFoil />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#fec708]/40 to-transparent" />
              
              <span className="text-[10px] font-black text-[#fec708] uppercase tracking-[0.5em] mb-4 opacity-60">Archive Balance</span>
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
                const nextTier = pawPointsRoadmap.find(t => t.points > currentPoints) || pawPointsRoadmap[pawPointsRoadmap.length - 1];
                const prevTier = [...pawPointsRoadmap].reverse().find(t => t.points <= currentPoints) || { points: 0 };
                const progress = Math.min(100, Math.max(0, ((currentPoints - prevTier.points) / (nextTier.points - prevTier.points)) * 100));
                
                return (
                  <div className="mt-10 w-full max-w-[280px]">
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Next: {nextTier.title}</span>
                      <span className="text-[10px] font-black text-[#fec708] uppercase tracking-widest">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className="h-full bg-gradient-to-r from-[#fec708] to-orange-500 shadow-[0_0_15px_rgba(254,199,8,0.5)]"
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Rewards Grid */}
      <section className="px-6 mb-24 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bento-card-premium group"
          >
            <div className="flex items-center gap-6 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                <Gift className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white mb-1">Redeemable Value</h3>
                <p className="text-white/40 font-medium italic text-xs">Available for clinical use</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-lg font-bold text-white/80">Current Value</span>
                <span className="text-2xl font-black text-indigo-400">${(currentPoints / 100).toFixed(2)}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bento-card-premium group"
          >
            <div className="flex items-center gap-6 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-[#fec708]/10 flex items-center justify-center border border-[#fec708]/20 group-hover:scale-110 transition-transform">
                <Clock className="w-8 h-8 text-[#fec708]" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white mb-1">Archive Multiplier</h3>
                <p className="text-white/40 font-medium italic text-xs">Active health streak bonus</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-lg font-bold text-white/80">Earning Rate</span>
                <span className="text-2xl font-black text-[#fec708]">1.5x Boost</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Vertical Prestige Roadmap */}
      <section className="mb-32 max-w-5xl mx-auto px-6 relative">
        <div className="flex flex-col items-center mb-24 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="w-px h-24 bg-gradient-to-b from-[#fec708] to-transparent mb-8"
          />
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-black text-white mb-6 uppercase italic tracking-tighter"
          >
            Ascension <span className="text-[#fec708]">Path</span>
          </motion.h2>
          <p className="text-xl text-white/30 font-medium max-w-xl leading-relaxed">
            From essential care to absolute legendary status. Your journey is recorded in the block.
          </p>
        </div>

        <div className="relative">
          {/* Timeline Line - Animated Gradient */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] hidden md:block overflow-hidden">
            <div className="absolute inset-0 bg-white/5" />
            <motion.div 
              style={{ height: useTransform(scrollY, [1000, 3000], ["0%", "100%"]) }}
              className="absolute top-0 left-0 w-full bg-gradient-to-b from-[#fec708] via-orange-500 to-transparent"
            />
          </div>

          <div className="space-y-24 relative">
            {pawPointsRoadmap.map((tier, index) => {
              const isLocked = currentPoints < tier.points;
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className={`flex flex-col md:flex-row items-center gap-12 ${isEven ? 'md:flex-row-reverse' : ''}`}
                >
                  <div className={`flex-1 w-full ${isEven ? 'md:text-right' : 'md:text-left'}`}>
                    <div className={cn(
                      "p-10 rounded-[3rem] relative overflow-hidden group transition-all duration-700",
                      isLocked 
                        ? 'bg-white/[0.02] border border-white/5 grayscale opacity-60' 
                        : 'liquid-glass-premium border-[#fec708]/20 shadow-[0_40px_80px_rgba(0,0,0,0.4)]'
                    )}>
                      {!isLocked && <HolographicFoil />}
                      <div className={`absolute inset-0 bg-gradient-to-br ${tier.color} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-700`} />
                      
                      <div className={`flex flex-col ${isEven ? 'md:items-end' : 'md:items-start'} gap-6 relative z-10`}>
                        <div className={cn(
                          "inline-flex items-center gap-2 px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]",
                          isLocked ? 'bg-white/5 text-white/30' : 'bg-[#fec708]/10 text-[#fec708]'
                        )}>
                          {isLocked ? (
                            <><Lock className="w-3.5 h-3.5" /> Locked &bull; {tier.points.toLocaleString()} pts</>
                          ) : (
                            <><Sparkles className="w-3.5 h-3.5 animate-pulse" /> Ascension Achieved</>
                          )}
                        </div>
                        
                        <h3 className={cn(
                          "text-4xl md:text-5xl font-black transition-all group-hover:tracking-tight duration-500",
                          isLocked ? 'text-white/20' : 'text-white'
                        )}>
                          {tier.title}
                        </h3>
                        
                        <p className={cn(
                          "text-xl font-medium leading-relaxed max-w-md",
                          isLocked ? 'text-white/10' : 'text-white/50'
                        )}>
                          {tier.description}
                        </p>

                        {!isLocked && (
                          <motion.button
                            onClick={() => handleRedeem(tier)}
                            whileHover={{ scale: 1.05, x: isEven ? -10 : 10 }}
                            whileTap={{ scale: 0.95 }}
                            className="mt-6 flex items-center gap-3 text-[#fec708] font-black text-xs uppercase tracking-[0.3em] group/btn bg-[#fec708]/5 px-6 py-3 rounded-2xl border border-[#fec708]/10 hover:bg-[#fec708] hover:text-black transition-all"
                          >
                            Claim Legacy <ArrowUpRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="relative z-20 shrink-0">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: isEven ? -10 : 10 }}
                      className={cn(
                        "w-24 h-24 rounded-[2rem] flex items-center justify-center border-2 transition-all duration-700 shadow-2xl",
                        isLocked 
                          ? 'bg-[#0d0d0d] border-white/5 text-white/5' 
                          : 'ascension-glow bg-[#0a0a0a] border-[#fec708]/40 text-[#fec708]'
                      )}
                    >
                      {isLocked ? <Lock className="w-10 h-10" /> : tier.icon}
                    </motion.div>
                    
                    {/* Glowing point on line */}
                    <div className={cn(
                      "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full blur-[4px] -z-10 hidden md:block",
                      isLocked ? 'bg-white/10' : 'bg-[#fec708] shadow-[0_0_20px_#fec708]'
                    )} />
                  </div>

                  <div className="flex-1 hidden md:block" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Clinical Marketplace Section */}
      <section className="mb-32 max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
          <div className="max-w-2xl">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="text-5xl md:text-6xl font-black text-white mb-6 uppercase tracking-tighter"
            >
              Clinical <span className="text-[#fec708]">Marketplace</span>
            </motion.h2>
            <p className="text-xl text-white/30 font-medium leading-relaxed">
              Exchange your ascension points for medical-grade products and elite services. Each transaction contributes to your pet's lifelong legacy.
            </p>
          </div>
          <div className="flex gap-4">
            <button className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
              Filter: All Items
            </button>
            <button className="px-8 py-4 rounded-2xl bg-[#fec708] text-black font-black text-xs uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(254,199,8,0.2)]">
              Redeem Credits
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {specialOffers.map((offer, index) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-8 rounded-[2.5rem] liquid-glass-premium border-white/5 relative group overflow-hidden"
            >
              <HolographicFoil />
              <div className="absolute top-6 right-6">
                <span className="px-4 py-1.5 rounded-full bg-[#fec708]/10 text-[#fec708] text-[10px] font-black uppercase tracking-widest border border-[#fec708]/20">
                  {offer.tag}
                </span>
              </div>
              
              <div className="w-16 h-16 rounded-2xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center text-[#fec708] mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-2xl">
                {offer.icon}
              </div>
              
              <h3 className="text-2xl font-black text-white mb-3 tracking-tight">{offer.title}</h3>
              <p className="text-white/40 font-medium mb-8 leading-relaxed line-clamp-2">{offer.description}</p>
              
              <div className="flex items-center justify-between mt-auto pt-8 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-[#fec708]">{offer.points.toLocaleString()}</span>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">PTS</span>
                </div>
                <motion.button
                  onClick={() => handleRedeem(offer)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[#fec708] hover:text-black transition-all group/btn"
                >
                  <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Clinical Inventory Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {clinicalInventory.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="group p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-[#fec708]/30 transition-all duration-500 relative overflow-hidden"
            >
              <div className="aspect-square rounded-2xl overflow-hidden mb-6 relative">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <h4 className="text-lg font-black text-white mb-1 group-hover:text-[#fec708] transition-colors">{item.name}</h4>
              <p className="text-sm text-white/30 font-medium mb-4 line-clamp-1">{item.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Redemption Cost</span>
                  <span className="text-lg font-black text-white">{item.points} <span className="text-[10px] text-[#fec708]">PTS</span></span>
                </div>
                <motion.button
                  onClick={() => handleRedeem({ title: item.name, points: item.points })}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10 border border-white/5"
                >
                  <ShoppingBag className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          ))}
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
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">Vitality Ledger</h2>
                <p className="text-white/30 font-medium text-sm tracking-wide">Historical integrity of your clinical contributions.</p>
              </div>
            </div>
            <button className="text-[10px] font-black text-[#fec708] uppercase tracking-[0.2em] border-b border-[#fec708]/20 pb-1 hover:text-white hover:border-white transition-all">
              Export History
            </button>
          </div>

          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div 
                key={activity.id}
                className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                    activity.type === 'earned' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                  )}>
                    {activity.icon}
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm">{activity.activity}</h4>
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{activity.date}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "text-lg font-black tabular-nums",
                    activity.type === 'earned' ? 'text-emerald-500' : 'text-rose-500'
                  )}>
                    {activity.type === 'earned' ? '+' : ''}{activity.points}
                  </span>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">PTS</span>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-8 py-4 rounded-2xl border border-white/5 text-white/30 font-black text-[10px] uppercase tracking-[0.3em] hover:text-white hover:border-white/20 transition-all">
            Review Full Performance Analytics
          </button>
        </div>
      </section>

      {/* Referral Program - Premium Card */}
      <section className="px-6 mb-32 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden p-12 rounded-[3rem] bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#fec708]/5 blur-[100px] rounded-full -mr-64 -mt-64" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Expand the <span className="text-[#fec708]">Archive</span></h2>
              <p className="text-xl text-white/60 font-medium leading-relaxed mb-8">
                Refer a fellow pet parent. When they join the Planet Animal family, you both receive 2,500 Paw Points instantly.
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="px-8 py-4 rounded-2xl bg-[#fec708] text-black font-black text-sm uppercase tracking-widest shadow-[0_20px_40px_rgba(254,199,8,0.3)] hover:scale-105 active:scale-95 transition-all">
                  Copy Referral Link
                </button>
                <button className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all">
                  Share Now
                </button>
              </div>
            </div>
            <div className="w-full md:w-auto">
              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] flex flex-col items-center shadow-2xl">
                <div className="w-20 h-20 rounded-full bg-[#fec708]/10 flex items-center justify-center mb-4">
                  <Activity className="w-10 h-10 text-[#fec708]" />
                </div>
                <span className="text-white/40 font-bold uppercase tracking-widest text-[10px] mb-1">Your Referrals</span>
                <span className="text-4xl font-black text-white">12</span>
              </div>
            </div>
          </div>
        </motion.div>
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
              
              <h4 className="text-white text-3xl font-black uppercase tracking-tight mb-2">Legacy <span className="text-[#fec708]">Ascended</span></h4>
              <p className="text-white/60 font-medium text-sm leading-relaxed mb-8">
                Your request for <span className="text-white font-bold">"{redeemedReward}"</span> has been authenticated and added to your clinical profile.
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

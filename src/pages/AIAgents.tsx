import { 
  Bot, 
  Sparkles, 
  Shield, 
  Search, 
  Zap, 
  ChevronRight, 
  MessageSquare, 
  Activity, 
  Dna, 
  TrendingUp,
  Brain,
  ZapOff,
  Stethoscope,
  HeartPulse,
  Award,
  Crown,
  ChevronLeft,
  ArrowRight,
  Fingerprint,
  Scissors,
  Target,
  LayoutGrid,
  Clock,
  Terminal,
  Cpu,
  Layers,
  Network,
  Radio,
  Share2,
  Globe,
  Settings,
  Eye,
  Command
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { cn } from '../lib/utils';

// Agent Data Structure
const AGENTS = [
  {
    id: 'sankpawl',
    name: 'Sankpawl',
    role: 'Sovereign Clinical Sentinel',
    description: 'The clinical heartbeat of Planet Animal. Operating under the "Vet-as-a-friend" protocol, Sankpawl provides elite medical guidance with deep empathy. This agent bridges the gap between complex diagnostics and warm, humanized pet care.',
    personality: 'Warm, clinical, and protective. Balances deep empathy with absolute diagnostic precision.',
    avatar: 'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?auto=format&fit=crop&q=80&w=800',
    color: '#fec708',
    glowColor: 'rgba(254, 199, 8, 0.5)',
    specialty: 'Clinical Empathy & Diagnostics',
    stats: { empathy: 99, precision: 97, reliability: 98 },
    modules: [
      { title: 'Heartbeat Monitor', value: 'Optimal', sub: 'Clinical Pulse Active', icon: <HeartPulse className="w-5 h-5" /> },
      { title: 'Medical Guard', value: 'Tier 1', sub: 'Diagnostic Accuracy Alpha', icon: <Stethoscope className="w-5 h-5" /> }
    ],
    logs: [
      "[SYSTEM] Initializing Vet-as-a-friend protocol...",
      "[DATA] Cross-referencing current symptoms with 12M case files.",
      "[ALERT] Optimal wellness window detected for upcoming season."
    ]
  },
  {
    id: 'pawlina',
    name: 'Pawlina',
    role: 'Loyalty & Velocity Aggregator',
    description: 'A hyper-intuitive strategic navigator designed to maximize pet health velocity. Specializes in "Streak Strategies" and loyalty optimization, ensuring every interaction contributes to legendary clinical tiers.',
    personality: 'Value-obsessed, high-velocity, and hyper-intuitive. Focused on growth and reward optimization.',
    avatar: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800',
    color: '#00f2fe',
    glowColor: 'rgba(0, 242, 254, 0.5)',
    specialty: 'Streak & Value Optimization',
    stats: { intuition: 99, velocity: 97, growth: 95 },
    modules: [
      { title: 'Streak Velocity', value: '88%', sub: 'Target: Elite Tier', icon: <Award className="w-5 h-5" /> },
      { title: 'Value Stack', value: '14 Active', sub: 'Aggregated Rewards', icon: <Scissors className="w-5 h-5" /> }
    ],
    logs: [
      "[SYSTEM] Mapping reward velocity for User-772...",
      "[INTEL] Detected 3-month grooming streak opportunity.",
      "[SUCCESS] Optimized 2.5x point multiplier for next visit."
    ]
  },
  {
    id: 'pawl',
    name: 'Pawl',
    role: 'Global Intelligence Researcher',
    description: 'The ultimate knowledge sentinel. Scours the global landscape—cross-referencing viral breed insights from social platforms with academic research to predict and prevent lineage-based health risks.',
    personality: 'Globally informed, analytical, and thorough. Synthesizes cross-platform social intelligence into clinical foresight.',
    avatar: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=800',
    color: '#ff4d4d',
    glowColor: 'rgba(255, 77, 77, 0.5)',
    specialty: 'Global Social Synthesis',
    stats: { research: 98, synthesis: 96, foresight: 94 },
    modules: [
      { title: 'Intelligence Crawler', value: 'Live', sub: 'Real-time Social Scan', icon: <Search className="w-5 h-5" /> },
      { title: 'Lineage Sentinel', value: '360°', sub: 'Predictive Breed Analysis', icon: <Dna className="w-5 h-5" /> }
    ],
    logs: [
      "[NETWORK] Crawling Reddit/YouTube for breed trends...",
      "[RESEARCH] Synthesizing 42k data points on lineage health.",
      "[READY] Personalized preventative roadmap generated."
    ]
  }
];

const HolographicFoil = () => (
  <div className="absolute inset-0 holographic-foil opacity-20 pointer-events-none mix-blend-screen" />
);

const NeuralRing = ({ size, delay, color }: { size: string, delay: number, color: string }) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ 
      scale: [0.8, 1.3, 1.6], 
      opacity: [0, 0.3, 0] 
    }}
    transition={{ 
      duration: 4, 
      repeat: Infinity, 
      delay,
      ease: "easeInOut"
    }}
    className="absolute rounded-full border border-current pointer-events-none"
    style={{ width: size, height: size, color }}
  />
);

const ParticleField = ({ color }: { color: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: any[] = [];
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = color;
      
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [color]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-40" />;
};

export default function AIAgents() {
  const navigate = useNavigate();
  const [activeAgentIndex, setActiveAgentIndex] = useState(() => {
    const saved = localStorage.getItem('planet_animal_active_agent');
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    localStorage.setItem('planet_animal_active_agent', activeAgentIndex.toString());
  }, [activeAgentIndex]);

  const activeAgent = AGENTS[activeAgentIndex];
  const [activeModule, setActiveModule] = useState(0);
  const [showLogs, setShowLogs] = useState(false);
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);

  return (
    <div className="min-h-screen w-full flex flex-col pb-32 overflow-x-hidden relative bg-[#050505] text-white selection:bg-[#fec708] selection:text-black font-display tracking-tight">
      {/* Background System - ULTRA PREMIUM */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02),transparent)]" />
        <div className="absolute inset-0 neural-mesh-grid opacity-[0.03]" />
        <ParticleField color={activeAgent.color} />
        
        {/* Floating background orbs with dynamic color transitions */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeAgent.id + '_glow_1'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] rounded-full blur-[180px] animate-blob"
            style={{ backgroundColor: activeAgent.color }}
          />
          <motion.div 
            key={activeAgent.id + '_glow_2'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] animate-blob animation-delay-4000"
            style={{ backgroundColor: activeAgent.color }}
          />
        </AnimatePresence>
      </div>

      {/* Global Navigation Bar */}
      <header className="fixed top-0 left-0 w-full px-8 py-8 z-[100] flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto">
          <motion.button 
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)} 
            className="w-14 h-14 rounded-2xl liquid-glass-premium border-white/5 flex items-center justify-center group shadow-2xl backdrop-blur-2xl"
          >
            <ChevronLeft size={24} className="group-hover:text-[#fec708] transition-colors" />
          </motion.button>
        </div>
        
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-3 px-6 py-3 rounded-full bg-black/40 border border-white/5 backdrop-blur-3xl shadow-2xl"
          >
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#fec708] animate-pulse" />
              <h1 className="font-heading font-black text-xs uppercase italic tracking-[0.3em]">AETHER <span className="text-[#fec708]">COGNITION</span></h1>
            </div>
            <div className="w-px h-4 bg-white/10 mx-2" />
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#fec708] animate-ping" />
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Core Active</span>
            </div>
          </motion.div>
        </div>

        <div className="flex items-center gap-4 pointer-events-auto">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            className="w-14 h-14 rounded-2xl liquid-glass-premium border-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all shadow-2xl backdrop-blur-2xl"
          >
            <Settings size={22} />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            onClick={() => setShowLogs(!showLogs)}
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-all border shadow-2xl backdrop-blur-2xl",
              showLogs ? "bg-[#fec708] border-[#fec708] text-black" : "bg-white/5 border-white/5 text-white/40"
            )}
          >
            <Terminal size={22} />
          </motion.button>
        </div>
      </header>

      <main className="flex-1 px-8 pt-40 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Section Hero - SLEEK & AGGRESSIVE */}
          <div className="relative mb-32">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
              <div className="max-w-2xl">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#fec708]/10 border border-[#fec708]/20 mb-8"
                >
                  <Network className="w-3 h-3 text-[#fec708]" />
                  <span className="text-[10px] font-black tracking-[0.4em] uppercase text-[#fec708]">NEURAL SENTINEL INTERFACE v2.0</span>
                </motion.div>
                
                <motion.h2 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.8] mb-8 uppercase italic"
                >
                  THE <span className="text-[#fec708] drop-shadow-[0_0_50px_rgba(254,199,8,0.4)]">AETHER</span> <br />
                  <span className="text-white/20">SENTINELS</span>
                </motion.h2>
              </div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="lg:mb-4 max-w-xs"
              >
                <p className="text-white/40 font-bold text-[11px] uppercase tracking-[0.4em] leading-loose">
                  Select your specialized cognitive unit to begin deep-state synchronization and predictive pet analysis.
                </p>
              </motion.div>
            </div>
          </div>

          {/* CENTRAL STAGE - THE HEART OF THE UI */}
          <div className="relative mb-40 min-h-[700px] flex items-center justify-center">
            {/* Massive Background Glow */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
               <div className="w-[800px] h-[800px] rounded-full blur-[200px] opacity-10" style={{ background: activeAgent.color }} />
               <NeuralRing size="400px" delay={0} color={activeAgent.color} />
               <NeuralRing size="600px" delay={1.5} color={activeAgent.color} />
               <NeuralRing size="800px" delay={3} color={activeAgent.color} />
            </div>

            {/* The Main Agent Hub */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeAgent.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.1, y: -20 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-96 h-96 md:w-[600px] md:h-[600px] flex items-center justify-center"
              >
                {/* Floating Intelligence Tag */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 px-6 py-3 rounded-full bg-black/80 border border-[#fec708]/30 backdrop-blur-2xl shadow-2xl"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#fec708] animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#fec708]">
                      {activeAgent.id === 'pawl' ? 'Global Knowledge Synthesis' : 
                       activeAgent.id === 'pawlina' ? 'Value Velocity Mapping' :
                       'Clinical Sentiment Stream'}
                    </span>
                  </motion.div>
                </div>

                {/* The Core Visual Cluster */}
                <div className="relative w-full h-full p-12 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-sm shadow-[inset_0_0_100px_rgba(255,255,255,0.02)]">
                  {/* Rotating Mechanical Rings */}
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-4 border border-dashed border-white/10 rounded-full"
                  />
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-12 border border-dotted border-white/5 rounded-full"
                  />
                  
                  {/* The Inner Image Orb - ULTRA STYLIZED */}
                  <div className="w-full h-full rounded-full p-[4px] overflow-hidden liquid-glass-premium shadow-[0_0_150px_rgba(0,0,0,0.9)] relative group">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-3xl z-10" />
                    <motion.img 
                      initial={{ scale: 1.3, filter: 'grayscale(100%)' }}
                      animate={{ scale: 1, filter: 'grayscale(100%) brightness(0.6)' }}
                      src={activeAgent.avatar} 
                      alt={activeAgent.name}
                      className="w-full h-full object-cover mix-blend-luminosity opacity-40 group-hover:scale-110 transition-transform duration-[4000ms]"
                    />
                    
                    {/* Pulsing Core Color Gradient */}
                    <motion.div 
                      animate={{ opacity: [0.4, 0.7, 0.4] }}
                      transition={{ duration: 5, repeat: Infinity }}
                      className="absolute inset-0 z-20 mix-blend-overlay"
                      style={{ background: `radial-gradient(circle at center, ${activeAgent.color} 0%, transparent 70%)` }}
                    />
                    <HolographicFoil />
                    
                    {/* Centered Identity */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-30 p-12 text-center">
                       <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 0.15, scale: 1 }}
                        className="mb-8"
                       >
                         <Brain className="w-48 h-48 text-white" />
                       </motion.div>
                       <h3 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter mb-4 drop-shadow-2xl">
                         {activeAgent.name}
                       </h3>
                       <div className="flex items-center gap-3">
                         <div className="h-px w-8 bg-[#fec708]/40" />
                         <span className="text-[10px] font-black text-[#fec708] uppercase tracking-[0.5em]">{activeAgent.role}</span>
                         <div className="h-px w-8 bg-[#fec708]/40" />
                       </div>
                    </div>
                  </div>
                </div>

                {/* SATELLITE MODULES - FLOATING AROUND CORE */}
                <div className="absolute -inset-16 md:-inset-32 flex items-center justify-center pointer-events-none">
                  {activeAgent.modules.map((mod, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        x: i === 0 ? -380 : 380,
                        y: i === 0 ? -60 : 60,
                      }}
                      transition={{ delay: 0.6 + (i * 0.3), type: "spring", stiffness: 80, damping: 15 }}
                      className="absolute hidden xl:block pointer-events-auto"
                    >
                      <button 
                        onMouseEnter={() => setActiveModule(i)}
                        className={cn(
                          "p-8 rounded-[3.5rem] liquid-glass-premium border-white/5 w-80 shadow-2xl group text-left transition-all duration-700 backdrop-blur-3xl overflow-hidden",
                          activeModule === i ? "border-[#fec708]/40 shadow-[0_0_80px_rgba(254,199,8,0.2)] scale-105" : "opacity-30 grayscale-[0.8] hover:opacity-100 hover:grayscale-0"
                        )}
                      >
                        <HolographicFoil />
                        <div className="relative z-10 flex flex-col gap-6">
                          <div className="flex items-center justify-between">
                            <div 
                              className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-all shadow-inner"
                              style={{ backgroundColor: `${activeAgent.color}20`, color: activeAgent.color }}
                            >
                              {mod.icon}
                            </div>
                            <div className={cn("w-2 h-2 rounded-full", activeModule === i ? "bg-[#fec708] shadow-[0_0_10px_#fec708]" : "bg-white/10")} />
                          </div>
                          
                          <div>
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] leading-none mb-2 block">
                              {mod.title}
                            </span>
                            <h4 className="text-3xl font-black text-white italic tracking-tighter">
                              {mod.value}
                            </h4>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-2">
                              {mod.sub}
                            </p>
                          </div>
                          
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: activeModule === i ? "100%" : "30%" }}
                              className="h-full bg-current transition-all duration-1000"
                              style={{ color: activeAgent.color }}
                            />
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* THE SELECTION DOCK - PREMIUM SLIDER */}
          <div className="flex flex-col items-center mb-40 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-12">
               <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.8em]">Select Intelligence Unit</h3>
            </div>
            
            <div className="flex items-center gap-8 p-6 rounded-[4rem] liquid-glass-premium border-white/5 shadow-2xl backdrop-blur-3xl relative">
              <div className="absolute inset-0 bg-white/[0.01] rounded-[4rem] pointer-events-none" />
              {AGENTS.map((agent, index) => (
                <motion.button
                  key={agent.id}
                  onClick={() => setActiveAgentIndex(index)}
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "relative group p-8 rounded-[3rem] transition-all duration-700 flex flex-col items-center gap-4 w-48 md:w-64",
                    activeAgentIndex === index 
                      ? "bg-white/[0.05] shadow-2xl" 
                      : "opacity-20 hover:opacity-50 grayscale hover:grayscale-0"
                  )}
                >
                  {activeAgentIndex === index && (
                    <motion.div 
                      layoutId="dock-highlight"
                      className="absolute inset-0 rounded-[3rem] border border-[#fec708]/30 shadow-[inset_0_0_30px_rgba(254,199,8,0.1)]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:-rotate-12"
                    style={{ 
                      backgroundColor: activeAgentIndex === index ? `${agent.color}20` : 'transparent',
                      color: agent.color,
                      border: activeAgentIndex === index ? `1px solid ${agent.color}40` : '1px solid rgba(255,255,255,0.05)'
                    }}
                  >
                    {agent.id === 'sankpawl' ? <Bot size={32} /> : agent.id === 'pawlina' ? <Zap size={32} /> : <Search size={32} />}
                  </div>
                  
                  <div className="text-center">
                    <h4 className={cn(
                      "text-lg font-black uppercase italic tracking-tighter mb-1",
                      activeAgentIndex === index ? "text-white" : "text-white/40"
                    )}>{agent.name}</h4>
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">{agent.role.split(' ')[0]} AGENT</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* DEEP INTEL SECTION - GRID LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-40">
            {/* LEFT: ARCHITECTURE & STATS */}
            <div className="lg:col-span-5 space-y-12">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="liquid-glass-premium p-12 rounded-[4rem] border-white/5 relative overflow-hidden"
              >
                <HolographicFoil />
                <div className="relative z-10">
                  <div className="flex items-center gap-6 mb-12">
                    <div 
                      className="w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl"
                      style={{ backgroundColor: `${activeAgent.color}15`, color: activeAgent.color }}
                    >
                      <Target className="w-10 h-10" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-[#fec708] uppercase tracking-[0.4em] mb-2 block">Sentinel Specs</span>
                      <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter">COGNITION</h2>
                    </div>
                  </div>

                  <p className="text-xl text-white/60 font-medium leading-relaxed mb-12 italic border-l-4 border-[#fec708]/40 pl-8">
                    "{activeAgent.personality}"
                  </p>

                  <div className="space-y-10">
                    {Object.entries(activeAgent.stats).map(([label, val]) => (
                      <div 
                        key={label} 
                        className="space-y-4"
                        onMouseEnter={() => setHoveredStat(label)}
                        onMouseLeave={() => setHoveredStat(null)}
                      >
                        <div className="flex justify-between items-end">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-1">Architecture</span>
                            <span className="text-sm font-black uppercase italic tracking-widest text-white/80">{label} SYNERGY</span>
                          </div>
                          <span className="text-2xl font-black italic text-[#fec708]">{val}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden p-[2px] backdrop-blur-xl">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${val}%` }}
                            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full rounded-full relative"
                            style={{ background: `linear-gradient(90deg, transparent, ${activeAgent.color})` }}
                          >
                            <motion.div 
                              animate={{ opacity: [0.3, 0.6, 0.3] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="absolute inset-0 bg-white/20"
                            />
                          </motion.div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* DYNAMIC TELEMETRY CARD */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="p-12 rounded-[4rem] bg-white/[0.02] border border-white/5 relative overflow-hidden group shadow-2xl"
              >
                <div className="absolute top-0 right-0 p-12 opacity-5">
                   <Activity className="w-32 h-32 text-white" />
                </div>
                <div className="relative z-10">
                   <div className="flex items-center gap-4 mb-8">
                     <div className="w-10 h-10 rounded-xl bg-[#fec708]/10 flex items-center justify-center">
                       <Activity className="w-5 h-5 text-[#fec708]" />
                     </div>
                     <h4 className="text-[#fec708] font-black text-[10px] uppercase tracking-[0.5em]">System Forensics</h4>
                   </div>
                   <h5 className="text-3xl font-black text-white mb-6 uppercase italic tracking-tighter">
                     {activeAgent.id === 'pawlina' ? 'REWARD TRAJECTORY' : 
                      activeAgent.id === 'pawl' ? 'NETWORK HARVEST' : 'SENTIMENT ANALYSIS'}
                   </h5>
                   <p className="text-white/40 text-base leading-relaxed mb-10 font-medium italic">
                     "{activeAgent.logs[1].replace('[DATA] ', '').replace('[INTEL] ', '').replace('[RESEARCH] ', '')}"
                   </p>
                   <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-8">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Global Sync</span>
                        <p className="text-white font-black text-xs">100% Verified</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Cognitive Load</span>
                        <p className="text-[#fec708] font-black text-xs">Nominal (12%)</p>
                      </div>
                   </div>
                </div>
              </motion.div>
            </div>

            {/* RIGHT: COMMAND CENTER */}
            <div className="lg:col-span-7">
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="liquid-glass-premium p-12 md:p-16 rounded-[5rem] border-white/5 h-full flex flex-col relative shadow-[0_50px_100px_rgba(0,0,0,0.5)]"
              >
                <HolographicFoil />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-20">
                    <div>
                      <h3 className="text-6xl font-black text-white uppercase italic tracking-tighter mb-4 leading-none">COMMAND<br /><span className="text-white/20">CENTER</span></h3>
                      <p className="text-white/30 font-bold text-[10px] uppercase tracking-[0.5em]">Satellite Operation Hub</p>
                    </div>
                    <div className="flex items-center gap-4 px-6 py-4 rounded-3xl bg-[#fec708]/5 text-[#fec708] border border-[#fec708]/20 backdrop-blur-3xl shadow-xl">
                      <div className="w-2 h-2 rounded-full bg-[#fec708] animate-pulse shadow-[0_0_10px_#fec708]" />
                      <span className="text-xs font-black uppercase tracking-[0.3em]">Operational</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-20">
                    {activeAgent.modules.map((mod, i) => (
                      <motion.button 
                        key={i} 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveModule(i)}
                        className={cn(
                          "p-12 rounded-[4rem] border transition-all duration-500 text-left relative overflow-hidden group",
                          activeModule === i 
                            ? "bg-[#fec708]/10 border-[#fec708]/40 shadow-2xl" 
                            : "bg-black/30 border-white/5 hover:border-white/10"
                        )}
                      >
                        <div className={cn(
                          "w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-10 group-hover:rotate-6 transition-all shadow-inner",
                          activeModule === i ? "text-[#fec708]" : "text-white/20"
                        )}>
                          {mod.icon}
                        </div>
                        <h4 className="text-white font-black text-3xl mb-3 uppercase tracking-tight italic">{mod.title}</h4>
                        <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.3em] mb-8">{mod.sub}</p>
                        <div className={cn(
                          "text-5xl font-black italic tracking-tighter",
                          activeModule === i ? "text-[#fec708]" : "text-white/40"
                        )}>{mod.value}</div>
                        
                        {activeModule === i && (
                          <motion.div 
                            layoutId="module-ring"
                            className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full border-4 border-[#fec708]/10 pointer-events-none"
                          />
                        )}
                      </motion.button>
                    ))}
                  </div>

                  <div className="mt-auto flex flex-col gap-8">
                    <motion.button 
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-10 rounded-[3rem] bg-[#fec708] text-black font-black uppercase tracking-[0.3em] text-sm shadow-[0_30px_80px_rgba(254,199,8,0.3)] hover:shadow-[0_40px_100px_rgba(254,199,8,0.4)] transition-all flex items-center justify-center gap-6 group relative overflow-hidden"
                    >
                      <HolographicFoil />
                      <span className="relative z-10">INITIALIZE DEEP SYNC</span>
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform relative z-10" />
                    </motion.button>
                    
                    <div className="flex flex-col md:flex-row gap-6">
                      <motion.button 
                        whileHover={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                        className="flex-1 py-7 rounded-[2.5rem] bg-white/[0.03] border border-white/5 text-white/60 font-black uppercase tracking-[0.3em] text-[10px] transition-all backdrop-blur-xl flex items-center justify-center gap-3"
                      >
                        <Share2 size={16} /> EXPORT DATASET
                      </motion.button>
                      <motion.button 
                        whileHover={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                        className="flex-1 py-7 rounded-[2.5rem] bg-white/[0.03] border border-white/5 text-white/60 font-black uppercase tracking-[0.3em] text-[10px] transition-all backdrop-blur-xl flex items-center justify-center gap-3"
                      >
                        <Shield size={16} /> SECURITY AUDIT
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* INTELLIGENCE LOGS - ULTRA MODERN TERMINAL */}
      <AnimatePresence>
        {showLogs && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogs(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[150]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full md:w-[600px] z-[200] p-6 md:p-10"
            >
              <div className="w-full h-full liquid-glass-premium rounded-[4rem] border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col overflow-hidden relative">
                <HolographicFoil />
                <div className="p-12 flex flex-col h-full relative z-10">
                  <div className="flex items-center justify-between mb-16">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-3xl bg-[#fec708]/10 flex items-center justify-center text-[#fec708] border border-[#fec708]/20 shadow-xl">
                        <Terminal size={32} />
                      </div>
                      <div>
                        <h3 className="text-4xl font-black uppercase italic tracking-tighter">TELEMETRY</h3>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em]">Sentinel Intelligence Feed</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowLogs(false)}
                      className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white border border-white/5"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>

                  <div className="flex-1 bg-black/40 rounded-[3rem] p-10 font-mono text-[11px] overflow-y-auto custom-scrollbar border border-white/5 shadow-inner">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 text-[#fec708] mb-8">
                         <div className="w-1.5 h-1.5 rounded-full bg-[#fec708] animate-pulse" />
                         <span className="uppercase font-black tracking-widest">Secure Connection Established</span>
                      </div>
                      {activeAgent.logs.map((log, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex gap-6 items-start leading-relaxed"
                        >
                          <span className="text-white/20 whitespace-nowrap">0{i + 1} //</span>
                          <span className={cn(
                            "tracking-tight",
                            log.includes('[ALERT]') ? 'text-red-400' : 
                            log.includes('[SUCCESS]') ? 'text-green-400' : 
                            log.includes('[INTEL]') ? 'text-blue-400' : 'text-white/60'
                          )}>{log}</span>
                        </motion.div>
                      ))}
                      <div className="flex gap-6 items-start animate-pulse">
                        <span className="text-white/20 whitespace-nowrap">04 //</span>
                        <span className="text-[#fec708] tracking-widest uppercase font-black">Syncing next intelligence packet...</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-12 flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-white/20 px-4">
                     <Globe className="w-3 h-3" />
                     <span>Protocol: AES-256 Cloud Sync</span>
                     <div className="w-1 h-1 rounded-full bg-white/10 mx-auto" />
                     <span>Node: PA-CENTRAL-01</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FLOATING ACTION BAR - STICKY PREVIEW */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-5xl px-8 z-[100]">
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, type: "spring", stiffness: 100 }}
          className="flex items-center justify-between p-6 rounded-[3.5rem] liquid-glass-premium border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl overflow-hidden relative group"
        >
          <HolographicFoil />
          <div className="flex items-center gap-6 relative z-10">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
                <img src={activeAgent.avatar} alt="" className="w-full h-full object-cover grayscale brightness-75" />
                <div className="absolute inset-0 bg-[#fec708]/10" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#050505] flex items-center justify-center border border-white/10">
                <div className="w-2 h-2 rounded-full bg-[#fec708] animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">{activeAgent.name}</h4>
                <div className="px-2 py-0.5 rounded-md bg-[#fec708]/10 border border-[#fec708]/20">
                  <span className="text-[8px] font-black text-[#fec708] uppercase tracking-widest">Elite</span>
                </div>
              </div>
              <p className="text-[10px] font-black text-[#fec708] uppercase tracking-[0.5em] opacity-80">Sentinel Synchronization: ACTIVE</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 relative z-10">
            <motion.button 
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.08)' }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowLogs(!showLogs)}
              className="w-16 h-16 rounded-[1.75rem] bg-white/5 flex items-center justify-center text-white/40 hover:text-[#fec708] transition-all border border-white/5 group/btn"
            >
              <Terminal size={24} className="group-hover/btn:rotate-12 transition-transform" />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
              className="px-12 py-5 rounded-[1.75rem] bg-[#fec708] text-black font-black text-xs uppercase tracking-[0.3em] flex items-center gap-4 hover:shadow-[0_0_40px_rgba(254,199,8,0.4)] transition-all shadow-xl"
            >
              ENGAGE <Sparkles size={18} />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

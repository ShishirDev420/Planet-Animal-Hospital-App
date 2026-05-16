import React from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, Gift, Sparkles, Star, Zap, ChevronRight } from "lucide-react";

interface LayerProps {
  title: string;
  points: number;
  gradient: string;
  icon: React.ReactNode;
  isActive: boolean;
  isCompleted: boolean;
  onClick?: () => void;
  delay?: number;
}

function LayerCard({ title, points, gradient, icon, isActive, isCompleted, onClick, delay = 0 }: LayerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay * 0.1, type: "spring", stiffness: 200, damping: 25 }}
      whileHover={{ y: -5, scale: 1.03 }}
      onClick={onClick}
      className={`relative cursor-pointer rounded-[2.5rem] p-8 overflow-hidden transition-all duration-700 group ${
        isActive ? "border-[#fec708]/50 shadow-[0_30px_70px_rgba(254,199,8,0.2)]" : 
        isCompleted ? "border-[#fec708]/30" : "border-white/5 opacity-60 grayscale-[0.5]"
      }`}
    >
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 transition-all duration-700 ${
          isActive ? "bg-[#fec708] text-black shadow-2xl" : "bg-white/5 text-white/20 border border-white/10"
        }`}>
          {isActive ? <Crown className="w-10 h-10" /> : icon}
        </div>
        <h4 className={`font-heading font-black text-2xl tracking-tight uppercase italic leading-none mb-4 ${
          isActive ? "text-white" : "text-white/30"
        }`}>{title}</h4>
        <div className="flex items-baseline gap-1">
          <span className={`font-heading font-black text-4xl tracking-tighter ${isActive ? "text-[#fec708]" : "text-white/20"}`}>
            {points.toLocaleString()}
          </span>
          <span className={`text-[10px] font-black uppercase ${isActive ? "text-[#fec708]/60" : "text-white/10"}`}>PTS</span>
        </div>
      </div>
    </motion.div>
  );
}

interface PawPointsLayeredProps {
  currentPoints: number;
  onLayerClick?: (points: number) => void;
}

export default function PawPointsLayered({ currentPoints, onLayerClick }: PawPointsLayeredProps) {
  const layers = [
    { id: 1, title: "Starter", points: 500, gradient: "rgba(254,199,8,0.5)", icon: <Gift className="w-10 h-10" />, isCompleted: currentPoints >= 500 },
    { id: 2, title: "Level 1", points: 1500, gradient: "rgba(232,188,75,0.5)", icon: <Sparkles className="w-10 h-10" />, isCompleted: currentPoints >= 1500 },
    { id: 3, title: "Level 2", points: 3000, gradient: "rgba(254,199,8,0.7)", icon: <Star className="w-10 h-10" />, isCompleted: currentPoints >= 3000 },
    { id: 4, title: "Milestone", points: 5000, gradient: "rgba(254,199,8,0.9)", icon: <Trophy className="w-10 h-10" />, isCompleted: currentPoints >= 5000 },
  ];

  const activeIndex = layers.findIndex(layer => !layer.isCompleted);
  const isActive = (index: number) => index === activeIndex;

  return (
    <section className="relative px-6 mb-16 z-10">
      <div className="px-8 mb-8">
        <h3 className="cinematic-kicker mb-2 text-sm">Paw Points Journey</h3>
        <h3 className="cinematic-title text-4xl uppercase italic">Layers & Milestones</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {layers.map((layer, index) => (
          <LayerCard key={layer.id} {...layer} isActive={isActive(index)} delay={index} onClick={() => onLayerClick?.(layer.points)} />
        ))}
      </div>
    </section>
  );
}

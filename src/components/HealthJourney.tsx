import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Clock, Sparkles, Shield, Heart, Zap, ChevronDown, ChevronUp, ExternalLink, Info, Lock } from 'lucide-react';

export interface Task {
  id: string;
  text: string;
  rationale: string;
  completed: boolean;
}

export interface Stage {
  id: string;
  title: string;
  tasks: Task[];
  isUnlocked: boolean;
}

interface HealthJourneyProps {
  stages: Stage[];
  onToggleTask: (stageId: string, taskId: string) => void;
  petName: string;
}

const Celebration = ({ color = "#fec708" }: { color?: string }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0, x: "50%", y: "50%" }}
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0, 1.2, 0.5],
            x: `${50 + (Math.random() - 0.5) * 100}%`,
            y: `${50 + (Math.random() - 0.5) * 100}%`,
            rotate: Math.random() * 360
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
};

export default function HealthJourney({ stages, onToggleTask, petName }: HealthJourneyProps) {
  const [expandedStage, setExpandedStage] = React.useState<string | null>(stages[0]?.id || null);
  const [lastCompletedTask, setLastCompletedTask] = useState<string | null>(null);

  const calculateProgress = () => {
    const totalTasks = stages.reduce((acc, stage) => acc + stage.tasks.length, 0);
    const completedTasks = stages.reduce((acc, stage) => acc + stage.tasks.filter(t => t.completed).length, 0);
    return totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  };

  const progress = calculateProgress();

  const handleTaskToggle = (stageId: string, taskId: string, isNowCompleted: boolean) => {
    if (isNowCompleted) {
      setLastCompletedTask(taskId);
      setTimeout(() => setLastCompletedTask(null), 1000);
    }
    onToggleTask(stageId, taskId);
  };

  return (
    <div className="w-full space-y-10 relative">
      {/* Neural Grid Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none opacity-20 dark:opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(#fec708_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* Progress Header - Premium Glassmorphism */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-10 rounded-[3rem] bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-3xl overflow-hidden group shadow-2xl shadow-black/40"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-1000">
          <Sparkles className="w-32 h-32 text-[#fec708]" />
        </div>
        
        {/* Animated Background Glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#fec708]/10 rounded-full blur-[100px] animate-pulse" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-[#fec708]" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#fec708]/80">Longevity Protocol v4.7</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-heading font-black tracking-tighter uppercase italic leading-none text-white drop-shadow-2xl">
              {petName}'s <span className="text-[#fec708] relative">
                Journey
                <motion.span 
                  className="absolute -bottom-2 left-0 h-1 bg-[#fec708]"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </span>
            </h2>
          </div>
          
          <div className="flex items-center gap-6 bg-white/[0.03] p-6 rounded-3xl border border-white/5">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Biological Edge</p>
              <p className="text-5xl font-heading font-black text-[#fec708] tracking-tighter tabular-nums">{progress}%</p>
            </div>
            <div className="w-24 h-24 rounded-full border-4 border-white/5 flex items-center justify-center relative shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  className="text-white/5"
                />
                <motion.circle
                  cx="48"
                  cy="48"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray="263.9"
                  initial={{ strokeDashoffset: 263.9 }}
                  animate={{ strokeDashoffset: 263.9 - (263.9 * progress) / 100 }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                  strokeLinecap="round"
                  className="text-[#fec708] drop-shadow-[0_0_8px_rgba(254,199,8,0.5)]"
                />
              </svg>
              <Zap className="absolute w-8 h-8 text-[#fec708] animate-pulse" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stages List */}
      <div className="relative space-y-6">
        {/* Dynamic Glowing Path */}
        <div className="absolute left-[39px] top-12 bottom-12 w-[4px] bg-white/[0.03] rounded-full overflow-hidden">
          <motion.div 
            className="w-full bg-gradient-to-b from-[#fec708] via-[#fec708] to-transparent shadow-[0_0_25px_rgba(254,199,8,0.8)]"
            initial={{ height: 0 }}
            animate={{ height: `${progress}%` }}
            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          />
          {/* Moving Energy Pulse */}
          <motion.div
            className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-transparent via-white/40 to-transparent"
            animate={{ 
              top: ['-20%', '120%'],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          />
        </div>

      {/* Stage Cards */}
      <div className="space-y-12 pb-12">
        {stages.map((stage, sIdx) => {
          const isCompleted = stage.tasks.length > 0 && stage.tasks.every(t => t.completed);
          
          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: sIdx * 0.1 }}
              className={`relative group ${!stage.isUnlocked ? 'opacity-40 grayscale-[0.5]' : ''}`}
            >
              {/* Stage Marker - Planet Style */}
              <motion.div 
                whileHover={stage.isUnlocked ? { scale: 1.15, rotate: 0 } : {}}
                className={`absolute left-0 top-0 w-20 h-20 rounded-2xl flex items-center justify-center z-20 transition-all duration-700 border-2 ${
                  isCompleted
                    ? 'bg-[#fec708] text-black border-[#fec708] shadow-[0_0_60px_rgba(254,199,8,0.8),inset_0_0_20px_rgba(255,255,255,0.4)] rotate-0'
                    : stage.isUnlocked 
                      ? 'bg-white/10 text-[#fec708] border-[#fec708]/50 shadow-[0_0_30px_rgba(254,199,8,0.3)] rotate-0' 
                      : 'bg-black/40 text-white/20 border-white/10 rotate-12'
                }`}
              >
                {isCompleted ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <CheckCircle2 className="w-10 h-10" />
                  </motion.div>
                ) : stage.isUnlocked ? (
                  <span className="text-3xl font-black italic tracking-tighter">{sIdx + 1}</span>
                ) : (
                  <Lock className="w-8 h-8 opacity-50" />
                )}
                {/* Orbital Ring for Unlocked/Active Stage */}
                {stage.isUnlocked && !isCompleted && (
                  <motion.div 
                    className="absolute -inset-2 border border-[#fec708]/30 rounded-[1.5rem] pointer-events-none"
                    animate={{ rotate: 360, opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </motion.div>

              {/* Stage Content */}
              <div className="ml-28">
                <motion.div 
                  onClick={() => stage.isUnlocked && setExpandedStage(expandedStage === stage.id ? null : stage.id)}
                  className={`group/card p-8 rounded-[2.5rem] border transition-all duration-700 cursor-pointer overflow-hidden relative ${
                    isCompleted
                      ? 'bg-gradient-to-br from-[#fec708]/10 to-transparent border-[#fec708]/30 shadow-[0_0_30px_rgba(254,199,8,0.1)]'
                      : expandedStage === stage.id 
                        ? 'bg-white/[0.07] border-[#fec708]/40 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]' 
                        : 'bg-white/[0.02] border-white/5 hover:border-[#fec708]/30 hover:bg-white/[0.04]'
                  }`}
                >
                  {/* Subtle Background Glow for Completed/Active Stage */}
                  <AnimatePresence>
                    {(expandedStage === stage.id || isCompleted) && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`absolute top-0 right-0 w-64 h-64 blur-[80px] -mr-32 -mt-32 pointer-events-none ${
                          isCompleted ? 'bg-[#fec708]/15' : 'bg-[#fec708]/5'
                        }`}
                      />
                    )}
                  </AnimatePresence>

                <div className="flex items-center justify-between relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className={`font-heading font-black text-2xl uppercase tracking-tighter italic ${stage.isUnlocked ? 'text-white' : 'text-white/30'}`}>
                        {stage.title}
                      </h3>
                      {stage.tasks.every(t => t.completed) && stage.isUnlocked && (
                        <span className="flex items-center gap-1 bg-[#fec708]/20 text-[#fec708] px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-[#fec708]/30">
                          <CheckCircle2 size={10} /> Optimized
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-white/30 tracking-widest uppercase">
                      <span className="text-[#fec708]">{stage.tasks.filter(t => t.completed).length}</span> / {stage.tasks.length} Biological Markers
                    </p>
                  </div>
                  <div className={`p-2 rounded-full transition-colors ${expandedStage === stage.id ? 'bg-[#fec708]/10 text-[#fec708]' : 'text-white/20'}`}>
                    {expandedStage === stage.id ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedStage === stage.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pt-8 space-y-5">
                        {stage.tasks.map((task) => (
                          <motion.div 
                            key={task.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskToggle(stage.id, task.id, !task.completed);
                            }}
                            className={`group/task relative p-5 rounded-2xl border transition-all duration-500 overflow-hidden ${
                              task.completed 
                                ? 'bg-white/[0.03] border-white/5 opacity-60' 
                                : 'bg-white/[0.08] border-white/10 hover:border-[#fec708]/40 hover:bg-white/[0.12] hover:shadow-xl'
                            }`}
                          >
                            {lastCompletedTask === task.id && <Celebration />}
                            
                            <div className="flex gap-5">
                              <div className={`mt-1 flex-shrink-0 transition-all duration-500 ${task.completed ? 'text-[#fec708]' : 'text-white/20 group-hover/task:text-white/40'}`}>
                                {task.completed ? <CheckCircle2 className="w-7 h-7 drop-shadow-[0_0_8px_rgba(254,199,8,0.5)]" /> : <Circle className="w-7 h-7" />}
                              </div>
                              <div className="space-y-3 flex-1">
                                <div className="flex justify-between items-start">
                                  <h4 className={`font-black text-base tracking-tight uppercase italic ${task.completed ? 'text-white/30 line-through' : 'text-white'}`}>
                                    {task.text}
                                  </h4>
                                  {!task.completed && (
                                    <div className="bg-[#fec708]/10 p-1.5 rounded-lg opacity-0 group-hover/task:opacity-100 transition-opacity">
                                      <Zap size={14} className="text-[#fec708]" />
                                    </div>
                                  )}
                                </div>
                                
                                {task.rationale && (
                                  <div className={`p-4 rounded-xl border transition-all ${task.completed ? 'bg-black/20 border-white/5' : 'bg-black/40 border-white/10'}`}>
                                    <div className="flex items-start gap-2 mb-2">
                                      <Info className="w-3 h-3 text-[#fec708] mt-0.5" />
                                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#fec708]">Scientific Rationale</span>
                                    </div>
                                    <p className="text-xs text-white/50 leading-relaxed font-medium">
                                      {task.rationale}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>
        );
      })}
      </div>
    </div>
  </div>
);
}


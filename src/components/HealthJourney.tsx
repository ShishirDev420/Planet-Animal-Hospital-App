import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Shield, Zap, ChevronDown, Info, Lock, CalendarDays } from 'lucide-react';

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

const splitTaskText = (text: string) => {
  const separatorIndex = text.indexOf(':');
  if (separatorIndex === -1) return { title: text.trim(), description: '' };

  return {
    title: text.slice(0, separatorIndex).trim(),
    description: text.slice(separatorIndex + 1).trim(),
  };
};

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
  const totalTasks = stages.reduce((acc, stage) => acc + stage.tasks.length, 0);
  const completedTasks = stages.reduce((acc, stage) => acc + stage.tasks.filter(t => t.completed).length, 0);
  const currentStage = stages.find((stage) => stage.isUnlocked && stage.tasks.some((task) => !task.completed)) || stages.find((stage) => stage.isUnlocked) || stages[0];
  const nextActionStage = stages.find((stage) => stage.isUnlocked && stage.tasks.some((task) => !task.completed));
  const nextAction = nextActionStage?.tasks.find((task) => !task.completed);
  const nextActionText = nextAction ? splitTaskText(nextAction.text) : null;

  const handleTaskToggle = (stageId: string, taskId: string, isNowCompleted: boolean) => {
    if (isNowCompleted) {
      setLastCompletedTask(taskId);
      setTimeout(() => setLastCompletedTask(null), 1000);
    }
    onToggleTask(stageId, taskId);
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8 relative">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border border-[#fec708]/20 bg-[#0c1712]/95 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.38)] sm:p-8"
      >
        <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#fec708]/12 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-[#fec708]/40 to-transparent" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#fec708]/20 bg-[#fec708]/10 px-3 py-1.5 cinematic-kicker">
                <Shield className="h-3.5 w-3.5" />
                Premium Paws Daily Program
              </div>
              <div className="space-y-2">
                <h2 className="cinematic-section-title text-3xl sm:text-5xl">
                  {petName}'s wellness launch
                </h2>
                <p className="cinematic-copy max-w-xl text-sm sm:text-base">
                  A sequential longevity plan that turns veterinary priorities into daily, trackable care actions.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 sm:min-w-36 sm:text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Complete</p>
              <p className="mt-1 font-heading text-3xl font-black tabular-nums tracking-tight text-[#fec708]">{progress}%</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-[1.5rem] border border-[#fec708]/20 bg-[#fec708]/10 p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#fec708]">
                <Zap className="h-3.5 w-3.5" />
                Next Best Action
              </div>
              {nextAction && nextActionText ? (
                <div className="space-y-2">
                  <h3 className="cinematic-card-title text-xl">{nextActionText.title}</h3>
                  {nextActionText.description && <p className="text-sm font-medium leading-6 text-white/65">{nextActionText.description}</p>}
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/38">Current phase: {nextActionStage?.title}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="cinematic-card-title text-xl">Launch complete</h3>
                  <p className="text-sm font-medium leading-6 text-white/65">Every unlocked wellness action has been checked off.</p>
                </div>
              )}
            </div>

            <div className="rounded-[1.5rem] border border-white/8 bg-black/20 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Program Pace</p>
                  <p className="mt-2 text-sm font-bold text-white"><span className="text-[#fec708]">{completedTasks}</span> of {totalTasks} care actions</p>
                </div>
                <CalendarDays className="h-8 w-8 text-[#fec708]/80" />
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                <motion.div
                  className="h-full rounded-full bg-[#fec708]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <p className="mt-3 text-xs font-medium leading-5 text-white/45">Complete tasks in order to unlock the next phase preview.</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="space-y-4 pb-6">
        {stages.map((stage, sIdx) => {
          const isCompleted = stage.tasks.length > 0 && stage.tasks.every(t => t.completed);
          const isExpanded = expandedStage === stage.id;
          const stageProgress = stage.tasks.length === 0 ? 0 : Math.round((stage.tasks.filter(t => t.completed).length / stage.tasks.length) * 100);
          const isCurrent = currentStage?.id === stage.id && stage.isUnlocked && !isCompleted;
          
          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: sIdx * 0.1 }}
              className="relative"
            >
              <div
                className={`overflow-hidden rounded-[1.75rem] border transition-all duration-500 ${
                    isCompleted
                      ? 'border-[#fec708]/25 bg-[#fec708]/10'
                      : isExpanded
                        ? 'border-[#fec708]/35 bg-white/[0.055] shadow-[0_24px_60px_rgba(0,0,0,0.25)]'
                        : isCurrent
                          ? 'border-[#fec708]/20 bg-white/[0.04]'
                          : stage.isUnlocked
                            ? 'border-white/8 bg-white/[0.025]'
                            : 'border-white/6 bg-black/20 opacity-70'
                  }`}
              >
                <button
                  type="button"
                  onClick={() => stage.isUnlocked && setExpandedStage(isExpanded ? null : stage.id)}
                  disabled={!stage.isUnlocked}
                  className="flex min-h-24 w-full items-center gap-4 p-4 text-left transition-colors sm:p-6"
                  aria-expanded={stage.isUnlocked ? isExpanded : undefined}
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border font-heading text-lg font-black ${
                    isCompleted
                      ? 'border-[#fec708] bg-[#fec708] text-black'
                      : stage.isUnlocked
                        ? 'border-[#fec708]/35 bg-[#fec708]/10 text-[#fec708]'
                        : 'border-white/10 bg-white/[0.03] text-white/25'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : stage.isUnlocked ? sIdx + 1 : <Lock className="h-5 w-5" />}
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`cinematic-card-title text-xl sm:text-2xl ${stage.isUnlocked ? 'text-white' : 'text-white/35'}`}>{stage.title}</h3>
                      {isCurrent && (
                        <span className="rounded-full border border-[#fec708]/25 bg-[#fec708]/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#fec708]">Active</span>
                      )}
                      {isCompleted && (
                        <span className="rounded-full border border-[#fec708]/25 bg-[#fec708]/15 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#fec708]">Complete</span>
                      )}
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/35">
                      {stage.isUnlocked ? `${stage.tasks.filter(t => t.completed).length} / ${stage.tasks.length} daily care actions` : 'Locked until prior phase is complete'}
                    </p>
                    {stage.isUnlocked && (
                      <div className="h-1.5 max-w-xs overflow-hidden rounded-full bg-white/8">
                        <div className="h-full rounded-full bg-[#fec708] transition-all duration-700" style={{ width: `${stageProgress}%` }} />
                      </div>
                    )}
                  </div>

                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${isExpanded ? 'bg-[#fec708]/12 text-[#fec708]' : 'bg-white/[0.03] text-white/30'}`}>
                    <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && stage.isUnlocked && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 border-t border-white/8 p-4 sm:p-6">
                        {stage.tasks.map((task) => {
                          const taskText = splitTaskText(task.text);

                          return (
                            <motion.button 
                              type="button"
                              key={task.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              onClick={() => handleTaskToggle(stage.id, task.id, !task.completed)}
                              className={`group/task relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 sm:p-5 ${
                                task.completed 
                                  ? 'border-[#fec708]/20 bg-[#fec708]/10' 
                                  : 'border-white/8 bg-black/20 hover:border-[#fec708]/30 hover:bg-white/[0.055]'
                              }`}
                            >
                              {lastCompletedTask === task.id && <Celebration />}
                              <div className="flex gap-4">
                                <div className={`mt-0.5 shrink-0 transition-colors duration-300 ${task.completed ? 'text-[#fec708]' : 'text-white/28 group-hover/task:text-[#fec708]/80'}`}>
                                  {task.completed ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                                </div>
                                <div className="min-w-0 flex-1 space-y-3">
                                  <div className="space-y-1.5">
                                    <h4 className={`font-heading text-base font-black leading-snug tracking-tight ${task.completed ? 'text-white/55' : 'text-white'}`}>
                                      {taskText.title}
                                    </h4>
                                    {taskText.description && (
                                      <p className={`text-sm font-medium leading-6 ${task.completed ? 'text-white/42' : 'text-white/64'}`}>
                                        {taskText.description}
                                      </p>
                                    )}
                                  </div>

                                  {task.rationale && (
                                    <div className="rounded-xl border border-white/8 bg-black/22 p-3">
                                      <div className="mb-1.5 flex items-center gap-2">
                                        <Info className="h-3.5 w-3.5 text-[#fec708]" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#fec708]">Why this matters</span>
                                      </div>
                                      <p className="text-xs font-medium leading-5 text-white/50">
                                        {task.rationale}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
          </motion.div>
        );
      })}
      </div>
    </div>
);
}


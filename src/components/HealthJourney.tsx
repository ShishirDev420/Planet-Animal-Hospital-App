import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, cubicBezier } from 'framer-motion';
import { CheckCircle2, Circle, Shield, ChevronDown, Info, Lock, ArrowRight, Sparkles } from 'lucide-react';

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
  stageClaims?: Record<string, boolean>;
  onCompleteStage?: (stageId: string) => void | Promise<void>;
  stageRewardPoints?: number;
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

export default function HealthJourney({
  stages,
  onToggleTask,
  petName,
  stageClaims = {},
  onCompleteStage,
  stageRewardPoints = 50,
}: HealthJourneyProps) {
  const [expandedStage, setExpandedStage] = useState<string | null>(stages[0]?.id || null);
  const [lastCompletedTask, setLastCompletedTask] = useState<string | null>(null);
  const [notifying, setNotifying] = useState(false);
  const reduceMotion = useReducedMotion();

  const activeStage = stages.find((s) => s.isUnlocked && !stageClaims[s.id]) || stages[0];
  const allStagesComplete = stages.length > 0 && stages.every((s) => s.tasks.length > 0 && s.tasks.every((t) => t.completed) && stageClaims[s.id]);

  const activeStageTasksComplete = activeStage?.tasks.length > 0 && activeStage.tasks.every((t) => t.completed);
  const activeStageClaimed = activeStage ? Boolean(stageClaims[activeStage.id]) : false;

  const handleTaskToggle = (stageId: string, taskId: string, isNowCompleted: boolean) => {
    if (isNowCompleted) {
      setLastCompletedTask(taskId);
      setTimeout(() => setLastCompletedTask(null), 1000);
    }
    onToggleTask(stageId, taskId);
  };

  const handleNotify = async () => {
    if (!activeStage || !activeStageTasksComplete || activeStageClaimed || notifying) return;
    setNotifying(true);
    await onCompleteStage?.(activeStage.id);
    setNotifying(false);
  };

  const easeOut = cubicBezier(0.16, 1, 0.3, 1);
  const transition = reduceMotion ? { duration: 0.2 } : { duration: 0.5, ease: easeOut };

  return (
    <div className="w-full space-y-6 sm:space-y-8 relative">
      <motion.div
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
        className="relative overflow-hidden rounded-[2rem] border border-[#fec708]/20 bg-[#0c1712]/95 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.38)] sm:p-8"
      >
        <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#fec708]/12 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-[#fec708]/40 to-transparent" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#fec708]/20 bg-[#fec708]/10 px-3 py-1.5 cinematic-kicker">
                <Shield className="h-3.5 w-3.5" />
                Care Stage
              </div>
              <div className="space-y-2">
                <h2 className="cinematic-section-title text-3xl sm:text-4xl">
                  {activeStage ? activeStage.title : `${petName}'s Plan`}
                </h2>
                <p className="cinematic-copy max-w-xl text-sm sm:text-base">
                  Complete these steps, then notify Planet Animal to unlock the next stage.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 sm:min-w-36 sm:text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Stage</p>
              <p className="mt-1 font-heading text-2xl font-black tabular-nums tracking-tight text-[#fec708]">
                {stages.indexOf(activeStage) + 1} / {stages.length}
              </p>
            </div>
          </div>

          {activeStage && activeStage.tasks.length > 0 ? (
            <div className="space-y-3">
              {activeStage.tasks.map((task) => {
                const taskText = splitTaskText(task.text);
                return (
                  <motion.button
                    type="button"
                    key={task.id}
                    initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={reduceMotion ? { duration: 0.1 } : { duration: 0.3, delay: stages.indexOf(activeStage) * 0.08 }}
                    onClick={() => handleTaskToggle(activeStage.id, task.id, !task.completed)}
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
          ) : (
            <div className="rounded-xl border border-white/8 bg-black/20 p-5 text-center">
              <p className="cinematic-card-title text-lg text-white/80 mb-2">No actionable steps found</p>
              <p className="cinematic-copy text-sm">The roadmap format may need adjustment. Try regenerating the roadmap or contact Planet Animal support.</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeStageTasksComplete && !activeStageClaimed && (
              <motion.div
                key="notify-cta"
                initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={reduceMotion ? { duration: 0.15 } : { duration: 0.4, ease: easeOut }}
              >
                <button
                  onClick={handleNotify}
                  disabled={notifying}
                  className="w-full rounded-xl bg-gradient-to-r from-[#fec708] to-[#fec708] py-4 font-heading text-[11px] font-black uppercase tracking-[0.22em] text-black shadow-[0_0_20px_rgba(254,199,8,0.4)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {notifying ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      Notifying Planet Animal...
                    </>
                  ) : (
                    <>
                      Notify Planet Animal
                      <ArrowRight className="w-4 h-4" />
                      <span className="ml-1 text-[10px]">+{stageRewardPoints} Paw Points</span>
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {activeStageClaimed && (
              <motion.div
                key="success-state"
                initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={reduceMotion ? { duration: 0.15 } : { duration: 0.5, ease: easeOut }}
                className="rounded-xl border border-[#fec708]/25 bg-[#fec708]/10 p-4 text-center"
              >
                <p className="cinematic-card-title text-lg text-white">
                  Planet Animal notified
                </p>
                <p className="mt-1 text-sm font-medium text-[#fec708]">
                  +{stageRewardPoints} Paw Points earned
                </p>
              </motion.div>
            )}

            {allStagesComplete && (
              <motion.div
                key="all-complete"
                initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={reduceMotion ? { duration: 0.15 } : { duration: 0.5, ease: easeOut }}
                className="rounded-xl border border-[#fec708]/25 bg-[#fec708]/10 p-4 text-center"
              >
                <p className="cinematic-card-title text-lg text-white">
                  All stages complete
                </p>
                <p className="mt-1 text-sm font-medium text-white/60">
                  {petName}'s full care plan is on track.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="space-y-3 pb-6">
        {stages.map((stage, sIdx) => {
          const isClaimed = Boolean(stageClaims[stage.id]);
          const isCurrentActive = activeStage?.id === stage.id && !isClaimed;
          const isLocked = !stage.isUnlocked;
          const isExpanded = expandedStage === stage.id;

          if (isCurrentActive) return null;

          return (
            <motion.div
              key={stage.id}
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={reduceMotion ? { duration: 0.1 } : { delay: sIdx * 0.06, duration: 0.4, ease: easeOut }}
            >
              <div
                className={`overflow-hidden rounded-[1.75rem] border transition-all duration-500 ${
                  isClaimed
                    ? 'border-[#fec708]/15 bg-[#fec708]/5'
                    : isLocked
                      ? 'border-white/6 bg-black/20 opacity-60'
                      : 'border-white/8 bg-white/[0.025]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => !isLocked && setExpandedStage(isExpanded ? null : stage.id)}
                  disabled={isLocked}
                  className="flex min-h-16 w-full items-center gap-4 p-4 text-left transition-colors sm:p-5"
                  aria-expanded={!isLocked ? isExpanded : undefined}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-heading text-sm font-black ${
                    isClaimed
                      ? 'border-[#fec708]/40 bg-[#fec708]/15 text-[#fec708]'
                      : isLocked
                        ? 'border-white/10 bg-white/[0.03] text-white/20'
                        : 'border-[#fec708]/25 bg-[#fec708]/10 text-[#fec708]'
                  }`}>
                    {isClaimed ? <CheckCircle2 className="h-5 w-5" /> : isLocked ? <Lock className="h-4 w-4" /> : sIdx + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`cinematic-card-title text-lg ${isLocked ? 'text-white/30' : 'text-white/80'}`}>
                        {stage.title}
                      </h3>
                      {isClaimed && (
                        <span className="rounded-full border border-[#fec708]/20 bg-[#fec708]/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-[#fec708]">
                          Notified
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/25 mt-1">
                      {isLocked
                        ? 'Complete and notify the current stage to unlock'
                        : isClaimed
                          ? `${stage.tasks.length} care actions completed`
                          : `${stage.tasks.filter(t => t.completed).length} / ${stage.tasks.length} care actions`}
                    </p>
                  </div>

                  {!isLocked && (
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${isExpanded ? 'bg-[#fec708]/12 text-[#fec708]' : 'bg-white/[0.03] text-white/25'}`}>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  )}
                </button>

                <AnimatePresence>
                  {isExpanded && !isLocked && (
                    <motion.div
                      initial={reduceMotion ? { opacity: 1, height: 'auto' } : { height: 0, opacity: 0 }}
                      animate={reduceMotion ? { opacity: 1, height: 'auto' } : { height: 'auto', opacity: 1 }}
                      exit={reduceMotion ? { opacity: 0, height: 0 } : { height: 0, opacity: 0 }}
                      transition={reduceMotion ? { duration: 0.15 } : { duration: 0.4, ease: easeOut }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2 border-t border-white/8 p-4 sm:p-5">
                        {stage.tasks.map((task) => {
                          const taskText = splitTaskText(task.text);
                          return (
                            <motion.button
                              type="button"
                              key={task.id}
                              onClick={() => handleTaskToggle(stage.id, task.id, !task.completed)}
                              className={`group/task relative w-full overflow-hidden rounded-xl border p-3 text-left transition-all duration-300 ${
                                task.completed
                                  ? 'border-[#fec708]/15 bg-[#fec708]/8'
                                  : 'border-white/6 bg-black/15 hover:border-[#fec708]/20'
                              }`}
                            >
                              <div className="flex gap-3">
                                <div className={`mt-0.5 shrink-0 transition-colors ${task.completed ? 'text-[#fec708]' : 'text-white/20'}`}>
                                  {task.completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className={`font-heading text-sm font-black leading-snug ${task.completed ? 'text-white/45' : 'text-white/70'}`}>
                                    {taskText.title}
                                  </h4>
                                  {taskText.description && (
                                    <p className={`text-xs font-medium mt-0.5 ${task.completed ? 'text-white/30' : 'text-white/50'}`}>
                                      {taskText.description}
                                    </p>
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

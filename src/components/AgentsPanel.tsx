import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { ArrowRight, CalendarClock, CheckCircle2, ChevronRight, Loader2, Map, Pill, Send, Sparkles, TicketPercent } from 'lucide-react';
import type { ElementType, ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { usePetProfile } from '../hooks/usePetProfile';
import type { PritpawlRoadmap } from '../lib/pritpawlRoadmap';
import {
  PAWLINA_SERVICES,
  buildWhatsAppMessage,
  calculateBookingPoints,
  callClinic,
  cancelBookingRequest,
  createBookingRequest,
  awardPendingPoints,
  getUserBookings,
  rescheduleBookingRequest,
  getCurrentUserBookingSupport,
  getPointsMultiplier,
  getProfilePlan,
} from '../lib/pawPoints';
import { cn } from '../lib/utils';

type AgentId = 'pawl' | 'pawlina' | 'pritpawl';
type AgentStatus = 'Online' | 'Planning';

type Agent = {
  id: AgentId;
  name: string;
  role: string;
  purpose: string;
  description: string;
  status: AgentStatus;
  cta: string;
  quickPrompts: string[];
  Icon: ElementType;
  Avatar: () => ReactElement;
  theme: {
    accent: string;
    glow: string;
    mesh: string;
    ring: string;
  };
};

type ChatMessage = {
  id: string;
  from: 'agent' | 'user';
  text: string;
  roadmap?: PritpawlRoadmap;
};

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.04 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

const agents: Agent[] = [
  {
    id: 'pawl',
    name: 'Pawl',
    role: 'Paw Points Journey Agent',
    purpose: 'Earn, redeem, and climb loyalty tiers with less guesswork.',
    description: 'Guides pet parents through Paw Points, reward timing, loyalty tiers, and smart visit combos.',
    status: 'Online',
    cta: 'Open Rewards',
    Icon: TicketPercent,
    Avatar: PawlAvatar,
    quickPrompts: ['Show my tier path', 'Find point multipliers', 'Best redemption today'],
    theme: {
      accent: '#fec708',
      glow: 'rgba(254, 199, 8, 0.34)',
      mesh: 'radial-gradient(circle at 18% 18%, rgba(254,199,8,0.36), transparent 30%), radial-gradient(circle at 82% 18%, rgba(245,134,52,0.28), transparent 34%), linear-gradient(145deg, rgba(47,31,5,0.92), rgba(9,19,14,0.96))',
      ring: 'rgba(254, 199, 8, 0.45)',
    },
  },
  {
    id: 'pawlina',
    name: 'Pawlina',
    role: 'Appointment & Paw Points Agent',
    purpose: 'Book, cancel, move appointments. Earn Paw Points on every visit, call the clinic directly.',
    description: 'Full-spectrum booking: create visits tied to Paw Points, cancel or reschedule, auto-send WhatsApp confirm to 9004290923, and dial the clinic instantly.',
    status: 'Online',
    cta: 'Book Visit',
    Icon: CalendarClock,
    Avatar: PawlinaAvatar,
    quickPrompts: ['Book next vaccine', 'Cancel my appointment', 'Move my appointment', 'Call Planet Animal Hospital'],
    theme: {
      accent: '#fb7185',
      glow: 'rgba(251, 113, 133, 0.30)',
      mesh: 'radial-gradient(circle at 20% 22%, rgba(251,113,133,0.32), transparent 32%), radial-gradient(circle at 78% 20%, rgba(45,212,191,0.20), transparent 34%), linear-gradient(145deg, rgba(50,20,31,0.94), rgba(8,25,22,0.96))',
      ring: 'rgba(251, 113, 133, 0.44)',
    },
  },
  {
    id: 'pritpawl',
    name: 'Pritpawl',
    role: 'Life-Max & Roadmap Agent',
    purpose: 'Breed-customized longevity plans focused on nutrition, exercise, behavioral & psychological health — all science-backed for life-maxing.',
    description: 'Builds a verified, peer-reviewed care roadmap from influential veterinary science (AVMA, AAHA, WSAVA, JAVMA), tailored precisely to your pet\'s breed, age, weight, and history.',
    status: 'Online',
    cta: 'Generate Roadmap',
    Icon: Pill,
    Avatar: PritpawlAvatar,
    quickPrompts: ['Life-max my pet\'s health', 'Show nutrition & exercise plan', 'Track my roadmap progress'],
    theme: {
      accent: '#2dd4bf',
      glow: 'rgba(45, 212, 191, 0.30)',
      mesh: 'radial-gradient(circle at 22% 18%, rgba(45,212,191,0.32), transparent 32%), radial-gradient(circle at 84% 26%, rgba(56,189,248,0.24), transparent 34%), linear-gradient(145deg, rgba(3,37,37,0.95), rgba(9,19,32,0.96))',
      ring: 'rgba(45, 212, 191, 0.44)',
    },
  },
];

const pawPointTiers = [
  { points: 500, title: 'Core Foundation' },
  { points: 1500, title: 'Health Savior' },
  { points: 3000, title: 'Wellness Master' },
  { points: 5000, title: 'Expert Access' },
  { points: 7500, title: 'Clinical Privilege' },
  { points: 10000, title: 'The Lifeline Sentinel' },
  { points: 25000, title: 'Archive Elite' },
  { points: 100000, title: "The Founder's Peak" },
];

export default function AgentsPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const { agentId } = useParams();
  const { profile, updateProfile } = usePetProfile();
  const activeAgent = useMemo(() => agents.find((agent) => agent.id === agentId) ?? agents[0], [agentId]);
  const agentState = useMemo(() => getAgentState(profile), [profile]);
  const [messages, setMessages] = useState<Record<AgentId, ChatMessage[]>>(() => createInitialMessages(profile));
  const [drafts, setDrafts] = useState<Record<AgentId, string>>({ pawl: '', pawlina: '', pritpawl: '' });
  const [thinkingAgent, setThinkingAgent] = useState<AgentId | null>(null);

  const withSearch = (path: string) => {
    if (!location.search) return path;
    return `${path}${path.includes('?') ? '&' : '?'}${location.search.slice(1)}`;
  };

  const selectAgent = (agent: Agent) => {
    navigate(withSearch(`/agents/${agent.id}`));
  };

  const pushMessage = (agentId: AgentId, message: Omit<ChatMessage, 'id'>) => {
    setMessages((current) => ({
      ...current,
      [agentId]: [...(current[agentId] ?? []), { ...message, id: `${agentId}-${Date.now()}-${Math.random()}` }],
    }));
  };

  const submitPrompt = async (agent: Agent, prompt: string) => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || thinkingAgent) return;

    pushMessage(agent.id, { from: 'user', text: cleanPrompt });
    setDrafts((current) => ({ ...current, [agent.id]: '' }));
    setThinkingAgent(agent.id);

    try {
      if (agent.id === 'pawlina') {
        const reply = await handlePawlinaPrompt(cleanPrompt, profile, pushMessage);
        pushMessage(agent.id, { from: 'agent', text: reply });
      } else if (agent.id === 'pritpawl' && shouldGenerateRoadmap(cleanPrompt)) {
        pushMessage(agent.id, { from: 'agent', text: buildPritpawlCachedRoadmapReply(cleanPrompt, profile, agentState) });
      } else {
        pushMessage(agent.id, { from: 'agent', text: buildAgentReply(agent.id, cleanPrompt, profile, agentState) });
      }
    } catch (error) {
      pushMessage(agent.id, { from: 'agent', text: 'I could not complete that action yet. Please confirm the profile is signed in and try again.' });
    } finally {
      setThinkingAgent(null);
    }
  };

  const runPrimaryAction = async () => {
    if (activeAgent.id === 'pawl') navigate(withSearch('/rewards'));
    if (activeAgent.id === 'pawlina') navigate(withSearch('/?openBooking=true&service=Vaccination'));
    if (activeAgent.id === 'pritpawl') await submitPrompt(activeAgent, 'Life-max my pet\'s health');
  };

  return (
    <section className="relative min-h-full overflow-hidden px-4 pb-32 pt-16 text-white sm:px-6 lg:px-0 lg:pb-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          key={activeAgent.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-x-[-20%] top-[-28%] h-[520px] blur-3xl"
          style={{ background: activeAgent.theme.mesh }}
        />
        <div className="absolute inset-0 neural-mesh-grid opacity-[0.08]" />
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-6xl">
        <motion.div variants={item} className="mb-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Choose Your Agent</p>
              <p className="mt-1 text-sm font-semibold text-white/70">Switch instantly between Pawl, Pawlina, and Pritpawl.</p>
            </div>
            <span className="hidden rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/45 sm:inline-flex">
              3 agents live
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {agents.map((agent) => (
              <AgentSwitchCard key={agent.id} agent={agent} active={agent.id === activeAgent.id} state={agentState} onClick={() => selectAgent(agent)} />
            ))}
          </div>
        </motion.div>

        <motion.header variants={item} className="mb-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 shadow-2xl backdrop-blur-2xl">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-planet-yellow opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-planet-yellow" />
              </span>
              <span className="font-heading text-[10px] font-black uppercase tracking-[0.26em] text-planet-yellow">Paw Agent Console</span>
            </div>
            <h1 className="font-heading text-4xl font-black leading-[0.92] tracking-tight text-white sm:text-5xl lg:text-7xl">
              Active agent, live chat.
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-white/58 sm:text-base">
              Select any agent. The flashcard and conversation render inline together, with history and logic scoped to that agent.
            </p>
          </div>

          <div className="liquid-glass flex items-center gap-4 rounded-[1.6rem] px-4 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-planet-yellow text-black shadow-[0_0_32px_rgba(254,199,8,0.25)]">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Live Routing</p>
              <p className="text-sm font-bold text-white">Pawl, Pawlina, Pritpawl</p>
            </div>
          </div>
        </motion.header>

        <motion.div variants={item} className="grid grid-cols-1 gap-4 xl:grid-cols-[410px_minmax(0,1fr)]">
          <AgentCard agent={activeAgent} state={agentState} isActive onSelect={() => selectAgent(activeAgent)} />
          <AgentChat
            agent={activeAgent}
            messages={messages[activeAgent.id] ?? []}
            draft={drafts[activeAgent.id] ?? ''}
            isThinking={thinkingAgent === activeAgent.id}
            onDraftChange={(value) => setDrafts((current) => ({ ...current, [activeAgent.id]: value }))}
            onSubmit={(prompt) => submitPrompt(activeAgent, prompt)}
            onPrimaryAction={runPrimaryAction}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

function AgentCard({ agent, state, isActive, onSelect }: { agent: Agent; state: ReturnType<typeof getAgentState>; isActive?: boolean; onSelect: () => void }) {
  const Icon = agent.Icon;
  const metrics = getLiveMetrics(agent.id, state);

  return (
    <motion.button
      variants={item}
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      onClick={onSelect}
      className={cn(
        'group relative min-h-[450px] overflow-hidden rounded-[2rem] border p-5 text-left shadow-2xl transition-colors duration-500',
        isActive ? 'border-white/24 bg-white/[0.10]' : 'border-white/10 bg-white/[0.055] hover:border-white/20',
      )}
      style={{ boxShadow: isActive ? `0 24px 70px ${agent.theme.glow}` : undefined }}
    >
      <div className="absolute inset-0 opacity-95" style={{ background: agent.theme.mesh }} />
      <motion.div className="absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl" animate={{ scale: [1, 1.08, 1], opacity: [0.42, 0.65, 0.42] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }} style={{ backgroundColor: agent.theme.glow }} />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.16),transparent_35%,rgba(255,255,255,0.04))]" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-5 flex items-start justify-between gap-4">
          <AgentAvatar agent={agent} large />
          <StatusPill status={agent.status} color={agent.theme.accent} />
        </div>

        <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.20em] text-white/68 backdrop-blur-xl">
          <Icon size={13} style={{ color: agent.theme.accent }} />
          {agent.role}
        </div>

        <h2 className="font-heading text-4xl font-black tracking-tight text-white">{agent.name}</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-white/76">{agent.purpose}</p>
        <p className="mt-3 text-sm leading-6 text-white/50">{agent.description}</p>

        <div className="mt-auto pt-6">
          <div className="mb-5 grid grid-cols-2 gap-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 backdrop-blur-xl">
                <p className="text-[9px] font-black uppercase tracking-[0.20em] text-white/34">{metric.label}</p>
                <p className="mt-1 font-heading text-lg font-black text-white">{metric.value}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-black text-black shadow-xl" style={{ backgroundColor: agent.theme.accent }}>
            <span>{agent.cta}</span>
            <ChevronRight size={18} />
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function AgentChat({
  agent,
  messages,
  draft,
  isThinking,
  onDraftChange,
  onSubmit,
  onPrimaryAction,
}: {
  agent: Agent;
  messages: ChatMessage[];
  draft: string;
  isThinking: boolean;
  onDraftChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onPrimaryAction: () => void;
}) {
  return (
    <div className="liquid-glass relative flex min-h-[450px] flex-col overflow-hidden rounded-[2rem] p-4 sm:p-5">
      <div className="absolute right-0 top-0 h-40 w-40 -translate-y-1/2 translate-x-1/2 rounded-full blur-3xl" style={{ backgroundColor: agent.theme.glow }} />
      <div className="relative z-10 mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Inline Agent Chat</p>
          <h3 className="mt-1 font-heading text-2xl font-black text-white">{agent.name} workspace</h3>
        </div>
        <TypingIndicator color={agent.theme.accent} active={isThinking} />
      </div>

      <div className="relative z-10 mb-4 grid gap-2 sm:grid-cols-3">
        {agent.quickPrompts.map((prompt) => (
          <button key={prompt} onClick={() => onSubmit(prompt)} className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3 text-left text-xs font-bold leading-5 text-white/75 transition-colors hover:bg-white/[0.09]">
            {prompt}
          </button>
        ))}
      </div>

      <div className="relative z-10 flex-1 space-y-3 overflow-y-auto rounded-[1.5rem] border border-white/10 bg-black/20 p-3 hide-scrollbar">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div key={message.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={cn('flex', message.from === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[92%] rounded-2xl px-4 py-3 text-sm font-medium leading-6', message.from === 'user' ? 'bg-white text-black' : 'border border-white/10 bg-white/[0.06] text-white/76')}>
                <p>{message.text}</p>
                {message.roadmap && <RoadmapJsonCard roadmap={message.roadmap} color={agent.theme.accent} />}
              </div>
            </motion.div>
          ))}
          {isThinking && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
                <TypingIndicator color={agent.theme.accent} active />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form
        className="relative z-10 mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(draft);
        }}
      >
        <input
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder={`Ask ${agent.name}...`}
          className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-white/25"
        />
        <button type="submit" disabled={!draft.trim() || isThinking} className="flex h-12 w-12 items-center justify-center rounded-2xl text-black disabled:opacity-45" style={{ backgroundColor: agent.theme.accent }}>
          {isThinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={17} />}
        </button>
        <button type="button" onClick={onPrimaryAction} className="hidden rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-xs font-black uppercase tracking-[0.16em] text-white/70 hover:bg-white/[0.10] sm:block">
          {agent.cta}
        </button>
      </form>
    </div>
  );
}

function AgentSwitchCard({ agent, active, state, onClick }: { agent: Agent; active: boolean; state: ReturnType<typeof getAgentState>; onClick: () => void }) {
  const Icon = agent.Icon;
  const metric = getLiveMetrics(agent.id, state)[0];

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative min-h-[126px] overflow-hidden rounded-[1.75rem] border p-3 text-left shadow-2xl transition-all duration-300',
        active ? 'border-white/28 bg-white/[0.11]' : 'border-white/10 bg-white/[0.045] hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08]',
      )}
      style={{ boxShadow: active ? `0 18px 46px ${agent.theme.glow}` : undefined }}
      aria-pressed={active}
    >
      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-90" style={{ background: agent.theme.mesh }} />
      {active && <div className="absolute inset-0 opacity-95" style={{ background: agent.theme.mesh }} />}
      <div className="absolute right-[-36px] top-[-44px] h-28 w-28 rounded-full blur-3xl" style={{ backgroundColor: agent.theme.glow }} />
      <div className="relative z-10 flex items-center gap-3">
        <AgentAvatar agent={agent} compact />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5">
            <Icon size={13} style={{ color: agent.theme.accent }} />
            <p className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-white/42">{agent.role}</p>
          </div>
          <p className="truncate font-heading text-xl font-black text-white">{agent.name}</p>
          <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-white/62">{agent.purpose}</p>
        </div>
      </div>
      <div className="relative z-10 mt-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 backdrop-blur-xl">
        <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-white/40">{metric.label}</p>
        <p className="truncate text-xs font-black text-white">{metric.value}</p>
      </div>
      {active && <CheckCircle2 className="absolute right-3 top-3 z-20 h-4 w-4 shrink-0" style={{ color: agent.theme.accent }} />}
    </button>
  );
}

function RoadmapJsonCard({ roadmap, color }: { roadmap: PritpawlRoadmap; color: string }) {
  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-black/24 p-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">JSON Roadmap</p>
        <p className="mt-1 text-lg font-black text-white">{roadmap.petName}</p>
        <p className="mt-1 text-xs leading-5 text-white/56">{roadmap.summary}</p>
      </div>
      {roadmap.phases.map((phase) => (
        <div key={phase.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-black text-white">{phase.title}</p>
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>{phase.timeline}</span>
          </div>
          <div className="space-y-2">
            {phase.tasks.slice(0, 2).map((task) => (
              <div key={task.id} className="text-xs leading-5 text-white/62">
                <span className="font-bold text-white">{task.title}:</span> {task.description}
              </div>
            ))}
          </div>
        </div>
      ))}
      <pre className="max-h-44 overflow-auto rounded-xl bg-black/40 p-3 text-[10px] leading-4 text-white/52">{JSON.stringify(roadmap, null, 2)}</pre>
    </div>
  );
}

function getLiveMetrics(agentId: AgentId, state: ReturnType<typeof getAgentState>) {
  if (agentId === 'pawl') {
    return [
      { label: 'Paw Points', value: state.points.toLocaleString() },
      { label: 'Next Tier', value: state.nextTier.title },
    ];
  }
  if (agentId === 'pawlina') {
    return [
      { label: 'Best Slot', value: state.bestSlot },
      { label: 'Suggested', value: state.bookingSuggestion },
    ];
  }
  return [
    { label: 'Life-Max', value: `${state.completedRoadmapTasks}/${state.totalRoadmapTasks}` },
    { label: 'Focus', value: state.totalRoadmapTasks > 0 ? 'Generated' : 'Generate' },
  ];
}

function getAgentState(profile: any) {
  const points = Number(profile?.pawPoints || 0);
  const nextTier = pawPointTiers.find((tier) => tier.points > points) ?? pawPointTiers[pawPointTiers.length - 1];
  const roadmapTasks = extractRoadmapTasks(profile?.cachedRoadmap || '');
  const progress = profile?.roadmapProgress || {};
  const breed = String(profile?.breed || '').toLowerCase();

  const pritpawlRoadmap = profile?.pritpawlRoadmap as PritpawlRoadmap | undefined;
  const totalRoadmapTasks = pritpawlRoadmap
    ? pritpawlRoadmap.phases.reduce((sum, p) => sum + p.tasks.length, 0)
    : roadmapTasks.length;
  const completedRoadmapTasks = pritpawlRoadmap
    ? pritpawlRoadmap.phases.reduce((sum, p) => sum + p.tasks.filter((t) => progress[t.id]).length, 0)
    : roadmapTasks.filter((task) => progress[task.id]).length;

  return {
    points,
    nextTier,
    pointsToNext: Math.max(0, nextTier.points - points),
    totalRoadmapTasks,
    completedRoadmapTasks,
    nextRoadmapTask: roadmapTasks.find((task) => !progress[task.id]),
    bookingSuggestion: breed.includes('lab') || breed.includes('retriever') ? 'Joint Check' : 'Wellness Check',
    bestSlot: '10:00 AM',
    pritpawlRoadmap,
  };
}

type CachedRoadmapTask = {
  id: string;
  label: string;
  title: string;
  description: string;
  rationale: string;
  phaseTitle: string;
};

function extractRoadmapTasks(roadmapText: string): CachedRoadmapTask[] {
  const tasks: CachedRoadmapTask[] = [];
  const phaseRegex = /###\s*(?:Phase:\s*)?([^\n]+)/gi;
  const phases: Array<{ start: number; title: string }> = [];
  let phaseMatch;

  while ((phaseMatch = phaseRegex.exec(roadmapText)) !== null) {
    const title = phaseMatch[1].trim();
    if (/^\d/.test(title) || /month|long.term/i.test(title)) phases.push({ start: phaseMatch.index, title });
  }

  for (let phaseIndex = 0; phaseIndex < phases.length; phaseIndex++) {
    const phase = phases[phaseIndex];
    const phaseContent = roadmapText.substring(phase.start, phases[phaseIndex + 1]?.start || roadmapText.length);
    const actionableContent = phaseContent.split(/###\s*Verifiable Sources/i)[0];
    const taskLines = actionableContent.split('\n').filter((line) => /^\s*[-*]\s+/.test(line));

    taskLines.forEach((line, taskIndex) => {
      const cleanedLine = line.replace(/^\s*[-*]\s+/, '').trim();
      const formattedMatch = cleanedLine.match(/^\*\*([^*]+)\*\*\s*:?\s*(.*)$/);
      const title = (formattedMatch?.[1] || cleanedLine.split(':')[0] || `Care Action ${taskIndex + 1}`).trim();
      const remainder = (formattedMatch?.[2] || cleanedLine.slice(title.length).replace(/^\s*:?\s*/, '')).trim();
      const rationaleSplit = remainder.split(/\s*\|\s*(?:Scientific Rationale:\s*)?/i);
      const description = (rationaleSplit[0] || '').trim();
      const rationale = (rationaleSplit.slice(1).join(' | ') || '').trim();

      tasks.push({
        id: `${phase.title}-${taskIndex}`,
        label: `${title}: ${description}`,
        title,
        description,
        rationale,
        phaseTitle: phase.title,
      });
    });
  }
  return tasks;
}

function createInitialMessages(profile: any): Record<AgentId, ChatMessage[]> {
  const petName = profile?.petName || profile?.name || 'your pet';
  return {
    pawl: [{ id: 'pawl-welcome', from: 'agent', text: `I can see ${petName}'s Paw Points status and route reward decisions here.` }],
    pawlina: [{ id: 'pawlina-welcome', from: 'agent', text: `I can book, cancel, or move appointments for ${petName} — every booking earns Paw Points and auto-confirms via WhatsApp to 9004290923. Just tell me what you need.` }],
    pritpawl: [{ id: 'pritpawl-welcome', from: 'agent', text: `I generate breed-customized life-maxing roadmaps for ${petName} — covering nutrition, exercise, behavioral health, and psychological wellness, all backed by peer-reviewed veterinary science (AVMA, AAHA, WSAVA, JAVMA).` }],
  };
}

function shouldGenerateRoadmap(prompt: string) {
  return /generate|roadmap|life-max|life max|health plan|care plan|nutrition|exercise|behavior|psychological|prescription/i.test(prompt);
}

function buildPritpawlCachedRoadmapReply(prompt: string, profile: any, state: ReturnType<typeof getAgentState>) {
  const petName = profile?.petName || profile?.name || 'your pet';
  const roadmapText = profile?.cachedRoadmap || '';
  const tasks = extractRoadmapTasks(roadmapText);
  const progress = profile?.roadmapProgress || {};
  const lowerPrompt = prompt.toLowerCase();

  if (!roadmapText || tasks.length === 0) {
    return `I do not see a generated roadmap for ${petName} yet. Open the Roadmap section first so I can read the plan, nutrition, exercise, and progress from the same source of truth.`;
  }

  if (/progress|track|complete/i.test(lowerPrompt)) {
    return buildCachedRoadmapProgressReply(petName, tasks, progress);
  }

  const wantsNutrition = /nutrition|diet|food|feed|weight|hydration|protein/i.test(lowerPrompt);
  const wantsExercise = /exercise|activity|fitness|walk|movement|play|enrich|environment|behavior|mental|scratch|climb/i.test(lowerPrompt);

  if (wantsNutrition || wantsExercise) {
    const sections: string[] = [];

    if (wantsNutrition) {
      const nutritionTasks = tasks.filter((task) => /nutrition|diet|food|feed|weight|hydration|protein/i.test(`${task.title} ${task.description} ${task.rationale}`));
      sections.push(formatRoadmapTaskSection('Nutrition plan', nutritionTasks));
    }

    if (wantsExercise) {
      const exerciseTasks = tasks.filter((task) => /exercise|activity|fitness|walk|movement|play|enrich|environment|behavior|mental|scratch|climb/i.test(`${task.title} ${task.description} ${task.rationale}`));
      sections.push(formatRoadmapTaskSection('Exercise and enrichment plan', exerciseTasks));
    }

    return `${petName}'s roadmap has already been generated in the Roadmap section. Here is the relevant plan from that roadmap:\n\n${sections.join('\n\n')}`;
  }

  const generatedDate = profile?.roadmapGeneratedAt ? ` on ${new Date(profile.roadmapGeneratedAt).toLocaleDateString()}` : '';
  const phaseSummary = formatPhaseProgress(tasks, progress);

  return `${petName}'s life-maxing roadmap has already been generated in the Roadmap section${generatedDate}.\n\nCurrent progress: ${state.completedRoadmapTasks}/${state.totalRoadmapTasks} tasks complete.\n\n${phaseSummary}\n\nUse the Roadmap section to check off tasks, unlock the next stage, and keep progress synced.`;
}

function buildCachedRoadmapProgressReply(petName: string, tasks: CachedRoadmapTask[], progress: Record<string, boolean>) {
  const completedTasks = tasks.filter((task) => progress[task.id]).length;
  const pct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return `Roadmap progress for ${petName}: ${pct}% complete (${completedTasks}/${tasks.length} tasks).\n\n${formatPhaseProgress(tasks, progress)}\n\nThis is reading from the same Roadmap section progress, so checked-off tasks stay synced.`;
}

function formatPhaseProgress(tasks: CachedRoadmapTask[], progress: Record<string, boolean>) {
  const phaseTitles = [...new Set(tasks.map((task) => task.phaseTitle))];

  return phaseTitles.map((phaseTitle) => {
    const phaseTasks = tasks.filter((task) => task.phaseTitle === phaseTitle);
    const done = phaseTasks.filter((task) => progress[task.id]).length;
    const nextTask = phaseTasks.find((task) => !progress[task.id]);
    return `${phaseTitle}: ${done}/${phaseTasks.length} complete${nextTask ? `; next: ${nextTask.title}` : '; complete'}`;
  }).join('\n');
}

function formatRoadmapTaskSection(title: string, tasks: CachedRoadmapTask[]) {
  if (tasks.length === 0) return `${title}: No dedicated task is listed yet, but the full roadmap still contains preventive care steps to follow.`;

  return `${title}:\n${tasks.map((task) => `- ${task.title} (${task.phaseTitle}): ${task.description}`).join('\n')}`;
}

// ─── Pawlina: Full booking/cancel/move/call backend ──────────────────────

async function handlePawlinaPrompt(
  prompt: string,
  profile: any,
  pushMessage: (agentId: AgentId, message: Omit<ChatMessage, 'id'>) => void,
): Promise<string> {
  const petName = profile?.petName || profile?.name || 'your pet';
  const parentName = profile?.parentName || 'Pet Parent';
  const plan = getProfilePlan(profile);
  const lowerPrompt = prompt.toLowerCase();
  const userSupport = getCurrentUserBookingSupport();
  const userId = userSupport?.userId || (profile?.uid as string) || 'demo-user';
  const resolvedParentName = userSupport?.parentName || parentName;
  const resolvedPetName = userSupport?.petName || petName;

  if (/call|phone|dial|hospital|contact/i.test(lowerPrompt)) {
    callClinic();
    return 'Dialing Planet Animal Hospital at 900-429-0923 now. Your phone dialer should open — if not, check your browser permissions for tel: links.';
  }

  if (/cancel|remove|delete/i.test(lowerPrompt)) {
    if (!userId) return 'I need you to be signed in before I can look up your appointments.';
    const bookings = await getUserBookings(userId);
    const pending = bookings.filter((b) => b.status === 'pending');
    if (pending.length === 0) {
      return 'I could not find any pending appointments to cancel. If you have a specific date or service in mind, tell me more details.';
    }
    const list = pending.map((b, i) => `${i + 1}. ${b.reason} on ${b.date} at ${b.time} (${b.points} pts, ID: ${b.id.slice(0, 6)})`).join('\n');
    return `Here are your pending appointments:\n${list}\n\nReply with the number (e.g., "cancel 1") or the service name to cancel a specific booking.`;
  }

  if (/cancel\s+(\d+)/i.test(lowerPrompt)) {
    const match = lowerPrompt.match(/cancel\s+(\d+)/i);
    const index = parseInt(match![1]) - 1;
    if (!userId) return 'Please sign in to manage appointments.';
    const bookings = await getUserBookings(userId);
    const pending = bookings.filter((b) => b.status === 'pending');
    if (index < 0 || index >= pending.length) return 'That appointment number is not valid. Please check the list and try again.';
    const target = pending[index];
    const success = await cancelBookingRequest(target.id);
    return success
      ? `Cancelled your ${target.reason} appointment on ${target.date} at ${target.time}. The ${target.points} paw points have been released.`
      : 'I was unable to cancel that appointment. Please try again or contact the clinic directly at 900-429-0923.';
  }

  if (/move|reschedule|change/i.test(lowerPrompt) && !/date|time/i.test(lowerPrompt)) {
    if (!userId) return 'I need you to be signed in before I can look up your appointments.';
    const bookings = await getUserBookings(userId);
    const pending = bookings.filter((b) => b.status === 'pending');
    if (pending.length === 0) {
      return 'I could not find any pending appointments to reschedule. Would you like to book a new visit instead?';
    }
    const list = pending.map((b, i) => `${i + 1}. ${b.reason} on ${b.date} at ${b.time} (ID: ${b.id.slice(0, 6)})`).join('\n');
    return `Here are your pending appointments:\n${list}\n\nTell me which one to move and the new date/time (e.g., "move #1 to May 20 at 3:00 PM").`;
  }

  if (/move|reschedule/i.test(lowerPrompt) && /date|time|#|to\s/i.test(lowerPrompt)) {
    if (!userId) return 'Please sign in to manage appointments.';
    const bookings = await getUserBookings(userId);
    const pending = bookings.filter((b) => b.status === 'pending');
    const numMatch = lowerPrompt.match(/(\d+)/);
    const requested = numMatch ? parseInt(numMatch[0]) : 1;
    const index = pending.length >= requested ? requested - 1 : 0;
    if (pending.length === 0) return 'I could not find any pending appointments to reschedule. Would you like to book new?';
    const target = pending[index];
    const dateMatch = prompt.match(/([A-Z][a-z]+ \d{1,2}|\d{4}-\d{2}-\d{2})/i);
    const timeMatch = prompt.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/);
    const newDate = dateMatch ? dateMatch[0] : target.date;
    const newTime = timeMatch ? timeMatch[0] : target.time;
    const success = await rescheduleBookingRequest(target.id, newDate, newTime);
    return success
      ? `Moved your ${target.reason} appointment to ${newDate} at ${newTime}. Your ${target.points} paw points stay intact. I can send a new WhatsApp confirmation — just say "send reminder".`
      : 'I could not reschedule that appointment. Please try again or call the clinic at 900-429-0923.';
  }

  if (/book|vaccine|visit|schedule|appointment|checkup|check-up|groom|ear|haircut/i.test(lowerPrompt) && !hasDateTimePrompt(prompt)) {
    const matchingService = findPawlinaService(lowerPrompt);
    if (matchingService) {
      const serviceNames = PAWLINA_SERVICES.map((s, i) => `${i + 1}. ${s.name} — +${s.points} pts`).join('\n');
      const points = calculateBookingPoints([matchingService], plan);
      const multiplierNote = getBookingRewardNote(plan, points);
      return `Booked: **${matchingService.name}** for ${resolvedPetName}.\n\nEarns +${Math.round(points)} paw points${multiplierNote}.\n\nTo confirm, I need a date and time. You can also use the "Book Visit" button above to select them visually.\n\nAvailable services:\n${serviceNames}\n\nOr tell me: "${matchingService.name} on [date] at [time]" and I will lock it in.`;
    }

    const serviceNames = PAWLINA_SERVICES.map((s, i) => `${i + 1}. ${s.name} — +${s.points} pts`).join('\n');
    return `Which service should I book for ${resolvedPetName}?\n\n${serviceNames}\n\nTell me the number or service name, plus preferred date/time.`;
  }

  if (hasDateTimePrompt(prompt)) {
    const dateMatch = prompt.match(/([A-Z][a-z]+ \d{1,2}|\d{4}-\d{2}-\d{2})/i);
    const timeMatch = prompt.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/i);
    const date = dateMatch ? dateMatch[0] : 'TBD';
    const time = timeMatch ? timeMatch[0] : 'TBD';

    const matchingService = findPawlinaService(lowerPrompt) || { id: 0, name: 'Visit', points: 750 };

    if (!userId || userId === 'demo-user') {
      const message = buildWhatsAppMessage(resolvedParentName, resolvedPetName, [matchingService.name], date, time);
      const url = `https://wa.me/919004290923?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      const points = calculateBookingPoints([matchingService], plan);
      return `Opening WhatsApp with your booking details for ${matchingService.name} on ${date} at ${time}. Once the clinic confirms, the +${Math.round(points)} paw points will be pending for verification${getBookingRewardNote(plan, points)}.`;
    }

    const points = calculateBookingPoints([matchingService], plan);
    const requestId = await createBookingRequest(userId, resolvedPetName, matchingService.name, date, time, points);
    await awardPendingPoints(userId, resolvedParentName, resolvedPetName, matchingService.name, points);

    const message = buildWhatsAppMessage(resolvedParentName, resolvedPetName, [matchingService.name], date, time);
    window.open(`https://wa.me/919004290923?text=${encodeURIComponent(message)}`, '_blank');

    return requestId
      ? `Appointment confirmed!\n\nService: ${matchingService.name}\nDate: ${date}\nTime: ${time}\nPaw Points: +${Math.round(points)} (pending verification)${getBookingRewardNote(plan, points)}\n\nWhatsApp sent to 9004290923. The clinic will confirm shortly.`
      : `I created the booking but hit a snag saving it. WhatsApp has been opened — the clinic has your details: ${matchingService.name} on ${date} at ${time}.`;
  }

  if (/reminder|remind|confirm/i.test(lowerPrompt)) {
    const message = buildWhatsAppMessage(resolvedParentName, resolvedPetName, ['Visit'], 'TBD', 'TBD');
    window.open(`https://wa.me/919004290923?text=${encodeURIComponent(message)}`, '_blank');
    return `I have opened a WhatsApp message to Planet Animal Hospital at 9004290923. Use the "Book Visit" button above to set the exact date and time.`;
  }

  if (/upcoming|status|my appointment/i.test(lowerPrompt)) {
    if (!userId) return 'I need you to be signed in to look up your appointments.';
    const bookings = await getUserBookings(userId);
    const pending = bookings.filter((b) => b.status === 'pending');
    if (pending.length === 0) return `No upcoming appointments found for ${resolvedPetName}. Would you like to book one?`;
    const list = pending.map((b, i) => `${i + 1}. ${b.reason} — ${b.date} at ${b.time} (+${b.points} pts)`).join('\n');
    return `Upcoming appointments for ${resolvedPetName}:\n${list}\n\nTotal pending paw points from visits: ${pending.reduce((sum, b) => sum + b.points, 0).toLocaleString()} pts`;
  }

  return 'I can book, cancel, or move appointments for you. Every visit earns Paw Points and auto-confirms via WhatsApp to 9004290923. Try: "Book next vaccine" or "Call Planet Animal Hospital" to reach the clinic directly.';
}

function getBookingRewardNote(plan: string, points: number) {
  const normalizedPlan = plan.toLowerCase();
  if (normalizedPlan === 'free') {
    return points > 0
      ? ' (free General Checkup starter reward)'
      : ' (free plan: no Paw Points for this service)';
  }

  return ` (${getPointsMultiplier(plan).toFixed(1)}x ${normalizedPlan} plan multiplier applied)`;
}

function hasDateTimePrompt(prompt: string) {
  const lowerPrompt = prompt.toLowerCase();
  return /date.*time|time.*date/i.test(prompt) ||
    (/\d{1,2}:\d{2}/i.test(prompt) && /may|june|july|aug|sept|oct|nov|dec|jan|feb|mar|apr|tomorrow|today|next/i.test(lowerPrompt));
}

function findPawlinaService(prompt: string) {
  const normalizedPrompt = prompt.toLowerCase().replace(/check-up/g, 'checkup');
  return PAWLINA_SERVICES.find((service) => {
    const serviceName = service.name.toLowerCase().replace(/check-up/g, 'checkup');
    return normalizedPrompt.includes(serviceName) ||
      (serviceName === 'general checkup' && normalizedPrompt.includes('checkup')) ||
      (serviceName === 'vaccinations' && /vaccine|vaccination|booster|shot/.test(normalizedPrompt)) ||
      (serviceName === 'full grooming' && /groom|spa|bath/.test(normalizedPrompt)) ||
      (serviceName === 'ear cleaning' && /ear/.test(normalizedPrompt)) ||
      (serviceName === 'haircut' && /haircut|trim/.test(normalizedPrompt));
  });
}

// ─── Pritpawl: Life-max roadmap reply builder ───────────────────────────

function buildPritpawlReply(
  prompt: string,
  profile: any,
  state: ReturnType<typeof getAgentState>,
  roadmap: PritpawlRoadmap,
): string {
  const petName = profile?.petName || profile?.name || 'your pet';
  const breed = profile?.breed || roadmap.species || 'mixed breed';
  const age = profile?.age || 'adult';
  const primaryFocus = getRoadmapPrimaryFocus(roadmap);
  const totalPawPoints = getRoadmapTotalPawPoints(roadmap);
  const lowerPrompt = prompt.toLowerCase();

  if (/nutrition|diet|food|feed/i.test(lowerPrompt)) {
    const nutritionTasks = roadmap.phases.flatMap((p) =>
      p.tasks.filter((t) => /nutrition|diet|food|weight|feed/i.test(t.title + t.description)),
    );
    if (nutritionTasks.length === 0) return `${petName}'s roadmap includes nutrition optimization across all phases. Regenerate the roadmap to see full nutrition details.`;
    const lines = nutritionTasks.map((t) => `**${t.title}** (Phase: ${roadmap.phases.find((p) => p.tasks.includes(t))?.title}): ${t.description}`);
    return `Nutrition plan for ${petName} (${breed}):\n\n${lines.join('\n\n')}\n\nAll recommendations follow AAHA Nutritional Assessment Guidelines and Hand et al., Small Animal Clinical Nutrition.`;
  }

  if (/exercise|activity|fitness|walk/i.test(lowerPrompt)) {
    const exerciseTasks = roadmap.phases.flatMap((p) =>
      p.tasks.filter((t) => /exercise|activity|fitness|walk|movement|rehab/i.test(t.title + t.description)),
    );
    if (exerciseTasks.length === 0) return `${petName}'s roadmap includes breed-specific exercise optimization. Regenerate the roadmap to see full details.`;
    const lines = exerciseTasks.map((t) => `**${t.title}** (Phase: ${roadmap.phases.find((p) => p.tasks.includes(t))?.title}): ${t.description}`);
    return `Exercise plan for ${petName} (${breed}):\n\n${lines.join('\n\n')}\n\nProtocol per AVMA guidelines and Canine Rehabilitation & Physical Therapy (Millis, Levine, Taylor).`;
  }

  if (/behavior|psychological|mental|anxiety|stress|cognitive|enrich/i.test(lowerPrompt)) {
    const bhTasks = roadmap.phases.flatMap((p) =>
      p.tasks.filter((t) => /behavior|psychological|mental|anxiety|stress|cognitive|enrich/i.test(t.title + t.description)),
    );
    if (bhTasks.length === 0) return `${petName}'s roadmap includes behavioral and psychological wellness. Regenerate for full details.`;
    const lines = bhTasks.map((t) => `**${t.title}** (Phase: ${roadmap.phases.find((p) => p.tasks.includes(t))?.title}): ${t.description}`);
    return `Behavioral & psychological wellness plan for ${petName} (${breed}):\n\n${lines.join('\n\n')}\n\nBased on AAHA Canine and Feline Behavior Management Guidelines and AAFP/AAHA Environmental Needs Guidelines.`;
  }

  if (/progress|track|complete/i.test(lowerPrompt)) {
    const progress = profile?.roadmapProgress || {};
    const totalTasks = roadmap.phases.reduce((sum, p) => sum + p.tasks.length, 0);
    const completedTasks = roadmap.phases.reduce((sum, p) => sum + p.tasks.filter((t) => progress[t.id]).length, 0);
    const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const phaseBreakdown = roadmap.phases.map((p) => {
      const done = p.tasks.filter((t) => progress[t.id]).length;
      return `${p.title}: ${done}/${p.tasks.length} tasks done (+${getPhasePawPoints(p)} pts on completion)`;
    }).join('\n');
    return `Roadmap progress for ${petName}: **${pct}%** complete (${completedTasks}/${totalTasks} tasks)\n\n${phaseBreakdown}\n\nTotal paw points from roadmap completion: **${totalPawPoints.toLocaleString()} pts**`;
  }

  if (/refill|med/i.test(lowerPrompt)) {
    const meds = roadmap.prescriptionPlan.map((m, i) =>
      `${i + 1}. **${m.name}** — ${m.dosage}, ${m.schedule}\n   Refill: ${m.refillWindow}\n   Purpose: ${m.purpose}`,
    ).join('\n\n');
    return `Medication & supplement plan for ${petName}:\n\n${meds}\n\nNever change prescriptions without veterinary approval.`;
  }

  const phaseList = roadmap.phases.map((p) => {
    const taskTitles = p.tasks.slice(0, 2).map((t) => `- ${t.title}`).join('\n');
    return `**${p.title}** (${p.timeline}) — ${pawPointsToINR(getPhasePawPoints(p))} pts\n${taskTitles}`;
  }).join('\n\n');

  return `Life-maxing roadmap generated for **${roadmap.petName}** (${breed}, age ${age}).\n\n` +
    `Primary focus: **${primaryFocus}**.\n\n${roadmap.summary}\n\n` +
    `${phaseList}\n\n` +
    `Total: **${totalPawPoints.toLocaleString()} paw points** for completing all phases.\n\n` +
    `All recommendations are substantiated by peer-reviewed guidelines from AVMA, AAHA, WSAVA, and published veterinary literature.\n\n` +
    `Ask me about any phase, or say "show nutrition & exercise plan" or "track my roadmap progress."`;
}

function getRoadmapPrimaryFocus(roadmap: PritpawlRoadmap) {
  return roadmap.phases[0]?.focus || roadmap.summary.split('.')[0] || 'preventive longevity';
}

function getPhasePawPoints(phase: PritpawlRoadmap['phases'][number]) {
  return Math.max(500, phase.tasks.length * 250);
}

function getRoadmapTotalPawPoints(roadmap: PritpawlRoadmap) {
  return roadmap.phases.reduce((sum, phase) => sum + getPhasePawPoints(phase), 0);
}

function pawPointsToINR(points: number): string {
  const value = points * 0.25;
  return '₹' + value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildAgentReply(agentId: AgentId, prompt: string, profile: any, state: ReturnType<typeof getAgentState>) {
  const petName = profile?.petName || profile?.name || 'your pet';

  if (agentId === 'pawl') {
    if (/tier/i.test(prompt)) return `${petName} has ${state.points.toLocaleString()} Paw Points. Next tier: ${state.nextTier.title}. Points needed: ${state.pointsToNext.toLocaleString()}.`;
    if (/multiplier/i.test(prompt)) return 'Best multiplier move: book a preventive visit tied to breed risk, then redeem after the next tier unlock.';
    return `Best redemption: hold until ${state.nextTier.title} unless there is an immediate clinical need.`;
  }

  if (agentId === 'pawlina') {
    return 'I can book, cancel, or move appointments for you. Every visit earns Paw Points and auto-confirms via WhatsApp to 9004290923. Try: "Book next vaccine", "Move my appointment", "Call Planet Animal Hospital".';
  }

  return 'I generate breed-customized life-maxing roadmaps. Say "Life-max my pet\'s health" for a full plan covering nutrition, exercise, behavioral & psychological wellness — all backed by peer-reviewed veterinary science.';
}

function AgentAvatar({ agent, large = false, compact = false }: { agent: Agent; large?: boolean; compact?: boolean }) {
  const Avatar = agent.Avatar;
  return (
    <div className={cn('relative shrink-0', large ? 'h-28 w-28' : compact ? 'h-16 w-16' : 'h-20 w-20')}>
      <motion.div className="absolute inset-0 rounded-[1.7rem]" animate={{ rotate: [0, 3, 0, -3, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} style={{ backgroundColor: agent.theme.ring, filter: 'blur(18px)' }} />
      <div className="relative h-full w-full overflow-hidden rounded-[1.65rem] border border-white/25 bg-black shadow-2xl">
        <Avatar />
        <div className="absolute inset-0 bg-gradient-to-br from-white/18 via-transparent to-black/20" />
      </div>
    </div>
  );
}

function StatusPill({ status, color }: { status: string; color: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/28 px-3 py-1.5 backdrop-blur-xl">
      <span className="relative flex h-2 w-2">
        <motion.span className="absolute inline-flex h-full w-full rounded-full opacity-60" animate={{ scale: [1, 2.2, 1], opacity: [0.8, 0, 0.8] }} transition={{ duration: 1.9, repeat: Infinity, ease: 'easeOut' }} style={{ backgroundColor: color }} />
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      </span>
      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/66">{status}</span>
    </div>
  );
}

function TypingIndicator({ color, active }: { color: string; active: boolean }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/24 px-3 py-2">
      {[0, 1, 2].map((dot) => (
        <motion.span key={dot} className="h-1.5 w-1.5 rounded-full" animate={active ? { y: [0, -4, 0], opacity: [0.35, 1, 0.35] } : { opacity: 0.35 }} transition={{ delay: dot * 0.13, duration: 0.8, repeat: Infinity, ease: 'easeInOut' }} style={{ backgroundColor: color }} />
      ))}
    </div>
  );
}

function PawlAvatar() {
  return (
    <svg viewBox="0 0 160 160" role="img" aria-label="Pawl dog loyalty agent avatar" className="h-full w-full">
      <defs><linearGradient id="pawl-bg" x1="20" y1="12" x2="144" y2="150"><stop stopColor="#FFF0A8" /><stop offset="0.5" stopColor="#F59E0B" /><stop offset="1" stopColor="#7C2D12" /></linearGradient></defs>
      <rect width="160" height="160" fill="url(#pawl-bg)" /><path d="M45 71C26 58 24 33 42 27C59 21 72 42 68 66Z" fill="#7C2D12" /><path d="M115 71C134 58 136 33 118 27C101 21 88 42 92 66Z" fill="#7C2D12" /><path d="M35 78C35 45 58 31 80 31C102 31 125 45 125 78C125 111 105 130 80 130C55 130 35 111 35 78Z" fill="#FBBF24" /><path d="M55 82C61 88 70 90 80 90C90 90 99 88 105 82C105 109 95 124 80 124C65 124 55 109 55 82Z" fill="#FFF7D6" /><circle cx="61" cy="72" r="7" fill="#211103" /><circle cx="99" cy="72" r="7" fill="#211103" /><path d="M72 88C74 84 86 84 88 88C90 93 84 98 80 98C76 98 70 93 72 88Z" fill="#211103" /><circle cx="128" cy="116" r="17" fill="#FEC708" /><path d="M122 114C122 109 126 106 130 109C134 106 138 109 138 114C138 121 130 126 130 126C130 126 122 121 122 114Z" fill="#2F1F05" />
    </svg>
  );
}

function PawlinaAvatar() {
  return (
    <svg viewBox="0 0 160 160" role="img" aria-label="Pawlina cat appointment agent avatar" className="h-full w-full">
      <defs><linearGradient id="pawlina-bg" x1="24" y1="10" x2="136" y2="150"><stop stopColor="#FFE4E6" /><stop offset="0.52" stopColor="#FB7185" /><stop offset="1" stopColor="#0F766E" /></linearGradient></defs>
      <rect width="160" height="160" fill="url(#pawlina-bg)" /><path d="M42 72L53 31L74 58Z" fill="#881337" /><path d="M118 72L107 31L86 58Z" fill="#881337" /><path d="M35 77C35 47 56 34 80 34C104 34 125 47 125 77C125 110 105 130 80 130C55 130 35 110 35 77Z" fill="#FDA4AF" /><path d="M66 88C70 93 74 95 80 95C86 95 90 93 94 88" fill="none" stroke="#881337" strokeWidth="4" strokeLinecap="round" /><path d="M74 80C76 77 84 77 86 80C86 85 82 88 80 88C78 88 74 85 74 80Z" fill="#881337" /><path d="M55 72C61 67 68 67 73 72" fill="none" stroke="#4C0519" strokeWidth="4" strokeLinecap="round" /><path d="M87 72C92 67 99 67 105 72" fill="none" stroke="#4C0519" strokeWidth="4" strokeLinecap="round" /><circle cx="118" cy="117" r="17" fill="#FB7185" /><path d="M111 117H125M118 110V124" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function PritpawlAvatar() {
  return (
    <svg viewBox="0 0 160 160" role="img" aria-label="Pritpawl prescription roadmap agent avatar" className="h-full w-full">
      <defs><linearGradient id="prit-bg" x1="18" y1="6" x2="140" y2="152"><stop stopColor="#CCFBF1" /><stop offset="0.5" stopColor="#2DD4BF" /><stop offset="1" stopColor="#0F172A" /></linearGradient></defs>
      <rect width="160" height="160" fill="url(#prit-bg)" /><path d="M42 72C30 52 37 32 58 31C65 42 67 56 61 70Z" fill="#0F172A" /><path d="M118 72C130 52 123 32 102 31C95 42 93 56 99 70Z" fill="#0F172A" /><path d="M35 79C35 47 57 34 80 34C103 34 125 47 125 79C125 111 105 130 80 130C55 130 35 111 35 79Z" fill="#38BDF8" /><rect x="52" y="66" width="22" height="14" rx="7" fill="#0F172A" /><rect x="86" y="66" width="22" height="14" rx="7" fill="#0F172A" /><path d="M74 73H86" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" /><path d="M66 94C74 101 86 101 94 94" fill="none" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" /><rect x="109" y="103" width="29" height="39" rx="13" fill="#E0F2FE" transform="rotate(18 109 103)" /><path d="M117 121L135 127" stroke="#2DD4BF" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

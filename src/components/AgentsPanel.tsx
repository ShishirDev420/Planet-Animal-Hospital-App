import CareAssistant from './CareAssistant';
import CareWorkflow from './CareWorkflow';
import { careSummary } from '../lib/care/domain';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { ArrowRight, CalendarClock, CheckCircle2, ChevronDown, Pill, TicketPercent } from 'lucide-react';
import type { ElementType, ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { PritpawlRoadmap } from '../lib/pritpawlRoadmap';

import { cn } from '../lib/utils';
import './agents-panel.css';

type AgentId = 'pawl' | 'pawlina' | 'pritpawl';
type AgentStatus = 'Guide' | 'Planning';

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
    role: 'Paw Points Guide',
    purpose: 'Earn, redeem, and climb loyalty tiers with less guesswork.',
    description: 'Guides pet parents through Paw Points, reward timing, loyalty tiers, and staff-verified care completion.',
    status: 'Guide',
    cta: 'Open my wallet',
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
    role: 'Follow-up Coordinator',
    purpose: 'Follow recorded care, request appointments, and keep follow-ups visible.',
    description: 'Coordinates approved reminders and appointment requests. Clinical questions go to the care team.',
    status: 'Guide',
    cta: 'Request a visit',
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
    role: 'Care-plan Guide',
    purpose: 'Understand the next step recorded and approved by your veterinarian.',
    description: 'Organizes approved instructions and gathers parent updates. Missing instructions remain unavailable until the team provides them.',
    status: 'Guide',
    cta: 'View health roadmap',
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
  const reduceMotion = useReducedMotion();
  const [chatOpen, setChatOpen] = useState(false);
  const [careOpen, setCareOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { agentId } = useParams();
  const activeAgent = useMemo(() => agents.find((agent) => agent.id === agentId) ?? agents[0], [agentId]);
  const withSearch = (path: string) => {
    if (!location.search) return path;
    return `${path}${path.includes('?') ? '&' : '?'}${location.search.slice(1)}`;
  };

  const selectAgent = (agent: Agent) => {
    navigate(withSearch(`/agents/${agent.id}`));
  };
  const openPrimaryAction = () => {
    const path = activeAgent.id === 'pawl' ? '/rewards' : activeAgent.id === 'pawlina' ? '/?openBooking=true' : '/roadmap';
    navigate(withSearch(path));
  };

  return (
    <section className="agents-page relative min-h-full overflow-hidden px-4 pb-32 pt-8 text-white sm:px-6 lg:px-0 lg:pb-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          key={activeAgent.id}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.35 }}
          className="absolute inset-x-[-20%] top-[-28%] h-[520px] blur-3xl"
          style={{ background: activeAgent.theme.mesh }}
        />
        <div className="absolute inset-0 neural-mesh-grid opacity-[0.08]" />
      </div>

      <motion.div variants={container} initial={reduceMotion ? false : 'hidden'} animate="show" className="mx-auto max-w-6xl">
        <motion.header variants={item} className="agents-heading">
          <p className="agents-eyebrow">Your care team</p>
          <h1>Choose your care agent.</h1>
          <p>Pick a guide, then open recorded care and requests when you need them.</p>
        </motion.header>

        <motion.div variants={item} role="group" aria-label="Choose a care agent" className="agents-choices">
          {agents.map((agent) => (
            <AgentChoice key={agent.id} agent={agent} active={agent.id === activeAgent.id} onClick={() => selectAgent(agent)} />
          ))}
        </motion.div>

        <motion.article key={activeAgent.id} initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.25, 1, 0.5, 1] }} className="agent-focus" style={{ background: activeAgent.theme.mesh, borderColor: activeAgent.theme.ring }}>
          <div className="agent-focus-identity">
            <AgentAvatar agent={activeAgent} />
            <div>
              <p className="agents-eyebrow" style={{ color: activeAgent.theme.accent }}>Selected guide</p>
              <h2>{activeAgent.name}</h2>
              <p className="agent-focus-role">{activeAgent.role}</p>
            </div>
          </div>
          <p className="agent-focus-purpose">{activeAgent.purpose}</p>
          <p className="agent-focus-boundary">{activeAgent.description}</p>
          <button type="button" className="agent-focus-action" style={{ backgroundColor: activeAgent.theme.accent }} onClick={openPrimaryAction}>{activeAgent.cta}<ArrowRight size={18}/></button>
        </motion.article>

        <motion.div variants={item} className="agents-more">
          <details className="agents-disclosure" onToggle={(event) => setChatOpen(event.currentTarget.open)}>
            <summary><span><strong>Ask {activeAgent.name} a question</strong><small>Available when the clinic enables AI chat</small></span><ChevronDown size={19}/></summary>
            {chatOpen && <CareAssistant agent={activeAgent.id} />}
          </details>
          <details className="agents-disclosure" onToggle={(event) => setCareOpen(event.currentTarget.open)}>
            <summary><span><strong>Recorded care and requests</strong><small>Follow-ups, prescriptions, wallet and pet history</small></span><ChevronDown size={19}/></summary>
            {careOpen && <CareWorkflow />}
          </details>
        </motion.div>
      </motion.div>
    </section>
  );
}

function AgentChoice({ agent, active, onClick }: { agent: Agent; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn('agent-choice', active && 'is-active')} style={{ '--agent-mesh': agent.theme.mesh, '--agent-ring': agent.theme.ring, '--agent-glow': agent.theme.glow } as React.CSSProperties} aria-pressed={active}>
      <AgentAvatar agent={agent} compact />
      <span className="agent-choice-copy"><strong>{agent.name}</strong><small>{agent.role}</small></span>
      {active && <CheckCircle2 className="agent-choice-check" size={17} style={{ color: agent.theme.accent }} />}
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
      { label: 'Paw Points', value: state.available ? state.points.toLocaleString() : 'Unavailable' },
      { label: 'Awards', value: 'Staff verified' },
    ];
  }
  if (agentId === 'pawlina') {
    return [
      { label: 'Booking', value: state.bestSlot },
      { label: 'Next step', value: state.bookingSuggestion },
    ];
  }
  return [
    { label: 'Recorded care', value: `${state.completedRoadmapTasks}/${state.totalRoadmapTasks}` },
    { label: 'Focus', value: state.totalRoadmapTasks > 0 ? 'Approved records' : 'Instructions needed' },
  ];
}

function getAgentState(profile: any, care: import('../lib/care/domain').CareState | null, petId: string) {
  const points = care?.ledger.reduce((n,l)=>n+l.points,0) || 0;
  const nextTier = pawPointTiers.find((tier) => tier.points > points) ?? pawPointTiers[pawPointTiers.length - 1];
  return {
    points,
    nextTier,
    pointsToNext: Math.max(0, nextTier.points - points),
    totalRoadmapTasks: care?.milestones.filter(m=>m.petId===petId).length || 0,
    completedRoadmapTasks: care?.milestones.filter(m=>m.petId===petId && m.status==='completed').length || 0,
    available: Boolean(care),

    bookingSuggestion: care?.milestones.find(m=>m.petId===petId && m.status==='approved')?.title || 'Instructions needed',
    bestSlot: care?.milestones.find(m=>m.petId===petId && m.status==='approved')?.booking.status || 'Not recorded',

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
    pawlina: [{ id: 'pawlina-welcome', from: 'agent', text: 'I coordinate approved follow-ups. Use the shared controls to request an appointment; only the clinic can confirm it. Booking does not earn points.' }],
    pritpawl: [{ id: 'pritpawl-welcome', from: 'agent', text: 'I explain recorded, veterinarian-approved instructions and help share updates with the team. I cannot diagnose, approve dates or change treatment.' }],
  };
}

function AgentAvatar({ agent, large = false, compact = false }: { agent: Agent; large?: boolean; compact?: boolean }) {
  const reduceMotion = useReducedMotion();
  const Avatar = agent.Avatar;
  return (
    <div className={cn('relative shrink-0', large ? 'h-28 w-28' : compact ? 'h-16 w-16' : 'h-20 w-20')}>
      <motion.div className="absolute inset-0 rounded-[1.7rem]" animate={reduceMotion ? undefined : { rotate: [0, 3, 0, -3, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} style={{ backgroundColor: agent.theme.ring, filter: 'blur(18px)' }} />
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

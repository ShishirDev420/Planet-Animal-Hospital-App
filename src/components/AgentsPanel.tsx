import { AnimatePresence, motion, type Variants } from 'framer-motion';
import {
  ArrowRight,
  CalendarClock,
  ChevronRight,
  Pill,
  Sparkles,
  TicketPercent,
} from 'lucide-react';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '../lib/utils';

type AgentStatus = 'Online' | 'Busy' | 'Planning';

type AgentTheme = {
  accent: string;
  accentSoft: string;
  glow: string;
  mesh: string;
  ring: string;
};

type Agent = {
  id: 'pawl' | 'pawlina' | 'pritpawl';
  name: string;
  role: string;
  purpose: string;
  description: string;
  status: AgentStatus;
  cta: string;
  theme: AgentTheme;
  quickPrompts: string[];
  metrics: Array<{ label: string; value: string }>;
  Icon: typeof TicketPercent;
  Avatar: () => ReactElement;
};

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.05 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

const AGENTS: Agent[] = [
  {
    id: 'pawl',
    name: 'Pawl',
    role: 'Paw Points Journey Agent',
    purpose: 'Earn, redeem, and climb loyalty tiers with less guesswork.',
    description:
      'Guides pet parents through Paw Points, reward timing, loyalty tiers, and smart visit combos that maximize every clinic interaction.',
    status: 'Online',
    cta: 'Chat Now',
    Icon: TicketPercent,
    theme: {
      accent: '#fec708',
      accentSoft: 'rgba(254, 199, 8, 0.14)',
      glow: 'rgba(254, 199, 8, 0.34)',
      mesh: 'radial-gradient(circle at 18% 18%, rgba(254,199,8,0.36), transparent 30%), radial-gradient(circle at 82% 18%, rgba(245,134,52,0.28), transparent 34%), linear-gradient(145deg, rgba(47,31,5,0.92), rgba(9,19,14,0.96))',
      ring: 'rgba(254, 199, 8, 0.45)',
    },
    quickPrompts: ['Show my tier path', 'Find point multipliers', 'Best redemption today'],
    metrics: [
      { label: 'Reward Scan', value: 'Live' },
      { label: 'Tier Lift', value: '+2.5x' },
    ],
    Avatar: PawlAvatar,
  },
  {
    id: 'pawlina',
    name: 'Pawlina',
    role: 'Appointment Booking Agent',
    purpose: 'Schedule, remind, reschedule, and keep visits moving.',
    description:
      'Helps book appointments, checks availability windows, handles reminder flows, and keeps cancellation or reschedule paths calm.',
    status: 'Online',
    cta: 'Book Now',
    Icon: CalendarClock,
    theme: {
      accent: '#fb7185',
      accentSoft: 'rgba(251, 113, 133, 0.13)',
      glow: 'rgba(251, 113, 133, 0.30)',
      mesh: 'radial-gradient(circle at 20% 22%, rgba(251,113,133,0.32), transparent 32%), radial-gradient(circle at 78% 20%, rgba(45,212,191,0.20), transparent 34%), linear-gradient(145deg, rgba(50,20,31,0.94), rgba(8,25,22,0.96))',
      ring: 'rgba(251, 113, 133, 0.44)',
    },
    quickPrompts: ['Book next vaccine', 'Move my appointment', 'Send visit reminder'],
    metrics: [
      { label: 'Slots Checked', value: '42' },
      { label: 'Reminder ETA', value: '2m' },
    ],
    Avatar: PawlinaAvatar,
  },
  {
    id: 'pritpawl',
    name: 'Pritpawl',
    role: 'Prescription & Roadmap Agent',
    purpose: 'Track prescriptions and turn care plans into daily action.',
    description:
      'Monitors medication schedules, prescription renewals, and personalized health roadmaps so pet care feels visible and manageable.',
    status: 'Planning',
    cta: 'Open Roadmap',
    Icon: Pill,
    theme: {
      accent: '#2dd4bf',
      accentSoft: 'rgba(45, 212, 191, 0.13)',
      glow: 'rgba(45, 212, 191, 0.30)',
      mesh: 'radial-gradient(circle at 22% 18%, rgba(45,212,191,0.32), transparent 32%), radial-gradient(circle at 84% 26%, rgba(56,189,248,0.24), transparent 34%), linear-gradient(145deg, rgba(3,37,37,0.95), rgba(9,19,32,0.96))',
      ring: 'rgba(45, 212, 191, 0.44)',
    },
    quickPrompts: ['Build care roadmap', 'Track meds today', 'Check refill timing'],
    metrics: [
      { label: 'Dose Windows', value: '3' },
      { label: 'Roadmap Sync', value: '94%' },
    ],
    Avatar: PritpawlAvatar,
  },
];

export default function AgentsPanel() {
  const navigate = useNavigate();
  const { agentId } = useParams();
  const selectedAgent = useMemo(
    () => AGENTS.find((agent) => agent.id === agentId) ?? AGENTS[0],
    [agentId],
  );

  const selectAgent = (agent: Agent) => {
    navigate(`/agents/${agent.id}`);
  };

  return (
    <section className="relative min-h-full overflow-hidden px-4 pb-32 pt-6 text-white sm:px-6 lg:px-0 lg:pb-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          key={selectedAgent.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-x-[-20%] top-[-28%] h-[520px] blur-3xl"
          style={{ background: selectedAgent.theme.mesh }}
        />
        <div className="absolute inset-0 neural-mesh-grid opacity-[0.08]" />
        <div className="absolute left-1/2 top-36 h-px w-[82%] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-6xl">
        <motion.header variants={item} className="mb-7 flex flex-col gap-5 lg:mb-9 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 shadow-2xl backdrop-blur-2xl">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-planet-yellow opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-planet-yellow" />
              </span>
              <span className="font-heading text-[10px] font-black uppercase tracking-[0.26em] text-planet-yellow">
                Paw Agent Console
              </span>
            </div>
            <h1 className="font-heading text-4xl font-black leading-[0.92] tracking-tight text-white sm:text-5xl lg:text-7xl">
              Three specialists, one calm care system.
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-white/58 sm:text-base">
              Choose a crisp, purpose-built assistant for loyalty, appointments, or prescription roadmaps. Each agent is tuned for a specific pet-parent workflow.
            </p>
          </div>

          <div className="liquid-glass flex items-center gap-4 rounded-[1.6rem] px-4 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-planet-yellow text-black shadow-[0_0_32px_rgba(254,199,8,0.25)]">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Titanium Order</p>
              <p className="text-sm font-bold text-white">Staggered entry · hover glow · chat transition</p>
            </div>
          </div>
        </motion.header>

        <motion.div variants={container} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {AGENTS.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isSelected={selectedAgent.id === agent.id}
              onSelect={() => selectAgent(agent)}
            />
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedAgent.id}
            variants={item}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -12, transition: { duration: 0.18 } }}
            className="mt-5"
          >
            <AgentDetail agent={selectedAgent} />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </section>
  );
}

function AgentCard({ agent, isSelected, onSelect }: { agent: Agent; isSelected: boolean; onSelect: () => void }) {
  const Icon = agent.Icon;

  return (
    <motion.button
      variants={item}
      whileHover={{ y: -8, scale: 1.015, rotate: isSelected ? 0 : -0.35 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={cn(
        'group relative min-h-[430px] overflow-hidden rounded-[2rem] border p-5 text-left shadow-2xl transition-colors duration-500',
        isSelected ? 'border-white/24 bg-white/[0.10]' : 'border-white/10 bg-white/[0.055] hover:border-white/20',
      )}
      style={{ boxShadow: isSelected ? `0 24px 70px ${agent.theme.glow}` : undefined }}
    >
      <div className="absolute inset-0 opacity-90 transition-opacity duration-500 group-hover:opacity-100" style={{ background: agent.theme.mesh }} />
      <motion.div
        aria-hidden
        className="absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl"
        animate={{ scale: [1, 1.08, 1], opacity: [0.42, 0.65, 0.42] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ backgroundColor: agent.theme.glow }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.16),transparent_35%,rgba(255,255,255,0.04))]" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-5 flex items-start justify-between gap-4">
          <AgentAvatar agent={agent} />
          <StatusPill status={agent.status} color={agent.theme.accent} />
        </div>

        <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.20em] text-white/68 backdrop-blur-xl">
          <Icon size={13} style={{ color: agent.theme.accent }} />
          {agent.role}
        </div>

        <h2 className="font-heading text-3xl font-black tracking-tight text-white">{agent.name}</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-white/76">{agent.purpose}</p>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/48">{agent.description}</p>

        <div className="mt-auto pt-6">
          <div className="mb-5 grid grid-cols-2 gap-3">
            {agent.metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 backdrop-blur-xl">
                <p className="text-[9px] font-black uppercase tracking-[0.20em] text-white/34">{metric.label}</p>
                <p className="mt-1 font-heading text-lg font-black text-white">{metric.value}</p>
              </div>
            ))}
          </div>

          <div
            className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-black text-black shadow-xl transition-transform duration-300 group-hover:translate-x-1"
            style={{ backgroundColor: agent.theme.accent }}
          >
            <span>{agent.cta}</span>
            <ChevronRight size={18} />
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function AgentDetail({ agent }: { agent: Agent }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
      <div className="liquid-glass relative overflow-hidden rounded-[2rem] p-5 sm:p-6">
        <div className="absolute right-0 top-0 h-40 w-40 -translate-y-1/2 translate-x-1/2 rounded-full blur-3xl" style={{ backgroundColor: agent.theme.glow }} />
        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center">
          <AgentAvatar agent={agent} large />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={agent.status} color={agent.theme.accent} />
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/42">
                Routed to /agents/{agent.id}
              </span>
            </div>
            <h3 className="mt-4 font-heading text-3xl font-black leading-none tracking-tight text-white sm:text-4xl">
              {agent.name} is ready.
            </h3>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-white/58">{agent.description}</p>
          </div>
        </div>
      </div>

      <div className="liquid-glass relative overflow-hidden rounded-[2rem] p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Quick Prompts</p>
            <h4 className="mt-1 font-heading text-2xl font-black text-white">Start with intent</h4>
          </div>
          <TypingIndicator color={agent.theme.accent} />
        </div>

        <div className="space-y-3">
          {agent.quickPrompts.map((prompt, index) => (
            <motion.button
              key={prompt}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 * index, duration: 0.35 }}
              whileHover={{ x: 6 }}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-left text-sm font-bold text-white/78 transition-colors hover:bg-white/[0.09]"
            >
              <span>{prompt}</span>
              <ArrowRight size={16} style={{ color: agent.theme.accent }} />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AgentAvatar({ agent, large = false }: { agent: Agent; large?: boolean }) {
  const Avatar = agent.Avatar;

  return (
    <div className={cn('relative shrink-0', large ? 'h-28 w-28' : 'h-24 w-24')}>
      <motion.div
        className="absolute inset-0 rounded-[1.7rem]"
        animate={{ rotate: [0, 3, 0, -3, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        style={{ backgroundColor: agent.theme.ring, filter: 'blur(18px)' }}
      />
      <div className="relative h-full w-full overflow-hidden rounded-[1.65rem] border border-white/25 bg-black shadow-2xl">
        <Avatar />
        <div className="absolute inset-0 bg-gradient-to-br from-white/18 via-transparent to-black/20" />
      </div>
    </div>
  );
}

function StatusPill({ status, color }: { status: AgentStatus; color: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/28 px-3 py-1.5 backdrop-blur-xl">
      <span className="relative flex h-2 w-2">
        <motion.span
          className="absolute inline-flex h-full w-full rounded-full opacity-60"
          animate={{ scale: [1, 2.2, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: 'easeOut' }}
          style={{ backgroundColor: color }}
        />
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      </span>
      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/66">{status}</span>
    </div>
  );
}

function TypingIndicator({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/24 px-3 py-2">
      {[0, 1, 2].map((dot) => (
        <motion.span
          key={dot}
          className="h-1.5 w-1.5 rounded-full"
          animate={{ y: [0, -4, 0], opacity: [0.35, 1, 0.35] }}
          transition={{ delay: dot * 0.13, duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

function PawlAvatar() {
  return (
    <svg viewBox="0 0 160 160" role="img" aria-label="Pawl dog loyalty agent avatar" className="h-full w-full">
      <defs>
        <linearGradient id="pawl-bg" x1="20" y1="12" x2="144" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF0A8" />
          <stop offset="0.5" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#7C2D12" />
        </linearGradient>
        <linearGradient id="pawl-face" x1="42" y1="38" x2="118" y2="132" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE68A" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" fill="url(#pawl-bg)" />
      <circle cx="116" cy="32" r="30" fill="#FEF3C7" opacity="0.42" />
      <path d="M45 71 C26 58 24 33 42 27 C59 21 72 42 68 66 Z" fill="#7C2D12" />
      <path d="M115 71 C134 58 136 33 118 27 C101 21 88 42 92 66 Z" fill="#7C2D12" />
      <path d="M35 78 C35 45 58 31 80 31 C102 31 125 45 125 78 C125 111 105 130 80 130 C55 130 35 111 35 78 Z" fill="url(#pawl-face)" />
      <path d="M55 82 C61 88 70 90 80 90 C90 90 99 88 105 82 C105 109 95 124 80 124 C65 124 55 109 55 82 Z" fill="#FFF7D6" opacity="0.9" />
      <circle cx="61" cy="72" r="7" fill="#211103" />
      <circle cx="99" cy="72" r="7" fill="#211103" />
      <path d="M72 88 C74 84 86 84 88 88 C90 93 84 98 80 98 C76 98 70 93 72 88 Z" fill="#211103" />
      <path d="M44 126 C52 115 65 110 80 110 C95 110 108 115 116 126 L116 160 L44 160 Z" fill="#2F1F05" opacity="0.86" />
      <path d="M53 136 C60 128 70 124 80 124 C90 124 100 128 107 136" fill="none" stroke="#FEC708" strokeWidth="5" strokeLinecap="round" />
      <circle cx="128" cy="116" r="17" fill="#FEC708" />
      <path d="M122 114 C122 109 126 106 130 109 C134 106 138 109 138 114 C138 121 130 126 130 126 C130 126 122 121 122 114 Z" fill="#2F1F05" />
    </svg>
  );
}

function PawlinaAvatar() {
  return (
    <svg viewBox="0 0 160 160" role="img" aria-label="Pawlina cat appointment agent avatar" className="h-full w-full">
      <defs>
        <linearGradient id="pawlina-bg" x1="24" y1="10" x2="136" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFE4E6" />
          <stop offset="0.52" stopColor="#FB7185" />
          <stop offset="1" stopColor="#0F766E" />
        </linearGradient>
        <linearGradient id="pawlina-face" x1="42" y1="28" x2="116" y2="128" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF1F2" />
          <stop offset="1" stopColor="#FDA4AF" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" fill="url(#pawlina-bg)" />
      <circle cx="36" cy="33" r="24" fill="#FFFFFF" opacity="0.25" />
      <path d="M42 72 L53 31 L74 58 Z" fill="#881337" />
      <path d="M118 72 L107 31 L86 58 Z" fill="#881337" />
      <path d="M50 65 L56 44 L68 60 Z" fill="#FDA4AF" />
      <path d="M110 65 L104 44 L92 60 Z" fill="#FDA4AF" />
      <path d="M35 77 C35 47 56 34 80 34 C104 34 125 47 125 77 C125 110 105 130 80 130 C55 130 35 110 35 77 Z" fill="url(#pawlina-face)" />
      <path d="M66 88 C70 93 74 95 80 95 C86 95 90 93 94 88" fill="none" stroke="#881337" strokeWidth="4" strokeLinecap="round" />
      <path d="M74 80 C76 77 84 77 86 80 C86 85 82 88 80 88 C78 88 74 85 74 80 Z" fill="#881337" />
      <path d="M55 72 C61 67 68 67 73 72" fill="none" stroke="#4C0519" strokeWidth="4" strokeLinecap="round" />
      <path d="M87 72 C92 67 99 67 105 72" fill="none" stroke="#4C0519" strokeWidth="4" strokeLinecap="round" />
      <path d="M43 101 L20 94 M44 111 L20 112 M117 101 L140 94 M116 111 L140 112" stroke="#FFF1F2" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
      <rect x="52" y="124" width="56" height="40" rx="18" fill="#134E4A" opacity="0.88" />
      <circle cx="118" cy="117" r="17" fill="#FB7185" />
      <path d="M111 117 H125 M118 110 V124" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function PritpawlAvatar() {
  return (
    <svg viewBox="0 0 160 160" role="img" aria-label="Pritpawl prescription roadmap agent avatar" className="h-full w-full">
      <defs>
        <linearGradient id="prit-bg" x1="18" y1="6" x2="140" y2="152" gradientUnits="userSpaceOnUse">
          <stop stopColor="#CCFBF1" />
          <stop offset="0.5" stopColor="#2DD4BF" />
          <stop offset="1" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="prit-face" x1="42" y1="36" x2="118" y2="130" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E0F2FE" />
          <stop offset="1" stopColor="#38BDF8" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" fill="url(#prit-bg)" />
      <circle cx="120" cy="34" r="24" fill="#FFFFFF" opacity="0.26" />
      <path d="M42 72 C30 52 37 32 58 31 C65 42 67 56 61 70 Z" fill="#0F172A" />
      <path d="M118 72 C130 52 123 32 102 31 C95 42 93 56 99 70 Z" fill="#0F172A" />
      <path d="M35 79 C35 47 57 34 80 34 C103 34 125 47 125 79 C125 111 105 130 80 130 C55 130 35 111 35 79 Z" fill="url(#prit-face)" />
      <rect x="52" y="66" width="22" height="14" rx="7" fill="#0F172A" />
      <rect x="86" y="66" width="22" height="14" rx="7" fill="#0F172A" />
      <path d="M74 73 H86" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
      <path d="M66 94 C74 101 86 101 94 94" fill="none" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
      <path d="M48 126 C56 115 67 110 80 110 C93 110 104 115 112 126 L118 160 L42 160 Z" fill="#0F172A" opacity="0.88" />
      <path d="M57 137 H103" stroke="#2DD4BF" strokeWidth="5" strokeLinecap="round" />
      <rect x="109" y="103" width="29" height="39" rx="13" fill="#E0F2FE" transform="rotate(18 109 103)" />
      <path d="M117 121 L135 127" stroke="#2DD4BF" strokeWidth="5" strokeLinecap="round" />
      <circle cx="40" cy="44" r="12" fill="#0F172A" opacity="0.55" />
      <path d="M34 44 H46 M40 38 V50" stroke="#CCFBF1" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

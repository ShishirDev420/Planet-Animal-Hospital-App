import { Outlet, NavLink } from 'react-router-dom';
import { Home, ShieldPlus, Bot, Map, HeartHandshake } from 'lucide-react';
import { cn } from '../lib/utils';
import SplashScreen from './SplashScreen';

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative overflow-hidden flex justify-center dark:bg-[#071912] dark:text-white/95">
      <SplashScreen />
      {/* Background Blobs for Glassmorphism - Fixed to prevent scroll flickering */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 flex justify-center">
        <div className="relative w-full max-w-md h-full">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-planet-yellow/40 rounded-full blur-3xl opacity-60 animate-blob"></div>
          <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-teal-300/40 rounded-full blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-amber-200/40 rounded-full blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Mobile Container */}
      <div className="w-full max-w-md bg-white/40 backdrop-blur-2xl relative z-10 flex flex-col h-[100dvh] shadow-2xl overflow-hidden border-x border-white/20 dark:bg-neutral-900/40 dark:border-white/10">
        <main className="flex-1 overflow-y-auto pb-24 hide-scrollbar">
          <Outlet />
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 w-full glass-nav px-6 py-4 pb-safe flex justify-between items-center z-50 rounded-t-3xl dark:bg-neutral-900/80 dark:border-white/10">
          <NavItem to="/" icon={<Home size={24} />} label="Home" />
          <NavItem to="/plans" icon={<ShieldPlus size={24} />} label="Plans" />
          <NavItem to="/ai" icon={<Bot size={24} />} label="AI Vet" />
          <NavItem to="/roadmap" icon={<Map size={24} />} label="Roadmap" />
          <NavItem to="/adoption" icon={<HeartHandshake size={24} />} label="Adopt" />
        </nav>
      </div>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center gap-1 transition-all duration-300",
          isActive ? "text-planet-yellow scale-110" : "text-slate-400 hover:text-slate-600"
        )
      }
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );
}

import { Outlet, NavLink } from 'react-router-dom';
import { Home, ShieldPlus, Bot, Map, HeartHandshake } from 'lucide-react';
import { cn } from '../lib/utils';
import SplashScreen from './SplashScreen';

export default function Layout() {
  return (
    <div className="h-screen w-full bg-slate-50 text-black/90 font-sans relative overflow-x-hidden flex justify-center dark:bg-[#071912] dark:text-white/90">
      {/* Noise Overlay for Anti-Banding */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      
      <SplashScreen />
      {/* Background Blobs for Glassmorphism - Fixed to prevent scroll flickering */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 flex justify-center">
        <div className="relative w-full max-w-md h-full">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-planet-yellow/40 rounded-full blur-[120px] opacity-60 animate-blob transform-gpu" style={{ animationDuration: '4s', animationTimingFunction: 'ease-in-out' }}></div>
          <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-teal-300/40 rounded-full blur-[120px] opacity-60 animate-blob transform-gpu" style={{ animationDelay: '2s', animationDuration: '4s', animationTimingFunction: 'ease-in-out' }}></div>
          <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-amber-200/40 rounded-full blur-[120px] opacity-60 animate-blob transform-gpu" style={{ animationDelay: '4s', animationDuration: '4s', animationTimingFunction: 'ease-in-out' }}></div>
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
          <NavItem to="/adoption" icon={<HeartHandshake size={24} />} label="Donate" />
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
          isActive ? "text-black dark:text-white scale-110" : "text-neutral-400 dark:text-neutral-500 hover:text-black dark:hover:text-white"
        )
      }
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );
}

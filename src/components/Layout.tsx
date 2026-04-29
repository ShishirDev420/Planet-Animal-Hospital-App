import { Outlet, NavLink } from 'react-router-dom';
import { Home, ShieldPlus, Bot, Map, HeartHandshake } from 'lucide-react';
import { cn } from '../lib/utils';
import SplashScreen from './SplashScreen';

export default function Layout() {
  return (
    <div className="h-screen w-full bg-slate-50 text-black/90 font-sans relative overflow-x-hidden dark:bg-[#071912] dark:text-white/90">
      {/* Noise Overlay for Anti-Banding */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      
      <SplashScreen />
      {/* Background Blobs for Glassmorphism - Fixed to prevent scroll flickering */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[5%] w-96 h-96 bg-planet-yellow/40 rounded-full blur-[120px] opacity-60 animate-blob transform-gpu" style={{ animationDuration: '4s', animationTimingFunction: 'ease-in-out' }}></div>
        <div className="absolute top-[20%] right-[5%] w-96 h-96 bg-teal-300/40 rounded-full blur-[120px] opacity-60 animate-blob transform-gpu" style={{ animationDelay: '2s', animationDuration: '4s', animationTimingFunction: 'ease-in-out' }}></div>
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-amber-200/40 rounded-full blur-[120px] opacity-60 animate-blob transform-gpu" style={{ animationDelay: '4s', animationDuration: '4s', animationTimingFunction: 'ease-in-out' }}></div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex h-screen w-full">
        {/* Desktop Sidebar */}
        <nav className="w-64 glass-card border-r border-white/20 flex flex-col z-10 dark:bg-neutral-900/40 dark:border-white/10">
          <div className="p-6 border-b border-white/20 dark:border-white/10">
            <h2 className="text-lg font-heading font-bold tracking-tight text-slate-800 dark:text-white">Planet Animal</h2>
            <p className="text-[10px] font-bold text-planet-yellow uppercase tracking-[0.25em]">Hospital & Wellness</p>
          </div>
          <div className="flex-1 py-6 px-4 space-y-2">
            <DesktopNavItem to="/" icon={<Home size={20} />} label="Home" />
            <DesktopNavItem to="/plans" icon={<ShieldPlus size={20} />} label="Plans" />
            <DesktopNavItem to="/ai" icon={<Bot size={20} />} label="AI Vet" />
            <DesktopNavItem to="/roadmap" icon={<Map size={20} />} label="Roadmap" />
            <DesktopNavItem to="/adoption" icon={<HeartHandshake size={20} />} label="Donate" />
          </div>
          <div className="p-4 border-t border-white/20 dark:border-white/10">
            <DesktopNavItem to="/profiles" icon={<span className="text-lg">🐾</span>} label="Switch Profile" />
          </div>
        </nav>
        
        {/* Desktop Main Content */}
        <div className="flex-1 flex justify-center overflow-y-auto">
          <div className="w-full max-w-5xl px-6 py-8">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Mobile Container */}
      <div className="lg:hidden w-full mx-auto bg-white/40 backdrop-blur-2xl relative z-10 flex flex-col h-[100dvh] shadow-2xl overflow-hidden border-x border-white/20 dark:bg-neutral-900/40 dark:border-white/10">
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

function DesktopNavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
          isActive 
            ? "bg-planet-yellow/20 text-black dark:text-white font-semibold" 
            : "text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5"
        }`
      }
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </NavLink>
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

import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, ShieldPlus, Bot, Map, HeartHandshake } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import SplashScreen from './SplashScreen';

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
};

export default function Layout() {
  const location = useLocation();

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
        <nav className="w-64 liquid-glass border-r border-white/5 flex flex-col z-10">
          <div className="p-6 border-b border-white/8">
            <h2 className="text-lg font-heading font-bold tracking-tight text-white">Planet Animal</h2>
            <p className="text-[10px] font-bold text-planet-yellow uppercase tracking-[0.25em]">Hospital & Wellness</p>
          </div>
          <div className="flex-1 py-6 px-4 space-y-1">
            <DesktopNavItem to="/" icon={<Home size={20} />} label="Home" />
            <DesktopNavItem to="/plans" icon={<ShieldPlus size={20} />} label="Plans" />
            <DesktopNavItem to="/ai" icon={<Bot size={20} />} label="AI Vet" />
            <DesktopNavItem to="/roadmap" icon={<Map size={20} />} label="Roadmap" />
            <DesktopNavItem to="/adoption" icon={<HeartHandshake size={20} />} label="Donate" />
          </div>
          <div className="p-4 border-t border-white/8">
            <DesktopNavItem to="/profiles" icon={<span className="text-lg">🐾</span>} label="Switch Profile" />
          </div>
        </nav>
        
        {/* Desktop Main Content */}
        <div className="flex-1 flex justify-center overflow-y-auto">
          <div className="w-full max-w-5xl px-6 py-8">
            <AnimatePresence mode="wait">
              <motion.div key={location.pathname} {...pageTransition}>
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Container */}
      <div className="lg:hidden w-full mx-auto bg-white/40 backdrop-blur-2xl relative z-10 flex flex-col h-[100dvh] shadow-2xl overflow-hidden border-x border-white/20 dark:bg-neutral-900/40 dark:border-white/10">
        <main className="flex-1 overflow-y-auto pb-24 hide-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} {...pageTransition}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation - Premium Liquid Glass */}
        <nav className="absolute bottom-0 w-full liquid-glass-nav px-4 pt-3 pb-8 flex justify-around items-center z-50 rounded-t-3xl border-t border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
          <NavItem to="/" icon={<Home size={22} />} label="Home" />
          <NavItem to="/plans" icon={<ShieldPlus size={22} />} label="Plans" />
          <NavItem to="/ai" icon={<Bot size={22} />} label="AI Vet" isCenter />
          <NavItem to="/roadmap" icon={<Map size={22} />} label="Roadmap" />
          <NavItem to="/adoption" icon={<HeartHandshake size={22} />} label="Donate" />
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
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${
          isActive 
            ? "bg-planet-yellow/15 text-white font-semibold" 
            : "text-neutral-400 hover:text-white hover:bg-white/5"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="desktop-nav-indicator"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-planet-yellow rounded-r-full"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className={isActive ? 'text-planet-yellow' : ''}>{icon}</span>
          <span className="text-sm font-medium">{label}</span>
        </>
      )}
    </NavLink>
  );
}

function NavItem({ to, icon, label, isCenter }: { to: string; icon: React.ReactNode; label: string; isCenter?: boolean }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center gap-0.5 transition-all duration-300 relative",
          isActive ? "text-planet-yellow" : "text-planet-yellow/40 hover:text-planet-yellow"
        )
      }
    >
      {({ isActive }) => (
        <>
          <div className={cn(
            "flex items-center justify-center transition-all duration-300",
            isCenter ? "w-12 h-12 -mt-5 rounded-2xl shadow-lg" : "",
            isCenter && isActive ? "bg-planet-yellow text-black scale-110 shadow-[0_0_20px_rgba(254,199,8,0.4)]" : "",
            isCenter && !isActive ? "bg-white/10 backdrop-blur-xl border border-white/10" : "",
          )}>
            {icon}
          </div>
          <span className={cn(
            "text-[10px] font-semibold tracking-wide transition-all duration-300",
            isCenter ? "mt-1" : "",
          )}>
            {label}
          </span>
          {isActive && (
            <motion.div
              layoutId="mobile-nav-indicator"
              className={cn(
                "absolute -bottom-1 w-4 h-0.5 rounded-full bg-planet-yellow",
                isCenter ? "hidden" : ""
              )}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </>
      )}
    </NavLink>
  );
}

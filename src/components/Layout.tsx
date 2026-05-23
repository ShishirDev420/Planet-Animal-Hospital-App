import { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, ShieldPlus, Bot, Map, HeartHandshake, Smartphone, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import SplashScreen from './SplashScreen';
import PlanetOrbLoader from './PlanetOrbLoader';
import Logo from './Logo';

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as any }
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isInsideFrame = location.search.includes('preview_frame=true');
  const isDesktopPreview = isInsideFrame && location.search.includes('preview_view=desktop');
  const preservedSearch = isInsideFrame || location.search.includes('demo_mode=true') ? location.search : '';
  const preservePreviewSearch = (to: string) => `${to}${preservedSearch}`;
  const previousPathRef = useRef(location.pathname);
  const [routeLoader, setRouteLoader] = useState<null | {
    key: number;
    label: string;
    detail: string;
  }>(null);

  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    setIsDesktop(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const previousPath = previousPathRef.current;
    const nextPath = location.pathname;
    previousPathRef.current = nextPath;

    if (previousPath === nextPath) return;

    const cameFromAgents = previousPath === '/agents' || previousPath.startsWith('/agents/');
    const isMainDashboard = nextPath === '/';
    const isRoadmap = nextPath === '/roadmap';

    if (!cameFromAgents || (!isMainDashboard && !isRoadmap)) return;

    const key = Date.now();
    setRouteLoader({
      key,
      label: isRoadmap ? 'Preparing Health Roadmap' : 'Planet Animal Hospital',
      detail: isRoadmap ? 'Aligning care milestones around your pet' : 'Bringing your main dashboard into focus',
    });

    const timer = window.setTimeout(() => {
      setRouteLoader((current) => (current?.key === key ? null : current));
    }, 920);

    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className="h-screen w-full bg-slate-50 text-black/90 font-sans relative overflow-x-hidden dark:bg-[#071912] dark:text-white/90">
      {/* Noise Overlay for Anti-Banding */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      
      {/* SplashScreen only shows outside preview frame */}
      {!isInsideFrame && <SplashScreen />}
      <AnimatePresence>
        {routeLoader && (
          <PlanetOrbLoader
            key={routeLoader.key}
            fullscreen
            label={routeLoader.label}
            detail={routeLoader.detail}
          />
        )}
      </AnimatePresence>
      {/* Background Blobs for Glassmorphism - Fixed to prevent scroll flickering */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[5%] w-96 h-96 bg-planet-yellow/40 rounded-full blur-[120px] opacity-60 animate-blob transform-gpu" style={{ animationDuration: '4s', animationTimingFunction: 'ease-in-out' }}></div>
        <div className="absolute top-[20%] right-[5%] w-96 h-96 bg-teal-300/40 rounded-full blur-[120px] opacity-60 animate-blob transform-gpu" style={{ animationDelay: '2s', animationDuration: '4s', animationTimingFunction: 'ease-in-out' }}></div>
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-amber-200/40 rounded-full blur-[120px] opacity-60 animate-blob transform-gpu" style={{ animationDelay: '4s', animationDuration: '4s', animationTimingFunction: 'ease-in-out' }}></div>
      </div>

      {/* Desktop Layout */}
      {isDesktop && (!isInsideFrame || isDesktopPreview) && (
        <div className="flex h-screen w-full">
        {/* Desktop Sidebar */}
        <nav className="w-64 liquid-glass border-r border-white/5 flex flex-col z-10">
          <div className="p-8 border-b border-white/8">
            <div className="flex items-center gap-4 mb-4">
              <Logo className="!w-16 !h-16 drop-shadow-[0_0_20px_rgba(254,199,8,0.3)]" />
            </div>
            <h2 className="cinematic-card-title text-2xl" style={{ wordSpacing: '0.15em', letterSpacing: '0.04em' }}>Planet Animal</h2>
            <p className="cinematic-kicker mt-1 text-[10px]" style={{ letterSpacing: '0.32em' }}>Hospital & Wellness</p>
          </div>
          <div className="flex-1 py-6 px-4 space-y-1">
            <DesktopNavItem to={preservePreviewSearch('/')} icon={<Home size={20} />} label="Home" />
            <DesktopNavItem to={preservePreviewSearch('/plans')} icon={<ShieldPlus size={20} />} label="Plans" />
            <DesktopNavItem to={preservePreviewSearch('/ai')} icon={<Bot size={20} />} label="AI Vet" />
            <DesktopNavItem to={preservePreviewSearch('/agents')} icon={<Users size={20} />} label="AI Agents" />
            <DesktopNavItem to={preservePreviewSearch('/roadmap')} icon={<Map size={20} />} label="Roadmap" />
          </div>
          <div className="p-4 border-t border-white/8">
            <DesktopNavItem to={preservePreviewSearch('/profiles')} icon={<span className="text-lg">??</span>} label="Switch Profile" />
          </div>
        </nav>
        
        {/* Desktop Main Content */}
        <div className="flex-1 flex justify-center overflow-y-auto">
          <div className="w-full max-w-[96rem] px-6 py-8 xl:px-10">
            <AnimatePresence mode="wait">
              <motion.div key={location.pathname} {...pageTransition}>
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        </div>
      )}

      {/* Mobile Container (only renders when not showing desktop layout) */}
      {(!isDesktop || (isInsideFrame && !isDesktopPreview)) && (
      <div className="w-full mx-auto bg-white/40 backdrop-blur-2xl relative z-10 flex flex-col h-[100dvh] shadow-2xl overflow-hidden border-x border-white/20 dark:bg-neutral-900/40 dark:border-white/10">
        <main className="flex-1 overflow-y-auto pb-24 hide-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} {...pageTransition}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation - Premium Liquid Glass - Updated with 5 items */}
        <nav className="absolute bottom-0 w-full liquid-glass-nav px-2 pt-3 pb-[calc(env(safe-area-inset-bottom)+2rem)] flex justify-around items-center z-50 rounded-t-3xl border-t border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
          <NavItem to={preservePreviewSearch('/')} icon={<Home size={22} />} label="Home" />
          <NavItem to={preservePreviewSearch('/plans')} icon={<ShieldPlus size={22} />} label="Plans" />
          <NavItem to={preservePreviewSearch('/ai')} icon={<Bot size={22} />} label="AI Vet" isCenter />
          <NavItem to={preservePreviewSearch('/agents')} icon={<Users size={22} />} label="Agents" />
          <NavItem to={preservePreviewSearch('/roadmap')} icon={<Map size={22} />} label="Roadmap" />
        </nav>
      </div>
      )}

      {/* Floating Vibe Toggle (Desktop Only) */}
      {!isInsideFrame && (
        <div className="hidden lg:block fixed bottom-8 right-8 z-[100]">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/preview?path=&device=iphone-16-pro")}
            className="flex items-center gap-3 px-5 py-3 bg-planet-yellow text-black rounded-2xl font-heading font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(254,199,8,0.3)] border border-white/20 backdrop-blur-xl group"
          >
            <Smartphone size={16} className="group-hover:rotate-12 transition-transform" />
            <span>Mobile Preview</span>
          </motion.button>
        </div>
      )}
    </div>
  );
}

function DesktopNavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative "
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

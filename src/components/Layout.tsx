import PlanetOrbLoader from './PlanetOrbLoader';
import RouteTransitionLoader from './RouteTransitionLoader';
import CareReminderNotice from './CareReminderNotice';
import { Suspense, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, ShieldPlus, Bot, Map, HeartHandshake, Users, FileText, ArrowUpRight, Settings } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../lib/utils';
import Logo from './Logo';
import '../desktop.css';
import { isPreviewDemoMode } from '../lib/demoMode';

const pageTransition = {
  initial: { opacity: 0.9, y: 5 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] as any }
};

const mobilePageTransition = {
  initial: { opacity: 0.9 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] as any }
};

const reducedPageTransition = {
  initial: false as const,
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0 }
};

export default function Layout() {
  const location = useLocation();
  const isInsideFrame = location.search.includes('preview_frame=true');
  const isDesktopPreview = isInsideFrame && location.search.includes('preview_view=desktop');
  const previewDevice = new URLSearchParams(location.search).get('preview_device') || '';
  const preservedSearch = isInsideFrame || isPreviewDemoMode(location.search, location.pathname) ? location.search : '';
  const preservePreviewSearch = (to: string) => `${to}${preservedSearch}`;
  const shouldReduceMotion = useReducedMotion();
  const desktopMainRef = useRef<HTMLDivElement | null>(null);
  const mobileMainRef = useRef<HTMLElement | null>(null);

  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  const isMobileShell = !isDesktop || (isInsideFrame && !isDesktopPreview);
  const activePageTransition = shouldReduceMotion ? reducedPageTransition : isMobileShell ? mobilePageTransition : pageTransition;
  const previewSafeAreaStyle = isInsideFrame && !isDesktopPreview ? ({
    '--preview-safe-area-top': previewDevice.includes('iphone') ? '52px' : previewDevice.includes('samsung') ? '44px' : '0px',
    '--preview-safe-area-bottom': previewDevice.includes('iphone') ? '34px' : previewDevice.includes('samsung') ? '28px' : '0px',
  } as CSSProperties) : undefined;

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    setIsDesktop(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    desktopMainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    mobileMainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);


  return (
    <div style={previewSafeAreaStyle} className="fixed inset-0 h-[100dvh] w-full bg-slate-50 text-black/90 font-sans overflow-hidden dark:bg-[#071912] dark:text-white/90">
      <RouteTransitionLoader />
      {/* Noise Overlay for Anti-Banding */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

      {!isMobileShell && (
        <div className="desktop-workspace">
          <a className="desktop-skip" href="#desktop-content">Skip to content</a>
          <aside className="desktop-sidebar">
            <NavLink to={preservePreviewSearch('/')} className="desktop-brand" aria-label="Planet Animal home">
              <Logo className="!w-14 !h-14 !drop-shadow-none" />
              <span><strong>Planet Animal</strong><small>Hospital & Wellness</small></span>
            </NavLink>
            <nav aria-label="Main navigation" className="desktop-navigation">
              <p className="desktop-nav-label">Your care space</p>
              <DesktopNavItem to={preservePreviewSearch('/')} icon={<Home size={19} />} label="Overview" />
              <DesktopNavItem to={preservePreviewSearch('/briefing')} icon={<HeartHandshake size={19} />} label="Daily care" />
              <DesktopNavItem to={preservePreviewSearch('/roadmap')} icon={<Map size={19} />} label="Health roadmap" />
              <DesktopNavItem to={preservePreviewSearch('/records')} icon={<FileText size={19} />} label="Medical records" />
              <p className="desktop-nav-label desktop-nav-label-secondary">Explore & support</p>
              <DesktopNavItem to={preservePreviewSearch('/plans')} icon={<ShieldPlus size={19} />} label="Care plans" />
              <DesktopNavItem to={preservePreviewSearch('/rewards')} icon={<HeartHandshake size={19} />} label="Care wallet" />
              <DesktopNavItem to={preservePreviewSearch('/ai')} icon={<Bot size={19} />} label="AI Vet" />
              <DesktopNavItem to={preservePreviewSearch('/agents')} icon={<Users size={19} />} label="Care agents" />
            </nav>
            <div className="desktop-sidebar-note"><HeartHandshake size={23} aria-hidden="true" /><p>A little care.<br /><strong>A lifetime together.</strong></p><span>Your pet’s wellbeing, in one place.</span></div>
            <div className="desktop-sidebar-footer"><DesktopNavItem to={preservePreviewSearch('/profiles')} icon={<Users size={19} />} label="Switch profile" /></div>
          </aside>
          <div className="desktop-main-column">
            <header className="desktop-topbar">
              <p>Pet parent workspace <span aria-hidden="true">/</span> <strong>{({'/':'Overview','/briefing':'Daily care','/roadmap':'Health roadmap','/records':'Medical records','/plans':'Care plans','/rewards':'Care wallet','/ai':'AI Vet'} as Record<string,string>)[location.pathname] || 'Care agents'}</strong></p>
              <div><span className="desktop-hospital-label">Planet Animal Hospital</span><NavLink to={preservePreviewSearch('/settings')} aria-label="Settings" className="desktop-icon-button"><Settings size={18}/></NavLink></div>
            </header>
            <main id="desktop-content" tabIndex={-1} ref={desktopMainRef} className="desktop-scroll">
              <div className="desktop-page">
                <CareReminderNotice/><motion.div key={location.pathname} {...activePageTransition}>
                  <Suspense fallback={<PlanetOrbLoader label="Planet Animal Hospital" detail="Loading this page" />}><Outlet /></Suspense>
                </motion.div>
                <footer className="desktop-page-footer"><span>Planet Animal Hospital & Wellness</span><NavLink to={preservePreviewSearch('/plans')}>Explore care plans <ArrowUpRight size={14}/></NavLink></footer>
              </div>
            </main>
          </div>
        </div>
      )}

      {/* Mobile Container (only renders when not showing desktop layout) */}
      {(!isDesktop || (isInsideFrame && !isDesktopPreview)) && (
      <div className="mobile-shell w-full mx-auto bg-white/40 backdrop-blur-2xl relative z-10 flex min-h-0 flex-col h-[100dvh] shadow-2xl overflow-hidden border-x border-white/20 dark:bg-neutral-900/40 dark:border-white/10">
        <div aria-hidden="true" className="mobile-shell-orb-field">
          <div className="mobile-shell-orb mobile-shell-orb-yellow" />
          <div className="mobile-shell-orb mobile-shell-orb-green" />
          <div className="mobile-shell-orb mobile-shell-orb-amber" />
        </div>
        <div aria-hidden="true" className="mobile-shell-noise" />

        <main ref={mobileMainRef} className="mobile-scroll-pane relative z-10 min-h-0 flex-1 overflow-y-auto pt-[var(--preview-safe-area-top,0px)] pb-[calc(6rem+var(--preview-safe-area-bottom,0px))] hide-scrollbar">

            <CareReminderNotice/><motion.div key={location.pathname} {...activePageTransition}>
              <Suspense fallback={<PlanetOrbLoader label="Planet Animal Hospital" detail="Loading this page" />}><Outlet /></Suspense>
            </motion.div>

        </main>

        {/* Bottom Navigation - Premium Liquid Glass - Updated with 5 items */}
        <nav className="mobile-bottom-nav fixed inset-x-0 bottom-0 w-full liquid-glass-nav px-2 pt-3 pb-[calc(env(safe-area-inset-bottom)+var(--preview-safe-area-bottom,0px)+2rem)] flex justify-around items-center z-50 rounded-t-3xl border-t border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
          <NavItem to={preservePreviewSearch('/')} icon={<Home size={22} />} label="Home" />
          <NavItem to={preservePreviewSearch('/plans')} icon={<ShieldPlus size={22} />} label="Plans" />
          <NavItem to={preservePreviewSearch('/ai')} icon={<Bot size={22} />} label="AI Vet" isCenter />
          <NavItem to={preservePreviewSearch('/agents')} icon={<Users size={22} />} label="Agents" />
          <NavItem to={preservePreviewSearch('/roadmap')} icon={<Map size={22} />} label="Roadmap" />
        </nav>
      </div>
      )}


    </div>
  );
}

function DesktopNavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return <NavLink to={to} end={to.split('?')[0] === '/'} className={({isActive}) => cn('desktop-nav-item', isActive && 'is-active')}><span aria-hidden="true">{icon}</span><span>{label}</span></NavLink>;
}

function NavItem({ to, icon, label, isCenter }: { to: string; icon: React.ReactNode; label: string; isCenter?: boolean }) { const reduce=useReducedMotion();
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center gap-0.5 transition-all duration-300 relative",
          isActive ? "text-planet-yellow" : "text-white/70 hover:text-white"
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
              transition={reduce?{duration:0}:{ type: "spring", stiffness: 450, damping: 35 }}
            />
          )}
        </>
      )}
    </NavLink>
  );
}

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import PlanetOrbLoader from './PlanetOrbLoader';
import planetLogo from '../assets/planet-logo.png';

const sectionNames: Record<string, string> = {
  '/': 'your care space', '/plans': 'care plans', '/roadmap': 'your health roadmap',
  '/records': 'medical records', '/rewards': 'your care wallet', '/ai': 'AI Vet',
  '/agents': 'your care team', '/briefing': 'daily care',
};

/** A short branded section transition, independent of data-loading readiness. */
export default function RouteTransitionLoader() {
  const { pathname } = useLocation();
  const reduced = useReducedMotion();
  const previousPath = useRef(pathname);
  const [destination, setDestination] = useState<string | null>(null);
  useEffect(() => {
    // Decode the unchanged high-resolution logo before the first section change.
    const image = new Image();
    image.src = planetLogo;
    void image.decode().catch(() => { /* The loader still uses its normal image source. */ });
  }, []);
  useLayoutEffect(() => {
    const changed = previousPath.current !== pathname;
    previousPath.current = pathname;
    if (reduced) { setDestination(null); return; }
    if (!changed) return;
    setDestination(pathname);
    const timer = window.setTimeout(() => setDestination(null), 900);
    return () => window.clearTimeout(timer);
  }, [pathname, reduced]);
  return <AnimatePresence>{destination !== null && !reduced &&
    <PlanetOrbLoader key="section-transition" fullscreen label="Planet Animal Hospital" detail={`Opening ${sectionNames[destination] || 'your next section'}`} className="planet-section-transition" />
  }</AnimatePresence>;
}


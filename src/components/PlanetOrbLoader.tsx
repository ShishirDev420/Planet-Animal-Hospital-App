import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import planetLogo from '../assets/planet-logo.png';
import { cn } from '../lib/utils';
import { mountPlanetMotion } from '../brand-motion/planet-motion.js';

type PlanetOrbLoaderProps = { label?: string; detail?: string; fullscreen?: boolean; compact?: boolean; className?: string };

export default function PlanetOrbLoader({
  label = 'Planet Animal Hospital', detail = 'Loading your pet care',
  fullscreen = false, compact = false, className = '',
}: PlanetOrbLoaderProps) {
  const host = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (host.current) return mountPlanetMotion(host.current, planetLogo);
  }, []);
  return (
    <motion.div role="status" aria-live="polite" aria-atomic="true"
      initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
      className={cn(
        'relative isolate flex flex-col items-center justify-center overflow-hidden text-center',
        fullscreen ? 'fixed inset-0 z-[120] min-h-[100dvh] bg-[#03110c]/95 px-6' : 'min-h-[50vh] px-6 py-14', className,
      )}
    >
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_50%_40%,rgba(254,199,8,0.18),transparent_34%),radial-gradient(circle_at_20%_80%,rgba(20,184,166,0.13),transparent_30%),linear-gradient(145deg,#03110c_0%,#071912_54%,#020806_100%)]" />
      <div aria-hidden="true" className="pointer-events-none relative w-full" style={{ maxWidth: compact ? 280 : 380 }}>
        <div ref={host} data-planet-motion style={{ display: 'contents' }} />
      </div>
      <div className="relative z-10 max-w-[19rem]">
        <p className="font-heading text-xl font-black leading-tight text-white sm:text-2xl">{label}</p>
        <p className="mt-2 text-sm font-medium leading-relaxed text-[#ffe9a3]/85">{detail}</p>
      </div>
    </motion.div>
  );
}

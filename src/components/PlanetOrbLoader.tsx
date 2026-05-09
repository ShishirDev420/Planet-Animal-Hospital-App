import { motion, useReducedMotion } from 'framer-motion';
import planetLogo from '../assets/planet-logo.png';
import { cn } from '../lib/utils';

type PlanetOrbLoaderProps = {
  label?: string;
  detail?: string;
  fullscreen?: boolean;
  compact?: boolean;
  className?: string;
};

const ringTransition = {
  duration: 3.8,
  repeat: Infinity,
  ease: 'linear' as const,
};

export default function PlanetOrbLoader({
  label = 'Planet Animal Hospital',
  detail = 'Preparing your pet care universe',
  fullscreen = false,
  compact = false,
  className = '',
}: PlanetOrbLoaderProps) {
  const reduceMotion = useReducedMotion();
  const logoSize = compact ? 'h-20 w-20' : 'h-28 w-28 sm:h-32 sm:w-32';

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative isolate flex flex-col items-center justify-center overflow-hidden text-center',
        fullscreen ? 'fixed inset-0 z-[120] min-h-[100dvh] bg-[#03110c]/95 px-6' : 'min-h-[50vh] px-6 py-14',
        className
      )}
    >
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_50%_40%,rgba(254,199,8,0.18),transparent_34%),radial-gradient(circle_at_20%_80%,rgba(20,184,166,0.13),transparent_30%),linear-gradient(145deg,#03110c_0%,#071912_54%,#020806_100%)]" />
      <div className="absolute inset-0 -z-10 planet-loader-ambient opacity-80" />

      <motion.div
        initial={reduceMotion ? false : { scale: 0.94, opacity: 0, y: 8 }}
        animate={reduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { scale: 0.98, opacity: 0, y: -6 }}
        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col items-center"
      >
        <div className={cn('planet-orb-stage relative grid place-items-center', compact ? 'h-44 w-44' : 'h-64 w-64 sm:h-72 sm:w-72')}>
          {!reduceMotion && (
            <>
              <motion.div
                className="absolute inset-8 rounded-full border border-[#fec708]/25 shadow-[0_0_72px_rgba(254,199,8,0.28)]"
                animate={{ rotate: 360 }}
                transition={ringTransition}
              />
              <motion.div
                className="absolute inset-3 rounded-full border border-dashed border-teal-200/20"
                animate={{ rotate: -360 }}
                transition={{ ...ringTransition, duration: 5.4 }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-[conic-gradient(from_90deg,transparent,rgba(254,199,8,0.42),rgba(255,246,204,0.18),rgba(45,212,191,0.18),transparent)] blur-xl"
                animate={{ rotate: 360, scale: [1, 1.045, 1] }}
                transition={{ rotate: { ...ringTransition, duration: 6.5 }, scale: { duration: 2.2, repeat: Infinity, ease: [0.25, 1, 0.5, 1] } }}
              />
              <motion.div
                className="absolute h-2.5 w-2.5 rounded-full bg-[#fff3bf] shadow-[0_0_22px_rgba(254,199,8,0.95)]"
                animate={{ rotate: 360 }}
                transition={{ ...ringTransition, duration: 2.8 }}
                style={{ transformOrigin: compact ? '0 84px' : '0 128px' }}
              />
            </>
          )}

          <motion.div
            className={cn(
              'relative grid place-items-center rounded-full border border-white/15 bg-[#fec708] shadow-[0_0_42px_rgba(254,199,8,0.5),inset_0_1px_24px_rgba(255,255,255,0.32)]',
              logoSize
            )}
            animate={reduceMotion ? undefined : { scale: [1, 1.035, 1], filter: ['brightness(1)', 'brightness(1.08)', 'brightness(1)'] }}
            transition={{ duration: 1.9, repeat: Infinity, ease: [0.25, 1, 0.5, 1] }}
          >
            <img
              src={planetLogo}
              alt="Planet Animal Hospital"
              className="h-full w-full rounded-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_22%,rgba(255,255,255,0.42),transparent_30%)]" />
          </motion.div>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : 0.18, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="-mt-4 max-w-[19rem]"
        >
          <p className="font-heading text-xl font-black leading-tight text-white sm:text-2xl">
            {label}
          </p>
          <p className="mt-2 text-xs font-semibold leading-relaxed tracking-[0.08em] text-[#ffe9a3]/75">
            {detail}
          </p>
        </motion.div>

        {!reduceMotion && (
          <div className="mt-6 h-1 w-32 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-[#fec708] shadow-[0_0_18px_rgba(254,199,8,0.85)]"
              initial={{ x: '-100%' }}
              animate={{ x: '110%' }}
              transition={{ duration: 1.25, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

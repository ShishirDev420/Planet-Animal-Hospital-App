import { useLayoutEffect, useRef } from 'react';
import planetLogo from '../assets/planet-logo.png';
import { mountPlanetMotion } from '../brand-motion/planet-motion.js';
import './planet-soul.css';

type PlanetMotionOptions = {
  ambient?: boolean;
  ambientContainer?: HTMLElement | null;
  motionControl?: HTMLButtonElement | null;
};

type PlanetSoulProps = {
  className?: string;
  compact?: boolean;
  showMotionControl?: boolean;
};

export default function PlanetSoul({
  className = '',
  compact = false,
  showMotionControl = true,
}: PlanetSoulProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const motionControlRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    return (mountPlanetMotion as unknown as (
      host: HTMLElement,
      logoSrc: string,
      options: PlanetMotionOptions,
    ) => () => void)(stage, planetLogo, {
      ambient: false,
      ambientContainer: stage.parentElement,
      motionControl: motionControlRef.current,
    });
  }, []);

  return (
    <figure className={`planet-soul${compact ? ' planet-soul--compact' : ''}${className ? ` ${className}` : ''}`}>
      <div ref={stageRef} className="planet-soul__stage" />
      <figcaption className="planet-soul__caption">
        <span>stays with you</span>
        {showMotionControl && (
          <button
            ref={motionControlRef}
            type="button"
            className="planet-soul__motion-control"
            aria-pressed="false"
          >
            Pause motion
          </button>
        )}
      </figcaption>
    </figure>
  );
}

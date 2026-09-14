import { createContext, useCallback, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import planetLogo from '../assets/planet-logo.png';
import './planet-loader.css';

type Request = { label?: string; detail?: string; className?: string };
const LoadingContext = createContext<((id: symbol, request: Request | null) => void) | null>(null);

/** All loading gates register here; only this owner renders the screen. */
export function PlanetLoadingProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState(new Map<symbol, Request>());
  const register = useCallback((id: symbol, request: Request | null) => {
    setRequests(current => {
      const next = new Map(current);
      if (request) next.set(id, request); else next.delete(id);
      return next;
    });
  }, []);
  const active = Array.from(requests.values());
  // Genuine loading takes precedence over the optional navigation flourish.
  const request = active.find(item => !item.className?.includes('planet-section-transition')) ?? active[0];
  return <LoadingContext.Provider value={register}>{children}{createPortal(
    <OrbScreen active={!!request} {...request} />, document.body,
  )}</LoadingContext.Provider>;
}

function OrbScreen({ active = true, label = 'Planet Animal Hospital', detail = 'Loading your pet care', className = '' }: Request & { active?: boolean }) {
  return <div className={`planet-loading-screen ${className}`} hidden={!active} role="status" aria-live="polite" aria-atomic="true" data-planet-loading-screen>
    <div className="planet-loading-orb" aria-hidden="true">
      <div className="planet-loading-halo" />
      <div className="planet-loading-ring planet-loading-ring-outer" />
      <div className="planet-loading-ring planet-loading-ring-inner" />
      <div className="planet-loading-orbit"><i /></div>
      <img src={planetLogo} alt="" width="128" height="128" decoding="sync" fetchPriority="high" />
    </div>
    <div className="planet-loading-copy"><p>{label}</p><span>{detail}</span></div>
  </div>;
}

type Props = Request & { fullscreen?: boolean; compact?: boolean };
export default function PlanetOrbLoader({ label, detail, className }: Props) {
  const register = useContext(LoadingContext);
  const id = useRef(Symbol('loading-request'));
  useLayoutEffect(() => {
    if (!register) return;
    register(id.current, { label, detail, className });
    return () => register(id.current, null);
  }, [register, label, detail, className]);
  return register ? null : <OrbScreen label={label} detail={detail} className={className} />;
}

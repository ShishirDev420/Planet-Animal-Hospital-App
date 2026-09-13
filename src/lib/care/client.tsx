import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import type { CareState, PilotConfig, Role } from './domain';
import { useLocation } from 'react-router-dom';
import { isPreviewDemoMode } from '../demoMode';

export async function careRequest(body?: Record<string, unknown>, query = '') {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in to view your recorded care.');
  const response = await fetch(`/api/care${query}`, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${await user.getIdToken()}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) throw new Error('The care service is unavailable. Contact the clinic for your next step.');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Care request failed; please retry.');
  return data;
}
type Workspace = { state: CareState | null; role: Role; config: PilotConfig | null; loading: boolean; error: string; petId: string; setPetId: (id: string) => void; refresh: () => Promise<void>; command: (body: Record<string, unknown>) => Promise<void> };
const Context = createContext<Workspace | null>(null);
// Used only by the isolated local review entry, excluded from production routes.
export const CareReviewProvider = Context.Provider;
export function CareProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const visualDemo = isPreviewDemoMode(location.search, location.pathname);
  const [state, setState] = useState<CareState | null>(null), [role, setRole] = useState<Role>('parent'), [config, setConfig] = useState<PilotConfig | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [petId, setPetId] = useState('primary');
  const generation = useRef(0), seq = useRef(0);
  const accept = (data: any) => { setState(data.state); setRole(data.role); setConfig(data.config); setPetId(current => data.state.pets.some((p:any) => p.id === current) ? current : data.state.pets[0]?.id || 'primary'); setError(''); };
  const refresh = async () => {
    if (visualDemo) { setState(null); setError('Visual preview only. Recorded care is available in the signed-in app; use the isolated care review for test data.'); setLoading(false); return; }
    const g = generation.current, request = ++seq.current;
    try { const data = await careRequest(); if (g === generation.current && request === seq.current) accept(data); }
    catch (e) { if (g === generation.current && request === seq.current) { setState(null); setError((e as Error).message); } }
    finally { if (g === generation.current) setLoading(false); }
  };
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => { generation.current++; setState(null); setRole('parent'); setConfig(null); setPetId('primary'); setLoading(true); void refresh(); });
    const focus = () => { if (!document.hidden) void refresh(); };
    window.addEventListener('focus', focus);
    const timer = window.setInterval(focus, 60000);
    return () => { generation.current++; unsubscribe(); clearInterval(timer); window.removeEventListener('focus', focus); };
  }, [visualDemo]);
  const command = async (body: Record<string, unknown>) => {
    if (visualDemo) throw new Error('Visual previews cannot change patient care records.');
    const g = generation.current; const uid = auth.currentUser?.uid;
    const data = await careRequest({ ...body, petId: body.petId || petId });
    if (g === generation.current && uid === auth.currentUser?.uid) { seq.current++; accept(data); }
  };
  return <Context.Provider value={{ state, role, config, loading, error, petId, setPetId, refresh, command }}>{children}</Context.Provider>;
}
export function useCare() { const value = useContext(Context); if (!value) throw new Error('CareProvider is required'); return value; }

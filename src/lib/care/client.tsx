import { requestCareJson } from './request';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import type { CareState, PilotConfig, Role } from './domain';
import { useLocation } from 'react-router-dom';
import { isPreviewDemoMode, assertLiveCareAccess } from '../demoMode';

export async function careRequest(body?: Record<string, unknown>, query = '') {
  assertLiveCareAccess();
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in to view your recorded care.');
  const data = await requestCareJson(`/api/care${query}`, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${await user.getIdToken()}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (auth.currentUser?.uid !== user.uid) throw new Error('Account changed. Reopen the care record.');

  return data;
}
type Workspace = { state: CareState | null; role: Role; config: PilotConfig | null; loading: boolean; error: string; petId: string; setPetId: (id: string) => void; refresh: () => Promise<void>; command: (body: Record<string, unknown>) => Promise<void> };
const Context = createContext<Workspace | null>(null);
const selectedPetKey = (uid: string) => `planet_animal_selected_pet:${uid}`;
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
    const g = generation.current, request = ++seq.current; setLoading(true);
    try { const data = await careRequest(); if (g === generation.current && request === seq.current) accept(data); }
    catch (e) { if (g === generation.current && request === seq.current) { setError((e as Error).message); } }
    finally { if (g === generation.current && request === seq.current) setLoading(false); }
  };
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => { generation.current++; setState(null); setRole('parent'); setConfig(null); try { setPetId(user ? localStorage.getItem(selectedPetKey(user.uid)) || 'primary' : 'primary'); } catch { setPetId('primary'); } setLoading(true); void refresh(); });
    const focus = () => { if (!document.hidden) void refresh(); };
    window.addEventListener('focus', focus);
    const timer = window.setInterval(focus, 60000);
    return () => { generation.current++; unsubscribe(); clearInterval(timer); window.removeEventListener('focus', focus); };
  }, [visualDemo]);
  const command = async (body: Record<string, unknown>) => {
    if (visualDemo) throw new Error('Visual previews cannot change patient care records.');
    const g = generation.current; const uid = auth.currentUser?.uid;
    const data = await careRequest({ ...body, petId: body.petId || petId });
    if (g !== generation.current || uid !== auth.currentUser?.uid) throw new Error('Account changed. Reopen the care record.');
    // A save supersedes an older refresh, including its loading state.
    seq.current++; accept(data); setLoading(false);
  };
  const selectPet = (id: string) => {
    setPetId(id);
    const uid = auth.currentUser?.uid;
    if (uid) { try { localStorage.setItem(selectedPetKey(uid), id); } catch { /* Selection remains active for this visit. */ } }
  };
  return <Context.Provider value={{ state, role, config, loading, error, petId, setPetId: selectPet, refresh, command }}>{children}</Context.Provider>;
}
export function useCare() { const value = useContext(Context); if (!value) throw new Error('CareProvider is required'); return value; }

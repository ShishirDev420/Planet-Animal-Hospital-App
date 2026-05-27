/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, authPersistenceReady, db, checkFirebaseHealth } from './lib/firebase';
import { isPreviewDemoMode } from './lib/demoMode';
import Layout from './components/Layout';
import Welcome from './pages/Welcome';
import ErrorBoundary from './components/ErrorBoundary';
import PlanetOrbLoader from './components/PlanetOrbLoader';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProactivePlans = lazy(() => import('./pages/ProactivePlans'));
const AIVet = lazy(() => import('./pages/AIVet'));
const AIAgents = lazy(() => import('./pages/AIAgents'));
const ProfileSelection = lazy(() => import('./pages/ProfileSelection'));
const CreateProfile = lazy(() => import('./pages/CreateProfile'));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'));
const Roadmap = lazy(() => import('./pages/Roadmap'));
const Adoption = lazy(() => import('./pages/Adoption'));
const Rewards = lazy(() => import('./pages/Rewards'));
const DailyBriefing = lazy(() => import('./pages/DailyBriefing'));
const MedicalRecords = lazy(() => import('./pages/MedicalRecords'));
const MobilePreview = lazy(() => import('./components/MobilePreview'));

type AuthStatus = 'loading' | 'unauthenticated' | 'onboarding' | 'authenticated' | 'profile-sync-error';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if we are already inside the preview frame to avoid recursion
  const isInsideFrame = location.search.includes('preview_frame=true');
  const isDemoMode = isPreviewDemoMode(location.search, location.pathname);
  const isPreviewRoute = location.pathname === '/preview';
  const startupRedirectHandledRef = useRef(false);

  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    if (isDemoMode) {
      setAuthStatus('authenticated');
      return;
    }

    let loadingTimeout: number | null = null;
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    const fetchUserDocWithRetry = async (uid: string, attempt = 1): Promise<AuthStatus> => {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (!userDoc.exists() || !userDoc.data()?.petName || userDoc.data()?.petName === 'Pending') {
          return 'onboarding';
        }
        return 'authenticated';
      } catch (e: any) {
        console.error(`[Auth] Firestore read attempt ${attempt} failed:`, e.code, e.message);
        if (attempt < 3) {
          const delay = 2000 * Math.pow(2, attempt - 1);
          await new Promise((res) => window.setTimeout(res, delay));
          return fetchUserDocWithRetry(uid, attempt + 1);
        }
        console.error('[Auth] Firestore read exhausted all retries. Keeping session, but blocking dummy profile fallback.');
        return 'profile-sync-error';
      }
    };

    authPersistenceReady.finally(() => {
      if (cancelled) return;

      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (cancelled) return;
        if (user) {
          const nextStatus = await fetchUserDocWithRetry(user.uid);
          if (!cancelled) setAuthStatus(nextStatus);
        } else {
          setAuthStatus('unauthenticated');
        }
      });
    });

    loadingTimeout = window.setTimeout(() => {
      setAuthStatus((current) => (current === 'loading' ? 'unauthenticated' : current));
    }, 20000);

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
      if (loadingTimeout) window.clearTimeout(loadingTimeout);
    };
  }, [isDemoMode]);

  useEffect(() => {
    if (authStatus === 'loading' || isPreviewRoute || isInsideFrame || startupRedirectHandledRef.current) {
      return;
    }

    startupRedirectHandledRef.current = true;
  }, [authStatus, isPreviewRoute, isInsideFrame]);

  useEffect(() => {
    checkFirebaseHealth().then(({ auth: authReachable, firestore: fsReachable }) => {
      if (!authReachable || !fsReachable) {
        console.error('[App] Firebase health check failed. Auth:', authReachable, 'Firestore:', fsReachable);
      }
    });
  }, []);

  if (authStatus === 'loading') {
    return (
      <PlanetOrbLoader
        fullscreen
        label="Planet Animal Hospital"
        detail="Syncing the main care dashboard"
      />
    );
  }

  if (authStatus === 'profile-sync-error') {
    return (
      <PlanetOrbLoader
        fullscreen
        label="Restoring Your Profile"
        detail="You're still signed in. Reconnecting to your saved pet profile."
      />
    );
  }

  return (
    <div className="dark min-h-screen bg-slate-950 text-white font-sans antialiased">
      <ErrorBoundary>
        <Suspense
          fallback={
            <PlanetOrbLoader
              fullscreen
              label="Planet Animal Hospital"
              detail="Loading your care workspace"
            />
          }
        >
          {isPreviewRoute && !isInsideFrame ? (
            <Routes>
              <Route path="/preview" element={<MobilePreview />} />
              <Route path="*" element={<Navigate to="/preview" replace />} />
            </Routes>
          ) : (
            <Routes>
              {authStatus === 'unauthenticated' || authStatus === 'onboarding' ? (
                <>
                  <Route path="/" element={<Welcome key={authStatus} initialOnboarding={authStatus === 'onboarding'} onComplete={() => setAuthStatus('authenticated')} />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </>
              ) : (
                <>
                  <Route path="/profiles" element={<ProfileSelection />} />
                  <Route path="/create-profile" element={<CreateProfile />} />
                  <Route path="/settings" element={<ProfileSettings />} />
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="plans" element={<ProactivePlans />} />
                    <Route path="ai" element={<AIVet />} />
                    <Route path="agents" element={<AIAgents />} />
                    <Route path="agents/:agentId" element={<AIAgents />} />
                    <Route path="roadmap" element={<Roadmap />} />
                    <Route path="adoption" element={<Adoption />} />
                    <Route path="rewards" element={<Rewards />} />
                    <Route path="briefing" element={<DailyBriefing />} />
                    <Route path="records" element={<MedicalRecords />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/" replace />} />
                </>
              )}
            </Routes>
          )}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

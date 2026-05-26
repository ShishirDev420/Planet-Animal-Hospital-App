/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, checkFirebaseHealth } from './lib/firebase';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProactivePlans from './pages/ProactivePlans';
import AIVet from './pages/AIVet';
import AIAgents from './pages/AIAgents';
import ProfileSelection from './pages/ProfileSelection';
import CreateProfile from './pages/CreateProfile';
import ProfileSettings from './pages/ProfileSettings';
import Roadmap from './pages/Roadmap';
import Welcome from './pages/Welcome';
import Adoption from './pages/Adoption';
import Rewards from './pages/Rewards';
import DailyBriefing from './pages/DailyBriefing';
import MedicalRecords from './pages/MedicalRecords';
import MobilePreview from './components/MobilePreview';
import ErrorBoundary from './components/ErrorBoundary';
import PlanetOrbLoader from './components/PlanetOrbLoader';

type AuthStatus = 'loading' | 'unauthenticated' | 'onboarding' | 'authenticated';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if we are already inside the preview frame to avoid recursion
  const isInsideFrame = location.search.includes('preview_frame=true');
  const isDemoMode = location.search.includes('demo_mode=true');
  const isPreviewRoute = location.pathname === '/preview';
  const startupRedirectHandledRef = useRef(false);

  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    if (isDemoMode) {
      setAuthStatus('authenticated');
      return;
    }

    let loadingTimeout: number | null = null;

    const fetchUserDocWithRetry = async (uid: string, attempt = 1): Promise<boolean> => {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (!userDoc.exists() || !userDoc.data()?.petName || userDoc.data()?.petName === 'Pending') {
          return false; // needs onboarding
        }
        return true; // authenticated
      } catch (e: any) {
        console.error(`[Auth] Firestore read attempt ${attempt} failed:`, e.code, e.message);
        if (attempt < 3) {
          const delay = 2000 * Math.pow(2, attempt - 1);
          await new Promise((res) => window.setTimeout(res, delay));
          return fetchUserDocWithRetry(uid, attempt + 1);
        }
        console.error('[Auth] Firestore read exhausted all retries. Keeping user authenticated to prevent lockout.');
        return true; // stay authenticated instead of signing out
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const isFullyOnboarded = await fetchUserDocWithRetry(user.uid);
        setAuthStatus(isFullyOnboarded ? 'authenticated' : 'onboarding');
      } else {
        setAuthStatus('unauthenticated');
      }
    });

    loadingTimeout = window.setTimeout(() => {
      setAuthStatus((current) => (current === 'loading' ? 'unauthenticated' : current));
    }, 20000);

    return () => {
      unsubscribe();
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

  return (
    <div className="dark min-h-screen bg-slate-950 text-white font-sans antialiased">
      <ErrorBoundary>
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
      </ErrorBoundary>
    </div>
  );
}

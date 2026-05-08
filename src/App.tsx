/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
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
import MobilePreview from './components/MobilePreview';
import ErrorBoundary from './components/ErrorBoundary';

type AuthStatus = 'loading' | 'unauthenticated' | 'onboarding' | 'authenticated';

export default function App() {
  const location = useLocation();
  
  // Check if we are already inside the preview frame to avoid recursion
  const isInsideFrame = location.search.includes('preview_frame=true');
  const isDemoMode = location.search.includes('demo_mode=true');
  const isPreviewRoute = location.pathname === '/preview';

  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    if (isDemoMode) {
      setAuthStatus('authenticated');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists() || !userDoc.data()?.petName || userDoc.data()?.petName === 'Pending') {
            setAuthStatus('onboarding');
          } else {
            setAuthStatus('authenticated');
          }
        } catch (e) {
          console.error("Error fetching user doc during auth state change:", e);
          // Hard-code logic: If we fail to fetch the user doc, sign them out and revert to the sign-in page.
          // This prevents returning users from being incorrectly pushed into the onboarding flow.
          import('firebase/auth').then(({ signOut }) => signOut(auth));
          setAuthStatus('unauthenticated');
        }
      } else {
        setAuthStatus('unauthenticated');
      }
    });
    return () => unsubscribe();
  }, [isDemoMode]);

  if (authStatus === 'loading') {
    return null; // or a loading spinner
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

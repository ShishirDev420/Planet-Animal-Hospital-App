/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProactivePlans from './pages/ProactivePlans';
import AIVet from './pages/AIVet';
import ProfileSelection from './pages/ProfileSelection';
import CreateProfile from './pages/CreateProfile';
import ProfileSettings from './pages/ProfileSettings';
import Roadmap from './pages/Roadmap';
import Welcome from './pages/Welcome';

// Placeholders for other routes
const Placeholder = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-full">
    <div className="glass-card p-8 rounded-3xl text-center max-w-[80%]">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
      <p className="text-slate-500 text-sm">Coming soon in Phase 2.</p>
    </div>
  </div>
);

import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';

type AuthStatus = 'loading' | 'unauthenticated' | 'onboarding' | 'authenticated';

export default function App() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists() || !userDoc.data()?.petName) {
            setAuthStatus('onboarding');
          } else {
            setAuthStatus('authenticated');
          }
        } catch (e) {
          console.error("Error fetching user doc during auth state change:", e);
          setAuthStatus('onboarding'); // Fallback to onboarding if missing
        }
      } else {
        setAuthStatus('unauthenticated');
      }
    });
    return () => unsubscribe();
  }, []);

  if (authStatus === 'loading') {
    return null; // or a loading spinner
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {authStatus === 'unauthenticated' || authStatus === 'onboarding' ? (
              <Route path="*" element={<Welcome initialOnboarding={authStatus === 'onboarding'} onComplete={() => setAuthStatus('authenticated')} />} />
            ) : (
              <>
                <Route path="/profiles" element={<ProfileSelection />} />
                <Route path="/create-profile" element={<CreateProfile />} />
                <Route path="/settings" element={<ProfileSettings />} />
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="plans" element={<ProactivePlans />} />
                  <Route path="ai" element={<AIVet />} />
                  <Route path="roadmap" element={<Roadmap />} />
                  <Route path="adoption" element={<Placeholder title="Adoption Community" />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}


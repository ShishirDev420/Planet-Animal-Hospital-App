/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProactivePlans from './pages/ProactivePlans';
import AIVet from './pages/AIVet';
import ProfileSelection from './pages/ProfileSelection';
import CreateProfile from './pages/CreateProfile';
import ProfileSettings from './pages/ProfileSettings';
import Roadmap from './pages/Roadmap';

// Placeholders for other routes
const Placeholder = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-full">
    <div className="glass-card p-8 rounded-3xl text-center max-w-[80%]">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
      <p className="text-slate-500 text-sm">Coming soon in Phase 2.</p>
    </div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
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
      </Routes>
    </BrowserRouter>
  );
}


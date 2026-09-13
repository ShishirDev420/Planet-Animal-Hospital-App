// Local review entry only; not imported by the application or production build.
import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import PlanetOrbLoader from './components/PlanetOrbLoader';
import './index.css';
createRoot(document.getElementById('root')!).render(
  <StrictMode><PlanetOrbLoader fullscreen detail="Loading your care plan" /></StrictMode>,
);

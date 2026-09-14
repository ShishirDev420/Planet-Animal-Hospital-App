import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { PlanetLoadingProvider } from './components/PlanetOrbLoader';
import { CareProvider } from './lib/care/client';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PlanetLoadingProvider><CareProvider><App /></CareProvider></PlanetLoadingProvider>
    </BrowserRouter>
  </StrictMode>,
);

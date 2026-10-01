// Local emulator-only entry, excluded from production by .vercelignore and Vite's entry points.
import { auth, db } from '../src/lib/firebase';
import { connectAuthEmulator, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { connectFirestoreEmulator, doc, getDoc } from 'firebase/firestore';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CareProvider, useCare } from '../src/lib/care/client';
import { usePetProfile } from '../src/hooks/usePetProfile';

if (location.hostname !== '127.0.0.1' || !import.meta.env.DEV) throw Error('Local testing only');
connectAuthEmulator(auth, 'http://127.0.0.1:9098', { disableWarnings: true });
connectFirestoreEmulator(db, '127.0.0.1', 8088);
(window as any).fixture = { auth, db, signInWithEmailAndPassword, signOut, doc, getDoc };
function Probe() {
  const care = useCare();
  const profile = usePetProfile();
  (window as any).careProbe = care;
  (window as any).profileProbe = profile;
  return <div>Local reliability probe</div>;
}
if (new URLSearchParams(location.search).has('probe')) {
  createRoot(document.getElementById('root')!).render(<BrowserRouter><CareProvider><Probe /></CareProvider></BrowserRouter>);
} else {
  history.replaceState(null, '', '/');
  await import('../src/main');
}

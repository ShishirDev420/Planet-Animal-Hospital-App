import { initializeApp, FirebaseApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';
import { getFirestore, enableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

let app: FirebaseApp;

try {
  app = initializeApp(firebaseConfig);
  console.log('[Firebase] Initialized for project:', firebaseConfig.projectId);
} catch (err) {
  console.error('[Firebase] FATAL: Failed to initialize Firebase app.', err);
  throw err;
}

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

export const authPersistenceReady = setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error('[Firebase] Failed to enable local auth persistence:', err);
});

export async function checkFirebaseClientSetup(): Promise<{ authInitialized: boolean; firestoreNetworkEnabled: boolean }> {
  const results = { authInitialized: false, firestoreNetworkEnabled: false };

  try {
    await (auth as any).authStateReady();
    results.authInitialized = true;
    console.log('[Firebase] Auth state initialized.');
  } catch (e) {
    console.error('[Firebase] Auth state could not initialize:', e);
  }

  try {
    await enableNetwork(db);
    results.firestoreNetworkEnabled = true;
    console.log('[Firebase] Firestore network enabled; server reachability is unverified.');
  } catch (e) {
    console.error('[Firebase] Firestore network could not be enabled:', e);
  }

  return results;
}

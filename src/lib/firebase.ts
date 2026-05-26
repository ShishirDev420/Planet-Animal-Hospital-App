import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
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

export async function checkFirebaseHealth(): Promise<{ auth: boolean; firestore: boolean }> {
  const results = { auth: false, firestore: false };

  try {
    await (auth as any).authStateReady();
    results.auth = true;
    console.log('[Firebase Health] Auth reachable.');
  } catch (e) {
    console.error('[Firebase Health] Auth unreachable:', e);
  }

  try {
    await enableNetwork(db);
    results.firestore = true;
    console.log('[Firebase Health] Firestore reachable.');
  } catch (e) {
    console.error('[Firebase Health] Firestore unreachable:', e);
  }

  return results;
}
